import { useMemo, useState } from "react";
import Layout from "@/components/Layout";
import {
  SignalButton,
  SignalPageShell,
} from "@/components/oriel-signal/OrielSignalDesign";
import { SacredGeometryField } from "@/components/oriel-signal/SacredGeometryField";
import { useAuth } from "@/_core/hooks/useAuth";
import { useReceiverState } from "@/hooks/useReceiverState";
import { trpc } from "@/lib/trpc";
import {
  calculateSignalScore,
  getMicroCorrection,
  getSignalResult,
  type SignalResult,
} from "@shared/carrierlock-signal";

const C = {
  deep: "#0f0f15",
  surface: "rgba(20,20,28,0.72)",
  border: "rgba(189,163,107,0.14)",
  gold: "#bda36b",
  amber: "#f6b05e",
  txt: "#e8e4dc",
  txtS: "#9a968e",
  txtD: "#6a665e",
};

function SliderField({
  label,
  description,
  leftLabel,
  rightLabel,
  value,
  onChange,
}: {
  label: string;
  description: string;
  leftLabel: string;
  rightLabel: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="signal-check__field">
      <span className="signal-check__field-head">
        <span>
          <b>{label}</b>
          <small>{description}</small>
        </span>
        <strong>{value}/10</strong>
      </span>
      <input
        type="range"
        min={0}
        max={10}
        step={1}
        value={value}
        onChange={event => onChange(Number(event.target.value))}
      />
      <span className="signal-check__range-labels">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </span>
    </label>
  );
}

type SliSummary = {
  primaryCodon: string;
  primarySli: number;
  flaggedCodons: string[];
  engineMicroCorrection?: string | null;
};

function ResultPanel({
  result,
  score,
  hasSignature,
  showMicroCorrection,
  onShowMicroCorrection,
  microCorrection,
  sliSummary,
}: {
  result: SignalResult;
  score: number;
  hasSignature: boolean;
  showMicroCorrection: boolean;
  onShowMicroCorrection: () => void;
  microCorrection: string;
  sliSummary: SliSummary | null;
}) {
  return (
    <section className="signal-check__result" aria-live="polite">
      <div className="signal-check__score">
        <span>{score}</span>
        <small>COHERENCE SCORE</small>
      </div>
      <div>
        <p className="signal-check__result-label">{result.label}</p>
        <p className="signal-check__result-message">{result.message}</p>

        {sliSummary && (
          <div className="signal-check__micro signal-check__sli">
            <span>// shadow loudness index</span>
            <p>
              Primary interference:{" "}
              <strong>
                {sliSummary.primaryCodon} · SLI{" "}
                {sliSummary.primarySli.toFixed(1)}
              </strong>
            </p>
            {sliSummary.flaggedCodons.length > 1 && (
              <p>
                Flagged codons: {sliSummary.flaggedCodons.join(", ")}
              </p>
            )}
            {sliSummary.engineMicroCorrection && (
              <p>{sliSummary.engineMicroCorrection}</p>
            )}
            <div className="signal-check__actions">
              <SignalButton href="/signature?tab=resonance">
                Open Current Resonance
              </SignalButton>
            </div>
          </div>
        )}

        {result.label === "FRAGMENTED" && (
          <div className="signal-check__actions">
            <SignalButton href="/signal/grounding">
              Stabilize First
            </SignalButton>
            <SignalButton href="/" variant="secondary">
              Return to Field Archive
            </SignalButton>
          </div>
        )}

        {result.label === "DRIFTED" && (
          <>
            <div className="signal-check__actions">
              <button
                className="signal-check__button"
                type="button"
                onClick={onShowMicroCorrection}
              >
                Apply Micro-Correction
              </button>
              <SignalButton href="/" variant="secondary">
                Continue to Archive
              </SignalButton>
            </div>
            {showMicroCorrection && (
              <div className="signal-check__micro">
                <span>// micro-correction</span>
                <p>{microCorrection}</p>
              </div>
            )}
          </>
        )}

        {result.label === "ALIGNED" && (
          <div className="signal-check__actions">
            <SignalButton
              href={hasSignature ? "/signature" : "/complete-profile"}
            >
              Open The Signature
            </SignalButton>
            <SignalButton href="/" variant="secondary">
              Enter Field Archive
            </SignalButton>
            <SignalButton
              href="/founder-signature-blueprint"
              variant="secondary"
            >
              The Founder-Curated Bio-Signature
            </SignalButton>
          </div>
        )}
      </div>
    </section>
  );
}

