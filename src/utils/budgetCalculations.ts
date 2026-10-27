import {
  EssentialExpenses,
  LifestyleExpenses,
  LoanEntry,
  TaxRegime,
  BudgetTotals,
  Percentages,
  BENCHMARK_AVERAGES,
  STRESS_THRESHOLDS,
} from "@/types/budget";

// Indian Tax Slabs (simplified, annual income)
const NEW_REGIME_SLABS = [
  { min: 0, max: 300000, rate: 0 },
  { min: 300000, max: 600000, rate: 5 },
  { min: 600000, max: 900000, rate: 10 },
  { min: 900000, max: 1200000, rate: 15 },
  { min: 1200000, max: 1500000, rate: 20 },
  { min: 1500000, max: Infinity, rate: 30 },
];

const OLD_REGIME_SLABS = [
  { min: 0, max: 250000, rate: 0 },
  { min: 250000, max: 500000, rate: 5 },
  { min: 500000, max: 1000000, rate: 20 },
  { min: 1000000, max: Infinity, rate: 30 },
];

export function calculateAnnualTax(annualIncome: number, regime: TaxRegime): number {
  // Standard deduction for salaried individuals (FY 2024-25)
  const standardDeduction = regime === "new" ? 75000 : 50000;
  const taxableIncome = Math.max(0, annualIncome - standardDeduction);
  const slabs = regime === "new" ? NEW_REGIME_SLABS : OLD_REGIME_SLABS;
  let tax = 0;
  let remainingIncome = taxableIncome;

  for (const slab of slabs) {
    if (remainingIncome <= 0) break;
    const taxableInSlab = Math.min(remainingIncome, slab.max - slab.min);
    tax += (taxableInSlab * slab.rate) / 100;
    remainingIncome -= taxableInSlab;
  }

  // Section 87A rebate: zero tax up to Rs 7L (new) / Rs 5L (old) taxable income
  if (regime === "new" && taxableIncome <= 700000) tax = 0;
  if (regime === "old" && taxableIncome <= 500000) tax = 0;

  // Add 4% cess
  tax = tax * 1.04;

  return Math.round(tax);
}

export function calculateMonthlyTax(monthlyIncome: number, regime: TaxRegime): number {
  const annualIncome = monthlyIncome * 12;
  const annualTax = calculateAnnualTax(annualIncome, regime);
  return Math.round(annualTax / 12);
}

export function calculateEssentialsTotal(essentials: EssentialExpenses): number {
  const baseTotal = essentials.rent + essentials.groceries + essentials.transport + essentials.bills;
  const customTotal = essentials.custom.reduce((sum, item) => sum + item.amount, 0);
  return baseTotal + customTotal;
}

export function calculateLifestyleTotal(lifestyle: LifestyleExpenses): number {
  const baseTotal = lifestyle.eating_out + lifestyle.shopping + lifestyle.entertainment + lifestyle.misc;
  const customTotal = lifestyle.custom.reduce((sum, item) => sum + item.amount, 0);
  return baseTotal + customTotal;
}

export function calculateLoansTotal(loans: LoanEntry[]): number {
  return loans.reduce((sum, loan) => sum + loan.emi, 0);
}

export function calculateTotals(
  grossIncome: number,
  monthlyTax: number,
  essentials: EssentialExpenses,
  lifestyle: LifestyleExpenses,
  loans: LoanEntry[],
  savings: number
): BudgetTotals {
  const netIncome = grossIncome - monthlyTax;
  const essentialsTotal = calculateEssentialsTotal(essentials);
  const lifestyleTotal = calculateLifestyleTotal(lifestyle);
  const loansTotal = calculateLoansTotal(loans);
  const savingsTotal = savings;
  const totalExpenses = essentialsTotal + lifestyleTotal + loansTotal + savingsTotal;
  const remainingTotal = Math.max(0, netIncome - totalExpenses);

  return {
    grossIncome,
    netIncome,
    monthlyTax,
    essentialsTotal,
    lifestyleTotal,
    loansTotal,
    savingsTotal,
    remainingTotal,
    totalExpenses,
  };
}

export function calculatePercentages(netIncome: number, totals: BudgetTotals): Percentages {
  if (netIncome <= 0) {
    return {
      essentials_pct: 0,
      lifestyle_pct: 0,
      loans_pct: 0,
      savings_pct: 0,
      remaining_pct: 0,
    };
  }

  return {
    essentials_pct: Math.round((totals.essentialsTotal / netIncome) * 100),
    lifestyle_pct: Math.round((totals.lifestyleTotal / netIncome) * 100),
    loans_pct: Math.round((totals.loansTotal / netIncome) * 100),
    savings_pct: Math.round((totals.savingsTotal / netIncome) * 100),
    remaining_pct: Math.round((totals.remainingTotal / netIncome) * 100),
  };
}

export interface StressFlag {
  type: "low_savings" | "high_debt" | "low_flexibility";
  label: string;
  severity: "warning" | "danger";
}

