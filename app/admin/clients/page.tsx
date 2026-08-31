import type { Metadata } from "next";
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
import Link from "next/link";
import { FolderKanban } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { createClient } from "@/lib/supabase/server";
import {
  SUBSCRIPTION_STATUS_LABELS,
  type Profile,
} from "@/lib/types";
import { deleteClientAccount } from "./actions";
import { EditClientDialog } from "./edit-client-dialog";
import { NewClientDialog } from "./new-client-dialog";

export const metadata: Metadata = {
  title: "Πελάτες",
};

const dateFormatter = new Intl.DateTimeFormat("el-GR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const amountFormatter = new Intl.NumberFormat("el-GR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const STATUS_CLASSES: Record<Profile["subscription_status"], string> = {
  active: "text-emerald-600",
  paused: "text-amber-600",
  cancelled: "text-red-600",
};

function SubscriptionCell({ client }: { client: Profile }) {
  if (!client.has_subscription || client.subscription_amount == null) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <span className="font-medium">
        {amountFormatter.format(Number(client.subscription_amount))}/μήνα
      </span>
      <span className={STATUS_CLASSES[client.subscription_status]}>
        {SUBSCRIPTION_STATUS_LABELS[client.subscription_status]}
      </span>
      {client.payment_method === "stripe_auto" && (
        <Badge className="border-transparent bg-violet-100 text-violet-700 hover:bg-violet-100">
          Stripe
        </Badge>
      )}
      {client.payment_method === "cash_manual" && (
        <Badge className="border-transparent bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
          Μετρητά
        </Badge>
      )}
    </div>
  );
}

/** What a client delete would take with it, for the warning dialog. */
interface RelatedCounts {
  projects: number;
  invoices: number;
  files: number;
  tickets: number;
  agreements: number;
}

function countBy<T>(rows: T[] | null, key: (row: T) => string | null) {
  const counts = new Map<string, number>();
  for (const row of rows ?? []) {
    const id = key(row);
    if (!id) continue;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return counts;
}

function deletionDetails(counts: RelatedCounts | undefined): string[] {
  if (!counts) return [];
  const details: string[] = [];
  if (counts.projects > 0) details.push("Το project και τα milestones του");
  if (counts.invoices > 0) details.push(`${counts.invoices} τιμολόγια`);
  if (counts.files > 0) details.push(`${counts.files} αρχεία`);
  if (counts.tickets > 0)
    details.push(`${counts.tickets} αιτήματα υποστήριξης`);
  if (counts.agreements > 0) details.push("Η συμφωνία συνεργασίας");
  return details;
}

export default async function AdminClientsPage() {
  const supabase = createClient();

  // Related rows are fetched in bulk (id columns only) and counted in
  // memory, so the warning dialog doesn't cost one query per client.
  const [
    { data },
    { data: projectRows },
    { data: invoiceRows },
    { data: fileRows },
    { data: ticketRows },
    { data: agreementRows },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("role", "client")
      .order("created_at", { ascending: false }),
    supabase.from("projects").select("id, client_id"),
    supabase.from("client_invoices").select("client_id"),
    supabase.from("project_files").select("project_id"),
    supabase.from("support_tickets").select("client_id"),
    supabase.from("agreements").select("client_id"),
  ]);

  const clients = (data ?? []) as Profile[];

  const clientIdByProject = new Map(
    (projectRows ?? []).map((row) => [row.id as string, row.client_id as string])
  );
  const projectCounts = countBy(projectRows, (row) => row.client_id as string);
  const invoiceCounts = countBy(invoiceRows, (row) => row.client_id as string);
  const ticketCounts = countBy(ticketRows, (row) => row.client_id as string);
  const agreementCounts = countBy(
    agreementRows,
    (row) => row.client_id as string
  );
  const fileCounts = countBy(
    fileRows,
    (row) => clientIdByProject.get(row.project_id as string) ?? null
  );

  const relatedByClient = new Map<string, RelatedCounts>(
    clients.map((client) => [
      client.id,
      {
        projects: projectCounts.get(client.id) ?? 0,
        invoices: invoiceCounts.get(client.id) ?? 0,
        files: fileCounts.get(client.id) ?? 0,
        tickets: ticketCounts.get(client.id) ?? 0,
        agreements: agreementCounts.get(client.id) ?? 0,
      },
    ])
  );

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Πελάτες</h1>
          <p className="mt-1 text-muted-foreground">
            Όλοι οι λογαριασμοί πελατών της πύλης.
          </p>
        </div>
        <NewClientDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Λίστα Πελατών ({clients.length})
          </CardTitle>
          <CardDescription>
            Δημιουργήστε νέους λογαριασμούς με το κουμπί «Νέος Πελάτης».
          </CardDescription>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Δεν υπάρχουν ακόμη πελάτες.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ονοματεπώνυμο</TableHead>
                  <TableHead>Επιχείρηση</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Τηλέφωνο</TableHead>
                  <TableHead>Συνδρομή</TableHead>
                  <TableHead>Εγγραφή</TableHead>
                  <TableHead className="text-right">Ενέργειες</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">
                      {client.full_name || "—"}
                    </TableCell>
                    <TableCell>{client.company_name || "—"}</TableCell>
                    <TableCell>{client.email}</TableCell>
                    <TableCell>{client.phone || "—"}</TableCell>
                    <TableCell>
                      <SubscriptionCell client={client} />
                    </TableCell>
                    <TableCell>
                      {dateFormatter.format(new Date(client.created_at))}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/admin/clients/${client.id}`}>
                            <FolderKanban />
                            Project
                          </Link>
                        </Button>
                        <EditClientDialog client={client} />
                        {(() => {
                          const clientLabel =
                            client.full_name || client.email;
                          const details = deletionDetails(
                            relatedByClient.get(client.id)
                          );
                          // Typed confirmation only when there is data to
                          // lose — a clean account deletes with one click.
                          return (
                            <ConfirmDeleteDialog
                              action={deleteClientAccount.bind(
                                null,
                                client.id
                              )}
                              title={`Διαγραφή πελάτη «${clientLabel}»`}
                              description={
                                details.length > 0
                                  ? "Ο λογαριασμός του πελάτη και όλα τα δεδομένα του θα διαγραφούν οριστικά, μαζί με τα αρχεία τους."
                                  : `Σίγουρα θες να διαγράψεις τον πελάτη «${clientLabel}»;`
                              }
                              details={[
                                "Ο λογαριασμός πρόσβασης στην πύλη",
                                ...details,
                              ]}
                              confirmPhrase={
                                details.length > 0 ? clientLabel : undefined
                              }
                              successMessage="Ο πελάτης διαγράφηκε."
                            />
                          );
                        })()}
                      </div>
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
