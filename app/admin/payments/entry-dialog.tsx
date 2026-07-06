"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Loader2, Plus } from "lucide-react";
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
  type FinanceFormState,
} from "./actions";

type EntryVariant = "income" | "expense";

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

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="animate-spin" />
          Καταχώρηση…
        </>
      ) : (
        "Καταχώρηση"
      )}
    </Button>
  );
}

function EntryForm({
  variant,
  onSuccess,
}: {
  variant: EntryVariant;
  onSuccess: () => void;
}) {
  const action =
    variant === "income" ? createIncomeEntry : createExpenseEntry;
  const [state, formAction] = useFormState(action, initialState);
  const copy = VARIANT_COPY[variant];

  useEffect(() => {
    if (state.status === "success") {
      toast.success(copy.successMessage);
      onSuccess();
    }
  }, [state.status, copy.successMessage, onSuccess]);

  return (
    <form action={formAction} className="space-y-4">
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
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${variant}_description`}>Περιγραφή *</Label>
        <Input
          id={`${variant}_description`}
          name="description"
          placeholder="Σύντομη περιγραφή"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${variant}_category`}>Κατηγορία</Label>
        <Input
          id={`${variant}_category`}
          name="category"
          placeholder={copy.categoryPlaceholder}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${variant}_entry_date`}>Ημερομηνία *</Label>
        <Input
          id={`${variant}_entry_date`}
          name="entry_date"
          type="date"
          defaultValue={localToday()}
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

      <SubmitButton />
    </form>
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
