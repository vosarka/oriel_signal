export const TETRAD_SYMBOLS = [
  "/assets/tetrads/01.png",
  "/assets/tetrads/02.png",
  "/assets/tetrads/03.png",
  "/assets/tetrads/04.png",
  "/assets/tetrads/05.png",
  "/assets/tetrads/06.png",
  "/assets/tetrads/07.png",
  "/assets/tetrads/08.png",
  "/assets/tetrads/09.png",
  "/assets/tetrads/10.png",
  "/assets/tetrads/11.png",
  "/assets/tetrads/12.png",
] as const;

export type TetradicTimelineRange = Readonly<{
  startSvh: number;
  endSvh: number;
  start: number;
  end: number;
}>;

const MASTER_TIMELINE_SVH = 2400;

function timelineRange(startSvh: number, endSvh: number) {
  return {
    startSvh,
    endSvh,
    start: startSvh / MASTER_TIMELINE_SVH,
    end: endSvh / MASTER_TIMELINE_SVH,
  } satisfies TetradicTimelineRange;
}

export const TETRADIC_TIMELINE = {
  totalSvh: MASTER_TIMELINE_SVH,
  checkpointEndSvh: 560,
  checkpointViewportSvh: 100,
  checkpointHeightSvh: 660,
  checkpointEndProgress: 560 / MASTER_TIMELINE_SVH,
} as const;

