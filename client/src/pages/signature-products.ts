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
    title: "THE TETRADIC SIGNATURE — FOUNDER EDITION",
    subtitle: "Your Resonance Architecture",
    price: "€81,32",
    priceNote: "Founder Edition",
    pages: "48-page Founder Edition",
    detailPath: "/tetradic-signature",
    coverSrc: "/oriel-founding-signature-letter.png",
    coverAlt: "THE TETRADIC SIGNATURE — FOUNDER EDITION cover artwork",
    description:
      "A 48-page founder-curated reading anchored in your exact birth record and two present questions, personally prepared and emailed within 5 calendar days after confirmed payment.",
    heroLead:
      "Your Resonance Architecture, calculated from your birth coordinates and interpreted personally through twelve tetradic relationships.",
    points: [
      "12 tetradic fields across 48 authored pages",
      "Exact birth-coordinate calculation",
      "Two personal questions held in the interpretation",
      "Founder-curated synthesis and integration",
    ],
    deliverables: [
      "THE TETRADIC SIGNATURE — FOUNDER EDITION",
      "48 personally authored pages",
      "Twelve four-page Tetrads",
      "Conscious and design timing architecture",
      "64-codon and four-facet precision register",
      "Eight-center and 32 resonance links",
      "Founder interpretation of both submitted questions",
      "Personal delivery by email within 5 calendar days",
    ],
    bestFor: [
      "People who feel they are at a threshold",
      "Those who want to understand their deeper architecture",
      "Souls drawn to resonance, symbolic systems, and consciousness",
      "Anyone who wants a personal map, not a generic reading",
      "Seekers ready to see their shadow and gift patterns clearly",
    ],
    processSteps: [
      "Sign in and save your birth date, birth time, birth location, and two questions.",
      "Continue through the secured checkpoint to PayPal.",
      "PayPal confirmation places the receiver record in the founder’s admin archive automatically.",
      "Your 48-page Founder Edition is prepared personally and emailed within 5 calendar days.",
    ],
    descriptionSections: [
      {
        heading: "What it is",
        body: "THE TETRADIC SIGNATURE — FOUNDER EDITION is a manually interpreted reading shaped through the ORIEL Signal framework. It is not assembled or delivered automatically by the website.",
      },
      {
        heading: "What it contains",
        body: "Twelve Tetrads across exactly 48 pages: your two timings, codon and facet field, center and link architecture, identity synthesis, shadow and gift dynamics, somatic practice, and closing archive seal.",
      },
      {
        heading: "How it is delivered",
        body: "After PayPal confirms the €81,32 payment, your saved receiver record enters the founder’s private admin workflow. The completed edition is sent personally to your account email within 5 calendar days.",
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
