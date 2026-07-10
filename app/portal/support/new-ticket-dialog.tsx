"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
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
  TICKET_PRIORITY_LABELS,
  type TicketPriority,
} from "@/lib/types";
import { createTicket, type CreateTicketState } from "./actions";

const initialState: CreateTicketState = { status: "idle" };

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
        "Αποστολή Αιτήματος"
      )}
    </Button>
  );
}

function NewTicketForm({
  projectId,
  onSuccess,
}: {
  projectId: string | null;
  onSuccess: (ticketId?: string) => void;
}) {
  const [state, formAction] = useFormState(createTicket, initialState);

  useEffect(() => {
    if (state.status === "success") {
      toast.success("Το αίτημα δημιουργήθηκε.");
      onSuccess(state.ticketId);
    }
  }, [state, onSuccess]);

  return (
    <form action={formAction} className="space-y-4">
      {projectId && (
        <input type="hidden" name="project_id" value={projectId} />
      )}

      <div className="space-y-2">
        <Label htmlFor="ticket_subject">Θέμα *</Label>
        <Input
          id="ticket_subject"
          name="subject"
          placeholder="π.χ. Πρόβλημα με το chatbot"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ticket_message">Μήνυμα *</Label>
        <Textarea
          id="ticket_message"
          name="message"
          rows={4}
          placeholder="Περιγράψτε το θέμα σας…"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Προτεραιότητα</Label>
        <Select name="priority" defaultValue="normal">
          <SelectTrigger aria-label="Επιλογή προτεραιότητας">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(
              Object.entries(TICKET_PRIORITY_LABELS) as [
                TicketPriority,
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

export function NewTicketDialog({ projectId }: { projectId: string | null }) {
  const router = useRouter();
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
          Νέο Αίτημα
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Νέο Αίτημα Υποστήριξης</DialogTitle>
          <DialogDescription>
            Περιγράψτε το θέμα σας και θα σας απαντήσουμε το συντομότερο.
          </DialogDescription>
        </DialogHeader>
        <NewTicketForm
          key={formKey}
          projectId={projectId}
          onSuccess={(ticketId) => {
            setOpen(false);
            if (ticketId) router.push(`/portal/support/${ticketId}`);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
