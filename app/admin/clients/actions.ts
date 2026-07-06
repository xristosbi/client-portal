"use server";

import { randomInt } from "crypto";
import { revalidatePath } from "next/cache";
import { isCurrentUserAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export interface CreateClientState {
  status: "idle" | "error" | "success";
  error?: string;
  email?: string;
  tempPassword?: string;
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
  });

  if (profileError) {
    console.error("profile upsert failed:", profileError);
  }

  revalidatePath("/admin/clients");
  revalidatePath("/admin");

  return { status: "success", email, tempPassword };
}
