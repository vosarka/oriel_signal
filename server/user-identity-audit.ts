/**
 * Read-only identity audit from CSV backups.
 * Does not connect to a database. Does not print emails.
 */

export type IdentityStatus =
  | "matched"
  | "orphan-no-email"
  | "needs-your-name";

export type IdentityMappingRow = {
  oldUserId: number;
  emailIfKnown: string;
  messageCount: number;
  memoryCount: number;
  conversationCount: number;
  status: IdentityStatus;
};

export type IdentityAuditSummary = {
  backupUserCount: number;
  baUserEmailCount: number;
  chatUserCount: number;
  memoryUserCount: number;
  conversationCount: number;
  messagesWithEmptyConversationId: number;
  matched: number;
  orphanNoEmail: number;
  needsYourName: number;
};

export type IdentityAuditTables = {
  users: Array<{ id: number; email: string }>;
  baUsers: Array<{ email: string }>;
  conversations: Array<{ userId: number }>;
  chatMessages: Array<{ userId: number; conversationId: string }>;
  memories: Array<{ userId: number }>;
};

function parseCSV(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const headers = (rows.shift() ?? []).map(h => h.replace(/^\ufeff/, ""));
  return rows.map(r => {
    const o: Record<string, string> = {};
    headers.forEach((h, i) => {
      o[h] = r[i] ?? "";
    });
    return o;
  });
}

export function parseCsvRecords(text: string): Record<string, string>[] {
  return parseCSV(text);
}

function toInt(value: string | undefined): number | null {
  if (value === undefined || value === "" || value === "NULL") return null;
  const n = Number(value);
  return Number.isInteger(n) ? n : null;
}

function foldEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function buildIdentityAudit(
  tables: IdentityAuditTables
): { rows: IdentityMappingRow[]; summary: IdentityAuditSummary } {
  const usersById = new Map<number, string>();
  for (const user of tables.users) {
    if (!Number.isInteger(user.id)) continue;
    usersById.set(user.id, user.email.trim());
  }

  const baEmails = new Set(
    tables.baUsers.map(u => foldEmail(u.email)).filter(Boolean)
  );

  const messageCount = new Map<number, number>();
  let messagesWithEmptyConversationId = 0;
  for (const msg of tables.chatMessages) {
    messageCount.set(msg.userId, (messageCount.get(msg.userId) ?? 0) + 1);
    if (!msg.conversationId.trim()) messagesWithEmptyConversationId += 1;
  }

  const memoryCount = new Map<number, number>();
  for (const mem of tables.memories) {
    memoryCount.set(mem.userId, (memoryCount.get(mem.userId) ?? 0) + 1);
  }

  const conversationCount = new Map<number, number>();
  for (const conv of tables.conversations) {
    conversationCount.set(
      conv.userId,
      (conversationCount.get(conv.userId) ?? 0) + 1
    );
  }

  const allIds = new Set<number>([
    ...usersById.keys(),
    ...messageCount.keys(),
    ...memoryCount.keys(),
    ...conversationCount.keys(),
  ]);

  const rows: IdentityMappingRow[] = [...allIds]
    .sort((a, b) => a - b)
    .map(oldUserId => {
      const emailIfKnown = usersById.get(oldUserId) ?? "";
      const inBackupUsers = usersById.has(oldUserId);
      const emailMatchesBa =
        emailIfKnown !== "" && baEmails.has(foldEmail(emailIfKnown));

      let status: IdentityStatus;
      if (!inBackupUsers) status = "orphan-no-email";
      else if (!emailMatchesBa) status = "needs-your-name";
      else status = "matched";

      return {
        oldUserId,
        emailIfKnown,
        messageCount: messageCount.get(oldUserId) ?? 0,
        memoryCount: memoryCount.get(oldUserId) ?? 0,
        conversationCount: conversationCount.get(oldUserId) ?? 0,
        status,
      };
    });

  const summary: IdentityAuditSummary = {
    backupUserCount: usersById.size,
    baUserEmailCount: baEmails.size,
    chatUserCount: messageCount.size,
    memoryUserCount: memoryCount.size,
    conversationCount: tables.conversations.length,
    messagesWithEmptyConversationId,
    matched: rows.filter(r => r.status === "matched").length,
    orphanNoEmail: rows.filter(r => r.status === "orphan-no-email").length,
    needsYourName: rows.filter(r => r.status === "needs-your-name").length,
  };

  return { rows, summary };
}

export function formatMappingCsv(rows: IdentityMappingRow[]): string {
  const header = [
    "oldUserId",
    "emailIfKnown",
    "messageCount",
    "memoryCount",
    "conversationCount",
    "status",
  ].join(",");
  const body = rows.map(row =>
    [
      row.oldUserId,
      csvEscape(row.emailIfKnown),
      row.messageCount,
      row.memoryCount,
      row.conversationCount,
      row.status,
    ].join(",")
  );
  return [header, ...body].join("\n") + "\n";
}

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function tablesFromCsvFiles(files: {
  users: string;
  baUsers: string;
  conversations: string;
  chatMessages: string;
  memories: string;
}): IdentityAuditTables {
  const users = parseCSV(files.users)
    .map(r => ({ id: toInt(r.id), email: r.email ?? "" }))
    .filter((r): r is { id: number; email: string } => r.id !== null);

  const baUsers = parseCSV(files.baUsers).map(r => ({ email: r.email ?? "" }));

  const conversations = parseCSV(files.conversations)
    .map(r => ({ userId: toInt(r.userId) }))
    .filter((r): r is { userId: number } => r.userId !== null);

  const chatMessages = parseCSV(files.chatMessages)
    .map(r => ({
      userId: toInt(r.userId),
      conversationId: r.conversationId ?? "",
    }))
    .filter(
      (r): r is { userId: number; conversationId: string } => r.userId !== null
    );

  const memories = parseCSV(files.memories)
    .map(r => ({ userId: toInt(r.userId) }))
    .filter((r): r is { userId: number } => r.userId !== null);

  return { users, baUsers, conversations, chatMessages, memories };
}
