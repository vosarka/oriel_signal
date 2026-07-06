import Layout from "@/components/Layout";
import {
  SignalButton,
  SignalPageShell,
} from "@/components/oriel-signal/OrielSignalDesign";
import { SacredGeometryField } from "@/components/oriel-signal/SacredGeometryField";

export default function SignalGrounding() {
  return (
    <Layout>
      <SignalPageShell chamber="gate" className="signal-placeholder">
        <SacredGeometryField static />
        <style>{`
          .signal-placeholder {
            min-height: 100vh;
            padding: clamp(8rem, 13vw, 10rem) 1.5rem 6rem;
          }

          .signal-placeholder__wrap {
            position: relative;
            z-index: 1;
            width: min(760px, 100%);
            margin: 0 auto;
            border: 1px solid rgba(189, 163, 107, 0.14);
            background:
              radial-gradient(circle at 88% 12%, rgba(246, 176, 94, 0.07), transparent 20rem),
              rgba(20, 20, 28, 0.72);
            padding: clamp(1.4rem, 4vw, 2.4rem);
          }

          .signal-placeholder__kicker,
          .signal-placeholder__actions {
            font-family: var(--font-ritual);
            text-transform: uppercase;
            letter-spacing: 0.18em;
          }

          .signal-placeholder__kicker {
            margin: 0 0 0.9rem;
            color: rgba(246, 176, 94, 0.68);
            font-size: 0.62rem;
          }

          .signal-placeholder h1 {
            margin: 0;
            color: #e8e4dc;
            font-family: var(--font-display);
            font-size: clamp(2.4rem, 7vw, 5rem);
            font-weight: 400;
            letter-spacing: 0.12em;
          }

          .signal-placeholder p {
            max-width: 600px;
            color: rgba(232, 228, 220, 0.72);
            font-family: var(--font-voice);
            font-style: italic;
            font-size: 1.1rem;
            line-height: 1.7;
          }

          .signal-placeholder__actions {
            display: flex;
            gap: 0.75rem;
            flex-wrap: wrap;
            margin-top: 1.5rem;
          }
        `}</style>

        <main className="signal-placeholder__wrap">
          <p className="signal-placeholder__kicker">// stabilization protocol</p>
          <h1>GROUNDING FIELD</h1>
          <p>
            This chamber holds the receiver at the threshold. Let the field quiet
            before requesting deeper archive access.
          </p>
          <div className="signal-placeholder__actions">
            <SignalButton href="/signal/check">Back to Signal Check</SignalButton>
            <SignalButton href="/" variant="secondary">
              Return to Field Archive
            </SignalButton>
          </div>
        </main>
      </SignalPageShell>
    </Layout>
  );
}
