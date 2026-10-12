import Layout from "@/components/Layout";
import { SignalButton, SignalPageShell } from "@/components/oriel-signal/OrielSignalDesign";
import "./founders-reading.css";
import { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";

/** Buy once; PayPal returns with ?reading=return&id=N and the server captures. */
function OrderReading() {
  const { isAuthenticated } = useAuth();
  const status = trpc.foundersReading.status.useQuery();
  const order = trpc.foundersReading.order.useMutation({
    onSuccess: ({ approveUrl }) => {
      window.location.href = approveUrl;
    },
  });
  const capture = trpc.foundersReading.capture.useMutation();
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = Number(params.get("id"));
    if (params.get("reading") !== "return" || !id) return;
    setNotice("Confirming with PayPal…");
    // The return address stays until the capture succeeds, so a refresh
    // after a failed confirmation tries again.
    capture
      .mutateAsync({ id })
      .then(() => {
        window.history.replaceState(null, "", "/founders-reading");
        setNotice("Received. Your transmission reaches your email within 48 hours.");
      })
      .catch(e => setNotice(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const s = status.data;
  return (
    <div className="fr-order">
      {s && (
        <p className="fr-price">
          {s.launch ? `Launch price €${s.priceEur} · ${s.seatsLeft} of 50 left` : `€${s.priceEur}`}
        </p>
      )}
      {notice && <p className="fr-status" role="status">{notice}</p>}
      {!notice &&
        (isAuthenticated ? (
          <button
            type="button"
            className="signal-button signal-button--primary"
            disabled={order.isPending}
            onClick={() => order.mutate()}
          >
            <span className="signal-button__seal" aria-hidden="true" />
            {order.isPending ? "Opening PayPal" : "Receive your reading · PayPal or card"}
          </button>
        ) : (
          <SignalButton href={getLoginUrl("/founders-reading")}>Sign in to receive it</SignalButton>
        ))}
      {order.error && (
        <p className="fr-status" role="alert">
          {order.error.message}{" "}
          {order.error.data?.code === "PRECONDITION_FAILED" && <a href="/complete-profile">Prepare it here.</a>}
        </p>
      )}
    </div>
  );
}

export default function FoundersReading() {
  return (
    <Layout>
      <SignalPageShell chamber="revelation" className="founders-reading">
        <main className="fr-wrap">
          <header className="fr-hero">
            <p className="fr-kicker">A personal transmission · Approved by the founder</p>
            <h1>Founder’s<br /><em>Reading</em></h1>
            <p className="fr-intro">Your Tetradic Signature, made clear.</p>
            <p className="fr-description">ORIEL writes it from your Tetradic Signature, and Vos Arkana
              reads and approves every one before it reaches you. Hear it in ORIEL’s voice,
              or follow it as words on screen.</p>
            <SignalButton href="#reading-details">Discover the reading</SignalButton>
          </header>

          <section id="reading-details" className="fr-section" aria-labelledby="fr-receive">
            <p className="fr-kicker">What you receive</p>
            <h2 id="fr-receive">A few essential patterns.<br />Space to understand them.</h2>
            <div className="fr-columns">
              <p>Your birth coordinates form the starting point. ORIEL reads the essential
                elements of your Tetradic Signature in three movements, the Mirror, the Threshold
                and the Gift, and ends with a practice you can explore in daily life.</p>
              <p>The result is a private transmission you can keep and return to, spoken by
                ORIEL or written on screen. This is a focused reading, purchased once,
                independently of your membership or donations.</p>
            </div>
          </section>

          <section className="fr-section" aria-labelledby="fr-process">
            <p className="fr-kicker">The process</p>
            <h2 id="fr-process">From your signature to your transmission.</h2>
            <ol className="fr-process">
              <li><h3>Your starting point</h3><p>Prepare your birth date, birth time and birthplace.
                If the time is unknown, keep that uncertainty visible in your profile.</p></li>
              <li><h3>A moment of presence</h3><p>Optionally complete the breathing and Signal Check
                exercise. Its three questions record how you feel today.</p></li>
              <li><h3>Written, then read</h3><p>ORIEL writes your transmission. Vos reads and
                approves it. It reaches you within 48 hours.</p></li>
            </ol>
          </section>

          <section className="fr-section" aria-labelledby="fr-check">
            <p className="fr-kicker">An optional preparation</p>
            <h2 id="fr-check">Arrive as you are today.</h2>
            <p className="fr-description">The existing Signal Check pairs a breathing exercise with
              three self-reported dimensions: Mental Noise, Body Tension and Emotional Tide.
              This reflects your present experience; your birth signature remains the foundation
              of the reading.</p>
            <div className="fr-actions">
              <SignalButton href="/signal/check">Take the Signal Check</SignalButton>
              <SignalButton href="/complete-profile" variant="secondary">Prepare your signature</SignalButton>
            </div>
          </section>

          <section className="fr-offer" aria-labelledby="fr-offer-title">
            <p className="fr-kicker">Personal transmission · One-time purchase</p>
            <h2 id="fr-offer-title">A reading made for you.</h2>
            <OrderReading />
            <a className="fr-book-link" href="/tetradic-signature">Explore the full Tetradic Signature Founder Edition</a>
          </section>
        </main>
      </SignalPageShell>
    </Layout>
  );
}
