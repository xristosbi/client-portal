"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function markNotificationRead(
  notificationId: string
): Promise<{ error?: string }> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Δεν είστε συνδεδεμένοι." };
  }

  const { error } = await supabase.from("notification_reads").upsert(
    {
      notification_id: notificationId,
      client_id: user.id,
      read_at: new Date().toISOString(),
    },
    { onConflict: "notification_id,client_id" }
  );

  if (error) {
    console.error("notification read upsert failed:", error);
    return { error: "Κάτι πήγε στραβά. Δοκιμάστε ξανά." };
  }

  revalidatePath("/portal/notifications");
  revalidatePath("/portal");

  return {};
}
