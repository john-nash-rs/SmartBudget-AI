import { BudgetPlan, BENCHMARK_AVERAGES } from "@/types/budget";
import { calculateTotals, formatCurrency } from "@/utils/budgetCalculations";
import { calculateHealthScore } from "@/components/budget/HealthScore";
import { calculateFlexibilityScore, calculateRiskIndex } from "@/utils/analytics";
import { projectFuture } from "@/utils/projections";
import { getGoals } from "@/utils/localDb";
import { analyzeGoal } from "@/utils/goals";

export type Intent =
  | "SAVINGS_LOW"
  | "SAVINGS_GOOD"
  | "LOANS_HIGH"
  | "LOANS_OK"
  | "TAX_QUESTION"
  | "AFFORD_EMI"
  | "LOAN_END"
  | "IMPROVE_SCORE"
  | "EXPLAIN_SCORE"
  | "EXPLAIN_CHART"
  | "EXPLAIN_ALERT"
  | "GENERAL_SAVINGS"
  | "GENERAL_EMERGENCY"
  | "GENERAL_LOANS"
  | "GENERAL_TAX"
  | "GENERAL_INSURANCE"
  | "GENERAL_EDUCATION"
  | "GENERAL_LIFESTYLE"
  | "GENERAL_BUDGETING"
  | "GENERAL_INVESTMENT"
  | "LEARN_EMI"
  | "LEARN_SAVINGS_RATE"
  | "LEARN_BUDGET"
  | "SIMULATOR_GUIDE"
  | "EXPLAIN_BUDGET"
  | "FUTURE_PROJECTION"
  | "SHOCK_JOB_LOSS"
  | "SHOCK_GENERAL"
  | "GOAL_FEASIBILITY"
  | "GREETING"
  | "UNKNOWN";

