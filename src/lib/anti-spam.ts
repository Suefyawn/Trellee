/**
 * Lightweight, dependency-free spam defenses for the public forms.
 *
 * Layered so each catches a different bot class, with **zero friction** for
 * real visitors — no CAPTCHA, no extra visible fields, no third-party request:
 *
 *   1. Honeypot — a field hidden from humans that auto-fill bots populate.
 *   2. Time-trap — the form measures how long it was on screen; a human takes
 *      seconds to type, bots submit instantly. A missing measurement (e.g. a
 *      bot POSTing the server action directly, bypassing the form) is rejected
 *      too. We send the *elapsed delta*, not an absolute timestamp, so a wrong
 *      client clock can never cause a false positive.
 *   3. Gibberish — the current spam wave is random character soup with erratic
 *      casing and no spaces (e.g. "nqnzEFbMaBYHohpuo"); flag obvious non-text.
 *
 * Callers treat a positive result as "accept silently, then drop": return a
 * success shape to the client without writing to the DB or sending email, so
 * bots can't tell they were blocked and won't adapt.
 */

/** Default minimum time-on-form before a submission is plausibly human. */
export const DEFAULT_MIN_FILL_MS = 2_500;

export type AntiSpamSignal = {
  /** Hidden honeypot field value; real submissions leave it empty. */
  hp?: string | null;
  /** Milliseconds the form was on screen before submit (client-measured delta). */
  elapsedMs?: number | null;
  /** Free-text fields to scan for gibberish. */
  texts?: (string | undefined | null)[];
};

export type AntiSpamOptions = {
  /** Override the minimum fill time (newsletter is a single field, so faster). */
  minFillMs?: number;
};

/**
 * Returns a short machine reason when the submission looks like spam, else
 * null. The reason is for logging only — never surface it to the client.
 */
export function spamReason(
  sig: AntiSpamSignal,
  opts: AntiSpamOptions = {},
): string | null {
  const minFillMs = opts.minFillMs ?? DEFAULT_MIN_FILL_MS;

  // 1. Honeypot — any value means a bot filled a field humans can't see.
  if (sig.hp && sig.hp.trim() !== "") return "honeypot";

  // 2. Time-trap — a real render always reports a sane elapsed time. Missing
  //    means the form path was bypassed; tiny means an instant (bot) submit.
  const e = sig.elapsedMs;
  if (typeof e !== "number" || !Number.isFinite(e)) return "no-elapsed";
  if (e < minFillMs) return "too-fast";

  // 3. Gibberish content in any scanned field.
  for (const text of sig.texts ?? []) {
    if (text && isGibberish(text)) return "gibberish";
  }

  return null;
}

/**
 * Heuristic for random-character spam like "CZSTgRGsXnSeulOkCtkfAsJW" or
 * "nqnzEFbMaBYHohpuo". Deliberately conservative — it only fires on a single
 * long token whose letter casing flips erratically (3+ lower↔upper switches),
 * which real names, words, and multi-word messages never do. Anything with
 * whitespace is treated as human.
 */
export function isGibberish(text: string): boolean {
  const trimmed = text.trim();
  if (/\s/.test(trimmed)) return false; // multi-word → human
  if (trimmed.length < 12) return false; // short tokens (names) are fine

  const letters = trimmed.replace(/[^a-zA-Z]/g, "");
  if (letters.length < 10) return false;

  let transitions = 0;
  for (let i = 1; i < letters.length; i++) {
    const prevUpper = letters[i - 1] >= "A" && letters[i - 1] <= "Z";
    const currUpper = letters[i] >= "A" && letters[i] <= "Z";
    if (prevUpper !== currUpper) transitions++;
  }
  return transitions >= 3;
}
