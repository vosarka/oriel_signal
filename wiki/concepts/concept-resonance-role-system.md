---
id: concept-resonance-role-system
type: concept
status: living
tags: [profile, roles, identity, resonance, codons, facets, static-signature, agent-critical]
last_updated: 2026-06-22
sources: 1
importance: critical
aliases: ["Resonance Roles", "16 Resonance Roles", "VOS Role System"]
---

# Resonance Role System

**The Resonance Role System** is the canonical identity layer for the Oriel Signal / Vos Arkana Profile.

It translates the user’s codon architecture (from the Static Signature) into one of **16 one-word archetypal Resonance Roles**.

> **Primary purpose:** Answer the question “What kind of resonance pattern does this user primarily carry?”

---

## ⚠️ AGENT DIRECTIVE — READ THIS FIRST

**This page defines the official identity/role system for Profiles.**

Any agent working on Profile, Bio-Architecture, Static Signature output, ORIEL narration, or user-facing identity features **must** follow these rules:

### Mandatory Constraints
- Use **only** the 16 roles listed on this page (no inventing new roles).
- Role names are **single word only** (Originator, Resonator, Articulator, etc.).
- **Never** use Human Design terms (Generator, Projector, Manifestor, Reflector, Type, Strategy, Profile lines, etc.).
- The Resonance Role System sits **on top of** the Static Signature — it does **not** replace Prime Stack, Centers, or codon data.
- Lumens are **symbolic only** in current MVP. Do not implement Lumens as gating, spending, or unlock mechanics.
- Always preserve the distinction between **Primary Resonance Role** and **Secondary Pattern**.
- Before changing role calculation logic, stop and reference this page + the source document.

**If you are modifying anything related to user identity, roles, or Profile display — you should be reading this page.**

---

## Relationship to Other Systems

- **Static Signature** → Provides the raw codon activations and clusters. The Resonance Role is **derived from** it.
- **Prime Stack** → The structural backbone. Roles are a higher-level interpretive layer.
- **Bio-Architecture** → Expected to incorporate Resonance Roles as part of the living identity model.
- **Profile / Receiver** → The Resonance Role is a primary displayed identity marker.
- **Facets** → Every role is modified by the active facet (Somatic / Relational / Cognitive / Transpersonal).


## When Agents Must Reference This Page

Read this page before doing any of the following:

- Designing or modifying the Profile page
- Building or changing Bio-Architecture features
- Generating ORIEL narration that includes user identity or "who they are"
- Working on role calculation logic
- Creating any UI that displays user archetype, type, or role
- Updating Static Signature output formatting
- Writing any agent instructions about identity or Profile

**Default action:** If the task involves user identity → read [[concept-resonance-role-system]] + [[entity-static-signature]] first.

## Core Principles

- Built on the existing 64-codon architecture (no 65th codon)
- One-word archetypal names only
- Must remain compatible with Static Signature, facets, centers, and Shadow/Gift/Siddhi spectrum
- Primary + optional Secondary Role
- Expresses through Personality and Design layers
- Modified by active Facet (Somatic, Relational, Cognitive, Transpersonal)
- Must never copy Human Design terminology or visual language

## The 16 Resonance Roles

### 1. Originator (RC01–RC04)
Initiates structure from raw potential.

**Gift:** originality, initiation, conceptual birth, first movement  
**Shadow:** instability, mental over-initiation, unfinished starts

### 2. Resonator (RC05–RC08)
Harmonizes rhythm, direction, and contribution.

**Gift:** rhythm, timing, harmony, contribution  
**Shadow:** impatience, conflict, misalignment

### 3. Articulator (RC09–RC12)
Converts signal into clear expression and form.

**Gift:** expression, focus, clear language, refinement of thought  
**Shadow:** vanity, mental pressure, over-explanation

### 4. Cultivator (RC13–RC16)
Develops memory, skill, and human refinement over time.

**Gift:** practice, development, skill, human warmth  
**Shadow:** stagnation, dullness, compromise

