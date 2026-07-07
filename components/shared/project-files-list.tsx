import { File as FileIcon, FileText, PlayCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatFileSize } from "@/lib/files";
import type { ProjectFile } from "@/lib/types";

const dateFormatter = new Intl.DateTimeFormat("el-GR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export interface ProjectFileWithUrl extends ProjectFile {
  signedUrl: string | null;
}

function uploaderLabel(
  file: ProjectFile,
  viewerRole: "client" | "admin"
): string {
  if (file.is_from_admin) return "Imperial Automations";
  return viewerRole === "client" ? "Εσείς" : "Ο πελάτης";
}

export function ProjectFilesList({
  files,
  viewerRole,
}: {
  files: ProjectFileWithUrl[];
  viewerRole: "client" | "admin";
}) {
  if (files.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Δεν υπάρχουν ακόμα αρχεία.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {files.map((file) => (
        <Card key={file.id} className="overflow-hidden">
          <div className="flex aspect-square items-center justify-center bg-muted/40">
            {file.file_type === "image" && file.signedUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={file.signedUrl}
                alt={file.file_name}
                className="h-full w-full object-cover"
              />
            ) : file.file_type === "video" ? (
              <PlayCircle className="h-10 w-10 text-muted-foreground" />
            ) : file.file_type === "document" ? (
              <FileText className="h-10 w-10 text-muted-foreground" />
            ) : (
              <FileIcon className="h-10 w-10 text-muted-foreground" />
            )}
          </div>
          <CardContent className="space-y-1 p-3">
            <p className="truncate text-sm font-medium" title={file.file_name}>
              {file.file_name}
            </p>
            <p className="text-xs text-muted-foreground">
              {dateFormatter.format(new Date(file.created_at))} ·{" "}
              {uploaderLabel(file, viewerRole)}
            </p>
            {file.notes && (
              <p className="line-clamp-2 text-xs text-muted-foreground">
                {file.notes}
              </p>
            )}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-muted-foreground">
                {formatFileSize(file.file_size)}
              </span>
              {file.signedUrl && (
                <a
                  href={file.signedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-gold hover:underline"
                >
                  Προβολή
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
