import VossArchiveShell from "@/components/VossArchiveShell";
import { useState, useEffect, useMemo } from "react";
import { Spinner } from "@/components/ui/spinner";
import { trpc } from "@/lib/trpc";
import { OracleCard } from "@/components/OracleCard";
import { usePersonalResonance } from "@/hooks/usePersonalResonance";
import { parseLinkedCodons, parseOracleHashtags } from "@/lib/oracle-utils";

import { TransmissionCarrier } from "@/components/archive/TransmissionCarrier";
import { RegisterSpectrum } from "@/components/archive/RegisterSpectrum";
import { LedgerRow } from "@/components/archive/LedgerRow";
import { SignalRow } from "@/components/archive/SignalRow";
import { VTIP_REGISTERS } from "@/components/archive/registers";
import { useScramble } from "@/components/archive/use-scramble";
import "@/components/archive/transmissions.css";

// ═════════════════════════════════════════════════════════════════════
// TRANSMISSIONS
//
// One standing carrier, then the register, then the ledger.
// The archive is an instrument panel over an ancient record — see
// docs/VISUAL_LAW.md. Nothing here generates imagery; the geometry is
// drawn in SVG and the emblem is the recovered mark already in repo.
// ═════════════════════════════════════════════════════════════════════

export default function Archive() {
  const [activeRegister, setActiveRegister] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState<"tx" | "ox" | "signal">(
    "tx"
  );
  // A past signal chosen from the log; null means the carrier shows today.
  const [selectedSignalId, setSelectedSignalId] = useState<number | null>(
    null
  );
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const { hasResonance } = usePersonalResonance();

  // ── Data ────────────────────────────────────────────────────────
  const { data: rawTx = [], isLoading: txLoading } =
    trpc.archive.transmissions.list.useQuery();
  const { data: rawOx = [], isLoading: oxLoading } =
    trpc.archive.oracles.list.useQuery();
  const { data: threads = [] } = trpc.archive.oracles.threads.useQuery();
  // Refetched so a page left open across UTC midnight, or opened before
  // the day's signal was generated, picks it up without a reload.
  const { data: todaysSignal = null } =
    trpc.archive.dailySignal.today.useQuery(undefined, {
      refetchInterval: 5 * 60 * 1000,
    });
  const { data: signals = [], isLoading: signalsLoading } =
    trpc.archive.dailySignal.list.useQuery(undefined, {
      refetchInterval: 5 * 60 * 1000,
    });

  // ── Parse transmissions ─────────────────────────────────────────
  const transmissions = useMemo(
    () =>
      rawTx
        .map((tx: any) => {
          let tags: string[] = [];
          if (Array.isArray(tx.tags)) {
            tags = tx.tags;
          } else if (typeof tx.tags === "string") {
            try {
              tags = JSON.parse(tx.tags);
            } catch {
              tags = tx.tags
                .split(",")
                .map((t: string) => t.trim())
                .filter(Boolean);
            }
          }
          return { ...tx, tags };
        })
        .sort((a: any, b: any) => a.txNumber - b.txNumber),
    [rawTx]
  );

  // ── Parse oracles ───────────────────────────────────────────────
  const oracles = useMemo(
    () =>
      rawOx.map((ox: any) => ({
        ...ox,
        hashtags: parseOracleHashtags(ox.hashtags),
        parsedLinkedCodons: parseLinkedCodons(ox.linkedCodons),
      })),
    [rawOx]
  );

  const getOracleShellStyle = (linkedCodons: string[]) => {
    const isPersonal = hasResonance(linkedCodons);
    if (!isPersonal) return {};

    return {
      borderLeft: "2px solid #d8b56d",
      paddingLeft: 12,
      borderRadius: 2,
      boxShadow:
        "0 0 20px rgba(216,181,109,0.12), inset 0 0 15px rgba(216,181,109,0.04)",
    };
  };

  // Rising Signals — oracles with resonanceCount >= 5
  const risingSignals = useMemo(
    () =>
      oracles
        .filter((ox: any) => (ox.resonanceCount || 0) >= 5)
        .sort(
          (a: any, b: any) => (b.resonanceCount || 0) - (a.resonanceCount || 0)
        )
        .slice(0, 3),
    [oracles]
  );

  // ── Register load (VTIP) ────────────────────────────────────────
  const registerCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    VTIP_REGISTERS.forEach(r => (counts[r.id] = 0));
    transmissions.forEach((tx: any) => {
      const reg = VTIP_REGISTERS.find(
        r =>
          r.id !== "all" &&
          tx.txNumber >= r.range[0] &&
          tx.txNumber <= r.range[1]
      );
      if (reg) counts[reg.id]++;
    });
    counts.all = transmissions.length;
    return counts;
  }, [transmissions]);

  // ── Filter transmissions ────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = transmissions;
    if (activeRegister !== "all") {
      const reg = VTIP_REGISTERS.find(r => r.id === activeRegister);
      if (reg)
        result = result.filter(
          (tx: any) =>
            tx.txNumber >= reg.range[0] && tx.txNumber <= reg.range[1]
        );
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (tx: any) =>
          tx.title.toLowerCase().includes(q) ||
          tx.coreMessage.toLowerCase().includes(q) ||
          tx.field.toLowerCase().includes(q)
      );
    }
    return result;
  }, [transmissions, activeRegister, searchQuery]);

  // ── Filter oracles ──────────────────────────────────────────────
  const filteredOracles = useMemo(() => {
    let result = oracles;
    if (activeThread) {
      result = result
        .filter((ox: any) => ox.threadId === activeThread)
        .sort((a: any, b: any) => (a.threadOrder || 0) - (b.threadOrder || 0));
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (ox: any) =>
          ox.title.toLowerCase().includes(q) ||
          ox.content.toLowerCase().includes(q)
      );
    }
    return result;
  }, [oracles, searchQuery, activeThread]);

  // ── Filter daily signals ────────────────────────────────────────
  const filteredSignals = useMemo(() => {
    if (!searchQuery) return signals;
    const q = searchQuery.toLowerCase();
    return signals.filter(
      (s: any) =>
        s.title.toLowerCase().includes(q) ||
        s.field.toLowerCase().includes(q) ||
        s.signalDate.includes(q)
    );
  }, [signals, searchQuery]);

  const selectedSignal =
    selectedSignalId == null
      ? null
      : (signals.find((s: any) => s.id === selectedSignalId) ?? null);

  // The standing carrier — a signal chosen from the log, else today's open
  // signal, else the deepest transmission recovered so far.
  const carrier: any =
    selectedSignal ??
    todaysSignal ??
    (transmissions.length ? transmissions[transmissions.length - 1] : null);

  const seatSignal = (id: number) => {
    setSelectedSignalId(id === todaysSignal?.id ? null : id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const activeRegisterInfo = VTIP_REGISTERS.find(r => r.id === activeRegister);
  const ledgerLabel =
    activeSection === "signal"
      ? "DAILY SIGNAL LOG"
      : activeRegister === "all"
        ? "RECOVERED TRANSMISSIONS"
        : `REGISTER ${activeRegisterInfo?.vtip} · ${activeRegisterInfo?.name}`;
  const scrambledLabel = useScramble(ledgerLabel, activeRegister, 260);

  // ── Ambient field log ───────────────────────────────────────────
  const [ambientIndex, setAmbientIndex] = useState(0);
  useEffect(() => {
    if (transmissions.length === 0) return;
    const id = setInterval(() => {
      setAmbientIndex(i => (i + 1) % transmissions.length);
    }, 6000);
    return () => clearInterval(id);
  }, [transmissions.length]);
  const ambientTx = transmissions[ambientIndex] as any | undefined;

  return (
    <VossArchiveShell>
      <div className="tx">
        {/* ── The standing carrier ──────────────────────────────── */}
        {carrier && (
          <TransmissionCarrier
            key={carrier.txGenId ?? carrier.txId ?? carrier.id}
            tx={carrier}
            total={transmissions.length}
          />
        )}

        {/* ── Register spectrum ─────────────────────────────────── */}
        <section className="tx-section">
          <div className="tx-section__head">
            <h2 className="tx-section__title">Phase register · VTIP</h2>
            <span className="tx-section__count">
              Tetradic indexing · saturation at four
            </span>
          </div>
          <RegisterSpectrum
            counts={registerCounts}
            active={activeRegister}
            onSelect={setActiveRegister}
          />
        </section>

        {/* ── Streams + scan ────────────────────────────────────── */}
        <section className="tx-section">
          <div className="tx-section__head">
            <h2 className="tx-section__title">// {scrambledLabel}</h2>
            <span className="tx-section__count">
              {activeSection === "tx"
                ? `${filtered.length} held`
                : activeSection === "ox"
                  ? `${filteredOracles.length} held`
                  : `${filteredSignals.length} received`}
            </span>
          </div>

          <div className="tx-streams">
            <button
              type="button"
              className={`tx-stream ${activeSection === "tx" ? "is-active" : ""}`}
              onClick={() => setActiveSection("tx")}
            >
              TX · Field transmissions ({filtered.length})
            </button>
            <button
              type="button"
              className={`tx-stream tx-stream--oracle ${
                activeSection === "ox" ? "is-active" : ""
              }`}
              onClick={() => setActiveSection("ox")}
            >
              ΩX · Oracle fragments ({filteredOracles.length})
            </button>
            <button
              type="button"
              className={`tx-stream ${activeSection === "signal" ? "is-active" : ""}`}
              onClick={() => setActiveSection("signal")}
            >
              TX-GEN · Daily signals ({filteredSignals.length})
            </button>

            <div className="tx-scan">
              <input
                type="text"
                className="tx-scan__input"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="SCAN ARCHIVE NODE…"
                aria-label="Scan the archive"
              />
            </div>
          </div>

          {/* ── Daily signal log ────────────────────────────────── */}
          {activeSection === "signal" ? (
            signalsLoading ? (
              <div className="tx-state">
                <Spinner size={20} label="Loading daily signals" />
              </div>
            ) : filteredSignals.length === 0 ? (
              <div className="tx-state">
                <p className="tx-state__line">No daily signal received</p>
                <p className="tx-state__sub">
                  The open register writes once a day.
                </p>
              </div>
            ) : (
              <div className="tx-ledger">
                {filteredSignals.map((s: any) => (
                  <SignalRow
                    key={s.id}
                    signal={s}
                    active={carrier?.id === s.id && "bodyLines" in carrier}
                    onSelect={() => seatSignal(s.id)}
                  />
                ))}
              </div>
            )
          ) : /* ── TX ledger ─────────────────────────────────────── */
          activeSection === "tx" ? (
            txLoading ? (
              <div className="tx-state">
                <Spinner
                  className="mx-auto mb-3"
                  size={20}
                  label="Loading transmissions"
                />
                <p className="tx-state__line">Scanning frequencies…</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="tx-state">
                <p className="tx-state__line">
                  No transmission fragment detected
                </p>
                <p className="tx-state__sub">
                  Adjust register or scan the full spectrum.
                </p>
              </div>
            ) : (
              <div className="tx-ledger">
                {filtered.map((tx: any) => (
                  <LedgerRow key={tx.id} tx={tx} />
                ))}
              </div>
            )
          ) : oxLoading ? (
            <div className="tx-state">
              <Spinner size={20} label="Loading oracles" />
            </div>
          ) : filteredOracles.length === 0 ? (
            <div className="tx-state">
              <p className="tx-state__line">No temporal signals</p>
            </div>
          ) : (
            <>
              {/* Thread filter */}
              {threads.length > 0 && (
                <div className="tx-streams" style={{ paddingTop: 22 }}>
                  <button
                    type="button"
                    className={`tx-stream ${!activeThread ? "is-active" : ""}`}
                    onClick={() => setActiveThread(null)}
                  >
                    All threads
                  </button>
                  {(threads as any[]).map((t: any) => (
                    <button
                      key={t.threadId}
                      type="button"
                      className={`tx-stream ${
                        activeThread === t.threadId ? "is-active" : ""
                      }`}
                      onClick={() => setActiveThread(t.threadId)}
                    >
                      {t.threadTitle} ({t.count})
                    </button>
                  ))}
                </div>
              )}

              {/* Selected archive markers */}
              {risingSignals.length > 0 && !activeThread && (
                <div style={{ paddingTop: 26 }}>
                  <div className="tx-section__count" style={{ marginBottom: 14 }}>
                    Selected archive markers
                  </div>
                  <div
                    className="flex gap-4 overflow-x-auto pb-2"
                    style={{ scrollbarWidth: "none" }}
                  >
                    {risingSignals.map((ox: any) => (
                      <div
                        key={ox.id}
                        className="flex-shrink-0"
                        style={{
                          width: 300,
                          border: "1px solid rgba(216,181,109,0.15)",
                          borderRadius: 2,
                          boxSizing: "border-box",
                          ...getOracleShellStyle(ox.parsedLinkedCodons),
                        }}
                      >
                        <OracleCard
                          id={ox.id}
                          oracleId={ox.oracleId}
                          oxNumber={ox.oracleNumber}
                          title={ox.title}
                          field={ox.field}
                          temporalDirection={ox.part}
                          content={ox.content}
                          imageUrl={ox.imageUrl}
                          youtubeUrl={ox.youtubeUrl}
                          hashtags={ox.hashtags}
                          status={ox.status}
                          resonanceCount={ox.resonanceCount}
                          linkedCodons={ox.parsedLinkedCodons}
                          threadId={ox.threadId}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Oracle grid */}
              <div className="tx-oracle-grid">
                {filteredOracles.map((ox: any) => (
                  <div
                    key={ox.id}
                    style={{
                      boxSizing: "border-box",
                      ...getOracleShellStyle(ox.parsedLinkedCodons),
                    }}
                  >
                    <OracleCard
                      id={ox.id}
                      oracleId={ox.oracleId}
                      oxNumber={ox.oracleNumber}
                      title={ox.title}
                      field={ox.field}
                      temporalDirection={ox.part}
                      content={ox.content}
                      imageUrl={ox.imageUrl}
                      youtubeUrl={ox.youtubeUrl}
                      hashtags={ox.hashtags}
                      status={ox.status}
                      resonanceCount={ox.resonanceCount}
                      linkedCodons={ox.parsedLinkedCodons}
                      threadId={ox.threadId}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        {/* ── Field log ─────────────────────────────────────────── */}
        {ambientTx && activeSection === "tx" && (
          <div className="tx-fieldlog">
            <div className="tx-fieldlog__label">
              Field log · TX-{String(ambientTx.txNumber).padStart(3, "0")}
            </div>
            <p className="tx-fieldlog__quote">
              &ldquo;{ambientTx.coreMessage}&rdquo;
            </p>
            <div className="tx-fieldlog__seal">The field remembers</div>
          </div>
        )}
      </div>
    </VossArchiveShell>
  );
}
