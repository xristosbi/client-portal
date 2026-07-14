"use client";

import { useState, useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  Check,
  Copy,
  Loader2,
  Mail,
  ShieldAlert,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createClientAccount,
  sendWelcomeEmailAction,
  type CreateClientState,
} from "./actions";
import { SubscriptionFields } from "./subscription-fields";

const initialState: CreateClientState = { status: "idle" };

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="animate-spin" />
          Δημιουργία…
        </>
      ) : (
        "Δημιουργία Πελάτη"
      )}
    </Button>
  );
}

function SendWelcomeEmailButton({
  fullName,
  email,
  tempPassword,
}: {
  fullName: string;
  email: string;
  tempPassword: string;
}) {
  const [sending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);

  function handleSend() {
    startTransition(async () => {
      const result = await sendWelcomeEmailAction({
        fullName,
        email,
        tempPassword,
      });
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Το email καλωσορίσματος στάλθηκε.");
        setSent(true);
      }
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={handleSend}
      disabled={sending || sent}
    >
      {sending ? (
        <>
          <Loader2 className="animate-spin" />
          Αποστολή…
        </>
      ) : sent ? (
        <>
          <Check />
          Το email στάλθηκε
        </>
      ) : (
        <>
          <Mail />
          Αποστολή Welcome Email
        </>
      )}
    </Button>
  );
}

function NewClientForm() {
  const [state, formAction] = useFormState(createClientAccount, initialState);

  if (state.status === "success" && state.tempPassword) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-gold/40 bg-gold/5 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <ShieldAlert className="h-4 w-4 text-gold" />
            Προσωρινός κωδικός πρόσβασης
          </div>
          <p className="mb-3 text-xs text-muted-foreground">
            Αντέγραψε αυτόν τον κωδικό — <strong>δε θα ξαναφανεί</strong>.
            Στείλε τον στον πελάτη μαζί με το email σύνδεσης.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-md border bg-background px-3 py-2 font-mono text-sm tracking-wide">
              {state.tempPassword}
            </code>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Αντιγραφή κωδικού"
              onClick={() => {
                navigator.clipboard.writeText(state.tempPassword!);
                toast.success("Ο κωδικός αντιγράφηκε.");
              }}
            >
              <Copy />
            </Button>
          </div>
        </div>
        <div className="rounded-md bg-muted px-3 py-2 text-sm">
          <span className="text-muted-foreground">Email σύνδεσης: </span>
          <span className="font-medium">{state.email}</span>
        </div>
        <SendWelcomeEmailButton
          fullName={state.fullName ?? ""}
          email={state.email!}
          tempPassword={state.tempPassword}
        />
        <p className="text-center text-xs text-muted-foreground">
          Στέλνει στον πελάτη τα στοιχεία σύνδεσης με τον προσωρινό κωδικό.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="full_name">Όνομα *</Label>
        <Input
          id="full_name"
          name="full_name"
          placeholder="π.χ. Μαρία Παπαδοπούλου"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="company_name">Εταιρία</Label>
        <Input
          id="company_name"
          name="company_name"
          placeholder="π.χ. Derma Clinic Αθήνα"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="client@example.com"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Τηλέφωνο</Label>
        <Input id="phone" name="phone" placeholder="+30 69..." />
      </div>

      <SubscriptionFields idPrefix="new_client" />

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

export function NewClientDialog() {
  const [open, setOpen] = useState(false);
  // Re-mounting the form on every open resets useFormState, so a previous
  // temporary password is never shown again.
  const [formKey, setFormKey] = useState(0);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setFormKey((key) => key + 1);
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <UserPlus />
          Νέος Πελάτης
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Νέος Πελάτης</DialogTitle>
          <DialogDescription>
            Δημιουργήστε λογαριασμό πελάτη. Θα δημιουργηθεί αυτόματα ένας
            προσωρινός κωδικός πρόσβασης.
          </DialogDescription>
        </DialogHeader>
        <NewClientForm key={formKey} />
      </DialogContent>
    </Dialog>
  );
}
