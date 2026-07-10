"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TICKET_PRIORITY_LABELS,
  TICKET_STATUS_LABELS,
  type TicketPriority,
  type TicketStatus,
} from "@/lib/types";

export function TicketFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setFilter(key: "status" | "priority", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Select
        value={searchParams.get("status") ?? "all"}
        onValueChange={(value) => setFilter("status", value)}
      >
        <SelectTrigger className="w-40" aria-label="Φίλτρο κατάστασης">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Όλες οι καταστάσεις</SelectItem>
          {(
            Object.entries(TICKET_STATUS_LABELS) as [TicketStatus, string][]
          ).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("priority") ?? "all"}
        onValueChange={(value) => setFilter("priority", value)}
      >
        <SelectTrigger className="w-44" aria-label="Φίλτρο προτεραιότητας">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Όλες οι προτεραιότητες</SelectItem>
          {(
            Object.entries(TICKET_PRIORITY_LABELS) as [TicketPriority, string][]
          ).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
