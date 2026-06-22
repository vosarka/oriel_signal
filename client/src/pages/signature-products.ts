export type SignatureProductType = "founding";

export type SignatureProduct = {
  type: SignatureProductType;
  title: string;
  subtitle?: string;
  price: string;
  priceNote: string;
  pages: string;
  detailPath: string;
  coverSrc: string;
  coverAlt: string;
  description: string;
  heroLead: string;
  points: string[];
  deliverables: string[];
  bestFor: string[];
  processSteps: string[];
  descriptionSections: { heading: string; body: string }[];
};

export const signatureProducts: SignatureProduct[] = [
  {
    type: "founding",
    title: "ORIEL Founder’s Vision Blueprint",
    subtitle: "Your Quantum Architecture",
    price: "€97",
    priceNote: "Founder Launch Price",
    pages: "15–20 page curated blueprint PDF",
    detailPath: "/founder-signature-blueprint",
    coverSrc: "/oriel-founding-signature-letter.png",
    coverAlt: "ORIEL Founder’s Vision Blueprint — cover artwork",
    description:
      "A founder-led Static Signature reading through the Oriel Signal archive — created as a 15–20 page personal codex revealing your resonance structure, shadow mechanics, active codons, and integration path.",
    heroLead:
      "A founder-led Static Signature reading through the Oriel Signal archive — created as a 15–20 page personal codex revealing your resonance structure, shadow mechanics, active codons, and integration path.",
    points: [
      "Static Signature architecture",
      "Dominant and supporting Codons",
      "Shadow and Gift frequency framing",
      "Founder-led integration path",
    ],
    deliverables: [
      "Your Static Signature — core resonance architecture",
      "Dominant Codons and supporting codon field",
      "Four Facet expression layers (somatic, relational, cognitive, transpersonal)",
      "Shadow Mechanics — where distortion and friction appear",
      "Gift Frequency — the coherent expression beneath the shadow",
      "Somatic Signals and Integration Path",
      "Founder Interpretation — closing transmission through the founder’s lens",
      "15–20 page PDF delivered by email",
      "One follow-up clarification email",
    ],
    bestFor: [
      "People who feel they are at a threshold",
      "Those who want to understand their deeper architecture",
      "Souls drawn to resonance, symbolic systems, and consciousness",
      "Anyone who wants a personal map, not a generic reading",
      "Seekers ready to see their shadow and gift patterns clearly",
    ],
    processSteps: [
      "Request the Blueprint and complete the payment.",
      "Receive the intake form with birth details and current life question.",
      "The founder interprets your Static Signature through the Oriel Signal archive.",
      "Your personalized 15–20 page PDF is delivered by email within 3–7 days.",
    ],
    descriptionSections: [
      {
        heading: "What it is",
        body: "The Founder’s Vision Blueprint is a manually interpreted reading, shaped through the Oriel Signal framework and translated into a personal document designed for recognition, integration, and activation. This is not an automated personality summary — it is a founder-led codex.",
      },
      {
        heading: "What it contains",
        body: "Your full Static Signature: centers, codons, resonance links, facet expressions, shadow/gift framing, somatic signals, an integration path, and a closing Founder Transmission written through the founder’s interpretive lens.",
      },
      {
        heading: "How to use it",
        body: "Treat it like a working manual. Read it slowly, mark what feels accurate, challenge what does not, and test the correction protocols in lived experience. The value is in repeated contact over time, not one dramatic reading.",
      },
    ],
  },
];

export function getSignatureProductByType(type: SignatureProductType) {
  const product = signatureProducts.find(item => item.type === type);
  if (!product) {
    throw new Error(`Unknown signature product: ${type}`);
  }
  return product;
}