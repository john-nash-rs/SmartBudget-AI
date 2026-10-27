import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BudgetTotals, Percentages } from "@/types/budget";

interface BudgetChartsProps {
  income: number;
  totals: BudgetTotals;
  percentages: Percentages;
}

const CHART_COLORS = {
  essentials: "hsl(160, 84%, 39%)",
  lifestyle: "hsl(217, 91%, 60%)",
  loans: "hsl(350, 89%, 60%)",
  savings: "hsl(38, 92%, 50%)",
  remaining: "hsl(215, 16%, 70%)",
};

export function BudgetPieChart({ totals, percentages }: BudgetChartsProps) {
  const data = [
    { name: "Essentials", value: totals.essentialsTotal, pct: percentages.essentials_pct, color: CHART_COLORS.essentials },
    { name: "Lifestyle", value: totals.lifestyleTotal, pct: percentages.lifestyle_pct, color: CHART_COLORS.lifestyle },
    { name: "Loans", value: totals.loansTotal, pct: percentages.loans_pct, color: CHART_COLORS.loans },
    { name: "Savings", value: totals.savingsTotal, pct: percentages.savings_pct, color: CHART_COLORS.savings },
    { name: "Remaining", value: totals.remainingTotal, pct: percentages.remaining_pct, color: CHART_COLORS.remaining },
  ].filter(d => d.value > 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card rounded-lg shadow-lg border border-border p-3">
          <p className="font-semibold text-sm">{data.name}</p>
          <p className="text-primary font-bold">₹{data.value.toLocaleString("en-IN")}</p>
          <p className="text-muted-foreground text-xs">{data.pct}% of income</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle className="text-base">Current Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap justify-center gap-4 mt-4">
          {data.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-muted-foreground">
                {item.name} ({item.pct}%)
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// BudgetComparisonChart removed - replaced by BenchmarkChart component
