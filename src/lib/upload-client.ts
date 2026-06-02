import { uploadAsset } from "@/app/admin/_actions/reviews";

export const MAX_UPLOAD_MB = 6;

/** Encode a File to base64 in chunks (avoids call-stack overflow on big files). */
export async function fileToBase64(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export type UploadOutcome = { ok: true; url: string } | { ok: false; error: string };

/** Validate + upload a single image to the public media bucket. */
export async function uploadImageFile(
  file: File,
  bucket: "media" | "videos" = "media",
): Promise<UploadOutcome> {
  if (!file.type.startsWith("image/")) {
    return { ok: false, error: "Please choose an image file." };
  }
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
    return { ok: false, error: `Image must be under ${MAX_UPLOAD_MB}MB.` };
  }
  try {
    const base64 = await fileToBase64(file);
    const res = await uploadAsset({
      bucket,
      filename: file.name,
      contentType: file.type || "image/jpeg",
      base64,
    });
    return res.ok ? { ok: true, url: res.url } : { ok: false, error: res.error };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
