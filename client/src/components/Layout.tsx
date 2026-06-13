import { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";
import { SignalBackdrop } from "./oriel-signal/SignalBackdrop";

interface LayoutProps {
  children: ReactNode;
  hideFooter?: boolean;
  overlayHeader?: boolean;
}

export default function Layout({
  children,
  hideFooter,
  overlayHeader,
}: LayoutProps) {
  return (
    <div className="oriel-shell">
      {/* One shared background for every route. Pages layer their own
          signature visuals (Home's Flower of Life, the ORIEL orb, the
          living lattice, the bodygraph) on top of this. */}
      <SignalBackdrop />

      <Header />

      <main
        className={`oriel-main ${overlayHeader ? "oriel-main--overlay" : "oriel-main--padded"} ${hideFooter ? "" : "pb-20"}`}
      >
        {children}
      </main>

      {!hideFooter && <Footer />}
    </div>
  );
}
