import { useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { extractPrimeStackCodonIds } from "@/lib/oracle-utils";
import { type ReceiverState } from "@shared/phase-gate";

type ReceiverStateQuery = {
  receiverState: ReceiverState;
  loading: boolean;
};

export function useReceiverStateQuery(): ReceiverStateQuery {
  const { user, isAuthenticated } = useAuth();

  const staticProfileQuery = trpc.profile.getStaticProfile.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
  });

  const coherenceHistoryQuery = trpc.codex.getCoherenceHistory.useQuery(
    { limit: 1 },
    {
      enabled: isAuthenticated,
      retry: false,
    }
  );

  const receiverState = useMemo(() => {
    const profile = staticProfileQuery.data;
    const primeStackCodons = extractPrimeStackCodonIds(profile?.primeStack);
    const dominantCodon = primeStackCodons[0] ?? null;
    const hasSignature =
      Boolean(profile) ||
      Boolean((user as { hasNatalProfile?: boolean } | null)?.hasNatalProfile);
    const latestCoherence = coherenceHistoryQuery.data?.[0]?.coherenceScore;

    return {
      isAuthed: isAuthenticated,
      hasSignature,
      dominantCodon,
      coherenceScore:
        typeof latestCoherence === "number" ? latestCoherence : null,
    };
  }, [
    coherenceHistoryQuery.data,
    isAuthenticated,
    staticProfileQuery.data,
    user,
  ]);

  return {
    receiverState,
    loading: isAuthenticated && staticProfileQuery.isLoading,
  };
}

export function useReceiverState(): ReceiverState {
  return useReceiverStateQuery().receiverState;
}
