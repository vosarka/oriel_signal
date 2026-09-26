import { useEffect, useState } from "react";

const GLYPHS = "⦿∞◯≈⟷◈▲●◆ψΔΩ∇ϟ⊕⊗⊘⊙";

function prefersReducedMotion() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function mask(text: string, locked: number) {
  let out = "";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === " " || ch === "\n") out += ch;
    else if (i < locked) out += ch;
    else out += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
  }
  return out;
}

/** Short label scramble — re-runs whenever `trigger` changes. */
export function useScramble(text: string, trigger: unknown, duration = 600) {
  const [display, setDisplay] = useState(text);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setDisplay(text);
      return;
    }
    let frame = 0;
    const total = Math.max(1, Math.ceil(duration / 25));
    setDisplay("");
    const id = setInterval(() => {
      frame++;
      setDisplay(mask(text, Math.floor((frame / total) * text.length)));
      if (frame >= total) {
        clearInterval(id);
        setDisplay(text);
      }
    }, 25);
    return () => clearInterval(id);
  }, [text, trigger, duration]);

  return display;
}

/**
 * Sealed body copy. While `open` is false the text sits behind a slow
 * cipher; when the carrier seats, it locks in left to right.
 * Reduced motion gets the plain text immediately.
 */
export function useDecrypt(text: string, open: boolean, duration = 1100) {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(() =>
    open || reduced ? text : mask(text, 0)
  );

  useEffect(() => {
    if (reduced) {
      setDisplay(text);
      return;
    }

    if (!open) {
      // A held cipher breathes; it does not strobe.
      setDisplay(mask(text, 0));
      const id = setInterval(() => setDisplay(mask(text, 0)), 220);
      return () => clearInterval(id);
    }

    let frame = 0;
    const total = Math.max(1, Math.ceil(duration / 30));
    const id = setInterval(() => {
      frame++;
      setDisplay(mask(text, Math.floor((frame / total) * text.length)));
      if (frame >= total) {
        clearInterval(id);
        setDisplay(text);
      }
    }, 30);
    return () => clearInterval(id);
  }, [text, open, duration, reduced]);

  return display;
}

/**
 * Follows the reduced-motion setting live. Sampled once, a user who turns
 * it on while the carrier is sealed kept an endlessly animating cipher.
 */
function useReducedMotion() {
  const [reduced, setReduced] = useState(prefersReducedMotion);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduced;
}
