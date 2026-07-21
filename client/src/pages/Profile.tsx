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
import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { Spinner } from "@/components/ui/spinner";
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
import { normalizeCenters, normalizeChannels } from "@/lib/bodygraph-data";
import { StaticSignaturePanel } from "./StaticReading";
import {
  buildProfileGraphNodes,
  buildProfileStats,
  formatProfileDate,
  getProfileDisplayName,
  getStableConduitId,
  type ProfileConsoleGraphNode,
} from "./profile-console-model";
import "../pages/arcana.css";
import "./profile.css";
import "./profile-cockpit.css";

type PrimeStackEntry = {
  codonName?: string;
  codon?: string | number;
  center?: string;
};
type ProfileTab = "overview" | "signature" | "history" | "settings";
const TABS: Array<{ id: ProfileTab; code: string; label: string }> = [
  { id: "overview", code: "01", label: "Overview" },
  { id: "signature", code: "02", label: "Signature" },
  { id: "history", code: "03", label: "Field History" },
  { id: "settings", code: "04", label: "Settings" },
];
const POS = [
  { x: 15, y: 19 },
  { x: 50, y: 10 },
  { x: 85, y: 19 },
  { x: 15, y: 81 },
  { x: 50, y: 90 },
  { x: 85, y: 81 },
] as const;

