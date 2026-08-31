"use server";

import { randomInt } from "crypto";
import { revalidatePath } from "next/cache";
import { isCurrentUserAdmin } from "@/lib/auth";
import { sendWelcomeEmail } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { PaymentMethod, SubscriptionStatus } from "@/lib/types";

export interface CreateClientState {
  status: "idle" | "error" | "success";
  error?: string;
  email?: string;
  tempPassword?: string;
  fullName?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Ambiguous characters (0/O, 1/l/I) are excluded so the password can be
// read out or retyped without mistakes.
const LOWER = "abcdefghijkmnopqrstuvwxyz";
const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const DIGITS = "23456789";
const SYMBOLS = "!@#$%&*+-=?";

function pick(charset: string) {
  return charset[randomInt(charset.length)];
}

function generateTempPassword(length = 14): string {
  const all = LOWER + UPPER + DIGITS + SYMBOLS;
  const chars = [pick(LOWER), pick(UPPER), pick(DIGITS), pick(SYMBOLS)];
  while (chars.length < length) {
    chars.push(pick(all));
  }
  // Fisher–Yates shuffle with crypto randomness.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

interface SubscriptionFields {
  has_subscription: boolean;
  subscription_amount: number | null;
  subscription_status: SubscriptionStatus;
  payment_method: PaymentMethod | null;
  subscription_billing_day: number | null;
}

const SUBSCRIPTION_STATUSES: SubscriptionStatus[] = [
  "active",
  "paused",
  "cancelled",
];
const PAYMENT_METHODS: PaymentMethod[] = ["stripe_auto", "cash_manual"];

function parseSubscriptionFields(
  formData: FormData
): { fields: SubscriptionFields } | { error: string } {
  const hasSubscription = formData.get("has_subscription") === "on";

  if (!hasSubscription) {
    return {
      fields: {
        has_subscription: false,
        subscription_amount: null,
        subscription_status: "active",
        payment_method: null,
        subscription_billing_day: null,
      },
    };
  }

  const rawAmount = String(formData.get("subscription_amount") ?? "")
    .trim()
    .replace(",", ".");
  const amount = Number(rawAmount);

  if (!rawAmount || !Number.isFinite(amount) || amount <= 0) {
    return { error: "Το ποσό συνδρομής δεν είναι έγκυρο." };
  }

  const method = String(formData.get("payment_method") ?? "");
  if (!PAYMENT_METHODS.includes(method as PaymentMethod)) {
    return { error: "Επιλέξτε τρόπο πληρωμής." };
  }

  const rawStatus = String(formData.get("subscription_status") ?? "active");
  if (!SUBSCRIPTION_STATUSES.includes(rawStatus as SubscriptionStatus)) {
    return { error: "Η κατάσταση συνδρομής δεν είναι έγκυρη." };
  }

  const rawBillingDay = String(
    formData.get("subscription_billing_day") ?? ""
  ).trim();
  let billingDay: number | null = null;
  if (rawBillingDay) {
    const parsedDay = Number(rawBillingDay);
    if (
      !Number.isInteger(parsedDay) ||
      parsedDay < 1 ||
      parsedDay > 31
    ) {
      return { error: "Η ημέρα χρέωσης πρέπει να είναι από 1 έως 31." };
    }
    billingDay = parsedDay;
  }

  return {
    fields: {
      has_subscription: true,
      subscription_amount: Math.round(amount * 100) / 100,
      subscription_status: rawStatus as SubscriptionStatus,
      payment_method: method as PaymentMethod,
      subscription_billing_day: billingDay,
    },
  };
}

export async function createClientAccount(
  _prevState: CreateClientState,
  formData: FormData
): Promise<CreateClientState> {
  if (!(await isCurrentUserAdmin())) {
    return { status: "error", error: "Δεν έχετε δικαίωμα για αυτή την ενέργεια." };
  }

  const fullName = String(formData.get("full_name") ?? "").trim();
  const companyName = String(formData.get("company_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();

  if (!fullName || !email) {
    return {
      status: "error",
      error: "Το όνομα και το email είναι υποχρεωτικά.",
    };
  }

  if (!EMAIL_RE.test(email)) {
    return { status: "error", error: "Το email δεν είναι έγκυρο." };
  }

  const parsedSubscription = parseSubscriptionFields(formData);
  if ("error" in parsedSubscription) {
    return { status: "error", error: parsedSubscription.error };
  }

  const admin = createAdminClient();
  const tempPassword = generateTempPassword();

  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        company_name: companyName,
        phone,
        role: "client",
      },
    });

  if (createError || !created.user) {
    if (
      createError?.code === "email_exists" ||
      createError?.message?.includes("already been registered")
    ) {
      return {
        status: "error",
        error: "Υπάρχει ήδη λογαριασμός με αυτό το email.",
      };
    }
    console.error("createUser failed:", createError);
    return {
      status: "error",
      error: "Η δημιουργία του λογαριασμού απέτυχε. Δοκιμάστε ξανά.",
    };
  }

  // The auth trigger creates the profile from the metadata; upsert here as
  // well so the row is correct even if the trigger definition drifts.
  const { error: profileError } = await admin.from("profiles").upsert({
    id: created.user.id,
    email,
    full_name: fullName,
    company_name: companyName || null,
    phone: phone || null,
    role: "client",
    ...parsedSubscription.fields,
  });

  if (profileError) {
    console.error("profile upsert failed:", profileError);
  }

  revalidatePath("/admin/clients");
  revalidatePath("/admin");

  return { status: "success", email, tempPassword, fullName };
}

export async function sendWelcomeEmailAction(input: {
  fullName: string;
  email: string;
  tempPassword: string;
}): Promise<{ error?: string }> {
  if (!(await isCurrentUserAdmin())) {
    return { error: "Δεν έχετε δικαίωμα για αυτή την ενέργεια." };
  }

  const email = input.email.trim().toLowerCase();
  const tempPassword = input.tempPassword;

  if (!EMAIL_RE.test(email) || !tempPassword) {
    return { error: "Τα στοιχεία του email δεν είναι έγκυρα." };
  }

  const { error } = await sendWelcomeEmail({
    fullName: input.fullName.trim(),
    email,
    tempPassword,
  });

  if (error) {
    return {
      error: `Η αποστολή του email απέτυχε (${error}).`,
    };
  }

  return {};
}

export interface UpdateSubscriptionState {
  status: "idle" | "error" | "success";
  error?: string;
}

export async function updateClientSubscription(
  _prevState: UpdateSubscriptionState,
  formData: FormData
): Promise<UpdateSubscriptionState> {
  if (!(await isCurrentUserAdmin())) {
    return {
      status: "error",
      error: "Δεν έχετε δικαίωμα για αυτή την ενέργεια.",
    };
  }

  const clientId = String(formData.get("client_id") ?? "").trim();
  if (!clientId) {
    return { status: "error", error: "Ο πελάτης δε βρέθηκε." };
  }

  const parsed = parseSubscriptionFields(formData);
  if ("error" in parsed) {
    return { status: "error", error: parsed.error };
  }

  // RLS: only admins may update profiles, so the session client suffices.
  const supabase = createClient();

  const { error } = await supabase
    .from("profiles")
    .update(parsed.fields)
    .eq("id", clientId)
    .eq("role", "client");

  if (error) {
    console.error("subscription update failed:", error);
    return {
      status: "error",
      error: "Η ενημέρωση της συνδρομής απέτυχε. Δοκιμάστε ξανά.",
    };
  }

  revalidatePath("/admin/clients");
  revalidatePath("/admin");

  return { status: "success" };
}

export async function deleteClientAccount(
  clientId: string
): Promise<{ error?: string }> {
  if (!(await isCurrentUserAdmin())) {
    return { error: "Δεν έχετε δικαίωμα για αυτή την ενέργεια." };
  }

  const admin = createAdminClient();

  // Collect storage paths BEFORE the cascade removes the rows that name
  // them — the database cascade deletes rows, never bucket objects.
  const { data: projects } = await admin
    .from("projects")
    .select("id")
    .eq("client_id", clientId);
  const projectIds = (projects ?? []).map((project) => project.id);

  const [{ data: invoices }, { data: agreements }, { data: projectFiles }] =
    await Promise.all([
      admin
        .from("client_invoices")
        .select("file_path")
        .eq("client_id", clientId),
      admin.from("agreements").select("file_path").eq("client_id", clientId),
      projectIds.length > 0
        ? admin
            .from("project_files")
            .select("file_path")
            .in("project_id", projectIds)
        : Promise.resolve({ data: [] as { file_path: string }[] }),
    ]);

  const invoicePaths = (invoices ?? [])
    .map((row) => row.file_path)
    .filter(Boolean);
  const agreementPaths = (agreements ?? [])
    .map((row) => row.file_path)
    .filter((path): path is string => Boolean(path));
  const projectFilePaths = (projectFiles ?? [])
    .map((row) => row.file_path)
    .filter(Boolean);

  // Delete the auth user first: it cascades every owned row, so the
  // database stays consistent even if bucket cleanup below fails.
  const { error } = await admin.auth.admin.deleteUser(clientId);

  if (error) {
    console.error("client delete failed:", error);
    return {
      error: `Η διαγραφή του πελάτη απέτυχε (${error.message}).`,
    };
  }

  // Best-effort bucket cleanup — failures leave orphaned files, which is
  // preferable to leaving rows that point at deleted files.
  const cleanups: { bucket: string; paths: string[] }[] = [
    { bucket: "client-invoices", paths: invoicePaths },
    { bucket: "agreements", paths: agreementPaths },
    { bucket: "project-files", paths: projectFilePaths },
  ];

  for (const { bucket, paths } of cleanups) {
    if (paths.length === 0) continue;
    const { error: removeError } = await admin.storage
      .from(bucket)
      .remove(paths);
    if (removeError) {
      console.error(`storage cleanup failed for ${bucket}:`, removeError);
    }
  }

  revalidatePath("/admin/clients");
  revalidatePath("/admin");

  return {};
}
