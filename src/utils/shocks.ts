import { BudgetPlan, Percentages } from "@/types/budget";
import {
  calculateTotals,
  calculatePercentages,
} from "@/utils/budgetCalculations";
import { calculateHealthScore } from "@/components/budget/HealthScore";
import { calculateRiskIndex, calculateFlexibilityScore } from "@/utils/analytics";

export type ShockType =
  | "income_reduction"
  | "job_loss"
  | "medical"
  | "education"
  | "interest_rate";

export interface ShockOption {
  label: string;
  value: number;
}

export interface ShockMetric {
  netIncome: number;
  monthlySavings: number;
  percentages: Percentages;
  healthScore: number;
  flexibility: number;
  riskLevel: string;
  monthsOfBufferCovered: number;
}

export interface ShockResult {
  before: ShockMetric;
  after: ShockMetric;
  diff: {
    netIncome: number;
    savings: number;
    healthScore: number;
    flexibility: number;
  };
  insight: string;
  shockType: ShockType;
  optionLabel: string;
}

export const SHOCK_OPTIONS: Record<
  ShockType,
  { title: string; subtitle: string; options: ShockOption[]; icon: string }
> = {
  income_reduction: {
    title: "Income Reduction",
    subtitle: "Salary cut due to slowdown or role change",
    icon: "💸",
    options: [
      { label: "10%", value: 10 },
      { label: "20%", value: 20 },
      { label: "30%", value: 30 },
    ],
  },
  job_loss: {
    title: "Job Loss",
    subtitle: "Zero income for a period of time",
    icon: "🧳",
    options: [
      { label: "1 Month", value: 1 },
      { label: "3 Months", value: 3 },
      { label: "6 Months", value: 6 },
    ],
  },
  medical: {
    title: "Medical Expense",
    subtitle: "Unexpected one-time hospital cost",
    icon: "🏥",
    options: [
      { label: "₹25,000", value: 25000 },
      { label: "₹50,000", value: 50000 },
      { label: "₹1,00,000", value: 100000 },
    ],
  },
  education: {
    title: "Education Cost",
    subtitle: "Course, exam or upskilling expense",
    icon: "🎓",
    options: [
      { label: "₹20,000", value: 20000 },
      { label: "₹50,000", value: 50000 },
      { label: "₹1,00,000", value: 100000 },
    ],
  },
  interest_rate: {
    title: "Interest Rate Hike",
    subtitle: "EMIs increase due to RBI rate revision",
    icon: "📈",
    options: [
      { label: "+5% EMI", value: 5 },
      { label: "+10% EMI", value: 10 },
    ],
  },
};

function buildMetric(
  budget: BudgetPlan,
  overrides: {
    grossIncome?: number;
    monthlyTax?: number;
    loanEmiMultiplier?: number;
    savingsOverride?: number;
    oneTimeBufferDraw?: number;
  } = {}
): ShockMetric {
  const grossIncome = overrides.grossIncome ?? budget.income;
  const monthlyTax = overrides.monthlyTax ?? budget.tax?.monthlyTax ?? 0;
  const loans = (budget.loans || []).map((l) => ({
    ...l,
    emi: Math.round(l.emi * (overrides.loanEmiMultiplier ?? 1)),
  }));
  const savings =
    overrides.savingsOverride !== undefined ? overrides.savingsOverride : budget.savings;
  const totals = calculateTotals(
    grossIncome,
    monthlyTax,
    budget.essentials,
    budget.lifestyle,
    loans,
    savings
  );
  const percentages = calculatePercentages(totals.netIncome, totals);
  const { score } = calculateHealthScore(percentages, totals.remainingTotal > 0);
  const flexibility = calculateFlexibilityScore(percentages);
  const risk = calculateRiskIndex(percentages);
  // Buffer = current savings + remaining buffer; how many months of essentials+loans it covers
  const monthlyEssentialsAndLoans = totals.essentialsTotal + totals.loansTotal;
  const totalBuffer =
    (overrides.savingsOverride !== undefined
      ? Math.max(0, overrides.savingsOverride)
      : budget.savings) - (overrides.oneTimeBufferDraw ?? 0);
  const monthsOfBufferCovered =
    monthlyEssentialsAndLoans > 0
      ? Math.max(0, totalBuffer / monthlyEssentialsAndLoans)
      : 0;
  return {
    netIncome: totals.netIncome,
    monthlySavings: savings,
    percentages,
    healthScore: score,
    flexibility,
    riskLevel: risk.level,
    monthsOfBufferCovered: Math.round(monthsOfBufferCovered * 10) / 10,
  };
}

