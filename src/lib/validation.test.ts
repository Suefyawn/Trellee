import { describe, expect, it } from "vitest";
import { validateContact, validateBooking, EMAIL_RE } from "@/lib/validation";

describe("EMAIL_RE", () => {
  it("accepts ordinary addresses", () => {
    expect(EMAIL_RE.test("jane.doe@trellee.com")).toBe(true);
    expect(EMAIL_RE.test("a@b.co")).toBe(true);
  });
  it("rejects malformed addresses", () => {
    for (const bad of ["", "no-at", "no@domain", "spaces in@x.com", "@x.com"]) {
      expect(EMAIL_RE.test(bad)).toBe(false);
    }
  });
});

describe("validateContact", () => {
  const valid = {
    name: "Jane",
    email: "jane@trellee.com",
    message: "We need a custom CRM for our HVAC dispatch team.",
  };

  it("returns null for valid input", () => {
    expect(validateContact(valid)).toBeNull();
  });

  it("requires a name", () => {
    expect(validateContact({ ...valid, name: "  " })).toBe("Name is required.");
  });

  it("requires an email", () => {
    expect(validateContact({ ...valid, email: "" })).toBe("Email is required.");
  });

  it("rejects a malformed email", () => {
    expect(validateContact({ ...valid, email: "nope" })).toBe(
      "Please enter a valid email.",
    );
  });

  it("requires a message of at least 10 characters", () => {
    expect(validateContact({ ...valid, message: "too short" })).toMatch(
      /few more words/i,
    );
  });

  it("rejects oversized fields", () => {
    expect(
      validateContact({ ...valid, name: "x".repeat(201) }),
    ).toBe("One of the fields is too long.");
    expect(
      validateContact({ ...valid, message: "y".repeat(5001) }),
    ).toBe("One of the fields is too long.");
  });
});

describe("validateBooking", () => {
  const valid = { name: "Jane", email: "jane@trellee.com" };

  it("returns null for valid input (notes optional)", () => {
    expect(validateBooking(valid)).toBeNull();
    expect(validateBooking({ ...valid, notes: "Thursday works best." })).toBeNull();
  });

  it("requires name + a valid email", () => {
    expect(validateBooking({ ...valid, name: "" })).toBe("Name is required.");
    expect(validateBooking({ ...valid, email: "bad" })).toBe(
      "Please enter a valid email.",
    );
  });

  it("rejects oversized notes + phone", () => {
    expect(validateBooking({ ...valid, notes: "n".repeat(5001) })).toBe(
      "One of the fields is too long.",
    );
    expect(validateBooking({ ...valid, phone: "9".repeat(51) })).toBe(
      "One of the fields is too long.",
    );
  });
});
