import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Percentages, BENCHMARK_AVERAGES } from "@/types/budget";
import { Users } from "lucide-react";

interface BenchmarkChartProps {
  percentages: Percentages;
}

const CHART_COLORS = {
  user: "hsl(160, 84%, 39%)",
  benchmark: "hsl(215, 16%, 60%)",
};

export function BenchmarkChart({ percentages }: BenchmarkChartProps) {
  const data = [
    {
      name: "Essentials",
      user: percentages.essentials_pct,
      benchmark: BENCHMARK_AVERAGES.essentials,
    },
    {
      name: "Lifestyle",
      user: percentages.lifestyle_pct,
      benchmark: BENCHMARK_AVERAGES.lifestyle,
    },
    {
      name: "Loans",
      user: percentages.loans_pct,
      benchmark: BENCHMARK_AVERAGES.loans,
    },
    {
      name: "Savings",
      user: percentages.savings_pct,
      benchmark: BENCHMARK_AVERAGES.savings,
    },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card rounded-lg shadow-lg border border-border p-3">
          <p className="font-semibold text-sm mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs" style={{ color: entry.fill }}>
              {entry.name === "user" ? "You" : "Avg. Professional"}: {entry.value}%
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card variant="elevated">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <CardTitle className="text-base">You vs Average Urban Professional</CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Comparing your budget allocation with typical spending patterns
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barGap={4}>
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 11 }} 
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tickFormatter={(v) => `${v}%`} 
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                domain={[0, 60]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="user" 
                name="user"
                radius={[4, 4, 0, 0]}
                fill={CHART_COLORS.user}
              />
              <Bar 
                dataKey="benchmark" 
                name="benchmark"
                radius={[4, 4, 0, 0]}
                fill={CHART_COLORS.benchmark}
                opacity={0.6}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex justify-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: CHART_COLORS.user }} />
            <span className="text-muted-foreground">Your Budget</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded opacity-60" style={{ backgroundColor: CHART_COLORS.benchmark }} />
            <span className="text-muted-foreground">Avg. Urban Professional</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
