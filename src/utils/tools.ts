import { BudgetPlan, TaxRegime } from "@/types/budget";
import {
  calculateTotals,
  calculatePercentages,
  calculateMonthlyTax,
} from "@/utils/budgetCalculations";
import { calculateHealthScore } from "@/components/budget/HealthScore";

// ─── Shared helper: derive totals + percentages from a budget ──────
export function deriveBudget(budget: BudgetPlan | null) {
  if (!budget) return null;
  const totals = calculateTotals(
    budget.income,
    budget.tax?.monthlyTax || 0,
    budget.essentials,
    budget.lifestyle,
    budget.loans || [],
    budget.savings
  );
  const percentages = calculatePercentages(totals.netIncome, totals);
  const health = calculateHealthScore(percentages, budget.savings > 0);
  return { totals, percentages, healthScore: health.score };
}

// ═══════════════════════════════════════════════════════════════════
// 1. SALARY-DAY PLANNER
// ═══════════════════════════════════════════════════════════════════
export interface CashFlowEvent {
  id: string;
  label: string;
  day: number; // 1-31
  amount: number; // positive = inflow, negative = outflow
}

export interface CashFlowDay {
  day: number;
  events: CashFlowEvent[];
  net: number;
  balance: number;
}

export interface CashFlowAnalysis {
  timeline: CashFlowDay[];
  lowestBalance: number;
  lowestDay: number;
  endBalance: number;
  goesNegative: boolean;
  warnings: string[];
}

export function analyzeCashFlow(
  events: CashFlowEvent[],
  openingBalance = 0
): CashFlowAnalysis {
  const sorted = [...events].sort((a, b) => a.day - b.day);
  const byDay = new Map<number, CashFlowEvent[]>();
  sorted.forEach((e) => {
    const day = Math.min(31, Math.max(1, Math.round(e.day)));
    byDay.set(day, [...(byDay.get(day) || []), e]);
  });

  let balance = openingBalance;
  const timeline: CashFlowDay[] = [];
  [...byDay.keys()]
    .sort((a, b) => a - b)
    .forEach((day) => {
      const dayEvents = byDay.get(day)!;
      const net = dayEvents.reduce((s, e) => s + e.amount, 0);
      balance += net;
      timeline.push({ day, events: dayEvents, net, balance });
    });

  const lowest = timeline.reduce(
    (min, d) => (d.balance < min.balance ? d : min),
    timeline[0] || { day: 1, balance: openingBalance, events: [], net: 0 }
  );

  const warnings: string[] = [];
  if (timeline.length > 0) {
    if (lowest.balance < 0) {
      warnings.push(
        `Your balance dips to ${lowest.balance.toLocaleString("en-IN")} around day ${lowest.day}. A payment will likely bounce or need a credit card.`
      );
    } else if (lowest.balance < 15000) {
      warnings.push(
        `Your account may hold only ₹${Math.round(lowest.balance).toLocaleString("en-IN")} around day ${lowest.day}. That's a thin cushion for anything unexpected.`
      );
    }

    // Detect debit clustering: heavy outflows within a 5-day window
    for (const d of timeline) {
      const windowOut = timeline
        .filter((x) => x.day >= d.day && x.day <= d.day + 4)
        .reduce((s, x) => s + Math.min(0, x.net), 0);
      const inflow = timeline.reduce(
        (s, x) => s + x.events.reduce((t, e) => t + Math.max(0, e.amount), 0),
        0
      );
      if (inflow > 0 && Math.abs(windowOut) > inflow * 0.6) {
        warnings.push(
          `Over 60% of your monthly outflow happens between day ${d.day} and day ${Math.min(31, d.day + 4)}. Spreading one debit (e.g. your SIP) later in the month would smooth cash flow.`
        );
        break;
      }
    }

    // Outflows landing before salary
    const salaryDay = sorted.find((e) => e.amount > 0)?.day;
    if (salaryDay) {
      const beforeSalary = sorted.filter(
        (e) => e.amount < 0 && e.day < salaryDay
      );
      if (beforeSalary.length > 0) {
        warnings.push(
          `${beforeSalary.map((e) => e.label).join(", ")} debit${beforeSalary.length > 1 ? "" : "s"} before your salary lands on day ${salaryDay}. Move them 2–3 days later to avoid relying on last month's balance.`
        );
      }
    }
  }

  return {
    timeline,
    lowestBalance: timeline.length ? lowest.balance : openingBalance,
    lowestDay: timeline.length ? lowest.day : 1,
    endBalance: balance,
    goesNegative: timeline.some((d) => d.balance < 0),
    warnings,
  };
}

// ═══════════════════════════════════════════════════════════════════
// 2. ANNUAL EXPENSE PLANNER
// ═══════════════════════════════════════════════════════════════════
export interface AnnualExpense {
  id: string;
  name: string;
  amount: number;
  frequency: "yearly" | "half_yearly" | "quarterly";
  dueMonth: number; // 1-12
}

export const ANNUAL_PRESETS = [
  "Vehicle insurance",
  "Health insurance",
  "Term insurance",
  "School / college fees",
  "Professional certification",
  "Laptop / phone replacement",
  "Annual travel",
  "Advance tax / tax filing",
  "Club / gym membership",
];

export function monthlyProvision(e: AnnualExpense): number {
  const perYear =
    e.frequency === "yearly" ? 1 : e.frequency === "half_yearly" ? 2 : 4;
  return Math.round((e.amount * perYear) / 12);
}

export interface AnnualPlanSummary {
  totalAnnual: number;
  totalMonthlyProvision: number;
  provisionPctOfNet: number | null;
  heaviestMonth: { month: number; amount: number } | null;
  insight: string;
}

