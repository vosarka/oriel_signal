import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  CODON_ARC as SERVER_CODON_ARC,
  FACET_ARC as SERVER_FACET_ARC,
  VRC_MANDALA as SERVER_VRC_MANDALA,
  WHEEL_OFFSET as SERVER_WHEEL_OFFSET,
} from "./vrc-mandala";

import {
  CodonWheelPlate,
  WheelSignatureControl,
  resolveBaseView,
  resolveWheelExplorationSelection,
  resolveWheelSignatureContext,
  resolveWheelView,
  type CodonWheelPlateProps,
  type Codon,
} from "../client/src/components/oriel-signal/CodonWheel";
import {
  BOTH_LAYER_RADIUS,
  CENTER_HUE,
  CODON_CENTER,
  CODON_IDS,
  CONSCIOUS_INNER_RADIUS,
  CONSCIOUS_OUTER_RADIUS,
  DESIGN_INNER_RADIUS,
  DESIGN_OUTER_RADIUS,
  FACETS,
  FACET_SPAN,
  FIELD_CELL_OPACITY,
  SEG,
  VRC_MANDALA,
  WHEEL_OFFSET,
  assertCodonCenterIntegrity,
  buildBothLayers,
  buildLitSet,
  cellAngle,
  cellOpacity,
  codonMidAngle,
  codonStartAngle,
  myWheelQueryKey,
  parseActivations,
  resolveWheelKey,
  resolveWheelMotion,
  summarizeCodonActivations,
  validateActivations,
  wedge,
  wheelSlotIndex,
  type Activation,
} from "../shared/codon-wheel";

export const RECEIVER_ACTIVATIONS: Activation[] = [
  {
    planet: "Sun",
    layer: "conscious",
    codonId: 15,
    facet: "A",
    center: "Bridge",
    weight: 100,
    longitude: 79.453125,
  },
  {
    planet: "Earth",
    layer: "conscious",
    codonId: 10,
    facet: "A",
    center: "Bridge",
    weight: 100,
    longitude: 51.328125,
  },
  {
    planet: "Moon",
    layer: "conscious",
    codonId: 1,
    facet: "B",
    center: "Origin",
    weight: 70,
    longitude: 2.109375,
  },
  {
    planet: "North Node",
    layer: "conscious",
    codonId: 2,
    facet: "C",
    center: "Origin",
    weight: 60,
    longitude: 9.140625,
  },
  {
    planet: "South Node",
    layer: "conscious",
    codonId: 19,
    facet: "D",
    center: "Origin",
    weight: 60,
    longitude: 106.171875,
  },
  {
    planet: "Mercury",
    layer: "conscious",
    codonId: 15,
    facet: "A",
    center: "Bridge",
    weight: 50,
    longitude: 79.453125,
  },
  {
    planet: "Venus",
    layer: "conscious",
    codonId: 29,
    facet: "A",
    center: "Saturation",
    weight: 45,
    longitude: 158.203125,
  },
  {
    planet: "Mars",
    layer: "conscious",
    codonId: 39,
    facet: "B",
    center: "Becoming",
    weight: 40,
    longitude: 216.328125,
  },
  {
    planet: "Jupiter",
    layer: "conscious",
    codonId: 40,
    facet: "C",
    center: "Omega",
    weight: 35,
    longitude: 223.359375,
  },
  {
    planet: "Saturn",
    layer: "conscious",
    codonId: 41,
    facet: "D",
    center: "Becoming",
    weight: 35,
    longitude: 230.390625,
  },
  {
    planet: "Uranus",
    layer: "conscious",
    codonId: 55,
    facet: "A",
    center: "Becoming",
    weight: 30,
    longitude: 304.453125,
  },
  {
    planet: "Neptune",
    layer: "conscious",
    codonId: 59,
    facet: "B",
    center: "Bridge",
    weight: 30,
    longitude: 328.359375,
  },
  {
    planet: "Pluto",
    layer: "conscious",
    codonId: 60,
    facet: "C",
    center: "Saturation",
    weight: 30,
    longitude: 335.390625,
  },
  {
    planet: "Sun",
    layer: "design",
    codonId: 25,
    facet: "B",
    center: "Bridge",
    weight: 100,
    longitude: 137.109375,
  },
  {
    planet: "Earth",
    layer: "design",
    codonId: 46,
    facet: "B",
    center: "Bridge",
    weight: 100,
    longitude: 255.234375,
  },
  {
    planet: "Moon",
    layer: "design",
    codonId: 27,
    facet: "A",
    center: "Saturation",
    weight: 70,
    longitude: 146.953125,
  },
  {
    planet: "North Node",
    layer: "design",
    codonId: 29,
    facet: "C",
    center: "Saturation",
    weight: 60,
    longitude: 161.015625,
  },
  {
    planet: "South Node",
    layer: "design",
    codonId: 31,
    facet: "D",
    center: "Collapse",
    weight: 60,
    longitude: 173.671875,
  },
  {
    planet: "Mercury",
    layer: "design",
    codonId: 25,
    facet: "B",
    center: "Bridge",
    weight: 50,
    longitude: 137.109375,
  },
  {
    planet: "Venus",
    layer: "design",
    codonId: 37,
    facet: "A",
    center: "Becoming",
    weight: 45,
    longitude: 202.078125,
  },
  {
    planet: "Mars",
    layer: "design",
    codonId: 39,
    facet: "B",
    center: "Becoming",
    weight: 40,
    longitude: 216.328125,
  },
  {
    planet: "Jupiter",
    layer: "design",
    codonId: 40,
    facet: "C",
    center: "Omega",
    weight: 35,
    longitude: 223.359375,
  },
  {
    planet: "Saturn",
    layer: "design",
    codonId: 41,
    facet: "D",
    center: "Becoming",
    weight: 35,
    longitude: 230.390625,
  },
  {
    planet: "Uranus",
    layer: "design",
    codonId: 44,
    facet: "A",
    center: "Return",
    weight: 30,
    longitude: 242.703125,
  },
  {
    planet: "Neptune",
    layer: "design",
    codonId: 51,
    facet: "B",
    center: "Origin",
    weight: 30,
    longitude: 283.359375,
  },
  {
    planet: "Pluto",
    layer: "design",
    codonId: 55,
    facet: "C",
    center: "Becoming",
    weight: 30,
    longitude: 307.265625,
  },
];

