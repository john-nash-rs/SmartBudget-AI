import { BudgetPlan } from "@/types/budget";
import { calculateTotals } from "@/utils/budgetCalculations";

export interface ProjectionPoint {
  month: number;
  label: string;
  savings: number;
  netWealth: number;
  loanRemaining: number;
  growthPct: number;
}

export interface ProjectionResult {
  series: ProjectionPoint[];
  insights: string[];
  startingSavings: number;
  monthlySavings: number;
}

export const PROJECTION_HORIZONS: { months: number; label: string }[] = [
  { months: 6, label: "6 Months" },
  { months: 12, label: "1 Year" },
  { months: 36, label: "3 Years" },
  { months: 60, label: "5 Years" },
];

/**
 * Compute future projection of savings & net wealth.
 * Assumptions are intentionally simple & explainable:
 *  - Current monthly savings continue every month
 *  - Loans amortize linearly using remaining tenure (EMI * months left)
 *  - No interest growth on savings (kept neutral for transparency)
 */
export function projectFuture(
  budget: BudgetPlan,
  startingSavings = 0
): ProjectionResult {
  const monthlySavings = budget.savings;
  const loans = budget.loans || [];
  const initialLoanOutstanding = loans.reduce(
    (s, l) => s + l.emi * l.tenure,
    0
  );

  const series: ProjectionPoint[] = PROJECTION_HORIZONS.map(({ months, label }) => {
    const futureSavings = startingSavings + monthlySavings * months;
    // remaining loan: each loan reduces by emi * min(months, tenure)
    const loanPaid = loans.reduce(
      (s, l) => s + l.emi * Math.min(months, l.tenure),
      0
    );
    const loanRemaining = Math.max(0, initialLoanOutstanding - loanPaid);
    const netWealth = futureSavings - loanRemaining;
    const growthPct =
      startingSavings > 0
        ? Math.round(((futureSavings - startingSavings) / startingSavings) * 100)
        : 100;
    return {
      month: months,
      label,
      savings: Math.round(futureSavings),
      netWealth: Math.round(netWealth),
      loanRemaining: Math.round(loanRemaining),
      growthPct,
    };
  });

  const insights: string[] = [];
  const fiveYear = series[series.length - 1];
  const oneYear = series[1];
  const totals = calculateTotals(
    budget.income,
    budget.tax?.monthlyTax || 0,
    budget.essentials,
    budget.lifestyle,
    loans,
    budget.savings
  );

  if (monthlySavings <= 0) {
    insights.push(
      "You currently save ₹0/month, so your wealth will not grow without behavioural changes."
    );
  } else {
    insights.push(
      `At your current pace (₹${monthlySavings.toLocaleString("en-IN")}/month), you could accumulate about ₹${fiveYear.savings.toLocaleString("en-IN")} in savings within 5 years.`
    );
  }
  if (initialLoanOutstanding > 0) {
    insights.push(
      `Loan obligations of ₹${initialLoanOutstanding.toLocaleString("en-IN")} slow wealth accumulation. After 1 year, ₹${oneYear.loanRemaining.toLocaleString("en-IN")} would still be outstanding.`
    );
  }
  const extra = 2000;
  const fiveYearExtra = startingSavings + (monthlySavings + extra) * 60;
  insights.push(
    `Adding just ₹${extra.toLocaleString("en-IN")}/month to savings would grow your 5-year corpus to ₹${fiveYearExtra.toLocaleString("en-IN")} — a ₹${(fiveYearExtra - fiveYear.savings).toLocaleString("en-IN")} difference.`
  );
  if (totals.remainingTotal > 0) {
    insights.push(
      `You also have an unallocated buffer of ₹${totals.remainingTotal.toLocaleString("en-IN")}/month. Channelling it to savings would dramatically accelerate these projections.`
    );
  }
  return { series, insights, startingSavings, monthlySavings };
}
