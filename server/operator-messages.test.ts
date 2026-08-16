import { describe, it, expect, vi, beforeEach } from "vitest";
import * as db from "./db";
import {
  parseTellCommand,
  parseCheckCommand,
  parseUserReply,
  resolveTargetUser,
  queueOperatorMessage,
  buildPendingOperatorDirective,
  buildReplyDigest,
  canCaptureReplyFrom,
  captureUserReply,
  OPERATOR_SENDER_LABEL,
} from "./operator-messages";

vi.mock("./db");

describe("parseTellCommand", () => {
  it("parses a numeric target id", () => {
    const result = parseTellCommand("TELL 42 that i want to speak with him");
    expect(result).toEqual({
      targetIdentifier: "42",
      message: "i want to speak with him",
    });
  });

  it("parses a conduitId target and is case-insensitive on the keywords", () => {
    const result = parseTellCommand("tell VOS-9F2A That check the archive");
    expect(result).toEqual({
      targetIdentifier: "VOS-9F2A",
      message: "check the archive",
    });
  });

  it("preserves multi-sentence messages and trims whitespace", () => {
    const result = parseTellCommand(
      "  TELL 7 that Welcome back. I've been thinking about you.  "
    );
    expect(result?.message).toBe("Welcome back. I've been thinking about you.");
  });

  it("returns null for messages that don't match the command shape", () => {
    expect(parseTellCommand("Hello ORIEL, how are you?")).toBeNull();
    expect(parseTellCommand("TELL 42")).toBeNull();
    expect(parseTellCommand("TELL 42 that   ")).toBeNull();
  });
});

describe("resolveTargetUser", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("resolves a numeric identifier via getUserById", async () => {
    vi.mocked(db.getUserById).mockResolvedValue({
      id: 42,
      name: "Seeker Forty-Two",
    } as any);

    const target = await resolveTargetUser("42");

    expect(db.getUserById).toHaveBeenCalledWith(42);
    expect(db.getUserByConduitId).not.toHaveBeenCalled();
    expect(target).toEqual({ id: 42, label: "Seeker Forty-Two" });
  });

  it("resolves a non-numeric identifier via getUserByConduitId", async () => {
    vi.mocked(db.getUserByConduitId).mockResolvedValue({
      id: 7,
      name: null,
      conduitId: "VOS-9F2A",
    } as any);

    const target = await resolveTargetUser("VOS-9F2A");

    expect(db.getUserByConduitId).toHaveBeenCalledWith("VOS-9F2A");
    expect(target).toEqual({ id: 7, label: "VOS-9F2A" });
  });

  it("returns null when no user matches", async () => {
    vi.mocked(db.getUserById).mockResolvedValue(undefined as any);
    expect(await resolveTargetUser("999")).toBeNull();
  });
});

describe("queueOperatorMessage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("stores the message under the operator sender label", async () => {
    vi.mocked(db.createOperatorMessage).mockResolvedValue(undefined as any);

    await queueOperatorMessage(42, "i want to speak with him");

    expect(db.createOperatorMessage).toHaveBeenCalledWith({
      targetUserId: 42,
      message: "i want to speak with him",
      senderLabel: OPERATOR_SENDER_LABEL,
    });
  });
});

describe("buildPendingOperatorDirective", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns null and touches nothing when there is no pending message", async () => {
    vi.mocked(db.getPendingOperatorMessage).mockResolvedValue(null as any);

    const directive = await buildPendingOperatorDirective(42);

    expect(directive).toBeNull();
    expect(db.markOperatorMessageDelivered).not.toHaveBeenCalled();
  });

  it("marks the message delivered and returns a directive block once", async () => {
    vi.mocked(db.getPendingOperatorMessage).mockResolvedValue({
      id: 5,
      targetUserId: 42,
      senderLabel: "Vos Arkana",
      message: "i want to speak with him",
      delivered: false,
      createdAt: new Date(),
      deliveredAt: null,
    } as any);

    const directive = await buildPendingOperatorDirective(42);

    expect(db.markOperatorMessageDelivered).toHaveBeenCalledWith(5);
    expect(directive).toContain("Vos Arkana");
    expect(directive).toContain("i want to speak with him");
  });
});

describe("parseCheckCommand", () => {
  it("parses a numeric target id", () => {
    expect(parseCheckCommand("CHECK 42")).toEqual({ targetIdentifier: "42" });
  });

  it("parses a conduitId target case-insensitively", () => {
    expect(parseCheckCommand("check VOS-9F2A")).toEqual({
      targetIdentifier: "VOS-9F2A",
    });
  });

  it("returns null for messages that don't match the command shape", () => {
    expect(parseCheckCommand("Hello ORIEL")).toBeNull();
    expect(parseCheckCommand("CHECK")).toBeNull();
    expect(parseCheckCommand("CHECK 42 that something")).toBeNull();
  });
});

