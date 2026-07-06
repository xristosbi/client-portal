"use client";

import { useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
  PROJECT_STATUS_LABELS,
  type Project,
  type ProjectStatus,
} from "@/lib/types";
import {
  createProject,
  updateProject,
  type ProjectFormState,
} from "./actions";

const initialState: ProjectFormState = { status: "idle" };

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  const label = isEdit ? "Αποθήκευση" : "Δημιουργία Project";

  return (
    <Button type="submit" disabled={pending}>
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

export function ProjectForm({
  clientId,
  project,
}: {
  clientId: string;
  project?: Project;
}) {
  const action = project ? updateProject : createProject;
  const [state, formAction] = useFormState(action, initialState);

  useEffect(() => {
    if (state.status === "success") {
      toast.success(
        project ? "Το project ενημερώθηκε." : "Το project δημιουργήθηκε."
      );
    }
  }, [state.status, project]);

  return (
    <form action={formAction} className="space-y-4">
      {project ? (
        <input type="hidden" name="project_id" value={project.id} />
      ) : (
        <input type="hidden" name="client_id" value={clientId} />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="project_name">Όνομα Project *</Label>
          <Input
            id="project_name"
            name="name"
            placeholder="π.χ. Ιστοσελίδα & AI Chatbot"
            defaultValue={project?.name ?? undefined}
            required
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="project_description">Περιγραφή</Label>
          <Textarea
            id="project_description"
            name="description"
            rows={3}
            placeholder="Σύντομη περιγραφή του έργου"
            defaultValue={project?.description ?? undefined}
          />
        </div>

        <div className="space-y-2">
          <Label>Κατάσταση *</Label>
          <Select name="status" defaultValue={project?.status ?? "onboarding"}>
            <SelectTrigger aria-label="Επιλογή κατάστασης project">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(
                Object.entries(PROJECT_STATUS_LABELS) as [
                  ProjectStatus,
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

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="project_start_date">Έναρξη</Label>
            <Input
              id="project_start_date"
              name="start_date"
              type="date"
              defaultValue={project?.start_date ?? undefined}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="project_target_end_date">Στόχος ολοκλήρωσης</Label>
            <Input
              id="project_target_end_date"
              name="target_end_date"
              type="date"
              defaultValue={project?.target_end_date ?? undefined}
            />
          </div>
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

      <SubmitButton isEdit={Boolean(project)} />
    </form>
  );
}
