/**
 * The intro film plays once per Seeker, whichever page they arrive on.
 *
 * A signed-in Seeker is remembered in the database, so the film does not
 * return on another device. A visitor without an account is remembered in
 * this browser, and that memory follows them into the account they make: the
 * film they already watched is recorded for it rather than played again.
 */

/**
 * Served by YouTube, not by us: a 35 MB file per first visit would have been
 * paid for on Railway, visitor by visitor. Empty means the film is off.
 */
export const INTRO_FILM_YOUTUBE_URL = "";

const STORAGE_KEY = "oriel_intro_film_seen";

export type IntroFilmDecision =
  /** Who the visitor is is not known yet. */
  | "wait"
  | "show"
  /** Seen in this browser before signing in: record it, do not replay. */
  | "record"
  | "skip";

export function decideIntroFilm(input: {
  authLoading: boolean;
  signedIn: boolean;
  seenOnAccount: boolean;
  seenInBrowser: boolean;
}): IntroFilmDecision {
  if (input.authLoading) return "wait";
  if (input.signedIn) {
    if (input.seenOnAccount) return "skip";
    return input.seenInBrowser ? "record" : "show";
  }
  return input.seenInBrowser ? "skip" : "show";
}

// Storage can be missing or refuse writes (private windows, blocked site
// data). Neither may break the page; the account memory still holds.
export function introFilmSeenInBrowser(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

export function rememberIntroFilmInBrowser(): void {
  try {
    localStorage.setItem(STORAGE_KEY, new Date().toISOString());
  } catch {
    // Nothing to do: the account memory is the one that counts.
  }
}
