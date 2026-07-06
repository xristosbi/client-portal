import type { Metadata } from "next";
import { Receipt } from "lucide-react";
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

export const metadata: Metadata = {
  title: "Πληρωμές",
};

export default function AdminPaymentsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Πληρωμές</h1>
          <p className="mt-1 text-muted-foreground">
            Τιμολόγια και πληρωμές των πελατών σας.
          </p>
        </div>
        <Badge variant="secondary">Σύνδεση με Stripe σε επόμενη φάση</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Τιμολόγια</CardTitle>
          <CardDescription>
            Εδώ θα εμφανίζονται όλα τα τιμολόγια μόλις ενεργοποιηθούν οι
            πληρωμές.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Πελάτης</TableHead>
                <TableHead>Ποσό</TableHead>
                <TableHead>Κατάσταση</TableHead>
                <TableHead>Ημερομηνία</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={4}>
                  <div className="flex flex-col items-center justify-center gap-3 py-12">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/10">
                      <Receipt className="h-6 w-6 text-gold" />
                    </div>
                    <p className="text-sm font-medium">
                      Δεν υπάρχουν ακόμα τιμολόγια
                    </p>
                    <p className="max-w-sm text-center text-xs text-muted-foreground">
                      Τα τιμολόγια θα εμφανίζονται εδώ αυτόματα μόλις
                      συνδεθεί το Stripe.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
