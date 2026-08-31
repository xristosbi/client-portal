"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { ArrowLeft, Loader2, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { login, type LoginState } from "./actions";

const initialState: LoginState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      className="w-full bg-gold text-gold-foreground hover:bg-gold/90"
      size="lg"
      disabled={pending}
    >
      {pending ? (
        <>
          <Loader2 className="animate-spin" />
          Σύνδεση…
        </>
      ) : (
        <>
          <LockKeyhole />
          Σύνδεση
        </>
      )}
    </Button>
  );
}

function ForgotPasswordForm({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ||
      window.location.origin;

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
    });

    if (error) {
      // Logged only — the confirmation below stays identical either way so
      // the form never reveals whether an account exists.
      console.error("password reset request failed:", error);
    }

    setPending(false);
    setSent(true);
  }

  if (sent) {
    return (
      <div className="space-y-4">
        <p className="rounded-md border border-zinc-800 bg-zinc-900/60 px-3 py-3 text-sm text-zinc-300">
          Αν υπάρχει λογαριασμός με αυτό το email, θα λάβεις σύνδεσμο
          επαναφοράς.
        </p>
        <Button
          type="button"
          variant="ghost"
          className="w-full text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100"
          onClick={onBack}
        >
          <ArrowLeft />
          Επιστροφή στη σύνδεση
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-zinc-400">
        Δώστε το email σας και θα σας στείλουμε σύνδεσμο για να ορίσετε νέο
        κωδικό.
      </p>
      <div className="space-y-2">
        <Label htmlFor="reset_email" className="text-zinc-200">
          Email
        </Label>
        <Input
          id="reset_email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          className="border-zinc-700 bg-zinc-900/60 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-gold"
        />
      </div>

      <Button
        type="submit"
        className="w-full bg-gold text-gold-foreground hover:bg-gold/90"
        size="lg"
        disabled={pending}
      >
        {pending ? (
          <>
            <Loader2 className="animate-spin" />
            Αποστολή…
          </>
        ) : (
          "Αποστολή Συνδέσμου"
        )}
      </Button>

      <Button
        type="button"
        variant="ghost"
        className="w-full text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100"
        onClick={onBack}
      >
        <ArrowLeft />
        Επιστροφή στη σύνδεση
      </Button>
    </form>
  );
}

export function LoginForm() {
  const [state, formAction] = useFormState(login, initialState);
  const [mode, setMode] = useState<"login" | "forgot">("login");

  if (mode === "forgot") {
    return <ForgotPasswordForm onBack={() => setMode("login")} />;
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-zinc-200">
          Email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          className="border-zinc-700 bg-zinc-900/60 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-gold"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className="text-zinc-200">
          Κωδικός πρόσβασης
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          required
          className="border-zinc-700 bg-zinc-900/60 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-gold"
        />
        <button
          type="button"
          onClick={() => setMode("forgot")}
          className="text-xs text-zinc-400 underline-offset-4 hover:text-gold hover:underline"
        >
          Ξέχασα τον κωδικό μου
        </button>
      </div>

      {state.error && (
        <p
          role="alert"
          className="rounded-md border border-red-900/60 bg-red-950/50 px-3 py-2 text-sm text-red-300"
        >
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
