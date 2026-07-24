import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
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
import { CalendlyEmbed } from "@/components/portal/calendly-embed";
import {
  TicketPriorityBadge,
  TicketStatusBadge,
} from "@/components/shared/status-badges";
import { getProfileOrRedirect } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { AppSettings, SupportTicket } from "@/lib/types";
import { NewTicketDialog } from "./new-ticket-dialog";

export const metadata: Metadata = {
  title: "Υποστήριξη",
};

const dateFormatter = new Intl.DateTimeFormat("el-GR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function PortalSupportPage() {
  const profile = await getProfileOrRedirect();
  const supabase = createClient();

  const [{ data: ticketData }, { data: projectData }, { data: settingsData }] =
    await Promise.all([
      supabase
        .from("support_tickets")
        .select("*")
        .eq("client_id", profile.id)
        .order("updated_at", { ascending: false }),
      supabase
        .from("projects")
        .select("id")
        .eq("client_id", profile.id)
        .maybeSingle(),
      supabase.from("app_settings").select("*").eq("id", 1).maybeSingle(),
    ]);

  const tickets = (ticketData ?? []) as SupportTicket[];
  const settings = settingsData as AppSettings | null;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Υποστήριξη</h1>
        <p className="mt-1 text-muted-foreground">
          Στείλτε μας αίτημα υποστήριξης ή κλείστε ένα ραντεβού.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div className="space-y-1.5">
            <CardTitle className="text-base">Αιτήματα Υποστήριξης</CardTitle>
            <CardDescription>
              Οι συνομιλίες σας με την ομάδα μας.
            </CardDescription>
          </div>
          <NewTicketDialog projectId={projectData?.id ?? null} />
        </CardHeader>
        <CardContent>
          {tickets.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Δεν έχεις ακόμα αιτήματα υποστήριξης
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Θέμα</TableHead>
                  <TableHead>Κατάσταση</TableHead>
                  <TableHead>Προτεραιότητα</TableHead>
                  <TableHead>Ενημερώθηκε</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell>
                      <Link
                        href={`/portal/support/${ticket.id}`}
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Κλείσε Ραντεβού</CardTitle>
          <CardDescription>
            Κλείστε μια κλήση με την ομάδα της CB Automates.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {settings?.calendly_url ? (
            <CalendlyEmbed url={settings.calendly_url} />
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <CalendarDays className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="max-w-sm text-center text-sm text-muted-foreground">
                Δεν έχει ρυθμιστεί ακόμα η δυνατότητα κλεισίματος ραντεβού.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
