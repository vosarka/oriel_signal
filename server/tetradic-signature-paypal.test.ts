import { describe, expect, it, vi } from "vitest";

import {
  TETRADIC_SIGNATURE_PAYPAL_PRODUCT,
  TetradicSignaturePayPalError,
  createTetradicSignaturePayPalAdapter,
  makeTetradicSignaturePayPalCustomId,
  makeTetradicSignaturePayPalInvoiceId,
  validateTetradicSignatureCompletedOrder,
  type PayPalFetch,
} from "./tetradic-signature-paypal";

const config = {
  apiBaseUrl: "https://api-m.sandbox.paypal.com",
  clientId: "sandbox-client-id",
  clientSecret: "sandbox-client-secret",
  webhookId: "sandbox-webhook-id",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function createFetchMock(...responses: Response[]) {
  const fetchMock = vi.fn(async () => {
    const response = responses.shift();
    if (!response) throw new Error("Unexpected fetch call");
    return response;
  });

  return {
    fetchMock,
    fetch: fetchMock as unknown as PayPalFetch,
  };
}

function completedOrder(overrides: Record<string, unknown> = {}) {
  return {
    id: "PAYPAL-ORDER-91",
    status: "COMPLETED",
    purchase_units: [
      {
        custom_id: makeTetradicSignaturePayPalCustomId(91),
        invoice_id: makeTetradicSignaturePayPalInvoiceId(91),
        payments: {
          captures: [
            {
              id: "CAPTURE-91",
              status: "COMPLETED",
              update_time: "2026-07-26T08:30:00Z",
              amount: {
                currency_code: "EUR",
                value: "81.32",
              },
            },
          ],
        },
      },
    ],
    ...overrides,
  };
}

describe("Tetradic Signature PayPal adapter", () => {
  it("obtains an OAuth token without placing credentials in the request body", async () => {
    const { fetch, fetchMock } = createFetchMock(
      jsonResponse({
        access_token: "sandbox-access-token",
        token_type: "Bearer",
        expires_in: 32_400,
      })
    );
    const adapter = createTetradicSignaturePayPalAdapter({ config, fetch });

    await expect(adapter.getAccessToken()).resolves.toBe(
      "sandbox-access-token"
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api-m.sandbox.paypal.com/v1/oauth2/token");
    expect(init?.method).toBe("POST");
    expect(init?.body).toBe("grant_type=client_credentials");

    const headers = new Headers(init?.headers);
    expect(headers.get("authorization")).toBe(
      `Basic ${Buffer.from(
        "sandbox-client-id:sandbox-client-secret",
        "utf8"
      ).toString("base64")}`
    );
    expect(headers.get("content-type")).toBe(
      "application/x-www-form-urlencoded"
    );
    expect(String(init?.body)).not.toContain("sandbox-client-secret");
  });

  it("creates the Founder Edition order with the fixed price and returns its approve link", async () => {
    const { fetch, fetchMock } = createFetchMock(
      jsonResponse({ access_token: "oauth-token" }),
      jsonResponse({
        id: "PAYPAL-ORDER-91",
        status: "CREATED",
        links: [
          {
            rel: "approve",
            href: "https://www.sandbox.paypal.com/checkoutnow?token=91",
            method: "GET",
          },
        ],
      })
    );
    const adapter = createTetradicSignaturePayPalAdapter({ config, fetch });

    await expect(
      adapter.createOrder({
        orderId: 91,
        returnUrl: "https://orielsignal.space/signature-order/91?paid=1",
        cancelUrl: "https://orielsignal.space/tetradic-signature?cancelled=1",
      })
    ).resolves.toEqual({
      paypalOrderId: "PAYPAL-ORDER-91",
      approveUrl: "https://www.sandbox.paypal.com/checkoutnow?token=91",
      status: "CREATED",
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [url, init] = fetchMock.mock.calls[1];
    expect(url).toBe("https://api-m.sandbox.paypal.com/v2/checkout/orders");
    expect(init?.method).toBe("POST");

    const headers = new Headers(init?.headers);
    expect(headers.get("authorization")).toBe("Bearer oauth-token");
    expect(headers.get("paypal-request-id")).toBe(
      "tetradic-signature-create-91"
    );

    const body = JSON.parse(String(init?.body));
    expect(TETRADIC_SIGNATURE_PAYPAL_PRODUCT.name).toBe(
      "THE TETRADIC SIGNATURE — FOUNDER EDITION"
    );
    expect(TETRADIC_SIGNATURE_PAYPAL_PRODUCT.description).toBe(
      "THE TETRADIC SIGNATURE — FOUNDER EDITION"
    );
    expect(body).toMatchObject({
      intent: "CAPTURE",
      purchase_units: [
        {
          custom_id: "tetradic-signature-order-91",
          invoice_id: "TETRADIC-SIGNATURE-91",
          description: TETRADIC_SIGNATURE_PAYPAL_PRODUCT.description,
          amount: {
            currency_code: "EUR",
            value: "81.32",
          },
        },
      ],
      payment_source: {
        paypal: {
          experience_context: {
            brand_name: "ORIEL",
            return_url: "https://orielsignal.space/signature-order/91?paid=1",
            cancel_url:
              "https://orielsignal.space/tetradic-signature?cancelled=1",
            user_action: "PAY_NOW",
            shipping_preference: "NO_SHIPPING",
          },
        },
      },
    });
    expect(body.application_context).toBeUndefined();
  });

  it("returns the payer-action link for a PayPal wallet order", async () => {
    const { fetch } = createFetchMock(
      jsonResponse({ access_token: "oauth-token" }),
      jsonResponse({
        id: "PAYPAL-ORDER-92",
        status: "PAYER_ACTION_REQUIRED",
        links: [
          {
            rel: "self",
            href: "https://api-m.paypal.com/v2/checkout/orders/PAYPAL-ORDER-92",
            method: "GET",
          },
          {
            rel: "payer-action",
            href: "https://www.paypal.com/checkoutnow?token=PAYPAL-ORDER-92",
            method: "GET",
          },
        ],
      })
    );
    const adapter = createTetradicSignaturePayPalAdapter({ config, fetch });

    await expect(
      adapter.createOrder({
        orderId: 92,
        returnUrl: "https://orielsignal.space/signature-order/92?paid=1",
        cancelUrl: "https://orielsignal.space/tetradic-signature?cancelled=1",
      })
    ).resolves.toEqual({
      paypalOrderId: "PAYPAL-ORDER-92",
      approveUrl:
        "https://www.paypal.com/checkoutnow?token=PAYPAL-ORDER-92",
      status: "PAYER_ACTION_REQUIRED",
    });
  });

  it("rejects a create response that has no approve link", async () => {
    const { fetch } = createFetchMock(
      jsonResponse({ access_token: "oauth-token" }),
      jsonResponse({
        id: "PAYPAL-ORDER-91",
        status: "CREATED",
        links: [{ rel: "self", href: "https://api.example/order/91" }],
      })
    );
    const adapter = createTetradicSignaturePayPalAdapter({ config, fetch });

    await expect(
      adapter.createOrder({
        orderId: 91,
        returnUrl: "https://orielsignal.space/signature-order/91",
        cancelUrl: "https://orielsignal.space/tetradic-signature",
      })
    ).rejects.toMatchObject({
      name: "TetradicSignaturePayPalError",
      code: "MALFORMED_CREATE_RESPONSE",
    });
  });

  it("captures server-side with a deterministic idempotency key", async () => {
    const { fetch, fetchMock } = createFetchMock(
      jsonResponse({ access_token: "oauth-token" }),
      jsonResponse(completedOrder())
    );
    const adapter = createTetradicSignaturePayPalAdapter({ config, fetch });

    await expect(
      adapter.captureOrder({
        orderId: 91,
        paypalOrderId: "PAYPAL-ORDER-91",
      })
    ).resolves.toEqual({
      paypalOrderId: "PAYPAL-ORDER-91",
      captureId: "CAPTURE-91",
      capturedAt: "2026-07-26T08:30:00.000Z",
      status: "COMPLETED",
      captureStatus: "COMPLETED",
      customId: "tetradic-signature-order-91",
      invoiceId: "TETRADIC-SIGNATURE-91",
      currency: "EUR",
      amount: "81.32",
    });

    const [url, init] = fetchMock.mock.calls[1];
    expect(url).toBe(
      "https://api-m.sandbox.paypal.com/v2/checkout/orders/PAYPAL-ORDER-91/capture"
    );
    expect(init?.method).toBe("POST");
    const headers = new Headers(init?.headers);
    expect(headers.get("paypal-request-id")).toBe(
      "tetradic-signature-capture-91"
    );
    expect(headers.get("prefer")).toBe("return=representation");
  });

  it("retries a completed capture with the same idempotency key", async () => {
    const { fetch, fetchMock } = createFetchMock(
      jsonResponse({ access_token: "oauth-token-1" }),
      jsonResponse(completedOrder(), 201),
      jsonResponse({ access_token: "oauth-token-2" }),
      jsonResponse(completedOrder(), 200)
    );
    const adapter = createTetradicSignaturePayPalAdapter({ config, fetch });
    const input = {
      orderId: 91,
      paypalOrderId: "PAYPAL-ORDER-91",
    };

    const firstCapture = await adapter.captureOrder(input);
    const retriedCapture = await adapter.captureOrder(input);

    expect(retriedCapture).toEqual(firstCapture);
    const firstHeaders = new Headers(fetchMock.mock.calls[1][1]?.headers);
    const retryHeaders = new Headers(fetchMock.mock.calls[3][1]?.headers);
    expect(firstHeaders.get("paypal-request-id")).toBe(
      "tetradic-signature-capture-91"
    );
    expect(retryHeaders.get("paypal-request-id")).toBe(
      firstHeaders.get("paypal-request-id")
    );
  });

  it("recovers an already-captured order through a validated server-side lookup", async () => {
    const { fetch, fetchMock } = createFetchMock(
      jsonResponse({ access_token: "oauth-token" }),
      jsonResponse(
        {
          name: "UNPROCESSABLE_ENTITY",
          details: [{ issue: "ORDER_ALREADY_CAPTURED" }],
        },
        422
      ),
      jsonResponse(completedOrder())
    );
    const adapter = createTetradicSignaturePayPalAdapter({ config, fetch });

    await expect(
      adapter.captureOrder({
        orderId: 91,
        paypalOrderId: "PAYPAL-ORDER-91",
      })
    ).resolves.toMatchObject({
      paypalOrderId: "PAYPAL-ORDER-91",
      captureId: "CAPTURE-91",
      status: "COMPLETED",
      currency: "EUR",
      amount: "81.32",
    });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    const [captureUrl, captureInit] = fetchMock.mock.calls[1];
    expect(captureUrl).toContain("/PAYPAL-ORDER-91/capture");
    expect(new Headers(captureInit?.headers).get("paypal-request-id")).toBe(
      "tetradic-signature-capture-91"
    );

    const [lookupUrl, lookupInit] = fetchMock.mock.calls[2];
    expect(lookupUrl).toBe(
      "https://api-m.sandbox.paypal.com/v2/checkout/orders/PAYPAL-ORDER-91"
    );
    expect(lookupInit?.method).toBe("GET");
    expect(new Headers(lookupInit?.headers).get("authorization")).toBe(
      "Bearer oauth-token"
    );
  });

  it.each([
    [
      "order status",
      completedOrder({ status: "APPROVED" }),
      "PAYPAL_ORDER_NOT_COMPLETED",
    ],
    [
      "capture status",
      completedOrder({
        purchase_units: [
          {
            custom_id: makeTetradicSignaturePayPalCustomId(91),
            invoice_id: makeTetradicSignaturePayPalInvoiceId(91),
            payments: {
              captures: [
                {
                  id: "CAPTURE-91",
                  status: "PENDING",
                  amount: { currency_code: "EUR", value: "81.32" },
                },
              ],
            },
          },
        ],
      }),
      "PAYPAL_CAPTURE_NOT_COMPLETED",
    ],
    [
      "currency",
      completedOrder({
        purchase_units: [
          {
            custom_id: makeTetradicSignaturePayPalCustomId(91),
            invoice_id: makeTetradicSignaturePayPalInvoiceId(91),
            payments: {
              captures: [
                {
                  id: "CAPTURE-91",
                  status: "COMPLETED",
                  amount: { currency_code: "USD", value: "81.32" },
                },
              ],
            },
          },
        ],
      }),
      "PAYPAL_CAPTURE_CURRENCY_MISMATCH",
    ],
    [
      "amount",
      completedOrder({
        purchase_units: [
          {
            custom_id: makeTetradicSignaturePayPalCustomId(91),
            invoice_id: makeTetradicSignaturePayPalInvoiceId(91),
            payments: {
              captures: [
                {
                  id: "CAPTURE-91",
                  status: "COMPLETED",
                  amount: { currency_code: "EUR", value: "81.31" },
                },
              ],
            },
          },
        ],
      }),
      "PAYPAL_CAPTURE_AMOUNT_MISMATCH",
    ],
    [
      "custom id",
      completedOrder({
        purchase_units: [
          {
            custom_id: "tetradic-signature-order-92",
            invoice_id: makeTetradicSignaturePayPalInvoiceId(91),
            payments: {
              captures: [
                {
                  id: "CAPTURE-91",
                  status: "COMPLETED",
                  amount: { currency_code: "EUR", value: "81.32" },
                },
              ],
            },
          },
        ],
      }),
      "PAYPAL_CUSTOM_ID_MISMATCH",
    ],
  ])("strictly rejects a mismatched %s", (_label, payload, code) => {
    expect(() =>
      validateTetradicSignatureCompletedOrder(payload, {
        orderId: 91,
        paypalOrderId: "PAYPAL-ORDER-91",
      })
    ).toThrow(
      expect.objectContaining({
        name: "TetradicSignaturePayPalError",
        code,
      })
    );
  });

  it("verifies a webhook through PayPal using all transmission headers and webhookId", async () => {
    const { fetch, fetchMock } = createFetchMock(
      jsonResponse({ access_token: "oauth-token" }),
      jsonResponse({ verification_status: "SUCCESS" })
    );
    const adapter = createTetradicSignaturePayPalAdapter({ config, fetch });
    const event = {
      id: "WH-91",
      event_type: "PAYMENT.CAPTURE.COMPLETED",
      resource: { id: "CAPTURE-91" },
    };

    await expect(
      adapter.verifyWebhook({
        headers: {
          "paypal-auth-algo": "SHA256withRSA",
          "paypal-cert-url": "https://api.paypal.com/cert.pem",
          "paypal-transmission-id": "transmission-91",
          "paypal-transmission-sig": "signature-91",
          "paypal-transmission-time": "2026-07-26T08:30:00Z",
        },
        event,
      })
    ).resolves.toBe(true);

    const [url, init] = fetchMock.mock.calls[1];
    expect(url).toBe(
      "https://api-m.sandbox.paypal.com/v1/notifications/verify-webhook-signature"
    );
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toEqual({
      auth_algo: "SHA256withRSA",
      cert_url: "https://api.paypal.com/cert.pem",
      transmission_id: "transmission-91",
      transmission_sig: "signature-91",
      transmission_time: "2026-07-26T08:30:00Z",
      webhook_id: "sandbox-webhook-id",
      webhook_event: event,
    });
  });

  it("returns false for a PayPal webhook verification failure", async () => {
    const { fetch } = createFetchMock(
      jsonResponse({ access_token: "oauth-token" }),
      jsonResponse({ verification_status: "FAILURE" })
    );
    const adapter = createTetradicSignaturePayPalAdapter({ config, fetch });

    await expect(
      adapter.verifyWebhook({
        headers: new Headers({
          "PAYPAL-AUTH-ALGO": "SHA256withRSA",
          "PAYPAL-CERT-URL": "https://api.paypal.com/cert.pem",
          "PAYPAL-TRANSMISSION-ID": "transmission-91",
          "PAYPAL-TRANSMISSION-SIG": "signature-91",
          "PAYPAL-TRANSMISSION-TIME": "2026-07-26T08:30:00Z",
        }),
        event: { id: "WH-91" },
      })
    ).resolves.toBe(false);
  });

  it("rejects missing webhook headers before making any network request", async () => {
    const { fetch, fetchMock } = createFetchMock();
    const adapter = createTetradicSignaturePayPalAdapter({ config, fetch });

    await expect(
      adapter.verifyWebhook({
        headers: {
          "paypal-transmission-id": "transmission-91",
        },
        event: { id: "WH-91" },
      })
    ).rejects.toBeInstanceOf(TetradicSignaturePayPalError);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
