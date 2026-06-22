import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";
import {
  getSignatureProductByType,
  signatureProducts,
} from "../client/src/pages/signature-products";

describe("ORIEL product detail page", () => {
  it("defines the single active founder blueprint product page", () => {
    expect(signatureProducts).toHaveLength(1);

    const founding = getSignatureProductByType("founding");
    expect(founding.title).toBe("ORIEL Founder’s Vision Blueprint");
    expect(founding.subtitle).toBe("Your Quantum Architecture");
    expect(founding.price).toBe("€97");
    expect(founding.detailPath).toBe("/founder-signature-blueprint");
    expect(founding.pages).toBe("15–20 page curated blueprint PDF");
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
