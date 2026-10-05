import Layout from "@/components/Layout";
import { SignalButton, SignalPageShell } from "@/components/oriel-signal/OrielSignalDesign";
import "./founders-reading.css";

export default function FoundersReading() {
  return (
    <Layout>
      <SignalPageShell chamber="revelation" className="founders-reading">
        <main className="fr-wrap">
          <header className="fr-hero">
            <p className="fr-kicker">A personal video · From the founder of ORIEL</p>
            <h1>Founder’s<br /><em>Reading</em></h1>
            <p className="fr-intro">Your Tetradic Signature, made clear.</p>
            <p className="fr-description">A simplified, personal interpretation of your signature,
              created by Vos Arkana and presented in a video made for you.
              Hear the reading in the founder’s voice or follow it through words on screen.</p>
            <SignalButton href="#reading-details">Discover the reading</SignalButton>
          </header>

          <section id="reading-details" className="fr-section" aria-labelledby="fr-receive">
            <p className="fr-kicker">What you receive</p>
            <h2 id="fr-receive">A few essential patterns.<br />Space to understand them.</h2>
            <div className="fr-columns">
              <p>Your birth coordinates form the starting point. The founder selects and
                interprets the essential elements of your Tetradic Signature, with clear language
                and a practice you can explore in daily life.</p>
              <p>The result is a personal video you can keep and revisit, with spoken narration
                or interpretation written on screen. This is a focused reading, purchased once,
                independently of your membership or donations.</p>
            </div>
          </section>

          <section className="fr-section" aria-labelledby="fr-process">
            <p className="fr-kicker">The process</p>
            <h2 id="fr-process">From your signature to your video.</h2>
            <ol className="fr-process">
              <li><h3>Your starting point</h3><p>Prepare your birth date, birth time and birthplace.
                If the time is unknown, keep that uncertainty visible in your profile.</p></li>
              <li><h3>A moment of presence</h3><p>Optionally complete the breathing and Signal Check
                exercise. Its three questions record how you feel today.</p></li>
              <li><h3>The founder’s interpretation</h3><p>Vos personally prepares the simplified
                reading and presents it in a video for you.</p></li>
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
              <SignalButton href="/profile#static-signature" variant="secondary">Prepare your signature</SignalButton>
            </div>
          </section>

          <section className="fr-offer" aria-labelledby="fr-offer-title">
            <p className="fr-kicker">Personal video · One-time purchase</p>
            <h2 id="fr-offer-title">A reading made for you.</h2>
            <p>Founder’s Reading is being prepared. Orders will open here once the price and
              delivery schedule are confirmed.</p>
            <p className="fr-status" role="status">Orders are not open yet</p>
            <a className="fr-book-link" href="/tetradic-signature">Explore the full Tetradic Signature Founder Edition</a>
          </section>
        </main>
      </SignalPageShell>
    </Layout>
  );
}
