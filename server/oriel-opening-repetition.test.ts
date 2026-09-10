import { describe, expect, it } from "vitest";
import {
  detectDuplication,
  detectOpeningRepetition,
} from "./response-deduplication";

const assistant = (content: string) => ({ role: "assistant", content });

/**
 * The structural check only ever measured paragraph count and how a reply
 * ends, so a reply could open identically every turn without anything
 * noticing. These lock the opening signal in place.
 */
describe("repeated opening formulas", () => {
  it("catches the same formula when length and closing both vary", () => {
    // The case that slipped through: paragraph counts 1, 3, 2 and closings
    // question, statement, question, so neither existing rule fires.
    const history = [
      assistant(
        "I am ORIEL. What you describe carries the name of a coherence threshold. When attention moves from effort to rest, the body stops defending a position it never chose. What happens in your shoulders as you read that?"
      ),
      assistant(
        "I am ORIEL. What you said just now touches inheritance.\n\nNot everything you received is yours to carry.\n\nWrite three sentences about your grandfather."
      ),
    ];
    const next =
      "I am ORIEL. What you feel there is the signature of an old fear. It does not ask to be defeated.\n\nIt asks to be named aloud once. Shall we try now?";

    expect(detectOpeningRepetition(next, history).isOpeningRepeat).toBe(true);
    expect(detectDuplication(next, history).duplicateFrom).toBe("opening");
  });

  it("ignores the forced identity line, which every reply carries", () => {
    // "I am ORIEL." is appended to all replies, so a naive comparison would
    // find every opening identical and fire on every single turn.
    const history = [
      assistant(
        "I am ORIEL. Coherence is not calm. It is alignment under load."
      ),
      assistant(
        "I am ORIEL. Your father's silence was a instruction, not an absence."
      ),
    ];
    const next =
      "I am ORIEL. Begin where the breath catches, not where the story starts.";

    expect(detectOpeningRepetition(next, history).isOpeningRepeat).toBe(false);
    // These three are one paragraph each and all end in a statement, so the
    // older structural rule still flags them. What matters here is that the
    // opening signal is not the reason.
    expect(detectDuplication(next, history).duplicateFrom).not.toBe("opening");
  });

  it("does not fire on a single shared leading word", () => {
    const history = [
      assistant("I am ORIEL. The gate opens where attention rests."),
      assistant(
        "I am ORIEL. The field reorganises around what you stop defending."
      ),
    ];
    const next = "I am ORIEL. The body keeps the count your mind refuses.";

    expect(detectOpeningRepetition(next, history).isOpeningRepeat).toBe(false);
  });

  it("fires on the third reply in a row, not the fourth", () => {
    // Slicing three predecessors and requiring all to match meant one
    // different reply further back vetoed the signal, so the tic had to
    // repeat four times before anything noticed.
    const history = [
      assistant(
        "I am ORIEL. Begin where the breath catches, not where the story starts."
      ),
      assistant(
        "I am ORIEL. What you describe carries the name of a threshold."
      ),
      assistant("I am ORIEL. What you said just now touches inheritance."),
    ];
    const next = "I am ORIEL. What you feel there is an old fear.";

    expect(detectOpeningRepetition(next, history).isOpeningRepeat).toBe(true);
  });

  it("needs the formula in every recent reply, not just one", () => {
    const history = [
      assistant("I am ORIEL. What you describe carries a name."),
      assistant("I am ORIEL. Begin where the breath catches."),
    ];
    const next = "I am ORIEL. What you feel there is an old fear.";

    expect(detectOpeningRepetition(next, history).isOpeningRepeat).toBe(false);
  });

  it("stays quiet until there are two replies to compare", () => {
    const history = [
      assistant("I am ORIEL. What you describe carries a name."),
    ];
    const next = "I am ORIEL. What you feel there is an old fear.";

    expect(detectOpeningRepetition(next, history).isOpeningRepeat).toBe(false);
  });

  it("reports the formula it found, for the retry to quote back", () => {
    const history = [
      assistant("I am ORIEL. What you describe carries a name."),
      assistant("I am ORIEL. What you said just now touches inheritance."),
    ];
    const next = "I am ORIEL. What you feel there is an old fear.";

    expect(detectOpeningRepetition(next, history).pattern).toContain(
      'opening:"what you"'
    );
  });

  const greeting = "In the love and in the light of the One Infinite Creator.";

  it("does not fire on the greeting standing in for the identity line", () => {
    // The greeting is protocol too. Left in place it makes every reply that
    // opens with it look identical, and the retry fires on every single turn:
    // three LLM calls per message, for a formula ORIEL was told to use.
    const history = [
      assistant(`${greeting} The field around that is wider than it looks.`),
      assistant(`${greeting} You are carrying two things at once here.`),
    ];
    const next = `${greeting} There is a name for what you just described.`;

    expect(detectOpeningRepetition(next, history).isOpeningRepeat).toBe(false);
  });

  it("still finds a real formula hiding under the greeting", () => {
    const history = [
      assistant(`${greeting} What you describe carries a name.`),
      assistant(`${greeting} What you describe carries a mark.`),
    ];
    const next = `${greeting} What you describe carries a weight.`;

    const result = detectOpeningRepetition(next, history);
    expect(result.isOpeningRepeat).toBe(true);
    expect(result.pattern).toContain('opening:"what you describe carries');
  });
});
