"use server";

import { revalidatePath } from "next/cache";
import { isCurrentUserAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { MilestoneStatus, ProjectStatus } from "@/lib/types";

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
