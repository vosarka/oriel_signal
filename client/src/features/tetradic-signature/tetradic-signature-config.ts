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
  viewportSvh: 100,
  heightSvh: MASTER_TIMELINE_SVH + 100,
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

function chapterMotionRange(start: number, end: number) {
  return { start, end } as const;
}

/**
 * Chapter-local motion beats for the coded Tetrads. The four phases are
 * intentionally chapter-specific consumers (activation groups, identity
 * states, practice states, and so on), while camera/path/imprint remain
 * normalized so every result is deterministic in both scroll directions.
 */
export const TETRADIC_LATER_MOTION = [
  {
    number: 4,
    phases: [
      chapterMotionRange(0.14, 0.26),
      chapterMotionRange(0.22, 0.36),
      chapterMotionRange(0.32, 0.46),
      chapterMotionRange(0.42, 0.56),
    ],
    cameraTravel: chapterMotionRange(0.14, 0.36),
    path: chapterMotionRange(0.14, 0.54),
    imprint: chapterMotionRange(1, 1),
    breathWindow: chapterMotionRange(1, 1),
    breathCycles: 0,
    snapStates: [],
  },
  {
    number: 5,
    phases: [
      chapterMotionRange(0.12, 0.24),
      chapterMotionRange(0.22, 0.34),
      chapterMotionRange(0.32, 0.44),
      chapterMotionRange(0.42, 0.56),
    ],
    cameraTravel: chapterMotionRange(0.14, 0.36),
    path: chapterMotionRange(0.14, 0.56),
    imprint: chapterMotionRange(1, 1),
    breathWindow: chapterMotionRange(1, 1),
    breathCycles: 0,
    snapStates: [],
  },
  {
    number: 6,
    phases: [
      chapterMotionRange(0.14, 0.26),
      chapterMotionRange(0.22, 0.34),
      chapterMotionRange(0.3, 0.44),
      chapterMotionRange(0.42, 0.56),
    ],
    cameraTravel: chapterMotionRange(0.14, 0.36),
    path: chapterMotionRange(0.16, 0.56),
    imprint: chapterMotionRange(1, 1),
    breathWindow: chapterMotionRange(1, 1),
    breathCycles: 0,
    snapStates: [],
  },
  {
    number: 7,
    phases: [
      chapterMotionRange(0.14, 0.24),
      chapterMotionRange(0.22, 0.34),
      chapterMotionRange(0.32, 0.44),
      chapterMotionRange(0.42, 0.56),
    ],
    cameraTravel: chapterMotionRange(0.14, 0.36),
    path: chapterMotionRange(0.14, 0.56),
    imprint: chapterMotionRange(1, 1),
    breathWindow: chapterMotionRange(1, 1),
    breathCycles: 0,
    snapStates: [],
  },
  {
    number: 8,
    phases: [
      chapterMotionRange(0.14, 0.24),
      chapterMotionRange(0.22, 0.34),
      chapterMotionRange(0.32, 0.44),
      chapterMotionRange(0.42, 0.56),
    ],
    cameraTravel: chapterMotionRange(0.14, 0.36),
    path: chapterMotionRange(0.14, 0.56),
    imprint: chapterMotionRange(1, 1),
    breathWindow: chapterMotionRange(1, 1),
    breathCycles: 0,
    snapStates: [],
  },
  {
    number: 9,
    phases: [
      chapterMotionRange(0.14, 0.26),
      chapterMotionRange(0.24, 0.36),
      chapterMotionRange(0.34, 0.48),
      chapterMotionRange(0.46, 0.6),
    ],
    cameraTravel: chapterMotionRange(0.14, 0.34),
    path: chapterMotionRange(0.14, 0.58),
    imprint: chapterMotionRange(1, 1),
    breathWindow: chapterMotionRange(1, 1),
    breathCycles: 0,
    snapStates: [0.24, 0.36, 0.48, 0.6],
  },
  {
    number: 10,
    phases: [
      chapterMotionRange(0.14, 0.26),
      chapterMotionRange(0.22, 0.36),
      chapterMotionRange(0.32, 0.46),
      chapterMotionRange(0.42, 0.58),
    ],
    cameraTravel: chapterMotionRange(0.14, 0.34),
    path: chapterMotionRange(0.14, 0.58),
    imprint: chapterMotionRange(1, 1),
    breathWindow: chapterMotionRange(1, 1),
    breathCycles: 0,
    snapStates: [],
  },
  {
    number: 11,
    phases: [
      chapterMotionRange(0.14, 0.26),
      chapterMotionRange(0.24, 0.36),
      chapterMotionRange(0.34, 0.48),
      chapterMotionRange(0.46, 0.6),
    ],
    cameraTravel: chapterMotionRange(0.14, 0.36),
    path: chapterMotionRange(0.14, 0.58),
    imprint: chapterMotionRange(1, 1),
    breathWindow: chapterMotionRange(0.2, 0.62),
    breathCycles: 2,
    snapStates: [0.24, 0.36, 0.48, 0.6],
  },
  {
    number: 12,
    phases: [
      chapterMotionRange(0.14, 0.26),
      chapterMotionRange(0.22, 0.36),
      chapterMotionRange(0.32, 0.46),
      chapterMotionRange(0.42, 0.6),
    ],
    cameraTravel: chapterMotionRange(0.14, 0.36),
    path: chapterMotionRange(0.14, 0.58),
    imprint: chapterMotionRange(0.18, 0.56),
    breathWindow: chapterMotionRange(1, 1),
    breathCycles: 0,
    snapStates: [],
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
    generateSignatureRoute: "/founder-signature-blueprint",
    generateSignatureStatus: "ROUTED_TO_FOUNDER_BLUEPRINT",
    secondaryRoute: null as string | null,
  },
  animation: {
    timeline: TETRADIC_TIMELINE,
    choreography: TETRADIC_CHOREOGRAPHY,
    laterMotion: TETRADIC_LATER_MOTION,
    chapters: {
      revelation: timelineRange(8, 36),
      approach: timelineRange(24, 54),
      orientation: timelineRange(32, 56),
      opening: timelineRange(64, 110),
      tetradOne: timelineRange(110, TETRAD_ONE_CORE.endSvh),
      finalClosure: TETRADIC_CHOREOGRAPHY[11].transitionOut.range,
    },
    narratives: {
      cover: {
        start: 2 / MASTER_TIMELINE_SVH,
        fadeInEnd: 10 / MASTER_TIMELINE_SVH,
        fadeOutStart: 30 / MASTER_TIMELINE_SVH,
        end: 44 / MASTER_TIMELINE_SVH,
      },
      cta: {
        start: 2390 / MASTER_TIMELINE_SVH,
        fadeInEnd: 2398 / MASTER_TIMELINE_SVH,
        fadeOutStart: 1,
        end: 1.000001,
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
        withdrawal: { start: 0.84, end: 0.96 },
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
      laterChapter: {
        settle: { start: 0, end: 0.18 },
        title: { start: 0.24, end: 0.36 },
        statement: { start: 0.32, end: 0.44 },
        visual: { start: 0.18, end: 0.72 },
        inspection: { start: 0.44, end: 0.8 },
        withdrawal: { start: 0.8, end: 0.88 },
        pageLift: { start: 0.9, end: 1 },
      },
      finalChapter: {
        settle: { start: 0, end: 0.18 },
        title: { start: 0.24, end: 0.36 },
        statement: { start: 0.32, end: 0.44 },
        visual: { start: 0.18, end: 0.58 },
        inspection: { start: 0.44, end: 0.9 },
        withdrawal: { start: 0.9, end: 1 },
        pageLift: { start: 1, end: 1 },
      },
      laterTransition: {
        anticipation: { start: 0, end: 0.1 },
        pageLift: { start: 0.08, end: 0.18 },
        pageTurn: { start: 0.14, end: 0.68 },
        spreadSwap: { start: 0.48, end: 0.5 },
        pageSettle: { start: 0.68, end: 0.82 },
        visualTransform: { start: 0.3, end: 0.88 },
      },
      finalClosure: {
        synthesis: { start: 0.24, end: 0.46 },
        synthesisTitle: { start: 0.08, end: 0.3 },
        bookClose: { start: 0.38, end: 0.72 },
        cameraPullback: { start: 0.3, end: 0.82 },
        settle: { start: 0.7, end: 0.86 },
        halo: { start: 0.28, end: 0.72 },
        markers: { start: 0.48, end: 0.78 },
        cta: { start: 0.86, end: 0.98 },
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
    exploreSample: { startProgress: 0, endProgress: 1 },
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
        laterDesktop: [
          { x: 0, y: 6.4, z: 5.5, fov: 29 },
          { x: 0, y: 5.75, z: 6.2, fov: 30.5 },
          { x: 0.22, y: 5.35, z: 6.1, fov: 30 },
          { x: -0.35, y: 5.4, z: 6.35, fov: 31 },
          { x: -0.35, y: 5.3, z: -6.25, fov: 31 },
          { x: 0, y: 5.6, z: 6.15, fov: 30 },
          { x: 0, y: 5.45, z: 6.05, fov: 29.5 },
          { x: 0, y: 5.2, z: 6.6, fov: 32.5 },
          { x: 0, y: 6.75, z: 4.9, fov: 30 },
        ],
        laterCompact: [
          { x: 0, y: 6.55, z: 8.2, fov: 38 },
          { x: 0, y: 6.25, z: 8.45, fov: 38.5 },
          { x: 0.08, y: 6.15, z: 8.35, fov: 38 },
          { x: -0.1, y: 6.2, z: 8.4, fov: 38.5 },
          { x: -0.1, y: 6.2, z: -8.4, fov: 38.5 },
          { x: 0, y: 6.3, z: 8.35, fov: 38 },
          { x: 0, y: 6.25, z: 8.3, fov: 38 },
          { x: 0, y: 6.05, z: 8.55, fov: 39 },
          { x: 0, y: 6.75, z: 7.9, fov: 38 },
        ],
        closureDesktop: { x: 0, y: 5.7, z: 8.2, fov: 35 },
        closureCompact: { x: 0, y: 6.2, z: 9.25, fov: 41 },
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
  productDetails: [
    "12 tetradic fields",
    "48-page Founder Edition",
    "Exact conscious and design calculations",
    "64-codon architecture",
    "Eight-center and circuitry mapping",
    "Founder-curated synthesis",
    "Calculation and calibration audit",
  ],
  trust:
    "Created individually. Never assembled from a generic personality template.",
} as const;

export const TETRADIC_SYNTHESIS = {
  headline: ["TWELVE FIELDS.", "ONE ARCHITECTURE."],
  copy: [
    "Your signature is not contained in any single diagram.",
    "It exists in the relationship between timing, activation, structure, tension, embodiment and integration.",
  ],
  technicalLabel: "FOUNDER CURATION LAYER: COMPLETE",
} as const;

export const TETRADIC_SPREAD_CONTENT = [
  {
    number: 1,
    title: "THE THRESHOLD",
    technicalLabels: ["RECEIVER RECORD: INITIALIZED", "ARCHIVE SEAL: SAMPLE"],
    semanticDescription:
      "A redacted receiver record connects the sample Archive ID to a 64-segment sample archive seal.",
  },
  {
    number: 2,
    title: "THE WHOLE ARCHITECTURE",
    technicalLabels: ["SYSTEM VIEW: COMPLETE", "SAMPLE FIELD: ILLUSTRATIVE"],
    semanticDescription:
      "A complete system view aligns the codon field, eight-center array, links and weighted signal layers.",
  },
  {
    number: 3,
    title: "THE TWO TIMINGS",
    technicalLabels: ["TEMPORAL LAYERS: 02", "PUBLIC SAMPLE: UNVERIFIED"],
    semanticDescription:
      "A four-state timeline explains the conscious birth sky, exact 88-degree solar descent method, mirrored Design layer and public-sample integrity notice.",
  },
  {
    number: 4,
    title: "THE MANDALA",
    technicalLabels: ["CODON FIELD: 64", "RECEIVER ACTIVATIONS: REDACTED"],
    semanticDescription:
      "The canonical 64-position Mandala demonstrates Conscious, Design and convergence layer logic without assigning receiver activations.",
  },
  {
    number: 5,
    title: "THE EIGHT CENTERS",
    technicalLabels: ["CENTERS: 08", "DEFINED / OPEN STATES: REDACTED"],
    semanticDescription:
      "The canonical eight-center body architecture is shown from crown to root while receiver definition states remain withheld.",
  },
  {
    number: 6,
    title: "THE CIRCUITRY",
    technicalLabels: ["RESONANCE LINKS: 32", "ACTIVE LINKS: REDACTED"],
    semanticDescription:
      "A canonical Resonance Link network demonstrates the mechanics of direction, flow and interruption without assigning receiver links or a bottleneck.",
  },
  {
    number: 7,
    title: "CONSCIOUS ACTIVATION ATLAS",
    technicalLabels: ["LAYER: CONSCIOUS", "POSITIONS: REDACTED SAMPLE"],
    semanticDescription:
      "A warm-gold atlas organizes the Conscious Sun and Earth, Moon and Nodes, inner planets and outer planets without invented positions.",
  },
  {
    number: 8,
    title: "DESIGN ACTIVATION ATLAS",
    technicalLabels: ["LAYER: DESIGN", "POSITIONS: REDACTED SAMPLE"],
    semanticDescription:
      "A cool, mirrored atlas organizes the Design planetary groups as a somatic layer beneath the page surface.",
  },
  {
    number: 9,
    title: "IDENTITY SYNTHESIS",
    technicalLabels: ["ROLE FIELD: REDACTED", "SYNTHESIS LOGIC: DEMONSTRATED"],
    semanticDescription:
      "Primary and secondary sample structures converge into a single identity synthesis seal without claiming a calculated role.",
  },
  {
    number: 10,
    title: "SHADOW AND GIFT",
    technicalLabels: [
      "INTERFERENCE: UNASSIGNED",
      "COHERENCE PATH: DEMONSTRATED",
    ],
    semanticDescription:
      "One continuous geometry moves from restrained fracture and interference toward coherent integration.",
  },
  {
    number: 11,
    title: "SOMATIC PRACTICE",
    technicalLabels: ["PROTOCOLS: 03", "CALIBRATION WINDOW: 48H"],
    semanticDescription:
      "Three observation protocols connect to a readable zero, twenty-four and forty-eight-hour calibration path.",
  },
  {
    number: 12,
    title: "INTEGRATION AND SEAL",
    technicalLabels: ["OBSERVATION FIELD: 07D", "INTEGRATION ORBIT: 30D"],
    semanticDescription:
      "A seven-day observation field and thirty-day integration orbit surround the reusable sample archive seal and Founder synthesis area.",
  },
] as const;

/** Two-Timings fidelity labels for the Tetrad 03 horizontal audit track. */
export const TETRAD_THREE_TIMING_STATES = [
  {
    code: "01 / T_BIRTH",
    title: "CONSCIOUS SUN",
    detail: "GEOCENTRIC TROPICAL LONGITUDE AT ARRIVAL",
  },
  {
    code: "02 / SOLAR ARC",
    title: "88.0000°",
    detail: "RETROGRADE SEARCH — EXACTLY 88° BEHIND BIRTH SUN",
  },
  {
    code: "03 / T_DESIGN",
    title: "DESIGN LAYER",
    detail: "FULL CHART AT THE SOLVED DESIGN JULIAN DAY",
  },
  {
    code: "04 / SAMPLE INTEGRITY",
    title: "ILLUSTRATIVE ONLY",
    detail: "NO VERIFIED EPHEMERIS VALUES IN THIS PUBLIC SAMPLE",
  },
] as const;
