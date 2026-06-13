/**
 * Server-side upload validation.
 *
 * The client (`upload-client.ts`) checks type/size for UX, but a server action
 * must never trust client-supplied `contentType`/size — a caller can invoke the
 * action directly. We sniff the real type from the file's magic bytes, enforce
 * an allowlist per bucket, and cap the size. SVG is rejected outright (it can
 * carry script and would be served from a public bucket → stored XSS).
 */

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100 MB

type Sniffed = { contentType: string; kind: "image" | "video" };

/** Identify a file from its leading bytes, or null if it isn't an allowed type. */
export function sniffUpload(bytes: Uint8Array): Sniffed | null {
  const b = bytes;
  const ascii = (start: number, str: string) =>
    str.split("").every((ch, i) => b[start + i] === ch.charCodeAt(0));

  // Images
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47)
    return { contentType: "image/png", kind: "image" };
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff)
    return { contentType: "image/jpeg", kind: "image" };
  if (ascii(0, "GIF8")) return { contentType: "image/gif", kind: "image" };
  if (ascii(0, "RIFF") && ascii(8, "WEBP"))
    return { contentType: "image/webp", kind: "image" };

  // Video
  if (ascii(4, "ftyp")) return { contentType: "video/mp4", kind: "video" };
  if (b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3)
    return { contentType: "video/webm", kind: "video" };

  return null; // unknown / disallowed (incl. SVG, HTML, PDF, …)
}

export type UploadValidation =
  | { ok: true; contentType: string }
  | { ok: false; error: string };

/**
 * Validate raw upload bytes against the target bucket. `media` accepts images,
 * `videos` accepts video. Returns the sniffed content type to store (never the
 * client's claim).
 */
export function validateUpload(
  bucket: "media" | "videos",
  bytes: Uint8Array,
): UploadValidation {
  if (bytes.length === 0) return { ok: false, error: "The file is empty." };

  const sniff = sniffUpload(bytes);
  if (!sniff) {
    return {
      ok: false,
      error: "Unsupported file type. Use PNG, JPEG, GIF, WebP, MP4, or WebM.",
    };
  }

  const expected = bucket === "videos" ? "video" : "image";
  if (sniff.kind !== expected) {
    return {
      ok: false,
      error:
        expected === "image"
          ? "That bucket only accepts images."
          : "That bucket only accepts video files.",
    };
  }

  const max = sniff.kind === "video" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (bytes.length > max) {
    return {
      ok: false,
      error: `File is too large (max ${Math.round(max / 1024 / 1024)}MB).`,
    };
  }

  return { ok: true, contentType: sniff.contentType };
}
