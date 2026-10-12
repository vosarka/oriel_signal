import { describe, expect, it, vi } from "vitest";

vi.mock("./_core/env", () => ({
  ENV: {
    paypalApiBaseUrl: "https://paypal.test",
    paypalClientId: "id",
    paypalClientSecret: "secret",
    appBaseUrl: "https://orielsignal.space",
  },
}));
vi.mock("./paypal-webhook", () => ({ handlePayPalWebhook: vi.fn() }));

import { captureReadingOrder, createReadingOrder, readingCustomId } from "./founders-reading-paypal";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

function paypal(next: unknown, status = 200) {
  return vi.fn(async (url: string, _init?: RequestInit) =>
    String(url).endsWith("/v1/oauth2/token") ? json({ access_token: "t" }) : json(next, status)
  );
}

const completed = (overrides: Record<string, unknown> = {}) => ({
  id: "ORDER1",
  status: "COMPLETED",
  purchase_units: [
    {
      custom_id: readingCustomId(7),
      payments: {
        captures: [{ id: "CAP1", status: "COMPLETED", amount: { currency_code: "EUR", value: "10.00" } }],
      },
      ...overrides,
    },
  ],
});

describe("Founder's Reading PayPal order", () => {
  it("creates an order at the row's price and returns the approval link", async () => {
    const fetch = paypal({ id: "ORDER1", links: [{ rel: "payer-action", href: "https://paypal.test/pay" }] });
    await expect(
      createReadingOrder(
        { transmissionId: 7, priceEur: 10, returnUrl: "https://x/r", cancelUrl: "https://x/c" },
        fetch as never
      )
    ).resolves.toEqual({ paypalOrderId: "ORDER1", approveUrl: "https://paypal.test/pay" });
    const body = JSON.parse(String(fetch.mock.calls[1][1]?.body));
    expect(body.purchase_units[0]).toMatchObject({
      custom_id: "founders-reading-7",
      amount: { currency_code: "EUR", value: "10.00" },
    });
  });

  it("returns the capture id when the capture matches the row", async () => {
    await expect(
      captureReadingOrder({ transmissionId: 7, paypalOrderId: "ORDER1", priceEur: 10 }, paypal(completed()) as never)
    ).resolves.toEqual({ captureId: "CAP1", pending: false });
  });

  it.each([
    ["a different amount (the 50th seat sold mid-checkout)", completed({
      payments: { captures: [{ id: "CAP1", status: "COMPLETED", amount: { currency_code: "EUR", value: "15.00" } }] },
    })],
    ["another row's order", completed({ custom_id: readingCustomId(8) })],
    ["a capture that was declined", completed({
      payments: { captures: [{ id: "CAP1", status: "DECLINED", amount: { currency_code: "EUR", value: "10.00" } }] },
    })],
  ])("refuses %s", async (_label, payload) => {
    await expect(
      captureReadingOrder({ transmissionId: 7, paypalOrderId: "ORDER1", priceEur: 10 }, paypal(payload) as never)
    ).rejects.toThrow();
  });

  it("refuses when PayPal rejects the capture", async () => {
    await expect(
      captureReadingOrder({ transmissionId: 7, paypalOrderId: "ORDER1", priceEur: 10 }, paypal({}, 422) as never)
    ).rejects.toThrow();
  });
});

describe("capture that is held or retried", () => {
  it("accepts a capture PayPal holds as PENDING, and says so", async () => {
    const held = completed({
      payments: { captures: [{ id: "CAP1", status: "PENDING", amount: { currency_code: "EUR", value: "10.00" } }] },
    });
    await expect(
      captureReadingOrder({ transmissionId: 7, paypalOrderId: "ORDER1", priceEur: 10 }, paypal(held) as never)
    ).resolves.toEqual({ captureId: "CAP1", pending: true });
  });

  it("reads the order when the capture call fails because it was already captured", async () => {
    const fetch = vi.fn(async (url: string, init?: RequestInit) => {
      if (String(url).endsWith("/v1/oauth2/token")) return json({ access_token: "t" });
      if (init?.method === "POST") return json({ name: "UNPROCESSABLE_ENTITY" }, 422);
      return json(completed());
    });
    await expect(
      captureReadingOrder({ transmissionId: 7, paypalOrderId: "ORDER1", priceEur: 10 }, fetch as never)
    ).resolves.toEqual({ captureId: "CAP1", pending: false });
  });
});
