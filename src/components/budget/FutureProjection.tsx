import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BudgetPlan } from "@/types/budget";
import { projectFuture, PROJECTION_HORIZONS } from "@/utils/projections";
import { formatCurrency } from "@/utils/budgetCalculations";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { TrendingUp, Lightbulb } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  budget: BudgetPlan;
}

export function FutureProjection({ budget }: Props) {
  const [startingSavings, setStartingSavings] = useState<number>(0);
  const result = useMemo(
    () => projectFuture(budget, startingSavings),
    [budget, startingSavings]
  );
  const [horizon, setHorizon] = useState<number>(60);
  const highlight = result.series.find((p) => p.month === horizon)!;

  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="w-5 h-5 text-primary" />
          Future Projection Dashboard
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          See where your current financial habits could take you.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs">Current savings balance (₹)</Label>
            <Input
              type="number"
              min={0}
              value={startingSavings}
              onChange={(e) => setStartingSavings(Number(e.target.value) || 0)}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Time horizon</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {PROJECTION_HORIZONS.map((h) => (
                <button
                  key={h.months}
                  onClick={() => setHorizon(h.months)}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                    horizon === h.months
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {h.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-success/10 border border-success/20">
            <p className="text-xs text-muted-foreground">Projected Savings</p>
            <p className="text-lg font-bold text-success">
              {formatCurrency(highlight.savings)}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-xs text-muted-foreground">Net Wealth</p>
            <p className="text-lg font-bold text-primary">
              {formatCurrency(highlight.netWealth)}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
            <p className="text-xs text-muted-foreground">Growth</p>
            <p className="text-lg font-bold text-warning">
              {highlight.growthPct}%
            </p>
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={result.series}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v) =>
                  v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : `₹${v / 1000}k`
                }
              />
              <Tooltip
                formatter={(v: number) => formatCurrency(v)}
                contentStyle={{
                  background: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="savings"
                name="Savings"
                stroke="hsl(var(--success))"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="netWealth"
                name="Net Wealth"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="loanRemaining"
                name="Loan Outstanding"
                stroke="hsl(var(--destructive))"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-2">
          {result.insights.map((i, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2 p-3 rounded-lg bg-accent/40 text-sm"
            >
              <Lightbulb className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <p className="text-foreground/90">{i}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
