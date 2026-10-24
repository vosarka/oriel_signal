import { describe, expect, it } from "vitest";
import { decideIntroFilm } from "../client/src/lib/introFilm";

const base = {
  authLoading: false,
  signedIn: false,
  seenOnAccount: false,
  seenInBrowser: false,
};

describe("the intro film plays once", () => {
  it("waits until it knows who is visiting", () => {
    expect(decideIntroFilm({ ...base, authLoading: true })).toBe("wait");
  });

  it("plays for a first visit, signed in or not", () => {
    expect(decideIntroFilm(base)).toBe("show");
    expect(decideIntroFilm({ ...base, signedIn: true })).toBe("show");
  });

  it("does not replay for a visitor who saw it in this browser", () => {
    expect(decideIntroFilm({ ...base, seenInBrowser: true })).toBe("skip");
  });

  it("does not replay on another device once the account has seen it", () => {
    expect(
      decideIntroFilm({ ...base, signedIn: true, seenOnAccount: true })
    ).toBe("skip");
  });

  it("records, rather than replays, a film watched before signing up", () => {
    expect(
      decideIntroFilm({ ...base, signedIn: true, seenInBrowser: true })
    ).toBe("record");
  });
});
