"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Loader2, Pencil, Plus } from "lucide-react";
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
  createExpenseEntry,
  createIncomeEntry,
  updateExpenseEntry,
  updateIncomeEntry,
  type FinanceFormState,
} from "./actions";

type EntryVariant = "income" | "expense";

export interface EditableEntry {
  id: string;
  amount: number;
  description: string;
  category: string | null;
  entry_date: string;
}

const VARIANT_COPY: Record<
  EntryVariant,
  {
    title: string;
    description: string;
    categoryPlaceholder: string;
    successMessage: string;
  }
> = {
  income: {
    title: "Νέα Καταχώρηση Εσόδου",
    description: "Καταχωρήστε ένα έσοδο για την εσωτερική σας λογιστική.",
    categoryPlaceholder: "π.χ. Website, Chatbot, Consulting",
    successMessage: "Το έσοδο καταχωρήθηκε.",
  },
  expense: {
    title: "Νέα Καταχώρηση Εξόδου",
    description: "Καταχωρήστε ένα έξοδο για την εσωτερική σας λογιστική.",
    categoryPlaceholder: "π.χ. Φόρος, Προσωπικό, Λογισμικό, Λοιπά",
    successMessage: "Το έξοδο καταχωρήθηκε.",
  },
};

const initialState: FinanceFormState = { status: "idle" };

function localToday(): string {
  return new Date().toLocaleDateString("en-CA");
}

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  const label = isEdit ? "Αποθήκευση" : "Καταχώρηση";

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="animate-spin" />
          {label}…
        </>
      ) : (
        label
      )}
    </Button>
  );
}

function EntryForm({
  variant,
  entry,
  onSuccess,
}: {
  variant: EntryVariant;
  entry?: EditableEntry;
  onSuccess: () => void;
}) {
  const action = entry
    ? variant === "income"
      ? updateIncomeEntry
      : updateExpenseEntry
    : variant === "income"
      ? createIncomeEntry
      : createExpenseEntry;
  const [state, formAction] = useFormState(action, initialState);
  const copy = VARIANT_COPY[variant];
  const successMessage = entry
    ? "Η καταχώρηση ενημερώθηκε."
    : copy.successMessage;

  useEffect(() => {
    if (state.status === "success") {
      toast.success(successMessage);
      onSuccess();
    }
  }, [state.status, successMessage, onSuccess]);

  return (
    <form action={formAction} className="space-y-4">
      {entry && <input type="hidden" name="entry_id" value={entry.id} />}
      <div className="space-y-2">
        <Label htmlFor={`${variant}_amount`}>Ποσό (€) *</Label>
        <Input
          id={`${variant}_amount`}
          name="amount"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          placeholder="0,00"
          defaultValue={entry?.amount ?? undefined}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${variant}_description`}>Περιγραφή *</Label>
        <Input
          id={`${variant}_description`}
          name="description"
          placeholder="Σύντομη περιγραφή"
          defaultValue={entry?.description ?? undefined}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${variant}_category`}>Κατηγορία</Label>
        <Input
          id={`${variant}_category`}
          name="category"
          placeholder={copy.categoryPlaceholder}
          defaultValue={entry?.category ?? undefined}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${variant}_entry_date`}>Ημερομηνία *</Label>
        <Input
          id={`${variant}_entry_date`}
          name="entry_date"
          type="date"
          defaultValue={entry?.entry_date ?? localToday()}
          required
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

      <SubmitButton isEdit={Boolean(entry)} />
    </form>
  );
}

export function EditEntryDialog({
  variant,
  entry,
}: {
  variant: EntryVariant;
  entry: EditableEntry;
}) {
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
          <DialogTitle>Επεξεργασία Καταχώρησης</DialogTitle>
          <DialogDescription>
            Ενημερώστε τα στοιχεία της καταχώρησης.
          </DialogDescription>
        </DialogHeader>
        <EntryForm
          key={formKey}
          variant={variant}
          entry={entry}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

export function EntryDialog({ variant }: { variant: EntryVariant }) {
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const copy = VARIANT_COPY[variant];

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setFormKey((key) => key + 1);
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus />
          Νέα Καταχώρηση
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>
        <EntryForm
          key={formKey}
          variant={variant}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
