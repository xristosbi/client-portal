import type { Metadata } from "next";
import { ArrowDownRight, ArrowUpRight, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { createClient } from "@/lib/supabase/server";
import { currencyFormatter } from "@/lib/finance";
import { deleteExpenseEntry, deleteIncomeEntry } from "./actions";
import { EditEntryDialog, EntryDialog } from "./entry-dialog";
import { NewInvoiceDialog, type ClientOption } from "./new-invoice-dialog";

export const metadata: Metadata = {
  title: "Πληρωμές",
};

interface FinanceEntry {
  id: string;
  amount: number;
  description: string;
  category: string | null;
  entry_date: string;
}

interface ClientInvoice {
  id: string;
  amount: number;
  description: string;
  invoice_date: string;
  file_path: string;
  client: {
    full_name: string | null;
    company_name: string | null;
  } | null;
}

const dateFormatter = new Intl.DateTimeFormat("el-GR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function formatDate(date: string) {
  return dateFormatter.format(new Date(`${date}T00:00:00`));
}

function EntriesTable({
  entries,
  emptyMessage,
  sentiment,
}: {
  entries: FinanceEntry[];
  emptyMessage: string;
  sentiment: "income" | "expense";
}) {
  if (entries.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  const AmountIcon = sentiment === "income" ? ArrowUpRight : ArrowDownRight;
  const amountClass =
    sentiment === "income" ? "text-emerald-600" : "text-red-600";
  const amountSign = sentiment === "income" ? "+" : "−";
  const deleteAction =
    sentiment === "income" ? deleteIncomeEntry : deleteExpenseEntry;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Ποσό</TableHead>
          <TableHead>Περιγραφή</TableHead>
          <TableHead>Κατηγορία</TableHead>
          <TableHead>Ημερομηνία</TableHead>
          <TableHead className="text-right">Ενέργειες</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry) => (
          <TableRow key={entry.id}>
            <TableCell>
              <span
                className={`inline-flex items-center gap-1 font-medium ${amountClass}`}
              >
                <AmountIcon className="h-3.5 w-3.5" />
                {amountSign}
                {currencyFormatter.format(Number(entry.amount))}
              </span>
            </TableCell>
            <TableCell>{entry.description}</TableCell>
            <TableCell>
              {entry.category ? (
                <Badge variant="secondary">{entry.category}</Badge>
              ) : (
                "—"
              )}
            </TableCell>
            <TableCell>{formatDate(entry.entry_date)}</TableCell>
            <TableCell>
              <div className="flex items-center justify-end gap-1">
                <EditEntryDialog
                  variant={sentiment}
                  entry={{
                    id: entry.id,
                    amount: Number(entry.amount),
                    description: entry.description,
                    category: entry.category,
                    entry_date: entry.entry_date,
                  }}
                />
                <ConfirmDeleteDialog
                  action={deleteAction.bind(null, entry.id)}
                  description="Σίγουρα θες να διαγράψεις αυτή την καταχώρηση;"
                />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default async function AdminPaymentsPage() {
  const supabase = createClient();

  const [
    { data: incomeData },
    { data: expenseData },
    { data: invoiceData },
    { data: clientData },
  ] = await Promise.all([
    supabase
      .from("income_entries")
      .select("*")
      .order("entry_date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("expense_entries")
      .select("*")
      .order("entry_date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("client_invoices")
      .select("*, client:profiles(full_name, company_name)")
      .order("invoice_date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("id, full_name, company_name, email")
      .eq("role", "client")
      .order("full_name"),
  ]);

  const income = (incomeData ?? []) as FinanceEntry[];
  const expenses = (expenseData ?? []) as FinanceEntry[];
  const invoices = (invoiceData ?? []) as ClientInvoice[];

  const clientOptions: ClientOption[] = (clientData ?? []).map((client) => ({
    id: client.id,
    label:
      [client.full_name, client.company_name].filter(Boolean).join(" — ") ||
      client.email,
  }));

  // The bucket is private, so links are short-lived signed URLs.
  const signedUrlByPath = new Map<string, string>();
  if (invoices.length > 0) {
    const { data: signed } = await supabase.storage
      .from("client-invoices")
      .createSignedUrls(
        invoices.map((invoice) => invoice.file_path),
        60 * 60
      );
    for (const item of signed ?? []) {
      if (item.signedUrl && item.path) {
        signedUrlByPath.set(item.path, item.signedUrl);
      }
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Πληρωμές</h1>
        <p className="mt-1 text-muted-foreground">
          Εσωτερική λογιστική εικόνα — έσοδα, έξοδα και τιμολόγια που έχουν
          εκδοθεί μέσω myDATA.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div className="space-y-1.5">
              <CardTitle className="text-base">Έσοδα</CardTitle>
              <CardDescription>
                Χειροκίνητες καταχωρήσεις εσόδων.
              </CardDescription>
            </div>
            <EntryDialog variant="income" />
          </CardHeader>
          <CardContent>
            <EntriesTable
              entries={income}
              emptyMessage="Δεν υπάρχουν ακόμα καταχωρήσεις εσόδων"
              sentiment="income"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div className="space-y-1.5">
              <CardTitle className="text-base">Έξοδα</CardTitle>
              <CardDescription>
                Χειροκίνητες καταχωρήσεις εξόδων.
              </CardDescription>
            </div>
            <EntryDialog variant="expense" />
          </CardHeader>
          <CardContent>
            <EntriesTable
              entries={expenses}
              emptyMessage="Δεν υπάρχουν ακόμα καταχωρήσεις εξόδων"
              sentiment="expense"
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div className="space-y-1.5">
            <CardTitle className="text-base">Τιμολόγια Πελατών</CardTitle>
            <CardDescription>
              Αρχείο τιμολογίων που έχουν εκδοθεί μέσω myDATA — μόνο για
              τήρηση αρχείου, δεν γίνεται καμία χρέωση.
            </CardDescription>
          </div>
          <NewInvoiceDialog clients={clientOptions} />
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Δεν υπάρχουν ακόμα τιμολόγια
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Πελάτης</TableHead>
                  <TableHead>Ποσό</TableHead>
                  <TableHead>Περιγραφή</TableHead>
                  <TableHead>Ημερομηνία</TableHead>
                  <TableHead>Αρχείο</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => {
                  const clientLabel =
                    [
                      invoice.client?.full_name,
                      invoice.client?.company_name,
                    ]
                      .filter(Boolean)
                      .join(" — ") || "—";
                  const url = signedUrlByPath.get(invoice.file_path);

                  return (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {clientLabel}
                      </TableCell>
                      <TableCell>
                        {currencyFormatter.format(Number(invoice.amount))}
                      </TableCell>
                      <TableCell>{invoice.description}</TableCell>
                      <TableCell>
                        {formatDate(invoice.invoice_date)}
                      </TableCell>
                      <TableCell>
                        {url ? (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm font-medium text-gold hover:underline"
                          >
                            Προβολή PDF
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
