/**
 * Founder's Reading: a one-time PayPal order. intent CAPTURE means money
 * moves only when the server captures on the Seeker's return, so an
 * abandoned checkout is never charged. The amount is the row's, fixed at
 * order time; a capture for any other amount is refused.
 */
import { ENV } from "./_core/env";
import { accessToken } from "./garden-paypal";

type Fetch = typeof fetch;

export const readingCustomId = (id: number) => `founders-reading-${id}`;
const euros = (n: number) => n.toFixed(2);

/** A one-time order of anything we sell: a reading, a month of Garden. */
export interface OneTimeOrder {
  customId: string;
  description: string;
  priceEur: number;
  /** Stable per thing sold, so a retried create is the same order. */
  requestId: string;
  returnUrl: string;
  cancelUrl: string;
}

export async function createReadingOrder(
  input: { transmissionId: number; priceEur: number; returnUrl: string; cancelUrl: string },
  fetchImpl: Fetch = fetch
): Promise<{ paypalOrderId: string; approveUrl: string }> {
  return createPaypalOrder(
    {
      customId: readingCustomId(input.transmissionId),
      description: "Founder's Reading — a personal ORIEL transmission",
      priceEur: input.priceEur,
      requestId: `founders-reading-create-${input.transmissionId}`,
      returnUrl: input.returnUrl,
      cancelUrl: input.cancelUrl,
    },
    fetchImpl
  );
}

export async function createPaypalOrder(
  input: OneTimeOrder,
  fetchImpl: Fetch = fetch
): Promise<{ paypalOrderId: string; approveUrl: string }> {
  const token = await accessToken(fetchImpl);
  const res = await fetchImpl(`${ENV.paypalApiBaseUrl}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": input.requestId,
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          custom_id: input.customId,
          description: input.description,
          amount: { currency_code: "EUR", value: euros(input.priceEur) },
        },
      ],
      payment_source: {
        paypal: {
          experience_context: {
            brand_name: "ORIEL Signal",
            user_action: "PAY_NOW",
            shipping_preference: "NO_SHIPPING",
            return_url: input.returnUrl,
            cancel_url: input.cancelUrl,
          },
        },
      },
    }),
  });
  const body = (await res.json().catch(() => null)) as {
    id?: string;
    links?: Array<{ rel: string; href: string }>;
  } | null;
  const approve = body?.links?.find(l => l.rel === "payer-action" || l.rel === "approve")?.href;
  if (!res.ok || !body?.id || !approve) {
    throw new Error(`PayPal order request failed (${res.status})`);
  }
  return { paypalOrderId: body.id, approveUrl: approve };
}

type PayPalOrder = {
  id?: string;
  status?: string;
  purchase_units?: Array<{
    custom_id?: string;
    payments?: { captures?: Array<{ id?: string; status?: string; amount?: { currency_code?: string; value?: string } }> };
  }>;
};

/**
 * A capture PayPal holds for review comes back PENDING and settles later;
 * it is paid, not refused. Anything else must match this row exactly.
 */
function validateCapture(
  order: PayPalOrder | null,
  input: { customId: string; paypalOrderId: string; priceEur: number }
): { captureId: string; pending: boolean } {
  const unit = order?.purchase_units?.[0];
  const capture = unit?.payments?.captures?.[0];
  const ok =
    order?.id === input.paypalOrderId &&
    order.status === "COMPLETED" &&
    unit?.custom_id === input.customId &&
    (capture?.status === "COMPLETED" || capture?.status === "PENDING") &&
    capture.amount?.currency_code === "EUR" &&
    capture.amount?.value === euros(input.priceEur) &&
    typeof capture.id === "string";
  if (!ok) throw new Error("PayPal capture does not match this order");
  return { captureId: capture!.id!, pending: capture!.status === "PENDING" };
}

/**
 * Captures, or — when the capture call fails because it already happened
 * (a lost response, a retry after the database failed) — reads the order
 * and accepts the capture already on it.
 */
export async function captureReadingOrder(
  input: { transmissionId: number; paypalOrderId: string; priceEur: number },
  fetchImpl: Fetch = fetch
): Promise<{ captureId: string; pending: boolean }> {
  return capturePaypalOrder(
    {
      customId: readingCustomId(input.transmissionId),
      paypalOrderId: input.paypalOrderId,
      priceEur: input.priceEur,
      requestId: `founders-reading-capture-${input.transmissionId}`,
    },
    fetchImpl
  );
}

export async function capturePaypalOrder(
  input: { customId: string; paypalOrderId: string; priceEur: number; requestId: string },
  fetchImpl: Fetch = fetch
): Promise<{ captureId: string; pending: boolean }> {
  const token = await accessToken(fetchImpl);
  const orderUrl = `${ENV.paypalApiBaseUrl}/v2/checkout/orders/${encodeURIComponent(input.paypalOrderId)}`;
  const res = await fetchImpl(`${orderUrl}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": input.requestId,
    },
  });
  if (res.ok) {
    return validateCapture((await res.json().catch(() => null)) as PayPalOrder | null, input);
  }
  const lookup = await fetchImpl(orderUrl, { method: "GET", headers: { Authorization: `Bearer ${token}` } });
  if (!lookup.ok) throw new Error(`PayPal capture failed (${res.status})`);
  return validateCapture((await lookup.json().catch(() => null)) as PayPalOrder | null, input);
}
