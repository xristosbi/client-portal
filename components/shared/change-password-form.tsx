"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

const MIN_LENGTH = 8;

interface ChangePasswordFormProps {
  /** Distinguishes field ids when several forms share a page. */
  idPrefix?: string;
  submitLabel?: string;
  successMessage?: string;
  /** Runs after a successful update (e.g. to redirect). */
  onSuccess?: () => void;
  /** Dark styling for the reset page, which sits outside the portal shell. */
  dark?: boolean;
}

export function ChangePasswordForm({
  idPrefix = "pw",
  submitLabel = "Αλλαγή Κωδικού",
  successMessage = "Ο κωδικός σου ενημερώθηκε.",
  onSuccess,
  dark = false,
}: ChangePasswordFormProps) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < MIN_LENGTH) {
      setError(
        `Ο κωδικός πρέπει να έχει τουλάχιστον ${MIN_LENGTH} χαρακτήρες.`
      );
      return;
    }
    if (password !== confirmation) {
      setError("Οι κωδικοί δεν ταιριάζουν.");
      return;
    }

    setPending(true);
    // The user is already authenticated (normal session or a recovery
    // session), so Supabase doesn't need the old password.
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });
    setPending(false);

    if (updateError) {
      console.error("password update failed:", updateError);
      if (updateError.code === "same_password") {
        setError("Ο νέος κωδικός πρέπει να διαφέρει από τον προηγούμενο.");
      } else if (updateError.code === "session_not_found") {
        setError(
          "Η συνεδρία έληξε. Συνδεθείτε ξανά και δοκιμάστε άλλη μια φορά."
        );
      } else {
        setError(`Η αλλαγή του κωδικού απέτυχε (${updateError.message}).`);
      }
      return;
    }

    toast.success(successMessage);
    setPassword("");
    setConfirmation("");
    onSuccess?.();
  }

  const inputClass = dark
    ? "border-zinc-700 bg-zinc-900/60 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-gold"
    : undefined;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label
          htmlFor={`${idPrefix}_password`}
          className={dark ? "text-zinc-200" : undefined}
        >
          Νέος Κωδικός
        </Label>
        <Input
          id={`${idPrefix}_password`}
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={inputClass}
          required
        />
        <p
          className={
            dark ? "text-xs text-zinc-500" : "text-xs text-muted-foreground"
          }
        >
          Τουλάχιστον {MIN_LENGTH} χαρακτήρες.
        </p>
      </div>

      <div className="space-y-2">
        <Label
          htmlFor={`${idPrefix}_confirmation`}
          className={dark ? "text-zinc-200" : undefined}
        >
          Επιβεβαίωση Κωδικού
        </Label>
        <Input
          id={`${idPrefix}_confirmation`}
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          className={inputClass}
          required
        />
      </div>

      {error && (
        <p
          role="alert"
          className={
            dark
              ? "rounded-md border border-red-900/60 bg-red-950/50 px-3 py-2 text-sm text-red-300"
              : "rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          }
        >
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={pending}
        className={
          dark ? "w-full bg-gold text-gold-foreground hover:bg-gold/90" : undefined
        }
      >
        {pending ? (
          <>
            <Loader2 className="animate-spin" />
            Αποθήκευση…
          </>
        ) : (
          submitLabel
        )}
      </Button>
    </form>
  );
}