const EXPECTED_OCCUPIED_CODONS = [
  1, 2, 10, 15, 19, 25, 27, 29, 31, 37, 39, 40, 41, 44, 46, 51, 55, 59, 60,
];

const TEST_CODONS: Codon[] = CODON_IDS.map(codonId => ({
  id: codonId,
  code: `RC${String(codonId).padStart(2, "0")}`,
  name: `Codon ${codonId}`,
  traditional_name: "",
  binary: codonId.toString(2).padStart(6, "0"),
  chemical_marker: "",
  archetype_role: "",
  somatic_marker: "",
}));

function renderPlate(
  activations: readonly Activation[],
  view: Parameters<typeof CodonWheelPlate>[0]["view"],
  showSignatureContext = view.kind !== "field",
  overrides: Partial<CodonWheelPlateProps> = {}
) {
  return renderToStaticMarkup(
    createElement(CodonWheelPlate, {
      codons: TEST_CODONS,
      selectedId: 15,
      activations,
      view,
      showSignatureContext,
      ...overrides,
    })
  );
}

function pathTags(markup: string, kind: string) {
  return [
    ...markup.matchAll(
      new RegExp(`<path data-cell-kind="${kind}"[^>]*>`, "g")
    ),
  ].map(match => match[0]);
}

function attribute(tag: string, name: string) {
  return tag.match(new RegExp(`(?:^|\\s)${name}="([^"]+)"`))?.[1];
}