export function calculateStressFlags(percentages: Percentages): StressFlag[] {
  const flags: StressFlag[] = [];

  if (percentages.savings_pct < STRESS_THRESHOLDS.lowSavings) {
    flags.push({
      type: "low_savings",
      label: "Low savings buffer",
      severity: percentages.savings_pct < 5 ? "danger" : "warning",
    });
  }

  if (percentages.loans_pct > STRESS_THRESHOLDS.highDebt) {
    flags.push({
      type: "high_debt",
      label: "High debt load",
      severity: percentages.loans_pct > 30 ? "danger" : "warning",
    });
  }

  const fixedCosts = percentages.essentials_pct + percentages.loans_pct;
  if (fixedCosts > STRESS_THRESHOLDS.lowFlexibility) {
    flags.push({
      type: "low_flexibility",
      label: "Low flexibility",
      severity: fixedCosts > 70 ? "danger" : "warning",
    });
  }

  return flags;
}

export function generatePersonalizedInsights(
  netIncome: number,
  percentages: Percentages,
  totals: BudgetTotals
): string[] {
  const insights: string[] = [];

  if (netIncome <= 0) {
    return ["Please enter your monthly income to get personalized insights."];
  }

  if (totals.totalExpenses > netIncome) {
    insights.push(
      `⚠️ Your expenses (₹${totals.totalExpenses.toLocaleString("en-IN")}) exceed your net income (₹${netIncome.toLocaleString("en-IN")}). You need to reduce spending or find additional income.`
    );
    return insights;
  }

  // Prioritized insights based on severity

  // 1. Savings Risk (highest priority)
  const savingsDiff = BENCHMARK_AVERAGES.savings - percentages.savings_pct;
  if (savingsDiff > 5) {
    const targetIncrease = Math.round((savingsDiff / 100) * netIncome);
    insights.push(
      `💰 Your savings rate is ${percentages.savings_pct}%, while professionals with similar income typically save ~${BENCHMARK_AVERAGES.savings}%. Increasing monthly savings by ₹${targetIncrease.toLocaleString("en-IN")} would significantly reduce long-term financial risk.`
    );
  } else if (percentages.savings_pct >= BENCHMARK_AVERAGES.savings) {
    insights.push(
      `✅ Great job! Your savings rate of ${percentages.savings_pct}% exceeds the benchmark of ${BENCHMARK_AVERAGES.savings}%. Consider diversifying into mutual funds, PPF, or NPS for better returns.`
    );
  }

  // 2. Loan Burden
  if (percentages.loans_pct > BENCHMARK_AVERAGES.loans) {
    const excess = percentages.loans_pct - BENCHMARK_AVERAGES.loans;
    const excessAmount = Math.round((excess / 100) * netIncome);
    insights.push(
      `⚠️ Your EMI burden is ${percentages.loans_pct}% of income, above the ${BENCHMARK_AVERAGES.loans}% benchmark. This adds ₹${excessAmount.toLocaleString("en-IN")} extra monthly pressure. Consider refinancing high-interest loans or prioritizing debt payoff.`
    );
  } else if (percentages.loans_pct > 0 && percentages.loans_pct <= BENCHMARK_AVERAGES.loans) {
    insights.push(
      `📊 Your loan EMIs at ${percentages.loans_pct}% are within manageable limits (benchmark: ${BENCHMARK_AVERAGES.loans}%). Keep maintaining timely payments to improve your credit score.`
    );
  }

  // 3. Fixed Cost Rigidity
  const fixedCosts = percentages.essentials_pct + percentages.loans_pct;
  const benchmarkFixed = BENCHMARK_AVERAGES.essentials + BENCHMARK_AVERAGES.loans;
  if (fixedCosts > benchmarkFixed + 10) {
    insights.push(
      `🏠 Your fixed costs (essentials + loans) are ${fixedCosts}% of income, higher than the ${benchmarkFixed}% benchmark. This limits your flexibility for emergencies. Look for ways to reduce fixed expenses like negotiating rent or switching utility providers.`
    );
  }

  // 4. Lifestyle Creep (only flag if savings is low AND lifestyle is high)
  if (percentages.lifestyle_pct > BENCHMARK_AVERAGES.lifestyle && percentages.savings_pct < BENCHMARK_AVERAGES.savings) {
    const lifestyleCut = Math.round(((percentages.lifestyle_pct - BENCHMARK_AVERAGES.lifestyle) / 100) * netIncome);
    insights.push(
      `💡 Your lifestyle spending is ${percentages.lifestyle_pct}% while savings is only ${percentages.savings_pct}%. Consider redirecting ₹${lifestyleCut.toLocaleString("en-IN")} from lifestyle to savings — try meal prepping, reviewing subscriptions, or setting a shopping budget.`
    );
  } else if (percentages.lifestyle_pct <= BENCHMARK_AVERAGES.lifestyle && percentages.savings_pct < BENCHMARK_AVERAGES.savings) {
    // Lifestyle is reasonable but savings still low — don't suggest lifestyle cuts
    insights.push(
      `📊 Your lifestyle spending at ${percentages.lifestyle_pct}% is reasonable. Focus on boosting income or reducing fixed costs to improve savings, rather than cutting lifestyle further.`
    );
  }

  // 5. Unallocated funds
  if (percentages.remaining_pct > 10) {
    insights.push(
      `💎 You have ₹${totals.remainingTotal.toLocaleString("en-IN")} (${percentages.remaining_pct}%) unallocated. Put this to work — consider SIPs, emergency fund top-ups, or additional loan prepayments.`
    );
  }

  // Safety note
  if (insights.length > 0) {
    insights.push(
      `ℹ️ These insights are based on benchmarks for urban Indian professionals and are for educational purposes only, not financial advice.`
    );
  }

  return insights.slice(0, 6); // Max 5 insights + disclaimer
}

export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}
