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
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export const metadata: Metadata = {
  title: "Πελάτες",
};

const dateFormatter = new Intl.DateTimeFormat("el-GR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

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
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Πελάτες</h1>
        <p className="mt-1 text-muted-foreground">
          Όλοι οι λογαριασμοί πελατών της πύλης.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Λίστα Πελατών ({clients.length})
          </CardTitle>
          <CardDescription>
            Οι νέοι λογαριασμοί δημιουργούνται προς το παρόν από το Supabase
            Dashboard.
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
                  <TableHead>Εγγραφή</TableHead>
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
                      {dateFormatter.format(new Date(client.created_at))}
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
