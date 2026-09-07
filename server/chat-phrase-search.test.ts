import { describe, expect, it } from "vitest";
import {
  foldSearchText,
  searchChatPhrase,
  snippetAroundMatch,
} from "./chat-phrase-search";

describe("chat phrase search", () => {
  const messages = [
    {
      userId: 7,
      role: "user",
      content: "De o lună dorm prost și tot amân Tetradic-ul.",
    },
    {
      userId: 7,
      role: "assistant",
      content: "I am ORIEL. We can look at the Tetradic together.",
    },
    {
      userId: 9,
      role: "user",
      content: "Unrelated hello about the weather.",
    },
    {
      userId: 7,
      role: "user",
      content: "Mai amân Tetradic-ul până săptămâna viitoare.",
    },
  ];

  it("folds case and diacritics so a spoken phrase still matches", () => {
    expect(foldSearchText("Tetradic-ul")).toContain("tetradic");
    expect(foldSearchText("AMÂN")).toBe(foldSearchText("aman"));
  });

  it("returns only user-message hits grouped by oldUserId", () => {
    const hits = searchChatPhrase("aman Tetradic", messages, [
      { id: 7, email: "lisa@example.com" },
    ]);
    expect(hits).toHaveLength(1);
    expect(hits[0].oldUserId).toBe(7);
    expect(hits[0].emailIfKnown).toBe("lisa@example.com");
    expect(hits[0].hitCount).toBe(2);
    expect(hits[0].quotes).toHaveLength(2);
    expect(hits[0].quotes[0].snippet.toLowerCase()).toContain("tetradic");
  });

  it("does not match assistant text as the user's remembered sentence", () => {
    const hits = searchChatPhrase("look at the Tetradic together", messages);
    expect(hits).toEqual([]);
  });

  it("rejects phrases that are too short to be identifying", () => {
    expect(() => searchChatPhrase("da", messages)).toThrow(/4 characters/);
  });

  it("clips snippets so a session does not dump the whole thread", () => {
    const long = "x".repeat(80) + " FRAZA CHEIE " + "y".repeat(80);
    const snippet = snippetAroundMatch(long, "FRAZA CHEIE");
    expect(snippet.length).toBeLessThanOrEqual(150);
    expect(snippet).toContain("FRAZA CHEIE");
  });
});
