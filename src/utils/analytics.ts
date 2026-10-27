import { Percentages, BENCHMARK_AVERAGES, STRESS_THRESHOLDS, BudgetTotals } from "@/types/budget";

// ─── Disposable Income ───────────────────────────────────────
export function calculateDisposableIncome(totals: BudgetTotals): number {
  // Income minus fixed obligations (essentials + loans)
  return totals.netIncome - totals.essentialsTotal - totals.loansTotal;
}

// ─── Financial Flexibility Score (0–100) ─────────────────────
// Measures how much income is adjustable (not locked into fixed costs)
export function calculateFlexibilityScore(percentages: Percentages): number {
  const fixedPct = percentages.essentials_pct + percentages.loans_pct;
  // 100% fixed → 0 flexibility; 0% fixed → 100 flexibility
  const raw = Math.max(0, 100 - fixedPct);
  return Math.min(100, Math.round(raw));
}

export function getFlexibilityLabel(score: number): { label: string; color: string } {
  if (score >= 50) return { label: "High", color: "text-success" };
  if (score >= 30) return { label: "Medium", color: "text-warning" };
  return { label: "Low", color: "text-destructive" };
}

// ─── Risk Index ──────────────────────────────────────────────
export type RiskLevel = "Low" | "Medium" | "High";

export function calculateRiskIndex(percentages: Percentages): {
  level: RiskLevel;
  score: number;
  color: string;
  factors: string[];
} {
  let riskScore = 0;
  const factors: string[] = [];

  // Savings factor (0-35)
  if (percentages.savings_pct < 5) {
    riskScore += 35;
    factors.push("Critically low savings");
  } else if (percentages.savings_pct < STRESS_THRESHOLDS.lowSavings) {
    riskScore += 25;
    factors.push("Savings below 10% threshold");
  } else if (percentages.savings_pct < BENCHMARK_AVERAGES.savings) {
    riskScore += 10;
    factors.push("Savings below benchmark");
  }

  // Loan factor (0-35)
  if (percentages.loans_pct > 30) {
    riskScore += 35;
    factors.push("Dangerously high EMI burden");
  } else if (percentages.loans_pct > STRESS_THRESHOLDS.highDebt) {
    riskScore += 25;
    factors.push("EMI burden exceeds safe limit");
  } else if (percentages.loans_pct > BENCHMARK_AVERAGES.loans) {
    riskScore += 10;
    factors.push("Loans above benchmark");
  }

  // Fixed costs factor (0-30)
  const fixedPct = percentages.essentials_pct + percentages.loans_pct;
  if (fixedPct > 70) {
    riskScore += 30;
    factors.push("Extremely rigid budget");
  } else if (fixedPct > STRESS_THRESHOLDS.lowFlexibility) {
    riskScore += 20;
    factors.push("Limited financial flexibility");
  } else if (fixedPct > 50) {
    riskScore += 5;
  }

  let level: RiskLevel = "Low";
  let color = "text-success";
  if (riskScore >= 50) {
    level = "High";
    color = "text-destructive";
  } else if (riskScore >= 25) {
    level = "Medium";
    color = "text-warning";
  }

  return { level, score: Math.min(100, riskScore), color, factors };
}

// ─── Smart Recommendations ───────────────────────────────────
export function generateSmartRecommendations(
  percentages: Percentages,
  totals: BudgetTotals,
  historyLength: number
): string[] {
  const insights: string[] = [];
  const netIncome = totals.netIncome;

  if (netIncome <= 0) return ["Please enter your income to get recommendations."];

  // Multi-factor analysis
  const hasHighLoans = percentages.loans_pct > BENCHMARK_AVERAGES.loans;
  const hasLowSavings = percentages.savings_pct < BENCHMARK_AVERAGES.savings;
  const hasHighFixed = (percentages.essentials_pct + percentages.loans_pct) > 55;
  const hasLifestyleCreep = percentages.lifestyle_pct > BENCHMARK_AVERAGES.lifestyle && hasLowSavings;

  // Context-aware: if savings low due to loans, say so
  if (hasLowSavings && hasHighLoans) {
    const loanAmount = Math.round(totals.loansTotal);
    insights.push(
      `💰 Your savings are low (${percentages.savings_pct}%) primarily due to high loan burden (${percentages.loans_pct}% = ₹${loanAmount.toLocaleString("en-IN")}/month), not lifestyle. Focus on loan payoff first.`
    );
  } else if (hasLowSavings && hasLifestyleCreep) {
    const lifestyleCut = Math.round(((percentages.lifestyle_pct - BENCHMARK_AVERAGES.lifestyle) / 100) * netIncome);
    insights.push(
      `💰 Your savings rate of ${percentages.savings_pct}% is below the ${BENCHMARK_AVERAGES.savings}% target. Redirecting ₹${lifestyleCut.toLocaleString("en-IN")} from lifestyle spending would close the gap.`
    );
  } else if (hasLowSavings) {
    const targetIncrease = Math.round(((BENCHMARK_AVERAGES.savings - percentages.savings_pct) / 100) * netIncome);
    insights.push(
      `💰 Increase monthly savings by ₹${targetIncrease.toLocaleString("en-IN")} to reach the ${BENCHMARK_AVERAGES.savings}% benchmark. Start with auto-debit SIPs on salary day.`
    );
  } else {
    insights.push(
      `✅ Great savings rate at ${percentages.savings_pct}%! Consider diversifying into PPF, ELSS, or NPS for tax-efficient growth.`
    );
  }

  // Loan-specific
  if (hasHighLoans) {
    insights.push(
      `⚠️ EMI burden at ${percentages.loans_pct}% exceeds the safe ${BENCHMARK_AVERAGES.loans}% limit. Prioritize paying off the highest-interest loan first (credit cards > personal > car > education).`
    );
  }

  // Forward-looking: loan end prediction
  if (hasHighLoans) {
    insights.push(
      `📈 Once your current EMIs reduce, redirect that exact amount to savings — don't let lifestyle creep absorb freed-up income.`
    );
  }

  // Fixed cost rigidity
  if (hasHighFixed && !hasHighLoans) {
    insights.push(
      `🏠 Fixed costs are ${percentages.essentials_pct + percentages.loans_pct}% of income. Explore reducing rent (shared housing, relocation) or switching utility providers to free up budget.`
    );
  }

  // Lifestyle creep warning
  if (hasLifestyleCreep && !hasHighLoans) {
    insights.push(
      `💡 Lifestyle spending (${percentages.lifestyle_pct}%) is above benchmark while savings lag. Track spending for 30 days and apply the 48-hour purchase rule for non-essentials.`
    );
  }

  // Unallocated funds
  if (percentages.remaining_pct > 10) {
    insights.push(
      `💎 You have ${percentages.remaining_pct}% unallocated funds (₹${totals.remainingTotal.toLocaleString("en-IN")}). Put this to work — SIPs, emergency fund, or loan prepayments.`
    );
  }

  // History-based
  if (historyLength >= 2) {
    insights.push(
      `📊 You have ${historyLength} budget snapshots. Check the Trends section to see how your finances have evolved over time.`
    );
  }

  insights.push(
    `ℹ️ Insights are based on benchmarks for urban Indian professionals (22-30, Tier-1 cities) and are educational, not financial advice.`
  );

  return insights.slice(0, 6);
}
