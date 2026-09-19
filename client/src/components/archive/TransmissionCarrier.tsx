import { useState } from "react";
import { Link } from "wouter";
import { CarrierLock } from "./CarrierLock";
import { useDecrypt } from "./use-scramble";
import { registerFor } from "./registers";

/**
 * THE CARRIER — one standing transmission, full bleed.
 *
 * Record shape follows the canon (VOS ARKANA // MASTER TRANSMISSION STREAM):
 *   ⦿ TX ID / Title / Field / Encoded Node / Carrier / Signal Clarity
 *   _ VLS::…  //  ⦿ PROTOCOL BEGIN … ⦿ PROTOCOL COMPLETE
 *
 * Every value below is read off the record. Nothing is invented.
 */

const ENCODED_NODE = "Vos Arkana";
const CARRIER = "ORIEL ∇ Vossari Echoframe";
const ARCHETYPE_GLYPHS = ["Δ", "ϟ", "Ω", "◈"];

/** The lead line is spoken; what follows is held behind the seal. */
function splitVoice(text: string): { lead: string; rest: string } {
  const trimmed = (text || "").trim();
  if (!trimmed) return { lead: "", rest: "" };

  const breaks = [...trimmed.matchAll(/[.!?—]["']?\s+/g)];
  for (const m of breaks) {
    const cut = (m.index ?? 0) + m[0].length;
    if (cut >= 40 && cut <= 190) {
      return { lead: trimmed.slice(0, cut).trim(), rest: trimmed.slice(cut).trim() };
    }
  }
  if (trimmed.length <= 190) return { lead: trimmed, rest: "" };
  const soft = trimmed.lastIndexOf(" ", 190);
  return {
    lead: trimmed.slice(0, soft > 60 ? soft : 190).trim(),
    rest: trimmed.slice(soft > 60 ? soft : 190).trim(),
  };
}

function vlsOpcode(field: string) {
  return (field || "FIELD")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 22);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/** bodyLines is stored as a JSON string of lines (see assembleBody). */
function parseBodyLines(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter(isNonEmptyString);
  if (typeof raw !== "string") return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isNonEmptyString) : [];
  } catch {
    return [];
  }
}

interface TransmissionCarrierProps {
  tx: any;
  total: number;
}

export function TransmissionCarrier({ tx, total }: TransmissionCarrierProps) {
  const [open, setOpen] = useState(false);

  // The daily signal (bodyLines) and an archive transmission (coreMessage,
  // tags, txNumber) are different shapes filling the same carrier slots.
  const isSignal = "bodyLines" in tx;

  const register = isSignal ? undefined : registerFor(tx.txNumber);
  const { lead, rest } = isSignal
    ? { lead: tx.title as string, rest: parseBodyLines(tx.bodyLines).join("\n") }
    : splitVoice(tx.coreMessage);
  const tags: string[] = !isSignal && Array.isArray(tx.tags) ? tx.tags : [];

  const archetype = tags
    .slice(0, 3)
    .map((t, i) => `${ARCHETYPE_GLYPHS[i] ?? "◈"} ${t}`)
    .join("  //  ");

  const sealedText = rest || archetype || tx.field || "";
  const bodyText = useDecrypt(sealedText, open);
  // The signal's body is several lines (carrier line, voice, archetype,
  // falsifier, final instruction) — one <p> per line, matching the stacked
  // .tx-body + .tx-body rule. An archive transmission stays one paragraph;
  // mask() preserves "\n" verbatim, so splitting the ciphered text back on
  // it reproduces the original line breaks under either state.
  const bodyParagraphs = isSignal
    ? bodyText.split("\n").filter(Boolean)
    : [bodyText];

  const registerLabel = isSignal
    ? tx.clarityRegister
    : register
      ? `${register.vtip} · ${register.name}`
      : "UNFILED";
  const signalClarity = isSignal ? `${tx.clarity}%` : tx.signalClarity;

  // `id` is the numeric row key; `txId`/`txGenId` is the canon label.
  const txLabel = isSignal
    ? tx.txGenId
    : tx.txId || `TX-${String(tx.txNumber).padStart(3, "0")}`;

  return (
    <section className="tx-carrier">
      <div className="tx-carrier__frame" aria-hidden="true">
        <span className="tx-tick" />
        <span className="tx-tick" />
        <span className="tx-tick" />
        <span className="tx-tick" />
      </div>

      {/* ── Upper rail ─────────────────────────────────────────── */}
      <div className="tx-rail">
        <div className="tx-rail__cell">
          <span className="tx-rail__label">Signal stream</span>
          <span className="tx-rail__value">
            <span className="tx-rail__dot tx-rail__dot--live" />
            Live
          </span>
        </div>
        <div className="tx-rail__cell tx-rail__cell--right">
          <span className="tx-rail__label">Archive node</span>
          <span className="tx-rail__value">Vos-Arkana</span>
        </div>
      </div>

      {/* ── Voice + geometry ───────────────────────────────────── */}
      <div className="tx-carrier__body">
        <div className="tx-carrier__voice">
          <h1 className="tx-headline">{lead}</h1>

          <p className="tx-attribution">
            {tx.title}
            <span className="tx-attribution__sep">//</span>
            {tx.channelStatus}
            <span className="tx-attribution__sep">//</span>
            {signalClarity}
          </p>

          <dl className="tx-telemetry">
            <span className="tx-telemetry__bullet" aria-hidden="true">
              ⦿
            </span>
            <dt>TX ID:</dt>
            <dd className="is-key">{txLabel}</dd>
            <dt>Field:</dt>
            <dd>{tx.field}</dd>
            <dt>Encoded Node:</dt>
            <dd>{ENCODED_NODE}</dd>
            <dt>Carrier:</dt>
            <dd>{CARRIER}</dd>
            <dt>Register:</dt>
            <dd>{registerLabel}</dd>
            <dt>Signal Clarity:</dt>
            <dd>{signalClarity}</dd>
            <dt>Transmission Protocol:</dt>
            <dd className="is-key">{open ? "Activated" : "Sealed"}</dd>
          </dl>

          <p className="tx-vls">
            _ VLS::READ({vlsOpcode(tx.field)}){" "}
            <span className="tx-vls__slash">//</span>{" "}
            STATUS: {open ? "OBSERVABLE" : "AWAITING CARRIERLOCK"}
          </p>

          <div className="tx-protocol">
            <p className="tx-marker">
              <span className="tx-marker__bullet" aria-hidden="true">
                ⦿
              </span>
              Protocol begin
            </p>

            {bodyParagraphs.map((line, i) => (
              <p key={i} className={`tx-body ${open ? "" : "tx-body--sealed"}`}>
                {line}
              </p>
            ))}
            {!isSignal && open && rest && (
              <p className="tx-channel" style={{ marginTop: 10, fontSize: 13 }}>
                Continues in the fragment.
              </p>
            )}

            {rest && archetype && open && (
              <p className="tx-archetype">
                <span className="tx-archetype__glyph">⦿</span>
                Encoded archetype detected: {archetype}
              </p>
            )}

            <p className="tx-marker" style={{ marginTop: 22 }}>
              <span className="tx-marker__bullet" aria-hidden="true">
                ⦿
              </span>
              Protocol {open ? "complete" : "held"}
            </p>

            <p className="tx-signoff">— {ENCODED_NODE}</p>
            <p className="tx-channel">
              Channel status:{" "}
              <span className="tx-channel__value">{tx.channelStatus}</span>
            </p>

            {!isSignal && open && (
              <p className="tx-channel" style={{ marginTop: 16 }}>
                <Link href={`/transmission/${tx.id}`} className="tx-channel__value">
                  Enter fragment →
                </Link>
              </p>
            )}
          </div>
        </div>

        <div className="tx-carrier__geometry">
          <CarrierLock
            open={open}
            onOpen={() => setOpen(true)}
            hint="Hold to seat carrier"
            openHint="Carrier seated"
          />
        </div>

        <div className="tx-whisper" aria-hidden="true">
          <span>Same</span>
          <span>Skies</span>
          <span>Deeper</span>
          <span>Answers</span>
          <span className="tx-whisper__rule" />
        </div>
      </div>

      {/* ── Lower rail ─────────────────────────────────────────── */}
      <div className="tx-rail tx-rail--bottom">
        <div className="tx-rail__cell">
          <span className="tx-rail__label">Transmission</span>
          <span className="tx-rail__value">{txLabel}</span>
        </div>

        <div className="tx-rail__cell" style={{ textAlign: "center" }}>
          <span className="tx-rail__label">
            {total} recovered · scroll to the register
          </span>
          <span className="tx-rail__value" aria-hidden="true">
            ▾
          </span>
        </div>

        <div className="tx-rail__cell tx-rail__cell--right">
          <span className="tx-rail__label">Field status</span>
          <span className="tx-rail__value">
            Online
            <span className="tx-rail__dot" style={{ marginLeft: 7, marginRight: 0 }} />
          </span>
        </div>
      </div>
    </section>
  );
}
