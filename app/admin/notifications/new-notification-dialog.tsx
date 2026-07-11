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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  NOTIFICATION_TYPE_LABELS,
  type NotificationType,
} from "@/lib/types";
import {
  createNotification,
  type NotificationFormState,
} from "./actions";

export interface RecipientOption {
  id: string;
  label: string;
}

const initialState: NotificationFormState = { status: "idle" };

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="animate-spin" />
          Αποστολή…
        </>
      ) : (
        "Αποστολή Ειδοποίησης"
      )}
    </Button>
  );
}

function NewNotificationForm({
  clients,
  onSuccess,
}: {
  clients: RecipientOption[];
  onSuccess: () => void;
}) {
  const [state, formAction] = useFormState(createNotification, initialState);

  useEffect(() => {
    if (state.status === "success") {
      toast.success("Η ειδοποίηση στάλθηκε.");
      onSuccess();
    }
  }, [state.status, onSuccess]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="notification_title">Τίτλος *</Label>
        <Input
          id="notification_title"
          name="title"
          placeholder="π.χ. Νέα λειτουργία στην πύλη"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notification_message">Μήνυμα *</Label>
        <Textarea
          id="notification_message"
          name="message"
          rows={4}
          placeholder="Το περιεχόμενο της ειδοποίησης…"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Τύπος</Label>
          <Select name="type" defaultValue="info">
            <SelectTrigger aria-label="Επιλογή τύπου">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(
                Object.entries(NOTIFICATION_TYPE_LABELS) as [
                  NotificationType,
                  string,
                ][]
              ).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Παραλήπτης</Label>
          <Select name="recipient" defaultValue="all">
            <SelectTrigger aria-label="Επιλογή παραλήπτη">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Όλοι οι πελάτες</SelectItem>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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

export function NewNotificationDialog({
  clients,
}: {
  clients: RecipientOption[];
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
        <Button size="sm">
          <Plus />
          Νέα Ειδοποίηση
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Νέα Ειδοποίηση</DialogTitle>
          <DialogDescription>
            Στείλτε ειδοποίηση σε έναν πελάτη ή σε όλους.
          </DialogDescription>
        </DialogHeader>
        <NewNotificationForm
          key={formKey}
          clients={clients}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
