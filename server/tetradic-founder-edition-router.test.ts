import { beforeEach, describe, expect, it, vi } from "vitest";

const serviceMocks = vi.hoisted(() => ({
  createCheckpoint: vi.fn(),
  createPaypalOrder: vi.fn(),
  capturePaypalOrder: vi.fn(),
  markInProgress: vi.fn(),
  markDelivered: vi.fn(),
}));

vi.mock("./signature-letter-service", async importOriginal => {
  const original =
    await importOriginal<typeof import("./signature-letter-service")>();
  return {
    ...original,
    createTetradicFounderEditionCheckpoint: serviceMocks.createCheckpoint,
    createFounderEditionPayPalOrder: serviceMocks.createPaypalOrder,
    captureFounderEditionPayPalOrder: serviceMocks.capturePaypalOrder,
    markFounderEditionInProgress: serviceMocks.markInProgress,
    markFounderEditionDelivered: serviceMocks.markDelivered,
  };
});

import { appRouter } from "./routers";

const intake = {
  birthDate: "1990-01-02",
  birthTime: "03:04",
  birthPlace: "Bucharest",
  birthCountry: "Romania",
  questionOne: "What is asking to be embodied?",
  questionTwo: "What should I protect?",
  consent: true as const,
};

describe("Tetradic Founder Edition router access", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    serviceMocks.createCheckpoint.mockResolvedValue({
      orderId: 91,
      status: "pending_payment",
      intakeSaved: true,
    });
    serviceMocks.createPaypalOrder.mockResolvedValue({
      orderId: 91,
      paypalOrderId: "PAYPAL-ORDER-91",
      approveUrl: "https://www.sandbox.paypal.com/checkoutnow?token=91",
    });
    serviceMocks.capturePaypalOrder.mockResolvedValue({
      orderId: 91,
      captureId: "PAYPAL-CAPTURE-91",
      status: "intake_received",
    });
    serviceMocks.markInProgress.mockResolvedValue({
      id: 91,
      status: "in_curation",
    });
    serviceMocks.markDelivered.mockResolvedValue({
      id: 91,
      status: "delivered",
    });
  });

  it("requires login before saving the intake checkpoint", async () => {
    const caller = appRouter.createCaller({ user: null } as never);

    await expect(
      caller.signature.createFounderEditionCheckpoint(intake)
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(serviceMocks.createCheckpoint).not.toHaveBeenCalled();
  });

  it("derives name and email from the authenticated user", async () => {
    const caller = appRouter.createCaller({
      user: {
        id: 42,
        name: "Elena Ionescu",
        email: "elena@example.com",
        role: "user",
      },
    } as never);

    await caller.signature.createFounderEditionCheckpoint(intake);

    expect(serviceMocks.createCheckpoint).toHaveBeenCalledWith({
      userId: 42,
      userName: "Elena Ionescu",
      userEmail: "elena@example.com",
      intake,
    });
  });

  it("rejects client-supplied identity fields", async () => {
    const caller = appRouter.createCaller({
      user: {
        id: 42,
        name: "Elena Ionescu",
        email: "elena@example.com",
        role: "user",
      },
    } as never);

    await expect(
      caller.signature.createFounderEditionCheckpoint({
        ...intake,
        name: "Injected Name",
        email: "injected@example.com",
      } as never)
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(serviceMocks.createCheckpoint).not.toHaveBeenCalled();
  });

  it("creates and captures PayPal orders server-side for the owner", async () => {
    const anonymous = appRouter.createCaller({ user: null } as never);
    await expect(
      anonymous.signature.createFounderEditionPayPalOrder({ orderId: 91 })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });

    const owner = appRouter.createCaller({
      user: {
        id: 42,
        name: "Elena Ionescu",
        email: "elena@example.com",
        role: "user",
      },
    } as never);
    await owner.signature.createFounderEditionPayPalOrder({ orderId: 91 });
    await owner.signature.captureFounderEditionPayPalOrder({ orderId: 91 });

    expect(serviceMocks.createPaypalOrder).toHaveBeenCalledWith({
      orderId: 91,
      userId: 42,
    });
    expect(serviceMocks.capturePaypalOrder).toHaveBeenCalledWith({
      orderId: 91,
      userId: 42,
    });
  });

  it("rejects a client-supplied PayPal order ID", async () => {
    const owner = appRouter.createCaller({
      user: {
        id: 42,
        name: "Elena Ionescu",
        email: "elena@example.com",
        role: "user",
      },
    } as never);

    await expect(
      owner.signature.createFounderEditionPayPalOrder({
        orderId: 91,
        paypalOrderId: "CLIENT-CONTROLLED-ID",
      } as never)
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(serviceMocks.createPaypalOrder).not.toHaveBeenCalled();
  });

  it("keeps manual fulfillment transitions admin-only", async () => {
    const user = appRouter.createCaller({
      user: {
        id: 42,
        name: "Elena Ionescu",
        email: "elena@example.com",
        role: "user",
      },
    } as never);

    await expect(
      user.admin.signatureLetters.markFounderEditionInProgress({
        orderId: 91,
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      user.admin.signatureLetters.markFounderEditionDelivered({
        orderId: 91,
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
