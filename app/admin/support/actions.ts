"use server";

import { revalidatePath } from "next/cache";
import { isCurrentUserAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { FileFormState, TicketStatus } from "@/lib/types";

const STATUSES: TicketStatus[] = ["open", "in_progress", "resolved", "closed"];

const NO_PERMISSION = "Δεν έχετε δικαίωμα για αυτή την ενέργεια.";

export async function adminReplyToTicket(
  _prevState: FileFormState,
  formData: FormData
): Promise<FileFormState> {
  if (!(await isCurrentUserAdmin())) {
    return { status: "error", error: NO_PERMISSION };
  }

  const ticketId = String(formData.get("ticket_id") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!ticketId || !message) {
    return { status: "error", error: "Το μήνυμα δεν μπορεί να είναι κενό." };
  }

  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("ticket_messages").insert({
    ticket_id: ticketId,
    sender_id: user?.id ?? null,
    message,
  });

  if (error) {
    console.error("ticket reply failed (admin):", error);
    return {
      status: "error",
      error: "Η αποστολή του μηνύματος απέτυχε. Δοκιμάστε ξανά.",
    };
  }

  revalidatePath(`/admin/support/${ticketId}`);
  revalidatePath("/admin/support");

  return { status: "success" };
}

export async function updateTicketStatus(
  ticketId: string,
  status: string
): Promise<{ error?: string }> {
  if (!(await isCurrentUserAdmin())) {
    return { error: NO_PERMISSION };
  }

  if (!STATUSES.includes(status as TicketStatus)) {
    return { error: "Η κατάσταση δεν είναι έγκυρη." };
  }

  const supabase = createClient();

  const { error } = await supabase
    .from("support_tickets")
    .update({ status })
    .eq("id", ticketId);

  if (error) {
    console.error("ticket status update failed:", error);
    return { error: "Η αλλαγή κατάστασης απέτυχε. Δοκιμάστε ξανά." };
  }

  revalidatePath(`/admin/support/${ticketId}`);
  revalidatePath("/admin/support");

  return {};
}
