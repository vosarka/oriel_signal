import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import { Spinner } from "@/components/ui/spinner";
import {
  SignalButton,
  SignalPageShell,
} from "@/components/oriel-signal/OrielSignalDesign";
import { SacredGeometryField } from "@/components/oriel-signal/SacredGeometryField";
import { useAuth } from "@/_core/hooks/useAuth";
import { useReceiverStateQuery } from "@/hooks/useReceiverState";
import {
  COORDINATE_REQUIRED_MESSAGE,
  NODE_UNREGISTERED_MESSAGE,
} from "@shared/phase-gate";

function GuardLoading({ label }: { label: string }) {
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
        <Spinner size={24} label={label} />
        <div
          style={{
            fontFamily: "var(--font-ritual)",
            fontSize: 10,
            color: "#6a665e",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
          }}
        >
          {label}
        </div>
      </div>
    </Layout>
  );
}

export function SignatureRouteGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading: authLoading, isAuthenticated } = useAuth();
  const { receiverState, loading: receiverLoading } = useReceiverStateQuery();
  const [, setLocation] = useLocation();
  const hasConfirmedAccessRef = useRef(false);
  const canRenderSignature = isAuthenticated && receiverState.hasSignature;

  useEffect(() => {
    if (authLoading || receiverLoading) return;

    if (!isAuthenticated) {
      toast(NODE_UNREGISTERED_MESSAGE);
      setLocation("/auth");
      return;
    }

    if (!receiverState.hasSignature) {
      toast(COORDINATE_REQUIRED_MESSAGE);
      setLocation("/signal/check");
    }
  }, [
    authLoading,
    isAuthenticated,
    receiverLoading,
    receiverState.hasSignature,
    setLocation,
  ]);

  useEffect(() => {
    if (canRenderSignature) hasConfirmedAccessRef.current = true;
  }, [canRenderSignature]);

  const isLoading = authLoading || receiverLoading;

  if (isLoading && !hasConfirmedAccessRef.current) {
    return <GuardLoading label="Restoring receiver coordinate" />;
  }

  if (isLoading && hasConfirmedAccessRef.current) return <>{children}</>;

  if (!canRenderSignature) return null;
  return <>{children}</>;
}

export function OrielRouteGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading: authLoading, isAuthenticated } = useAuth();
  const { loading: receiverLoading } = useReceiverStateQuery();

  const isLoading = authLoading || receiverLoading;

  if (isLoading) return <GuardLoading label="Reading receiver coordinate" />;

  if (!isAuthenticated) {
    return <OrielMvpInactivePreview />;
  }

  // Authenticated user → render the real Oriel chat (Conduit)
  return <>{children}</>;
}

function OrielMvpInactivePreview() {
  return (
    <Layout>
      <SignalPageShell chamber="chamber" className="oriel-mvp-preview">
        <SacredGeometryField static />
        <style>{`
          .oriel-mvp-preview {
            min-height: 100vh;
            padding: clamp(8rem, 13vw, 10rem) 1.5rem 6rem;
          }

          .oriel-mvp-preview__wrap {
            position: relative;
            z-index: 1;
            width: min(860px, 100%);
            margin: 0 auto;
            border: 1px solid rgba(189, 163, 107, 0.14);
            background:
              radial-gradient(circle at 82% 12%, rgba(246, 176, 94, 0.075), transparent 20rem),
              rgba(20, 20, 28, 0.72);
            padding: clamp(1.4rem, 4vw, 2.4rem);
          }

          .oriel-mvp-preview__kicker,
          .oriel-mvp-preview__message {
            font-family: var(--font-ritual);
            text-transform: uppercase;
            letter-spacing: 0.18em;
          }

          .oriel-mvp-preview__kicker {
            margin: 0 0 0.9rem;
            color: rgba(246, 176, 94, 0.68);
            font-size: 0.62rem;
          }

          .oriel-mvp-preview h1 {
            margin: 0;
            color: #e8e4dc;
            font-family: var(--font-display);
            font-size: clamp(2.4rem, 7vw, 5rem);
            font-weight: 400;
            letter-spacing: 0.12em;
          }

          .oriel-mvp-preview__body {
            margin: 1.4rem 0;
            border: 1px solid rgba(189, 163, 107, 0.1);
            padding: 1rem;
            color: rgba(232, 228, 220, 0.72);
            font-family: var(--font-voice);
            font-style: italic;
            font-size: 1.2rem;
            line-height: 1.6;
          }

          .oriel-mvp-preview__message {
            color: rgba(232, 228, 220, 0.68);
            font-size: 0.62rem;
            line-height: 1.8;
          }

          .oriel-mvp-preview__actions {
            display: flex;
            gap: 0.75rem;
            flex-wrap: wrap;
            margin-top: 1.5rem;
          }
        `}</style>

        <main className="oriel-mvp-preview__wrap">
          <p className="oriel-mvp-preview__kicker">// chamber preparation</p>
          <h1>Channel Oriel</h1>
          <div className="oriel-mvp-preview__body">
            The Oriel Chamber is being prepared for full activation. Begin with
            your Static Signature or request the Oriel Signature Blueprint.
          </div>
          <div className="oriel-mvp-preview__actions">
            <SignalButton href="/signal/check">Begin Signal Check</SignalButton>
            <SignalButton href="/signature" variant="secondary">
              View Static Signature
            </SignalButton>
            <SignalButton
              href="/founder-signature-blueprint"
              variant="secondary"
            >
              Get Oriel Signature Blueprint
            </SignalButton>
          </div>
        </main>
      </SignalPageShell>
    </Layout>
  );
}