export function summarizeAnnualExpenses(
  expenses: AnnualExpense[],
  netIncome?: number
): AnnualPlanSummary {
  const totalMonthlyProvision = expenses.reduce(
    (s, e) => s + monthlyProvision(e),
    0
  );
  const totalAnnual = totalMonthlyProvision * 12;

  const monthTotals = new Array(12).fill(0);
  expenses.forEach((e) => {
    const step = e.frequency === "yearly" ? 12 : e.frequency === "half_yearly" ? 6 : 3;
    for (let m = e.dueMonth - 1; m < 12; m += step) monthTotals[m] += e.amount;
  });
  const maxIdx = monthTotals.indexOf(Math.max(...monthTotals));
  const heaviestMonth =
    monthTotals[maxIdx] > 0 ? { month: maxIdx + 1, amount: monthTotals[maxIdx] } : null;

  const provisionPctOfNet =
    netIncome && netIncome > 0
      ? Math.round((totalMonthlyProvision / netIncome) * 1000) / 10
      : null;

  let insight = "Add your non-monthly expenses to see how much to set aside each month.";
  if (expenses.length > 0) {
    insight = `Set aside ₹${totalMonthlyProvision.toLocaleString("en-IN")} every month so the ₹${totalAnnual.toLocaleString("en-IN")} of yearly bills never hits you as a surprise.`;
    if (provisionPctOfNet !== null) {
      insight += ` That's ${provisionPctOfNet}% of your net income — treat it as a fixed expense, not spare cash.`;
    }
    if (heaviestMonth) {
      insight += ` Month ${heaviestMonth.month} is your heaviest (₹${heaviestMonth.amount.toLocaleString("en-IN")} due).`;
    }
  }
  return {
    totalAnnual,
    totalMonthlyProvision,
    provisionPctOfNet,
    heaviestMonth,
    insight,
  };
}

// ═══════════════════════════════════════════════════════════════════
// 3. JOB-SWITCH / SALARY-HIKE SIMULATOR
// ═══════════════════════════════════════════════════════════════════
export interface HikeResult {
  currentGross: number;
  newGross: number;
  currentTax: number;
  newTax: number;
  currentNet: number;
  newNet: number;
  netGain: number;
  lifestyleIncrease: number;
  realGain: number;
  realGainPct: number;
  newSavings: number;
  newSavingsPct: number;
  newHealthScore: number;
  healthDelta: number;
  creepWarning: string;
  insight: string;
}

export function simulateHike(
  budget: BudgetPlan,
  hikePct: number,
  lifestyleIncrease: number,
  regime: TaxRegime
): HikeResult {
  const base = deriveBudget(budget)!;
  const currentGross = budget.income;
  const newGross = Math.round(currentGross * (1 + hikePct / 100));

  const currentTax = budget.tax?.manualOverride
    ? budget.tax.monthlyTax
    : calculateMonthlyTax(currentGross, regime);
  const newTax = calculateMonthlyTax(newGross, regime);

  const currentNet = currentGross - currentTax;
  const newNet = newGross - newTax;
  const netGain = newNet - currentNet;

  const newLifestyle = base.totals.lifestyleTotal + lifestyleIncrease;
  const newSavings = Math.max(
    0,
    newNet -
      base.totals.essentialsTotal -
      newLifestyle -
      base.totals.loansTotal
  );
  const newSavingsPct = newNet > 0 ? Math.round((newSavings / newNet) * 100) : 0;

  const newTotals = {
    ...base.totals,
    grossIncome: newGross,
    netIncome: newNet,
    monthlyTax: newTax,
    lifestyleTotal: newLifestyle,
    savingsTotal: newSavings,
    remainingTotal: 0,
    totalExpenses:
      base.totals.essentialsTotal + newLifestyle + base.totals.loansTotal,
  };
  const newPct = calculatePercentages(newNet, newTotals);
  const newHealth = calculateHealthScore(newPct, newSavings > 0).score;

  const realGain = netGain - lifestyleIncrease;
  const realGainPct = netGain > 0 ? Math.round((realGain / netGain) * 100) : 0;

  let creepWarning = "";
  if (lifestyleIncrease <= 0) {
    creepWarning = `You keep the entire ₹${netGain.toLocaleString("en-IN")} increase. Your savings rate moves to ${newSavingsPct}%.`;
  } else if (realGain <= 0) {
    creepWarning = `Your lifestyle spend rises more than your take-home. The raise leaves you no better off — in fact ₹${Math.abs(realGain).toLocaleString("en-IN")} worse each month.`;
  } else {
    creepWarning = `Your take-home rises by ₹${netGain.toLocaleString("en-IN")}, but with ₹${lifestyleIncrease.toLocaleString("en-IN")} more lifestyle spending only ₹${realGain.toLocaleString("en-IN")} (${realGainPct}%) of the raise improves your financial position.`;
  }

  const insight = `A ${hikePct}% hike takes gross from ₹${currentGross.toLocaleString("en-IN")} to ₹${newGross.toLocaleString("en-IN")}. Monthly tax rises by ₹${(newTax - currentTax).toLocaleString("en-IN")}, so take-home grows ₹${netGain.toLocaleString("en-IN")} — not the full ₹${(newGross - currentGross).toLocaleString("en-IN")}.`;

  return {
    currentGross,
    newGross,
    currentTax,
    newTax,
    currentNet,
    newNet,
    netGain,
    lifestyleIncrease,
    realGain,
    realGainPct,
    newSavings,
    newSavingsPct,
    newHealthScore: newHealth,
    healthDelta: newHealth - base.healthScore,
    creepWarning,
    insight,
  };
}

