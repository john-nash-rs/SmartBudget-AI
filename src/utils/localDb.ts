import {
  BudgetPlan,
  EssentialExpenses,
  LifestyleExpenses,
  LoanEntry,
  TaxInfo,
  Percentages,
  DEFAULT_ESSENTIALS,
  DEFAULT_LIFESTYLE,
  DEFAULT_TAX,
} from "@/types/budget";

import { FinancialGoal } from "@/utils/goals";
import {
  AnnualExpense,
  CashFlowEvent,
  FamilyObligation,
  Subscription,
} from "@/utils/tools";


const DB_KEY = "smartbudget_db";
const DRAFT_KEY = "smartbudget_draft";

// ─── Data structure ───────────────────────────────────────────
export interface BudgetProfile {
  monthlyIncome: number;
  tax: TaxInfo;
  loans: LoanEntry[];
  essentials: EssentialExpenses;
  lifestyle: LifestyleExpenses;
  savings: number;
}

export interface HistoryEntry {
  id: string;
  dateSaved: string;
  income: number;
  percentages: Percentages;
  healthScore: number;
  savingsRate: number;
  loanBurden: number;
  flexibilityScore: number;
  riskIndex: string;
}

export interface ToolkitData {
  cashFlowEvents: CashFlowEvent[];
  annualExpenses: AnnualExpense[];
  familyObligations: FamilyObligation[];
  subscriptions: Subscription[];
  emergencyCorpus: number;
}

export interface LocalDatabase {
  profile: BudgetProfile;
  plans: BudgetPlan[];
  history: HistoryEntry[];
  chatHistory: Array<{ role: "user" | "assistant"; content: string; timestamp: string }>;
  goals: FinancialGoal[];
  shockSimulations: Array<{ id: string; type: string; option: string; runAt: string }>;
  toolkit: ToolkitData;
}

const DEFAULT_TOOLKIT: ToolkitData = {
  cashFlowEvents: [],
  annualExpenses: [],
  familyObligations: [],
  subscriptions: [],
  emergencyCorpus: 0,
};

// ─── Default state ────────────────────────────────────────────
const DEFAULT_DB: LocalDatabase = {
  profile: {
    monthlyIncome: 0,
    tax: { ...DEFAULT_TAX },
    loans: [],
    essentials: { ...DEFAULT_ESSENTIALS },
    lifestyle: { ...DEFAULT_LIFESTYLE },
    savings: 0,
  },
  plans: [],
  history: [],
  chatHistory: [],
  goals: [],
  shockSimulations: [],
  toolkit: { ...DEFAULT_TOOLKIT },
};


// ─── Core CRUD ────────────────────────────────────────────────
export function getData(): LocalDatabase {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) return { ...DEFAULT_DB };
    const parsed = JSON.parse(raw) as Partial<LocalDatabase>;
    return {
      profile: parsed.profile ?? { ...DEFAULT_DB.profile },
      plans: parsed.plans ?? [],
      history: parsed.history ?? [],
      chatHistory: parsed.chatHistory ?? [],
      goals: parsed.goals ?? [],
      shockSimulations: parsed.shockSimulations ?? [],
      toolkit: { ...DEFAULT_TOOLKIT, ...(parsed.toolkit ?? {}) },
    };
  } catch {
    return { ...DEFAULT_DB };
  }
}

// ─── Toolkit ──────────────────────────────────────────────────
export function getToolkit(): ToolkitData {
  return getData().toolkit;
}

export function updateToolkit(patch: Partial<ToolkitData>): ToolkitData {
  const data = getData();
  data.toolkit = { ...data.toolkit, ...patch };
  saveData(data);
  return data.toolkit;
}


// ─── Goals ────────────────────────────────────────────────────
export function getGoals(): FinancialGoal[] {
  return getData().goals;
}

export function saveGoal(goal: FinancialGoal): void {
  const data = getData();
  const idx = data.goals.findIndex((g) => g.id === goal.id);
  if (idx >= 0) data.goals[idx] = goal;
  else data.goals.unshift(goal);
  saveData(data);
}

export function deleteGoal(id: string): void {
  const data = getData();
  data.goals = data.goals.filter((g) => g.id !== id);
  saveData(data);
}


export function saveData(data: LocalDatabase): void {
  localStorage.setItem(DB_KEY, JSON.stringify(data));
}

export function updateField<K extends keyof LocalDatabase>(
  key: K,
  value: LocalDatabase[K]
): void {
  const data = getData();
  data[key] = value;
  saveData(data);
}

export function resetAllData(): void {
  localStorage.removeItem(DB_KEY);
  localStorage.removeItem(DRAFT_KEY);
}

// ─── Plan helpers ─────────────────────────────────────────────
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function getSavedPlans(): BudgetPlan[] {
  return getData().plans;
}

export function savePlan(plan: BudgetPlan): void {
  const data = getData();
  const existingIndex = data.plans.findIndex((p) => p.id === plan.id);
  if (existingIndex >= 0) {
    data.plans[existingIndex] = plan;
  } else {
    data.plans.unshift(plan);
  }
  saveData(data);
}

export function deletePlan(id: string): void {
  const data = getData();
  data.plans = data.plans.filter((p) => p.id !== id);
  saveData(data);
}

export function getPlanById(id: string): BudgetPlan | undefined {
  return getData().plans.find((p) => p.id === id);
}

// ─── History helpers ──────────────────────────────────────────
export function addHistoryEntry(entry: HistoryEntry): void {
  const data = getData();
  data.history.unshift(entry);
  // Keep max 50 entries
  if (data.history.length > 50) data.history = data.history.slice(0, 50);
  saveData(data);
}

export function getHistory(): HistoryEntry[] {
  return getData().history;
}

export function getHistoryTrend(): {
  savingsImprovement: number | null;
  message: string;
} {
  const history = getHistory();
  if (history.length < 2) {
    return { savingsImprovement: null, message: "Not enough data for trends yet. Save at least 2 budgets." };
  }
  const latest = history[0];
  const previous = history[1];
  const diff = latest.savingsRate - previous.savingsRate;
  if (diff > 0) {
    return { savingsImprovement: diff, message: `Your savings improved by ${diff}% since last entry! 🎉` };
  } else if (diff < 0) {
    return { savingsImprovement: diff, message: `Your savings dropped by ${Math.abs(diff)}% since last entry. Consider reviewing expenses.` };
  }
  return { savingsImprovement: 0, message: "Your savings rate is unchanged since last entry." };
}

// ─── Chat history ─────────────────────────────────────────────
export function saveChatHistory(
  messages: Array<{ role: "user" | "assistant"; content: string; timestamp: string }>
): void {
  updateField("chatHistory", messages);
}

export function getChatHistory(): Array<{ role: "user" | "assistant"; content: string; timestamp: string }> {
  return getData().chatHistory;
}

export function clearChatHistory(): void {
  updateField("chatHistory", []);
}

// ─── Draft helpers ────────────────────────────────────────────
export function saveDraft(draft: Partial<BudgetPlan>): void {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function getDraft(): Partial<BudgetPlan> | null {
  try {
    const data = localStorage.getItem(DRAFT_KEY);
    if (!data) return null;
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function clearDraft(): void {
  localStorage.removeItem(DRAFT_KEY);
}

// ─── Export ───────────────────────────────────────────────────
export function exportAllDataAsJSON(): void {
  const data = getData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `smartbudget_export_${new Date().toISOString().split("T")[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