export default function SignalCheck() {
  const { user } = useAuth();
  const receiver = useReceiverState();
  const [mentalNoise, setMentalNoise] = useState(5);
  const [bodyTension, setBodyTension] = useState(5);
  const [emotionalTide, setEmotionalTide] = useState(5);
  const [breathCompleted, setBreathCompleted] = useState(false);
  const [resultScore, setResultScore] = useState<number | null>(null);
  const [showMicroCorrection, setShowMicroCorrection] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [sliSummary, setSliSummary] = useState<SliSummary | null>(null);

  const saveCarrierlockMutation = trpc.codex.saveCarrierlock.useMutation();
  const dynamicStateMutation = trpc.rgp.dynamicState.useMutation();
  const saveReadingMutation = trpc.codex.saveReading.useMutation();

  const liveScore = useMemo(
    () =>
      calculateSignalScore({
        mentalNoise,
        bodyTension,
        emotionalTide,
        breathCompleted,
      }),
    [bodyTension, breathCompleted, emotionalTide, mentalNoise]
  );

  const result = resultScore === null ? null : getSignalResult(resultScore);
  const microCorrection = getMicroCorrection({
    mentalNoise,
    bodyTension,
    emotionalTide,
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const score = liveScore;
    setResultScore(score);
    setShowMicroCorrection(false);
    setSaveNotice(null);
    setSliSummary(null);

    if (!receiver.isAuthed) {
      setSaveNotice(
        "Anonymous signal read locally. Enter the archive to preserve future Carrierlock states."
      );
      return;
    }

    try {
      const carrierlockResult = await saveCarrierlockMutation.mutateAsync({
        mentalNoise,
        bodyTension,
        emotionalTurbulence: emotionalTide,
        breathCompletion: breathCompleted,
      });

      if (receiver.hasSignature && user?.id) {
        const dynamic = await dynamicStateMutation.mutateAsync({
          mentalNoise,
          bodyTension,
          emotionalTurbulence: emotionalTide,
          breathCompletion: breathCompleted ? 1 : 0,
          birthDate: new Date().toISOString(),
          userId: String(user.id),
        });

        if (dynamic.success && dynamic.data) {
          const data = dynamic.data;
          const readingText = [
            `ORIEL Dynamic Reading — ${data.coherenceScore}/100 — ${data.coherenceLabel}`,
            "",
            data.orielTransmission,
          ].join("\n");

          const correctionFacet =
            data.correctionFacet &&
            ["A", "B", "C", "D"].includes(data.correctionFacet)
              ? (data.correctionFacet as "A" | "B" | "C" | "D")
              : undefined;

          await saveReadingMutation.mutateAsync({
            carrierlockId: carrierlockResult.id,
            readingText,
            flaggedCodons: data.flaggedCodons ?? [],
            sliScores: data.sliScores ?? {},
            activeFacets: data.activeFacets ?? {},
            confidenceLevels: data.confidenceLevels ?? {},
            microCorrection: data.microCorrection,
            correctionFacet,
            falsifier: data.falsifier ?? "",
          });

          const primaryCodon = data.flaggedCodons?.[0] ?? "—";
          const scoreEntries =
            data.sliScores && typeof data.sliScores === "object"
              ? Object.entries(data.sliScores as Record<string, number>)
              : [];
          const primaryEntry =
            scoreEntries.find(
              ([key]) =>
                key === primaryCodon ||
                key.endsWith(`:${primaryCodon}`) ||
                key.endsWith(primaryCodon)
            ) ?? scoreEntries.sort((a, b) => b[1] - a[1])[0];
          const primarySli = primaryEntry ? Number(primaryEntry[1]) : 0;

          setSliSummary({
            primaryCodon,
            primarySli: Number.isFinite(primarySli) ? primarySli : 0,
            flaggedCodons: data.flaggedCodons ?? [],
            engineMicroCorrection: data.microCorrection,
          });

          setSaveNotice(
            "Carrierlock preserved. SLI diagnostic recorded against your Static Signature."
          );
        } else if (
          (dynamic as { requiresStaticProfile?: boolean }).requiresStaticProfile
        ) {
          setSaveNotice(
            "Carrierlock preserved. Complete your natal profile to unlock SLI diagnostics."
          );
        } else {
          setSaveNotice(
            "Latest Carrierlock state preserved inside this receiver node."
          );
        }
      } else {
        setSaveNotice(
          receiver.hasSignature
            ? "Latest Carrierlock state preserved inside this receiver node."
            : "Carrierlock preserved. Complete your Static Signature to unlock SLI diagnostics."
        );
      }
    } catch {
      setSaveNotice(
        "Signal state calculated. Persistence did not complete on this pass."
      );
    }
  };

  return (
    <Layout>
      <SignalPageShell chamber="gate" className="signal-check">
        <SacredGeometryField static />
        <style>{`
          .signal-check {
            min-height: 100vh;
            padding: clamp(7rem, 12vw, 9rem) 1.5rem 6rem;
          }

          .signal-check__wrap {
            width: min(980px, 100%);
            margin: 0 auto;
            position: relative;
            z-index: 1;
          }

          .signal-check__kicker,
          .signal-check__clarifier,
          .signal-check__result-label,
          .signal-check__field b,
          .signal-check__field small,
          .signal-check__range-labels,
          .signal-check__notice,
          .signal-check__micro span,
          .signal-check__button {
            font-family: var(--font-ritual);
            text-transform: uppercase;
            letter-spacing: 0.18em;
          }

          .signal-check__kicker {
            margin: 0 0 0.9rem;
            color: rgba(246, 176, 94, 0.68);
            font-size: 0.62rem;
          }

          .signal-check h1 {
            margin: 0;
            color: ${C.txt};
            font-family: var(--font-display);
            font-size: clamp(3rem, 8vw, 6.6rem);
            font-weight: 400;
            line-height: 0.92;
            letter-spacing: 0.12em;
          }

          .signal-check__subheading {
            max-width: 680px;
            margin: 1.35rem 0 0;
            color: rgba(232, 228, 220, 0.74);
            font-family: var(--font-voice);
            font-style: italic;
            font-size: clamp(1.08rem, 2vw, 1.45rem);
            line-height: 1.65;
          }

          .signal-check__clarifier {
            margin: 0.8rem 0 2.2rem;
            color: ${C.txtD};
            font-size: 0.62rem;
          }

          .signal-check__panel,
          .signal-check__result {
            border: 1px solid ${C.border};
            background:
              radial-gradient(circle at 88% 12%, rgba(246, 176, 94, 0.07), transparent 20rem),
              ${C.surface};
            box-shadow: 0 26px 90px rgba(0, 0, 0, 0.28);
          }

          .signal-check__panel {
            padding: clamp(1.25rem, 3vw, 2rem);
          }

          .signal-check__grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
          }

          .signal-check__field {
            display: block;
            border: 1px solid rgba(189, 163, 107, 0.1);
            padding: 1rem;
            background: rgba(8, 8, 12, 0.38);
          }

          .signal-check__field-head {
            display: flex;
            justify-content: space-between;
            gap: 1rem;
            margin-bottom: 0.85rem;
          }

          .signal-check__field b {
            display: block;
            color: ${C.txt};
            font-size: 0.68rem;
          }

          .signal-check__field small {
            display: block;
            margin-top: 0.35rem;
            color: ${C.txtD};
            font-size: 0.54rem;
            line-height: 1.6;
          }

          .signal-check__field strong {
            color: ${C.amber};
            font-family: var(--font-ritual);
            font-size: 0.8rem;
            font-weight: 400;
          }

          .signal-check input[type="range"] {
            width: 100%;
            accent-color: ${C.gold};
          }

          .signal-check__range-labels {
            display: flex;
            justify-content: space-between;
            margin-top: 0.55rem;
            color: ${C.txtD};
            font-size: 0.52rem;
          }

          .signal-check__breath {
            display: flex;
            align-items: flex-start;
            gap: 0.8rem;
            margin: 1rem 0 0;
            border: 1px solid rgba(189, 163, 107, 0.1);
            padding: 1rem;
            background: rgba(8, 8, 12, 0.38);
          }

          .signal-check__breath input {
            width: 1.05rem;
            height: 1.05rem;
            margin-top: 0.15rem;
            accent-color: ${C.gold};
          }

          .signal-check__breath b {
            display: block;
            color: ${C.txt};
            font-family: var(--font-ritual);
            font-size: 0.72rem;
            letter-spacing: 0.16em;
            text-transform: uppercase;
          }

          .signal-check__breath span {
            display: block;
            margin-top: 0.4rem;
            color: ${C.txtD};
            font-family: var(--font-ritual);
            font-size: 0.58rem;
            letter-spacing: 0.14em;
            line-height: 1.6;
            text-transform: uppercase;
          }

          .signal-check__submit {
            margin-top: 1.25rem;
            display: flex;
            align-items: center;
            gap: 1rem;
            flex-wrap: wrap;
          }

          .signal-check__button {
            min-height: 3.05rem;
            padding: 0.9rem 1.2rem;
            border: 1px solid rgba(246, 176, 94, 0.38);
            background: rgba(246, 176, 94, 0.06);
            color: ${C.amber};
            cursor: pointer;
            font-size: 0.66rem;
          }

          .signal-check__notice {
            color: ${C.txtD};
            font-size: 0.56rem;
            line-height: 1.6;
          }

          .signal-check__result {
            display: grid;
            grid-template-columns: 170px 1fr;
            gap: 1.4rem;
            margin-top: 1.2rem;
            padding: clamp(1.25rem, 3vw, 2rem);
          }

          .signal-check__score {
            display: grid;
            place-items: center;
            min-height: 150px;
            border: 1px solid rgba(246, 176, 94, 0.18);
            color: ${C.amber};
          }

          .signal-check__score span {
            font-family: var(--font-display);
            font-size: 4rem;
            line-height: 1;
          }

          .signal-check__score small {
            color: ${C.txtD};
            font-family: var(--font-ritual);
            font-size: 0.52rem;
            letter-spacing: 0.18em;
          }

          .signal-check__result-label {
            margin: 0 0 0.55rem;
            color: ${C.amber};
            font-size: 0.72rem;
          }

          .signal-check__result-message,
          .signal-check__micro p {
            margin: 0;
            color: rgba(232, 228, 220, 0.72);
            font-family: var(--font-voice);
            font-style: italic;
            font-size: 1.08rem;
            line-height: 1.7;
          }

          .signal-check__actions {
            display: flex;
            gap: 0.75rem;
            flex-wrap: wrap;
            margin-top: 1.25rem;
          }

          .signal-check__micro {
            margin-top: 1rem;
            border-left: 1px solid rgba(246, 176, 94, 0.34);
            padding: 0.9rem 1rem;
            background: rgba(246, 176, 94, 0.035);
          }

          .signal-check__micro span {
            display: block;
            margin-bottom: 0.45rem;
            color: ${C.gold};
            font-size: 0.54rem;
          }

          @media (max-width: 760px) {
            .signal-check__grid,
            .signal-check__result {
              grid-template-columns: 1fr;
            }

            .signal-check__actions .signal-button,
            .signal-check__button {
              width: 100%;
            }
          }
        `}</style>

        <main className="signal-check__wrap">
          <p className="signal-check__kicker">// Carrierlock Calibration</p>
          <h1>CHECK YOUR SIGNAL</h1>
          <p className="signal-check__subheading">
            Before you enter the archive, the system reads your current
            coherence.
          </p>
          <p className="signal-check__clarifier">
            This is not your full identity. This is your present signal state.
          </p>

          <form className="signal-check__panel" onSubmit={handleSubmit}>
            <div className="signal-check__grid">
              <SliderField
                label="Mental Noise"
                description="How loud is the mind right now?"
                leftLabel="Quiet"
                rightLabel="Overloaded"
                value={mentalNoise}
                onChange={setMentalNoise}
              />
              <SliderField
                label="Body Tension"
                description="How contracted or tense is the body?"
                leftLabel="Open"
                rightLabel="Clamped"
                value={bodyTension}
                onChange={setBodyTension}
              />
              <SliderField
                label="Emotional Tide"
                description="How unstable or intense is the emotional field?"
                leftLabel="Still"
                rightLabel="Turbulent"
                value={emotionalTide}
                onChange={setEmotionalTide}
              />
            </div>

            <label className="signal-check__breath">
              <input
                type="checkbox"
                checked={breathCompleted}
                onChange={event => setBreathCompleted(event.target.checked)}
              />
              <span>
                <b>I completed the breath pattern.</b>
                <span>Six slow breaths in approximately one minute.</span>
              </span>
            </label>

            <div className="signal-check__submit">
              <button className="signal-check__button" type="submit">
                Calculate Signal State
              </button>
              <span className="signal-check__notice">
                Live score: {liveScore}/100
              </span>
              {(saveCarrierlockMutation.isPending ||
                dynamicStateMutation.isPending ||
                saveReadingMutation.isPending) && (
                <span className="signal-check__notice">
                  Preserving Carrierlock state...
                </span>
              )}
            </div>
            {saveNotice && <p className="signal-check__notice">{saveNotice}</p>}
          </form>

          {result && (
            <ResultPanel
              result={result}
              score={resultScore ?? liveScore}
              hasSignature={receiver.hasSignature}
              showMicroCorrection={showMicroCorrection}
              onShowMicroCorrection={() => setShowMicroCorrection(true)}
              microCorrection={microCorrection}
              sliSummary={sliSummary}
            />
          )}
        </main>
      </SignalPageShell>
    </Layout>
  );
}
