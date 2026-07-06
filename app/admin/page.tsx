import type { Metadata } from "next";
import {
  BarChart3,
  CalendarDays,
  CalendarRange,
  Euro,
  Infinity as InfinityIcon,
  Repeat,
  Sun,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Επισκόπηση",
};

const currencyFormatter = new Intl.NumberFormat("el-GR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
});

// Revenue periods — amounts stay at 0 until Stripe is wired up in a
// later phase; the layout is ready to receive real numbers.
const REVENUE_PERIODS = [
  { label: "Σήμερα", icon: Sun, amount: 0 },
  { label: "Εβδομάδα", icon: CalendarDays, amount: 0 },
  { label: "Μήνας", icon: CalendarRange, amount: 0 },
  { label: "Τρίμηνο", icon: TrendingUp, amount: 0 },
  { label: "Έτος", icon: BarChart3, amount: 0 },
  { label: "Σύνολο", icon: InfinityIcon, amount: 0 },
];

export default async function AdminDashboardPage() {
  const supabase = createClient();

  const { count: clientCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "client");

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
      <div className="grid gap-4 sm:grid-cols-2">
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
      </div>

      {/* Revenue breakdown */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Έσοδα</h2>
          <Badge variant="secondary">Σύνδεση με Stripe σε επόμενη φάση</Badge>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {REVENUE_PERIODS.map((period) => (
            <Card key={period.label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <period.icon className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">{period.label}</span>
                </div>
                <p className="mt-2 text-xl font-semibold">
                  {currencyFormatter.format(period.amount)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Chart placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Πορεία Εσόδων</CardTitle>
          <CardDescription>
            Μηνιαία εξέλιξη εσόδων — θα ενεργοποιηθεί μόλις συνδεθούν οι
            πληρωμές.
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
