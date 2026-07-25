import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";

vi.mock("@/components/Layout", () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({ user: null, loading: false }),
}));
vi.mock("@/lib/trpc", () => ({ trpc: {} }));

import {
  FounderEditionAdminOrder,
  type AdminSignatureLetterBundle,
} from "../client/src/pages/AdminSignatureLetters";

const COMPONENT = "client/src/pages/AdminSignatureLetters.tsx";
const runtimeGlobal = globalThis as typeof globalThis & {
  React?: typeof React;
};
const previousGlobalReact = runtimeGlobal.React;

const bundle: AdminSignatureLetterBundle = {
  order: {
    id: 91,
    userId: 42,
    productType: "tetradic_founder_edition",
    status: "intake_received",
    priceEur: 81.32,
    currency: "eur",
    paymentProvider: "paypal",
    paypalOrderId: "5O190127TN364715T",
    paypalCaptureId: "3Y662965014333303",
    paidAt: new Date("2026-07-26T08:30:00.000Z"),
    deliveryDueAt: new Date("2026-07-31T08:30:00.000Z"),
    createdAt: new Date("2026-07-26T08:00:00.000Z"),
  },
  intake: {
    name: "Elena Ionescu",
    email: "elena@example.com",
    focusQuestion: "What is asking to be embodied?",
    questionOne: "What is asking to be embodied?",
    questionTwo: "What should I protect?",
    preferredTone: "balanced",
    avoidAssumptions: null,
    consentAccepted: true,
    consentAcceptedAt: new Date("2026-07-26T08:00:00.000Z"),
    birthDate: "1990-01-02",
    birthTime: "03:04",
    birthPlace: "Bucharest",
    birthCountry: "Romania",
    timezone: "Europe/Bucharest",
  },
  snapshot: null,
  draft: null,
};

beforeAll(() => {
  runtimeGlobal.React = React;
});

afterAll(() => {
  if (previousGlobalReact) {
    runtimeGlobal.React = previousGlobalReact;
    return;
  }
  delete runtimeGlobal.React;
});

function renderFounderEdition(
  overrides: Partial<AdminSignatureLetterBundle["order"]> = {},
  consentAccepted = true
) {
  return renderToStaticMarkup(
    React.createElement(FounderEditionAdminOrder, {
      bundle: {
        ...bundle,
        order: { ...bundle.order, ...overrides },
        intake: bundle.intake
          ? { ...bundle.intake, consentAccepted }
          : null,
      },
      startPending: false,
      deliveryPending: false,
      onStartCuration: () => undefined,
      onMarkDelivered: () => undefined,
    })
  );
}

function buttonWithLabel(markup: string, label: string) {
  const buttons = markup.match(/<button\b[\s\S]*?<\/button>/g) ?? [];
  const button = buttons.find(candidate => candidate.includes(label));
  expect(button, `Expected button ${label}`).toBeDefined();
  return button ?? "";
}

function isDisabled(button: string) {
  return /\bdisabled(?:=""|(?=[\s>]))/i.test(button);
}

describe("Tetradic Founder Edition admin page", () => {
  it("renders payment, deadline, intake questions, birth details, and consent", () => {
    const markup = renderFounderEdition();

    expect(markup).toContain("Founder Edition fulfillment");
    expect(markup).toContain("Payment provider");
    expect(markup).toContain("PayPal");
    expect(markup).toContain("PayPal order");
    expect(markup).toContain(bundle.order.paypalOrderId);
    expect(markup).toContain("PayPal capture");
    expect(markup).toContain(bundle.order.paypalCaptureId);
    expect(markup).toContain("Paid at");
    expect(markup).toContain("Delivery due");
    expect(markup).toContain("31 Jul 2026");

    expect(markup).toContain("Birth details");
    expect(markup).toContain("1990-01-02");
    expect(markup).toContain("03:04");
    expect(markup).toContain("Bucharest");
    expect(markup).toContain("Romania");
    expect(markup).toContain("Europe/Bucharest");
    expect(markup).toContain("Question one");
    expect(markup).toContain(bundle.intake?.questionOne);
    expect(markup).toContain("Question two");
    expect(markup).toContain(bundle.intake?.questionTwo);
    expect(markup).toContain("Consent");
    expect(markup).toContain("Accepted");
  });

  it("renders no generated-document controls for Founder Edition", () => {
    const markup = renderFounderEdition();

    expect(markup).not.toContain("Snapshot");
    expect(markup).not.toContain("Draft");
    expect(markup).not.toContain("PDF");
    expect(markup).not.toContain("Upload");
    expect(markup).not.toContain("Follow-up");
    expect(markup.match(/<button\b/g)).toHaveLength(2);
    expect(markup).toContain("Start curation");
    expect(markup).toContain("Mark delivered");
  });

  it("guards the two manual workflow transitions", () => {
    const ready = renderFounderEdition({ status: "intake_received" });
    expect(isDisabled(buttonWithLabel(ready, "Start curation"))).toBe(false);
    expect(isDisabled(buttonWithLabel(ready, "Mark delivered"))).toBe(true);

    const withoutConsent = renderFounderEdition(
      { status: "intake_received" },
      false
    );
    expect(
      isDisabled(buttonWithLabel(withoutConsent, "Start curation"))
    ).toBe(true);

    const curating = renderFounderEdition({ status: "in_curation" });
    expect(
      isDisabled(buttonWithLabel(curating, "Start curation"))
    ).toBe(true);
    expect(
      isDisabled(buttonWithLabel(curating, "Mark delivered"))
    ).toBe(false);

    const delivered = renderFounderEdition({ status: "delivered" });
    expect(
      isDisabled(buttonWithLabel(delivered, "Start curation"))
    ).toBe(true);
    expect(
      isDisabled(buttonWithLabel(delivered, "Mark delivered"))
    ).toBe(true);
  });

  it("keeps the legacy workflow controls and uses only local Visual Law tokens", () => {
    const source = readFileSync(resolve(process.cwd(), COMPONENT), "utf8");

    expect(source).toContain("generateSnapshot.mutate");
    expect(source).toContain("generateDraft.mutate");
    expect(source).toContain("Upload final PDF");
    expect(source).toContain("Follow-up used");
    expect(source).toContain('productType: "glimpse" | "founding"');

    expect(source).toContain('bg: "#050505"');
    expect(source).toContain('panel: "#0a0907"');
    expect(source).toContain('gold: "#d8b56d"');
    expect(source).toContain('text: "#fff7e6"');
  });
});
