"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { FileFormState, ProjectFileType } from "@/lib/types";

const FILE_TYPES: ProjectFileType[] = ["image", "video", "document", "other"];

export async function createOwnProjectFile(
  _prevState: FileFormState,
  formData: FormData
): Promise<FileFormState> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", error: "Δεν είστε συνδεδεμένοι." };
  }

  const projectId = String(formData.get("project_id") ?? "").trim();
  const filePath = String(formData.get("file_path") ?? "").trim();
  const fileName = String(formData.get("file_name") ?? "").trim();
  const rawType = String(formData.get("file_type") ?? "other");
  const fileType = FILE_TYPES.includes(rawType as ProjectFileType)
    ? (rawType as ProjectFileType)
    : "other";
  const fileSize = Number(formData.get("file_size") ?? 0);
  const notes = String(formData.get("notes") ?? "").trim();

  if (!projectId || !filePath || !fileName) {
    return { status: "error", error: "Λείπουν στοιχεία του αρχείου." };
  }

  // Defense in depth — RLS on project_files enforces this ownership check
  // regardless, but this gives a clearer error than a generic insert failure.
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("client_id", user.id)
    .maybeSingle();

  if (!project) {
    return { status: "error", error: "Το project δε βρέθηκε." };
  }

  const { error } = await supabase.from("project_files").insert({
    project_id: projectId,
    uploaded_by: user.id,
    file_name: fileName,
    file_path: filePath,
    file_type: fileType,
    file_size: Number.isFinite(fileSize) ? Math.round(fileSize) : 0,
    notes: notes || null,
    is_from_admin: false,
  });

  if (error) {
    console.error("project_files insert failed (client):", error);
    return {
      status: "error",
      error: "Η καταχώρηση του αρχείου απέτυχε. Δοκιμάστε ξανά.",
    };
  }

  revalidatePath("/portal/files");

  return { status: "success" };
}
