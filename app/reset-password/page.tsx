import type { Metadata } from "next";
import Image from "next/image";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = {
  title: "Νέος Κωδικός",
};

export default function ResetPasswordPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-950 px-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,164,44,0.07),transparent_55%)]"
      />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image
            src="/logo.png"
            alt="CB Automations"
            width={93}
            height={64}
            priority
            className="mb-4 h-16 w-auto"
          />
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
            CB Automations
          </h1>
          <p className="mt-1 text-sm text-zinc-400">Πύλη Πελατών</p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-6 shadow-2xl backdrop-blur sm:p-8">
          <h2 className="mb-1 text-lg font-medium text-zinc-100">
            Ορισμός νέου κωδικού
          </h2>
          <p className="mb-6 text-sm text-zinc-400">
            Επιλέξτε έναν νέο κωδικό πρόσβασης για τον λογαριασμό σας.
          </p>
          <ResetPasswordForm />
        </div>
      </div>
    </main>
  );
}