export const TETRADIC_CHOREOGRAPHY = [
  {
    id: "tetrad-01",
    number: 1,
    act: "ACT I / ENTERING THE ARCHITECTURE",
    title: "THE THRESHOLD",
    statement: "Every architecture begins with a point of entry.",
    symbol: TETRAD_SYMBOLS[0],
    scrollLanguage: "CINEMATIC VERTICAL APPROACH",
    core: timelineRange(0, 170),
    transitionOut: {
      id: "transition-01-02",
      to: "tetrad-02",
      label: "SEAL EXPANSION",
      range: timelineRange(170, 225),
    },
  },
  {
    id: "tetrad-02",
    number: 2,
    act: "ACT I / ENTERING THE ARCHITECTURE",
    title: "THE WHOLE ARCHITECTURE",
    statement: "Before you meet the parts, see the pattern.",
    symbol: TETRAD_SYMBOLS[1],
    scrollLanguage: "DEPTH EXPANSION AND CONTROLLED ORBIT",
    core: timelineRange(225, 340),
    transitionOut: {
      id: "transition-02-03",
      to: "tetrad-03",
      label: "FOLD DIVE",
      range: timelineRange(340, 405),
    },
  },
  {
    id: "tetrad-03",
    number: 3,
    act: "ACT II / DECODING THE MECHANISM",
    title: "THE TWO TIMINGS",
    statement: "You were calculated twice: once in light, once beneath it.",
    symbol: TETRAD_SYMBOLS[2],
    scrollLanguage: "HORIZONTAL CELESTIAL PROGRESSION",
    core: timelineRange(405, 560),
    transitionOut: {
      id: "transition-03-04",
      to: "tetrad-04",
      label: "ORBITAL COLLAPSE",
      range: timelineRange(560, 610),
    },
  },
  {
    id: "tetrad-04",
    number: 4,
    act: "ACT II / DECODING THE MECHANISM",
    title: "THE MANDALA",
    statement: "Twenty-six signals enter sixty-four possible languages.",
    symbol: TETRAD_SYMBOLS[3],
    scrollLanguage: "RADIAL ROTATION AND CONTROLLED ZOOM",
    core: timelineRange(610, 750),
    transitionOut: {
      id: "transition-04-05",
      to: "tetrad-05",
      label: "EIGHT-POINT FOLD",
      range: timelineRange(750, 790),
    },
  },
  {
    id: "tetrad-05",
    number: 5,
    act: "ACT II / DECODING THE MECHANISM",
    title: "THE EIGHT CENTERS",
    statement: "The wheel becomes a body.",
    symbol: TETRAD_SYMBOLS[4],
    scrollLanguage: "VERTICAL ANATOMICAL SCAN",
    core: timelineRange(790, 935),
    transitionOut: {
      id: "transition-05-06",
      to: "tetrad-06",
      label: "CIRCUIT IGNITION",
      range: timelineRange(935, 980),
    },
  },
  {
    id: "tetrad-06",
    number: 6,
    act: "ACT II / DECODING THE MECHANISM",
    title: "THE CIRCUITRY",
    statement: "A center is potential. A completed link becomes flow.",
    symbol: TETRAD_SYMBOLS[5],
    scrollLanguage: "PATH-FOLLOWING SIGNAL JOURNEY",
    core: timelineRange(980, 1135),
    transitionOut: {
      id: "transition-06-07",
      to: "tetrad-07",
      label: "CONSCIOUS SUN FLASH",
      range: timelineRange(1135, 1180),
    },
  },
  {
    id: "tetrad-07",
    number: 7,
    act: "ACT III / RECOGNIZING THE SELF",
    title: "CONSCIOUS ACTIVATION ATLAS",
    statement: "This is the self you recognize.",
    symbol: TETRAD_SYMBOLS[6],
    scrollLanguage: "HORIZONTAL EDITORIAL ATLAS",
    core: timelineRange(1180, 1325),
    transitionOut: {
      id: "transition-07-08",
      to: "tetrad-08",
      label: "REFLECTIVE REVERSAL",
      range: timelineRange(1325, 1370),
    },
  },
  {
    id: "tetrad-08",
    number: 8,
    act: "ACT III / RECOGNIZING THE SELF",
    title: "DESIGN ACTIVATION ATLAS",
    statement: "This is the intelligence your body carries before thought.",
    symbol: TETRAD_SYMBOLS[7],
    scrollLanguage: "REVERSE HORIZONTAL ATLAS",
    core: timelineRange(1370, 1515),
    transitionOut: {
      id: "transition-08-09",
      to: "tetrad-09",
      label: "LAYER CONVERGENCE",
      range: timelineRange(1515, 1560),
    },
  },
  {
    id: "tetrad-09",
    number: 9,
    act: "ACT III / RECOGNIZING THE SELF",
    title: "IDENTITY SYNTHESIS",
    statement: "Where both layers converge, a role emerges.",
    symbol: TETRAD_SYMBOLS[8],
    scrollLanguage: "SNAP-BASED IDENTITY CRYSTALLIZATION",
    core: timelineRange(1560, 1715),
    transitionOut: {
      id: "transition-09-10",
      to: "tetrad-10",
      label: "CONTROLLED FRACTURE",
      range: timelineRange(1715, 1760),
    },
  },
  {
    id: "tetrad-10",
    number: 10,
    act: "ACT III / RECOGNIZING THE SELF",
    title: "SHADOW AND GIFT",
    statement: "Every coherent gift casts a predictable distortion.",
    symbol: TETRAD_SYMBOLS[9],
    scrollLanguage: "BIDIRECTIONAL TRANSFORMATION SCRUB",
    core: timelineRange(1760, 1915),
    transitionOut: {
      id: "transition-10-11",
      to: "tetrad-11",
      label: "PATHWAY REORGANIZATION",
      range: timelineRange(1915, 1960),
    },
  },
  {
    id: "tetrad-11",
    number: 11,
    act: "ACT IV / EMBODIMENT AND SEAL",
    title: "SOMATIC PRACTICE",
    statement: "A map becomes useful only when it enters the body.",
    symbol: TETRAD_SYMBOLS[10],
    scrollLanguage: "SOFT SNAP WITH BREATHING RHYTHM",
    core: timelineRange(1960, 2120),
    transitionOut: {
      id: "transition-11-12",
      to: "tetrad-12",
      label: "ARCHIVE RING COMPLETION",
      range: timelineRange(2120, 2170),
    },
  },
  {
    id: "tetrad-12",
    number: 12,
    act: "ACT IV / EMBODIMENT AND SEAL",
    title: "INTEGRATION AND SEAL",
    statement: "The reading ends where observation begins.",
    symbol: TETRAD_SYMBOLS[11],
    scrollLanguage: "ORBITAL INTEGRATION AND CEREMONIAL CLOSURE",
    core: timelineRange(2170, 2330),
    transitionOut: {
      id: "final-closure",
      to: "end-state",
      label: "CEREMONIAL CLOSURE",
      range: timelineRange(2330, 2400),
    },
  },
] as const;

