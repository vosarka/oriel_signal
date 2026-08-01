import {
  Children,
  createElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import {
  CodonDetailPanel,
  type CodonDetail,
} from "../client/src/components/oriel-signal/CodonDetailPanel";
import type { WheelSignatureContext } from "../client/src/components/oriel-signal/CodonWheel";
import {
  summarizeCodonActivations,
  type Activation,
  type Facet,
  type Layer,
} from "../shared/codon-wheel";

const FACET_NAMES: Record<Facet, string> = {
  A: "Somatic",
  B: "Relational",
  C: "Cognitive",
  D: "Transpersonal",
};

function makeCodon(id: number): CodonDetail {
  return {
    id,
    code: `RC${String(id).padStart(2, "0")}`,
    name: `Codon ${id}`,
    traditional_name: `Traditional ${id}`,
    binary: id.toString(2).padStart(6, "0"),
    chemical_marker: "Marker",
    archetype_role: "Role",
    somatic_marker: "Soma",
    frequency: {
      shadow: "Shadow",
      shadow_desc: "Shadow description",
      gift: "Gift",
      gift_desc: "Gift description",
      siddhi: "Siddhi",
      siddhi_desc: "Siddhi description",
    },
    facets: Object.fromEntries(
      (["A", "B", "C", "D"] as const).map(facet => [
        facet,
        {
          title: FACET_NAMES[facet],
          degrees: `${facet} degrees`,
          description: `${facet} description`,
          micro_correction: `${facet} correction`,
        },
      ])
    ) as CodonDetail["facets"],
  };
}

function collectControls(
  node: ReactNode,
  kind: string,
  found: ReactElement<Record<string, unknown>>[] = []
) {
  if (Array.isArray(node)) {
    for (const child of node) collectControls(child, kind, found);
    return found;
  }
  if (!isValidElement(node)) return found;

  const element = node as ReactElement<Record<string, unknown>>;
  if (element.props["data-control-kind"] === kind) found.push(element);
  Children.forEach(element.props.children as ReactNode, child => {
    collectControls(child, kind, found);
  });
  return found;
}

const FIELD_CONTEXT: WheelSignatureContext = {
  mode: "field",
  state: "ready",
  summary: null,
};

function panelProps(overrides: Partial<Parameters<typeof CodonDetailPanel>[0]> = {}) {
  return {
    codon: makeCodon(29),
    selectedFacetKey: "A" as Facet,
    selectedLayer: "conscious" as Layer,
    signatureContext: FIELD_CONTEXT,
    onFacetChange: vi.fn(),
    onLayerChange: vi.fn(),
    onSelectCodon: vi.fn(),
    ...overrides,
  };
}

describe("codon detail selection", () => {
  it("changes a tetrad codon without forcing a different facet", () => {
    const props = panelProps();
    const tree = CodonDetailPanel(props);
    const codonControls = collectControls(tree, "tetrad-codon");

    expect(codonControls).toHaveLength(4);
    (codonControls[1].props.onClick as () => void)();

    expect(props.onSelectCodon).toHaveBeenCalledWith(30);
    expect(props.onFacetChange).not.toHaveBeenCalled();
  });

  it("offers independent facet and layer controls", () => {
    const props = panelProps();
    const tree = CodonDetailPanel(props);
    const facetControls = collectControls(tree, "facet");
    const layerControls = collectControls(tree, "layer");

    expect(facetControls).toHaveLength(4);
    expect(layerControls).toHaveLength(2);
    (facetControls[2].props.onClick as () => void)();
    (layerControls[1].props.onClick as () => void)();

    expect(props.onFacetChange).toHaveBeenCalledWith("C");
    expect(props.onLayerChange).toHaveBeenCalledWith("design");
    expect(props.onSelectCodon).not.toHaveBeenCalled();
  });
});

describe("codon signature layer copy", () => {
  const bothDifferent: Activation[] = [
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
      planet: "North Node",
      layer: "design",
      codonId: 29,
      facet: "C",
      center: "Saturation",
      weight: 60,
      longitude: 161.015625,
    },
  ];
  const bothExact: Activation[] = [
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
      planet: "Mars",
      layer: "design",
      codonId: 39,
      facet: "B",
      center: "Becoming",
      weight: 40,
      longitude: 216.328125,
    },
  ];

  it("describes codon-level convergence without claiming the facets match", () => {
    const signatureContext: WheelSignatureContext = {
      mode: "mine",
      state: "ready",
      summary: summarizeCodonActivations(bothDifferent, 29),
    };
    const markup = renderToStaticMarkup(
      createElement(
        CodonDetailPanel,
        panelProps({
          selectedFacetKey: "C",
          selectedLayer: "design",
          signatureContext,
        })
      )
    );

    expect(markup).toContain("IN YOUR SIGNATURE · BOTH LAYERS");
    expect(markup).toContain("A · Venus");
    expect(markup).toContain("C · North Node");
    expect(markup).toContain("Same codon, different facet expression.");
    expect(markup).toContain("CURRENTLY READING · DESIGN · FACET C");
  });

  it("distinguishes exact codon-facet convergence", () => {
    const signatureContext: WheelSignatureContext = {
      mode: "mine",
      state: "ready",
      summary: summarizeCodonActivations(bothExact, 39),
    };
    const markup = renderToStaticMarkup(
      createElement(
        CodonDetailPanel,
        panelProps({
          codon: makeCodon(39),
          selectedFacetKey: "B",
          signatureContext,
        })
      )
    );

    expect(markup).toContain("Exact codon-facet convergence at B.");
  });

  it("renders every planet sharing the selected signature cell", () => {
    const duplicatePlanets: Activation[] = [
      {
        ...bothDifferent[0],
        codonId: 15,
        facet: "A",
        planet: "Sun",
      },
      {
        ...bothDifferent[0],
        codonId: 15,
        facet: "A",
        planet: "Mercury",
      },
    ];
    const markup = renderToStaticMarkup(
      createElement(
        CodonDetailPanel,
        panelProps({
          codon: makeCodon(15),
          signatureContext: {
            mode: "mine",
            state: "ready",
            summary: summarizeCodonActivations(duplicatePlanets, 15),
          },
        })
      )
    );

    expect(markup).toContain("A · Sun, Mercury");
    expect(markup).toContain("SELECTED CELL · Sun, Mercury");
  });

  it("never renders personal activation details in Full Field", () => {
    const markup = renderToStaticMarkup(
      createElement(
        CodonDetailPanel,
        panelProps({
          signatureContext: {
            mode: "field",
            state: "ready",
            summary: summarizeCodonActivations(bothDifferent, 29),
          },
        })
      )
    );

    expect(markup).toContain("FIELD ADDRESS");
    expect(markup).not.toContain("Venus");
    expect(markup).not.toContain("North Node");
    expect(markup).not.toContain("BOTH LAYERS");
  });
});
