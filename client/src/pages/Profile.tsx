import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import {
  CheckCircle,
  Copy,
  MessageCircle,
  Radio,
  ScrollText,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Layout from "@/components/Layout";
import {
  SignalPageShell,
  SignalButton,
  DecodedTitle,
} from "@/components/oriel-signal/OrielSignalDesign";
import ResonanceBody from "@/components/oriel-signal/ResonanceBody";
import MatrixGridBackground from "@/components/oriel-signal/MatrixGridBackground";
import {
  normalizeCenters,
  normalizeChannels,
} from "@/lib/bodygraph-data";
import { StaticSignaturePanel } from "./StaticReading";
import {
  buildProfileStats,
  formatProfileDate,
  getProfileDisplayName,
  getStableConduitId,
} from "./profile-console-model";
import "../pages/arcana.css";
import "./profile.css";

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
  return <span className="profile-layer__empty">{children}</span>;
}

function ProfileSection({
  code,
  title,
  children,
}: {
  code: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="profile-section">
      <div className="profile-section__head">
        <span className="arkana-card__code">{code}</span>
        <h2 className="profile-section__title">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function ProfileRows({
  rows,
}: {
  rows: Array<{ label: string; value: ReactNode }>;
}) {
  return (
    <dl className="profile-rows">
      {rows.map(row => (
        <div key={row.label} className="profile-row">
          <dt>{row.label}</dt>
          <dd>{row.value}</dd>
        </div>
      ))}
    </dl>
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

  const sp = staticProfileQuery.data;
  const profileCenters = useMemo(
    () => normalizeCenters(sp?.ninecenters),
    [sp?.ninecenters]
  );
  const profileChannels = useMemo(() => {
    const direct = normalizeChannels(sp?.channelStatuses);
    if (direct.length > 0) return direct;
    return normalizeChannels(
      (
        sp?.coreCodonEngine as
          | { lattice?: { channelStatuses?: unknown } }
          | undefined
      )?.lattice?.channelStatuses
    );
  }, [sp?.channelStatuses, sp?.coreCodonEngine]);

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
  const definedCount = profileCenters.filter(center => center.defined).length;
  const stats = buildProfileStats(summary);

  const handleCopy = () => {
    navigator.clipboard?.writeText(conduitId).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const subtitle = hasSignature
    ? `Your anchored field on the ORIEL network — ${definedCount} of 8 VTRS centers defined.`
    : "Your receiver node on the ORIEL network. Complete your coordinate to anchor the static signature.";

  return (
    <Layout>
      <SignalPageShell chamber="transmissions" className="arkana-layer profile-layer">
        <div className="arkana-layer__inner" aria-labelledby="profile-title">
          <header id="profile-title" className="arkana-layer__head profile-layer__head">
            <div className="arkana-layer__kicker">
              RECEIVER NODE · {coherence.label}
            </div>
            <DecodedTitle
              as="h1"
              text={displayName}
              className="arkana-layer__title"
            />
            <p className="arkana-layer__subtitle">{subtitle}</p>
            <div className="profile-layer__meta">
              <span>
                Level{" "}
                <strong>
                  {summary ? `L${summary.receiverLevel.level}` : "L1"}
                </strong>
              </span>
              <span>{summary?.receiverLevel.title ?? "First Contact"}</span>
              {coherenceScore !== null ? (
                <span>
                  Coherence <strong>{coherenceScore}</strong>
                </span>
              ) : null}
              {hasSignature ? (
                <span>
                  Signature <strong>anchored</strong>
                </span>
              ) : null}
            </div>
            <div
              className="profile-layer__levelbar"
              aria-hidden="true"
              title="Receiver level progress"
            >
              <span
                style={{
                  width: `${summary?.receiverLevel.progressPercent ?? 0}%`,
                }}
              />
            </div>
            <button
              type="button"
              onClick={handleCopy}
              aria-label="Copy conduit ID"
              className="profile-layer__conduit"
            >
              {copied ? <CheckCircle size={13} /> : <Copy size={13} />}
              <span>{copied ? "Copied" : conduitId}</span>
            </button>
          </header>

          <section
            className="profile-layer__body-field"
            aria-label="VTRS resonance body"
          >
            <MatrixGridBackground />
            <ResonanceBody
              centers={profileCenters.length ? profileCenters : undefined}
              channels={profileChannels.length ? profileChannels : undefined}
              nodeStyle="icon"
              showHud={false}
              embedded
            />
          </section>

          <section className="profile-layer__stats" aria-label="Activity totals">
            {stats.map(stat => (
              <div key={stat.label} className="profile-layer__stat">
                <span className="profile-layer__stat-value">{stat.value}</span>
                <span className="profile-layer__stat-label">{stat.label}</span>
              </div>
            ))}
          </section>

          <div className="profile-layer__sections">
            <div className="profile-section__grid">
              <ProfileSection code="01" title="Identity Field">
                <ProfileRows
                  rows={[
                    {
                      label: "Resonance Role",
                      value:
                        summary?.identity.resonanceRole ?? (
                          <EmptyValue>Awaiting role</EmptyValue>
                        ),
                    },
                    {
                      label: "Fractal Role",
                      value: fractalRole || <EmptyValue />,
                    },
                    {
                      label: "VRC Type",
                      value: vrcType || <EmptyValue />,
                    },
                    {
                      label: "Authority",
                      value: vrcAuthority || <EmptyValue />,
                    },
                    {
                      label: "Birth Coordinate",
                      value: birthCoordinate ?? <EmptyValue />,
                    },
                    {
                      label: "Prime Codon",
                      value: prime
                        ? `${prime.codonName || "Unnamed"} · Codon ${prime.codon ?? "?"}`
                        : summary?.identity.primeCodonName || <EmptyValue />,
                    },
                    {
                      label: "Current Resonance",
                      value:
                        coherenceScore !== null ? (
                          `${coherenceScore} · ${coherence.label}`
                        ) : (
                          <EmptyValue />
                        ),
                    },
                  ]}
                />
              </ProfileSection>

              <ProfileSection code="02" title="Field Activity">
                <div className="profile-layer__actions">
                  <SignalButton href="/signal/check">RUN SIGNAL CHECK</SignalButton>
                  {!hasSignature ? (
                    <SignalButton href="/complete-profile" variant="secondary">
                      GENERATE SIGNATURE
                    </SignalButton>
                  ) : null}
                </div>
              </ProfileSection>
            </div>

            <ProfileSection code="03" title="Recent Field">
              <nav className="profile-feed" aria-label="Recent profile activity">
                <a href="/conduit" className="profile-feed__link">
                  <MessageCircle size={15} className="profile-feed__icon" />
                  <span>
                    <span className="profile-feed__label">Latest ORIEL contact</span>
                    <span className="profile-feed__meta">
                      {formatProfileDate(summary?.recent.lastOrielContact)}
                    </span>
                  </span>
                  <span className="profile-feed__arrow">→</span>
                </a>
                <a href="/signal/check" className="profile-feed__link">
                  <Radio size={15} className="profile-feed__icon" />
                  <span>
                    <span className="profile-feed__label">Latest reading</span>
                    <span className="profile-feed__meta">
                      {formatProfileDate(summary?.recent.latestReading?.createdAt)}
                    </span>
                  </span>
                  <span className="profile-feed__arrow">→</span>
                </a>
                <a href="/archive" className="profile-feed__link">
                  <ScrollText size={15} className="profile-feed__icon" />
                  <span>
                    <span className="profile-feed__label">Latest transmission</span>
                    <span className="profile-feed__meta">
                      {formatProfileDate(
                        summary?.recent.latestTransmission?.createdAt
                      )}
                    </span>
                  </span>
                  <span className="profile-feed__arrow">→</span>
                </a>
              </nav>
            </ProfileSection>

            <ProfileSection code="04" title="Static Signature Reading">
              <p className="arkana-layer__subtitle profile-layer__signature-lede">
                Exact birth ephemeris, Prime Stack, 8 VTRS centers, 32 resonance
                links, and the 512-node codon field — plus live Current Resonance
                when you need it.
              </p>

              {/* Cross-reference to Bio-Architecture: makes the general VTRS terminal
                  indispensable for understanding the personal data shown here. */}
              <div className="profile-layer__actions" style={{ marginBottom: "0.75rem" }}>
                <span
                  style={{
                    fontFamily: "var(--font-voice, 'Cormorant Garamond', Georgia, serif)",
                    fontSize: "14px",
                    color: "rgba(212, 207, 195, 0.78)",
                    maxWidth: "62ch",
                    display: "inline-block",
                    marginRight: "0.75rem",
                    verticalAlign: "middle",
                  }}
                >
                  This is your personal Bio-Architecture — the specific centers, links, and codons active in your field.
                  Explore the full interactive VTRS terminal.
                </span>
                <SignalButton href="/bio-architecture">OPEN BIO-ARCHITECTURE TERMINAL</SignalButton>
              </div>

              <StaticSignaturePanel embedded />
            </ProfileSection>

            {/* Concrete fix: Working password change for authenticated users */}
            <ProfileSection code="05" title="Account Security">
              <p className="arkana-layer__subtitle profile-layer__signature-lede">
                Change your password. Requires your current password for security.
              </p>

              <ChangePasswordForm />
            </ProfileSection>
          </div>
        </div>
      </SignalPageShell>
    </Layout>
  );
}

function ChangePasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const changePassword = trpc.auth.changePassword.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!current || next.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (next !== confirm) {
      setError("New passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await changePassword.mutateAsync({
        currentPassword: current,
        newPassword: next,
      });
      setSuccess("Password changed successfully.");
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (err: any) {
      setError(err?.message || "Failed to change password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 max-w-md">
      <div>
        <Label htmlFor="current-pass" className="text-xs font-mono uppercase tracking-widest text-[#6a665e]">Current Password</Label>
        <Input
          id="current-pass"
          type="password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          className="mt-1 bg-black/40 border-[#bda36b]/30 text-[#e8e4dc]"
          required
        />
      </div>
      <div>
        <Label htmlFor="new-pass" className="text-xs font-mono uppercase tracking-widest text-[#6a665e]">New Password</Label>
        <Input
          id="new-pass"
          type="password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          className="mt-1 bg-black/40 border-[#bda36b]/30 text-[#e8e4dc]"
          required
        />
      </div>
      <div>
        <Label htmlFor="confirm-pass" className="text-xs font-mono uppercase tracking-widest text-[#6a665e]">Confirm New Password</Label>
        <Input
          id="confirm-pass"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="mt-1 bg-black/40 border-[#bda36b]/30 text-[#e8e4dc]"
          required
        />
      </div>

      {error && <p className="text-sm text-red-400 font-mono">{error}</p>}
      {success && <p className="text-sm text-[#44a866] font-mono">{success}</p>}

      <Button
        type="submit"
        disabled={loading}
        className="mt-2 bg-[#bda36b]/10 border border-[#bda36b]/50 text-[#bda36b] font-mono hover:bg-[#bda36b]/20"
      >
        {loading ? "CHANGING..." : "CHANGE PASSWORD"}
      </Button>
      <p className="text-[10px] text-[#6a665e] font-mono">This updates your email+password login credentials.</p>
    </form>
  );
}