describe("two-layer codon wheel model", () => {
  it("preserves exact 256-cell angular integrity", () => {
    const cells = CODON_IDS.flatMap(codonId =>
      FACETS.map(facet => {
        const start = cellAngle(codonId, facet);
        return { start, end: start + FACET_SPAN };
      })
    );

    expect(SEG).toBe(5.625);
    expect(FACET_SPAN).toBe(1.40625);
    expect(cells).toHaveLength(256);
    expect(cells.reduce((sum, cell) => sum + cell.end - cell.start, 0)).toBe(
      360
    );
    expect(cellAngle(1, "A")).toBe(0);
    expect(cellAngle(64, "D") + FACET_SPAN).toBe(360);
  });

  it("shares one canonical astronomical Mandala with the server", () => {
    expect(VRC_MANDALA).toHaveLength(64);
    expect(new Set(VRC_MANDALA)).toHaveLength(64);
    expect([...VRC_MANDALA].sort((a, b) => a - b)).toEqual(CODON_IDS);
    expect(SERVER_VRC_MANDALA).toBe(VRC_MANDALA);
    expect(WHEEL_OFFSET).toBe(11.25);
    expect(SERVER_WHEEL_OFFSET).toBe(WHEEL_OFFSET);
    expect(SERVER_CODON_ARC).toBe(SEG);
    expect(SERVER_FACET_ARC).toBe(FACET_SPAN);
  });

  it("places the astronomical Mandala at its exact canonical slots", () => {
    expect(wheelSlotIndex(51, "astronomical")).toBe(0);
    expect(wheelSlotIndex(53, "astronomical")).toBe(16);
    expect(wheelSlotIndex(57, "astronomical")).toBe(32);
    expect(wheelSlotIndex(54, "astronomical")).toBe(48);
    expect(wheelSlotIndex(1, "astronomical")).toBe(37);

    expect(codonStartAngle(51, "astronomical")).toBe(0);
    expect(codonStartAngle(53, "astronomical")).toBe(90);
    expect(codonStartAngle(57, "astronomical")).toBe(180);
    expect(codonStartAngle(54, "astronomical")).toBe(270);
    expect(codonStartAngle(1, "astronomical")).toBe(208.125);
    expect(codonMidAngle(51, "astronomical")).toBe(SEG / 2);
    expect(cellAngle(21, "D", "astronomical") + FACET_SPAN).toBe(360);
  });

  it("keeps numeric geometry as the default and explicit regression path", () => {
    expect(wheelSlotIndex(1)).toBe(0);
    expect(wheelSlotIndex(64, "numeric")).toBe(63);
    expect(codonStartAngle(1)).toBe(0);
    expect(codonMidAngle(64, "numeric")).toBe(360 - SEG / 2);
    expect(cellAngle(1, "A")).toBe(cellAngle(1, "A", "numeric"));
    expect(cellAngle(64, "D", "numeric") + FACET_SPAN).toBe(360);
  });

  it("contains every codon exactly once and eight codons per centre", () => {
    expect(() => assertCodonCenterIntegrity()).not.toThrow();

    const keys = Object.keys(CODON_CENTER)
      .map(Number)
      .sort((a, b) => a - b);
    expect(keys).toEqual(CODON_IDS);

    const counts = Object.values(CODON_CENTER).reduce<Record<string, number>>(
      (totals, center) => {
        totals[center] = (totals[center] ?? 0) + 1;
        return totals;
      },
      {}
    );
    expect(counts).toEqual(
      Object.fromEntries(Object.keys(CENTER_HUE).map(center => [center, 8]))
    );
  });

  it("validates the known Receiver record with zero canon conflicts", () => {
    expect(RECEIVER_ACTIVATIONS).toHaveLength(26);
    expect(() => validateActivations(RECEIVER_ACTIVATIONS)).not.toThrow();
    expect(parseActivations(RECEIVER_ACTIVATIONS)).toEqual(
      RECEIVER_ACTIVATIONS
    );

    for (const activation of RECEIVER_ACTIVATIONS) {
      expect(activation.center).toBe(CODON_CENTER[activation.codonId]);
    }

    expect(() =>
      validateActivations([
        { ...RECEIVER_ACTIVATIONS[0], center: "Mental" },
      ])
    ).toThrow(
      "canon conflict: codon 15 maps to Bridge, record says Mental"
    );
  });

  it("matches the supplied Receiver layer totals and occupied codons", () => {
    const conscious = RECEIVER_ACTIVATIONS.filter(
      activation => activation.layer === "conscious"
    );
    const design = RECEIVER_ACTIVATIONS.filter(
      activation => activation.layer === "design"
    );
    const occupied = [
      ...new Set(
        RECEIVER_ACTIVATIONS.map(activation => activation.codonId)
      ),
    ].sort((a, b) => a - b);

    expect(conscious).toHaveLength(13);
    expect(design).toHaveLength(13);
    expect(
      conscious.reduce((sum, activation) => sum + activation.weight, 0)
    ).toBe(685);
    expect(design.reduce((sum, activation) => sum + activation.weight, 0)).toBe(
      685
    );
    expect(occupied).toEqual(EXPECTED_OCCUPIED_CODONS);
    expect(
      RECEIVER_ACTIVATIONS.some(activation => activation.center === "Mental")
    ).toBe(false);
  });

  it("finds exactly the five codons present in both layers", () => {
    expect([...buildBothLayers(RECEIVER_ACTIVATIONS)].sort((a, b) => a - b)).toEqual(
      [29, 39, 40, 41, 55]
    );
  });

  it("keeps codon-level both-layer presence distinct from exact facet convergence", () => {
    const differentFacets = summarizeCodonActivations(
      RECEIVER_ACTIVATIONS,
      29
    );
    const exactFacet = summarizeCodonActivations(RECEIVER_ACTIVATIONS, 39);

    expect(differentFacets.presence).toBe("both");
    expect(differentFacets.conscious.facets).toEqual(["A"]);
    expect(differentFacets.design.facets).toEqual(["C"]);
    expect(differentFacets.exactSharedFacets).toEqual([]);
    expect(exactFacet.presence).toBe("both");
    expect(exactFacet.exactSharedFacets).toEqual(["B"]);
  });

  it("removes every personal activation from Full Field context", () => {
    const signatureContext = resolveWheelSignatureContext(
      "ready",
      "mine",
      RECEIVER_ACTIVATIONS,
      29
    );
    const fieldContext = resolveWheelSignatureContext(
      "ready",
      "field",
      RECEIVER_ACTIVATIONS,
      29
    );

    expect(signatureContext.mode).toBe("mine");
    expect(signatureContext.summary?.presence).toBe("both");
    expect(fieldContext).toEqual({
      mode: "field",
      state: "ready",
      summary: null,
    });
  });

  it("keeps an explicit wheel view across wheel remounts", () => {
    expect(resolveBaseView("ready", "field", "mine")).toBe("field");
    expect(resolveBaseView("ready", "mine", "field")).toBe("mine");
    expect(resolveBaseView("ready", null, "mine")).toBe("mine");
    expect(resolveBaseView("anonymous", "mine", "mine")).toBe("field");
  });

  it("retains every planet when multiple activations occupy one selected cell", () => {
    const summary = summarizeCodonActivations(RECEIVER_ACTIVATIONS, 15);

    expect(summary.presence).toBe("conscious");
    expect(summary.conscious.facets).toEqual(["A"]);
    expect(summary.conscious.activations.map(row => row.planet)).toEqual([
      "Sun",
      "Mercury",
    ]);
    expect(summary.design.activations).toEqual([]);
  });

  it("deduplicates same-cell collisions in mine view", () => {
    const lit = buildLitSet(RECEIVER_ACTIVATIONS);

    expect(lit.size).toBe(24);
    expect(lit.has("15-A-conscious")).toBe(true);
    expect(lit.has("25-B-design")).toBe(true);
  });

  it("keeps other mine activations at 0.22 during focus", () => {
    const focus = { kind: "focus", codonId: 15 } as const;

    expect(cellOpacity(true, focus, 15)).toBe(1);
    expect(cellOpacity(false, focus, 15)).toBe(0.24);
    expect(cellOpacity(true, focus, 29)).toBe(0.22);
    expect(cellOpacity(false, focus, 29)).toBe(0.06);
  });

  it("keeps center and codon exploration mutually exclusive", () => {
    expect(
      resolveWheelExplorationSelection(
        { focusedCodonId: 15, activeCenter: null },
        { kind: "center", center: "Origin" }
      )
    ).toEqual({ focusedCodonId: null, activeCenter: "Origin" });
    expect(
      resolveWheelExplorationSelection(
        { focusedCodonId: null, activeCenter: "Bridge" },
        { kind: "center", center: "Bridge" }
      )
    ).toEqual({ focusedCodonId: null, activeCenter: null });
    expect(
      resolveWheelExplorationSelection(
        { focusedCodonId: null, activeCenter: "Bridge" },
        { kind: "codon", codonId: 29 }
      )
    ).toEqual({ focusedCodonId: 29, activeCenter: null });
  });

  it("uses the required concentric band placement", () => {
    expect(CONSCIOUS_OUTER_RADIUS).toBe(344);
    expect(CONSCIOUS_INNER_RADIUS).toBe(306.848);
    expect(BOTH_LAYER_RADIUS).toBe(297.216);
    expect(DESIGN_OUTER_RADIUS).toBe(286.896);
    expect(DESIGN_INNER_RADIUS).toBe(249.744);
  });

  it("exposes one pointer target for every codon-facet-layer cell", () => {
    const markup = renderToStaticMarkup(
      createElement(CodonWheelPlate, {
        codons: TEST_CODONS,
        selectedId: 29,
        selectedFacet: "C",
        selectedLayer: "design",
        activations: [],
        view: { kind: "focus", codonId: 29 },
      })
    );

    expect(markup.match(/data-cell-kind="hit"/g)?.length).toBe(512);
    expect(markup).toMatch(
      new RegExp(
        `data-cell-kind="hit" data-hit-codon="29" data-hit-facet="A" data-hit-layer="conscious" data-hit-inner-radius="${BOTH_LAYER_RADIUS}" data-hit-outer-radius="${CONSCIOUS_OUTER_RADIUS}"`
      )
    );
    expect(markup).toMatch(
      new RegExp(
        `data-cell-kind="hit" data-hit-codon="29" data-hit-facet="C" data-hit-layer="design" data-hit-inner-radius="${DESIGN_INNER_RADIUS}" data-hit-outer-radius="${BOTH_LAYER_RADIUS}"`
      )
    );
    expect(markup).toMatch(
      /data-cell-kind="selection" data-codon-id="29" data-facet="C" data-layer="design"/
    );
    expect(markup).toContain(
      "Selected RC29, facet C, design layer."
    );
  });

  it("resolves keyboard focus without creating 64 tab stops", () => {
    expect(resolveWheelKey("ArrowRight", 1)).toEqual({
      kind: "focus",
      codonId: 2,
    });
    expect(resolveWheelKey("ArrowDown", 64)).toEqual({
      kind: "focus",
      codonId: 1,
    });
    expect(resolveWheelKey("ArrowLeft", 1)).toEqual({
      kind: "focus",
      codonId: 64,
    });
    expect(resolveWheelKey("Home", 37)).toEqual({
      kind: "focus",
      codonId: 1,
    });
    expect(resolveWheelKey("Escape", 37)).toEqual({ kind: "leave-focus" });
    expect(resolveWheelKey("Enter", 37)).toBeNull();
  });

  it("moves keyboard focus through visible astronomical neighbours", () => {
    expect(resolveWheelKey("Home", 1, "astronomical")).toEqual({
      kind: "focus",
      codonId: 51,
    });
    expect(resolveWheelKey("ArrowRight", 51, "astronomical")).toEqual({
      kind: "focus",
      codonId: 42,
    });
    expect(resolveWheelKey("ArrowDown", 21, "astronomical")).toEqual({
      kind: "focus",
      codonId: 51,
    });
    expect(resolveWheelKey("ArrowLeft", 51, "astronomical")).toEqual({
      kind: "focus",
      codonId: 21,
    });
    expect(resolveWheelKey("ArrowUp", 42, "astronomical")).toEqual({
      kind: "focus",
      codonId: 51,
    });
  });

  it("uses only the specified motion timings", () => {
    expect(
      resolveWheelMotion({ kind: "field" }, { kind: "mine" }, false)
    ).toEqual({ durationMs: 420, easing: "ease-out", staggerMs: 6 });
    expect(
      resolveWheelMotion(
        { kind: "mine" },
        { kind: "focus", codonId: 15 },
        false
      )
    ).toEqual({ durationMs: 180, easing: "ease-out", staggerMs: 0 });
    expect(
      resolveWheelMotion(
        { kind: "focus", codonId: 15 },
        { kind: "focus", codonId: 16 },
        false
      )
    ).toEqual({ durationMs: 180, easing: "ease-out", staggerMs: 0 });
    expect(
      resolveWheelMotion(
        { kind: "focus", codonId: 15 },
        { kind: "mine" },
        false
      )
    ).toEqual({
      durationMs: 260,
      easing: "ease-in-out",
      staggerMs: 0,
    });
    expect(
      resolveWheelMotion({ kind: "field" }, { kind: "mine" }, true)
    ).toEqual({ durationMs: 120, easing: "ease-out", staggerMs: 0 });
  });

  it("renders conscious activations outside and design activations inside", () => {
    const markup = renderPlate(RECEIVER_ACTIVATIONS, { kind: "mine" });
    const renderedCells = [
      ...markup.matchAll(
        /<path data-cell-kind="lit" data-cell-key="([^"]+)"[^>]*data-layer="([^"]+)" data-inner-radius="([^"]+)" data-outer-radius="([^"]+)" d="([^"]+)"/g
      ),
    ].map(([, key, layer, inner, outer, path]) => ({
      key,
      layer,
      inner: Number(inner),
      outer: Number(outer),
      path,
    }));

    expect(renderedCells).toHaveLength(buildLitSet(RECEIVER_ACTIVATIONS).size);
    for (const activation of RECEIVER_ACTIVATIONS) {
      const key = `${activation.codonId}-${activation.facet}-${activation.layer}`;
      const rendered = renderedCells.find(cell => cell.key === key);
      expect(rendered).toBeDefined();
      expect(rendered?.inner).toBe(
        activation.layer === "conscious"
          ? CONSCIOUS_INNER_RADIUS
          : DESIGN_INNER_RADIUS
      );
      expect(rendered?.outer).toBe(
        activation.layer === "conscious"
          ? CONSCIOUS_OUTER_RADIUS
          : DESIGN_OUTER_RADIUS
      );
      expect(rendered?.path).toContain(
        `A${rendered?.outer} ${rendered?.outer}`
      );
      expect(rendered?.path).toContain(
        `A${rendered?.inner} ${rendered?.inner}`
      );
    }

    expect(
      renderedCells
        .map(({ layer, inner, outer }) => ({
          layer,
          inner,
          outer,
        }))
        .sort(
          (left, right) =>
            (left.layer === "conscious" ? 0 : 1) -
            (right.layer === "conscious" ? 0 : 1)
        )
    ).toMatchInlineSnapshot(`
      [
        {
          "inner": 306.848,
          "layer": "conscious",
          "outer": 344,
        },
        {
          "inner": 306.848,
          "layer": "conscious",
          "outer": 344,
        },
        {
          "inner": 306.848,
          "layer": "conscious",
          "outer": 344,
        },
        {
          "inner": 306.848,
          "layer": "conscious",
          "outer": 344,
        },
        {
          "inner": 306.848,
          "layer": "conscious",
          "outer": 344,
        },
        {
          "inner": 306.848,
          "layer": "conscious",
          "outer": 344,
        },
        {
          "inner": 306.848,
          "layer": "conscious",
          "outer": 344,
        },
        {
          "inner": 306.848,
          "layer": "conscious",
          "outer": 344,
        },
        {
          "inner": 306.848,
          "layer": "conscious",
          "outer": 344,
        },
        {
          "inner": 306.848,
          "layer": "conscious",
          "outer": 344,
        },
        {
          "inner": 306.848,
          "layer": "conscious",
          "outer": 344,
        },
        {
          "inner": 306.848,
          "layer": "conscious",
          "outer": 344,
        },
        {
          "inner": 249.744,
          "layer": "design",
          "outer": 286.896,
        },
        {
          "inner": 249.744,
          "layer": "design",
          "outer": 286.896,
        },
        {
          "inner": 249.744,
          "layer": "design",
          "outer": 286.896,
        },
        {
          "inner": 249.744,
          "layer": "design",
          "outer": 286.896,
        },
        {
          "inner": 249.744,
          "layer": "design",
          "outer": 286.896,
        },
        {
          "inner": 249.744,
          "layer": "design",
          "outer": 286.896,
        },
        {
          "inner": 249.744,
          "layer": "design",
          "outer": 286.896,
        },
        {
          "inner": 249.744,
          "layer": "design",
          "outer": 286.896,
        },
        {
          "inner": 249.744,
          "layer": "design",
          "outer": 286.896,
        },
        {
          "inner": 249.744,
          "layer": "design",
          "outer": 286.896,
        },
        {
          "inner": 249.744,
          "layer": "design",
          "outer": 286.896,
        },
        {
          "inner": 249.744,
          "layer": "design",
          "outer": 286.896,
        },
      ]
    `);
  });

  it("renders one lit path per distinct cell and preserves focus composition", () => {
    const mineMarkup = renderPlate(RECEIVER_ACTIVATIONS, { kind: "mine" });
    const focusMarkup = renderPlate(RECEIVER_ACTIVATIONS, {
      kind: "focus",
      codonId: 15,
    });

    expect(
      mineMarkup.match(/data-cell-kind="lit"/g)?.length
    ).toBe(buildLitSet(RECEIVER_ACTIVATIONS).size);
    expect(
      mineMarkup.match(/data-both-layer-codon/g)?.length
    ).toBe(buildBothLayers(RECEIVER_ACTIVATIONS).size);
    expect(mineMarkup).toContain("<td>Yes</td>");
    expect(mineMarkup).toContain(
      "transition:fill-opacity 420ms ease-out"
    );
    expect(mineMarkup).toMatch(
      /data-cell-kind="neutral" data-codon-id="15" data-facet="A" data-layer="conscious"[^>]*fill-opacity="0"/
    );
    expect(focusMarkup).toMatch(
      /data-cell-key="29-A-conscious"[^>]*fill-opacity="0.22"/
    );
    expect(focusMarkup).toMatch(
      /data-cell-kind="neutral" data-codon-id="29" data-facet="A" data-layer="conscious"[^>]*fill-opacity="0"/
    );
    expect(focusMarkup).toMatch(
      /data-cell-key="15-A-conscious"[^>]*fill-opacity="1"/
    );
    expect(mineMarkup).not.toContain(`fill="${CENTER_HUE.Mental}"`);
  });

  it("renders every Full Field cell in its canonical darkened center color", () => {
    const markup = renderPlate(RECEIVER_ACTIVATIONS, { kind: "field" });
    const cells = pathTags(markup, "neutral");
    const hueCounts = new Map<string, number>();

    expect(cells).toHaveLength(512);
    for (const cell of cells) {
      const codonId = Number(attribute(cell, "data-codon-id"));
      const fill = attribute(cell, "fill");
      expect(fill).toBe(CENTER_HUE[CODON_CENTER[codonId]]);
      expect(Number(attribute(cell, "fill-opacity"))).toBe(
        FIELD_CELL_OPACITY
      );
      hueCounts.set(fill!, (hueCounts.get(fill!) ?? 0) + 1);
    }
    expect(Object.values(CENTER_HUE).map(hue => hueCounts.get(hue))).toEqual(
      Array(8).fill(64)
    );
    expect(markup).not.toContain('data-cell-kind="lit"');
    expect(markup).not.toContain('data-both-layer-codon');
    expect(markup).not.toContain('data-cell-key="15-A-conscious"');
    expect(markup).not.toContain("<td>Yes</td>");
    expect(markup).toContain(
      'aria-label="Codon wheel. 64 codons in two layers. 0 codons activated. 0 present in both layers. Selected RC15, facet A, conscious layer."'
    );
    expect(markup).toBe(renderPlate([], { kind: "field" }));
  });

  it("colors the complete clicked codon without revealing mine context in the full field", () => {
    const markup = renderPlate(
      RECEIVER_ACTIVATIONS,
      { kind: "focus", codonId: 15 },
      false
    );
    const selectedCells = [
      ...markup.matchAll(
        /<path data-cell-kind="field-selection" data-codon-id="15"[^>]+>/g
      ),
    ].map(match => match[0]);

    expect(selectedCells).toHaveLength(FACETS.length * 2);
    for (const path of selectedCells) {
      expect(path).toContain(`fill="${CENTER_HUE.Bridge}"`);
      expect(path).toContain('fill-opacity="1"');
    }
    expect(markup).toMatch(
      new RegExp(
        `data-cell-kind="neutral" data-codon-id="29" data-facet="A" data-layer="conscious"[^>]*fill="${CENTER_HUE.Saturation}" fill-opacity="${FIELD_CELL_OPACITY}"`
      )
    );
    expect(markup).not.toContain('data-cell-kind="lit"');
    expect(markup).not.toContain('data-both-layer-codon');
    expect(markup).not.toContain('data-cell-key="15-A-conscious"');
    expect(markup).not.toContain("<td>Yes</td>");
    expect(markup).toContain(
      'aria-label="Codon wheel. 64 codons in two layers. 0 codons activated. 0 present in both layers. Selected RC15, facet A, conscious layer."'
    );
    expect(markup).toBe(
      renderPlate([], { kind: "focus", codonId: 15 }, false)
    );
  });

  it("lights exactly the eight codons belonging to a selected center", () => {
    const markup = renderPlate(
      RECEIVER_ACTIVATIONS,
      { kind: "field" },
      false,
      { activeCenter: "Bridge" }
    );
    const cells = pathTags(markup, "neutral");
    const brightCells = cells.filter(
      cell => Number(attribute(cell, "fill-opacity")) === 1
    );
    const darkCells = cells.filter(
      cell => Number(attribute(cell, "fill-opacity")) === FIELD_CELL_OPACITY
    );
    const brightCodons = [
      ...new Set(
        brightCells.map(cell => Number(attribute(cell, "data-codon-id")))
      ),
    ].sort((a, b) => a - b);

    expect(brightCells).toHaveLength(64);
    expect(darkCells).toHaveLength(448);
    expect(brightCodons).toEqual([7, 10, 13, 15, 25, 46, 57, 59]);
    expect(
      brightCells.every(
        cell => attribute(cell, "fill") === CENTER_HUE.Bridge
      )
    ).toBe(true);
    expect(markup).toBe(
      renderPlate([], { kind: "field" }, false, { activeCenter: "Bridge" })
    );
  });

  it("exposes the center-symbol band as eight controls over 64 mapped wedges", () => {
    const markup = renderPlate([], { kind: "field" }, false, {
      onCenterSelect: () => undefined,
    });
    const hits = [
      ...markup.matchAll(/<path data-center-kind="hit"[^>]*>/g),
    ].map(match => match[0]);
    const centerCounts = new Map<string, number>();

    expect(markup.match(/data-center-control=/g)?.length).toBe(8);
    expect(hits).toHaveLength(64);
    for (const hit of hits) {
      const center = attribute(hit, "data-center-name")!;
      const codonId = Number(attribute(hit, "data-center-codon"));
      expect(center).toBe(CODON_CENTER[codonId]);
      expect(attribute(hit, "data-hit-inner-radius")).toBe("206");
      expect(attribute(hit, "data-hit-outer-radius")).toBe("244");
      centerCounts.set(center, (centerCounts.get(center) ?? 0) + 1);
    }
    expect(
      Object.keys(CENTER_HUE).map(center => centerCounts.get(center))
    ).toEqual(Array(8).fill(8));
  });

  it("renders exact astronomical cells and hit areas without exposing signature data", () => {
    const withRecord = renderPlate(
      RECEIVER_ACTIVATIONS,
      { kind: "field" },
      false,
      { geometry: "astronomical" }
    );
    const withoutRecord = renderPlate([], { kind: "field" }, false, {
      geometry: "astronomical",
    });
    const neutralCells = pathTags(withRecord, "neutral");
    const hitCells = pathTags(withRecord, "hit");
    const rc51ConsciousA = neutralCells.find(
      cell =>
        attribute(cell, "data-codon-id") === "51" &&
        attribute(cell, "data-facet") === "A" &&
        attribute(cell, "data-layer") === "conscious"
    );
    const rc51ConsciousAHit = hitCells.find(
      cell =>
        attribute(cell, "data-hit-codon") === "51" &&
        attribute(cell, "data-hit-facet") === "A" &&
        attribute(cell, "data-hit-layer") === "conscious"
    );

    expect(withRecord).toContain('data-wheel-geometry="astronomical"');
    expect(withRecord).toContain(
      'data-quadrant-name="INITIATION" data-quadrant-anchor-codon="51" data-quadrant-geometry="astronomical"'
    );
    expect(withRecord).toContain(
      'data-quadrant-name="CIVILIZATION" data-quadrant-anchor-codon="53" data-quadrant-geometry="astronomical"'
    );
    expect(withRecord).toContain(
      'data-quadrant-name="DUALITY" data-quadrant-anchor-codon="57" data-quadrant-geometry="astronomical"'
    );
    expect(withRecord).toContain(
      'data-quadrant-name="MUTATION" data-quadrant-anchor-codon="54" data-quadrant-geometry="astronomical"'
    );
    expect(withRecord).toContain(
      'data-codon-base="51" data-codon-base-rotation="78.75" transform="rotate(78.75 380 380)"'
    );
    expect(withRecord.match(/data-wheel-upright=/g)).toHaveLength(192);
    expect(withRecord).toContain(
      'data-wheel-upright="codon" data-upright-codon="51"'
    );
    expect(withRecord).toContain("transform:rotate(-78.75deg)");
    expect(neutralCells).toHaveLength(512);
    expect(hitCells).toHaveLength(512);
    expect(attribute(rc51ConsciousA!, "d")).toBe(
      wedge(
        380,
        380,
        CONSCIOUS_INNER_RADIUS,
        CONSCIOUS_OUTER_RADIUS,
        codonStartAngle(51, "numeric"),
        codonStartAngle(51, "numeric") + FACET_SPAN
      )
    );
    expect(attribute(rc51ConsciousAHit!, "d")).toBe(
      wedge(
        380,
        380,
        BOTH_LAYER_RADIUS,
        CONSCIOUS_OUTER_RADIUS,
        codonStartAngle(51, "numeric"),
        codonStartAngle(51, "numeric") + FACET_SPAN
      )
    );
    expect(withRecord).toBe(withoutRecord);
  });

  it("brightens the exact selected facet in its conscious or design ring", () => {
    const conscious = renderPlate([], { kind: "focus", codonId: 15 }, false, {
      selectedFacet: "B",
      selectedLayer: "conscious",
    });
    const design = renderPlate([], { kind: "focus", codonId: 15 }, false, {
      selectedFacet: "D",
      selectedLayer: "design",
    });
    const consciousSelection = pathTags(conscious, "selection")[0];
    const designSelection = pathTags(design, "selection")[0];

    expect(attribute(consciousSelection, "data-facet")).toBe("B");
    expect(attribute(consciousSelection, "data-layer")).toBe("conscious");
    expect(attribute(consciousSelection, "fill")).toBe("#e8c477");
    expect(attribute(consciousSelection, "fill-opacity")).toBe("0.3");
    expect(attribute(designSelection, "data-facet")).toBe("D");
    expect(attribute(designSelection, "data-layer")).toBe("design");
    expect(attribute(designSelection, "fill")).toBe("#6fb7c7");
    expect(attribute(designSelection, "fill-opacity")).toBe("0.3");
  });

  it("separates the centered hub symbol from its copy", () => {
    const markup = renderPlate([], { kind: "field" });

    expect(markup).toContain('class="cz-wheel-hub-symbol"');
    expect(markup).toContain('class="cz-wheel-hub-copy"');
  });

  it("keeps a clicked codon focus available without a personal wheel record", () => {
    expect(resolveWheelView("anonymous", "field", 15)).toEqual({
      kind: "focus",
      codonId: 15,
    });
    expect(resolveWheelView("none", "field", 29)).toEqual({
      kind: "focus",
      codonId: 29,
    });
    expect(resolveWheelView("ready", "mine", null)).toEqual({ kind: "mine" });
    expect(resolveWheelView("error", "mine", null)).toEqual({ kind: "field" });
  });

  it("scopes immutable client cache entries by authenticated Receiver", () => {
    expect(myWheelQueryKey(7)).toEqual([
      "profile",
      "getMyWheel",
      "receiver",
      7,
    ]);
    expect(myWheelQueryKey(8)).not.toEqual(myWheelQueryKey(7));
    expect(myWheelQueryKey(null)).not.toEqual(myWheelQueryKey(7));
  });

  it("renders the neutral field and disabled invitation with no calculation", () => {
    const markup = renderToStaticMarkup(
      createElement(
        "div",
        null,
        createElement(WheelSignatureControl, {
          state: "none",
          baseView: "field",
          onToggle: () => undefined,
        }),
        createElement(CodonWheelPlate, {
          codons: TEST_CODONS,
          selectedId: 1,
          activations: [],
          view: { kind: "field" },
        })
      )
    );

    expect(markup).toContain("<button");
    expect(markup).toContain("disabled");
    expect(markup).toContain("Full Field");
    expect(markup).toContain("My Signature");
    expect(markup).toContain('aria-pressed="true"');
    expect(markup).toContain("Calculate your Receiver record");
    expect(markup.match(/data-cell-kind="neutral"/g)?.length).toBe(512);
    expect(markup).not.toContain('data-cell-kind="lit"');
    expect(markup).toContain(
      'aria-label="Codon wheel. 64 codons in two layers. 0 codons activated. 0 present in both layers. Selected RC01, facet A, conscious layer."'
    );
  });
});
