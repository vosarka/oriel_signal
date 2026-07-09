import ResonanceBody from "@/components/oriel-signal/ResonanceBody";
import { useAuth } from "@/_core/hooks/useAuth";
import { normalizeCenters, normalizeChannels } from "@/lib/bodygraph-data";
import { trpc } from "@/lib/trpc";
import { useMemo } from "react";
import { Link } from "wouter";

export default function ResonanceBodyLab() {
  const { isAuthenticated } = useAuth();
  const profileQuery = trpc.profile.getStaticProfile.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const centers = useMemo(
    () => normalizeCenters(profileQuery.data?.ninecenters),
    [profileQuery.data?.ninecenters]
  );
  const channels = useMemo(() => {
    const direct = normalizeChannels(profileQuery.data?.channelStatuses);
    if (direct.length > 0) return direct;
    return normalizeChannels(
      (
        profileQuery.data?.coreCodonEngine as
          | { lattice?: { channelStatuses?: unknown } }
          | undefined
      )?.lattice?.channelStatuses
    );
  }, [profileQuery.data?.channelStatuses, profileQuery.data?.coreCodonEngine]);

  const hasProfile = centers.length > 0;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#08080c",
        overflow: "hidden",
      }}
    >
      <ResonanceBody
        centers={hasProfile ? centers : undefined}
        channels={channels.length ? channels : undefined}
      />

      <div
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          right: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            pointerEvents: "auto",
            padding: "10px 14px",
            background: "rgba(8, 8, 12, 0.72)",
            border: "1px solid rgba(189,163,107,0.2)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-ritual)",
              fontSize: 9,
              letterSpacing: "0.22em",
              color: "rgba(246,176,94,0.85)",
              marginBottom: 6,
            }}
          >
            VTRS RESONANCE BODY
          </div>
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 10,
              color: "rgba(232,228,220,0.72)",
              lineHeight: 1.5,
            }}
          >
            {hasProfile
              ? "Rendering your stored Static Signature Reading."
              : "Demo field — complete your profile or sign in to load live data."}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, pointerEvents: "auto" }}>
          <Link
            href="/bio-architecture"
            style={{
              padding: "10px 14px",
              border: "1px solid rgba(189,163,107,0.28)",
              color: "#bda36b",
              fontFamily: "var(--font-ritual)",
              fontSize: 9,
              letterSpacing: "0.16em",
              textDecoration: "none",
              background: "rgba(8, 8, 12, 0.72)",
            }}
          >
            BIO-ARCHITECTURE
          </Link>
          <Link
            href="/signature"
            style={{
              padding: "10px 14px",
              border: "1px solid rgba(189,163,107,0.28)",
              color: "#bda36b",
              fontFamily: "var(--font-ritual)",
              fontSize: 9,
              letterSpacing: "0.16em",
              textDecoration: "none",
              background: "rgba(8, 8, 12, 0.72)",
            }}
          >
            SIGNATURE
          </Link>
        </div>
      </div>
    </div>
  );
}