// Knowledge base for general financial topics
export const KNOWLEDGE_BASE: Record<string, string> = {
  savings: `
**Savings Basics for Young Professionals**

A healthy savings rate is 15-20% of your net income. Here's how to build savings:

1. **Pay yourself first** — Set up auto-debit SIPs on salary day
2. **Emergency fund** — Keep 3-6 months of expenses in liquid funds
3. **Start small** — Even ₹5,000/month compounds to ₹7+ lakhs in 10 years
4. **Use the 50-30-20 guideline** — 50% needs, 30% wants, 20% savings (adjusted for Indian context: 45-31-20)

Popular options: PPF (tax-free), ELSS (tax-saving + growth), NPS (retirement + tax), Liquid funds (emergency).
  `.trim(),

  emergency: `
**Emergency Fund Guide**

An emergency fund protects you from unexpected job loss, medical bills, or urgent repairs.

**How much?** 3-6 months of essential expenses (not full salary)
**Where to keep it?** Liquid mutual funds or high-yield savings accounts
**Don't touch it** for planned expenses — that's what savings are for

For a ₹50K/month essential spend, aim for ₹1.5-3 lakhs in emergency fund.
  `.trim(),

  loans: `
**Managing Loans & EMIs**

Keep total EMIs under 40% of net income (ideally under 20%). 

**Priority order for debt payoff:**
1. Credit card debt (highest interest: 24-42%)
2. Personal loans (12-18%)
3. Car loans (8-12%)
4. Education loans (8-10%, often tax-deductible)
5. Home loans (lowest priority, longest tenure)

**Tips:**
- Consider balance transfer for high-interest debt
- Make partial prepayments when you have surplus
- Never skip EMIs — it hurts your credit score
  `.trim(),

  tax: `
**Income Tax in India (Simplified)**

**New Tax Regime (FY 2024-25):**
- ₹0-3L: No tax
- ₹3-7L: 5%
- ₹7-10L: 10%
- ₹10-12L: 15%
- ₹12-15L: 20%
- ₹15L+: 30%

**Old Regime** has higher rates but allows deductions (80C, HRA, etc.)

Choose New Regime if you don't have major deductions. Use the app's tax calculator to compare!

**Pro tip:** Standard deduction of ₹75,000 applies in new regime from FY 2024-25.
  `.trim(),

  insurance: `
**Insurance Essentials**

**Health Insurance:** Minimum ₹5-10 lakhs cover. Check if employer cover is sufficient.

**Term Life Insurance:** If you have dependents, get 10-15x annual income coverage. Pure term plans are cheapest.

**What to avoid:** 
- ULIPs (high charges)
- Endowment/money-back policies (low returns)
- Over-insuring (insurance ≠ investment)

**Rule:** Buy term insurance, invest the rest in mutual funds.
  `.trim(),

  education: `
**Education Loan Tips**

Education loans have some benefits:
- Interest is tax-deductible under Section 80E
- Usually lower interest rates (8-10%)
- Grace period before repayment starts

**Strategy:**
1. Start EMI during moratorium if possible (reduces total interest)
2. Prepay when you get bonuses
3. Consider refinancing after 2-3 years of work experience

An ₹8,000 EMI for 4 years = ₹3.84L paid. Plan accordingly!
  `.trim(),

  lifestyle: `
**Avoiding Lifestyle Creep**

Lifestyle creep = expenses rising with income, leaving savings unchanged.

**Signs:**
- Upgrading phone/car with every raise
- Dining out more than cooking
- Subscriptions you don't use

**Solutions:**
1. Save the raise — increase SIP when salary increases
2. Track spending for 30 days
3. Set a "fun budget" and stick to it
4. Wait 48 hours before non-essential purchases

The goal: Live on 80% of income, save 20%.
  `.trim(),

  investment: `
**Investment Basics for Beginners**

Start investing early — even small amounts grow significantly over time thanks to compounding.

**Simple Options (Low to High Risk):**
1. **PPF (Public Provident Fund)** — Tax-free, 7-8% returns, 15-year lock-in
2. **Fixed Deposits** — Guaranteed returns, flexible tenure
3. **Liquid Mutual Funds** — Better than savings account, easy withdrawal
4. **ELSS (Equity Linked Savings)** — Tax-saving + market growth, 3-year lock-in
5. **Index Funds / SIPs** — Best for long-term wealth building

**Rules:**
- Emergency fund first, then invest
- SIPs beat lump sum for most people
- Don't invest what you can't afford to lose in equity
- Start with ₹500-1,000/month SIP — consistency matters more than amount
  `.trim(),

  budgeting: `
**Budgeting Basics**

A budget is simply: Income - Expenses - Savings = Zero (ideally)

**Steps:**
1. Track income (net, after tax)
2. List fixed costs (rent, EMIs, utilities)
3. Estimate variable costs (food, transport, lifestyle)
4. Allocate savings FIRST, not what's left

**Indian Benchmark (22-30, Tier-1 cities):**
- Essentials: 45%
- Lifestyle: 31%
- Loans: 14%
- Savings: 20%
- (Totals over 100% if you have loans — meaning you need to earn more or cut elsewhere)

Use this app to see where you stand!
  `.trim(),
};

