import { createClient } from "@/lib/supabase/client";

interface UploadParams {
  bucket: string;
  path: string;
  file: File;
  /** Content-Type to send; pass mimeForFile(file) so empty file.type never
   * becomes application/octet-stream (rejected by the bucket allowlist). */
  contentType?: string;
  onProgress?: (percent: number) => void;
}

/** Pulls the human-readable error out of a storage-api error response body. */
function parseStorageError(responseText: string): string {
  try {
    const body = JSON.parse(responseText);
    return body.message || body.error || body.msg || "";
  } catch {
    return responseText?.slice(0, 200) ?? "";
  }
}

/**
 * Uploads directly to the Supabase Storage REST endpoint via XHR (instead
 * of the supabase-js storage client) so we get real upload progress events
 * — supabase-js's `.storage.upload()` doesn't expose progress callbacks.
 * Auth is the same as supabase-js would use: the user's session JWT plus
 * the anon apikey, so Storage RLS applies exactly as it does everywhere
 * else in the app.
 */
export async function uploadToStorage({
  bucket,
  path,
  file,
  contentType,
  onProgress,
}: UploadParams): Promise<void> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Δεν υπάρχει ενεργή σύνδεση.");
  }

  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/${bucket}/${path}`;

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Authorization", `Bearer ${session.access_token}`);
    xhr.setRequestHeader(
      "apikey",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    xhr.setRequestHeader(
      "Content-Type",
      contentType || file.type || "application/octet-stream"
    );
    xhr.setRequestHeader("x-upsert", "false");

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        const detail = parseStorageError(xhr.responseText);
        console.error("storage upload failed:", {
          status: xhr.status,
          body: xhr.responseText,
          url,
        });
        reject(
          new Error(
            `Το ανέβασμα απέτυχε (${xhr.status}${detail ? `: ${detail}` : ""})`
          )
        );
      }
    };

    xhr.onerror = () => reject(new Error("Σφάλμα δικτύου κατά το ανέβασμα."));

    xhr.send(file);
  });
}
