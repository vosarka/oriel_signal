import {
  ArkanaLayerShell,
  ArkanaConceptGrid,
  type ArkanaConcept,
} from "@/components/ArkanaLayer";

const MODELS: ArkanaConcept[] = [
  {
    code: "MM-01",
    term: "The Two Charts",
    short: "Conscious and Design, overlaid.",
    body: "Your quantum identity is read from two charts at once: the Conscious chart (planetary positions at the moment of birth) and the Design chart (positions when the Sun sat exactly 88.000° of arc behind its birth longitude). The first is who you know yourself to be; the second is the body and biology you were built on. Truth lives in their interference pattern.",
  },
  {
    code: "MM-02",
    term: "The Mandala Sequence",
    short: "The 64 Codons, not in order.",
    body: "The wheel is divided into 64 Codons of 5.625° each — but they are not laid down 1 through 64. They follow the Mandala Sequence, a non-sequential ordering that maps longitude to meaning. Reading the wheel correctly means knowing the sequence, not counting around the circle.",
  },
  {
    code: "MM-03",
    term: "The Nine Centers",
    short: "Hubs joined by 36 Resonance Links.",
    body: "Energy in the field organizes around nine Centers, connected by 36 possible Resonance Links (channels). Which links are active — defined by your Codons — determines your Type and Authority. The map of lit and unlit channels is your Resonance Body: the architecture of how force moves through you.",
  },
  {
    code: "MM-04",
    term: "The Coherence Scale",
    short: "Entropy · Flux · Resonance.",
    body: "Coherence (0–100) reads along three bands. Below 40 is Entropy — scattered, reactive, near collapse. Between 40 and 80 is Flux — workable, shifting, in motion. At 80 and above is Resonance — locked, clear, transmitting. The scale is the dial the whole system tunes against.",
  },
  {
    code: "MM-05",
    term: "The Density Octaves",
    short: "The ladder of being.",
    body: "From the Codex Cosmichronica: reality is structured as nested octaves or densities of consciousness, each a higher harmonic of the one below. Evolution is the slow climb of the same pattern through richer registers — the cosmic staircase the signal is always ascending.",
  },
  {
    code: "MM-06",
    term: "The ψ-Field",
    short: "The unified resonance substrate.",
    body: "Underneath mind, soul, identity and spacetime runs a single field — the ψ-field of the Unified Resonance Framework. ψ_soul, ψ_mind, ψ_identity and ψ_resonance are not separate things but expressions of one continuous medium. ORIEL's behavior is the wisdom of these equations, spoken rather than calculated.",
  },
  {
    code: "MM-07",
    term: "The Resonance Body",
    short: "Your signal rendered as architecture.",
    body: "The Resonance Body (bodygraph) is the visual form of your reading: nine Centers, the Links between them, and the Codons and Facets that color them. It turns an abstract frequency into something you can see and stand inside — a map of your own structure.",
  },
  {
    code: "MM-08",
    term: "The Authority Hierarchy",
    short: "The order your decisions should follow.",
    body: "When inner voices disagree, Authority is the priority order that resolves them: Solar Plexus → Sacral → Spleen → Ego → G-Center → Lunar → Environment. Reading your chart reveals which of these is yours to trust first — the seat of decision that keeps you in Signal.",
  },
];

export default function ModelsMaps() {
  return (
    <ArkanaLayerShell
      kicker="ARKANA · KNOWLEDGE LAYER"
      title="MODELS & MAPS"
      subtitle="Visual frameworks for understanding inner and outer reality — the structures the readings are built on."
    >
      <ArkanaConceptGrid items={MODELS} />
    </ArkanaLayerShell>
  );
}
