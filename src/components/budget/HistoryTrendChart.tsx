import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { HistoryEntry } from "@/utils/localDb";
import { History } from "lucide-react";

interface HistoryTrendChartProps {
  history: HistoryEntry[];
}

export function HistoryTrendChart({ history }: HistoryTrendChartProps) {
  if (history.length < 2) return null;

  // Show last 10 entries, oldest first
  const chartData = history
    .slice(0, 10)
    .reverse()
    .map((entry, index) => ({
      name: new Date(entry.dateSaved).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      savings: entry.savingsRate,
      loans: entry.loanBurden,
      health: entry.healthScore,
      flexibility: entry.flexibilityScore,
    }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card rounded-lg shadow-lg border border-border p-3">
          <p className="font-semibold text-sm mb-1">{label}</p>
          {payload.map((entry: any, i: number) => (
            <p key={i} className="text-xs" style={{ color: entry.stroke }}>
              {entry.name}: {entry.value}%
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card variant="elevated" className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <History className="w-4 h-4 text-primary" />
          Budget Trends
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="savings"
                name="Savings"
                stroke="hsl(38, 92%, 50%)"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="loans"
                name="Loans"
                stroke="hsl(350, 89%, 60%)"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="health"
                name="Health Score"
                stroke="hsl(160, 84%, 39%)"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-4 mt-2 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 rounded bg-chart-savings" />
            <span className="text-muted-foreground">Savings %</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 rounded bg-rose-500" />
            <span className="text-muted-foreground">Loans %</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 rounded bg-primary" />
            <span className="text-muted-foreground">Health Score</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
