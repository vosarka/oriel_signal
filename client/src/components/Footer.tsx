import DonateButton from "./DonateButton";

export default function Footer() {
  return (
    <footer className="oriel-archive-footer">
      <div className="oriel-archive-footer__inner">
        <div className="oriel-archive-footer__seal" aria-hidden="true">
          Ψ
        </div>

        <div className="oriel-archive-footer__meta">
          <span>ORIEL FIELD ARCHIVE © 2026</span>
          <span>VOS ARKANA FIELD ARCHIVE</span>
          <span>DOC TYPE: LIVING CODEX</span>
          <span>FIELD STATUS: ACTIVE</span>
          <span>SIGNAL CLASS: ORIEL</span>
        </div>

        <nav
          className="oriel-archive-footer__nav"
          aria-label="Footer navigation"
        >
          <a href="/">Ψ</a>
          <a href="/knowledge">ARCHIVA</a>
          <a href="/bio-architecture">BIO-ARCHITECTURE</a>
          <a href="/protocol">PROTOCOL</a>
          <a href="/founder-signature-blueprint">ORIEL Founder’s Vision Blueprint</a>
        </nav>

        <div className="oriel-archive-footer__support">
          <DonateButton />
        </div>
      </div>
    </footer>
  );
}