function readTab(): ProfileTab {
  if (typeof window === "undefined") return "overview";
  const p = new URLSearchParams(location.search);
  const s = p.get("section");
  if (s === "signature" || s === "history" || s === "settings") return s;
  if (p.get("tab") === "resonance" || location.hash === "#static-signature")
    return "signature";
  return "overview";
}
function coherenceLabel(score: number | null) {
  if (score === null)
    return { label: "UNRESOLVED", state: "AWAITING COORDINATE" };
  if (score >= 80) return { label: "ALIGNED", state: "RESONANCE" };
  if (score >= 40) return { label: "DRIFTED", state: "FLUX" };
  return { label: "FRAGMENTED", state: "ENTROPY" };
}
function birthCoordinate(p: {
  birthDate?: string | null;
  birthTime?: string | null;
  birthCity?: string | null;
  birthCountry?: string | null;
}) {
  if (!p.birthDate) return null;
  return [
    [p.birthDate, p.birthTime].filter(Boolean).join(" · "),
    [p.birthCity, p.birthCountry].filter(Boolean).join(", "),
  ]
    .filter(Boolean)
    .join(" · ");
}
function humanize(v?: string | null) {
  return v
    ? v
        .replace(/^tx[-_:]?/i, "")
        .replace(/[-_]+/g, " ")
        .replace(/\b\w/g, l => l.toUpperCase())
    : "Awaiting transmission";
}
function Empty({ children = "Awaiting signal" }: { children?: string }) {
  return <span className="profile-layer__empty">{children}</span>;
}
function Section({
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
      <header className="profile-section__head">
        <span className="arkana-card__code">{code}</span>
        <h2 className="profile-section__title">{title}</h2>
      </header>
      {children}
    </section>
  );
}
function Rows({ rows }: { rows: Array<{ label: string; value: ReactNode }> }) {
  return (
    <dl className="profile-rows">
      {rows.map(r => (
        <div className="profile-row" key={r.label}>
          <dt>{r.label}</dt>
          <dd>{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}
function Graph({
  nodes,
  receiver,
}: {
  nodes: ProfileConsoleGraphNode[];
  receiver: string;
}) {
  return (
    <div
      className="profile-graph"
      role="group"
      aria-label="Receiver interaction map"
    >
      <svg
        className="profile-graph__lines"
        viewBox="0 0 1000 500"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M500 250 L150 95 M500 250 L500 50 M500 250 L850 95 M500 250 L150 405 M500 250 L500 450 M500 250 L850 405" />
        <circle cx="500" cy="250" r="124" />
      </svg>
      <div className="profile-graph__receiver">
        <span>RECEIVER</span>
        <strong>{receiver}</strong>
        <i>◇</i>
      </div>
      <ul className="profile-graph__nodes">
        {nodes.map((n, i) => {
          const p = POS[i] ?? POS[0];
          return (
            <li
              key={n.id}
              className={`profile-graph__node profile-graph__node--${n.tone}`}
              style={
                {
                  "--graph-x": `${p.x}%`,
                  "--graph-y": `${p.y}%`,
                } as CSSProperties
              }
            >
              <span>{n.label}</span>
              <strong>{n.value}</strong>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function Profile() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<ProfileTab>(readTab);
  const sigil = trpc.codex.getProfileSigil.useQuery(undefined, {
    retry: false,
  });
  const staticQ = trpc.profile.getStaticProfile.useQuery(undefined, {
    retry: false,
  });
  const resonanceQ = trpc.profile.getCurrentResonance.useQuery(undefined, {
    retry: false,
  });
  const summaryQ = trpc.profile.getProfileConsoleSummary.useQuery(undefined, {
    retry: false,
  });
  useEffect(() => {
    if (!loading && !isAuthenticated) setLocation("/");
  }, [isAuthenticated, loading, setLocation]);
  useEffect(() => {
    const sync = () => setTab(readTab());
    addEventListener("popstate", sync);
    addEventListener("hashchange", sync);
    return () => {
      removeEventListener("popstate", sync);
      removeEventListener("hashchange", sync);
    };
  }, []);
  useEffect(() => {
    if (tab === "overview") return;
    const p = new URLSearchParams(location.search);
    if (p.get("section") === tab) return;
    p.set("section", tab);
    history.replaceState(null, "", `/profile?${p}`);
  }, [tab]);
  const sp = staticQ.data;
  const centers = useMemo(
    () => normalizeCenters(sp?.ninecenters),
    [sp?.ninecenters]
  );
  const channels = useMemo(() => {
    const d = normalizeChannels(sp?.channelStatuses);
    return d.length
      ? d
      : normalizeChannels(
          (
            sp?.coreCodonEngine as
              | { lattice?: { channelStatuses?: unknown } }
              | undefined
          )?.lattice?.channelStatuses
        );
  }, [sp?.channelStatuses, sp?.coreCodonEngine]);
  if (loading)
    return (
      <Layout>
        <div className="profile-loading">
          <Spinner size={24} label="Initializing conduit" />
          <span>INITIALIZING CONDUIT...</span>
        </div>
      </Layout>
    );
  if (!isAuthenticated || !user) return null;
  const summary = summaryQ.data ?? null;
  const name = getProfileDisplayName(user);
  const conduit = getStableConduitId(user);
  const vrcType =
    summary?.identity.vrcType || sp?.vrcType || sigil.data?.vrcType || null;
  const authority =
    summary?.identity.vrcAuthority ||
    sp?.vrcAuthority ||
    sp?.authorityNode ||
    sigil.data?.vrcAuthority ||
    null;
  const fractal =
    summary?.identity.fractalRole ||
    sp?.fractalRole ||
    sigil.data?.fractalRole ||
    null;
  const stack = Array.isArray(sp?.primeStack)
    ? (sp.primeStack as PrimeStackEntry[])
    : [];
  const prime = stack[0];
  const score =
    typeof resonanceQ.data?.carrierlock?.coherenceScore === "number"
      ? resonanceQ.data.carrierlock.coherenceScore
      : null;
  const coherence = coherenceLabel(score);
  const hasSignature = Boolean(sp || summary?.identity.hasStaticSignature);
  const coordinate =
    summary?.identity.birthCoordinate || (sp ? birthCoordinate(sp) : null);
  const defined = centers.filter(c => c.defined).length;
  const role = summary?.identity.resonanceRole || "Receiver";
  const stats = buildProfileStats(summary);
  const graph = buildProfileGraphNodes(summary);
  const select = (next: ProfileTab) => {
    setTab(next);
    const p = new URLSearchParams(location.search);
    next === "overview" ? p.delete("section") : p.set("section", next);
    if (next !== "signature") p.delete("tab");
    history.replaceState(null, "", `/profile${p.toString() ? `?${p}` : ""}`);
    scrollTo({ top: 0, behavior: "smooth" });
  };
  const copy = () => {
    navigator.clipboard?.writeText(conduit).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const recent = summary?.recent;
  return (
    <Layout overlayHeader>
      <SignalPageShell
        chamber="transmissions"
        className="arkana-layer profile-layer"
      >
        <div
          className="arkana-layer__inner profile-cockpit"
          aria-labelledby="profile-title"
        >
          <header className="profile-cockpit__hero">
            <div className="profile-cockpit__seal" aria-hidden="true">
              <svg viewBox="0 0 180 180">
                <circle cx="90" cy="90" r="76" />
                <circle cx="90" cy="90" r="52" />
                <path d="M90 18V162M18 90H162M38 38L142 142M142 38L38 142" />
                <path
                  className="profile-cockpit__seal-core"
                  d="M90 51L126 90L90 129L54 90Z"
                />
                <circle
                  className="profile-cockpit__seal-dot"
                  cx="90"
                  cy="90"
                  r="7"
                />
              </svg>
              <span>
                {hasSignature ? "SIGNATURE ANCHORED" : "COORDINATE OPEN"}
              </span>
            </div>
            <div className="profile-cockpit__identity">
              <div className="arkana-layer__kicker">
                RECEIVER CONSOLE · NETWORK {summary ? "LIVE" : "SYNCING"}
              </div>
              <div id="profile-title">
                <DecodedTitle
                  as="h1"
                  text={role}
                  className="profile-cockpit__role"
                />
              </div>
              <p className="profile-cockpit__name">{name}</p>
              <p className="arkana-layer__subtitle">
                {hasSignature
                  ? `Your anchored field on the ORIEL network — ${defined} of 8 VTRS centers defined.`
                  : "Complete your coordinate to anchor the static signature."}
              </p>
              <button className="profile-layer__conduit" onClick={copy}>
                {copied ? <CheckCircle size={13} /> : <Copy size={13} />}{" "}
                {copied ? "Copied" : conduit}
              </button>
            </div>
            <dl className="profile-cockpit__status">
              <div>
                <dt>Receiver Level</dt>
                <dd>
                  <strong>L{summary?.receiverLevel.level ?? 1}</strong>
                  <span>{summary?.receiverLevel.title ?? "First Contact"}</span>
                </dd>
                <span className="profile-layer__levelbar">
                  <i
                    style={{
                      width: `${summary?.receiverLevel.progressPercent ?? 0}%`,
                    }}
                  />
                </span>
              </div>
              <div>
                <dt>Current Coherence</dt>
                <dd>
                  <strong>{score ?? "—"}</strong>
                  <span>{coherence.label}</span>
                </dd>
              </div>
              <div>
                <dt>Node State</dt>
                <dd>
                  <strong className="profile-cockpit__live-dot">●</strong>
                  <span>{coherence.state}</span>
                </dd>
              </div>
            </dl>
          </header>
          <section className="profile-layer__stats">
            {stats.map(s => (
              <div className="profile-layer__stat" key={s.label} title={s.note}>
                <span className="profile-layer__stat-value">{s.value}</span>
                <span className="profile-layer__stat-label">{s.label}</span>
              </div>
            ))}
          </section>
          <nav
            className="profile-tabs"
            role="tablist"
            aria-label="Profile console"
          >
            {TABS.map(t => (
              <button
                key={t.id}
                id={`profile-tab-${t.id}`}
                role="tab"
                aria-selected={tab === t.id}
                className={tab === t.id ? "is-active" : undefined}
                onClick={() => select(t.id)}
              >
                <span>{t.code}</span>
                {t.label}
              </button>
            ))}
          </nav>
          <div
            className="profile-tab-panel"
            role="tabpanel"
            aria-labelledby={`profile-tab-${tab}`}
          >
            {tab === "overview" && (
              <div className="profile-overview">
                <div className="profile-overview__grid">
                  <section className="profile-layer__body-field">
                    <div className="profile-card__head">
                      <span>LIVE BODY MAP</span>
                      <strong>{defined} / 8 CENTERS DEFINED</strong>
                    </div>
                    <MatrixGridBackground />
                    <ResonanceBody
                      centers={centers.length ? centers : undefined}
                      channels={channels.length ? channels : undefined}
                      nodeStyle="icon"
                      showHud={false}
                      embedded
                    />
                  </section>
                  <div className="profile-overview__identity">
                    <Section code="01" title="Identity Field">
                      <Rows
                        rows={[
                          { label: "Resonance Role", value: role },
                          {
                            label: "Fractal Role",
                            value: fractal || <Empty />,
                          },
                          { label: "VRC Type", value: vrcType || <Empty /> },
                          { label: "Authority", value: authority || <Empty /> },
                          {
                            label: "Birth Coordinate",
                            value: coordinate ?? <Empty />,
                          },
                          {
                            label: "Prime Codon",
                            value: prime
                              ? `${prime.codonName || "Unnamed"} · Codon ${prime.codon ?? "?"}`
                              : summary?.identity.primeCodonName || <Empty />,
                          },
                          {
                            label: "Current Resonance",
                            value:
                              score !== null ? (
                                `${score} · ${coherence.label}`
                              ) : (
                                <Empty />
                              ),
                          },
                        ]}
                      />
                      <div className="profile-layer__actions">
                        <SignalButton href="/signal/check">
                          RUN SIGNAL CHECK
                        </SignalButton>
                        {!hasSignature ? (
                          <SignalButton
                            href="/complete-profile"
                            variant="secondary"
                          >
                            GENERATE SIGNATURE
                          </SignalButton>
                        ) : (
                          <button
                            className="profile-inline-action"
                            onClick={() => select("signature")}
                          >
                            OPEN SIGNATURE →
                          </button>
                        )}
                      </div>
                    </Section>
                  </div>
                </div>
                <Section code="02" title="Interaction Lattice">
                  <p className="profile-section__lede">
                    Every count is drawn from your receiver history. The map
                    shows where this node has made contact with the wider ORIEL
                    field.
                  </p>
                  <Graph nodes={graph} receiver={name} />
                </Section>
              </div>
            )}
            {tab === "signature" && (
              <div className="profile-signature-panel">
                <Section code="02" title="Static Signature Reading">
                  <div className="profile-panel__intro">
                    <p className="arkana-layer__subtitle profile-layer__signature-lede">
                      Exact birth ephemeris, Prime Stack, 8 VTRS centers, 32
                      resonance links, and the 512-node codon field — with
                      Current Resonance inside the same instrument.
                    </p>
                    <SignalButton href="/bio-architecture">
                      OPEN UNIVERSAL ARCHITECTURE
                    </SignalButton>
                  </div>
                  <StaticSignaturePanel embedded />
                </Section>
              </div>
            )}
            {tab === "history" && (
              <div className="profile-history">
                <Section code="03" title="Field History">
                  <p className="profile-section__lede">
                    The latest verified contact in each channel. Empty channels
                    stay quiet until a real event exists.
                  </p>
                  <nav className="profile-history__grid">
                    <a href="/conduit" className="profile-history__card">
                      <MessageCircle size={17} />
                      <span className="profile-history__code">
                        ORIEL CONTACT
                      </span>
                      <strong>
                        {recent?.latestConversation?.title ||
                          "Awaiting conversation"}
                      </strong>
                      <p>Last direct exchange with the ORIEL conduit.</p>
                      <span className="profile-history__meta">
                        {formatProfileDate(
                          recent?.latestConversation?.updatedAt ||
                            recent?.lastOrielContact
                        )}
                      </span>
                      <i>↗</i>
                    </a>
                    <a href="/signal/check" className="profile-history__card">
                      <Radio size={17} />
                      <span className="profile-history__code">
                        SIGNAL READING
                      </span>
                      <strong>
                        {recent?.latestReading?.flaggedCodons ||
                          "Awaiting reading"}
                      </strong>
                      <p>
                        {recent?.latestReading?.microCorrection ||
                          "No micro-correction has been recorded yet."}
                      </p>
                      <span className="profile-history__meta">
                        {formatProfileDate(recent?.latestReading?.createdAt)}
                      </span>
                      <i>↗</i>
                    </a>
                    <a href="/archive" className="profile-history__card">
                      <ScrollText size={17} />
                      <span className="profile-history__code">
                        TRANSMISSION
                      </span>
                      <strong>
                        {humanize(recent?.latestTransmission?.eventKey)}
                      </strong>
                      <p>
                        {recent?.latestTransmission
                          ? `${recent.latestTransmission.rarity} · meaning level ${recent.latestTransmission.meaningLevel} · ${recent.latestTransmission.status}`
                          : "No transmission has entered this receiver history yet."}
                      </p>
                      <span className="profile-history__meta">
                        {formatProfileDate(
                          recent?.latestTransmission?.createdAt
                        )}
                      </span>
                      <i>↗</i>
                    </a>
                  </nav>
                </Section>
              </div>
            )}
            {tab === "settings" && (
              <div className="profile-settings">
                <Section code="04" title="Account Security">
                  <p className="profile-section__lede">
                    Update the password attached to this receiver. Your current
                    password is required before the credential can change.
                  </p>
                  <ChangePasswordForm />
                </Section>
              </div>
            )}
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
  const [busy, setBusy] = useState(false);
  const mutation = trpc.auth.changePassword.useMutation();
  const submit = async (e: React.FormEvent) => {
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
    setBusy(true);
    try {
      await mutation.mutateAsync({
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
      setBusy(false);
    }
  };
  return (
    <form onSubmit={submit} className="space-y-3 max-w-md">
      {[
        ["current-pass", "Current Password", current, setCurrent],
        ["new-pass", "New Password", next, setNext],
        ["confirm-pass", "Confirm New Password", confirm, setConfirm],
      ].map(([id, label, value, setter]) => (
        <div key={id as string}>
          <Label
            htmlFor={id as string}
            className="text-xs font-mono uppercase tracking-widest text-[#6a665e]"
          >
            {label as string}
          </Label>
          <Input
            id={id as string}
            type="password"
            value={value as string}
            onChange={e =>
              (setter as React.Dispatch<React.SetStateAction<string>>)(
                e.target.value
              )
            }
            className="mt-1 bg-black/40 border-[#bda36b]/30 text-[#e8e4dc]"
            required
          />
        </div>
      ))}
      {error && <p className="text-sm text-red-400 font-mono">{error}</p>}
      {success && <p className="text-sm text-[#44a866] font-mono">{success}</p>}
      <Button
        type="submit"
        disabled={busy}
        className="mt-2 bg-[#bda36b]/10 border border-[#bda36b]/50 text-[#bda36b] font-mono hover:bg-[#bda36b]/20"
      >
        {busy ? "CHANGING..." : "CHANGE PASSWORD"}
      </Button>
    </form>
  );
}
