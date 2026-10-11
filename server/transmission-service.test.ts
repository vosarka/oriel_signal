import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  insertTransmission: vi.fn(),
  getTransmission: vi.fn(),
  getTransmissionByToken: vi.fn(),
  updateTransmission: vi.fn(),
  countPaidPurchases: vi.fn(),
}));
const paypal = vi.hoisted(() => ({ createReadingOrder: vi.fn(), captureReadingOrder: vi.fn() }));
const llm = vi.hoisted(() => ({ invokeLLM: vi.fn() }));
const tts = vi.hoisted(() => ({ generateChunkedSpeech: vi.fn(), ORIEL_VOICES: { sophianic: "sophianic" } }));
const storage = vi.hoisted(() => ({ storagePut: vi.fn(), storageGet: vi.fn() }));
const mailer = vi.hoisted(() => ({ sendTransmissionDeliveryEmail: vi.fn() }));
const umm = vi.hoisted(() => ({ buildStaticSignatureContext: vi.fn() }));
const users = vi.hoisted(() => ({ getUserById: vi.fn() }));

vi.mock("./transmission-db", () => db);
vi.mock("./founders-reading-paypal", () => paypal);
vi.mock("./_core/llm", () => llm);
vi.mock("./oriel-tts-chain", () => tts);
vi.mock("./storage", () => storage);
vi.mock("./_core/mailer", () => mailer);
vi.mock("./oriel-umm", () => umm);
vi.mock("./db", () => users);
vi.mock("./daily-codon", () => ({ codonAtLongitude: vi.fn(() => null) }));
vi.mock("./ephemeris-service", () => ({ bodyLongitudeAtUtc: vi.fn(async () => 0), PLANETS: { SUN: 0, MOON: 1 } }));
vi.mock("./_core/env", () => ({ ENV: { appBaseUrl: "https://orielsignal.space" } }));

import {
  adminQueue,
  approveTransmission,
  recheckPayment,
  regenerateTransmission,
  captureFoundersReading,
  generateScript,
  newToken,
  orderFoundersReading,
  playTransmission,
} from "./transmission-service";

const words = (n: number) => Array.from({ length: n }, () => "light").join(" ");
const goodScript = {
  title: "Where the Echo Rests",
  mirror: `Maria, you carry a quiet fire. ${words(104)}.`,
  threshold: `${words(110)}.`,
  gift: `${words(110)}.`,
};
const row = (over: Record<string, unknown> = {}) => ({
  id: 7,
  userId: 3,
  kind: "mirror",
  source: "purchase",
  status: "pending_payment",
  accessToken: "a".repeat(64),
  priceEur: 10,
  paypalOrderId: "ORDER1",
  script: null,
  audioStorageKey: null,
  ...over,
});

beforeEach(() => {
  for (const group of [db, paypal, llm, tts, storage, mailer, umm, users]) {
    for (const fn of Object.values(group)) if (typeof fn === "function" && "mockReset" in fn) fn.mockReset();
  }
  users.getUserById.mockResolvedValue({ id: 3, name: "Maria Pop", email: "m@example.com" });
});

describe("ordering a Founder's Reading", () => {
  it("refuses a Seeker with no saved signature before PayPal is called", async () => {
    umm.buildStaticSignatureContext.mockResolvedValue("");
    await expect(orderFoundersReading({ id: 3 })).rejects.toThrow(/signature/i);
    expect(paypal.createReadingOrder).not.toHaveBeenCalled();
  });

  it("fixes the launch price on the row and returns PayPal's link", async () => {
    umm.buildStaticSignatureContext.mockResolvedValue("Type: Resonator");
    db.countPaidPurchases.mockResolvedValue(49);
    db.insertTransmission.mockImplementation(async v => ({ ...v, id: 7 }));
    paypal.createReadingOrder.mockResolvedValue({ paypalOrderId: "ORDER1", approveUrl: "https://paypal.test/pay" });

    await expect(orderFoundersReading({ id: 3 })).resolves.toEqual({
      transmissionId: 7,
      approveUrl: "https://paypal.test/pay",
    });
    expect(db.insertTransmission).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 3, kind: "mirror", source: "purchase", status: "pending_payment", priceEur: 10 })
    );
    expect(db.updateTransmission).toHaveBeenCalledWith(7, { paypalOrderId: "ORDER1" });
  });
});

