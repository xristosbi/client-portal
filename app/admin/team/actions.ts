"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface CreateTeamMemberState {
  status: "idle" | "error" | "success";
  error?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function createTeamMember(
  _prevState: CreateTeamMemberState,
  formData: FormData
): Promise<CreateTeamMemberState> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const position = String(formData.get("position") ?? "").trim();

  if (!fullName || !email) {
    return {
      status: "error",
      error: "Το όνομα και το email είναι υποχρεωτικά.",
    };
  }

  if (!EMAIL_RE.test(email)) {
    return { status: "error", error: "Το email δεν είναι έγκυρο." };
  }

  // RLS only allows admins to insert into team_members, so the regular
  // session client is enough here.
  const supabase = createClient();

  const { error } = await supabase.from("team_members").insert({
    full_name: fullName,
    email,
    position: position || null,
  });

  if (error) {
    console.error("team member insert failed:", error);
    return {
      status: "error",
      error: "Η προσθήκη του μέλους απέτυχε. Δοκιμάστε ξανά.",
    };
  }

  revalidatePath("/admin/team");

  return { status: "success" };
}
