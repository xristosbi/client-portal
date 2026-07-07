"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Loader2, Pencil } from "lucide-react";
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
import type { Profile } from "@/lib/types";
import {
  updateClientSubscription,
  type UpdateSubscriptionState,
} from "./actions";
import { SubscriptionFields } from "./subscription-fields";

const initialState: UpdateSubscriptionState = { status: "idle" };

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
        "Αποθήκευση"
      )}
    </Button>
  );
}

function EditClientForm({
  client,
  onSuccess,
}: {
  client: Profile;
  onSuccess: () => void;
}) {
  const [state, formAction] = useFormState(
    updateClientSubscription,
    initialState
  );

  useEffect(() => {
    if (state.status === "success") {
      toast.success("Η συνδρομή ενημερώθηκε.");
      onSuccess();
    }
  }, [state.status, onSuccess]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="client_id" value={client.id} />

      <SubscriptionFields
        idPrefix={`edit_${client.id}`}
        defaultChecked={client.has_subscription}
        defaultAmount={client.subscription_amount}
        defaultStatus={client.subscription_status}
        defaultMethod={client.payment_method}
        defaultBillingDay={client.subscription_billing_day}
        showStatus
      />

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

export function EditClientDialog({ client }: { client: Profile }) {
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
        <Button variant="ghost" size="sm">
          <Pencil />
          Επεξεργασία
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Επεξεργασία Συνδρομής</DialogTitle>
          <DialogDescription>
            {client.full_name || client.email}
            {client.company_name ? ` — ${client.company_name}` : ""}
          </DialogDescription>
        </DialogHeader>
        <EditClientForm
          key={formKey}
          client={client}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
