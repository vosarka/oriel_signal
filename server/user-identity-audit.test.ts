import { describe, expect, it } from "vitest";
import {
  buildIdentityAudit,
  formatMappingCsv,
  parseCsvRecords,
  tablesFromCsvFiles,
} from "./user-identity-audit";

describe("user identity audit", () => {
  it("parses quoted CSV fields that contain commas", () => {
    const rows = parseCsvRecords(
      `id,email\n1,"a,b@example.com"\n`
    );
    expect(rows[0].email).toBe("a,b@example.com");
  });

  it("marks a backup user whose email is in ba_user as matched", () => {
    const { rows, summary } = buildIdentityAudit({
      users: [{ id: 7, email: "Lisa@Example.com" }],
      baUsers: [{ email: "lisa@example.com" }],
      conversations: [{ userId: 7 }],
      chatMessages: [{ userId: 7, conversationId: "11" }],
      memories: [{ userId: 7 }],
    });

    expect(rows).toEqual([
      {
        oldUserId: 7,
        emailIfKnown: "Lisa@Example.com",
        messageCount: 1,
        memoryCount: 1,
        conversationCount: 1,
        status: "matched",
      },
    ]);
    expect(summary.matched).toBe(1);
    expect(summary.orphanNoEmail).toBe(0);
  });

  it("marks chat userIds missing from the users backup as orphan-no-email", () => {
    const { rows, summary } = buildIdentityAudit({
      users: [{ id: 1, email: "known@example.com" }],
      baUsers: [{ email: "known@example.com" }],
      conversations: [],
      chatMessages: [
        { userId: 99, conversationId: "3" },
        { userId: 99, conversationId: "" },
      ],
      memories: [{ userId: 99 }],
    });

    const orphan = rows.find(r => r.oldUserId === 99);
    expect(orphan?.status).toBe("orphan-no-email");
    expect(orphan?.emailIfKnown).toBe("");
    expect(orphan?.messageCount).toBe(2);
    expect(summary.orphanNoEmail).toBe(1);
    expect(summary.messagesWithEmptyConversationId).toBe(1);
  });

  it("marks backup users whose email is not in ba_user as needs-your-name", () => {
    const { rows } = buildIdentityAudit({
      users: [{ id: 2, email: "old@example.com" }],
      baUsers: [{ email: "someone-else@example.com" }],
      conversations: [],
      chatMessages: [{ userId: 2, conversationId: "1" }],
      memories: [],
    });

    expect(rows[0].status).toBe("needs-your-name");
  });

  it("writes a mapping csv that tmp/ can hold without code knowing emails in logs", () => {
    const csv = formatMappingCsv([
      {
        oldUserId: 2,
        emailIfKnown: "old@example.com",
        messageCount: 4,
        memoryCount: 1,
        conversationCount: 1,
        status: "needs-your-name",
      },
    ]);
    expect(csv).toContain("oldUserId,emailIfKnown");
    expect(csv).toContain("needs-your-name");
  });

  it("loads typed tables from csv blobs", () => {
    const tables = tablesFromCsvFiles({
      users: "id,email\n5,a@x.test\n",
      baUsers: "id,email\nu1,a@x.test\n",
      conversations: "id,userId\n1,5\n",
      chatMessages: "id,userId,conversationId\n1,5,1\n",
      memories: "id,userId\n1,5\n",
    });
    expect(tables.users[0]).toEqual({ id: 5, email: "a@x.test" });
    expect(tables.chatMessages[0].userId).toBe(5);
  });
});
