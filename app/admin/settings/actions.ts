"use server";

import { revalidatePath } from "next/cache";
import { isCurrentUserAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export interface SettingsFormState {
  status: "idle" | "error" | "success";
  error?: string;
}

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export async function updateAppSettings(
  _prevState: SettingsFormState,
  formData: FormData
): Promise<SettingsFormState> {
  if (!(await isCurrentUserAdmin())) {
    return {
      status: "error",
      error: "Δεν έχετε δικαίωμα για αυτή την ενέργεια.",
    };
  }

  const videoUrl = String(formData.get("welcome_video_url") ?? "").trim();
  const message = String(formData.get("welcome_message") ?? "").trim();

  if (videoUrl && !isValidUrl(videoUrl)) {
    return { status: "error", error: "Το URL του βίντεο δεν είναι έγκυρο." };
  }

  const supabase = createClient();

  const { error } = await supabase
    .from("app_settings")
    .upsert({
      id: 1,
      welcome_video_url: videoUrl || null,
      welcome_message: message || null,
    });

  if (error) {
    console.error("app_settings upsert failed:", error);
    return {
      status: "error",
      error: "Η αποθήκευση απέτυχε. Δοκιμάστε ξανά.",
    };
  }

  revalidatePath("/admin/settings");
  revalidatePath("/portal");

  return { status: "success" };
}
