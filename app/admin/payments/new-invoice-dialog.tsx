"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { FilePlus2, Loader2 } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClientInvoice, type FinanceFormState } from "./actions";

export interface ClientOption {
  id: string;
  label: string;
}

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
          Αποθήκευση…
        </>
      ) : (
        "Αποθήκευση Τιμολογίου"
      )}
    </Button>
  );
}

function NewInvoiceForm({
  clients,
  onSuccess,
}: {
  clients: ClientOption[];
  onSuccess: () => void;
}) {
  const [state, formAction] = useFormState(createClientInvoice, initialState);

  useEffect(() => {
    if (state.status === "success") {
      toast.success("Το τιμολόγιο αποθηκεύτηκε.");
      onSuccess();
    }
  }, [state.status, onSuccess]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label>Πελάτης *</Label>
        <Select name="client_id" required>
          <SelectTrigger aria-label="Επιλογή πελάτη">
            <SelectValue placeholder="Επιλέξτε πελάτη" />
          </SelectTrigger>
          <SelectContent>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="invoice_amount">Ποσό (€) *</Label>
        <Input
          id="invoice_amount"
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
        <Label htmlFor="invoice_description">Περιγραφή *</Label>
        <Input
          id="invoice_description"
          name="description"
          placeholder="π.χ. Κατασκευή ιστοσελίδας — 1η δόση"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="invoice_date">Ημερομηνία *</Label>
        <Input
          id="invoice_date"
          name="entry_date"
          type="date"
          defaultValue={localToday()}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="invoice_file">Αρχείο PDF *</Label>
        <Input
          id="invoice_file"
          name="file"
          type="file"
          accept="application/pdf,.pdf"
          required
        />
        <p className="text-xs text-muted-foreground">
          Το τιμολόγιο όπως εκδόθηκε στο myDATA, έως 10MB.
        </p>
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

export function NewInvoiceDialog({ clients }: { clients: ClientOption[] }) {
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
        <Button size="sm">
          <FilePlus2 />
          Νέο Τιμολόγιο
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Νέο Τιμολόγιο</DialogTitle>
          <DialogDescription>
            Αποθηκεύστε ένα τιμολόγιο που έχετε ήδη εκδώσει μέσω myDATA.
          </DialogDescription>
        </DialogHeader>
        {clients.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">
            Δεν υπάρχουν ακόμη πελάτες. Δημιουργήστε πρώτα έναν πελάτη από
            τη σελίδα «Πελάτες».
          </p>
        ) : (
          <NewInvoiceForm
            key={formKey}
            clients={clients}
            onSuccess={() => setOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