export function simulateShock(
  budget: BudgetPlan,
  shockType: ShockType,
  optionValue: number,
  optionLabel: string
): ShockResult {
  const before = buildMetric(budget);
  let after: ShockMetric;
  let insight = "";
  const monthlyEssLoans =
    before.percentages.essentials_pct + before.percentages.loans_pct;
  const monthlyOutgoEstimate =
    (monthlyEssLoans / 100) * before.netIncome || 0;

  switch (shockType) {
    case "income_reduction": {
      const reducedGross = Math.round(budget.income * (1 - optionValue / 100));
      // Naive: tax scales linearly
      const reducedTax = Math.round(
        (budget.tax?.monthlyTax || 0) * (1 - optionValue / 100)
      );
      after = buildMetric(budget, {
        grossIncome: reducedGross,
        monthlyTax: reducedTax,
      });
      insight = `A ${optionValue}% income cut reduces your net pay to ₹${after.netIncome.toLocaleString("en-IN")}. Your savings rate moves from ${before.percentages.savings_pct}% to ${after.percentages.savings_pct}%, and health score from ${before.healthScore} to ${after.healthScore}.`;
      break;
    }
    case "job_loss": {
      // Treat as months without income: buffer drawn = months * (essentials+loans)
      const draw = monthlyOutgoEstimate * optionValue;
      after = buildMetric(budget, {
        savingsOverride: Math.max(0, budget.savings - draw),
        oneTimeBufferDraw: draw,
      });
      const monthsCovered =
        monthlyOutgoEstimate > 0 ? budget.savings / monthlyOutgoEstimate : 0;
      insight = `If you lost income for ${optionValue} month(s), your current reserves of ₹${budget.savings.toLocaleString("en-IN")} would cover ~${monthsCovered.toFixed(1)} months of essential + loan expenses (₹${Math.round(monthlyOutgoEstimate).toLocaleString("en-IN")}/mo).`;
      break;
    }
    case "medical":
    case "education": {
      after = buildMetric(budget, {
        savingsOverride: Math.max(0, budget.savings - optionValue / 12), // assume amortised over the year impact
        oneTimeBufferDraw: optionValue,
      });
      const yearSavings = budget.savings * 12;
      const impactPct =
        yearSavings > 0 ? Math.round((optionValue / yearSavings) * 100) : 100;
      insight = `An unexpected ${shockType === "medical" ? "medical" : "education"} expense of ₹${optionValue.toLocaleString("en-IN")} would consume ${impactPct}% of your projected 1-year savings (₹${yearSavings.toLocaleString("en-IN")}).`;
      break;
    }
    case "interest_rate": {
      const multiplier = 1 + optionValue / 100;
      after = buildMetric(budget, { loanEmiMultiplier: multiplier });
      const extra =
        Math.round((after.percentages.loans_pct - before.percentages.loans_pct) * before.netIncome) /
        100;
      insight = `A ${optionValue}% EMI hike pushes your loan burden from ${before.percentages.loans_pct}% to ${after.percentages.loans_pct}% of net income (~₹${Math.max(0, Math.round(extra)).toLocaleString("en-IN")}/month extra).`;
      break;
    }
  }

  return {
    before,
    after: after!,
    diff: {
      netIncome: after!.netIncome - before.netIncome,
      savings: after!.percentages.savings_pct - before.percentages.savings_pct,
      healthScore: after!.healthScore - before.healthScore,
      flexibility: after!.flexibility - before.flexibility,
    },
    insight,
    shockType,
    optionLabel,
  };
}
