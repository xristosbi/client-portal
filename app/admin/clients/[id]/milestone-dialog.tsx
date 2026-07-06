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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MILESTONE_STATUS_LABELS,
  type Milestone,
  type MilestoneStatus,
} from "@/lib/types";
import {
  createMilestone,
  updateMilestone,
  type ProjectFormState,
} from "./actions";

const initialState: ProjectFormState = { status: "idle" };

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  const label = isEdit ? "Αποθήκευση" : "Προσθήκη Milestone";

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="animate-spin" />
          Αποθήκευση…
        </>
      ) : (
        label
      )}
    </Button>
  );
}

function MilestoneForm({
  projectId,
  milestone,
  onSuccess,
}: {
  projectId: string;
  milestone?: Milestone;
  onSuccess: () => void;
}) {
  const action = milestone ? updateMilestone : createMilestone;
  const [state, formAction] = useFormState(action, initialState);
  const successMessage = milestone
    ? "Το milestone ενημερώθηκε."
    : "Το milestone προστέθηκε.";

  useEffect(() => {
    if (state.status === "success") {
      toast.success(successMessage);
      onSuccess();
    }
  }, [state.status, successMessage, onSuccess]);

  return (
    <form action={formAction} className="space-y-4">
      {milestone ? (
        <input type="hidden" name="milestone_id" value={milestone.id} />
      ) : (
        <input type="hidden" name="project_id" value={projectId} />
      )}

      <div className="space-y-2">
        <Label htmlFor="milestone_title">Τίτλος *</Label>
        <Input
          id="milestone_title"
          name="title"
          placeholder="π.χ. Σχεδιασμός αρχικής σελίδας"
          defaultValue={milestone?.title ?? undefined}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="milestone_description">Περιγραφή</Label>
        <Textarea
          id="milestone_description"
          name="description"
          rows={3}
          placeholder="Τι περιλαμβάνει αυτό το βήμα"
          defaultValue={milestone?.description ?? undefined}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="milestone_due_date">Προθεσμία</Label>
          <Input
            id="milestone_due_date"
            name="due_date"
            type="date"
            defaultValue={milestone?.due_date ?? undefined}
          />
        </div>
        <div className="space-y-2">
          <Label>Κατάσταση *</Label>
          <Select name="status" defaultValue={milestone?.status ?? "pending"}>
            <SelectTrigger aria-label="Επιλογή κατάστασης milestone">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(
                Object.entries(MILESTONE_STATUS_LABELS) as [
                  MilestoneStatus,
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
      </div>

      {state.status === "error" && state.error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {state.error}
        </p>
      )}

      <SubmitButton isEdit={Boolean(milestone)} />
    </form>
  );
}

export function NewMilestoneDialog({ projectId }: { projectId: string }) {
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
          Νέο Milestone
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Νέο Milestone</DialogTitle>
          <DialogDescription>
            Προσθέστε ένα βήμα στο χρονοδιάγραμμα του project.
          </DialogDescription>
        </DialogHeader>
        <MilestoneForm
          key={formKey}
          projectId={projectId}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

export function EditMilestoneDialog({ milestone }: { milestone: Milestone }) {
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
          <DialogTitle>Επεξεργασία Milestone</DialogTitle>
          <DialogDescription>{milestone.title}</DialogDescription>
        </DialogHeader>
        <MilestoneForm
          key={formKey}
          projectId={milestone.project_id}
          milestone={milestone}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
