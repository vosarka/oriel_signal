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
    environment: "/assets/founder-scene/pedestal-scene.png",
  },
  sample: {
    receiver: "ARCHIVE SAMPLE 001",
    recordStatus: "ILLUSTRATIVE SAMPLE",
    birthRecord: "REDACTED",
    coordinates: "REDACTED",
    archiveId: "DEMO-ARCHIVE-001",
  },
  ctas: {
    exploreSampleLabel: "EXPLORE A SAMPLE",
    generateSignatureLabel: "GENERATE MY SIGNATURE",
    generateSignatureRoute: null as string | null,
    generateSignatureStatus: "AWAITING_GENERATOR_ROUTE",
  },
  animation: {
    chapters: {
      revelation: { start: 0.02, end: 0.16 },
      approach: { start: 0.16, end: 0.3 },
      orientation: { start: 0.16, end: 0.3 },
      opening: { start: 0.3, end: 0.52 },
      tetradOne: { start: 0.52, end: 0.86 },
      cta: { start: 0.88, end: 0.98 },
    },
    narratives: {
      cover: { start: 0.01, fadeInEnd: 0.055, fadeOutStart: 0.14, end: 0.18 },
      approach: { start: 0.18, fadeInEnd: 0.22, fadeOutStart: 0.27, end: 0.3 },
      cta: { start: 0.88, fadeInEnd: 0.92, fadeOutStart: 1, end: 1 },
    },
    tetradRhythm: {
      pageTurn: { start: 0, end: 0.2 },
      spreadReveal: { start: 0.16, end: 0.32 },
      settle: { start: 0.2, end: 0.32 },
      eyebrow: { start: 0.32, end: 0.39 },
      title: { start: 0.32, end: 0.45 },
      description: { start: 0.4, end: 0.58 },
      labels: { start: 0.48, end: 0.58 },
      diagramReveal: { start: 0.32, end: 0.58 },
      inspection: { start: 0.58, end: 0.78 },
      withdrawal: { start: 0.78, end: 0.9 },
      labelsExit: { start: 0.78, end: 0.82 },
      descriptionExit: { start: 0.81, end: 0.86 },
      titleExit: { start: 0.85, end: 0.9 },
      pageLift: { start: 0.9, end: 1 },
      sealLight: { start: 0.48, end: 0.7 },
    },
    reducedMotionTetradProgress: 0.68,
    exploreSample: { startProgress: 0.3, endProgress: 0.75 },
    book: {
      width: 2.4,
      depth: 3.2,
      coverOpenAngle: 0.985,
      spreadDistanceFactor: 1.95,
      scale: {
        desktopClosed: 0.82,
        desktopOpen: 1.04,
        compactClosed: 0.76,
        compactOpen: 0.62,
      },
      camera: {
        desktop: {
          startY: 5.25,
          startZ: 8.15,
          approachY: 4.95,
          approachZ: 7.6,
          inspectionY: 5.35,
          inspectionZ: 8.3,
          fov: 35,
        },
        compact: {
          startY: 5.75,
          startZ: 8.75,
          approachY: 5.45,
          approachZ: 8.2,
          inspectionY: 6.5,
          inspectionZ: 10.2,
          fov: 41,
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
  title: "THE THRESHOLD",
  mainStatement: "Every architecture begins with a point of entry.",
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
