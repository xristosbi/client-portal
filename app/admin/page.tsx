import type { Metadata } from "next";
import { Euro, Repeat, Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RevenueCard } from "@/components/admin/revenue-card";
import { createClient } from "@/lib/supabase/server";
import { computeRevenueTotals, currencyFormatter } from "@/lib/finance";

export const metadata: Metadata = {
  title: "Επισκόπηση",
};

export default async function AdminDashboardPage() {
  const supabase = createClient();

  const [{ count: clientCount }, { data: incomeEntries }] = await Promise.all([
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "client"),
    supabase.from("income_entries").select("amount, entry_date"),
  ]);

  const revenueTotals = computeRevenueTotals(incomeEntries ?? []);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Επισκόπηση</h1>
        <p className="mt-1 text-muted-foreground">
          Η συνολική εικόνα της Imperial Automations — πελάτες, έσοδα και
          δραστηριότητα.
        </p>
      </div>

      {/* Hero stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ενεργοί Πελάτες
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/10">
              <Users className="h-4 w-4 text-gold" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{clientCount ?? 0}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Λογαριασμοί πελατών στην πύλη
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              MRR (Μηνιαία Επαναλαμβανόμενα Έσοδα)
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/10">
              <Repeat className="h-4 w-4 text-gold" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">
              {currencyFormatter.format(0)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Δεν υπάρχουν ακόμα συνδρομές
            </p>
          </CardContent>
        </Card>

        <RevenueCard totals={revenueTotals} />
      </div>

      {/* Chart placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Πορεία Εσόδων</CardTitle>
          <CardDescription>
            Μηνιαία εξέλιξη εσόδων — θα ενεργοποιηθεί μόλις υπάρχουν
            αρκετές καταχωρήσεις.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-muted/30">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/10">
              <Euro className="h-6 w-6 text-gold" />
            </div>
            <p className="text-sm font-medium">
              Δεν υπάρχουν ακόμα δεδομένα εσόδων
            </p>
            <p className="max-w-sm text-center text-xs text-muted-foreground">
              Μόλις καταγραφούν οι πρώτες πληρωμές, εδώ θα εμφανίζεται το
              γράφημα με την πορεία των εσόδων σας.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
