"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { currencyFormatter, type MonthlyRevenuePoint } from "@/lib/finance";

// Literal colors: recharts sets fill/stroke as SVG attributes, where CSS
// custom properties don't resolve. These mirror the theme tokens.
const GOLD = "#d4a42c";
const GRID = "#e4e4e7";
const AXIS_TEXT = "#71717a";

const axisFormatter = new Intl.NumberFormat("el-GR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
  notation: "compact",
});

interface TooltipPayload {
  active?: boolean;
  payload?: { payload: MonthlyRevenuePoint }[];
}

function RevenueTooltip({ active, payload }: TooltipPayload) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;

  return (
    <div className="rounded-md border bg-background px-3 py-2 shadow-sm">
      <p className="text-xs text-muted-foreground">{point.fullLabel}</p>
      <p className="text-sm font-semibold">
        {currencyFormatter.format(point.total)}
      </p>
    </div>
  );
}

export function RevenueChart({ data }: { data: MonthlyRevenuePoint[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
        >
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis
            dataKey="label"
            stroke={GRID}
            tick={{ fill: AXIS_TEXT, fontSize: 12 }}
            tickLine={false}
          />
          <YAxis
            stroke={GRID}
            tick={{ fill: AXIS_TEXT, fontSize: 12 }}
            tickLine={false}
            width={56}
            tickFormatter={(value: number) => axisFormatter.format(value)}
          />
          <Tooltip
            content={<RevenueTooltip />}
            cursor={{ fill: "rgba(212,164,44,0.08)" }}
          />
          <Bar
            dataKey="total"
            name="Έσοδα"
            fill={GOLD}
            radius={[3, 3, 0, 0]}
            maxBarSize={36}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
