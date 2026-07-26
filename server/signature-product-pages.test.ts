import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";
import {
  getSignatureProductByType,
  signatureProducts,
} from "../client/src/pages/signature-products";

describe("ORIEL product detail page", () => {
  it("defines the single active Tetradic Founder Edition product page", () => {
    expect(signatureProducts).toHaveLength(1);

    const founding = getSignatureProductByType("founding");
    expect(founding.title).toBe("THE TETRADIC SIGNATURE — FOUNDER EDITION");
    expect(founding.subtitle).toBe("Your Resonance Architecture");
    expect(founding.price).toBe("€81,32");
    expect(founding.detailPath).toBe("/tetradic-signature");
    expect(founding.pages).toBe("48-page Founder Edition");
    expect(founding.processSteps.at(-1)).toContain("5 calendar days");
    expect(JSON.stringify(founding)).not.toMatch(/generate pdf|download/i);
    expect(founding.descriptionSections.length).toBeGreaterThanOrEqual(3);
    expect(founding.bestFor.length).toBeGreaterThanOrEqual(3);
  });

  it("keeps the aggregate Begin CTA returning to each product detail page after auth", () => {
    const source = readFileSync(
      resolve(process.cwd(), "client/src/pages/FoundingSignatureLetter.tsx"),
      "utf8"
    );

    expect(source).toContain("getLoginUrl(returnTo)");
    expect(source).toContain("beginCheckout(product.type, product.detailPath)");
  });
});
