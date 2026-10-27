import { BudgetPlan } from "@/types/budget";
import { calculateTotals } from "@/utils/budgetCalculations";

export type GoalPriority = "high" | "medium" | "low";
export type GoalFeasibility = "On Track" | "Challenging" | "Unrealistic";
export type GoalHealth = "green" | "yellow" | "red";

export interface FinancialGoal {
  id: string;
  name: string;
  amount: number;
  targetDate: string; // ISO yyyy-mm-dd
  priority: GoalPriority;
  savedSoFar: number;
  createdAt: string;
}

export interface GoalAnalysis {
  monthsRemaining: number;
  requiredMonthly: number;
  progressPct: number;
  feasibility: GoalFeasibility;
  probability: number;
  health: GoalHealth;
  estimatedCompletion: string; // human readable
  recommendation: string;
}

function monthsBetween(target: string): number {
  const t = new Date(target);
  const now = new Date();
  const months =
    (t.getFullYear() - now.getFullYear()) * 12 +
    (t.getMonth() - now.getMonth());
  return Math.max(1, months);
}

export function analyzeGoal(
  goal: FinancialGoal,
  budget: BudgetPlan | null
): GoalAnalysis {
  const monthsRemaining = monthsBetween(goal.targetDate);
  const remainingAmount = Math.max(0, goal.amount - goal.savedSoFar);
  const requiredMonthly = Math.ceil(remainingAmount / monthsRemaining);
  const progressPct = Math.min(
    100,
    Math.round((goal.savedSoFar / goal.amount) * 100)
  );

  let availableMonthly = 0;
  if (budget) {
    const totals = calculateTotals(
      budget.income,
      budget.tax?.monthlyTax || 0,
      budget.essentials,
      budget.lifestyle,
      budget.loans || [],
      budget.savings
    );
    // What user could realistically allocate = current savings + remaining buffer
    availableMonthly = budget.savings + totals.remainingTotal;
  }

  // Probability: ratio of available to required, capped to 100
  const ratio = availableMonthly > 0 ? availableMonthly / requiredMonthly : 0;
  let probability = Math.min(100, Math.round(ratio * 100));
  // Loan burden penalty
  if (budget && budget.percentages.loans_pct > 25) probability -= 15;
  if (budget && budget.percentages.savings_pct < 10) probability -= 10;
  probability = Math.max(0, Math.min(100, probability));

  let feasibility: GoalFeasibility = "On Track";
  let health: GoalHealth = "green";
  if (probability < 40) {
    feasibility = "Unrealistic";
    health = "red";
  } else if (probability < 75) {
    feasibility = "Challenging";
    health = "yellow";
  }

  // Estimated completion using current available savings
  let estimatedCompletion = "Goal already met 🎉";
  if (remainingAmount > 0) {
    if (availableMonthly <= 0) {
      estimatedCompletion = "Cannot estimate — no monthly savings available";
    } else {
      const monthsNeeded = Math.ceil(remainingAmount / availableMonthly);
      const d = new Date();
      d.setMonth(d.getMonth() + monthsNeeded);
      estimatedCompletion = d.toLocaleString("en-IN", {
        month: "short",
        year: "numeric",
      });
    }
  }

  // Recommendation
  let recommendation = "";
  if (feasibility === "On Track") {
    recommendation = `Your ${goal.name} goal is currently on track. Keep saving ₹${requiredMonthly.toLocaleString("en-IN")}/month.`;
  } else if (feasibility === "Challenging") {
    const gap = Math.max(0, requiredMonthly - availableMonthly);
    recommendation = `To hit ₹${goal.amount.toLocaleString("en-IN")} by ${new Date(goal.targetDate).toLocaleString("en-IN", { month: "short", year: "numeric" })}, increase monthly savings by ₹${gap.toLocaleString("en-IN")}.`;
  } else {
    recommendation = `Current pace makes this goal unrealistic. Consider extending the target date, reducing the amount, or freeing up ₹${requiredMonthly.toLocaleString("en-IN")}/month by trimming lifestyle spend.`;
  }

  return {
    monthsRemaining,
    requiredMonthly,
    progressPct,
    feasibility,
    probability,
    health,
    estimatedCompletion,
    recommendation,
  };
}