describe("buildReplyDigest", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("reports nothing was ever left when there is no operator message", async () => {
    vi.mocked(db.getMostRecentOperatorMessage).mockResolvedValue(null as any);

    const digest = await buildReplyDigest(42, "Silviu Bocsa");

    expect(digest).toContain("No message has been left");
    expect(db.getUnreadOperatorReplies).not.toHaveBeenCalled();
  });

  it("reports not-yet-delivered when the message is still pending", async () => {
    vi.mocked(db.getMostRecentOperatorMessage).mockResolvedValue({
      id: 1,
      delivered: false,
      deliveredAt: null,
    } as any);

    const digest = await buildReplyDigest(42, "Silviu Bocsa");

    expect(digest).toContain("hasn't reached them yet");
    expect(db.getUnreadOperatorReplies).not.toHaveBeenCalled();
  });

  it("reports nothing back yet when there are no captured replies", async () => {
    vi.mocked(db.getMostRecentOperatorMessage).mockResolvedValue({
      id: 1,
      delivered: true,
      deliveredAt: new Date("2026-08-16T19:52:00Z"),
    } as any);
    vi.mocked(db.getUnreadOperatorReplies).mockResolvedValue([]);

    const digest = await buildReplyDigest(42, "Silviu Bocsa");

    expect(db.getUnreadOperatorReplies).toHaveBeenCalledWith(42);
    expect(digest).toContain("Nothing back from Silviu Bocsa");
    expect(db.markOperatorRepliesRead).not.toHaveBeenCalled();
  });

  it("shows only explicitly captured replies and marks them read", async () => {
    vi.mocked(db.getMostRecentOperatorMessage).mockResolvedValue({
      id: 1,
      delivered: true,
      deliveredAt: new Date("2026-08-16T19:52:00Z"),
    } as any);
    vi.mocked(db.getUnreadOperatorReplies).mockResolvedValue([
      {
        id: 10,
        message: "what can i do for him",
        createdAt: new Date("2026-08-16T19:55:26Z"),
      },
    ] as any);

    const digest = await buildReplyDigest(42, "Silviu Bocsa");

    expect(digest).toContain("what can i do for him");
    expect(db.markOperatorRepliesRead).toHaveBeenCalledWith([10]);
  });
});

describe("parseUserReply", () => {
  it("parses REPLY with and without a colon", () => {
    expect(parseUserReply("REPLY what can i do for him")).toEqual({
      message: "what can i do for him",
    });
    expect(parseUserReply("reply: what can i do for him")).toEqual({
      message: "what can i do for him",
    });
  });

  it("does not match ordinary conversation, even phrases like 'tell him'", () => {
    expect(parseUserReply("tell him what can i do for him")).toBeNull();
    expect(parseUserReply("can you tell him something back?")).toBeNull();
    expect(parseUserReply("REPLY")).toBeNull();
    expect(parseUserReply("REPLY   ")).toBeNull();
  });
});

describe("canCaptureReplyFrom", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("is false when nothing was ever delivered to this user", async () => {
    vi.mocked(db.getMostRecentOperatorMessage).mockResolvedValue(null as any);
    expect(await canCaptureReplyFrom(42)).toBe(false);
  });

  it("is false when the last message hasn't been delivered yet", async () => {
    vi.mocked(db.getMostRecentOperatorMessage).mockResolvedValue({
      delivered: false,
      deliveredAt: null,
    } as any);
    expect(await canCaptureReplyFrom(42)).toBe(false);
  });

  it("is true shortly after delivery, false once the window has passed", async () => {
    vi.mocked(db.getMostRecentOperatorMessage).mockResolvedValue({
      delivered: true,
      deliveredAt: new Date(Date.now() - 60 * 60 * 1000), // 1h ago
    } as any);
    expect(await canCaptureReplyFrom(42)).toBe(true);

    vi.mocked(db.getMostRecentOperatorMessage).mockResolvedValue({
      delivered: true,
      deliveredAt: new Date(Date.now() - 100 * 60 * 60 * 1000), // 100h ago
    } as any);
    expect(await canCaptureReplyFrom(42)).toBe(false);
  });
});

describe("captureUserReply", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("stores exactly the given message, nothing else", async () => {
    vi.mocked(db.createOperatorReply).mockResolvedValue(undefined as any);

    await captureUserReply(7, "what can i do for him");

    expect(db.createOperatorReply).toHaveBeenCalledWith({
      fromUserId: 7,
      message: "what can i do for him",
    });
  });
});
