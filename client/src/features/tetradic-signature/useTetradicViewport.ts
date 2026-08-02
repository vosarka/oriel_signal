import { useEffect, useState } from "react";

type TetradicViewport = Readonly<{
  compact: boolean;
  reducedMotion: boolean;
}>;

function readViewportPreferences(): TetradicViewport {
  if (typeof window === "undefined") {
    return { compact: false, reducedMotion: false };
  }

  return {
    compact: window.matchMedia("(max-width: 1023px), (orientation: portrait)")
      .matches,
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches,
  };
}

export function useTetradicViewport() {
  const [viewport, setViewport] = useState<TetradicViewport>(
    readViewportPreferences
  );

  useEffect(() => {
    const compactQuery = window.matchMedia(
      "(max-width: 1023px), (orientation: portrait)"
    );
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setViewport(readViewportPreferences());

    compactQuery.addEventListener("change", update);
    motionQuery.addEventListener("change", update);

    return () => {
      compactQuery.removeEventListener("change", update);
      motionQuery.removeEventListener("change", update);
    };
  }, []);

  return viewport;
}
