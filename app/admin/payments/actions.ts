"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { isCurrentUserAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export interface FinanceFormState {
  status: "idle" | "error" | "success";
  error?: string;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_PDF_BYTES = 10 * 1024 * 1024;

interface EntryFields {
  amount: number;
  description: string;
  category: string | null;
  entryDate: string;
}

function parseEntryFields(
  formData: FormData
): { fields: EntryFields } | { error: string } {
  const rawAmount = String(formData.get("amount") ?? "")
    .trim()
    .replace(",", ".");
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const entryDate = String(formData.get("entry_date") ?? "").trim();

  const amount = Number(rawAmount);

  if (!rawAmount || !Number.isFinite(amount) || amount < 0) {
    return { error: "Το ποσό δεν είναι έγκυρο." };
  }
  if (!description) {
    return { error: "Η περιγραφή είναι υποχρεωτική." };
  }
  if (!DATE_RE.test(entryDate)) {
    return { error: "Η ημερομηνία δεν είναι έγκυρη." };
  }

  return {
    fields: {
      amount: Math.round(amount * 100) / 100,
      description,
      category: category || null,
      entryDate,
    },
  };
}

async function insertEntry(
  table: "income_entries" | "expense_entries",
  formData: FormData
): Promise<FinanceFormState> {
  if (!(await isCurrentUserAdmin())) {
    return {
      status: "error",
      error: "Δεν έχετε δικαίωμα για αυτή την ενέργεια.",
    };
  }

  const parsed = parseEntryFields(formData);
  if ("error" in parsed) {
    return { status: "error", error: parsed.error };
  }

  const supabase = createClient();

  const { error } = await supabase.from(table).insert({
    amount: parsed.fields.amount,
    description: parsed.fields.description,
    category: parsed.fields.category,
    entry_date: parsed.fields.entryDate,
  });

  if (error) {
    console.error(`${table} insert failed:`, error);
    return {
      status: "error",
      error: "Η καταχώρηση απέτυχε. Δοκιμάστε ξανά.",
    };
  }

  revalidatePath("/admin/payments");
  revalidatePath("/admin");

  return { status: "success" };
}

export async function createIncomeEntry(
  _prevState: FinanceFormState,
  formData: FormData
): Promise<FinanceFormState> {
  return insertEntry("income_entries", formData);
}

export async function createExpenseEntry(
  _prevState: FinanceFormState,
  formData: FormData
): Promise<FinanceFormState> {
  return insertEntry("expense_entries", formData);
}

export async function createClientInvoice(
  _prevState: FinanceFormState,
  formData: FormData
): Promise<FinanceFormState> {
  if (!(await isCurrentUserAdmin())) {
    return {
      status: "error",
      error: "Δεν έχετε δικαίωμα για αυτή την ενέργεια.",
    };
  }

  const clientId = String(formData.get("client_id") ?? "").trim();
  const parsed = parseEntryFields(formData);
  const file = formData.get("file");

  if (!clientId) {
    return { status: "error", error: "Επιλέξτε πελάτη." };
  }
  if ("error" in parsed) {
    return { status: "error", error: parsed.error };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { status: "error", error: "Επιλέξτε το αρχείο PDF του τιμολογίου." };
  }
  if (file.size > MAX_PDF_BYTES) {
    return {
      status: "error",
      error: "Το αρχείο ξεπερνά το όριο των 10MB.",
    };
  }
  const isPdf =
    file.type === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) {
    return { status: "error", error: "Επιτρέπονται μόνο αρχεία PDF." };
  }

  const supabase = createClient();

  const { data: client } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", clientId)
    .eq("role", "client")
    .single();

  if (!client) {
    return { status: "error", error: "Ο πελάτης δε βρέθηκε." };
  }

  const filePath = `${clientId}/${randomUUID()}.pdf`;

  const { error: uploadError } = await supabase.storage
    .from("client-invoices")
    .upload(filePath, file, { contentType: "application/pdf" });

  if (uploadError) {
    console.error("invoice upload failed:", uploadError);
    return {
      status: "error",
      error: "Η μεταφόρτωση του αρχείου απέτυχε. Δοκιμάστε ξανά.",
    };
  }

  const { error: insertError } = await supabase.from("client_invoices").insert({
    client_id: clientId,
    amount: parsed.fields.amount,
    description: parsed.fields.description,
    invoice_date: parsed.fields.entryDate,
    file_path: filePath,
  });

  if (insertError) {
    console.error("invoice insert failed:", insertError);
    // Don't leave an orphaned PDF behind.
    await supabase.storage.from("client-invoices").remove([filePath]);
    return {
      status: "error",
      error: "Η καταχώρηση του τιμολογίου απέτυχε. Δοκιμάστε ξανά.",
    };
  }

  revalidatePath("/admin/payments");

  return { status: "success" };
}
