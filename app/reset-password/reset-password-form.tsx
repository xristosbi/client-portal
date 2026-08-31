"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ChangePasswordForm } from "@/components/shared/change-password-form";
import { createClient } from "@/lib/supabase/client";

type Status = "checking" | "ready" | "invalid";

export function ResetPasswordForm() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    // The recovery session arrives either as a cookie (set by
    // /auth/callback exchanging the PKCE code) or from the URL fragment,
    // which supabase-js parses asynchronously on the client.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!cancelled && session) setStatus("ready");
    });

    async function check() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (cancelled) return;

      if (session) {
        setStatus("ready");
        return;
      }

      // Give the fragment-based flow a moment before giving up.
      setTimeout(async () => {
        const { data } = await supabase.auth.getSession();
        if (!cancelled) setStatus(data.session ? "ready" : "invalid");
      }, 1500);
    }

    void check();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  if (status === "checking") {
    return (
      <div className="flex items-center justify-center gap-2 py-6 text-sm text-zinc-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        Έλεγχος συνδέσμου…
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div className="space-y-4">
        <p className="rounded-md border border-red-900/60 bg-red-950/50 px-3 py-3 text-sm text-red-300">
          Ο σύνδεσμος επαναφοράς δεν είναι έγκυρος ή έχει λήξει. Ζητήστε νέο
          σύνδεσμο από τη σελίδα σύνδεσης.
        </p>
        <Link
          href="/login"
          className="block text-center text-sm text-gold hover:underline"
        >
          Επιστροφή στη σύνδεση
        </Link>
      </div>
    );
  }

  return (
    <ChangePasswordForm
      idPrefix="reset"
      dark
      submitLabel="Ορισμός Κωδικού"
      successMessage="Ο κωδικός σου ενημερώθηκε."
      onSuccess={() => {
        // The recovery session is a real session, so send them straight in;
        // "/" routes to /admin or /portal by role.
        router.push("/");
        router.refresh();
      }}
    />
  );
}
