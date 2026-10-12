import { describe, expect, it, vi } from "vitest";

vi.mock("./transmission-service", () => ({ transmissionAudio: vi.fn() }));

import { parseRange } from "./transmission-audio-route";

describe("audio byte ranges, so the player can seek", () => {
  it("reads open, closed and suffix ranges", () => {
    expect(parseRange("bytes=0-", 100)).toEqual([0, 99]);
    expect(parseRange("bytes=10-19", 100)).toEqual([10, 19]);
    expect(parseRange("bytes=-10", 100)).toEqual([90, 99]);
    expect(parseRange("bytes=90-500", 100)).toEqual([90, 99]);
  });

  it("ignores what it cannot serve", () => {
    expect(parseRange(undefined, 100)).toBeNull();
    expect(parseRange("bytes=-", 100)).toBeNull();
    expect(parseRange("bytes=200-300", 100)).toBeNull();
    expect(parseRange("items=0-1", 100)).toBeNull();
  });
});
