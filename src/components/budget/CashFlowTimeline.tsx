import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BudgetTotals } from "@/types/budget";
import { formatCurrency } from "@/utils/budgetCalculations";
import { ArrowRight, TrendingDown } from "lucide-react";

interface CashFlowTimelineProps {
  totals: BudgetTotals;
}

interface FlowSegment {
  label: string;
  amount: number;
  color: string;
  percentage: number;
}

export function CashFlowTimeline({ totals }: CashFlowTimelineProps) {
  const { netIncome, essentialsTotal, loansTotal, savingsTotal, lifestyleTotal, remainingTotal } = totals;

  if (netIncome <= 0) return null;

  const segments: FlowSegment[] = [
    {
      label: "Essentials",
      amount: essentialsTotal,
      color: "bg-chart-essentials",
      percentage: (essentialsTotal / netIncome) * 100,
    },
    {
      label: "Loans",
      amount: loansTotal,
      color: "bg-rose-500",
      percentage: (loansTotal / netIncome) * 100,
    },
    {
      label: "Savings",
      amount: savingsTotal,
      color: "bg-chart-savings",
      percentage: (savingsTotal / netIncome) * 100,
    },
    {
      label: "Lifestyle",
      amount: lifestyleTotal,
      color: "bg-chart-lifestyle",
      percentage: (lifestyleTotal / netIncome) * 100,
    },
    {
      label: "Buffer",
      amount: remainingTotal,
      color: "bg-chart-remaining",
      percentage: (remainingTotal / netIncome) * 100,
    },
  ].filter((s) => s.amount > 0);

  const fixedCosts = essentialsTotal + loansTotal;
  const fixedPercentage = Math.round((fixedCosts / netIncome) * 100);

  return (
    <Card variant="elevated" className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-primary" />
          Monthly Cash Flow
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Flow visualization */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-muted-foreground">Net Income</span>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-primary">
              {formatCurrency(netIncome)}
            </span>
          </div>

          {/* Stacked bar */}
          <div className="h-8 rounded-lg overflow-hidden flex bg-muted">
            {segments.map((segment, index) => (
              <div
                key={segment.label}
                className={`${segment.color} relative transition-all duration-500 group cursor-pointer`}
                style={{ width: `${segment.percentage}%` }}
                title={`${segment.label}: ${formatCurrency(segment.amount)}`}
              >
                {segment.percentage >= 10 && (
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white opacity-80">
                    {Math.round(segment.percentage)}%
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-3">
            {segments.map((segment) => (
              <div key={segment.label} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${segment.color}`} />
                <span className="text-xs text-muted-foreground">{segment.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Flow breakdown */}
        <div className="space-y-2 pt-4 border-t border-border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Fixed obligations (Essentials + Loans)</span>
            <span className="font-medium text-foreground">
              {formatCurrency(fixedCosts)} ({fixedPercentage}%)
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Discretionary + Savings</span>
            <span className="font-medium text-foreground">
              {formatCurrency(lifestyleTotal + savingsTotal)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm pt-2 border-t border-border/50">
            <span className="text-muted-foreground font-medium">Remaining buffer</span>
            <span className={`font-bold ${remainingTotal > 0 ? "text-success" : "text-destructive"}`}>
              {formatCurrency(remainingTotal)}
            </span>
          </div>
        </div>

        {/* Insight */}
        <div className="mt-4 p-3 rounded-lg bg-accent/50">
          <p className="text-sm text-accent-foreground">
            💡 After fixed costs, you retain{" "}
            <span className="font-semibold">
              {formatCurrency(netIncome - fixedCosts)}
            </span>{" "}
            per month for flexibility. 
            {remainingTotal > netIncome * 0.1 
              ? " Consider investing the buffer for better returns."
              : remainingTotal > 0 
                ? " This buffer helps handle unexpected expenses."
                : " Building an emergency buffer should be a priority."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
