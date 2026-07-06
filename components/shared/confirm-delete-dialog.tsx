"use client";

import { useState, useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
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
}

export function ConfirmDeleteDialog({
  action,
  description,
  title = "Επιβεβαίωση διαγραφής",
  successMessage = "Η διαγραφή ολοκληρώθηκε.",
  withLabel = false,
}: ConfirmDeleteDialogProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      const result = await action();
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(successMessage);
      }
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
            disabled={pending}
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
