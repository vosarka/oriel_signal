export const TETRADIC_SIGNATURE_PAYPAL_PRODUCT = {
  name: "THE TETRADIC SIGNATURE — FOUNDER EDITION",
  currency: "EUR",
  amount: "81.32",
  description: "THE TETRADIC SIGNATURE — FOUNDER EDITION",
} as const;

export type PayPalFetch = (
  input: string | URL | Request,
  init?: RequestInit
) => Promise<Response>;

export interface TetradicSignaturePayPalConfig {
  apiBaseUrl: string;
  clientId: string;
  clientSecret: string;
  webhookId: string;
}

export type TetradicSignaturePayPalErrorCode =
  | "INVALID_CONFIG"
  | "INVALID_ORDER_ID"
  | "INVALID_PAYPAL_ORDER_ID"
  | "INVALID_REDIRECT_URL"
  | "INVALID_WEBHOOK_EVENT"
  | "MISSING_WEBHOOK_HEADERS"
  | "PAYPAL_NETWORK_ERROR"
  | "PAYPAL_OAUTH_REQUEST_FAILED"
  | "PAYPAL_CREATE_REQUEST_FAILED"
  | "PAYPAL_CAPTURE_REQUEST_FAILED"
  | "PAYPAL_ORDER_LOOKUP_REQUEST_FAILED"
  | "PAYPAL_WEBHOOK_VERIFICATION_REQUEST_FAILED"
  | "MALFORMED_OAUTH_RESPONSE"
  | "MALFORMED_CREATE_RESPONSE"
  | "MALFORMED_CAPTURE_RESPONSE"
  | "MALFORMED_WEBHOOK_VERIFICATION_RESPONSE"
  | "PAYPAL_ORDER_ID_MISMATCH"
  | "PAYPAL_ORDER_NOT_COMPLETED"
  | "PAYPAL_CAPTURE_NOT_COMPLETED"
  | "PAYPAL_CAPTURE_CURRENCY_MISMATCH"
  | "PAYPAL_CAPTURE_AMOUNT_MISMATCH"
  | "PAYPAL_CUSTOM_ID_MISMATCH"
  | "PAYPAL_INVOICE_ID_MISMATCH";

export class TetradicSignaturePayPalError extends Error {
  readonly code: TetradicSignaturePayPalErrorCode;
  readonly httpStatus?: number;

  constructor(
    code: TetradicSignaturePayPalErrorCode,
    message: string,
    options: { httpStatus?: number } = {}
  ) {
    super(message);
    this.name = "TetradicSignaturePayPalError";
    this.code = code;
    this.httpStatus = options.httpStatus;
  }
}

export interface TetradicSignatureCompletedOrder {
  paypalOrderId: string;
  captureId: string;
  status: "COMPLETED";
  captureStatus: "COMPLETED";
  customId: string;
  invoiceId: string;
  currency: typeof TETRADIC_SIGNATURE_PAYPAL_PRODUCT.currency;
  amount: typeof TETRADIC_SIGNATURE_PAYPAL_PRODUCT.amount;
}

export interface TetradicSignatureCreatedOrder {
  paypalOrderId: string;
  approveUrl: string;
  status: string;
}

export interface CreateTetradicSignatureOrderInput {
  orderId: number;
  returnUrl: string;
  cancelUrl: string;
}

export interface CaptureTetradicSignatureOrderInput {
  orderId: number;
  paypalOrderId: string;
}

export type PayPalWebhookHeaders =
  | Headers
  | Record<string, string | string[] | undefined>;

export interface VerifyTetradicSignatureWebhookInput {
  headers: PayPalWebhookHeaders;
  event: unknown;
}

export interface TetradicSignaturePayPalAdapter {
  getAccessToken(): Promise<string>;
  createOrder(
    input: CreateTetradicSignatureOrderInput
  ): Promise<TetradicSignatureCreatedOrder>;
  captureOrder(
    input: CaptureTetradicSignatureOrderInput
  ): Promise<TetradicSignatureCompletedOrder>;
  verifyWebhook(
    input: VerifyTetradicSignatureWebhookInput
  ): Promise<boolean>;
}

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireOrderId(orderId: number): number {
  if (!Number.isSafeInteger(orderId) || orderId <= 0) {
    throw new TetradicSignaturePayPalError(
      "INVALID_ORDER_ID",
      "The internal order ID must be a positive safe integer."
    );
  }

  return orderId;
}

