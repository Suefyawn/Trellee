import { afterEach, describe, expect, it, vi } from "vitest";
import { cn, slugify, formatDate, timeAgo } from "@/lib/utils";

describe("cn", () => {
  it("merges and dedupes Tailwind classes (last wins)", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("text-sm", false && "hidden", "font-bold")).toBe(
      "text-sm font-bold",
    );
  });
});

describe("slugify", () => {
  it("lowercases, trims, and hyphenates", () => {
    expect(slugify("  Hello World  ")).toBe("hello-world");
    expect(slugify("Custom CRM Development")).toBe("custom-crm-development");
  });
  it("strips punctuation and collapses separators", () => {
    expect(slugify("Why we don't do discovery phases!")).toBe(
      "why-we-dont-do-discovery-phases",
    );
    expect(slugify("a__b--c")).toBe("a-b-c");
  });
});

describe("formatDate", () => {
  it("formats as 'Mon D, YYYY' (en-US)", () => {
    // Construct in local time so the assertion is timezone-independent.
    expect(formatDate(new Date(2025, 0, 15))).toBe("Jan 15, 2025");
  });
});

describe("timeAgo", () => {
  afterEach(() => vi.useRealTimers());

  it("renders compact relative durations", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const ago = (ms: number) => new Date(Date.now() - ms);
    expect(timeAgo(ago(5_000))).toBe("5s ago");
    expect(timeAgo(ago(5 * 60_000))).toBe("5m ago");
    expect(timeAgo(ago(3 * 3_600_000))).toBe("3h ago");
    expect(timeAgo(ago(2 * 86_400_000))).toBe("2d ago");
  });
});
