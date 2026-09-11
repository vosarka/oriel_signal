/**
 * Take our own request back out of a provider's error response.
 *
 * A validation error commonly echoes the payload it refused, and our payloads
 * are somebody's private memory or a reply ORIEL just spoke to them. Capping
 * the body limits how much of that reaches a log but does not stop it: an
 * echo sits in the first three hundred characters as easily as past them. We
 * know exactly what we transmitted, so we can remove it by name.
 *
 * Three things this has to get right, each of which was a hole first:
 *
 *   - The body is JSON, so an echo comes back escaped. A search for the raw
 *     sentence walks straight past `she said \"no\"` and reports success.
 *   - A caller may send several forms of the same thing. Memories are indexed
 *     under an `[orielMemories:id]` reference, and a service may echo either
 *     that or the bare sentence inside it, so longest matches first.
 *   - There is no length below which a sentence stops being a confidence.
 *     Seven characters can be the most private thing somebody has said.
 *
 * The cost of the third is that a two-character input redacts every
 * occurrence of those two characters and leaves a body too chewed to read.
 * A ruined diagnostic is recoverable. A leaked confidence is not.
 *
 * AGENTS.md rule 3: never log secrets. A private sentence is one.
 */
export function redactEcho(body: string, sent: string[]): string {
  const targets = sent
    .map(value => value.trim())
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);
  let safe = body;
  for (const target of targets) {
    // Split rather than regex: the content is arbitrary user text and would
    // need escaping, and a bad escape here would be the bug that leaks it.
    const escaped = JSON.stringify(target).slice(1, -1);
    safe = safe.split(target).join("[redacted]");
    if (escaped !== target) safe = safe.split(escaped).join("[redacted]");
  }
  return safe;
}
