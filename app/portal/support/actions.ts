"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { FileFormState, TicketPriority } from "@/lib/types";

const PRIORITIES: TicketPriority[] = ["low", "normal", "high"];

export interface CreateTicketState {
  status: "idle" | "error" | "success";
  error?: string;
  ticketId?: string;
}

export async function createTicket(
  _prevState: CreateTicketState,
  formData: FormData
): Promise<CreateTicketState> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", error: "Δεν είστε συνδεδεμένοι." };
  }

  const subject = String(formData.get("subject") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const rawPriority = String(formData.get("priority") ?? "normal");
  const projectId = String(formData.get("project_id") ?? "").trim();

  if (!subject || !message) {
    return {
      status: "error",
      error: "Το θέμα και το μήνυμα είναι υποχρεωτικά.",
    };
  }

  const priority = PRIORITIES.includes(rawPriority as TicketPriority)
    ? (rawPriority as TicketPriority)
    : "normal";

  const { data: ticket, error: ticketError } = await supabase
    .from("support_tickets")
    .insert({
      client_id: user.id,
      project_id: projectId || null,
      subject,
      priority,
    })
    .select("id")
    .single();

  if (ticketError || !ticket) {
    console.error("ticket insert failed:", ticketError);
    return {
      status: "error",
      error: "Η δημιουργία του αιτήματος απέτυχε. Δοκιμάστε ξανά.",
    };
  }

  const { error: messageError } = await supabase.from("ticket_messages").insert({
    ticket_id: ticket.id,
    sender_id: user.id,
    message,
  });

  if (messageError) {
    console.error("ticket first message insert failed:", messageError);
    return {
      status: "error",
      error:
        "Το αίτημα δημιουργήθηκε αλλά το μήνυμα δεν αποθηκεύτηκε — ανοίξτε το και στείλτε το ξανά.",
    };
  }

  revalidatePath("/portal/support");

  return { status: "success", ticketId: ticket.id };
}

export async function replyToTicket(
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

  const ticketId = String(formData.get("ticket_id") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!ticketId || !message) {
    return { status: "error", error: "Το μήνυμα δεν μπορεί να είναι κενό." };
  }

  // RLS only allows inserts on the client's own tickets.
  const { error } = await supabase.from("ticket_messages").insert({
    ticket_id: ticketId,
    sender_id: user.id,
    message,
  });

  if (error) {
    console.error("ticket reply failed (client):", error);
    return {
      status: "error",
      error: "Η αποστολή του μηνύματος απέτυχε. Δοκιμάστε ξανά.",
    };
  }

  revalidatePath(`/portal/support/${ticketId}`);
  revalidatePath("/portal/support");

  return { status: "success" };
}