// ═══════════════════════════════════════════════════════════════════
// 4. RENT VS BUY
// ═══════════════════════════════════════════════════════════════════
export interface RentInputs {
  monthlyRent: number;
  deposit: number;
  maintenance: number;
  utilities: number;
  rentHikePct: number;
}
export interface BuyInputs {
  propertyPrice: number;
  downPayment: number;
  interestRate: number;
  tenureYears: number;
  maintenance: number;
  utilities: number;
  propertyTax: number;
  appreciationPct: number;
}

export function calculateEmi(
  principal: number,
  annualRate: number,
  months: number
): number {
  if (principal <= 0 || months <= 0) return 0;
  const r = annualRate / 12 / 100;
  if (r === 0) return Math.round(principal / months);
  const emi =
    (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
  return Math.round(emi);
}

export interface RentBuyResult {
  horizonYears: number;
  rentTotalOutflow: number;
  buyTotalOutflow: number;
  emi: number;
  loanAmount: number;
  totalInterest: number;
  buyMonthlyCost: number;
  rentMonthlyCost: number;
  propertyValueAtHorizon: number;
  equityBuilt: number;
  rentInvestedValue: number;
  buyNetPosition: number;
  rentNetPosition: number;
  breakEvenYear: number | null;
  notes: string[];
}

export function compareRentVsBuy(
  rent: RentInputs,
  buy: BuyInputs,
  horizonYears: number,
  investmentReturnPct = 10
): RentBuyResult {
  const loanAmount = Math.max(0, buy.propertyPrice - buy.downPayment);
  const months = buy.tenureYears * 12;
  const emi = calculateEmi(loanAmount, buy.interestRate, months);
  const totalInterest = Math.max(0, emi * months - loanAmount);

  const rentMonthlyCost = rent.monthlyRent + rent.maintenance + rent.utilities;
  const buyMonthlyCost =
    emi + buy.maintenance + buy.utilities + Math.round(buy.propertyTax / 12);

  let rentOutflow = 0;
  let currentRent = rent.monthlyRent;
  // Renter invests the down payment plus any monthly cost difference
  let renterPortfolio = buy.downPayment;
  const monthlyReturn = investmentReturnPct / 12 / 100;
  let breakEvenYear: number | null = null;
  let buyOutflow = 0;
  let outstanding = loanAmount;
  const r = buy.interestRate / 12 / 100;

  for (let y = 1; y <= horizonYears; y++) {
    for (let m = 0; m < 12; m++) {
      const rentCost = currentRent + rent.maintenance + rent.utilities;
      const monthIndex = (y - 1) * 12 + m;
      const buyCost = monthIndex < months ? buyMonthlyCost : buyMonthlyCost - emi;
      rentOutflow += rentCost;
      buyOutflow += buyCost;
      renterPortfolio =
        renterPortfolio * (1 + monthlyReturn) + Math.max(0, buyCost - rentCost);
      if (monthIndex < months && outstanding > 0) {
        const interest = outstanding * r;
        outstanding = Math.max(0, outstanding + interest - emi);
      }
    }
    currentRent = Math.round(currentRent * (1 + rent.rentHikePct / 100));

    const value =
      buy.propertyPrice * Math.pow(1 + buy.appreciationPct / 100, y);
    const buyerNet = value - outstanding - buyOutflow - buy.downPayment;
    const renterNet = renterPortfolio - rentOutflow;
    if (breakEvenYear === null && buyerNet > renterNet) breakEvenYear = y;
  }

  const propertyValueAtHorizon = Math.round(
    buy.propertyPrice * Math.pow(1 + buy.appreciationPct / 100, horizonYears)
  );
  const equityBuilt = Math.round(propertyValueAtHorizon - outstanding);
  const buyNetPosition = Math.round(
    equityBuilt - buyOutflow - buy.downPayment
  );
  const rentNetPosition = Math.round(renterPortfolio - rentOutflow);

  const notes: string[] = [
    `Buying needs ₹${buy.downPayment.toLocaleString("en-IN")} upfront plus an EMI of ₹${emi.toLocaleString("en-IN")} for ${buy.tenureYears} years (₹${totalInterest.toLocaleString("en-IN")} total interest).`,
    `Renting needs ₹${rent.deposit.toLocaleString("en-IN")} as a refundable deposit and assumes ${rent.rentHikePct}% annual hikes.`,
    `This model assumes the renter invests the down payment and any monthly savings at ${investmentReturnPct}% a year, and the property appreciates ${buy.appreciationPct}% a year.`,
    breakEvenYear
      ? `Buying overtakes renting in year ${breakEvenYear} under these assumptions.`
      : `Buying does not overtake renting within ${horizonYears} years under these assumptions.`,
  ];

  return {
    horizonYears,
    rentTotalOutflow: Math.round(rentOutflow),
    buyTotalOutflow: Math.round(buyOutflow + buy.downPayment),
    emi,
    loanAmount,
    totalInterest,
    buyMonthlyCost,
    rentMonthlyCost,
    propertyValueAtHorizon,
    equityBuilt,
    rentInvestedValue: Math.round(renterPortfolio),
    buyNetPosition,
    rentNetPosition,
    breakEvenYear,
    notes,
  };
}

// ═══════════════════════════════════════════════════════════════════
// 5. COMMUTE COST ANALYZER
// ═══════════════════════════════════════════════════════════════════
export type CommuteMode = "metro" | "bus" | "cab" | "car" | "bike";

export const COMMUTE_MODES: Record<
  CommuteMode,
  { label: string; icon: string; perKm: number; fixedMonthly: number; note: string }
> = {
  metro: { label: "Metro", icon: "🚇", perKm: 3, fixedMonthly: 0, note: "Predictable, no parking" },
  bus: { label: "Bus", icon: "🚌", perKm: 1.5, fixedMonthly: 0, note: "Cheapest, slowest" },
  cab: { label: "Cab / Auto", icon: "🚕", perKm: 18, fixedMonthly: 0, note: "Surge pricing risk" },
  car: { label: "Own car", icon: "🚗", perKm: 9, fixedMonthly: 3500, note: "Fuel + parking + service + insurance" },
  bike: { label: "Two-wheeler", icon: "🛵", perKm: 3, fixedMonthly: 900, note: "Fuel + service + insurance" },
};

export interface CommuteResult {
  mode: CommuteMode;
  label: string;
  icon: string;
  monthly: number;
  annual: number;
  pctOfNet: number | null;
}

export function analyzeCommute(
  oneWayKm: number,
  daysPerMonth: number,
  netIncome?: number
): { results: CommuteResult[]; cheapest: CommuteResult; insight: string } {
  const kmPerMonth = oneWayKm * 2 * daysPerMonth;
  const results = (Object.keys(COMMUTE_MODES) as CommuteMode[]).map((mode) => {
    const m = COMMUTE_MODES[mode];
    const monthly = Math.round(kmPerMonth * m.perKm + m.fixedMonthly);
    return {
      mode,
      label: m.label,
      icon: m.icon,
      monthly,
      annual: monthly * 12,
      pctOfNet:
        netIncome && netIncome > 0
          ? Math.round((monthly / netIncome) * 1000) / 10
          : null,
    };
  });
  const sorted = [...results].sort((a, b) => a.monthly - b.monthly);
  const cheapest = sorted[0];
  const dearest = sorted[sorted.length - 1];
  const insight = `At ${oneWayKm} km each way for ${daysPerMonth} days a month (${kmPerMonth} km), ${dearest.label} costs ₹${dearest.monthly.toLocaleString("en-IN")}/month versus ₹${cheapest.monthly.toLocaleString("en-IN")} for ${cheapest.label} — a difference of ₹${(dearest.annual - cheapest.annual).toLocaleString("en-IN")} a year.`;
  return { results, cheapest, insight };
}

// ═══════════════════════════════════════════════════════════════════
// 6. EMI AFFORDABILITY CHECKER
// ═══════════════════════════════════════════════════════════════════
export interface EmiCheckResult {
  currentLoanPct: number;
  newLoanPct: number;
  currentSavings: number;
  newSavings: number;
  newSavingsPct: number;
  healthBefore: number;
  healthAfter: number;
  healthAfterShock: number;
  savingsAfterShock: number;
  verdict: "safe" | "tight" | "risky";
  verdictLabel: string;
  explanation: string;
  shockExplanation: string;
}

export function checkEmiAffordability(
  budget: BudgetPlan,
  newEmi: number,
  shockPct = 10
): EmiCheckResult {
  const base = deriveBudget(budget)!;
  const { totals, percentages } = base;

  const buildScenario = (netIncome: number, emiExtra: number) => {
    const loansTotal = totals.loansTotal + emiExtra;
    const savings = Math.max(
      0,
      netIncome - totals.essentialsTotal - totals.lifestyleTotal - loansTotal
    );
    const scenarioTotals = {
      ...totals,
      netIncome,
      loansTotal,
      savingsTotal: savings,
      remainingTotal: 0,
      totalExpenses: totals.essentialsTotal + totals.lifestyleTotal + loansTotal,
    };
    const pct = calculatePercentages(netIncome, scenarioTotals);
    return {
      savings,
      pct,
      health: calculateHealthScore(pct, savings > 0).score,
    };
  };

  const after = buildScenario(totals.netIncome, newEmi);
  const shocked = buildScenario(
    Math.round(totals.netIncome * (1 - shockPct / 100)),
    newEmi
  );

  let verdict: EmiCheckResult["verdict"] = "safe";
  if (after.pct.loans_pct > 35 || after.savings <= 0 || shocked.savings <= 0)
    verdict = "risky";
  else if (after.pct.loans_pct > 20 || after.pct.savings_pct < 10)
    verdict = "tight";

  const verdictLabel =
    verdict === "safe"
      ? "Affordable"
      : verdict === "tight"
      ? "Affordable but tight"
      : "Likely to create stress";

  const explanation = `Adding a ₹${newEmi.toLocaleString("en-IN")} EMI moves your debt burden from ${percentages.loans_pct}% to ${after.pct.loans_pct}% of net income, and your savings from ₹${totals.savingsTotal.toLocaleString("en-IN")} (${percentages.savings_pct}%) to ₹${after.savings.toLocaleString("en-IN")} (${after.pct.savings_pct}%). Health score ${base.healthScore} → ${after.health}.`;

  const shockExplanation =
    shocked.savings <= 0
      ? `With a ${shockPct}% income drop on top of this EMI, you would be short every month — no savings left and essentials at risk.`
      : `Even with a ${shockPct}% income drop you would still save about ₹${shocked.savings.toLocaleString("en-IN")}/month (health score ${shocked.health}).`;

  return {
    currentLoanPct: percentages.loans_pct,
    newLoanPct: after.pct.loans_pct,
    currentSavings: totals.savingsTotal,
    newSavings: after.savings,
    newSavingsPct: after.pct.savings_pct,
    healthBefore: base.healthScore,
    healthAfter: after.health,
    healthAfterShock: shocked.health,
    savingsAfterShock: shocked.savings,
    verdict,
    verdictLabel,
    explanation,
    shockExplanation,
  };
}

// ═══════════════════════════════════════════════════════════════════
// 7. EMERGENCY FUND CALCULATOR
// ═══════════════════════════════════════════════════════════════════
export interface EmergencyFundResult {
  essentialMonthly: number;
  breakdown: { label: string; amount: number }[];
  buffer3: number;
  buffer6: number;
  buffer9: number;
  monthsCovered: number;
  recommendedMonths: number;
  insight: string;
}

export function calculateEmergencyFund(
  budget: BudgetPlan,
  extras: { label: string; amount: number }[] = [],
  currentCorpus = 0
): EmergencyFundResult {
  const e = budget.essentials;
  const loansTotal = (budget.loans || []).reduce((s, l) => s + l.emi, 0);
  const breakdown = [
    { label: "Rent", amount: e.rent },
    { label: "Groceries & food", amount: e.groceries },
    { label: "Essential transport", amount: e.transport },
    { label: "Utilities & bills", amount: e.bills },
    ...(e.custom || []).map((c) => ({ label: c.name, amount: c.amount })),
    { label: "EMIs (non-negotiable)", amount: loansTotal },
    ...extras,
  ].filter((b) => b.amount > 0);

  const essentialMonthly = breakdown.reduce((s, b) => s + b.amount, 0);
  const loanPct =
    budget.income > 0 ? (loansTotal / Math.max(1, budget.income)) * 100 : 0;
  const recommendedMonths = loanPct > 20 ? 9 : loanPct > 0 ? 6 : 3;
  const monthsCovered =
    essentialMonthly > 0
      ? Math.round((currentCorpus / essentialMonthly) * 10) / 10
      : 0;

  const insight = `Your true survival number is ₹${essentialMonthly.toLocaleString("en-IN")} a month — rent, food, bills, essential travel and EMIs that don't pause if income stops. ${
    loansTotal > 0
      ? `Because ₹${loansTotal.toLocaleString("en-IN")} of that is EMIs you cannot renegotiate quickly, aim for ${recommendedMonths} months.`
      : `With no EMIs, ${recommendedMonths}–6 months is a sensible target.`
  } You currently hold ${monthsCovered} months of cover.`;

  return {
    essentialMonthly,
    breakdown,
    buffer3: essentialMonthly * 3,
    buffer6: essentialMonthly * 6,
    buffer9: essentialMonthly * 9,
    monthsCovered,
    recommendedMonths,
    insight,
  };
}

// ═══════════════════════════════════════════════════════════════════
// 8. "CAN I AFFORD IT?" TOOL
// ═══════════════════════════════════════════════════════════════════
export type AffordVerdict = "green" | "yellow" | "red";

export interface AffordResult {
  verdict: AffordVerdict;
  label: string;
  monthsToSave: number;
  disposableMonthly: number;
  emergencyGap: number;
  goalImpactMonths: number;
  emiIfFinanced: number;
  emiLoanPctAfter: number;
  reasons: string[];
  recommendation: string;
}

export function canIAffordIt(
  budget: BudgetPlan,
  itemCost: number,
  opts: {
    currentCorpus?: number;
    payMode?: "cash" | "emi";
    emiMonths?: number;
    emiRate?: number;
    goalRequiredMonthly?: number;
  } = {}
): AffordResult {
  const {
    currentCorpus = 0,
    payMode = "cash",
    emiMonths = 12,
    emiRate = 15,
    goalRequiredMonthly = 0,
  } = opts;

  const base = deriveBudget(budget)!;
  const { totals } = base;
  const disposableMonthly = Math.max(
    0,
    totals.netIncome -
      totals.essentialsTotal -
      totals.lifestyleTotal -
      totals.loansTotal
  );
  const ef = calculateEmergencyFund(budget, [], currentCorpus);
  const targetCorpus = ef.essentialMonthly * ef.recommendedMonths;

  const reasons: string[] = [];
  const monthsToSave =
    disposableMonthly > 0 ? Math.ceil(itemCost / disposableMonthly) : Infinity;

  const emiIfFinanced = calculateEmi(itemCost, emiRate, emiMonths);
  const emiCheck = checkEmiAffordability(budget, emiIfFinanced);

  const corpusAfter = currentCorpus - (payMode === "cash" ? itemCost : 0);
  const emergencyGap = Math.max(0, targetCorpus - Math.max(0, corpusAfter));

  let verdict: AffordVerdict = "green";

  if (payMode === "cash") {
    if (corpusAfter < 0) {
      verdict = "red";
      reasons.push(
        `Paying cash needs ₹${itemCost.toLocaleString("en-IN")} but you only hold ₹${currentCorpus.toLocaleString("en-IN")}.`
      );
    } else if (corpusAfter < ef.essentialMonthly * 3) {
      verdict = "red";
      reasons.push(
        `Paying cash leaves ₹${corpusAfter.toLocaleString("en-IN")} — under 3 months of your ₹${ef.essentialMonthly.toLocaleString("en-IN")} essential spend.`
      );
    } else if (corpusAfter < targetCorpus) {
      verdict = "yellow";
      reasons.push(
        `Paying cash keeps you solvent but drops your emergency fund ₹${emergencyGap.toLocaleString("en-IN")} below the ${ef.recommendedMonths}-month target.`
      );
    } else {
      reasons.push(
        `After paying cash you still hold ₹${corpusAfter.toLocaleString("en-IN")} — above your ${ef.recommendedMonths}-month emergency target.`
      );
    }
  } else {
    reasons.push(
      `Financed over ${emiMonths} months at ${emiRate}%, this is a ₹${emiIfFinanced.toLocaleString("en-IN")} EMI and pushes your debt burden from ${emiCheck.currentLoanPct}% to ${emiCheck.newLoanPct}%.`
    );
    if (emiCheck.verdict === "risky") verdict = "red";
    else if (emiCheck.verdict === "tight") verdict = "yellow";
  }

  if (disposableMonthly <= 0) {
    verdict = "red";
    reasons.push("You have no disposable income left after essentials, lifestyle and EMIs.");
  } else {
    reasons.push(
      `Your disposable income is ₹${disposableMonthly.toLocaleString("en-IN")}/month, so saving for this outright takes about ${monthsToSave} month${monthsToSave === 1 ? "" : "s"}.`
    );
  }

  let goalImpactMonths = 0;
  if (goalRequiredMonthly > 0 && disposableMonthly > 0) {
    goalImpactMonths = Math.ceil(itemCost / goalRequiredMonthly);
    if (verdict === "green") verdict = "yellow";
    reasons.push(
      `Your active goals need ₹${goalRequiredMonthly.toLocaleString("en-IN")}/month — this purchase pushes them back roughly ${goalImpactMonths} month${goalImpactMonths === 1 ? "" : "s"}.`
    );
  }

  const label =
    verdict === "green"
      ? "Comfortable"
      : verdict === "yellow"
      ? "Possible, but it affects your goals"
      : "Likely to create financial stress";

  const recommendation =
    verdict === "green"
      ? `Go ahead. Pay from savings rather than EMI so you avoid interest, and top your emergency fund back up next month.`
      : verdict === "yellow"
      ? `Wait ${Math.min(6, Math.max(2, Math.ceil(monthsToSave / 2)))} months and part-fund it: save ₹${Math.round(itemCost / Math.max(2, Math.min(6, monthsToSave))).toLocaleString("en-IN")}/month, then buy without touching your emergency fund or delaying goals.`
      : `Hold off. Rebuild to ₹${targetCorpus.toLocaleString("en-IN")} of emergency cover and keep your debt burden under 20% first — then revisit this purchase.`;

  return {
    verdict,
    label,
    monthsToSave: monthsToSave === Infinity ? 0 : monthsToSave,
    disposableMonthly,
    emergencyGap,
    goalImpactMonths,
    emiIfFinanced,
    emiLoanPctAfter: emiCheck.newLoanPct,
    reasons,
    recommendation,
  };
}

// ═══════════════════════════════════════════════════════════════════
// 9. FAMILY & SHARED RESPONSIBILITIES
// ═══════════════════════════════════════════════════════════════════
export type FamilyCategory =
  | "parents_support"
  | "sibling_education"
  | "family_medical"
  | "household"
  | "shared_rent"
  | "dependents";

export const FAMILY_LABELS: Record<FamilyCategory, string> = {
  parents_support: "Parents' support",
  sibling_education: "Sibling education",
  family_medical: "Family medical",
  household: "Household contribution",
  shared_rent: "Shared rent",
  dependents: "Other dependents",
};

export interface FamilyObligation {
  id: string;
  category: FamilyCategory;
  amount: number;
  note?: string;
}

export interface FamilySplitResult {
  familyTotal: number;
  familyPctOfNet: number;
  personalDiscretionary: number;
  adjustedSavingsTarget: number;
  insight: string;
}

export function analyzeFamilyObligations(
  budget: BudgetPlan | null,
  obligations: FamilyObligation[]
): FamilySplitResult {
  const familyTotal = obligations.reduce((s, o) => s + o.amount, 0);
  const base = deriveBudget(budget);
  const net = base?.totals.netIncome || 0;
  const familyPctOfNet = net > 0 ? Math.round((familyTotal / net) * 1000) / 10 : 0;
  const personalDiscretionary = Math.max(
    0,
    (base?.totals.lifestyleTotal || 0) - familyTotal
  );
  // Savings benchmark relaxes when a real share of income supports family
  const adjustedSavingsTarget = Math.max(
    10,
    Math.round(20 - Math.min(10, familyPctOfNet / 2))
  );

  let insight =
    "Log what you send home so the app stops counting family support as discretionary spending.";
  if (familyTotal > 0) {
    insight = `₹${familyTotal.toLocaleString("en-IN")} (${familyPctOfNet}% of net income) goes to family obligations. This is a commitment, not lifestyle spending, so your realistic savings target is ${adjustedSavingsTarget}% rather than the standard 20%. Your genuinely personal discretionary spend is about ₹${personalDiscretionary.toLocaleString("en-IN")}.`;
  }
  return {
    familyTotal,
    familyPctOfNet,
    personalDiscretionary,
    adjustedSavingsTarget,
    insight,
  };
}

// ═══════════════════════════════════════════════════════════════════
// 10. CAREER DEVELOPMENT ROI
// ═══════════════════════════════════════════════════════════════════
export interface CareerRoiResult {
  totalCost: number;
  monthlySalaryIncrease: number;
  breakEvenMonths: number | null;
  threeYearGain: number;
  fiveYearGain: number;
  roiPct: number | null;
  emiIfFinanced: number;
  verdict: string;
  insight: string;
}

export function calculateCareerRoi(input: {
  courseCost: number;
  otherCosts?: number;
  expectedMonthlyIncrease: number;
  monthsToComplete?: number;
  financeMonths?: number;
  financeRate?: number;
}): CareerRoiResult {
  const {
    courseCost,
    otherCosts = 0,
    expectedMonthlyIncrease,
    monthsToComplete = 6,
    financeMonths = 12,
    financeRate = 12,
  } = input;

  const totalCost = courseCost + otherCosts;
  const breakEvenMonths =
    expectedMonthlyIncrease > 0
      ? Math.ceil(totalCost / expectedMonthlyIncrease)
      : null;
  const threeYearGain = expectedMonthlyIncrease * 36 - totalCost;
  const fiveYearGain = expectedMonthlyIncrease * 60 - totalCost;
  const roiPct =
    totalCost > 0 ? Math.round((threeYearGain / totalCost) * 100) : null;
  const emiIfFinanced = calculateEmi(totalCost, financeRate, financeMonths);

  let verdict = "Needs a clearer payoff";
  if (breakEvenMonths !== null) {
    if (breakEvenMonths <= 12) verdict = "Strong investment";
    else if (breakEvenMonths <= 24) verdict = "Reasonable investment";
    else if (breakEvenMonths <= 48) verdict = "Slow payback";
    else verdict = "Hard to justify financially";
  }

  const insight =
    breakEvenMonths === null
      ? "Add the salary increase you realistically expect to see the payback period."
      : `Spending ₹${totalCost.toLocaleString("en-IN")} to earn ₹${expectedMonthlyIncrease.toLocaleString("en-IN")} more a month recovers its cost in about ${breakEvenMonths} month${breakEvenMonths === 1 ? "" : "s"} after the raise lands (roughly ${breakEvenMonths + monthsToComplete} months from today, allowing ${monthsToComplete} months to finish). Over three years you'd be ₹${threeYearGain.toLocaleString("en-IN")} ahead.`;

  return {
    totalCost,
    monthlySalaryIncrease: expectedMonthlyIncrease,
    breakEvenMonths,
    threeYearGain,
    fiveYearGain,
    roiPct,
    emiIfFinanced,
    verdict,
    insight,
  };
}

// ═══════════════════════════════════════════════════════════════════
// 11. SUBSCRIPTION AUDIT
// ═══════════════════════════════════════════════════════════════════
export type SubCategory =
  | "streaming"
  | "cloud"
  | "software"
  | "fitness"
  | "news"
  | "learning"
  | "membership";

export const SUB_CATEGORY_LABELS: Record<SubCategory, string> = {
  streaming: "Streaming",
  cloud: "Cloud storage",
  software: "Software",
  fitness: "Gym / fitness",
  news: "News",
  learning: "Learning platform",
  membership: "Membership",
};

export type SubUsage = "daily" | "weekly" | "monthly" | "rarely" | "never";

export interface Subscription {
  id: string;
  name: string;
  category: SubCategory;
  amount: number;
  cycle: "monthly" | "yearly";
  usage: SubUsage;
}

export interface SubAuditResult {
  monthlyTotal: number;
  annualTotal: number;
  pctOfNet: number | null;
  unused: Subscription[];
  duplicates: { category: SubCategory; items: Subscription[] }[];
  unusedMonthly: number;
  duplicateMonthly: number;
  insight: string;
}

export function subMonthly(s: Subscription): number {
  return s.cycle === "yearly" ? Math.round(s.amount / 12) : s.amount;
}

export function auditSubscriptions(
  subs: Subscription[],
  netIncome?: number
): SubAuditResult {
  const monthlyTotal = subs.reduce((s, x) => s + subMonthly(x), 0);
  const unused = subs.filter((s) => s.usage === "never" || s.usage === "rarely");
  const groups = new Map<SubCategory, Subscription[]>();
  subs.forEach((s) => groups.set(s.category, [...(groups.get(s.category) || []), s]));
  const duplicates = [...groups.entries()]
    .filter(([, items]) => items.length > 1)
    .map(([category, items]) => ({ category, items }));

  const unusedMonthly = unused.reduce((s, x) => s + subMonthly(x), 0);
  const duplicateMonthly = duplicates.reduce(
    (s, g) =>
      s +
      g.items
        .slice(1)
        .reduce((t, x) => t + subMonthly(x), 0),
    0
  );

  const pctOfNet =
    netIncome && netIncome > 0
      ? Math.round((monthlyTotal / netIncome) * 1000) / 10
      : null;

  let insight =
    "Add your recurring payments to see the true annual cost of your subscriptions.";
  if (subs.length > 0) {
    insight = `You are committed to ₹${monthlyTotal.toLocaleString("en-IN")}/month — ₹${(monthlyTotal * 12).toLocaleString("en-IN")} a year${pctOfNet !== null ? ` (${pctOfNet}% of net income)` : ""}.`;
    if (unusedMonthly > 0)
      insight += ` ₹${unusedMonthly.toLocaleString("en-IN")}/month sits in services you marked as rarely or never used.`;
    if (duplicates.length > 0)
      insight += ` You have overlap in ${duplicates.map((d) => SUB_CATEGORY_LABELS[d.category]).join(", ")} — worth checking whether one covers the need.`;
  }

  return {
    monthlyTotal,
    annualTotal: monthlyTotal * 12,
    pctOfNet,
    unused,
    duplicates,
    unusedMonthly,
    duplicateMonthly,
    insight,
  };
}

// ═══════════════════════════════════════════════════════════════════
// 12. DECISION ROOM
// ═══════════════════════════════════════════════════════════════════
export type DecisionType = "emi_purchase" | "cash_purchase" | "recurring_commitment";

export interface DecisionCheck {
  area: string;
  status: "pass" | "caution" | "fail";
  detail: string;
}

export interface DecisionResult {
  verdict: AffordVerdict;
  label: string;
  checks: DecisionCheck[];
  summary: string;
  action: string;
}

export function runDecision(
  budget: BudgetPlan,
  input: {
    question: string;
    type: DecisionType;
    amount: number;
    emiMonths?: number;
    emiRate?: number;
    currentCorpus?: number;
    goalRequiredMonthly?: number;
  }
): DecisionResult {
  const {
    type,
    amount,
    emiMonths = 12,
    emiRate = 14,
    currentCorpus = 0,
    goalRequiredMonthly = 0,
  } = input;

  const base = deriveBudget(budget)!;
  const ef = calculateEmergencyFund(budget, [], currentCorpus);
  const checks: DecisionCheck[] = [];

  const monthlyImpact =
    type === "emi_purchase"
      ? calculateEmi(amount, emiRate, emiMonths)
      : type === "recurring_commitment"
      ? amount
      : 0;

  const disposable = Math.max(
    0,
    base.totals.netIncome -
      base.totals.essentialsTotal -
      base.totals.lifestyleTotal -
      base.totals.loansTotal
  );

  // 1. Monthly budget
  if (monthlyImpact > 0) {
    const share = Math.round((monthlyImpact / Math.max(1, disposable)) * 100);
    checks.push({
      area: "Monthly budget",
      status: share > 80 ? "fail" : share > 50 ? "caution" : "pass",
      detail: `₹${monthlyImpact.toLocaleString("en-IN")}/month consumes ${share}% of your ₹${disposable.toLocaleString("en-IN")} disposable income.`,
    });
  } else {
    const months = disposable > 0 ? Math.ceil(amount / disposable) : Infinity;
    checks.push({
      area: "Monthly budget",
      status: months === Infinity ? "fail" : months > 6 ? "caution" : "pass",
      detail:
        months === Infinity
          ? "No disposable income available to fund this."
          : `Funding ₹${amount.toLocaleString("en-IN")} from disposable income takes ${months} month${months === 1 ? "" : "s"}.`,
    });
  }

  // 2. Emergency fund
  const corpusAfter = type === "cash_purchase" ? currentCorpus - amount : currentCorpus;
  const monthsCover =
    ef.essentialMonthly > 0
      ? Math.round((Math.max(0, corpusAfter) / ef.essentialMonthly) * 10) / 10
      : 0;
  checks.push({
    area: "Emergency fund",
    status: corpusAfter < 0 || monthsCover < 3 ? "fail" : monthsCover < ef.recommendedMonths ? "caution" : "pass",
    detail: `Leaves ${Math.max(0, monthsCover)} months of the ₹${ef.essentialMonthly.toLocaleString("en-IN")} essential spend covered (target ${ef.recommendedMonths} months).`,
  });

  // 3. Existing debt
  const emiCheck =
    monthlyImpact > 0 && type === "emi_purchase"
      ? checkEmiAffordability(budget, monthlyImpact)
      : null;
  checks.push({
    area: "Debt burden",
    status: emiCheck
      ? emiCheck.verdict === "risky"
        ? "fail"
        : emiCheck.verdict === "tight"
        ? "caution"
        : "pass"
      : base.percentages.loans_pct > 20
      ? "caution"
      : "pass",
    detail: emiCheck
      ? `EMIs move from ${emiCheck.currentLoanPct}% to ${emiCheck.newLoanPct}% of net income.`
      : `No new EMI. Existing EMIs stay at ${base.percentages.loans_pct}% of net income.`,
  });

  // 4. Goals
  checks.push({
    area: "Financial goals",
    status:
      goalRequiredMonthly > 0 && monthlyImpact + goalRequiredMonthly > disposable
        ? "fail"
        : goalRequiredMonthly > 0
        ? "caution"
        : "pass",
    detail:
      goalRequiredMonthly > 0
        ? `Your goals need ₹${goalRequiredMonthly.toLocaleString("en-IN")}/month; this decision adds ₹${monthlyImpact.toLocaleString("en-IN")} against ₹${disposable.toLocaleString("en-IN")} available.`
        : "No active goal contributions competing for this money.",
  });

  // 5. Shock resilience
  const shockNet = Math.round(base.totals.netIncome * 0.9);
  const shockSavings =
    shockNet -
    base.totals.essentialsTotal -
    base.totals.lifestyleTotal -
    base.totals.loansTotal -
    monthlyImpact;
  checks.push({
    area: "Shock resilience",
    status: shockSavings < 0 ? "fail" : shockSavings < base.totals.netIncome * 0.05 ? "caution" : "pass",
    detail:
      shockSavings < 0
        ? `A 10% income drop would leave you ₹${Math.abs(shockSavings).toLocaleString("en-IN")} short each month with this commitment.`
        : `Even after a 10% income drop you'd keep ₹${shockSavings.toLocaleString("en-IN")}/month of slack.`,
  });

  // 6. Future position
  const projectedYear =
    (base.totals.savingsTotal - monthlyImpact) * 12;
  checks.push({
    area: "12-month position",
    status: projectedYear <= 0 ? "fail" : projectedYear < ef.essentialMonthly * 3 ? "caution" : "pass",
    detail:
      projectedYear <= 0
        ? "You would add nothing to savings over the next 12 months."
        : `You'd still add about ₹${projectedYear.toLocaleString("en-IN")} to savings over 12 months.`,
  });

  const fails = checks.filter((c) => c.status === "fail").length;
  const cautions = checks.filter((c) => c.status === "caution").length;
  const verdict: AffordVerdict = fails > 0 ? "red" : cautions >= 2 ? "yellow" : "green";
  const label =
    verdict === "green"
      ? "Go ahead"
      : verdict === "yellow"
      ? "Proceed carefully"
      : "Not yet";

  const summary =
    verdict === "green"
      ? `All six checks clear. This decision fits inside your current budget, keeps your emergency cover intact and survives a 10% income shock.`
      : verdict === "yellow"
      ? `${cautions} area${cautions === 1 ? "" : "s"} need attention: ${checks
          .filter((c) => c.status === "caution")
          .map((c) => c.area.toLowerCase())
          .join(", ")}. It's doable, but not free of consequences.`
      : `${fails} check${fails === 1 ? "" : "s"} failed: ${checks
          .filter((c) => c.status === "fail")
          .map((c) => c.area.toLowerCase())
          .join(", ")}. Committing now would put your finances under real strain.`;

  const action =
    verdict === "green"
      ? monthlyImpact > 0
        ? `Set up the payment right after salary day and keep your emergency fund untouched.`
        : `Pay from savings and rebuild the dip over the next two months.`
      : verdict === "yellow"
      ? `Reduce the size of the commitment (a shorter tenure or lower amount) or delay it by 3 months while you build cover.`
      : `Pause this decision. Fix the failing area first — ${checks.find((c) => c.status === "fail")?.area.toLowerCase()} — then re-run it here.`;

  return { verdict, label, checks, summary, action };
}
