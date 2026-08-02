/**
 * Editorial structure for The Tetradic Signature — Founder Edition.
 * Source: THE_TETRADIC_SIGNATURE_MASTER_FLATPLAN_V2.md
 * Authored prose is not yet written; this is the governing map only.
 */

export const TETRADIC_BOOK_META = {
  title: "The Tetradic Signature",
  subtitle: "Your Resonance Architecture",
  edition: "Founder Edition",
  corePages: 48,
  tetradCount: 12,
  pagesPerTetrad: 4,
  physicalInterior: 52,
  price: "€81.32",
  priceNote: "Founder Edition",
  delivery:
    "48-page Founder Edition · delivered personally by email within 5 calendar days",
  purchaseHref: "/tetradic-signature#founder-intake",
  purchaseLabel: "Buy",
} as const;

export const TETRADIC_PAGE_GRAMMAR = [
  {
    role: "A" as const,
    name: "Ceremonial Plate",
    ground: "Obsidian",
    purpose: "Encounter the structure before it is explained",
    copy: "No prose",
  },
  {
    role: "B" as const,
    name: "Interpretation",
    ground: "Warm ivory",
    purpose: "Name and interpret the dominant relationship",
    copy: "190–260 words",
  },
  {
    role: "C" as const,
    name: "Reflection + Evidence",
    ground: "Warm ivory",
    purpose: "Ground the reading in personal evidence and lived tension",
    copy: "120–190 words",
  },
  {
    role: "D" as const,
    name: "Closing Insight",
    ground: "Obsidian",
    purpose: "Distill the Tetrad into one exact residue",
    copy: "20–60 words",
  },
] as const;

export type TetradicBookPageRole = (typeof TETRADIC_PAGE_GRAMMAR)[number]["role"];

export type TetradicBookPage = Readonly<{
  contentPage: number;
  physicalPage: number;
  role: TetradicBookPageRole;
  title: string;
  function: string;
}>;

export type TetradicBookTetrad = Readonly<{
  number: number;
  numberLabel: string;
  title: string;
  purpose: string;
  pages: readonly TetradicBookPage[];
}>;

