import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { NoProjectState } from "@/components/portal/no-project-state";
import { FileUploader } from "@/components/shared/file-uploader";
import {
  ProjectFilesList,
  type ProjectFileWithUrl,
} from "@/components/shared/project-files-list";
import { getProfileOrRedirect } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Project, ProjectFile } from "@/lib/types";
import { createOwnProjectFile } from "./actions";

export const metadata: Metadata = {
  title: "Αρχεία",
};

export default async function PortalFilesPage() {
  const profile = await getProfileOrRedirect();
  const supabase = createClient();

  const { data: projectData } = await supabase
    .from("projects")
    .select("*")
    .eq("client_id", profile.id)
    .maybeSingle();

  const project = projectData as Project | null;

  if (!project) {
    return (
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Αρχεία</h1>
        </div>
        <NoProjectState />
      </div>
    );
  }

  const { data: fileData } = await supabase
    .from("project_files")
    .select("*")
    .eq("project_id", project.id)
    .order("created_at", { ascending: false });

  const files = (fileData ?? []) as ProjectFile[];

  const signedUrlByPath = new Map<string, string>();
  if (files.length > 0) {
    const { data: signed } = await supabase.storage
      .from("project-files")
      .createSignedUrls(
        files.map((file) => file.file_path),
        60 * 60
      );
    for (const item of signed ?? []) {
      if (item.signedUrl && item.path) {
        signedUrlByPath.set(item.path, item.signedUrl);
      }
    }
  }

  const filesWithUrls: ProjectFileWithUrl[] = files.map((file) => ({
    ...file,
    signedUrl: signedUrlByPath.get(file.file_path) ?? null,
  }));

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Αρχεία</h1>
        <p className="mt-1 text-muted-foreground">
          Ανεβάστε φωτογραφίες, βίντεο ή έγγραφα για το project σας.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ανέβασμα Αρχείου</CardTitle>
          <CardDescription>
            Εικόνες, βίντεο (έως 100MB) ή PDF/Word (έως 20MB).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FileUploader projectId={project.id} action={createOwnProjectFile} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Τα Αρχεία σας ({files.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProjectFilesList files={filesWithUrls} viewerRole="client" />
        </CardContent>
      </Card>
    </div>
  );
}
