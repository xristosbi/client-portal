"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  buildStoragePath,
  formatFileSize,
  inferFileType,
  mimeForFile,
  validateFile,
} from "@/lib/files";
import { uploadToStorage } from "@/lib/upload-client";
import type { FileFormState, ProjectFileType } from "@/lib/types";
import { cn } from "@/lib/utils";

type Phase = "idle" | "uploading" | "review";

interface PendingUpload {
  path: string;
  name: string;
  type: ProjectFileType;
  size: number;
}

interface FileUploaderProps {
  projectId: string;
  action: (state: FileFormState, formData: FormData) => Promise<FileFormState>;
  /** Extra fields merged into the FormData passed to `action` (e.g. client_id). */
  extraFields?: Record<string, string>;
}

export function FileUploader({
  projectId,
  action,
  extraFields,
}: FileUploaderProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingUpload | null>(null);
  const [notes, setNotes] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleFile(file: File) {
    setError(null);

    const validation = validateFile(file);
    if (!validation.ok) {
      setError(validation.error);
      return;
    }

    const type = inferFileType(file);
    const path = buildStoragePath(projectId, file.name);

    setPhase("uploading");
    setProgress(0);

    try {
      await uploadToStorage({
        bucket: "project-files",
        path,
        file,
        contentType: mimeForFile(file),
        onProgress: setProgress,
      });
      setPending({ path, name: file.name, type, size: file.size });
      setPhase("review");
    } catch (err) {
      console.error("upload failed:", err);
      // uploadToStorage errors already carry the status code and the
      // storage-api message — show them so failures are diagnosable.
      setError(
        err instanceof Error && err.message
          ? err.message
          : "Το ανέβασμα απέτυχε. Δοκιμάστε ξανά."
      );
      setPhase("idle");
    }
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) void handleFile(file);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragOver(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  }

  async function handleSave() {
    if (!pending) return;
    setSaving(true);
    setError(null);

    const formData = new FormData();
    formData.set("project_id", projectId);
    formData.set("file_path", pending.path);
    formData.set("file_name", pending.name);
    formData.set("file_type", pending.type);
    formData.set("file_size", String(pending.size));
    formData.set("notes", notes);
    if (extraFields) {
      for (const [key, value] of Object.entries(extraFields)) {
        formData.set(key, value);
      }
    }

    const result = await action({ status: "idle" }, formData);

    if (result.status === "error") {
      setError(result.error ?? "Η αποθήκευση απέτυχε.");
      setSaving(false);
      return;
    }

    toast.success("Το αρχείο ανέβηκε.");
    setPending(null);
    setNotes("");
    setSaving(false);
    setPhase("idle");
    router.refresh();
  }

  function handleCancel() {
    setPending(null);
    setNotes("");
    setError(null);
    setSaving(false);
    setPhase("idle");
  }

  if (phase === "review" && pending) {
    return (
      <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
        <p className="text-sm">
          <span className="font-medium">{pending.name}</span>{" "}
          <span className="text-muted-foreground">
            ({formatFileSize(pending.size)})
          </span>
        </p>

        <div className="space-y-2">
          <Label htmlFor="file_notes">Σημείωση (προαιρετικό)</Label>
          <Input
            id="file_notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="π.χ. Πρώτο draft λογότυπου"
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="animate-spin" />
                Αποθήκευση…
              </>
            ) : (
              "Ολοκλήρωση"
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
            disabled={saving}
          >
            Άκυρο
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors",
          dragOver ? "border-gold bg-gold/5" : "border-border hover:border-gold/50"
        )}
      >
        <UploadCloud className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium">
          Σύρετε ένα αρχείο εδώ ή κάντε κλικ για επιλογή
        </p>
        <p className="text-xs text-muted-foreground">
          Εικόνες, βίντεο (έως 100MB), PDF ή Word (έως 20MB)
        </p>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept="image/*,video/*,application/pdf,.doc,.docx"
          onChange={handleInputChange}
        />
      </div>

      {phase === "uploading" && (
        <div className="space-y-1">
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-gold transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Ανέβασμα… {progress}%
          </p>
        </div>
      )}

      {error && phase === "idle" && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
