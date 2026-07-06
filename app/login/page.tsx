import type { Metadata } from "next";
import { Crown } from "lucide-react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Σύνδεση",
};

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-950 px-4">
      {/* Decorative background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,164,44,0.12),transparent_55%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(9,9,11,0.9))]"
      />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-gold/30 bg-gold/10">
            <Crown className="h-7 w-7 text-gold" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
            Imperial Automations
          </h1>
          <p className="mt-1 text-sm text-zinc-400">Πύλη Πελατών</p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6 shadow-2xl backdrop-blur sm:p-8">
          <h2 className="mb-1 text-lg font-medium text-zinc-100">
            Σύνδεση στον λογαριασμό σας
          </h2>
          <p className="mb-6 text-sm text-zinc-400">
            Εισάγετε τα στοιχεία πρόσβασης που σας έχουμε δώσει.
          </p>
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-xs text-zinc-500">
          Χρειάζεστε βοήθεια με τη σύνδεση;{" "}
          <a
            href="mailto:support@imperialautomations.gr"
            className="text-gold hover:underline"
          >
            Επικοινωνήστε μαζί μας
          </a>
        </p>
      </div>
    </main>
  );
}
