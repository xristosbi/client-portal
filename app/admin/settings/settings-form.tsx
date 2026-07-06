"use client";

import { useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AppSettings } from "@/lib/types";
import { updateAppSettings, type SettingsFormState } from "./actions";

const initialState: SettingsFormState = { status: "idle" };

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="animate-spin" />
          Αποθήκευση…
        </>
      ) : (
        "Αποθήκευση"
      )}
    </Button>
  );
}

export function SettingsForm({ settings }: { settings: AppSettings | null }) {
  const [state, formAction] = useFormState(updateAppSettings, initialState);

  useEffect(() => {
    if (state.status === "success") {
      toast.success("Οι ρυθμίσεις αποθηκεύτηκαν.");
    }
  }, [state.status]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="welcome_video_url">Welcome Video URL</Label>
        <Input
          id="welcome_video_url"
          name="welcome_video_url"
          placeholder="https://youtube.com/watch?v=... ή https://vimeo.com/..."
          defaultValue={settings?.welcome_video_url ?? undefined}
        />
        <p className="text-xs text-muted-foreground">
          YouTube, Vimeo, Loom ή απευθείας σύνδεσμος αρχείου βίντεο (mp4).
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="welcome_message">Μήνυμα Καλωσορίσματος</Label>
        <Textarea
          id="welcome_message"
          name="welcome_message"
          rows={4}
          placeholder="Ένα σύντομο μήνυμα που θα βλέπουν όλοι οι πελάτες στην αρχική τους σελίδα."
          defaultValue={settings?.welcome_message ?? undefined}
        />
      </div>

      {state.status === "error" && state.error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
