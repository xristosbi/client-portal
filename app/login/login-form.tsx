"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Loader2, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export function LoginForm() {
  const [state, formAction] = useFormState(login, initialState);

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
