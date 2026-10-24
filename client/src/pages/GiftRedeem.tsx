import Layout from "@/components/Layout";
import { SignalButton, SignalPageShell } from "@/components/oriel-signal/OrielSignalDesign";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useRoute } from "wouter";

const GIFT_NAMES = { founders_reading: "a Founder's Reading", garden_month: "a month of Garden" } as const;

/**
 * A ring gift opened by its link. Whoever opens it first and signs in
 * receives it. A month waits for someone not already in a live Garden, and
 * a reading waits for a signature; the link stays valid while it waits.
 */
export default function GiftRedeem() {
  const [, params] = useRoute("/gift/:token");
  const token = params?.token ?? "";
  const valid = /^[0-9a-f]{32}$/.test(token);
  const { isAuthenticated, loading } = useAuth();
  const gift = trpc.rings.gift.useQuery({ token }, { enabled: valid, retry: false });
  const redeem = trpc.rings.redeem.useMutation();

  const blocked = redeem.error?.message;
  let body: React.ReactNode;

  if (!valid || (gift.isFetched && !gift.data)) {
    body = <p>This gift could not be found. Check the link you were sent.</p>;
  } else if (!gift.data) {
    body = <p>Opening the gift…</p>;
  } else if (redeem.data) {
    body =
      redeem.data.kind === "garden_month" ? (
        <>
          <p>Your month of Garden is open.</p>
          <SignalButton href="/conduit">SPEAK WITH ORIEL</SignalButton>
        </>
      ) : (
        <p>ORIEL is writing your reading. It reaches you once Vos has approved it.</p>
      );
  } else if (gift.data.redeemed) {
    body = <p>This gift has already been received.</p>;
  } else if (blocked === "active_garden") {
    body = <p>You already walk the Garden. Pass this gift to someone who doesn't.</p>;
  } else if (blocked === "needs_signature") {
    body = (
      <>
        <p>ORIEL needs your signature before it can read for you. Your gift waits here.</p>
        <SignalButton href="/complete-profile">PREPARE MY SIGNATURE</SignalButton>
      </>
    );
  } else {
    body = (
      <>
        <p>
          {gift.data.fromName ? `${gift.data.fromName} has` : "Someone has"} sent you{" "}
          {GIFT_NAMES[gift.data.kind]}.
        </p>
        {redeem.error && <p>{redeem.error.message}</p>}
        {loading ? null : isAuthenticated ? (
          <button
            type="button"
            className="rounded-full px-8 py-3 font-mono text-xs uppercase tracking-[0.3em]"
            style={{ color: "#050505", background: "#d8b56d" }}
            disabled={redeem.isPending}
            onClick={() => redeem.mutate({ token })}
          >
            {redeem.isPending ? "Receiving…" : "Receive the gift"}
          </button>
        ) : (
          <SignalButton href={getLoginUrl(`/gift/${token}`)}>SIGN IN TO RECEIVE</SignalButton>
        )}
      </>
    );
  }

  return (
    <Layout>
      <SignalPageShell chamber="threshold">
        <section className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-6 px-4 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.35em]" style={{ color: "#5ba4a4" }}>
            A gift from the field
          </p>
          <div className="flex flex-col items-center gap-5 text-lg" style={{ color: "#fff7e6" }}>
            {body}
          </div>
        </section>
      </SignalPageShell>
    </Layout>
  );
}
