"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { isCurrentUserAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type {
  FileFormState,
  MilestoneStatus,
  ProjectFileType,
  ProjectStatus,
} from "@/lib/types";

export interface ProjectFormState {
  status: "idle" | "error" | "success";
  error?: string;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const PROJECT_STATUSES: ProjectStatus[] = [
  "onboarding",
  "in_progress",
  "review",
  "completed",
  "paused",
];

const MILESTONE_STATUSES: MilestoneStatus[] = [
  "pending",
  "in_progress",
  "completed",
];

const NO_PERMISSION = "Δεν έχετε δικαίωμα για αυτή την ενέργεια.";

function parseOptionalDate(value: FormDataEntryValue | null): {
  date: string | null;
  valid: boolean;
} {
  const raw = String(value ?? "").trim();
  if (!raw) return { date: null, valid: true };
  return { date: raw, valid: DATE_RE.test(raw) };
}

interface ProjectFields {
  name: string;
  description: string | null;
  status: ProjectStatus;
  start_date: string | null;
  target_end_date: string | null;
}

function parseProjectFields(
  formData: FormData
): { fields: ProjectFields } | { error: string } {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const status = String(formData.get("status") ?? "");
  const startDate = parseOptionalDate(formData.get("start_date"));
  const targetEndDate = parseOptionalDate(formData.get("target_end_date"));

  if (!name) {
    return { error: "Το όνομα του project είναι υποχρεωτικό." };
  }
  if (!PROJECT_STATUSES.includes(status as ProjectStatus)) {
    return { error: "Η κατάσταση δεν είναι έγκυρη." };
  }
  if (!startDate.valid || !targetEndDate.valid) {
    return { error: "Η ημερομηνία δεν είναι έγκυρη." };
  }

  return {
    fields: {
      name,
      description: description || null,
      status: status as ProjectStatus,
      start_date: startDate.date,
      target_end_date: targetEndDate.date,
    },
  };
}

export async function createProject(
  _prevState: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
  if (!(await isCurrentUserAdmin())) {
    return { status: "error", error: NO_PERMISSION };
  }

  const clientId = String(formData.get("client_id") ?? "").trim();
  if (!clientId) {
    return { status: "error", error: "Ο πελάτης δε βρέθηκε." };
  }

  const parsed = parseProjectFields(formData);
  if ("error" in parsed) {
    return { status: "error", error: parsed.error };
  }

  const supabase = createClient();

  const { data: existing } = await supabase
    .from("projects")
    .select("id")
    .eq("client_id", clientId)
    .maybeSingle();

  if (existing) {
    return {
      status: "error",
      error: "Υπάρχει ήδη project για αυτόν τον πελάτη.",
    };
  }

  const { error } = await supabase.from("projects").insert({
    client_id: clientId,
    ...parsed.fields,
  });

  if (error) {
    console.error("project insert failed:", error);
    return {
      status: "error",
      error: "Η δημιουργία του project απέτυχε. Δοκιμάστε ξανά.",
    };
  }

  revalidatePath(`/admin/clients/${clientId}`);

  return { status: "success" };
}

export async function updateProject(
  _prevState: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
  if (!(await isCurrentUserAdmin())) {
    return { status: "error", error: NO_PERMISSION };
  }

  const projectId = String(formData.get("project_id") ?? "").trim();
  if (!projectId) {
    return { status: "error", error: "Το project δε βρέθηκε." };
  }

  const parsed = parseProjectFields(formData);
  if ("error" in parsed) {
    return { status: "error", error: parsed.error };
  }

  const supabase = createClient();

  const { data: updated, error } = await supabase
    .from("projects")
    .update(parsed.fields)
    .eq("id", projectId)
    .select("client_id")
    .single();

  if (error || !updated) {
    console.error("project update failed:", error);
    return {
      status: "error",
      error: "Η ενημέρωση του project απέτυχε. Δοκιμάστε ξανά.",
    };
  }

  revalidatePath(`/admin/clients/${updated.client_id}`);

  return { status: "success" };
}

interface MilestoneFields {
  title: string;
  description: string | null;
  due_date: string | null;
  status: MilestoneStatus;
}

function parseMilestoneFields(
  formData: FormData
): { fields: MilestoneFields } | { error: string } {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const status = String(formData.get("status") ?? "");
  const dueDate = parseOptionalDate(formData.get("due_date"));

  if (!title) {
    return { error: "Ο τίτλος είναι υποχρεωτικός." };
  }
  if (!MILESTONE_STATUSES.includes(status as MilestoneStatus)) {
    return { error: "Η κατάσταση δεν είναι έγκυρη." };
  }
  if (!dueDate.valid) {
    return { error: "Η ημερομηνία δεν είναι έγκυρη." };
  }

  return {
    fields: {
      title,
      description: description || null,
      due_date: dueDate.date,
      status: status as MilestoneStatus,
    },
  };
}

export async function createMilestone(
  _prevState: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
  if (!(await isCurrentUserAdmin())) {
    return { status: "error", error: NO_PERMISSION };
  }

  const projectId = String(formData.get("project_id") ?? "").trim();
  if (!projectId) {
    return { status: "error", error: "Το project δε βρέθηκε." };
  }

  const parsed = parseMilestoneFields(formData);
  if ("error" in parsed) {
    return { status: "error", error: parsed.error };
  }

  const supabase = createClient();

  const { data: last } = await supabase
    .from("milestones")
    .select("sort_order")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("milestones").insert({
    project_id: projectId,
    sort_order: (last?.sort_order ?? 0) + 1,
    ...parsed.fields,
  });

  if (error) {
    console.error("milestone insert failed:", error);
    return {
      status: "error",
      error: "Η δημιουργία του milestone απέτυχε. Δοκιμάστε ξανά.",
    };
  }

  revalidatePath("/admin/clients/[id]", "page");

  return { status: "success" };
}

export async function updateMilestone(
  _prevState: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
  if (!(await isCurrentUserAdmin())) {
    return { status: "error", error: NO_PERMISSION };
  }

  const milestoneId = String(formData.get("milestone_id") ?? "").trim();
  if (!milestoneId) {
    return { status: "error", error: "Το milestone δε βρέθηκε." };
  }

  const parsed = parseMilestoneFields(formData);
  if ("error" in parsed) {
    return { status: "error", error: parsed.error };
  }

  const supabase = createClient();

  const { error } = await supabase
    .from("milestones")
    .update(parsed.fields)
    .eq("id", milestoneId);

  if (error) {
    console.error("milestone update failed:", error);
    return {
      status: "error",
      error: "Η ενημέρωση του milestone απέτυχε. Δοκιμάστε ξανά.",
    };
  }

  revalidatePath("/admin/clients/[id]", "page");

  return { status: "success" };
}

export async function deleteMilestone(
  milestoneId: string
): Promise<{ error?: string }> {
  if (!(await isCurrentUserAdmin())) {
    return { error: NO_PERMISSION };
  }

  const supabase = createClient();

  const { error } = await supabase
    .from("milestones")
    .delete()
    .eq("id", milestoneId);

  if (error) {
    console.error("milestone delete failed:", error);
    return { error: "Η διαγραφή απέτυχε. Δοκιμάστε ξανά." };
  }

  revalidatePath("/admin/clients/[id]", "page");

  return {};
}

export async function moveMilestone(
  milestoneId: string,
  direction: "up" | "down"
): Promise<{ error?: string }> {
  if (!(await isCurrentUserAdmin())) {
    return { error: NO_PERMISSION };
  }

  const supabase = createClient();

  const { data: current } = await supabase
    .from("milestones")
    .select("id, project_id, sort_order")
    .eq("id", milestoneId)
    .single();

  if (!current) {
    return { error: "Το milestone δε βρέθηκε." };
  }

  const { data: neighbor } = await supabase
    .from("milestones")
    .select("id, sort_order")
    .eq("project_id", current.project_id)
    .filter(
      "sort_order",
      direction === "up" ? "lt" : "gt",
      current.sort_order
    )
    .order("sort_order", { ascending: direction === "down" })
    .limit(1)
    .maybeSingle();

  if (!neighbor) {
    return {};
  }

  const [{ error: firstError }, { error: secondError }] = await Promise.all([
    supabase
      .from("milestones")
      .update({ sort_order: neighbor.sort_order })
      .eq("id", current.id),
    supabase
      .from("milestones")
      .update({ sort_order: current.sort_order })
      .eq("id", neighbor.id),
  ]);

  if (firstError || secondError) {
    console.error("milestone reorder failed:", firstError ?? secondError);
    return { error: "Η αναδιάταξη απέτυχε. Δοκιμάστε ξανά." };
  }

  revalidatePath("/admin/clients/[id]", "page");

  return {};
}

const FILE_TYPES: ProjectFileType[] = ["image", "video", "document", "other"];

const MAX_AGREEMENT_PDF_BYTES = 10 * 1024 * 1024;

export async function deleteClientInvoice(
  invoiceId: string
): Promise<{ error?: string }> {
  if (!(await isCurrentUserAdmin())) {
    return { error: NO_PERMISSION };
  }

  const supabase = createClient();

  const { data: invoice } = await supabase
    .from("client_invoices")
    .select("id, client_id, file_path")
    .eq("id", invoiceId)
    .maybeSingle();

  if (!invoice) {
    return { error: "Το τιμολόγιο δε βρέθηκε." };
  }

  const { error } = await supabase
    .from("client_invoices")
    .delete()
    .eq("id", invoiceId);

  if (error) {
    console.error("invoice delete failed:", error);
    return { error: `Η διαγραφή απέτυχε (database: ${error.message}).` };
  }

  // Remove the PDF too — best effort, the row is already gone.
  if (invoice.file_path) {
    const { error: removeError } = await supabase.storage
      .from("client-invoices")
      .remove([invoice.file_path]);
    if (removeError) {
      console.error("invoice file cleanup failed:", removeError);
    }
  }

  revalidatePath(`/admin/clients/${invoice.client_id}`);
  revalidatePath("/admin/payments");

  return {};
}

export async function saveAgreement(
  _prevState: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
  if (!(await isCurrentUserAdmin())) {
    return { status: "error", error: NO_PERMISSION };
  }

  const clientId = String(formData.get("client_id") ?? "").trim();
  const agreementId = String(formData.get("agreement_id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const contentType = String(formData.get("content_type") ?? "");

  if (!clientId) {
    return { status: "error", error: "Ο πελάτης δε βρέθηκε." };
  }
  if (!title) {
    return { status: "error", error: "Ο τίτλος είναι υποχρεωτικός." };
  }
  if (contentType !== "markdown" && contentType !== "pdf") {
    return { status: "error", error: "Επιλέξτε τύπο συμφωνίας." };
  }

  const supabase = createClient();

  // Existing row (when editing): needed to know the old file to clean up.
  let existing: {
    id: string;
    file_path: string | null;
    content_type: string;
  } | null = null;
  if (agreementId) {
    const { data } = await supabase
      .from("agreements")
      .select("id, file_path, content_type")
      .eq("id", agreementId)
      .eq("client_id", clientId)
      .maybeSingle();
    existing = data;
    if (!existing) {
      return { status: "error", error: "Η συμφωνία δε βρέθηκε." };
    }
  }

  let payload: {
    title: string;
    content_type: "markdown" | "pdf";
    content_markdown: string | null;
    file_path: string | null;
  };
  let oldFileToRemove: string | null = null;

  if (contentType === "markdown") {
    const content = String(formData.get("content_markdown") ?? "").trim();
    if (!content) {
      return {
        status: "error",
        error: "Το κείμενο της συμφωνίας είναι υποχρεωτικό.",
      };
    }
    payload = {
      title,
      content_type: "markdown",
      content_markdown: content,
      file_path: null,
    };
    oldFileToRemove = existing?.file_path ?? null;
  } else {
    const file = formData.get("file");
    const hasNewFile = file instanceof File && file.size > 0;

    if (!hasNewFile) {
      // No new file: allowed only as a title-only update of an existing
      // PDF agreement.
      if (existing?.content_type === "pdf" && existing.file_path) {
        payload = {
          title,
          content_type: "pdf",
          content_markdown: null,
          file_path: existing.file_path,
        };
      } else {
        return {
          status: "error",
          error: "Επιλέξτε το αρχείο PDF της συμφωνίας.",
        };
      }
    } else {
      if (file.size > MAX_AGREEMENT_PDF_BYTES) {
        return { status: "error", error: "Το αρχείο ξεπερνά το όριο των 10MB." };
      }
      const isPdf =
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf");
      if (!isPdf) {
        return { status: "error", error: "Επιτρέπονται μόνο αρχεία PDF." };
      }

      const filePath = `${clientId}/${randomUUID()}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from("agreements")
        .upload(filePath, file, { contentType: "application/pdf" });

      if (uploadError) {
        console.error("agreement upload failed:", uploadError);
        return {
          status: "error",
          error: "Η μεταφόρτωση του αρχείου απέτυχε. Δοκιμάστε ξανά.",
        };
      }

      payload = {
        title,
        content_type: "pdf",
        content_markdown: null,
        file_path: filePath,
      };
      oldFileToRemove = existing?.file_path ?? null;
    }
  }

  const { error: writeError } = existing
    ? await supabase.from("agreements").update(payload).eq("id", existing.id)
    : await supabase
        .from("agreements")
        .insert({ client_id: clientId, ...payload });

  if (writeError) {
    console.error("agreement write failed:", writeError);
    // Don't orphan a freshly uploaded file if the row write failed.
    if (payload.file_path && payload.file_path !== existing?.file_path) {
      await supabase.storage.from("agreements").remove([payload.file_path]);
    }
    return {
      status: "error",
      error: `Η αποθήκευση της συμφωνίας απέτυχε (database: ${writeError.message}).`,
    };
  }

  // Best-effort cleanup of the replaced PDF.
  if (oldFileToRemove && oldFileToRemove !== payload.file_path) {
    await supabase.storage.from("agreements").remove([oldFileToRemove]);
  }

  revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath("/portal/agreement");

  return { status: "success" };
}

export async function createAdminProjectFile(
  _prevState: FileFormState,
  formData: FormData
): Promise<FileFormState> {
  if (!(await isCurrentUserAdmin())) {
    return { status: "error", error: NO_PERMISSION };
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
  const clientId = String(formData.get("client_id") ?? "").trim();

  if (!projectId || !filePath || !fileName) {
    return { status: "error", error: "Λείπουν στοιχεία του αρχείου." };
  }

  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("project_files").insert({
    project_id: projectId,
    uploaded_by: user?.id ?? null,
    file_name: fileName,
    file_path: filePath,
    file_type: fileType,
    file_size: Number.isFinite(fileSize) ? Math.round(fileSize) : 0,
    notes: notes || null,
    is_from_admin: true,
  });

  if (error) {
    console.error("project_files insert failed (admin):", error);
    // Admins hold delete rights on the bucket, so clean up the orphaned
    // upload rather than leaving a file with no matching DB row.
    await supabase.storage.from("project-files").remove([filePath]);
    return {
      status: "error",
      error: `Η καταχώρηση του αρχείου απέτυχε (database: ${error.message}).`,
    };
  }

  if (clientId) {
    revalidatePath(`/admin/clients/${clientId}`);
  }

  return { status: "success" };
}
