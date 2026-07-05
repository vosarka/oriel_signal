export const signaturePageStyles = `
  /* ─── BASE ─────────────────────────────────────────────────── */

  .signature-page {
    min-height: 100vh;
    position: relative;
    overflow: hidden;
    padding: 0;
    background:
      radial-gradient(circle at 78% 10%, rgba(var(--oriel-amber-rgb), 0.13), transparent 28rem),
      radial-gradient(circle at 16% 14%, rgba(var(--oriel-gold-rgb), 0.10), transparent 26rem),
      linear-gradient(145deg, rgba(10,10,14,0.99), rgba(15,15,21,0.97) 48%, rgba(6,6,10,1));
    color: var(--oriel-ivory);
    isolation: isolate;
  }

  .signature-page::before,
  .signature-page::after {
    content: "";
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
  }

  .signature-page::before {
    background:
      linear-gradient(rgba(var(--oriel-amber-rgb), 0.048) 1px, transparent 1px),
      linear-gradient(90deg, rgba(var(--oriel-gold-rgb), 0.038) 1px, transparent 1px);
    background-size: 78px 78px;
    mask-image: radial-gradient(circle at 64% 18%, black 0%, transparent 68%);
    opacity: 0.54;
  }

  .signature-page::after {
    background:
      repeating-linear-gradient(to bottom, rgba(255,255,255,0.022) 0, rgba(255,255,255,0.022) 1px, transparent 1px, transparent 5px),
      radial-gradient(circle at 50% 0%, rgba(var(--oriel-amber-rgb), 0.08), transparent 34rem);
    mix-blend-mode: screen;
    opacity: 0.28;
  }

  /* ─── CONTAINER ────────────────────────────────────────────── */

  .fp-container {
    position: relative;
    z-index: 1;
    width: min(100%, 80rem);
    margin: 0 auto;
    padding: 0 1.5rem;
  }

  .fp-container--narrow {
    width: min(100%, 64rem);
  }

  /* ─── SECTION WRAPPER ──────────────────────────────────────── */

  .fp-section {
    position: relative;
    padding: 7rem 0;
  }

  .fp-section::after {
    content: "";
    display: block;
    width: 4rem;
    height: 1px;
    margin: 0 auto;
    margin-top: 7rem;
    background: linear-gradient(90deg, transparent, rgba(var(--oriel-amber-rgb), 0.25), transparent);
  }

  .fp-section:last-child::after {
    display: none;
  }

  .fp-section-divider {
    width: 100%;
    height: 1px;
    margin: 0;
    border: none;
    background: linear-gradient(90deg, transparent, rgba(var(--oriel-amber-rgb), 0.15), transparent);
    opacity: 0.7;
  }

  /* ─── SECTION LABEL ─────────────────────────────────────────── */

  .fp-label {
    display: inline-flex;
    align-items: center;
    gap: 0.7rem;
    border: 1px solid rgba(var(--oriel-gold-rgb), 0.15);
    background: rgba(var(--oriel-gold-rgb), 0.04);
    padding: 0.5rem 0.85rem;
    color: rgba(232,228,220,0.55);
    font-family: var(--font-ritual);
    font-size: 0.6rem;
    letter-spacing: 0.24em;
    text-transform: uppercase;
    backdrop-filter: blur(8px);
  }

  .fp-label--amber {
    border-color: rgba(var(--oriel-amber-rgb), 0.2);
    color: rgba(var(--oriel-amber-rgb), 0.75);
  }

  /* ─── TYPOGRAPHY ───────────────────────────────────────────── */

  .fp-title {
    margin: 0;
    color: #fff8ec;
    font-family: var(--font-display);
    font-size: clamp(3.6rem, 7vw, 7.2rem);
    font-weight: 300;
    letter-spacing: -0.055em;
    line-height: 0.86;
    text-shadow: 0 0 54px rgba(var(--oriel-amber-rgb), 0.18);
    text-wrap: balance;
  }

  .fp-title--centered {
    text-align: center;
  }

  .fp-subtitle {
    color: rgba(var(--oriel-amber-rgb), 0.78);
    font-family: var(--font-ritual);
    font-size: clamp(0.7rem, 1vw, 0.88rem);
    letter-spacing: 0.24em;
    text-transform: uppercase;
  }

  .fp-heading {
    margin: 0;
    color: #fff8ec;
    font-family: var(--font-display);
    font-size: clamp(2rem, 4vw, 3.4rem);
    font-weight: 300;
    letter-spacing: -0.035em;
    line-height: 0.98;
    text-shadow: 0 0 30px rgba(var(--oriel-amber-rgb), 0.1);
  }

  .fp-heading--centered {
    text-align: center;
  }

  .fp-subheading {
    color: #fff8ec;
    font-family: var(--font-display);
    font-size: clamp(1.3rem, 2.2vw, 2rem);
    font-weight: 300;
    letter-spacing: -0.025em;
    line-height: 1.05;
  }

  .fp-body {
    color: rgba(232,228,220,0.66);
    font-family: var(--font-body);
    font-size: clamp(0.92rem, 1.1vw, 1.05rem);
    font-weight: 300;
    line-height: 1.9;
    text-wrap: pretty;
  }

  .fp-body--light {
    color: rgba(232,228,220,0.78);
  }

  .fp-meta {
    color: rgba(154,150,142,0.7);
    font-family: var(--font-ritual);
    font-size: 0.6rem;
    letter-spacing: 0.24em;
    text-transform: uppercase;
  }

  /* ─── BUTTONS ──────────────────────────────────────────────── */

  .fp-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    border: 1px solid rgba(var(--oriel-gold-rgb), 0.18);
    background: rgba(var(--oriel-gold-rgb), 0.045);
    color: rgba(232,228,220,0.88);
    padding: 0.95rem 1.5rem;
    font-family: var(--font-ritual);
    font-size: 0.68rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    text-decoration: none;
    cursor: pointer;
    transition: transform 0.35s ease, border-color 0.35s ease, background 0.35s ease, box-shadow 0.35s ease;
    -webkit-appearance: none;
    appearance: none;
  }

  .fp-button:hover {
    transform: translateY(-2px);
    border-color: rgba(var(--oriel-amber-rgb), 0.48);
    background: rgba(var(--oriel-amber-rgb), 0.08);
    box-shadow: 0 18px 44px rgba(var(--oriel-amber-rgb), 0.12);
  }

  .fp-button--primary {
    border-color: rgba(var(--oriel-amber-rgb), 0.38);
    color: var(--oriel-amber);
    background: rgba(var(--oriel-amber-rgb), 0.085);
  }

  .fp-button--gold {
    border-color: rgba(var(--oriel-amber-rgb), 0.5);
    color: #fff8ec;
    background: linear-gradient(135deg, rgba(var(--oriel-amber-rgb), 0.15), rgba(var(--oriel-gold-rgb), 0.08));
    text-shadow: 0 0 20px rgba(var(--oriel-amber-rgb), 0.3);
    font-size: 0.72rem;
    padding: 1.1rem 2rem;
  }

  .fp-button--gold:hover {
    border-color: rgba(var(--oriel-amber-rgb), 0.7);
    box-shadow: 0 0 40px rgba(var(--oriel-amber-rgb), 0.2), 0 18px 44px rgba(var(--oriel-amber-rgb), 0.12);
  }

  .fp-button-row {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    align-items: center;
  }

  /* ─── 1. CHAMBER ENTRY / HERO ──────────────────────────────── */

  .fp-hero {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8rem 1.5rem 6rem;
    position: relative;
  }

  .fp-hero-inner {
    display: grid;
    gap: 3rem;
    align-items: center;
    width: 100%;
  }

  .fp-hero-content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .fp-hero-copy {
    max-width: 44rem;
    color: rgba(232,228,220,0.70);
    font-family: var(--font-body);
    font-size: clamp(1rem, 1.35vw, 1.18rem);
    font-weight: 300;
    line-height: 1.9;
    text-wrap: pretty;
  }

  .fp-hero-visual {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .fp-hero-document {
    position: relative;
    width: min(100%, 28rem);
    aspect-ratio: 3 / 4;
    border: 1px solid rgba(var(--oriel-amber-rgb), 0.2);
    background:
      radial-gradient(ellipse at 50% 30%, rgba(var(--oriel-amber-rgb), 0.08), transparent 60%),
      rgba(12,12,16,0.9);
    box-shadow:
      0 0 60px rgba(var(--oriel-amber-rgb), 0.08),
      0 0 120px rgba(var(--oriel-amber-rgb), 0.04),
      inset 0 0 60px rgba(var(--oriel-amber-rgb), 0.03);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    text-align: center;
    transform: perspective(1200px) rotateY(-4deg) rotateX(2deg);
    transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .fp-hero-document:hover {
    transform: perspective(1200px) rotateY(-2deg) rotateX(1deg);
  }

  .fp-hero-document::before {
    content: "";
    position: absolute;
    inset: 0.5rem;
    border: 1px solid rgba(var(--oriel-amber-rgb), 0.08);
    pointer-events: none;
    z-index: 2;
  }

  .fp-hero-document img {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: saturate(0.9) contrast(1.06) brightness(0.88) sepia(0.08);
  }

  .fp-hero-document-overlay {
    position: absolute;
    right: 1rem;
    bottom: 1rem;
    z-index: 3;
    border: 1px solid rgba(var(--oriel-amber-rgb), 0.18);
    background: rgba(10,10,14,0.64);
    padding: 0.58rem 0.7rem;
    color: rgba(var(--oriel-amber-rgb), 0.78);
    font-family: var(--font-ritual);
    font-size: 0.48rem;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    backdrop-filter: blur(10px);
  }

  .fp-hero-document-seal {
    width: 3.5rem;
    height: 3.5rem;
    border: 1px solid rgba(var(--oriel-amber-rgb), 0.25);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1.5rem;
    color: rgba(var(--oriel-amber-rgb), 0.5);
    font-family: var(--font-ritual);
    font-size: 0.5rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    position: relative;
  }

  .fp-hero-document-seal::after {
    content: "";
    position: absolute;
    inset: -3px;
    border: 1px solid rgba(var(--oriel-amber-rgb), 0.08);
    border-radius: 50%;
  }

  .fp-hero-document-title {
    color: rgba(255,248,236,0.85);
    font-family: var(--font-display);
    font-size: clamp(1.2rem, 2.5vw, 1.8rem);
    font-weight: 300;
    letter-spacing: -0.03em;
    line-height: 1.1;
    margin-bottom: 0.5rem;
  }

  .fp-hero-document-sub {
    color: rgba(var(--oriel-amber-rgb), 0.6);
    font-family: var(--font-ritual);
    font-size: 0.55rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    margin-bottom: 1.5rem;
  }

  .fp-hero-document-codex {
    color: rgba(232,228,220,0.35);
    font-family: var(--font-ritual);
    font-size: 0.45rem;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    border-top: 1px solid rgba(var(--oriel-amber-rgb), 0.12);
    padding-top: 1rem;
    width: 60%;
  }

  /* floating pages behind hero doc */
  .fp-hero-floating-pages {
    position: absolute;
    inset: -1.5rem;
    pointer-events: none;
    z-index: -1;
  }

  .fp-hero-floating-pages::before,
  .fp-hero-floating-pages::after {
    content: "";
    position: absolute;
    width: 85%;
    height: 96%;
    border: 1px solid rgba(var(--oriel-amber-rgb), 0.06);
    background: rgba(10,10,14,0.6);
  }

  .fp-hero-floating-pages::before {
    top: 0.6rem;
    left: 0.4rem;
    transform: perspective(1200px) rotateY(-8deg) rotateX(1deg);
  }

  .fp-hero-floating-pages::after {
    top: 1rem;
    left: 0.8rem;
    transform: perspective(1200px) rotateY(-12deg) rotateX(0.5deg);
  }

  /* ─── 2. SEALED OBJECT ─────────────────────────────────────── */

  .fp-sealed {
    display: grid;
    gap: 3rem;
    align-items: center;
  }

  .fp-sealed-visual {
    display: flex;
    justify-content: center;
    position: relative;
  }

  .fp-sealed-frame {
    position: relative;
    width: min(100%, 24rem);
    aspect-ratio: 4 / 5;
    border: 1px solid rgba(var(--oriel-gold-rgb), 0.14);
    background:
      radial-gradient(ellipse at 40% 30%, rgba(var(--oriel-amber-rgb), 0.06), transparent 50%),
      rgba(10,10,14,0.7);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    text-align: center;
  }

  .fp-sealed-frame::before {
    content: "";
    position: absolute;
    inset: 0.4rem;
    border: 1px solid rgba(var(--oriel-gold-rgb), 0.06);
    pointer-events: none;
    z-index: 2;
  }

  .fp-sealed-frame img {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: saturate(0.88) contrast(1.06) brightness(0.82) sepia(0.1);
  }

  .fp-sealed-frame::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(8,8,12,0.76), rgba(8,8,12,0.08) 58%);
    pointer-events: none;
    z-index: 1;
  }

  .fp-sealed-overlay {
    position: absolute;
    left: 1rem;
    right: 1rem;
    bottom: 1rem;
    z-index: 3;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .fp-sealed-stamp {
    width: 3rem;
    height: 3rem;
    border: 1px solid rgba(var(--oriel-amber-rgb), 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1rem;
    color: rgba(var(--oriel-amber-rgb), 0.3);
    font-family: var(--font-ritual);
    font-size: 0.4rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    transform: rotate(-12deg);
  }

  .fp-sealed-page-layers {
    position: absolute;
    inset: -1rem;
    z-index: -1;
    pointer-events: none;
  }

  .fp-sealed-page-layers::before,
  .fp-sealed-page-layers::after {
    content: "";
    position: absolute;
    width: 92%;
    height: 95%;
    border: 1px solid rgba(var(--oriel-amber-rgb), 0.05);
    background: rgba(8,8,12,0.5);
  }

  .fp-sealed-page-layers::before {
    top: 0.5rem;
    left: 0.3rem;
  }

  .fp-sealed-page-layers::after {
    top: 0.9rem;
    left: 0.6rem;
  }

  /* ─── 3. JOURNEY — PAGE PREVIEWS ──────────────────────────── */

  .fp-journey {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .fp-journey-intro {
    text-align: center;
    max-width: 36rem;
    margin: 0 auto 1rem;
  }

  .fp-journey-grid {
    display: grid;
    gap: 1.5rem;
  }

  .fp-page-card {
    position: relative;
    border: 1px solid rgba(var(--oriel-gold-rgb), 0.12);
    background:
      linear-gradient(180deg, rgba(255,255,255,0.025) 0%, transparent 100%),
      rgba(12,12,18,0.78);
    padding: 2rem 1.8rem;
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.4s ease, box-shadow 0.4s ease;
  }

  .fp-page-card:hover {
    transform: translateY(-4px);
    border-color: rgba(var(--oriel-amber-rgb), 0.25);
    box-shadow: 0 20px 60px rgba(0,0,0,0.3), 0 0 30px rgba(var(--oriel-amber-rgb), 0.04);
  }

  .fp-page-preview {
    position: relative;
    overflow: hidden;
    aspect-ratio: 4 / 5.25;
    margin: -0.8rem -0.6rem 1.4rem;
    border: 1px solid rgba(var(--oriel-gold-rgb), 0.08);
    background: rgba(0,0,0,0.35);
  }

  .fp-page-preview img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: top center;
    filter: saturate(0.82) contrast(1.05) brightness(0.72) sepia(0.08);
    transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), filter 0.6s ease;
  }

  .fp-page-card:hover .fp-page-preview img {
    transform: scale(1.035);
    filter: saturate(0.94) contrast(1.08) brightness(0.88) sepia(0.06);
  }

  .fp-page-preview::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(8,8,12,0.64), transparent 54%);
    pointer-events: none;
  }

  .fp-page-card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.2rem;
    gap: 1rem;
  }

  .fp-page-number {
    color: rgba(var(--oriel-amber-rgb), 0.5);
    font-family: var(--font-display);
    font-size: 1rem;
    font-weight: 300;
    white-space: nowrap;
  }

  .fp-page-label {
    color: rgba(154,150,142,0.65);
    font-family: var(--font-ritual);
    font-size: 0.55rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
  }

  .fp-page-card-title {
    color: #fff8ec;
    font-family: var(--font-display);
    font-size: clamp(1.2rem, 2vw, 1.6rem);
    font-weight: 300;
    letter-spacing: -0.025em;
    line-height: 1.1;
    margin-bottom: 0.6rem;
  }

  .fp-page-card-desc {
    color: rgba(232,228,220,0.58);
    font-family: var(--font-body);
    font-size: 0.9rem;
    font-weight: 300;
    line-height: 1.75;
    max-width: 36rem;
  }

  /* ─── 4. WHAT GETS DECODED ────────────────────────────────── */

  .fp-grid-header {
    text-align: center;
    max-width: 36rem;
    margin: 0 auto 2.5rem;
  }

  .fp-decoded-grid {
    display: grid;
    gap: 1px;
    background: rgba(var(--oriel-gold-rgb), 0.06);
    border: 1px solid rgba(var(--oriel-gold-rgb), 0.1);
  }

  .fp-decoded-item {
    padding: 1.5rem 1.2rem;
    background: rgba(10,10,14,0.7);
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    transition: background 0.3s ease;
  }

  .fp-decoded-item:hover {
    background: rgba(var(--oriel-amber-rgb), 0.04);
  }

  .fp-decoded-label {
    color: rgba(var(--oriel-amber-rgb), 0.75);
    font-family: var(--font-ritual);
    font-size: 0.6rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
  }

  .fp-decoded-desc {
    color: rgba(232,228,220,0.55);
    font-family: var(--font-body);
    font-size: 0.82rem;
    font-weight: 300;
    line-height: 1.5;
  }

  /* ─── 5. FOUNDER LAYER ────────────────────────────────────── */

  .fp-founder {
    border: 1px solid rgba(var(--oriel-amber-rgb), 0.15);
    background:
      radial-gradient(ellipse at 60% 40%, rgba(var(--oriel-amber-rgb), 0.04), transparent 50%),
      rgba(10,10,14,0.75);
    padding: 2.5rem 2rem;
    position: relative;
  }

  .fp-founder::before {
    content: "";
    position: absolute;
    inset: 0.35rem;
    border: 1px solid rgba(var(--oriel-amber-rgb), 0.05);
    pointer-events: none;
  }

  .fp-founder-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .fp-founder-icon {
    width: 2.2rem;
    height: 2.2rem;
    border: 1px solid rgba(var(--oriel-amber-rgb), 0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(var(--oriel-amber-rgb), 0.4);
    font-family: var(--font-ritual);
    font-size: 0.4rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
  }

  .fp-founder-body {
    color: rgba(232,228,220,0.62);
    font-family: var(--font-body);
    font-size: 0.95rem;
    font-weight: 300;
    line-height: 1.85;
    max-width: 48rem;
    font-style: italic;
  }

  /* ─── 6. WHO THIS IS FOR ─────────────────────────────────── */

  .fp-audience-grid {
    display: grid;
    gap: 1rem;
  }

  .fp-audience-card {
    border: 1px solid rgba(var(--oriel-gold-rgb), 0.1);
    background: rgba(10,10,14,0.65);
    padding: 1.5rem 1.2rem;
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    transition: border-color 0.3s ease, background 0.3s ease;
  }

  .fp-audience-card:hover {
    border-color: rgba(var(--oriel-amber-rgb), 0.2);
    background: rgba(var(--oriel-amber-rgb), 0.03);
  }

  .fp-audience-bullet {
    width: 0.35rem;
    height: 0.35rem;
    margin-top: 0.55rem;
    background: rgba(var(--oriel-amber-rgb), 0.4);
    flex-shrink: 0;
  }

  .fp-audience-text {
    color: rgba(232,228,220,0.62);
    font-family: var(--font-body);
    font-size: 0.92rem;
    font-weight: 300;
    line-height: 1.7;
  }

  /* ─── 7. HOW IT WORKS ────────────────────────────────────── */

  .fp-process-grid {
    display: grid;
    gap: 0;
    counter-reset: fp-step;
  }

  .fp-process-step {
    display: grid;
    gap: 0.5rem 1.5rem;
    align-items: start;
    padding: 1.8rem 0;
    border-bottom: 1px solid rgba(var(--oriel-gold-rgb), 0.06);
    position: relative;
  }

  .fp-process-step:last-child {
    border-bottom: none;
  }

  .fp-step-number {
    font-family: var(--font-display);
    font-size: 1.8rem;
    font-weight: 300;
    color: rgba(var(--oriel-amber-rgb), 0.25);
    line-height: 1;
  }

  .fp-step-title {
    color: #fff8ec;
    font-family: var(--font-display);
    font-size: 1.1rem;
    font-weight: 300;
    letter-spacing: -0.02em;
  }

  .fp-step-desc {
    color: rgba(232,228,220,0.58);
    font-family: var(--font-body);
    font-size: 0.9rem;
    font-weight: 300;
    line-height: 1.7;
  }

  .fp-process-note {
    margin-top: 1.5rem;
    color: rgba(154,150,142,0.65);
    font-family: var(--font-ritual);
    font-size: 0.6rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    text-align: center;
  }

  /* ─── 8. PURCHASE CHAMBER ────────────────────────────────── */

  .fp-purchase {
    text-align: center;
    border: 1px solid rgba(var(--oriel-amber-rgb), 0.18);
    background:
      radial-gradient(ellipse at 50% 30%, rgba(var(--oriel-amber-rgb), 0.06), transparent 50%),
      rgba(10,10,14,0.8);
    padding: 3.5rem 2rem;
    position: relative;
  }

  .fp-purchase::before {
    content: "";
    position: absolute;
    inset: 0.4rem;
    border: 1px solid rgba(var(--oriel-amber-rgb), 0.06);
    pointer-events: none;
  }

  .fp-purchase-label {
    color: rgba(var(--oriel-amber-rgb), 0.6);
    font-family: var(--font-ritual);
    font-size: 0.55rem;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    margin-bottom: 1rem;
  }

  .fp-purchase-price {
    color: var(--oriel-amber);
    font-family: var(--font-display);
    font-size: clamp(2.8rem, 5vw, 4.5rem);
    font-weight: 300;
    letter-spacing: -0.04em;
    line-height: 0.9;
    text-shadow: 0 0 30px rgba(var(--oriel-amber-rgb), 0.18);
    margin-bottom: 0.3rem;
  }

  .fp-purchase-price-note {
    color: rgba(154,150,142,0.65);
    font-family: var(--font-ritual);
    font-size: 0.6rem;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    margin-bottom: 2rem;
  }

  .fp-purchase-copy {
    color: rgba(232,228,220,0.55);
    font-family: var(--font-body);
    font-size: 0.85rem;
    font-weight: 300;
    line-height: 1.7;
    max-width: 32rem;
    margin: 1.5rem auto 0;
  }

  /* ─── 9. DISCLAIMER ───────────────────────────────────────── */

  .fp-disclaimer {
    border-top: 1px solid rgba(var(--oriel-gold-rgb), 0.06);
    padding: 2.5rem 1.5rem;
    text-align: center;
  }

  .fp-disclaimer-text {
    color: rgba(154,150,142,0.5);
    font-family: var(--font-body);
    font-size: 0.78rem;
    font-weight: 300;
    line-height: 1.7;
    max-width: 44rem;
    margin: 0 auto;
  }

  /* ─── ANIMATED DIVIDER ────────────────────────────────────── */

  .fp-glow-divider {
    width: 100%;
    height: 1px;
    position: relative;
    margin: 0;
    border: none;
    background: linear-gradient(90deg, transparent, rgba(var(--oriel-amber-rgb), 0.15), transparent);
    overflow: visible;
  }

  /* ─── RESPONSIVE ──────────────────────────────────────────── */

  @media (min-width: 768px) {
    .fp-section {
      padding: 9rem 0;
    }

    .fp-hero-inner {
      grid-template-columns: 1.1fr 0.9fr;
    }

    .fp-sealed {
      grid-template-columns: 0.9fr 1.1fr;
    }

    .fp-journey-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .fp-decoded-grid {
      grid-template-columns: repeat(3, 1fr);
    }

    .fp-audience-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .fp-process-step {
      grid-template-columns: 2rem 1fr;
    }

    .fp-button-row {
      gap: 1.5rem;
    }
  }

  @media (min-width: 1024px) {
    .fp-hero-inner {
      grid-template-columns: 1.2fr 0.8fr;
    }

    .fp-journey-grid {
      grid-template-columns: repeat(3, 1fr);
    }

    .fp-decoded-grid {
      grid-template-columns: repeat(3, 1fr);
    }

    .fp-process-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 0 2rem;
    }
  }

  @media (min-width: 1280px) {
    .fp-decoded-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  /* ─── 10. WHY DIFFERENT — SPLIT CONTRAST ──────────────────── */

  .fp-contrast {
    display: grid;
    gap: 2.5rem;
    align-items: center;
  }

  .fp-contrast-noise {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .fp-contrast-noise-item {
    color: rgba(154,150,142,0.42);
    font-family: var(--font-body);
    font-size: 1rem;
    font-weight: 300;
    text-decoration: line-through;
    text-decoration-color: rgba(154,150,142,0.28);
    text-underline-offset: 2px;
  }

  .fp-contrast-signal {
    border-left: 1px solid rgba(var(--oriel-amber-rgb), 0.22);
    padding-left: 1.8rem;
  }

  .fp-contrast-signal-label {
    display: block;
    color: rgba(var(--oriel-amber-rgb), 0.72);
    font-family: var(--font-ritual);
    font-size: 0.58rem;
    letter-spacing: 0.24em;
    text-transform: uppercase;
    margin-bottom: 0.9rem;
  }

  .fp-contrast-signal-body {
    color: rgba(232,228,220,0.8);
    font-family: var(--font-display);
    font-size: clamp(1.3rem, 2.4vw, 1.9rem);
    font-weight: 300;
    line-height: 1.4;
    letter-spacing: -0.01em;
    text-wrap: pretty;
  }

  /* ─── 11. THE TRANSFORMATION ───────────────────────────────── */

  .fp-transform {
    display: grid;
    gap: 3rem;
    align-items: center;
  }

  .fp-transform-visual {
    display: flex;
    justify-content: center;
  }

  .fp-transform-svg {
    width: min(100%, 20rem);
    height: auto;
    overflow: visible;
  }

  .fp-transform-list {
    margin-top: 1.6rem;
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
  }

  .fp-transform-list-item {
    display: flex;
    gap: 0.7rem;
    color: rgba(232,228,220,0.66);
    font-family: var(--font-body);
    font-size: 0.9rem;
    font-weight: 300;
    line-height: 1.5;
  }

  .fp-transform-list-item::before {
    content: "→";
    flex-shrink: 0;
    color: rgba(var(--oriel-amber-rgb), 0.6);
  }

  @media (min-width: 900px) {
    .fp-contrast {
      grid-template-columns: 0.85fr 1.15fr;
    }

    .fp-transform {
      grid-template-columns: 0.9fr 1.1fr;
    }
  }
`;