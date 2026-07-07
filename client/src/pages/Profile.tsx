import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import {
  CheckCircle,
  Copy,
  MessageCircle,
  Radio,
  ScrollText,
  Sparkles,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useEffect, useState, type ReactNode } from "react";
import Layout from "@/components/Layout";
import {
  SignalPageShell,
  GlowCard,
  SignalButton,
} from "@/components/oriel-signal/OrielSignalDesign";
import { SacredGeometryField } from "@/components/oriel-signal/SacredGeometryField";
import {
  buildProfileGraphNodes,
  buildProfileStats,
  formatProfileDate,
  getProfileDisplayName,
  getStableConduitId,
} from "./profile-console-model";
import "@/components/oriel-signal/oriel-signal.css";

const SIGNATURE_DETAIL_HREF = "/signature";

type PrimeStackEntry = {
  codonName?: string;
  codon?: string | number;
  center?: string;
};

function coherenceLabel(score: number | null) {
  if (score === null)
    return { label: "UNRESOLVED", state: "AWAITING COORDINATE" };
  if (score >= 80) return { label: "ALIGNED", state: "RESONANCE" };
  if (score >= 40) return { label: "DRIFTED", state: "FLUX" };
  return { label: "FRAGMENTED", state: "ENTROPY" };
}

function birthCoordinateFromProfile(profile: {
  birthDate?: string | null;
  birthTime?: string | null;
  birthCity?: string | null;
  birthCountry?: string | null;
}) {
  if (!profile.birthDate) return null;
  const dateTime = [profile.birthDate, profile.birthTime]
    .filter(Boolean)
    .join(" · ");
  const place = [profile.birthCity, profile.birthCountry]
    .filter(Boolean)
    .join(", ");
  return [dateTime, place].filter(Boolean).join(" · ");
}

function EmptyValue({ children = "Awaiting signal" }: { children?: string }) {
  return <span className="profile-console__empty">{children}</span>;
}

function ProfileConsoleCard({
  eyebrow,
  title,
  children,
  className = "",
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <GlowCard tone="gold" className={`profile-console-card ${className}`}>
      <span className="fi-dossier__edge" aria-hidden="true" />
      <div className="signal-card-meta">
        <span>{eyebrow}</span>
        <span>PROFILE</span>
      </div>
      <h3>{title}</h3>
      {children}
    </GlowCard>
  );
}

function ProfileStatStrip({
  stats,
}: {
  stats: ReturnType<typeof buildProfileStats>;
}) {
  return (
    <section
      className="profile-console-stats"
      aria-label="Profile activity totals"
    >
      {stats.map(stat => (
        <GlowCard key={stat.label} tone="silver" className="profile-console-stat">
          <span className="profile-console-stat__value">{stat.value}</span>
          <span className="profile-console-stat__label">{stat.label}</span>
          <span className="profile-console-stat__note">{stat.note}</span>
        </GlowCard>
      ))}
    </section>
  );
}

function ProfileInteractionGraph({
  nodes,
}: {
  nodes: ReturnType<typeof buildProfileGraphNodes>;
}) {
  return (
    <ProfileConsoleCard eyebrow="GRAPH-01" title="Interaction Graph">
      <div
        className="profile-console-graph"
        aria-label="Profile interaction graph"
      >
        <div className="profile-console-graph__lines" aria-hidden="true" />
        {nodes.map(node => (
          <div
            key={node.id}
            className={`profile-console-graph__node profile-console-graph__node--${node.tone}`}
          >
            <span>{node.label}</span>
            <strong>{node.value}</strong>
          </div>
        ))}
      </div>
    </ProfileConsoleCard>
  );
}

