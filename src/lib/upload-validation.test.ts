import { describe, expect, it } from "vitest";
import { validateUpload, sniffUpload } from "./upload-validation";
import { safeNextPath } from "./utils";

const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]);
const webp = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
]);
const mp4 = new Uint8Array([0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70, 0, 0]);
const svg = new Uint8Array(Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'>"));

describe("sniffUpload", () => {
  it("identifies allowed image and video types from magic bytes", () => {
    expect(sniffUpload(png)?.contentType).toBe("image/png");
    expect(sniffUpload(jpeg)?.contentType).toBe("image/jpeg");
    expect(sniffUpload(webp)?.contentType).toBe("image/webp");
    expect(sniffUpload(mp4)).toEqual({ contentType: "video/mp4", kind: "video" });
  });

  it("rejects SVG and unknown content", () => {
    expect(sniffUpload(svg)).toBeNull();
    expect(sniffUpload(new Uint8Array([1, 2, 3, 4]))).toBeNull();
  });
});

describe("validateUpload", () => {
  it("accepts an image into the media bucket and returns the sniffed type", () => {
    expect(validateUpload("media", png)).toEqual({ ok: true, contentType: "image/png" });
  });

  it("accepts video into the videos bucket", () => {
    expect(validateUpload("videos", mp4)).toEqual({ ok: true, contentType: "video/mp4" });
  });

  it("rejects an image uploaded to the videos bucket and vice versa", () => {
    expect(validateUpload("videos", png).ok).toBe(false);
    expect(validateUpload("media", mp4).ok).toBe(false);
  });

  it("rejects SVG (stored-XSS vector) and empty files", () => {
    expect(validateUpload("media", svg).ok).toBe(false);
    expect(validateUpload("media", new Uint8Array(0)).ok).toBe(false);
  });

  it("enforces the image size cap", () => {
    const big = new Uint8Array(9 * 1024 * 1024);
    big.set(png.subarray(0, 8));
    expect(validateUpload("media", big).ok).toBe(false);
  });
});

describe("safeNextPath", () => {
  it("allows same-origin absolute paths", () => {
    expect(safeNextPath("/admin/invoices")).toBe("/admin/invoices");
  });

  it("falls back for open-redirect attempts", () => {
    expect(safeNextPath("https://evil.com")).toBe("/admin");
    expect(safeNextPath("//evil.com")).toBe("/admin");
    expect(safeNextPath("/\\evil.com")).toBe("/admin");
    expect(safeNextPath(undefined)).toBe("/admin");
    expect(safeNextPath("javascript:alert(1)")).toBe("/admin");
  });
});
