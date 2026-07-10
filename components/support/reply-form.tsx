"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { FileFormState } from "@/lib/types";

type ReplyAction = (
  state: FileFormState,
  formData: FormData
) => Promise<FileFormState>;

const initialState: FileFormState = { status: "idle" };

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="animate-spin" />
          Αποστολή…
        </>
      ) : (
        <>
          <Send />
          Αποστολή
        </>
      )}
    </Button>
  );
}

export function ReplyForm({
  ticketId,
  action,
}: {
  ticketId: string;
  action: ReplyAction;
}) {
  const [state, formAction] = useFormState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      toast.success("Το μήνυμα στάλθηκε.");
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <input type="hidden" name="ticket_id" value={ticketId} />
      <Textarea
        name="message"
        rows={3}
        placeholder="Γράψτε την απάντησή σας…"
        required
      />

      {state.status === "error" && state.error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {state.error}
        </p>
      )}

      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}
