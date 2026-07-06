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

export default async function AdminClientsPage() {
  const supabase = createClient();

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "client")
    .order("created_at", { ascending: false });

  const clients = (data ?? []) as Profile[];

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
                        <ConfirmDeleteDialog
                          action={deleteClientAccount.bind(null, client.id)}
                          description={`Σίγουρα θες να διαγράψεις τον πελάτη «${client.full_name || client.email}»; Θα διαγραφεί και το project του. Τα τιμολόγιά του (αν υπάρχουν) εμποδίζουν τη διαγραφή.`}
                        />
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
