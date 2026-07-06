import { ReactNode, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import {
  SignalPageShell,
  DecodedTitle,
} from "@/components/oriel-signal/OrielSignalDesign";
import "../pages/arcana.css";

/**
 * ArkanaLayerShell
 *
 * Shared chrome for every interior ARKANA knowledge layer so they read as one
 * family: a quiet return path to the node field, the kicker, a decoded title,
 * a subtitle, then the layer's own content.
 */
export function ArkanaLayerShell({
  kicker,
  title,
  subtitle,
  children,
}: {
  kicker: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <Layout>
      <SignalPageShell chamber="transmissions" className="arkana-layer">
        <div className="arkana-layer__inner">
          <Link href="/arcana">
            <span className="arkana-layer__back">← ARKANA NODE FIELD</span>
          </Link>

          <motion.header
            className="arkana-layer__head"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <div className="arkana-layer__kicker">{kicker}</div>
            <DecodedTitle as="h1" text={title} className="arkana-layer__title" />
            <p className="arkana-layer__subtitle">{subtitle}</p>
          </motion.header>

          {children}
        </div>
      </SignalPageShell>
    </Layout>
  );
}

export interface ArkanaConcept {
  code: string;
  term: string;
  short: string;
  body: string;
}

/**
 * ArkanaConceptGrid
 *
 * A grid of luminous knowledge cards that expand inline on click — used by
 * CORE CONCEPTS and MODELS & MAPS. No detail routes; the page is self-contained.
 */
export function ArkanaConceptGrid({ items }: { items: ArkanaConcept[] }) {
  const [openCode, setOpenCode] = useState<string | null>(null);

  return (
    <div className="arkana-grid">
      {items.map((item, i) => {
        const open = openCode === item.code;
        return (
          <motion.button
            key={item.code}
            type="button"
            className={`arkana-card ${open ? "is-open" : ""}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 + i * 0.05 }}
            onClick={() => setOpenCode(open ? null : item.code)}
            aria-expanded={open}
          >
            <span className="arkana-card__code">{item.code}</span>
            <span className="arkana-card__term">{item.term}</span>
            <span className="arkana-card__short">{item.short}</span>
            <motion.span
              className="arkana-card__body"
              initial={false}
              animate={{
                height: open ? "auto" : 0,
                opacity: open ? 1 : 0,
                marginTop: open ? 12 : 0,
              }}
              transition={{ duration: 0.32, ease: "easeInOut" }}
            >
              <span className="arkana-card__body-inner">{item.body}</span>
            </motion.span>
            <span className="arkana-card__cue">{open ? "−" : "+"}</span>
          </motion.button>
        );
      })}
    </div>
  );
}