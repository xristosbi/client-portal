"use server";

import { revalidatePath } from "next/cache";
import { isCurrentUserAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { NotificationType } from "@/lib/types";

const TYPES: NotificationType[] = ["info", "payment", "milestone", "support"];

const NO_PERMISSION = "Δεν έχετε δικαίωμα για αυτή την ενέργεια.";

export interface NotificationFormState {
  status: "idle" | "error" | "success";
  error?: string;
}

export async function createNotification(
  _prevState: NotificationFormState,
  formData: FormData
): Promise<NotificationFormState> {
  if (!(await isCurrentUserAdmin())) {
    return { status: "error", error: NO_PERMISSION };
  }

  const title = String(formData.get("title") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const rawType = String(formData.get("type") ?? "info");
  const recipient = String(formData.get("recipient") ?? "all");

  if (!title || !message) {
    return {
      status: "error",
      error: "Ο τίτλος και το μήνυμα είναι υποχρεωτικά.",
    };
  }

  const type = TYPES.includes(rawType as NotificationType)
    ? (rawType as NotificationType)
    : "info";

  const supabase = createClient();

  const { error } = await supabase.from("notifications").insert({
    client_id: recipient === "all" ? null : recipient,
    title,
    message,
    type,
  });

  if (error) {
    console.error("notification insert failed:", error);
    return {
      status: "error",
      error: "Η αποστολή της ειδοποίησης απέτυχε. Δοκιμάστε ξανά.",
    };
  }

  revalidatePath("/admin/notifications");

  return { status: "success" };
}

export async function deleteNotification(
  notificationId: string
): Promise<{ error?: string }> {
  if (!(await isCurrentUserAdmin())) {
    return { error: NO_PERMISSION };
  }

  const supabase = createClient();

  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", notificationId);

  if (error) {
    console.error("notification delete failed:", error);
    return { error: "Η διαγραφή απέτυχε. Δοκιμάστε ξανά." };
  }

  revalidatePath("/admin/notifications");

  return {};
}
