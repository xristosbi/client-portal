"use client";

import { useState } from "react";
import { Euro } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  currencyFormatter,
  REVENUE_PERIOD_LABELS,
  type RevenuePeriod,
  type RevenueTotals,
} from "@/lib/finance";

const PERIODS = Object.entries(REVENUE_PERIOD_LABELS) as [
  RevenuePeriod,
  string,
][];

export function RevenueCard({ totals }: { totals: RevenueTotals }) {
  const [period, setPeriod] = useState<RevenuePeriod>("today");

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Έσοδα
        </CardTitle>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/10">
          <Euro className="h-4 w-4 text-gold" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Select
          value={period}
          onValueChange={(value) => setPeriod(value as RevenuePeriod)}
        >
          <SelectTrigger
            className="w-40"
            aria-label="Επιλογή περιόδου εσόδων"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIODS.map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="text-3xl font-semibold">
          {currencyFormatter.format(totals[period])}
        </div>
        <p className="text-xs text-muted-foreground">
          Από τις καταχωρήσεις εσόδων στη σελίδα «Πληρωμές»
        </p>
      </CardContent>
    </Card>
  );
}
