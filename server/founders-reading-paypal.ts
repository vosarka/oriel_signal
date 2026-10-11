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

export async function createReadingOrder(
  input: { transmissionId: number; priceEur: number; returnUrl: string; cancelUrl: string },
  fetchImpl: Fetch = fetch
): Promise<{ paypalOrderId: string; approveUrl: string }> {
  const token = await accessToken(fetchImpl);
  const res = await fetchImpl(`${ENV.paypalApiBaseUrl}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": `founders-reading-create-${input.transmissionId}`,
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          custom_id: readingCustomId(input.transmissionId),
          description: "Founder's Reading — a personal ORIEL transmission",
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

export async function captureReadingOrder(
  input: { transmissionId: number; paypalOrderId: string; priceEur: number },
  fetchImpl: Fetch = fetch
): Promise<{ captureId: string }> {
  const token = await accessToken(fetchImpl);
  const res = await fetchImpl(
    `${ENV.paypalApiBaseUrl}/v2/checkout/orders/${encodeURIComponent(input.paypalOrderId)}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "PayPal-Request-Id": `founders-reading-capture-${input.transmissionId}`,
      },
    }
  );
  const order = (await res.json().catch(() => null)) as {
    id?: string;
    status?: string;
    purchase_units?: Array<{
      custom_id?: string;
      payments?: { captures?: Array<{ id?: string; status?: string; amount?: { currency_code?: string; value?: string } }> };
    }>;
  } | null;
  if (!res.ok || !order) throw new Error(`PayPal capture failed (${res.status})`);

  const unit = order.purchase_units?.[0];
  const capture = unit?.payments?.captures?.[0];
  const ok =
    order.id === input.paypalOrderId &&
    order.status === "COMPLETED" &&
    unit?.custom_id === readingCustomId(input.transmissionId) &&
    capture?.status === "COMPLETED" &&
    capture.amount?.currency_code === "EUR" &&
    capture.amount?.value === euros(input.priceEur) &&
    typeof capture.id === "string";
  if (!ok) throw new Error("PayPal capture does not match this reading");
  return { captureId: capture!.id! };
}