export const TETRADIC_BOOK_TETRADS: readonly TetradicBookTetrad[] = [
  {
    number: 1,
    numberLabel: "01",
    title: "The Threshold",
    purpose:
      "Establish whose artifact this is, what kind of knowledge it contains, and the limits of its claims.",
    pages: [
      {
        contentPage: 1,
        physicalPage: 4,
        role: "A",
        title: "The Threshold",
        function: "Present the personal seal as the first encounter with the signature.",
      },
      {
        contentPage: 2,
        physicalPage: 5,
        role: "B",
        title: "The Receiver Record",
        function:
          "Identify the receiver and introduce the signature as a calculated personal architecture.",
      },
      {
        contentPage: 3,
        physicalPage: 6,
        role: "C",
        title: "How This Artifact Speaks",
        function:
          "Explain signal, interpretation, evidence, uncertainty, and symbolic language without becoming a user manual.",
      },
      {
        contentPage: 4,
        physicalPage: 7,
        role: "D",
        title: "Before Interpretation",
        function:
          "Establish that the book observes a structure; it does not prescribe an identity.",
      },
    ],
  },
  {
    number: 2,
    numberLabel: "02",
    title: "The Whole Architecture",
    purpose:
      "Give the reader a coherent first view of the complete pattern before entering its components.",
    pages: [
      {
        contentPage: 5,
        physicalPage: 8,
        role: "A",
        title: "The Whole Architecture",
        function: "Reveal the complete system as one ordered object.",
      },
      {
        contentPage: 6,
        physicalPage: 9,
        role: "B",
        title: "Your Architecture in One Breath",
        function:
          "State the primary role, dominant pattern, central tension, stable resource, and integration direction in a continuous reading.",
      },
      {
        contentPage: 7,
        physicalPage: 10,
        role: "C",
        title: "The Central Contradiction",
        function:
          "Connect the calculated whole to the receiver’s stated life contradiction without reducing either to a diagnosis.",
      },
      {
        contentPage: 8,
        physicalPage: 11,
        role: "D",
        title: "The Governing Principle",
        function: "Distill the one relationship that organizes the rest of the book.",
      },
    ],
  },
  {
    number: 3,
    numberLabel: "03",
    title: "The Two Timings",
    purpose:
      "Show why the signature contains two astronomical moments and what each lens contributes.",
    pages: [
      {
        contentPage: 9,
        physicalPage: 12,
        role: "A",
        title: "Two Timings, One Architecture",
        function: "Render two related moments as one divided but continuous structure.",
      },
      {
        contentPage: 10,
        physicalPage: 13,
        role: "B",
        title: "The Conscious Sky and the 88-Degree Descent",
        function:
          "Explain the birth layer, design layer, and exact solar-longitude search in quiet, intelligible language.",
      },
      {
        contentPage: 11,
        physicalPage: 14,
        role: "C",
        title: "Mind and Body in Mirror",
        function:
          "Reveal repetitions, agreements, and tensions between Conscious and Design activations.",
      },
      {
        contentPage: 12,
        physicalPage: 15,
        role: "D",
        title: "What Time Divides",
        function:
          "Distill the significance of two timing lenses without making a scientific claim about personality.",
      },
    ],
  },
  {
    number: 4,
    numberLabel: "04",
    title: "The 64-Codon Field",
    purpose:
      "Locate the receiver’s activations inside the full 64-part interpretive field.",
    pages: [
      {
        contentPage: 13,
        physicalPage: 16,
        role: "A",
        title: "The 64-Codon Field",
        function:
          "Present the full field and the activated regions as a single ceremonial geometry.",
      },
      {
        contentPage: 14,
        physicalPage: 17,
        role: "B",
        title: "Where Your Signal Concentrates",
        function: "Explain dominant regions, repetitions, oppositions, and clusters.",
      },
      {
        contentPage: 15,
        physicalPage: 18,
        role: "C",
        title: "Convergence Fields",
        function:
          "Show where Conscious and Design activations reinforce, complicate, or redirect one another.",
      },
      {
        contentPage: 16,
        physicalPage: 19,
        role: "D",
        title: "The Field Is Not Uniform",
        function:
          "Leave the reader with the idea that emphasis, not mere presence, creates the signature.",
      },
    ],
  },
  {
    number: 5,
    numberLabel: "05",
    title: "The Eight Centers",
    purpose:
      "Explain where signal behaves as stable structure and where it remains receptive.",
    pages: [
      {
        contentPage: 17,
        physicalPage: 20,
        role: "A",
        title: "The Eight-Center Architecture",
        function: "Present the center system as an abstract architectural body.",
      },
      {
        contentPage: 18,
        physicalPage: 21,
        role: "B",
        title: "Pillars and Antennas",
        function:
          "Interpret defined and open centers as different modes of signal behavior, not strengths and weaknesses.",
      },
      {
        contentPage: 19,
        physicalPage: 22,
        role: "C",
        title: "Where Pressure Collects",
        function:
          "Connect stable, receptive, and bottleneck regions to the receiver’s reported contradiction.",
      },
      {
        contentPage: 20,
        physicalPage: 23,
        role: "D",
        title: "Stability Is Not Superiority",
        function: "Distill the difference between consistency and sensitivity.",
      },
    ],
  },
  {
    number: 6,
    numberLabel: "06",
    title: "Resonance Circuitry",
    purpose:
      "Reveal how the centers communicate and where movement becomes interrupted, redirected, or expressed.",
    pages: [
      {
        contentPage: 21,
        physicalPage: 24,
        role: "A",
        title: "The Active Link Network",
        function:
          "Show only the receiver’s completed resonance links as one spatial structure.",
      },
      {
        contentPage: 22,
        physicalPage: 25,
        role: "B",
        title: "How Signal Travels",
        function:
          "Interpret the most consequential active links and their combined movement.",
      },
      {
        contentPage: 23,
        physicalPage: 26,
        role: "C",
        title: "The Structural Bottleneck",
        function:
          "Identify the strongest interruption, unexpressed path, or recurrent redirection and expose the supporting evidence.",
      },
      {
        contentPage: 24,
        physicalPage: 27,
        role: "D",
        title: "Interruption Has a Shape",
        function:
          "Distill the bottleneck as an observable structure rather than a personal failure.",
      },
    ],
  },
  {
    number: 7,
    numberLabel: "07",
    title: "Conscious Activation Atlas",
    purpose:
      "Read all 13 Conscious activations as one coherent constellation while preserving planetary specificity.",
    pages: [
      {
        contentPage: 25,
        physicalPage: 28,
        role: "A",
        title: "The Conscious Constellation",
        function: "Render the 13 Conscious activations as a single weighted portrait.",
      },
      {
        contentPage: 26,
        physicalPage: 29,
        role: "B",
        title: "Identity, Ground and Direction",
        function:
          "Interpret Sun, Earth, Moon, and Nodes as the dominant conscious frame.",
      },
      {
        contentPage: 27,
        physicalPage: 30,
        role: "C",
        title: "Language, Value, Action and Scale",
        function:
          "Integrate Mercury through Pluto without generic planet keywords.",
      },
      {
        contentPage: 28,
        physicalPage: 31,
        role: "D",
        title: "What the Mind Recognizes",
        function:
          "Distill the conscious layer as the portion of the architecture most available to narration.",
      },
    ],
  },
  {
    number: 8,
    numberLabel: "08",
    title: "Design Activation Atlas",
    purpose:
      "Read all 13 Design activations as bodily or pre-reflective pattern without claiming biological determinism.",
    pages: [
      {
        contentPage: 29,
        physicalPage: 32,
        role: "A",
        title: "The Design Constellation",
        function:
          "Render the 13 Design activations as a related but materially distinct weighted portrait.",
      },
      {
        contentPage: 30,
        physicalPage: 33,
        role: "B",
        title: "The Pattern Beneath Narration",
        function:
          "Interpret Design Sun, Earth, Moon, and Nodes as recurring pattern experienced before explanation.",
      },
      {
        contentPage: 31,
        physicalPage: 34,
        role: "C",
        title: "Impulse, Attraction and Deep Pattern",
        function:
          "Integrate the remaining Design activations and compare them with conscious repetitions.",
      },
      {
        contentPage: 32,
        physicalPage: 35,
        role: "D",
        title: "What the Body Repeats",
        function:
          "Distill the Design layer without presenting it as fate or hidden truth superior to conscious experience.",
      },
    ],
  },
  {
    number: 9,
    numberLabel: "09",
    title: "Identity Synthesis",
    purpose:
      "Derive the primary and secondary resonance roles from the full weighted architecture.",
    pages: [
      {
        contentPage: 33,
        physicalPage: 36,
        role: "A",
        title: "The Fractal Role",
        function: "Give the dominant role a non-figurative architectural form.",
      },
      {
        contentPage: 34,
        physicalPage: 37,
        role: "B",
        title: "The Primary Resonance Role",
        function:
          "Explain the network function of the dominant cluster and how it tends to organize perception or response.",
      },
      {
        contentPage: 35,
        physicalPage: 38,
        role: "C",
        title: "The Secondary Pattern",
        function:
          "Show how the balancing role supports, moderates, or competes with the primary role, especially within the stated contradiction.",
      },
      {
        contentPage: 36,
        physicalPage: 39,
        role: "D",
        title: "Identity Is a Relationship",
        function:
          "Distill role as a dynamic between patterns, not a label applied to a person.",
      },
    ],
  },
  {
    number: 10,
    numberLabel: "10",
    title: "Interference and Coherence",
    purpose:
      "Examine how the same architecture appears under pressure and under conditions of greater internal agreement.",
    pages: [
      {
        contentPage: 37,
        physicalPage: 40,
        role: "A",
        title: "The Interference Portrait",
        function:
          "Render the highest-weight distortions as displacement within the existing personal seal.",
      },
      {
        contentPage: 38,
        physicalPage: 41,
        role: "B",
        title: "How Interference Enters",
        function:
          "Describe the conditions, pressures, and sequence through which contradiction becomes visible.",
      },
      {
        contentPage: 39,
        physicalPage: 42,
        role: "C",
        title: "The Coherent Counterpart",
        function:
          "Show how the identical architecture behaves when its parts are not competing for expression; include confidence and limits.",
      },
      {
        contentPage: 40,
        physicalPage: 43,
        role: "D",
        title: "Nothing New Is Added",
        function:
          "Distill coherence as a changed relationship among existing parts, not an upgraded self.",
      },
    ],
  },
  {
    number: 11,
    numberLabel: "11",
    title: "The Lived Signal",
    purpose:
      "Translate the reading into observable life conditions without becoming a coaching programme.",
    pages: [
      {
        contentPage: 41,
        physicalPage: 44,
        role: "A",
        title: "The Lived Field",
        function: "Depict architecture meeting environment, tempo, and contact.",
      },
      {
        contentPage: 42,
        physicalPage: 45,
        role: "B",
        title: "Conditions of Clarity",
        function:
          "Describe the environments, pacing, sensory conditions, and relational contexts in which the signature is easier to perceive.",
      },
      {
        contentPage: 43,
        physicalPage: 46,
        role: "C",
        title: "Recognition in Real Time",
        function:
          "Offer observable markers of alignment and distortion in decisions without prescribing a timed challenge or corrective routine.",
      },
      {
        contentPage: 44,
        physicalPage: 47,
        role: "D",
        title: "Observation Before Correction",
        function:
          "Leave the reader with a non-prescriptive relation to the architecture.",
      },
    ],
  },
  {
    number: 12,
    numberLabel: "12",
    title: "Integration and Archive",
    purpose:
      "Reassemble the twelve-part reading into a final founder synthesis and close the artifact with verifiable provenance.",
    pages: [
      {
        contentPage: 45,
        physicalPage: 48,
        role: "A",
        title: "The Integrated Seal",
        function: "Present the personal architecture in its final, most reduced form.",
      },
      {
        contentPage: 46,
        physicalPage: 49,
        role: "B",
        title: "The Founder’s Synthesis",
        function:
          "Deliver the chart-specific reading of the central contradiction, hidden advantage, and relationship between conscious and design layers.",
      },
      {
        contentPage: 47,
        physicalPage: 50,
        role: "C",
        title: "What Remains Open",
        function:
          "State what is strongly supported, what remains interpretive, what should be observed over time, and what could revise the reading.",
      },
      {
        contentPage: 48,
        physicalPage: 51,
        role: "D",
        title: "The Archive Seal",
        function:
          "Close with the immutable archive identity and one final ORIEL observation.",
      },
    ],
  },
] as const;

export const TETRADIC_BOOK_FRONT_MATTER = {
  opening: {
    eyebrow: "ORIEL SIGNAL ARCHIVE",
    verse: ["You were not born at random.", "You were inscribed."],
    body: "A founder-curated personal reading of the resonance architecture encoded at your exact moment of arrival — calculation as evidence, editorial interpretation as pattern, design as the form that can be encountered without noise.",
  },
  grammarNote:
    "Twelve Tetrads. Each Tetrad is four pages — two facing spreads. Plate, interpretation, evidence, insight. Always the same grammar.",
  closing: {
    heading: "Twelve fields. One architecture.",
    body: "The manuscript is calculated from your birth record, curated by the founder, and sealed as a personal archive object — not a generic reading and not a workbook.",
  },
} as const;
