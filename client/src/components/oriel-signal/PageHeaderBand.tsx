import { Suspense, lazy } from "react";
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
}: {
  title: string;
  descriptor?: string;
  // Seed for the shared symbol's accent; bespoke per-page glyphs are a later
  // pass (spec 13.4).
  symbol?: string;
}) {
  return (
    <header className="fi-band" aria-label={title}>
      <div className="fi-band__symbol" aria-hidden="true">
        <Suspense fallback={<span className="fi-band__symbol-fallback" />}>
          <BandSymbol seed={symbol} />
        </Suspense>
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
