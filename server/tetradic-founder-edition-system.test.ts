import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  TETRADIC_FOUNDER_EDITION_PRODUCT,
  assertCanMarkFounderEditionDelivered,
  assertCanMarkFounderEditionInProgress,
} from "./signature-letter-system";

describe("Tetradic Founder Edition contract", () => {
  it("keeps the public product promise exact", () => {
    expect(TETRADIC_FOUNDER_EDITION_PRODUCT).toEqual({
      productType: "tetradic_founder_edition",
      title: "THE TETRADIC SIGNATURE — FOUNDER EDITION",
      subtitle: "Your Resonance Architecture",
      priceEur: 81.32,
      currency: "eur",
      exactPages: 48,
      deliveryCalendarDays: 5,
      fulfillment: "manual_email",
      generatedPdf: false,
    });
  });

  it("ships an additive-only SQL migration", () => {
    const migration = readFileSync(
      new URL(
        "../drizzle/0013_tetradic_founder_edition_checkout.sql",
        import.meta.url
      ),
      "utf8"
    );

    expect(migration).not.toMatch(/\b(?:DROP|TRUNCATE|DELETE)\b/i);
    expect(migration).toContain(
      "enum('glimpse', 'founding', 'tetradic_founder_edition')"
    );
  });

  it("keeps the Founder Edition schema change out of runtime DDL", () => {
    const runtimeDb = readFileSync(new URL("./db.ts", import.meta.url), "utf8");

    expect(runtimeDb).not.toMatch(/ALTER TABLE[^\n]+tetradic_founder_edition/);
    expect(runtimeDb).not.toMatch(/ALTER TABLE[^\n]+paypal(?:Order|Capture)Id/);
    expect(runtimeDb).not.toMatch(/ALTER TABLE[^\n]+question(?:One|Two)/);
  });

  it("only starts manual curation after a paid intake has been received", () => {
    expect(() =>
      assertCanMarkFounderEditionInProgress({
        productType: "tetradic_founder_edition",
        status: "pending_payment",
      })
    ).toThrow(/intake_received/i);

    expect(() =>
      assertCanMarkFounderEditionInProgress({
        productType: "founding",
        status: "intake_received",
      })
    ).toThrow(/Founder Edition/i);

    expect(() =>
      assertCanMarkFounderEditionInProgress({
        productType: "tetradic_founder_edition",
        status: "intake_received",
      })
    ).not.toThrow();

    expect(() =>
      assertCanMarkFounderEditionInProgress({
        productType: "tetradic_founder_edition",
        status: "in_curation",
      })
    ).not.toThrow();
  });

  it("only marks the manually curated edition delivered from in_curation", () => {
    expect(() =>
      assertCanMarkFounderEditionDelivered({
        productType: "tetradic_founder_edition",
        status: "intake_received",
      })
    ).toThrow(/in_curation/i);

    expect(() =>
      assertCanMarkFounderEditionDelivered({
        productType: "founding",
        status: "in_curation",
      })
    ).toThrow(/Founder Edition/i);

    expect(() =>
      assertCanMarkFounderEditionDelivered({
        productType: "tetradic_founder_edition",
        status: "in_curation",
      })
    ).not.toThrow();

    expect(() =>
      assertCanMarkFounderEditionDelivered({
        productType: "tetradic_founder_edition",
        status: "delivered",
      })
    ).not.toThrow();
  });
});