function requirePayPalOrderId(paypalOrderId: string): string {
  if (
    typeof paypalOrderId !== "string" ||
    paypalOrderId.length === 0 ||
    paypalOrderId.length > 128 ||
    !/^[A-Za-z0-9_-]+$/.test(paypalOrderId)
  ) {
    throw new TetradicSignaturePayPalError(
      "INVALID_PAYPAL_ORDER_ID",
      "The PayPal order ID is invalid."
    );
  }

  return paypalOrderId;
}

function requireRedirectUrl(value: string): string {
  let parsed: URL;

  try {
    parsed = new URL(value);
  } catch {
    throw new TetradicSignaturePayPalError(
      "INVALID_REDIRECT_URL",
      "The PayPal redirect URL must be an absolute HTTP or HTTPS URL."
    );
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new TetradicSignaturePayPalError(
      "INVALID_REDIRECT_URL",
      "The PayPal redirect URL must be an absolute HTTP or HTTPS URL."
    );
  }

  return parsed.toString();
}

function normalizeConfig(
  config: TetradicSignaturePayPalConfig
): TetradicSignaturePayPalConfig {
  if (
    !config ||
    typeof config.apiBaseUrl !== "string" ||
    typeof config.clientId !== "string" ||
    typeof config.clientSecret !== "string" ||
    typeof config.webhookId !== "string" ||
    config.clientId.trim().length === 0 ||
    config.clientSecret.trim().length === 0 ||
    config.webhookId.trim().length === 0
  ) {
    throw new TetradicSignaturePayPalError(
      "INVALID_CONFIG",
      "The PayPal adapter configuration is incomplete."
    );
  }

  let apiBaseUrl: URL;

  try {
    apiBaseUrl = new URL(config.apiBaseUrl);
  } catch {
    throw new TetradicSignaturePayPalError(
      "INVALID_CONFIG",
      "The PayPal API base URL is invalid."
    );
  }

  if (
    apiBaseUrl.protocol !== "https:" ||
    apiBaseUrl.username ||
    apiBaseUrl.password ||
    apiBaseUrl.search ||
    apiBaseUrl.hash
  ) {
    throw new TetradicSignaturePayPalError(
      "INVALID_CONFIG",
      "The PayPal API base URL must be a credential-free HTTPS URL."
    );
  }

  return {
    apiBaseUrl: apiBaseUrl.toString().replace(/\/+$/, ""),
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    webhookId: config.webhookId,
  };
}

function responseError(
  code:
    | "PAYPAL_OAUTH_REQUEST_FAILED"
    | "PAYPAL_CREATE_REQUEST_FAILED"
    | "PAYPAL_CAPTURE_REQUEST_FAILED"
    | "PAYPAL_ORDER_LOOKUP_REQUEST_FAILED"
    | "PAYPAL_WEBHOOK_VERIFICATION_REQUEST_FAILED",
  message: string,
  response: Response
): TetradicSignaturePayPalError {
  return new TetradicSignaturePayPalError(code, message, {
    httpStatus: response.status,
  });
}

async function request(
  fetch: PayPalFetch,
  url: string,
  init: RequestInit
): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch {
    throw new TetradicSignaturePayPalError(
      "PAYPAL_NETWORK_ERROR",
      "The PayPal API request could not be completed."
    );
  }
}

async function readJson(
  response: Response,
  code:
    | "MALFORMED_OAUTH_RESPONSE"
    | "MALFORMED_CREATE_RESPONSE"
    | "MALFORMED_CAPTURE_RESPONSE"
    | "MALFORMED_WEBHOOK_VERIFICATION_RESPONSE",
  message: string
): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new TetradicSignaturePayPalError(code, message);
  }
}

async function responseHasPayPalIssue(
  response: Response,
  expectedIssue: string
): Promise<boolean> {
  if (response.status !== 422) return false;

  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    return false;
  }

  return (
    isRecord(payload) &&
    Array.isArray(payload.details) &&
    payload.details.some(
      detail => isRecord(detail) && detail.issue === expectedIssue
    )
  );
}

function requireSingleRecord(
  value: unknown,
  code: "MALFORMED_CAPTURE_RESPONSE",
  message: string
): JsonRecord {
  if (!isRecord(value)) {
    throw new TetradicSignaturePayPalError(code, message);
  }

  return value;
}

function requireSingleArrayItem(
  value: unknown,
  code: "MALFORMED_CAPTURE_RESPONSE",
  message: string
): unknown {
  if (!Array.isArray(value) || value.length !== 1) {
    throw new TetradicSignaturePayPalError(code, message);
  }

  return value[0];
}

export function makeTetradicSignaturePayPalCustomId(
  orderId: number
): string {
  return `tetradic-signature-order-${requireOrderId(orderId)}`;
}

