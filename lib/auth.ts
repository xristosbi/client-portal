import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

/**
 * Returns the authenticated user's profile or redirects to /login.
 */
export async function getProfileOrRedirect(): Promise<Profile> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    // The auth user exists but has no profile row — sign out defensively.
    redirect("/login");
  }

  return profile as Profile;
}

/** True when the current session belongs to an admin. */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return profile?.role === "admin";
}
