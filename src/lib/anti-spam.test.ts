import { describe, expect, it } from "vitest";
import { isGibberish, spamReason, DEFAULT_MIN_FILL_MS } from "./anti-spam";

const human = { elapsedMs: 30_000 }; // 30s on the form

describe("spamReason", () => {
  it("passes a normal human submission", () => {
    expect(
      spamReason({
        ...human,
        hp: "",
        texts: ["Sufyan", "Acme Co", "We need a new marketing site by Q3."],
      }),
    ).toBeNull();
  });

  it("flags a filled honeypot regardless of other signals", () => {
    expect(spamReason({ ...human, hp: "http://spam.test" })).toBe("honeypot");
  });

  it("treats a missing elapsed time as a bypassed form", () => {
    expect(spamReason({ hp: "" })).toBe("no-elapsed");
    expect(spamReason({ hp: "", elapsedMs: NaN })).toBe("no-elapsed");
  });

  it("flags instant (too-fast) submissions", () => {
    expect(spamReason({ hp: "", elapsedMs: 200 })).toBe("too-fast");
    expect(spamReason({ hp: "", elapsedMs: DEFAULT_MIN_FILL_MS - 1 })).toBe(
      "too-fast",
    );
  });

  it("honors a custom minFillMs (e.g. the single-field newsletter)", () => {
    expect(spamReason({ hp: "", elapsedMs: 1_200 }, { minFillMs: 1_000 })).toBeNull();
    expect(spamReason({ hp: "", elapsedMs: 800 }, { minFillMs: 1_000 })).toBe(
      "too-fast",
    );
  });

  it("flags gibberish text fields", () => {
    expect(
      spamReason({ ...human, hp: "", texts: ["nqnzEFbMaBYHohpuo"] }),
    ).toBe("gibberish");
  });
});

describe("isGibberish", () => {
  it("flags the observed spam payloads", () => {
    for (const s of [
      "CZSTgRGsXnSeulOkCtkfAsJW",
      "nqnzEFbMaBYHohpuo",
      "RBMDiBYKqRkjCIXI",
      "EtemWQMGGyrxvzifBzy",
      "GjHmKOXpnDjnGWElzbVSow",
    ]) {
      expect(isGibberish(s), s).toBe(true);
    }
  });

  it("does not flag real names, words, or messages", () => {
    for (const s of [
      "Sufyan",
      "Muhammad",
      "Krishnamurthy",
      "McDonald", // legit internal capital, only 1 transition
      "Acme",
      "We need a brand refresh and a new website.",
      "hello",
      "JPMorgan", // 1 transition
    ]) {
      expect(isGibberish(s), s).toBe(false);
    }
  });
});