export function makeTetradicSignaturePayPalInvoiceId(
  orderId: number
): string {
  return `TETRADIC-SIGNATURE-${requireOrderId(orderId)}`;
}

export function validateTetradicSignatureCompletedOrder(
  payload: unknown,
  expected: CaptureTetradicSignatureOrderInput
): TetradicSignatureCompletedOrder {
  const orderId = requireOrderId(expected.orderId);
  const expectedPayPalOrderId = requirePayPalOrderId(expected.paypalOrderId);
  const order = requireSingleRecord(
    payload,
    "MALFORMED_CAPTURE_RESPONSE",
    "The PayPal capture response is malformed."
  );

  if (order.id !== expectedPayPalOrderId) {
    throw new TetradicSignaturePayPalError(
      "PAYPAL_ORDER_ID_MISMATCH",
      "The captured PayPal order does not match the requested order."
    );
  }

  if (order.status !== "COMPLETED") {
    throw new TetradicSignaturePayPalError(
      "PAYPAL_ORDER_NOT_COMPLETED",
      "The PayPal order is not completed."
    );
  }

  const purchaseUnit = requireSingleRecord(
    requireSingleArrayItem(
      order.purchase_units,
      "MALFORMED_CAPTURE_RESPONSE",
      "The PayPal capture response must contain one purchase unit."
    ),
    "MALFORMED_CAPTURE_RESPONSE",
    "The PayPal purchase unit is malformed."
  );
  const expectedCustomId = makeTetradicSignaturePayPalCustomId(orderId);
  const expectedInvoiceId = makeTetradicSignaturePayPalInvoiceId(orderId);

  if (purchaseUnit.custom_id !== expectedCustomId) {
    throw new TetradicSignaturePayPalError(
      "PAYPAL_CUSTOM_ID_MISMATCH",
      "The PayPal purchase unit does not match the internal order."
    );
  }

  if (purchaseUnit.invoice_id !== expectedInvoiceId) {
    throw new TetradicSignaturePayPalError(
      "PAYPAL_INVOICE_ID_MISMATCH",
      "The PayPal invoice does not match the internal order."
    );
  }

  const payments = requireSingleRecord(
    purchaseUnit.payments,
    "MALFORMED_CAPTURE_RESPONSE",
    "The PayPal capture payments are malformed."
  );
  const capture = requireSingleRecord(
    requireSingleArrayItem(
      payments.captures,
      "MALFORMED_CAPTURE_RESPONSE",
      "The PayPal capture response must contain one capture."
    ),
    "MALFORMED_CAPTURE_RESPONSE",
    "The PayPal capture is malformed."
  );

  if (capture.status !== "COMPLETED") {
    throw new TetradicSignaturePayPalError(
      "PAYPAL_CAPTURE_NOT_COMPLETED",
      "The PayPal capture is not completed."
    );
  }

  const amount = requireSingleRecord(
    capture.amount,
    "MALFORMED_CAPTURE_RESPONSE",
    "The PayPal capture amount is malformed."
  );

  if (
    amount.currency_code !== TETRADIC_SIGNATURE_PAYPAL_PRODUCT.currency
  ) {
    throw new TetradicSignaturePayPalError(
      "PAYPAL_CAPTURE_CURRENCY_MISMATCH",
      "The PayPal capture currency does not match the product currency."
    );
  }

  if (amount.value !== TETRADIC_SIGNATURE_PAYPAL_PRODUCT.amount) {
    throw new TetradicSignaturePayPalError(
      "PAYPAL_CAPTURE_AMOUNT_MISMATCH",
      "The PayPal capture amount does not match the product price."
    );
  }

  if (typeof capture.id !== "string" || capture.id.length === 0) {
    throw new TetradicSignaturePayPalError(
      "MALFORMED_CAPTURE_RESPONSE",
      "The PayPal capture response does not contain a capture ID."
    );
  }

  return {
    paypalOrderId: expectedPayPalOrderId,
    captureId: capture.id,
    status: "COMPLETED",
    captureStatus: "COMPLETED",
    customId: expectedCustomId,
    invoiceId: expectedInvoiceId,
    currency: TETRADIC_SIGNATURE_PAYPAL_PRODUCT.currency,
    amount: TETRADIC_SIGNATURE_PAYPAL_PRODUCT.amount,
  };
}