export default function Profile() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [copied, setCopied] = useState(false);

  const sigilQuery = trpc.codex.getProfileSigil.useQuery(undefined, {
    retry: false,
  });
  const staticProfileQuery = trpc.profile.getStaticProfile.useQuery(undefined, {
    retry: false,
  });
  const currentResonanceQuery = trpc.profile.getCurrentResonance.useQuery(
    undefined,
    { retry: false }
  );
  const summaryQuery = trpc.profile.getProfileConsoleSummary.useQuery(
    undefined,
    { retry: false }
  );

  useEffect(() => {
    if (!loading && !isAuthenticated) setLocation("/");
  }, [isAuthenticated, loading, setLocation]);

  if (loading) {
    return (
      <Layout>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <Spinner size={24} label="Initializing conduit" />
          <div
            style={{
              fontFamily: "var(--font-ritual)",
              fontSize: 10,
              color: "var(--oriel-dim)",
              letterSpacing: "0.2em",
            }}
          >
            INITIALIZING CONDUIT...
          </div>
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated || !user) return null;

  const displayName = getProfileDisplayName(user);
  const conduitId = getStableConduitId(user);
  const sp = staticProfileQuery.data;
  const summary = summaryQuery.data ?? null;
  const vrcType =
    summary?.identity.vrcType || sp?.vrcType || sigilQuery.data?.vrcType || null;
  const vrcAuthority =
    summary?.identity.vrcAuthority ||
    sp?.vrcAuthority ||
    sp?.authorityNode ||
    sigilQuery.data?.vrcAuthority ||
    null;
  const fractalRole =
    summary?.identity.fractalRole ||
    sp?.fractalRole ||
    sigilQuery.data?.fractalRole ||
    null;
  const primeStack = Array.isArray(sp?.primeStack)
    ? (sp.primeStack as PrimeStackEntry[])
    : [];
  const prime = primeStack[0];
  const coherenceScore =
    typeof currentResonanceQuery.data?.carrierlock?.coherenceScore === "number"
      ? currentResonanceQuery.data.carrierlock.coherenceScore
      : null;
  const coherence = coherenceLabel(coherenceScore);
  const hasSignature = Boolean(sp || summary?.identity.hasStaticSignature);
  const birthCoordinate =
    summary?.identity.birthCoordinate || (sp ? birthCoordinateFromProfile(sp) : null);

  const handleCopy = () => {
    navigator.clipboard?.writeText(conduitId).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Layout overlayHeader>
      <SignalPageShell chamber="receiver-node" className="fi-home profile-console">
        <SacredGeometryField />

        <main className="profile-console__inner" aria-labelledby="profile-title">
          <section className="profile-console-header">
            <div className="profile-console-header__seal" aria-hidden="true">
              <div className="archive-seal profile-console-seal">
                <span className="archive-seal__ring" />
                <span className="archive-seal__axis archive-seal__axis--vertical" />
                <span className="archive-seal__axis archive-seal__axis--horizontal" />
                <strong>{displayName.slice(0, 1).toUpperCase()}</strong>
                <em>Receiver</em>
              </div>
            </div>

            <div className="profile-console-header__identity">
              <p className="profile-console__kicker">
                <span className="fi-hero__pulse" aria-hidden="true" />
                PROFILE CONSOLE // {coherence.label}
              </p>
              <h1 id="profile-title">{displayName}</h1>
              <button
                type="button"
                onClick={handleCopy}
                aria-label="Copy conduit ID"
                className="profile-console-copy"
              >
                {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
                <span>{copied ? "Copied" : conduitId}</span>
              </button>
            </div>

            <div className="profile-console-header__level">
              <span>Receiver Level</span>
              <strong>
                {summary ? `L${summary.receiverLevel.level}` : "L1"}
              </strong>
              <em>{summary?.receiverLevel.title ?? "First Contact"}</em>
              <div className="profile-console-levelbar" aria-hidden="true">
                <span
                  style={{
                    width: `${summary?.receiverLevel.progressPercent ?? 0}%`,
                  }}
                />
              </div>
              <p>
                Level rises through readings, transmissions, and contact with
                ORIEL.
              </p>
            </div>
          </section>

          <ProfileStatStrip stats={buildProfileStats(summary)} />

          <section className="profile-console-grid">
            <ProfileConsoleCard eyebrow="ID-01" title="Identity Field">
              <dl className="profile-console-list">
                <div>
                  <dt>Resonance Role</dt>
                  <dd>
                    {summary?.identity.resonanceRole ?? (
                      <EmptyValue>Awaiting role</EmptyValue>
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Fractal Role</dt>
                  <dd>{fractalRole || <EmptyValue />}</dd>
                </div>
                <div>
                  <dt>VRC Type</dt>
                  <dd>{vrcType || <EmptyValue />}</dd>
                </div>
                <div>
                  <dt>Authority</dt>
                  <dd>{vrcAuthority || <EmptyValue />}</dd>
                </div>
                <div>
                  <dt>Prime Codon</dt>
                  <dd>
                    {prime
                      ? `${prime.codonName || "Unnamed"} · Codon ${
                          prime.codon ?? "?"
                        }`
                      : summary?.identity.primeCodonName || <EmptyValue />}
                  </dd>
                </div>
                <div>
                  <dt>Current Resonance</dt>
                  <dd>
                    {coherenceScore !== null ? (
                      `${coherenceScore} · ${coherence.label}`
                    ) : (
                      <EmptyValue />
                    )}
                  </dd>
                </div>
              </dl>
            </ProfileConsoleCard>

            <ProfileInteractionGraph nodes={buildProfileGraphNodes(summary)} />

            <ProfileConsoleCard eyebrow="REC-01" title="Recent Field">
              <div className="profile-console-feed">
                <a href="/conduit">
                  <MessageCircle size={16} />
                  <span>
                    <strong>Latest ORIEL contact</strong>
                    {formatProfileDate(summary?.recent.lastOrielContact)}
                  </span>
                </a>
                <a href="/signal/check">
                  <Radio size={16} />
                  <span>
                    <strong>Latest reading</strong>
                    {formatProfileDate(summary?.recent.latestReading?.createdAt)}
                  </span>
                </a>
                <a href="/archive">
                  <ScrollText size={16} />
                  <span>
                    <strong>Latest transmission</strong>
                    {formatProfileDate(
                      summary?.recent.latestTransmission?.createdAt
                    )}
                  </span>
                </a>
                <a href={SIGNATURE_DETAIL_HREF}>
                  <Sparkles size={16} />
                  <span>
                    <strong>Static Signature</strong>
                    {hasSignature ? "Anchored" : "Awaiting coordinate"}
                  </span>
                </a>
              </div>
            </ProfileConsoleCard>

            <ProfileConsoleCard eyebrow="SIG-01" title="Static Signature Summary">
              {hasSignature ? (
                <>
                  <dl className="profile-console-list">
                    <div>
                      <dt>Birth Coordinate</dt>
                      <dd>
                        {birthCoordinate ?? <EmptyValue />}
                      </dd>
                    </div>
                    <div>
                      <dt>Signature Status</dt>
                      <dd>Anchored</dd>
                    </div>
                    <div>
                      <dt>Prime Center</dt>
                      <dd>
                        {prime?.center ??
                          summary?.identity.primeCenter ?? <EmptyValue />}
                      </dd>
                    </div>
                  </dl>
                  <div className="profile-console-actions">
                    <SignalButton href={SIGNATURE_DETAIL_HREF}>
                      VIEW FULL SIGNATURE
                    </SignalButton>
                    <SignalButton href="/signal/check" variant="secondary">
                      RUN SIGNAL CHECK
                    </SignalButton>
                  </div>
                </>
              ) : (
                <>
                  <p className="profile-console-card__copy">
                    Static Signature awaiting coordinate.
                  </p>
                  <div className="profile-console-actions">
                    <SignalButton href="/static-signature" variant="secondary">
                      GENERATE
                    </SignalButton>
                  </div>
                </>
              )}
            </ProfileConsoleCard>
          </section>
        </main>
      </SignalPageShell>
    </Layout>
  );
}