// Intent detection using keyword matching
export function detectIntent(message: string, budget: BudgetPlan | null): Intent {
  const lower = message.toLowerCase();

  // Greetings
  if (/^(hi|hello|hey|namaste|hii+)\b/.test(lower)) {
    return "GREETING";
  }

  // Future projection
  if (/(save|saving|wealth|net worth).*(5 ?years?|3 ?years?|1 ?year|future|projection|long term)/.test(lower) ||
      /how much.*save.*in/.test(lower) ||
      /(future|long.?term|projection)/.test(lower)) {
    return "FUTURE_PROJECTION";
  }

  // Shock / job loss
  if (/lose.*job|job.*loss|laid off|fired|unemploy/.test(lower)) {
    return "SHOCK_JOB_LOSS";
  }
  if (/medical|emergency.*expense|hospital|salary cut|income.*reduc|shock|interest rate|rate hike/.test(lower)) {
    return "SHOCK_GENERAL";
  }

  // Goals
  if (/can i afford.*goal|realistic.*goal|goal.*feasib|reach.*goal|achieve.*goal|my goal/.test(lower)) {
    return "GOAL_FEASIBILITY";
  }


  // Score-related
  if (/improve.*score|increase.*score|better.*score|raise.*score/.test(lower)) {
    return "IMPROVE_SCORE";
  }
  if (/explain.*score|how.*score.*calculated|what.*score.*mean/.test(lower)) {
    return "EXPLAIN_SCORE";
  }

  // Chart/graph related
  if (/explain.*chart|explain.*graph|what.*chart.*mean|understand.*chart/.test(lower)) {
    return "EXPLAIN_CHART";
  }

  // Alert related
  if (/explain.*alert|why.*alert|what.*warning|explain.*warning/.test(lower)) {
    return "EXPLAIN_ALERT";
  }

  // Simulator
  if (/simulator|what.*if|scenario|try.*different/.test(lower)) {
    return "SIMULATOR_GUIDE";
  }

  // Learning mode - simple explanations
  if (/what is.*emi|what.*emi.*mean|define.*emi|emi\?/.test(lower)) {
    return "LEARN_EMI";
  }
  if (/what is.*(good )?savings rate|ideal.*savings|good.*savings.*rate/.test(lower)) {
    return "LEARN_SAVINGS_RATE";
  }
  if (/what is.*budget|how.*budget.*work|explain.*budget$/.test(lower)) {
    return "LEARN_BUDGET";
  }
  if (/explain.*my.*budget|explain budget|my budget|breakdown/.test(lower)) {
    return "EXPLAIN_BUDGET";
  }

  // Savings specific
  if (/why.*(savings?|saving).*(low|less)|savings?.*low/.test(lower)) {
    return budget && budget.percentages.savings_pct < 15 ? "SAVINGS_LOW" : "SAVINGS_GOOD";
  }
  if (/how much.*save|should.*save|saving.*income/.test(lower)) {
    return "GENERAL_SAVINGS";
  }
  if (/how.*improve.*financ|improve.*my.*financ/.test(lower)) {
    return "IMPROVE_SCORE";
  }

  // Loans specific
  if (/loan.*(too high|risky|dangerous)|emi.*(high|risky)|is.*loan.*okay/.test(lower)) {
    return budget && budget.percentages.loans_pct > 20 ? "LOANS_HIGH" : "LOANS_OK";
  }
  if (/afford.*emi|take.*loan|can.*borrow|new.*loan/.test(lower)) {
    return "AFFORD_EMI";
  }
  if (/loan.*end|education.*end|when.*loan.*finish|after.*loan/.test(lower)) {
    return "LOAN_END";
  }

  // Tax
  if (/tax|regime|old.*regime|new.*regime|income.*tax/.test(lower)) {
    return budget ? "TAX_QUESTION" : "GENERAL_TAX";
  }

  // General topics
  if (/emergency|rainy.*day|backup/.test(lower)) {
    return "GENERAL_EMERGENCY";
  }
  if (/insurance|term.*plan|health.*cover/.test(lower)) {
    return "GENERAL_INSURANCE";
  }
  if (/invest|mutual fund|sip|ppf|nps|elss/.test(lower)) {
    return "GENERAL_INVESTMENT";
  }
  if (/education|study|college/.test(lower)) {
    return "GENERAL_EDUCATION";
  }
  if (/lifestyle.*creep|spending.*habit|overspend/.test(lower)) {
    return "GENERAL_LIFESTYLE";
  }
  if (/budget|budgeting|how.*start|basic/.test(lower)) {
    return "GENERAL_BUDGETING";
  }
  if (/loan|emi|debt/.test(lower)) {
    return "GENERAL_LOANS";
  }
  if (/save|savings|invest/.test(lower)) {
    return "GENERAL_SAVINGS";
  }

  return "UNKNOWN";
}