const TETRAD_ONE_CORE = TETRADIC_CHOREOGRAPHY[0].core;

export const TETRADIC_SIGNATURE_CONFIG = {
  naming: {
    brand: "ORIEL",
    system: "TETRADIC RESONANCE ARCHITECTURE",
    product: "THE TETRADIC SIGNATURE",
    productLines: ["THE TETRADIC", "SIGNATURE"],
    edition: "FOUNDER EDITION",
    subtitle: "YOUR RESONANCE ARCHITECTURE",
    readingType: "FOUNDER-CURATED STATIC READING",
  },
  assets: {
    logo: "/oriel-signal-mark.png",
    cover: "/assets/founder-scene/front-cover.png",
    environment: "/assets/tetradic-signature/pedestal-scene-final.png",
  },
  sample: {
    receiver: "RECEIVER 001",
    recordStatus: "INITIALIZED",
    birthRecord: "REDACTED",
    coordinates: "REDACTED",
    archiveId: "ORL-TDS-001",
  },
  ctas: {
    exploreSampleLabel: "EXPLORE A SAMPLE",
    generateSignatureLabel: "GENERATE MY SIGNATURE",
    generateSignatureRoute: null as string | null,
    generateSignatureStatus: "AWAITING_GENERATOR_ROUTE",
  },
  animation: {
    timeline: TETRADIC_TIMELINE,
    choreography: TETRADIC_CHOREOGRAPHY,
    chapters: {
      revelation: timelineRange(8, 36),
      approach: timelineRange(24, 54),
      orientation: timelineRange(32, 56),
      opening: timelineRange(64, 110),
      tetradOne: timelineRange(110, TETRAD_ONE_CORE.endSvh),
      cta: timelineRange(MASTER_TIMELINE_SVH, MASTER_TIMELINE_SVH),
    },
    narratives: {
      cover: {
        start: 2 / MASTER_TIMELINE_SVH,
        fadeInEnd: 10 / MASTER_TIMELINE_SVH,
        fadeOutStart: 30 / MASTER_TIMELINE_SVH,
        end: 44 / MASTER_TIMELINE_SVH,
      },
    },
    openingRhythm: {
      release: { start: 0, end: 0.14 },
      coverRotation: { start: 0.12, end: 0.68 },
      interiorReveal: { start: 0.32, end: 0.76 },
      readingAngle: { start: 0.68, end: 0.9 },
      settle: { start: 0.9, end: 1 },
    },
    tetradRhythm: {
      pageTurn: { start: 0, end: 0.18 },
      spreadReveal: { start: 0.16, end: 0.3 },
      settle: { start: 0.22, end: 0.36 },
      eyebrow: { start: 0.4, end: 0.47 },
      title: { start: 0.4, end: 0.52 },
      description: { start: 0.48, end: 0.6 },
      labels: { start: 0.52, end: 0.6 },
      diagramReveal: { start: 0.4, end: 0.6 },
      inspection: { start: 0.6, end: 0.8 },
      withdrawal: { start: 0.8, end: 0.92 },
      labelsExit: { start: 0.8, end: 0.84 },
      descriptionExit: { start: 0.83, end: 0.88 },
      titleExit: { start: 0.87, end: 0.92 },
      pageLift: { start: 0.9, end: 1 },
      sealLight: { start: 0.52, end: 0.72 },
    },
    chapterRhythm: {
      tetradTwo: {
        settle: { start: 0, end: 0.18 },
        title: { start: 0.32, end: 0.42 },
        statement: { start: 0.4, end: 0.5 },
        blueprint: { start: 0.06, end: 0.3 },
        orbit: { start: 0.08, end: 0.26 },
        withdrawal: { start: 0.8, end: 1 },
      },
      tetradThree: {
        settle: { start: 0, end: 0.18 },
        title: { start: 0.22, end: 0.34 },
        statement: { start: 0.3, end: 0.42 },
        celestialReveal: { start: 0, end: 0.18 },
        horizontalJourney: { start: 0.44, end: 0.82 },
      },
      transitionOneToTwo: {
        pageTurn: { start: 0, end: 0.64 },
        pageSettle: { start: 0.64, end: 0.76 },
        camera: { start: 0.22, end: 0.82 },
        sealExpansion: { start: 0.18, end: 0.72 },
        blueprintReveal: { start: 0.4, end: 0.82 },
        spreadSwap: { start: 0.5, end: 0.68 },
      },
      transitionTwoToThree: {
        pageAnticipation: { start: 0, end: 0.08 },
        pageTurn: { start: 0.08, end: 0.64 },
        pageSettle: { start: 0.64, end: 0.76 },
        foldDive: { start: 0.58, end: 0.9 },
        celestialReveal: { start: 0.8, end: 1 },
      },
    },
    scroll: {
      lerp: 0.07,
      wheelMultiplier: 0.82,
      touchMultiplier: 0.9,
      scrubDesktop: 0.18,
      scrubCompact: 0.1,
    },
    reducedMotionProgress: 141 / MASTER_TIMELINE_SVH,
    exploreSample: { startProgress: 0.01, endProgress: 0.21 },
    book: {
      width: 2.4,
      depth: 3.2,
      coverOpenAngle: 0.985,
      spreadDistanceFactor: 1.95,
      rotationY: {
        closed: -0.24,
        open: 0.012,
      },
      scale: {
        desktopClosed: 0.88,
        desktopOpen: 1.08,
        compactClosed: 0.76,
        compactOpen: 0.7,
      },
      camera: {
        desktop: {
          startY: 5.65,
          startZ: 9.2,
          startFov: 38,
          approachY: 4.75,
          approachZ: 7.25,
          approachFov: 33.5,
          inspectionY: 5.1,
          inspectionZ: 6.75,
          inspectionFov: 30.5,
        },
        compact: {
          startY: 5.85,
          startZ: 9.1,
          startFov: 42,
          approachY: 5.45,
          approachZ: 8.2,
          approachFov: 39.5,
          inspectionY: 5.85,
          inspectionZ: 8.55,
          inspectionFov: 37.5,
        },
      },
    },
  },
} as const;

export const TETRAD_ONE_SPREAD = {
  id: "threshold",
  number: 1,
  total: 12,
  placement: "left",
  symbol: TETRAD_SYMBOLS[0],
  eyebrow: "TETRAD 01 / 12",
  title: TETRADIC_CHOREOGRAPHY[0].title,
  mainStatement: TETRADIC_CHOREOGRAPHY[0].statement,
  description:
    "This is where the signal becomes personal. Your identity, exact birth coordinates, archive record, and reading language establish the conditions through which the rest of the signature can be understood.",
  technicalLabels: [
    "SAMPLE RECEIVER RECORD: INITIALIZED",
    "ILLUSTRATIVE SEAL: GENERATED",
  ],
} as const;

export const TETRADIC_FINAL_OFFER = {
  eyebrow: "LIMITED FOUNDER-CURATED EDITIONS",
  headline: ["RECEIVE YOUR", "TETRADIC SIGNATURE"],
  description:
    "A founder-curated reading of the resonance architecture encoded at your exact moment of arrival.",
  trust:
    "Created individually. Never assembled from a generic personality template.",
} as const;
