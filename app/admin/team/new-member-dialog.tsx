"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Loader2, UserPlus } from "lucide-react";
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
  createTeamMember,
  type CreateTeamMemberState,
} from "./actions";

const initialState: CreateTeamMemberState = { status: "idle" };

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="animate-spin" />
          Προσθήκη…
        </>
      ) : (
        "Προσθήκη Μέλους"
      )}
    </Button>
  );
}

function NewMemberForm({ onSuccess }: { onSuccess: () => void }) {
  const [state, formAction] = useFormState(createTeamMember, initialState);

  useEffect(() => {
    if (state.status === "success") {
      toast.success("Το μέλος προστέθηκε.");
      onSuccess();
    }
  }, [state.status, onSuccess]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="member_full_name">Όνομα *</Label>
        <Input
          id="member_full_name"
          name="full_name"
          placeholder="π.χ. Γιώργος Νικολάου"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="member_email">Email *</Label>
        <Input
          id="member_email"
          name="email"
          type="email"
          placeholder="member@example.com"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="member_position">Ρόλος / Θέση</Label>
        <Input
          id="member_position"
          name="position"
          placeholder="π.χ. Marketing, Developer"
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

export function NewMemberDialog() {
  const [open, setOpen] = useState(false);
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
          Νέο Μέλος
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Νέο Μέλος Ομάδας</DialogTitle>
          <DialogDescription>
            Προσθέστε ένα μέλος της ομάδας σας — καταχώρηση μόνο για
            ενημέρωση, χωρίς πρόσβαση στην πύλη.
          </DialogDescription>
        </DialogHeader>
        <NewMemberForm key={formKey} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
