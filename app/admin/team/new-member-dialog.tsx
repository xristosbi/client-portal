"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Loader2, Pencil, UserPlus } from "lucide-react";
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
  updateTeamMember,
  type CreateTeamMemberState,
} from "./actions";

export interface EditableMember {
  id: string;
  full_name: string;
  email: string;
  position: string | null;
}

const initialState: CreateTeamMemberState = { status: "idle" };

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  const label = isEdit ? "Αποθήκευση" : "Προσθήκη Μέλους";

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="animate-spin" />
          {isEdit ? "Αποθήκευση…" : "Προσθήκη…"}
        </>
      ) : (
        label
      )}
    </Button>
  );
}

function MemberForm({
  member,
  onSuccess,
}: {
  member?: EditableMember;
  onSuccess: () => void;
}) {
  const action = member ? updateTeamMember : createTeamMember;
  const [state, formAction] = useFormState(action, initialState);
  const successMessage = member
    ? "Το μέλος ενημερώθηκε."
    : "Το μέλος προστέθηκε.";

  useEffect(() => {
    if (state.status === "success") {
      toast.success(successMessage);
      onSuccess();
    }
  }, [state.status, successMessage, onSuccess]);

  return (
    <form action={formAction} className="space-y-4">
      {member && <input type="hidden" name="member_id" value={member.id} />}
      <div className="space-y-2">
        <Label htmlFor="member_full_name">Όνομα *</Label>
        <Input
          id="member_full_name"
          name="full_name"
          placeholder="π.χ. Γιώργος Νικολάου"
          defaultValue={member?.full_name ?? undefined}
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
          defaultValue={member?.email ?? undefined}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="member_position">Ρόλος / Θέση</Label>
        <Input
          id="member_position"
          name="position"
          placeholder="π.χ. Marketing, Developer"
          defaultValue={member?.position ?? undefined}
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

      <SubmitButton isEdit={Boolean(member)} />
    </form>
  );
}

export function EditMemberDialog({ member }: { member: EditableMember }) {
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
        <Button variant="ghost" size="icon" aria-label="Επεξεργασία">
          <Pencil />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Επεξεργασία Μέλους</DialogTitle>
          <DialogDescription>{member.full_name}</DialogDescription>
        </DialogHeader>
        <MemberForm
          key={formKey}
          member={member}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
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
        <MemberForm key={formKey} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