// Generate context-aware response
export function generateResponse(intent: Intent, budget: BudgetPlan | null): string {
  // If no budget data, provide general responses
  if (!budget) {
    switch (intent) {
      case "GREETING":
        return "Hi there! 👋 I'm BudgetBuddy. To give you personalized advice, please complete your budget inputs first. You can ask me general questions about savings, loans, taxes, or insurance in the meantime!";
      case "GENERAL_SAVINGS":
        return KNOWLEDGE_BASE.savings;
      case "GENERAL_EMERGENCY":
        return KNOWLEDGE_BASE.emergency;
      case "GENERAL_LOANS":
        return KNOWLEDGE_BASE.loans;
      case "GENERAL_TAX":
        return KNOWLEDGE_BASE.tax;
      case "GENERAL_INSURANCE":
        return KNOWLEDGE_BASE.insurance;
      case "GENERAL_EDUCATION":
        return KNOWLEDGE_BASE.education;
      case "GENERAL_LIFESTYLE":
        return KNOWLEDGE_BASE.lifestyle;
      case "GENERAL_BUDGETING":
        return KNOWLEDGE_BASE.budgeting;
      case "GENERAL_INVESTMENT":
        return KNOWLEDGE_BASE.investment;
      case "LEARN_EMI":
        return "**EMI (Equated Monthly Installment)** is a fixed monthly payment you make to repay a loan. It includes both principal and interest. The higher the interest rate or longer the tenure, the more you pay overall.";
      case "LEARN_SAVINGS_RATE":
        return "**A good savings rate** is 15-20% of your net (after-tax) income. For urban Indian professionals earning ₹4-15 LPA, the benchmark is 20%. Even 10% is a decent start if you have high loan obligations.";
      case "LEARN_BUDGET":
        return "**A budget** is a plan for your money. It tracks: Income → Fixed costs (rent, bills, EMIs) → Variable costs (food, lifestyle) → Savings. The goal is to make sure every rupee has a purpose, with savings prioritized first.";
      default:
        return "I'd love to help! Please complete your budget inputs so I can give you personalized advice. Or ask me about savings, loans, taxes, investments, or budgeting basics.";
    }
  }

  // Context-aware responses with budget data
  const totals = calculateTotals(
    budget.income,
    budget.tax?.monthlyTax || 0,
    budget.essentials,
    budget.lifestyle,
    budget.loans || [],
    budget.savings
  );
  const { score } = calculateHealthScore(budget.percentages, totals.remainingTotal > 0);

  switch (intent) {
    case "GREETING":
      return `Hi! 👋 I'm BudgetBuddy. I can see your budget data. Your health score is ${score}/100 and you're saving ${budget.percentages.savings_pct}% of your income. What would you like to know?`;

    case "SAVINGS_LOW":
      const savingsGap = BENCHMARK_AVERAGES.savings - budget.percentages.savings_pct;
      const savingsAmount = Math.round((savingsGap / 100) * totals.netIncome);
      return `Your savings rate is ${budget.percentages.savings_pct}%, which is below the recommended ${BENCHMARK_AVERAGES.savings}% for your income range.

**Why it's low:**
${budget.percentages.loans_pct > BENCHMARK_AVERAGES.loans ? `- Your EMIs (${budget.percentages.loans_pct}%) are consuming a large portion of income` : ""}
${budget.percentages.lifestyle_pct > BENCHMARK_AVERAGES.lifestyle ? `- Lifestyle spending (${budget.percentages.lifestyle_pct}%) is above benchmark` : ""}
${budget.percentages.essentials_pct > 50 ? `- Fixed costs (${budget.percentages.essentials_pct}%) leave little room` : ""}

**Action:** Try to increase savings by ${formatCurrency(savingsAmount)}/month to reach the ${BENCHMARK_AVERAGES.savings}% benchmark. Start with a SIP of even ${formatCurrency(Math.round(savingsAmount / 2))}.`;

    case "SAVINGS_GOOD":
      return `Good news! Your savings rate of ${budget.percentages.savings_pct}% is ${budget.percentages.savings_pct >= BENCHMARK_AVERAGES.savings ? "at or above" : "close to"} the ${BENCHMARK_AVERAGES.savings}% benchmark. 

Consider diversifying: PPF for tax-free returns, ELSS for tax-saving, and liquid funds for your emergency buffer.`;

    case "LOANS_HIGH":
      return `Your EMI burden is ${budget.percentages.loans_pct}% of net income, which is above the ${BENCHMARK_AVERAGES.loans}% benchmark.

**This is concerning because:**
- It limits your ability to save (currently ${budget.percentages.savings_pct}%)
- You have less buffer for emergencies
- Taking new loans becomes risky

**Recommendations:**
1. Avoid taking any new loans until this drops below 20%
2. Consider prepaying the highest-interest loan
3. Look into balance transfer for better rates

Use the Scenario Simulator to see how things improve when a loan ends!`;

    case "LOANS_OK":
      return `Your EMI obligations at ${budget.percentages.loans_pct}% are within manageable limits (benchmark: ${BENCHMARK_AVERAGES.loans}%). 

Keep making timely payments to build your credit score. If you have surplus, consider partial prepayments to save on interest.`;

    case "AFFORD_EMI":
      const currentLoans = budget.percentages.loans_pct;
      const maxEmi = Math.round(((20 - currentLoans) / 100) * totals.netIncome);
      return maxEmi > 0
        ? `Based on your current budget, you could take on an additional EMI of up to ${formatCurrency(maxEmi)}/month without exceeding the 20% debt benchmark.

However, consider:
- Your savings rate is ${budget.percentages.savings_pct}% (target: 20%)
- New debt will reduce flexibility

Only take a new loan if absolutely necessary!`
        : `You're already at ${currentLoans}% EMI burden, which exceeds the 20% limit. I'd recommend against taking any new loans until existing ones are reduced.

Focus on paying down current debt or increasing income first.`;

    case "LOAN_END":
      const loans = budget.loans || [];
      if (loans.length === 0) {
        return "You don't have any loans recorded. That's great — you can focus entirely on building savings!";
      }
      const loansEnding = loans.filter((l) => l.tenure <= 12);
      if (loansEnding.length > 0) {
        const freedUp = loansEnding.reduce((sum, l) => sum + l.emi, 0);
        return `You have ${loansEnding.length} loan(s) ending within 12 months. This will free up ${formatCurrency(freedUp)}/month.

**My suggestion:** When these EMIs end, redirect the full ${formatCurrency(freedUp)} to savings. Don't let lifestyle creep absorb it!

Use the Scenario Simulator to preview how your budget improves.`;
      }
      return `Your loans have longer tenure remaining. The soonest ending loan has ${Math.min(...loans.map((l) => l.tenure))} months left.

You can use the Scenario Simulator to see the impact when loans end.`;

    case "TAX_QUESTION":
      const regime = budget.tax?.regime === "new" ? "New Tax Regime" : "Old Tax Regime";
      return `You're using the **${regime}** with ${formatCurrency(budget.tax?.monthlyTax || 0)}/month in taxes.

${
  budget.tax?.regime === "new"
    ? "The new regime has lower rates but fewer deductions. Good if you don't have major 80C investments or HRA claims."
    : "The old regime allows deductions like 80C (₹1.5L), HRA, and others. Make sure you're claiming all eligible deductions!"
}

Your net take-home is ${formatCurrency(totals.netIncome)}/month after taxes.`;

    case "IMPROVE_SCORE":
      const weakestArea =
        budget.percentages.savings_pct < 10
          ? "savings"
          : budget.percentages.loans_pct > 20
          ? "loans"
          : budget.percentages.essentials_pct > 50
          ? "fixed costs"
          : "overall balance";
      return `Your health score is ${score}/100. Here's how to improve it:

**Focus area: ${weakestArea}**
${budget.percentages.savings_pct < 15 ? `1. Increase savings from ${budget.percentages.savings_pct}% to at least 15%` : ""}
${budget.percentages.loans_pct > 20 ? `2. Work on reducing EMI burden from ${budget.percentages.loans_pct}% toward 14%` : ""}
${totals.remainingTotal <= 0 ? `3. Build an emergency buffer — you currently have no remaining funds` : ""}

Small, consistent improvements will move your score from "${score < 41 ? "At Risk" : score < 71 ? "Stable" : "Healthy"}" toward "Healthy".`;

    case "EXPLAIN_SCORE":
      return `Your Financial Health Score (${score}/100) is calculated from 4 factors:

1. **Savings Rate (30 points):** ${budget.percentages.savings_pct}% saved — ${budget.percentages.savings_pct >= 20 ? "Excellent!" : budget.percentages.savings_pct >= 10 ? "Good, but aim higher" : "Needs improvement"}

2. **Loan Burden (25 points):** ${budget.percentages.loans_pct}% on EMIs — ${budget.percentages.loans_pct <= 14 ? "Well managed" : budget.percentages.loans_pct <= 20 ? "Acceptable" : "Too high"}

3. **Fixed Costs (25 points):** ${budget.percentages.essentials_pct + budget.percentages.loans_pct}% fixed — ${budget.percentages.essentials_pct + budget.percentages.loans_pct <= 55 ? "Flexible" : "Rigid budget"}

4. **Emergency Buffer (20 points):** ${totals.remainingTotal > 0 ? "You have buffer" : "No buffer — risky"}

Each area contributes to the total. Focus on the weakest link!`;

    case "EXPLAIN_CHART":
      return `The **Benchmark Comparison Chart** shows your spending vs. average urban professionals (22-30, Tier-1 cities):

| Category | You | Benchmark |
|----------|-----|-----------|
| Essentials | ${budget.percentages.essentials_pct}% | ${BENCHMARK_AVERAGES.essentials}% |
| Lifestyle | ${budget.percentages.lifestyle_pct}% | ${BENCHMARK_AVERAGES.lifestyle}% |
| Loans | ${budget.percentages.loans_pct}% | ${BENCHMARK_AVERAGES.loans}% |
| Savings | ${budget.percentages.savings_pct}% | ${BENCHMARK_AVERAGES.savings}% |

Bars taller than benchmark = spending more than peers. Aim to match or beat savings benchmark!`;

    case "EXPLAIN_ALERT":
      return `Alerts appear when your budget shows warning signs:

🔴 **Low Savings** — Savings < 10% of income
🔴 **High EMI Load** — Loans > 20% of income
🔴 **High Fixed Costs** — Essentials > 50% of income
🟠 **Lifestyle Creep** — High lifestyle spending while savings is low

Tap any alert to see detailed explanation and recommended actions.`;

    case "SIMULATOR_GUIDE":
      return `The **Scenario Simulator** lets you test "what if" scenarios:

1. **Income Increase** — See how a raise affects your budget
2. **Loan Ends** — Preview when an EMI stops
3. **Save More** — Check impact of increasing savings

It recalculates your charts temporarily without changing saved data. Great for planning!

Try asking: "What happens if my education fees end?"`;

    case "GENERAL_SAVINGS":
      return KNOWLEDGE_BASE.savings;
    case "GENERAL_EMERGENCY":
      return KNOWLEDGE_BASE.emergency;
    case "GENERAL_LOANS":
      return KNOWLEDGE_BASE.loans;
    case "GENERAL_TAX":
      return KNOWLEDGE_BASE.tax;
    case "GENERAL_INSURANCE":
      return KNOWLEDGE_BASE.insurance;
    case "GENERAL_EDUCATION":
      return KNOWLEDGE_BASE.education;
    case "GENERAL_LIFESTYLE":
      return KNOWLEDGE_BASE.lifestyle;
    case "GENERAL_BUDGETING":
      return KNOWLEDGE_BASE.budgeting;
    case "GENERAL_INVESTMENT":
      return KNOWLEDGE_BASE.investment;

    case "LEARN_EMI":
      return "**EMI (Equated Monthly Installment)** is a fixed monthly payment to repay a loan, covering both principal and interest. Your current EMI burden is " + budget.percentages.loans_pct + "% of net income.";

    case "LEARN_SAVINGS_RATE":
      return `**Savings rate** = (Monthly savings ÷ Net income) × 100. Your current rate is ${budget.percentages.savings_pct}%. The ideal target for your income range is ${BENCHMARK_AVERAGES.savings}%.`;

    case "LEARN_BUDGET":
      return `**A budget** maps your income to categories. Yours: Essentials ${budget.percentages.essentials_pct}%, Lifestyle ${budget.percentages.lifestyle_pct}%, Loans ${budget.percentages.loans_pct}%, Savings ${budget.percentages.savings_pct}%, Buffer ${budget.percentages.remaining_pct}%.`;

    case "EXPLAIN_BUDGET": {
      const flex = calculateFlexibilityScore(budget.percentages);
      const risk = calculateRiskIndex(budget.percentages);
      return `Here's your budget at a glance:

**Income:** ${formatCurrency(budget.income)} gross → ${formatCurrency(totals.netIncome)} net
**Essentials:** ${formatCurrency(totals.essentialsTotal)} (${budget.percentages.essentials_pct}%)
**Lifestyle:** ${formatCurrency(totals.lifestyleTotal)} (${budget.percentages.lifestyle_pct}%)
**Loans:** ${formatCurrency(totals.loansTotal)} (${budget.percentages.loans_pct}%)
**Savings:** ${formatCurrency(totals.savingsTotal)} (${budget.percentages.savings_pct}%)
**Buffer:** ${formatCurrency(totals.remainingTotal)} (${budget.percentages.remaining_pct}%)

**Health Score:** ${score}/100 | **Flexibility:** ${flex}% | **Risk:** ${risk.level}

${budget.percentages.savings_pct < BENCHMARK_AVERAGES.savings ? "⚠️ Savings are below benchmark — this is the main area to improve." : "✅ Overall, your budget looks balanced!"}`;
    }

    case "FUTURE_PROJECTION": {
      const proj = projectFuture(budget, 0);
      const fiveY = proj.series[proj.series.length - 1];
      const oneY = proj.series[1];
      return `Based on your current savings of ${formatCurrency(budget.savings)}/month:

• In **1 year** you'd accumulate ~${formatCurrency(oneY.savings)} in savings (net wealth ~${formatCurrency(oneY.netWealth)} after loans).
• In **5 years** that becomes ~${formatCurrency(fiveY.savings)} in savings, with a projected net wealth of ${formatCurrency(fiveY.netWealth)}.

Open the **Planning → Projection** tab to play with different time horizons.`;
    }

    case "SHOCK_JOB_LOSS": {
      const monthlyOutgo = totals.essentialsTotal + totals.loansTotal;
      const months = monthlyOutgo > 0 ? (budget.savings / monthlyOutgo).toFixed(1) : "0";
      return `If you lost your income tomorrow, your current monthly savings of ${formatCurrency(budget.savings)} would cover about **${months} months** of essential + loan expenses (₹${monthlyOutgo.toLocaleString("en-IN")}/mo).

Healthy target: 3–6 months of buffer. Use **Planning → Shocks → Job Loss** to test 1, 3, and 6 month scenarios.`;
    }

    case "SHOCK_GENERAL":
      return `You can stress-test your budget against five real-world shocks in **Planning → Shocks**:

• Salary cut (10/20/30%)
• Job loss (1/3/6 months)
• Medical expense (₹25k–₹1L)
• Education cost (₹20k–₹1L)
• Interest rate hike (+5/10% EMI)

Each shock shows before/after metrics so you can see exactly how resilient your plan is.`;

    case "GOAL_FEASIBILITY": {
      const goals = getGoals();
      if (goals.length === 0) {
        return "You haven't set any goals yet. Head to **Planning → Goals** and add one (e.g. emergency fund, vehicle, master's degree). I'll then show how feasible it is given your savings rate.";
      }
      const lines = goals.slice(0, 3).map((g) => {
        const a = analyzeGoal(g, budget);
        return `• **${g.name}** — ${a.feasibility} (${a.probability}/100). Need ${formatCurrency(a.requiredMonthly)}/mo; ${a.recommendation}`;
      });
      return `Here's how your goals are tracking:\n\n${lines.join("\n")}`;
    }

    default:
      return `I'm not sure I understood that. Here are things I can help with:

• "Why are my savings low?"
• "Is my loan burden risky?"
• "How can I improve my score?"
• "Explain my budget"
• "How much will I save in 5 years?"
• "What happens if I lose my job?"
• "Can I afford my goal?"

Or ask about savings, taxes, investments, insurance, or budgeting basics!`;
  }
}

export const QUICK_QUESTIONS = [
  "Why are my savings low?",
  "How much will I save in 5 years?",
  "What happens if I lose my job?",
  "Can I afford my goal?",
  "Explain my budget",
];