describe("capturing on return", () => {
  it("captures once, then answers a refresh without capturing again", async () => {
    db.getTransmission.mockResolvedValueOnce(row());
    paypal.captureReadingOrder.mockResolvedValue({ captureId: "CAP1", pending: false });
    llm.invokeLLM.mockResolvedValue({ choices: [{ message: { content: JSON.stringify(goodScript) } }], model: "m" });
    db.getTransmission.mockResolvedValue(row({ status: "requested" }));

    await expect(captureFoundersReading({ id: 3 }, 7)).resolves.toEqual({ status: "requested" });
    await expect(captureFoundersReading({ id: 3 }, 7)).resolves.toEqual({ status: "requested" });
    expect(paypal.captureReadingOrder).toHaveBeenCalledTimes(1);
    expect(db.updateTransmission).toHaveBeenCalledWith(
      7,
      expect.objectContaining({ status: "requested", paypalCaptureId: "CAP1" })
    );
  });

  it("refuses another Seeker's row", async () => {
    db.getTransmission.mockResolvedValue(row({ userId: 4 }));
    await expect(captureFoundersReading({ id: 3 }, 7)).rejects.toThrow();
    expect(paypal.captureReadingOrder).not.toHaveBeenCalled();
  });
});

describe("generating", () => {
  it("stores a valid script as a draft", async () => {
    db.getTransmission.mockResolvedValue(row({ status: "requested" }));
    umm.buildStaticSignatureContext.mockResolvedValue("Type: Resonator");
    llm.invokeLLM.mockResolvedValue({ choices: [{ message: { content: JSON.stringify(goodScript) } }], model: "m" });
    await generateScript(7);
    expect(db.updateTransmission).toHaveBeenCalledWith(7, {
      status: "draft_ready",
      script: JSON.stringify(goodScript),
      failureReason: null,
    });
  });

  it("marks failed after three invalid answers", async () => {
    db.getTransmission.mockResolvedValue(row({ status: "requested" }));
    umm.buildStaticSignatureContext.mockResolvedValue("Type: Resonator");
    llm.invokeLLM.mockResolvedValue({ choices: [{ message: { content: "{}" } }], model: "m" });
    await generateScript(7);
    expect(llm.invokeLLM).toHaveBeenCalledTimes(3);
    expect(db.updateTransmission).toHaveBeenLastCalledWith(7, expect.objectContaining({ status: "failed" }));
  });
});

describe("approving", () => {
  it("voices, stores, emails and delivers", async () => {
    db.getTransmission.mockResolvedValue(row({ status: "draft_ready" }));
    tts.generateChunkedSpeech.mockResolvedValue(Buffer.from("mp3").toString("base64"));
    storage.storagePut.mockResolvedValue({ key: "k", url: "" });
    await approveTransmission(7, goodScript);
    expect(storage.storagePut).toHaveBeenCalledWith(`transmissions/${"a".repeat(64)}.mp3`, expect.any(Buffer), "audio/mpeg");
    expect(mailer.sendTransmissionDeliveryEmail).toHaveBeenCalledWith(
      expect.objectContaining({ email: "m@example.com", url: `https://orielsignal.space/t/${"a".repeat(64)}` })
    );
    expect(db.updateTransmission).toHaveBeenLastCalledWith(7, expect.objectContaining({ status: "delivered" }));
  });

  it("refuses an edited script that breaks the contract, and keeps it unvoiced", async () => {
    db.getTransmission.mockResolvedValue(row({ status: "draft_ready" }));
    await expect(approveTransmission(7, { ...goodScript, gift: "" })).rejects.toThrow();
    expect(tts.generateChunkedSpeech).not.toHaveBeenCalled();
  });

  it("stays approved when the voice fails, so the script is never lost", async () => {
    db.getTransmission.mockResolvedValue(row({ status: "draft_ready" }));
    tts.generateChunkedSpeech.mockRejectedValue(new Error("tts down"));
    await expect(approveTransmission(7, goodScript)).rejects.toThrow("tts down");
    expect(db.updateTransmission).toHaveBeenCalledWith(7, expect.objectContaining({ status: "approved" }));
    expect(db.updateTransmission).not.toHaveBeenCalledWith(7, expect.objectContaining({ status: "delivered" }));
  });
});

describe("playing by token", () => {
  it("answers null for a malformed token without touching the database", async () => {
    await expect(playTransmission("not-a-token")).resolves.toBeNull();
    expect(db.getTransmissionByToken).not.toHaveBeenCalled();
  });

  it("answers null for a draft, so it never leaves the server", async () => {
    db.getTransmissionByToken.mockResolvedValue(row({ status: "draft_ready", script: JSON.stringify(goodScript) }));
    await expect(playTransmission("a".repeat(64))).resolves.toBeNull();
  });

  it("plays a delivered one with a signed audio link", async () => {
    db.getTransmissionByToken.mockResolvedValue(
      row({ status: "delivered", script: JSON.stringify(goodScript), audioStorageKey: "k", deliveredAt: new Date(0) })
    );
    storage.storageGet.mockResolvedValue({ key: "k", url: "https://s3.test/k" });
    await expect(playTransmission("a".repeat(64))).resolves.toMatchObject({
      title: "Where the Echo Rests",
      audioUrl: "https://s3.test/k",
    });
  });
});

