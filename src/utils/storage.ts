import { BudgetPlan, DEFAULT_TAX } from "@/types/budget";
import { getSession } from "@/utils/auth";

const STORAGE_KEY = "smartbudget_plans";
const DRAFT_KEY = "smartbudget_draft";

// Get user-specific storage key for data isolation
function getUserStorageKey(baseKey: string): string {
  const session = getSession();
  if (session?.userId) {
    return `${baseKey}_${session.userId}`;
  }
  return baseKey; // Fallback for unauthenticated users
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Migrate old plans to new schema (backward compatibility)
function migratePlan(plan: any): BudgetPlan {
  return {
    ...plan,
    tax: plan.tax || { ...DEFAULT_TAX },
    loans: plan.loans || [],
    percentages: {
      ...plan.percentages,
      loans_pct: plan.percentages?.loans_pct ?? 0,
    },
    benchmarksUsed: plan.benchmarksUsed ?? false,
  };
}

export function getSavedPlans(): BudgetPlan[] {
  try {
    const key = getUserStorageKey(STORAGE_KEY);
    const data = localStorage.getItem(key);
    if (!data) return [];
    const plans = JSON.parse(data);
    return plans.map(migratePlan);
  } catch {
    return [];
  }
}

export function savePlan(plan: BudgetPlan): void {
  const key = getUserStorageKey(STORAGE_KEY);
  const plans = getSavedPlans();
  const existingIndex = plans.findIndex((p) => p.id === plan.id);
  
  if (existingIndex >= 0) {
    plans[existingIndex] = plan;
  } else {
    plans.unshift(plan);
  }
  
  localStorage.setItem(key, JSON.stringify(plans));
}

export function deletePlan(id: string): void {
  const key = getUserStorageKey(STORAGE_KEY);
  const plans = getSavedPlans().filter((p) => p.id !== id);
  localStorage.setItem(key, JSON.stringify(plans));
}

export function getPlanById(id: string): BudgetPlan | undefined {
  return getSavedPlans().find((p) => p.id === id);
}

export function saveDraft(draft: Partial<BudgetPlan>): void {
  const key = getUserStorageKey(DRAFT_KEY);
  localStorage.setItem(key, JSON.stringify(draft));
}

export function getDraft(): Partial<BudgetPlan> | null {
  try {
    const key = getUserStorageKey(DRAFT_KEY);
    const data = localStorage.getItem(key);
    if (!data) return null;
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function clearDraft(): void {
  const key = getUserStorageKey(DRAFT_KEY);
  localStorage.removeItem(key);
}

// Clear all user data (for account management)
export function clearAllUserData(): void {
  const key = getUserStorageKey(STORAGE_KEY);
  const draftKey = getUserStorageKey(DRAFT_KEY);
  localStorage.removeItem(key);
  localStorage.removeItem(draftKey);
}
