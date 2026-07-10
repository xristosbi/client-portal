import type { ProjectFileType } from "@/lib/types";

export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
export const MAX_OTHER_BYTES = 20 * 1024 * 1024;

const DOCUMENT_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export function inferFileType(file: File): ProjectFileType {
  const mime = file.type;
  const name = file.name.toLowerCase();

  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (DOCUMENT_MIME_TYPES.has(mime)) return "document";

  // Some browsers/drag sources omit the mime type; fall back to extension.
  if (/\.(png|jpe?g|gif|webp|heic|heif|bmp|svg)$/.test(name)) return "image";
  if (/\.(mp4|mov|avi|webm|mkv|m4v)$/.test(name)) return "video";
  if (/\.(pdf|docx?)$/.test(name)) return "document";

  return "other";
}

export function validateFile(
  file: File
): { ok: true } | { ok: false; error: string } {
  const type = inferFileType(file);

  if (type === "other") {
    return {
      ok: false,
      error:
        "Μη υποστηριζόμενος τύπος αρχείου. Επιτρέπονται εικόνες, βίντεο, PDF και Word.",
    };
  }

  const limit = type === "video" ? MAX_VIDEO_BYTES : MAX_OTHER_BYTES;
  if (file.size > limit) {
    const limitLabel = type === "video" ? "100MB" : "20MB";
    return {
      ok: false,
      error: `Το αρχείο ξεπερνά το όριο των ${limitLabel}.`,
    };
  }

  return { ok: true };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = -1;
  do {
    value /= 1024;
    unitIndex++;
  } while (value >= 1024 && unitIndex < units.length - 1);
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[unitIndex]}`;
}

const EXTENSION_MIME_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
  bmp: "image/bmp",
  svg: "image/svg+xml",
  avif: "image/avif",
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
  mkv: "video/x-matroska",
  avi: "video/x-msvideo",
  m4v: "video/x-m4v",
  "3gp": "video/3gpp",
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

/**
 * Content-Type to send when uploading. Browsers often report an empty
 * file.type (HEIC photos from iPhones, files dragged out of some apps), and
 * sending application/octet-stream gets rejected by the bucket's mime
 * allowlist — so fall back to the extension before giving up.
 */
export function mimeForFile(file: File): string {
  if (file.type) return file.type;
  const extension = file.name.toLowerCase().split(".").pop() ?? "";
  return EXTENSION_MIME_TYPES[extension] ?? "application/octet-stream";
}

function sanitizeFileName(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "-")
    .replace(/-+/g, "-");
}

/** Storage key convention: <project_id>/<uuid>-<sanitized original name>. */
export function buildStoragePath(projectId: string, fileName: string): string {
  return `${projectId}/${crypto.randomUUID()}-${sanitizeFileName(fileName)}`;
}