### 5. Clarifier (RC17–RC20)
Detects distortion and restores precision and presence.

**Gift:** clarity, correction, sensitivity, presence  
**Shadow:** judgment, dogmatism, over-analysis

### 6. Sovereign (RC21–RC24)
Holds inner command, authority, and integration.

**Gift:** authority, integration, grace, inner command  
**Shadow:** control, pride, misuse of influence

### 7. Guardian (RC25–RC28)
Protects spirit, care, purpose, and moral direction.

**Gift:** care, protection, purpose, universal acceptance  
**Shadow:** constriction, manipulation, existential struggle

### 8. Devotee (RC29–RC32)
Commits energy and maintains continuity of path.

**Gift:** devotion, consistency, emotional fuel, leadership continuity  
**Shadow:** half-heartedness, hunger, fear of failure

### 9. Transformer (RC33–RC36)
Metabolizes crisis, retreat, and change into renewal.

**Gift:** transformation, resilience, crisis intelligence  
**Shadow:** withdrawal, force, turbulence

### 10. Catalyst (RC37–RC40)
Activates dormant will and provokes movement.

**Gift:** activation, will, community pressure, courageous motion  
**Shadow:** provocation, exhaustion, struggle addiction

### 11. Oracle (RC41–RC44)
Receives imagination, insight, and hidden pattern memory.

**Gift:** insight, imagination, anticipation, pattern awareness  
**Shadow:** fantasy, interference, mental noise

### 12. Steward (RC45–RC48)
Manages resources, embodiment, and deep realization.

**Gift:** embodiment, resourcefulness, grounded wisdom, collective stewardship  
**Shadow:** dominance, inadequacy, blocked realization

### 13. Reformer (RC49–RC52)
Renews principles and breaks corrupted patterns.

**Gift:** reform, integrity, equilibrium, restraint  
**Shadow:** reaction, agitation, stress

### 14. Ascendant (RC53–RC56)
Expands through ambition, abundance, and meaningful story.

**Gift:** expansion, aspiration, abundance, narrative transmission  
**Shadow:** greed, immaturity, inflation

### 15. Navigator (RC57–RC60)
Guides through intuition, joy, union, and limitation.

**Gift:** intuition, vitality, intimacy, realism  
**Shadow:** unease, dissatisfaction, limitation fixation

### 16. Illuminator (RC61–RC64)
Reveals hidden architecture of meaning through disciplined perception.

**Gift:** inspiration, precision, inquiry, illumination  
**Shadow:** confusion, doubt, intellectual rigidity, psychic overwhelm

## Calculation (MVP)

1. Generate user’s codon activations (from Static Signature)
2. Apply planetary weights
3. Identify strongest activation cluster
4. Map dominant codon → its four-codon role family
5. Assign as **Primary Resonance Role**

Secondary Role can be derived from the second strongest cluster.

## Facet Modifiers

Every role is colored by the active facet:

- **Somatic** — body, sensation, movement
- **Relational** — connection, care, dynamics with others
- **Cognitive** — thought, language, pattern recognition
- **Transpersonal** — meaning, spirit, larger field

## UI / Profile Guidelines

Recommended display:
- **Resonance Role** (Primary)
- **Secondary Pattern** (Secondary Role)
- Today’s Resonance
- Signal Lumens (symbolic only)
- Resonance Body (not BodyGraph)

**Strict language rule:** Use “Resonance Role”, “Resonance Body”, “Static Signature”, “Signal Lumens”, “Today’s Resonance”. Avoid all Human Design type/profile language.

## Related

- [[entity-static-signature]]
- [[source-vos-resonance-role-system]]
- Profile / Receiver Identity Chamber
- Bio-Architecture
- Facet system

## Implementation Constraints (from source)

Before modifying any role or profile logic, agents must:
- Audit existing data structures
- Preserve Static Signature and Signal Check flows
- Keep Lumens as non-gating symbolic metric
- Never copy Human Design naming or structure
- Stop and ask before changing role calculation logic

**Status:** Canon Proposal (v0.1) — ingested 2026-06-22
