import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Accounts that exist only in the legacy `users` table (no Better Auth login)
 * must still be able to recover through "Forgot password": the reset request
 * gives them a Better Auth user, then sends the code.
 */
vi.mock("./_core/mailer", () => ({
  sendPasswordResetCodeEmail: vi.fn(async () => undefined),
  sendPasswordRecoveryGuidanceEmail: vi.fn(async () => undefined),
}));

vi.mock("./db", async importOriginal => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    getBetterAuthUserByEmail: vi.fn(),
    getUserByEmail: vi.fn(),
    createBetterAuthUser: vi.fn(),
    storePasswordResetCode: vi.fn(async () => undefined),
  };
});

import * as db from "./db";
import { sendPasswordResetCodeEmail } from "./_core/mailer";
import { appRouter } from "./routers";

const caller = appRouter.createCaller({ user: null } as never);

describe("password reset for legacy-only accounts", () => {
  beforeEach(() => vi.clearAllMocks());

  it("gives a legacy-only account a Better Auth user and sends the code", async () => {
    vi.mocked(db.getBetterAuthUserByEmail).mockResolvedValue(null);
    vi.mocked(db.getUserByEmail).mockResolvedValue({ id: 7, email: "seeker@example.com", name: "Seeker" } as never);
    vi.mocked(db.createBetterAuthUser).mockResolvedValue({ id: "ba-7", email: "seeker@example.com" } as never);

    await caller.auth.requestPasswordResetCode({ email: "Seeker@Example.com" });

    expect(db.createBetterAuthUser).toHaveBeenCalledWith("seeker@example.com", "Seeker");
    expect(sendPasswordResetCodeEmail).toHaveBeenCalledWith("seeker@example.com", expect.stringMatching(/^\d{6}$/));
  });

  it("still sends nothing, and creates nothing, for an unknown address", async () => {
    vi.mocked(db.getBetterAuthUserByEmail).mockResolvedValue(null);
    vi.mocked(db.getUserByEmail).mockResolvedValue(undefined);

    await expect(caller.auth.requestPasswordResetCode({ email: "nobody@example.com" })).resolves.toEqual({ success: true });

    expect(db.createBetterAuthUser).not.toHaveBeenCalled();
    expect(sendPasswordResetCodeEmail).not.toHaveBeenCalled();
  });
});
