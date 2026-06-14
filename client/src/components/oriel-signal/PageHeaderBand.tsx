import { Suspense, lazy, type ReactNode } from "react";
import "./oriel-signal.css";

// The R3F symbol canvas is lazy-loaded so it never bloats a page's initial
// bundle (spec §5: heavy scenes lazy-load).
const BandSymbol = lazy(() => import("./BandSymbol"));

// Shared page header band — a scaled-down echo of the Home hero for every
// standard page (spec §13). Defined once; each page passes { title, symbol,
// descriptor }. Wrapper-agnostic: pages drop it at the top of their content,
// over the uniform backdrop (no Flower of Life). Pages that are their own hero
// (Home) or excluded (Knowledge, Access) simply don't render it.
//
// Layout: symbol left, title + descriptor stacked beside it — a left-weighted
// dossier letterhead that echoes Home's left-aligned wordmark.
export function PageHeaderBand({
  title,
  descriptor,
  symbol,
  width,
  renderSymbol,
}: {
  title: string;
  descriptor?: string;
  // Reserved hook for the bespoke per-page glyph pass (spec 13.4); does not
  // affect the symbol yet.
  symbol?: string;
  // Optional width override for pages whose content column is wider than the
  // band's default 78rem (e.g. Codex's 1440px grid). Pass "100%" when the
  // band sits inside that wider container so it aligns with the page content
  // instead of insetting from it. Omit to keep the standard 78rem.
  width?: string;
  // Optional custom glyph for the symbol slot, replacing the default shared
  // R3F BandSymbol. Profile passes its dominant-codon glyph here (spec §3) so
  // the header is personal AND the page keeps a single WebGL context (the
  // Node figure) — the symbol stays gold; personalization is in shape, not
  // colour.
  renderSymbol?: ReactNode;
}) {
  return (
    <header
      className="fi-band"
      aria-label={title}
      style={width ? { width, maxWidth: "100%" } : undefined}
    >
      <div className="fi-band__symbol" aria-hidden="true">
        {renderSymbol ?? (
          <Suspense fallback={<span className="fi-band__symbol-fallback" />}>
            <BandSymbol seed={symbol} />
          </Suspense>
        )}
      </div>

      <div className="fi-band__text">
        <h1 className="fi-band__title">{title}</h1>
        {descriptor ? (
          <p className="fi-band__descriptor">{descriptor}</p>
        ) : null}
      </div>
    </header>
  );
}
