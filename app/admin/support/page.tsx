import type { Metadata } from "next";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TicketPriorityBadge,
  TicketStatusBadge,
} from "@/components/shared/status-badges";
import { createClient } from "@/lib/supabase/server";
import type {
  SupportTicket,
  TicketPriority,
  TicketStatus,
} from "@/lib/types";
import { TicketFilters } from "./ticket-filters";

export const metadata: Metadata = {
  title: "Υποστήριξη",
};

const STATUSES: TicketStatus[] = ["open", "in_progress", "resolved", "closed"];
const PRIORITIES: TicketPriority[] = ["low", "normal", "high"];

interface TicketRow extends SupportTicket {
  client: {
    full_name: string | null;
    company_name: string | null;
    email: string;
  } | null;
}

const dateFormatter = new Intl.DateTimeFormat("el-GR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams: { status?: string; priority?: string };
}) {
  const supabase = createClient();

  let query = supabase
    .from("support_tickets")
    .select("*, client:profiles(full_name, company_name, email)")
    .order("updated_at", { ascending: false });

  if (STATUSES.includes(searchParams.status as TicketStatus)) {
    query = query.eq("status", searchParams.status);
  }
  if (PRIORITIES.includes(searchParams.priority as TicketPriority)) {
    query = query.eq("priority", searchParams.priority);
  }

  const { data } = await query;
  const tickets = (data ?? []) as TicketRow[];

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Υποστήριξη</h1>
        <p className="mt-1 text-muted-foreground">
          Όλα τα αιτήματα υποστήριξης των πελατών σας.
        </p>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <div className="space-y-1.5">
            <CardTitle className="text-base">
              Αιτήματα ({tickets.length})
            </CardTitle>
            <CardDescription>
              Ταξινομημένα με τα πιο πρόσφατα ενημερωμένα πρώτα.
            </CardDescription>
          </div>
          <TicketFilters />
        </CardHeader>
        <CardContent>
          {tickets.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Δεν υπάρχουν αιτήματα με αυτά τα φίλτρα.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Πελάτης</TableHead>
                  <TableHead>Θέμα</TableHead>
                  <TableHead>Κατάσταση</TableHead>
                  <TableHead>Προτεραιότητα</TableHead>
                  <TableHead>Ενημερώθηκε</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-medium">
                      {ticket.client?.full_name ||
                        ticket.client?.company_name ||
                        ticket.client?.email ||
                        "—"}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/support/${ticket.id}`}
                        className="font-medium text-gold hover:underline"
                      >
                        {ticket.subject}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <TicketStatusBadge status={ticket.status} />
                    </TableCell>
                    <TableCell>
                      <TicketPriorityBadge priority={ticket.priority} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {dateFormatter.format(new Date(ticket.updated_at))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
