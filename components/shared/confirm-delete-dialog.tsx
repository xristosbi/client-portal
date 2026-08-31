"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface DeleteResult {
  error?: string;
}

interface ConfirmDeleteDialogProps {
  /** Bound server action performing the delete. */
  action: () => Promise<DeleteResult>;
  description: string;
  title?: string;
  successMessage?: string;
  /** Show the label next to the trash icon (icon-only when false). */
  withLabel?: boolean;
  /** Lines listing what will be permanently removed. */
  details?: string[];
  /** When set, the exact phrase must be typed before deleting is enabled. */
  confirmPhrase?: string;
}

export function ConfirmDeleteDialog({
  action,
  description,
  title = "Επιβεβαίωση διαγραφής",
  successMessage = "Η διαγραφή ολοκληρώθηκε.",
  withLabel = false,
  details,
  confirmPhrase,
}: ConfirmDeleteDialogProps) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [pending, startTransition] = useTransition();

  const phraseMatches = !confirmPhrase || typed.trim() === confirmPhrase;

  function handleConfirm() {
    startTransition(async () => {
      const result = await action();
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(successMessage);
      }
      setOpen(false);
      setTyped("");
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setTyped("");
      }}
    >
      <Button
        variant="ghost"
        size={withLabel ? "sm" : "icon"}
        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        aria-label="Διαγραφή"
        onClick={() => setOpen(true)}
      >
        <Trash2 />
        {withLabel && "Διαγραφή"}
      </Button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {details && details.length > 0 && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Θα διαγραφούν οριστικά
            </div>
            <ul className="ml-6 list-disc space-y-1 text-sm text-muted-foreground">
              {details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
            <p className="mt-2 text-xs font-medium text-destructive">
              Αυτή η ενέργεια δεν αναιρείται.
            </p>
          </div>
        )}

        {confirmPhrase && (
          <div className="space-y-2">
            <Label htmlFor="confirm_phrase">
              Πληκτρολογήστε{" "}
              <span className="font-semibold">«{confirmPhrase}»</span> για
              επιβεβαίωση
            </Label>
            <Input
              id="confirm_phrase"
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              placeholder={confirmPhrase}
              autoComplete="off"
            />
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            Άκυρο
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={pending || !phraseMatches}
          >
            {pending ? (
              <>
                <Loader2 className="animate-spin" />
                Διαγραφή…
              </>
            ) : (
              "Διαγραφή"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
