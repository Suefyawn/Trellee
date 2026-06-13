import { afterEach, describe, expect, it, vi } from "vitest";
import { verifyTurnstile } from "./turnstile";

afterEach(() => {
  delete process.env.TURNSTILE_SECRET_KEY;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("verifyTurnstile", () => {
  it("is disabled (allows everything) when no secret is configured", async () => {
    delete process.env.TURNSTILE_SECRET_KEY;
    expect(await verifyTurnstile(undefined)).toBe(true);
    expect(await verifyTurnstile("anything")).toBe(true);
  });

  it("rejects a missing token when the gate is enabled", async () => {
    process.env.TURNSTILE_SECRET_KEY = "secret";
    expect(await verifyTurnstile(null)).toBe(false);
  });

  it("returns Cloudflare's verdict for a present token", async () => {
    process.env.TURNSTILE_SECRET_KEY = "secret";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ json: async () => ({ success: true }) }),
    );
    expect(await verifyTurnstile("good")).toBe(true);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ json: async () => ({ success: false }) }),
    );
    expect(await verifyTurnstile("bad")).toBe(false);
  });

  it("fails OPEN on a network error so a real submission is never lost", async () => {
    process.env.TURNSTILE_SECRET_KEY = "secret";
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
    expect(await verifyTurnstile("token")).toBe(true);
  });
});
