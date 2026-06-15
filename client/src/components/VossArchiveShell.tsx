import { type ReactNode } from "react";
import Layout from "./Layout";

interface VossArchiveShellProps {
  children: ReactNode;
}

export default function VossArchiveShell({ children }: VossArchiveShellProps) {
  return (
    <Layout>
      <style>{`
        .voss-archive-root {
          --voss-void: #050505;
          --voss-deep: #0a0907;
          --voss-panel: rgba(7, 7, 6, 0.76);
          --voss-panel-strong: rgba(5, 5, 5, 0.92);
          --voss-border: rgba(216, 181, 109, 0.22);
          --voss-border-soft: rgba(216, 181, 109, 0.12);
          --voss-gold: #d8b56d;
          --voss-gold-dim: rgba(216, 181, 109, 0.52);
          --voss-amber: #e4c88c;
          --voss-ivory: #fff7e6;
          --voss-text: #e8e4dc;
          --voss-text-soft: #9a968e;
          --voss-text-dim: #6a665e;
          min-height: 100vh;
          position: relative;
          isolation: isolate;
          /* Void + grain now come from the global SignalBackdrop; this shell
             only carries its foreground panel/type tokens. (Removed the old
             radial void, the 96px grid ::before, and the rgba(132,96,54)
             brown that violated VISUAL_LAW.) */
          background: transparent;
          color: var(--voss-text);
        }

        .voss-archive-content {
          position: relative;
          z-index: 1;
          min-height: 100vh;
        }

        .voss-archive-panel {
          border: 1px solid var(--voss-border);
          background:
            linear-gradient(180deg, rgba(255, 248, 232, 0.035), rgba(255, 248, 232, 0.012)),
            radial-gradient(circle at top right, rgba(216, 181, 109, 0.09), transparent 40%),
            rgba(7, 7, 6, 0.74);
          border-radius: 0.18rem;
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.28);
          backdrop-filter: blur(18px);
        }

        .voss-archive-kicker {
          font-family: var(--font-ritual);
          text-transform: uppercase;
          letter-spacing: 0.18em;
          color: var(--voss-amber);
        }

        .voss-archive-title {
          font-family: var(--font-display);
          font-weight: 300;
          color: var(--voss-ivory);
          letter-spacing: -0.025em;
        }

        .voss-archive-rule {
          height: 1px;
          background: linear-gradient(90deg, var(--voss-gold), var(--voss-amber), transparent);
        }
      `}</style>
      <div className="voss-archive-root">
        <div className="voss-archive-content">{children}</div>
      </div>
    </Layout>
  );
}
