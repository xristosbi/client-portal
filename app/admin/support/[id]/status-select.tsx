"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TICKET_STATUS_LABELS,
  type TicketStatus,
} from "@/lib/types";
import { updateTicketStatus } from "../actions";

export function TicketStatusSelect({
  ticketId,
  status,
}: {
  ticketId: string;
  status: TicketStatus;
}) {
  const [pending, startTransition] = useTransition();

  function handleChange(next: string) {
    startTransition(async () => {
      const result = await updateTicketStatus(ticketId, next);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Η κατάσταση ενημερώθηκε.");
      }
    });
  }

  return (
    <Select value={status} onValueChange={handleChange} disabled={pending}>
      <SelectTrigger className="w-40" aria-label="Κατάσταση αιτήματος">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {(
          Object.entries(TICKET_STATUS_LABELS) as [TicketStatus, string][]
        ).map(([value, label]) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
