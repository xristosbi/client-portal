import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
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
import { getProfileOrRedirect } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { currencyFormatter } from "@/lib/finance";

export const metadata: Metadata = {
  title: "Τιμολόγια",
};

interface InvoiceRow {
  id: string;
  amount: number;
  description: string;
  invoice_date: string;
  file_path: string;
}

const dateFormatter = new Intl.DateTimeFormat("el-GR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export default async function PortalInvoicesPage() {
  const profile = await getProfileOrRedirect();
  const supabase = createClient();

  // RLS (client_invoices_client_select_own) restricts this to rows where
  // client_id = auth.uid(), so the .eq() below is defense in depth, not
  // the actual security boundary.
  const { data } = await supabase
    .from("client_invoices")
    .select("id, amount, description, invoice_date, file_path")
    .eq("client_id", profile.id)
    .order("invoice_date", { ascending: false });

  const invoices = (data ?? []) as InvoiceRow[];

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
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Τιμολόγια</h1>
        <p className="mt-1 text-muted-foreground">
          Τα τιμολόγια που έχουμε εκδώσει για εσάς.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Τιμολόγια ({invoices.length})
          </CardTitle>
          <CardDescription>
            Οι σύνδεσμοι λήγουν μετά από 1 ώρα για λόγους ασφαλείας.
          </CardDescription>
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
                  <TableHead>Ποσό</TableHead>
                  <TableHead>Περιγραφή</TableHead>
                  <TableHead>Ημερομηνία</TableHead>
                  <TableHead>Αρχείο</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => {
                  const url = signedUrlByPath.get(invoice.file_path);
                  return (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {currencyFormatter.format(Number(invoice.amount))}
                      </TableCell>
                      <TableCell>{invoice.description}</TableCell>
                      <TableCell>
                        {dateFormatter.format(
                          new Date(`${invoice.invoice_date}T00:00:00`)
                        )}
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