function readWebhookHeader(
  headers: PayPalWebhookHeaders,
  name: string
): string | undefined {
  if (headers instanceof Headers) {
    const value = headers.get(name);
    return value?.trim() || undefined;
  }

  const expectedName = name.toLowerCase();

  for (const [key, rawValue] of Object.entries(headers)) {
    if (key.toLowerCase() !== expectedName) continue;

    const value = Array.isArray(rawValue) ? rawValue[0] : rawValue;
    return value?.trim() || undefined;
  }

  return undefined;
}

function requireWebhookEvent(event: unknown): JsonRecord {
  if (!isRecord(event)) {
    throw new TetradicSignaturePayPalError(
      "INVALID_WEBHOOK_EVENT",
      "The PayPal webhook event must be a JSON object."
    );
  }

  return event;
}

export function createTetradicSignaturePayPalAdapter({
  config,
  fetch,
}: {
  config: TetradicSignaturePayPalConfig;
  fetch: PayPalFetch;
}): TetradicSignaturePayPalAdapter {
  const normalizedConfig = normalizeConfig(config);

  if (typeof fetch !== "function") {
    throw new TetradicSignaturePayPalError(
      "INVALID_CONFIG",
      "The PayPal adapter requires an injected fetch implementation."
    );
  }

  async function getAccessToken(): Promise<string> {
    const credentials = Buffer.from(
      `${normalizedConfig.clientId}:${normalizedConfig.clientSecret}`,
      "utf8"
    ).toString("base64");
    const response = await request(
      fetch,
      `${normalizedConfig.apiBaseUrl}/v1/oauth2/token`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
      }
    );

    if (!response.ok) {
      throw responseError(
        "PAYPAL_OAUTH_REQUEST_FAILED",
        "PayPal rejected the OAuth token request.",
        response
      );
    }

    const payload = await readJson(
      response,
      "MALFORMED_OAUTH_RESPONSE",
      "The PayPal OAuth response is malformed."
    );

    if (
      !isRecord(payload) ||
      typeof payload.access_token !== "string" ||
      payload.access_token.length === 0
    ) {
      throw new TetradicSignaturePayPalError(
        "MALFORMED_OAUTH_RESPONSE",
        "The PayPal OAuth response does not contain an access token."
      );
    }

    return payload.access_token;
  }

  async function createOrder(
    input: CreateTetradicSignatureOrderInput
  ): Promise<TetradicSignatureCreatedOrder> {
    const orderId = requireOrderId(input.orderId);
    const returnUrl = requireRedirectUrl(input.returnUrl);
    const cancelUrl = requireRedirectUrl(input.cancelUrl);
    const accessToken = await getAccessToken();
    const response = await request(
      fetch,
      `${normalizedConfig.apiBaseUrl}/v2/checkout/orders`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "PayPal-Request-Id": `tetradic-signature-create-${orderId}`,
        },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [
            {
              custom_id: makeTetradicSignaturePayPalCustomId(orderId),
              invoice_id: makeTetradicSignaturePayPalInvoiceId(orderId),
              description: TETRADIC_SIGNATURE_PAYPAL_PRODUCT.description,
              amount: {
                currency_code:
                  TETRADIC_SIGNATURE_PAYPAL_PRODUCT.currency,
                value: TETRADIC_SIGNATURE_PAYPAL_PRODUCT.amount,
              },
            },
          ],
          payment_source: {
            paypal: {
              experience_context: {
                brand_name: "ORIEL",
                return_url: returnUrl,
                cancel_url: cancelUrl,
                user_action: "PAY_NOW",
                shipping_preference: "NO_SHIPPING",
              },
            },
          },
        }),
      }
    );

    if (!response.ok) {
      throw responseError(
        "PAYPAL_CREATE_REQUEST_FAILED",
        "PayPal rejected the order creation request.",
        response
      );
    }

    const payload = await readJson(
      response,
      "MALFORMED_CREATE_RESPONSE",
      "The PayPal order creation response is malformed."
    );

    if (
      !isRecord(payload) ||
      typeof payload.id !== "string" ||
      payload.id.length === 0 ||
      typeof payload.status !== "string" ||
      payload.status.length === 0 ||
      !Array.isArray(payload.links)
    ) {
      throw new TetradicSignaturePayPalError(
        "MALFORMED_CREATE_RESPONSE",
        "The PayPal order creation response is malformed."
      );
    }

    const approveLink = payload.links.find(
      (link): link is JsonRecord =>
        isRecord(link) &&
        link.rel === "approve" &&
        typeof link.href === "string" &&
        link.href.length > 0
    );

    if (!approveLink || typeof approveLink.href !== "string") {
      throw new TetradicSignaturePayPalError(
        "MALFORMED_CREATE_RESPONSE",
        "The PayPal order creation response has no approval link."
      );
    }

    return {
      paypalOrderId: payload.id,
      approveUrl: approveLink.href,
      status: payload.status,
    };
  }

  async function captureOrder(
    input: CaptureTetradicSignatureOrderInput
  ): Promise<TetradicSignatureCompletedOrder> {
    const orderId = requireOrderId(input.orderId);
    const paypalOrderId = requirePayPalOrderId(input.paypalOrderId);
    const encodedPayPalOrderId = encodeURIComponent(paypalOrderId);
    const accessToken = await getAccessToken();
    const response = await request(
      fetch,
      `${normalizedConfig.apiBaseUrl}/v2/checkout/orders/${encodedPayPalOrderId}/capture`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "PayPal-Request-Id": `tetradic-signature-capture-${orderId}`,
          Prefer: "return=representation",
        },
        body: "{}",
      }
    );

    let payload: unknown;

    if (!response.ok) {
      const wasAlreadyCaptured = await responseHasPayPalIssue(
        response,
        "ORDER_ALREADY_CAPTURED"
      );

      if (!wasAlreadyCaptured) {
        throw responseError(
          "PAYPAL_CAPTURE_REQUEST_FAILED",
          "PayPal rejected the order capture request.",
          response
        );
      }

      const lookupResponse = await request(
        fetch,
        `${normalizedConfig.apiBaseUrl}/v2/checkout/orders/${encodedPayPalOrderId}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!lookupResponse.ok) {
        throw responseError(
          "PAYPAL_ORDER_LOOKUP_REQUEST_FAILED",
          "PayPal rejected the completed order lookup request.",
          lookupResponse
        );
      }

      payload = await readJson(
        lookupResponse,
        "MALFORMED_CAPTURE_RESPONSE",
        "The PayPal completed order response is malformed."
      );
    } else {
      payload = await readJson(
        response,
        "MALFORMED_CAPTURE_RESPONSE",
        "The PayPal capture response is malformed."
      );
    }

    return validateTetradicSignatureCompletedOrder(payload, {
      orderId,
      paypalOrderId,
    });
  }

  async function verifyWebhook(
    input: VerifyTetradicSignatureWebhookInput
  ): Promise<boolean> {
    const authAlgo = readWebhookHeader(
      input.headers,
      "PAYPAL-AUTH-ALGO"
    );
    const certUrl = readWebhookHeader(input.headers, "PAYPAL-CERT-URL");
    const transmissionId = readWebhookHeader(
      input.headers,
      "PAYPAL-TRANSMISSION-ID"
    );
    const transmissionSig = readWebhookHeader(
      input.headers,
      "PAYPAL-TRANSMISSION-SIG"
    );
    const transmissionTime = readWebhookHeader(
      input.headers,
      "PAYPAL-TRANSMISSION-TIME"
    );

    if (
      !authAlgo ||
      !certUrl ||
      !transmissionId ||
      !transmissionSig ||
      !transmissionTime
    ) {
      throw new TetradicSignaturePayPalError(
        "MISSING_WEBHOOK_HEADERS",
        "The PayPal webhook verification headers are incomplete."
      );
    }

    const event = requireWebhookEvent(input.event);
    const accessToken = await getAccessToken();
    const response = await request(
      fetch,
      `${normalizedConfig.apiBaseUrl}/v1/notifications/verify-webhook-signature`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          auth_algo: authAlgo,
          cert_url: certUrl,
          transmission_id: transmissionId,
          transmission_sig: transmissionSig,
          transmission_time: transmissionTime,
          webhook_id: normalizedConfig.webhookId,
          webhook_event: event,
        }),
      }
    );

    if (!response.ok) {
      throw responseError(
        "PAYPAL_WEBHOOK_VERIFICATION_REQUEST_FAILED",
        "PayPal rejected the webhook verification request.",
        response
      );
    }

    const payload = await readJson(
      response,
      "MALFORMED_WEBHOOK_VERIFICATION_RESPONSE",
      "The PayPal webhook verification response is malformed."
    );

    if (
      !isRecord(payload) ||
      (payload.verification_status !== "SUCCESS" &&
        payload.verification_status !== "FAILURE")
    ) {
      throw new TetradicSignaturePayPalError(
        "MALFORMED_WEBHOOK_VERIFICATION_RESPONSE",
        "The PayPal webhook verification response is malformed."
      );
    }

    return payload.verification_status === "SUCCESS";
  }

  return {
    getAccessToken,
    createOrder,
    captureOrder,
    verifyWebhook,
  };
}
