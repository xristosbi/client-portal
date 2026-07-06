"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface LoginState {
  error: string | null;
}

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Συμπληρώστε το email και τον κωδικό πρόσβασης." };
  }

  const supabase = createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (error.code === "invalid_credentials") {
      return { error: "Λάθος email ή κωδικός πρόσβασης." };
    }
    if (error.code === "email_not_confirmed") {
      return { error: "Το email σας δεν έχει επιβεβαιωθεί." };
    }
    return {
      error: "Η σύνδεση απέτυχε. Δοκιμάστε ξανά σε λίγο.",
    };
  }

  redirect("/");
}