it("makes 64-hex tokens", () => {
  expect(newToken()).toMatch(/^[a-f0-9]{64}$/);
  expect(newToken()).not.toBe(newToken());
});

describe("fixes from the final review", () => {
  it("records a capture PayPal holds as pending, so Vos sees it before approving", async () => {
    db.getTransmission.mockResolvedValueOnce(row());
    db.getTransmission.mockResolvedValue(row({ status: "requested" }));
    paypal.captureReadingOrder.mockResolvedValue({ captureId: "CAP1", pending: true });
    await captureFoundersReading({ id: 3 }, 7);
    expect(db.updateTransmission).toHaveBeenCalledWith(
      7,
      expect.objectContaining({ status: "requested", paypalCaptureId: "CAP1", failureReason: expect.stringMatching(/pending/i) })
    );
  });

  it("lets Vos re-check a stuck payment from admin, whoever's row it is", async () => {
    db.getTransmission.mockResolvedValueOnce(row({ userId: 99 }));
    db.getTransmission.mockResolvedValue(row({ userId: 99, status: "requested" }));
    paypal.captureReadingOrder.mockResolvedValue({ captureId: "CAP1", pending: false });
    await expect(recheckPayment(7)).resolves.toEqual({ status: "requested" });
    expect(paypal.captureReadingOrder).toHaveBeenCalledWith({ transmissionId: 7, paypalOrderId: "ORDER1", priceEur: 10 });
  });

  it("resends without re-voicing when a voiced transmission is approved again", async () => {
    db.getTransmission.mockResolvedValue(
      row({ status: "voiced", audioStorageKey: "k", script: JSON.stringify(goodScript) })
    );
    await approveTransmission(7, goodScript);
    expect(tts.generateChunkedSpeech).not.toHaveBeenCalled();
    expect(mailer.sendTransmissionDeliveryEmail).toHaveBeenCalled();
    expect(db.updateTransmission).toHaveBeenLastCalledWith(7, expect.objectContaining({ status: "delivered" }));
  });

  it("marks failed, with the reason, when anything before the model throws", async () => {
    db.getTransmission.mockResolvedValue(row({ status: "requested" }));
    users.getUserById.mockRejectedValue(new Error("db down"));
    await generateScript(7);
    expect(db.updateTransmission).toHaveBeenLastCalledWith(7, { status: "failed", failureReason: "db down" });
  });

  it("keeps the admin queue to what needs Vos, newest delivered last, stuck payments visible", () => {
    const now = new Date("2026-10-11T12:00:00Z");
    const d = (iso: string) => new Date(iso);
    const rows = [
      row({ id: 1, status: "delivered", deliveredAt: d("2026-08-01T00:00:00Z"), createdAt: d("2026-07-30T00:00:00Z") }),
      row({ id: 2, status: "delivered", deliveredAt: d("2026-10-10T00:00:00Z"), createdAt: d("2026-10-09T00:00:00Z") }),
      row({ id: 3, status: "draft_ready", createdAt: d("2026-01-01T00:00:00Z") }),
      row({ id: 4, status: "pending_payment", paypalOrderId: "ORDER4", createdAt: d("2026-10-10T00:00:00Z") }),
      row({ id: 5, status: "pending_payment", paypalOrderId: null, createdAt: d("2026-10-10T00:00:00Z") }),
      row({ id: 6, status: "pending_payment", paypalOrderId: "ORDER6", createdAt: d("2026-09-01T00:00:00Z") }),
      row({ id: 7, status: "requested", createdAt: d("2026-10-11T00:00:00Z") }),
    ];
    expect(adminQueue(rows as never, now).map(r => r.id)).toEqual([3, 4, 7, 2]);
  });
});

it("never writes a transmission that has not been paid for, even from admin", async () => {
  db.getTransmission.mockResolvedValue(row({ status: "pending_payment" }));
  await expect(regenerateTransmission(7)).rejects.toThrow(/paid/i);
  expect(llm.invokeLLM).not.toHaveBeenCalled();
  expect(db.updateTransmission).not.toHaveBeenCalled();
});
