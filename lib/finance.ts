export type RevenuePeriod =
  | "today"
  | "week"
  | "month"
  | "quarter"
  | "year"
  | "all";

export const REVENUE_PERIOD_LABELS: Record<RevenuePeriod, string> = {
  today: "Σήμερα",
  week: "Εβδομάδα",
  month: "Μήνας",
  quarter: "Τρίμηνο",
  year: "Έτος",
  all: "Σύνολο",
};

export type RevenueTotals = Record<RevenuePeriod, number>;

export const currencyFormatter = new Intl.NumberFormat("el-GR", {
  style: "currency",
  currency: "EUR",
});

/** Today's date in Europe/Athens as YYYY-MM-DD (entries use local dates). */
export function athensToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Athens",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/**
 * Start date (inclusive, YYYY-MM-DD) of each period relative to `today`;
 * null means no lower bound. Week starts on Monday.
 */
export function periodStart(
  period: RevenuePeriod,
  today: string
): string | null {
  const [year, month, day] = today.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  switch (period) {
    case "today":
      return today;
    case "week": {
      const weekday = date.getUTCDay(); // 0 = Sunday
      const sinceMonday = (weekday + 6) % 7;
      date.setUTCDate(date.getUTCDate() - sinceMonday);
      return date.toISOString().slice(0, 10);
    }
    case "month":
      return `${today.slice(0, 7)}-01`;
    case "quarter": {
      const quarterMonth = Math.floor((month - 1) / 3) * 3 + 1;
      return `${year}-${String(quarterMonth).padStart(2, "0")}-01`;
    }
    case "year":
      return `${year}-01-01`;
    case "all":
      return null;
  }
}

function daysInMonth(year: number, month1based: number): number {
  return new Date(Date.UTC(year, month1based, 0)).getUTCDate();
}

function formatYmd(year: number, month1based: number, day: number): string {
  return `${year}-${String(month1based).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Next occurrence (YYYY-MM-DD) of `billingDay` on/after `today`. Clamps to
 * the last day of short months (e.g. billingDay=31 in April → April 30).
 */
export function nextBillingDate(billingDay: number, today: string): string {
  const [year, month, day] = today.split("-").map(Number);

  const thisMonthDay = Math.min(billingDay, daysInMonth(year, month));
  if (thisMonthDay >= day) {
    return formatYmd(year, month, thisMonthDay);
  }

  const nextMonth = month === 12 ? 1 : month + 1;
  const nextMonthYear = month === 12 ? year + 1 : year;
  const nextMonthDay = Math.min(billingDay, daysInMonth(nextMonthYear, nextMonth));
  return formatYmd(nextMonthYear, nextMonth, nextMonthDay);
}

/** Sums (amount, entry_date) rows into totals per period. */
export function computeRevenueTotals(
  entries: { amount: number; entry_date: string }[]
): RevenueTotals {
  const today = athensToday();
  const periods = Object.keys(REVENUE_PERIOD_LABELS) as RevenuePeriod[];
  const totals = Object.fromEntries(
    periods.map((period) => [period, 0])
  ) as RevenueTotals;

  for (const entry of entries) {
    for (const period of periods) {
      const start = periodStart(period, today);
      if (start === null || entry.entry_date >= start) {
        totals[period] += Number(entry.amount);
      }
    }
  }

  return totals;
}
