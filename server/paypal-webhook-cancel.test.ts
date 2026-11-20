import { beforeEach, describe, expect, it, vi } from "vitest";

const writes = vi.hoisted(() => [] as Record<string, unknown>[]);
const fakeDb = vi.hoisted(() => ({
  update: vi.fn(() => ({ set: (values: Record<string, unknown>) => ({ where: async () => void writes.push(values) }) })),
}));
vi.mock("./db", () => ({ getDb: vi.fn(async () => fakeDb) }));

import { handlePayPalWebhook, type PayPalWebhookPayload } from "./paypal-webhook";

const event = (event_type: string, status: string) =>
  ({
    id: "WH-1",
    event_type,
    create_time: "2026-11-19T00:00:00Z",
    resource: { id: "I-BW452GLLEP1G", status, custom_id: "user-7", billing_info: {} },
  }) as unknown as PayPalWebhookPayload;

beforeEach(() => {
  writes.length = 0;
  vi.clearAllMocks();
});

describe("a cancelled Garden subscription", () => {
  it("is not reopened by a later UPDATED event", async () => {
    await handlePayPalWebhook(event("BILLING.SUBSCRIPTION.UPDATED", "CANCELLED"));
    expect(writes).toHaveLength(1);
    expect(writes[0].subscriptionStatus).toBe("cancelled");
  });

  it("is not rewritten by an abandoned new checkout (CREATED)", async () => {
    await handlePayPalWebhook(event("BILLING.SUBSCRIPTION.CREATED", "APPROVAL_PENDING"));
    expect(fakeDb.update).not.toHaveBeenCalled();
  });

  it("an ACTIVE update still keeps a running member active", async () => {
    await handlePayPalWebhook(event("BILLING.SUBSCRIPTION.UPDATED", "ACTIVE"));
    expect(writes).toEqual([{ subscriptionStatus: "active" }]);
  });
});
