export interface CustomCategory {
  name: string;
  amount: number;
}

export interface EssentialExpenses {
  rent: number;
  groceries: number;
  transport: number;
  bills: number;
  custom: CustomCategory[];
}

export interface LifestyleExpenses {
  eating_out: number;
  shopping: number;
  entertainment: number;
  misc: number;
  custom: CustomCategory[];
}

export type TaxRegime = "old" | "new";

export interface TaxInfo {
  regime: TaxRegime;
  monthlyTax: number;
  manualOverride: boolean;
}

export type LoanType = "education" | "personal" | "car" | "credit_card";

export interface LoanEntry {
  type: LoanType;
  emi: number;
  tenure: number; // months remaining
}

export interface Percentages {
  essentials_pct: number;
  lifestyle_pct: number;
  loans_pct: number;
  savings_pct: number;
  remaining_pct: number;
}

export interface BudgetPlan {
  id: string;
  dateSaved: string;
  income: number;
  tax: TaxInfo;
  essentials: EssentialExpenses;
  lifestyle: LifestyleExpenses;
  loans: LoanEntry[];
  savings: number;
  percentages: Percentages;
  aiSuggestions: string[];
  benchmarksUsed: boolean;
}

export interface BudgetTotals {
  grossIncome: number;
  netIncome: number;
  monthlyTax: number;
  essentialsTotal: number;
  lifestyleTotal: number;
  loansTotal: number;
  savingsTotal: number;
  remainingTotal: number;
  totalExpenses: number;
}

// Benchmark averages for urban Indian professionals (% of net income)
export const BENCHMARK_AVERAGES = {
  essentials: 45,
  lifestyle: 31,
  loans: 14,
  savings: 20,
};

// Stress flag thresholds
export const STRESS_THRESHOLDS = {
  lowSavings: 10,      // < 10% savings
  highDebt: 20,        // > 20% loans
  lowFlexibility: 55,  // fixed costs > 55%
};

export const DEFAULT_TAX: TaxInfo = {
  regime: "new",
  monthlyTax: 0,
  manualOverride: false,
};

export const DEFAULT_ESSENTIALS: EssentialExpenses = {
  rent: 0,
  groceries: 0,
  transport: 0,
  bills: 0,
  custom: [],
};

export const DEFAULT_LIFESTYLE: LifestyleExpenses = {
  eating_out: 0,
  shopping: 0,
  entertainment: 0,
  misc: 0,
  custom: [],
};

export const LOAN_TYPE_LABELS: Record<LoanType, string> = {
  education: "Education Loan",
  personal: "Personal Loan",
  car: "Car Loan",
  credit_card: "Credit Card EMI",
};

export const DEMO_DATA = {
  income: 75000,
  tax: {
    regime: "new" as TaxRegime,
    monthlyTax: 5000,
    manualOverride: false,
  },
  essentials: {
    rent: 20000,
    groceries: 8000,
    transport: 3000,
    bills: 4000,
    custom: [{ name: "Insurance", amount: 2000 }],
  },
  lifestyle: {
    eating_out: 5000,
    shopping: 4000,
    entertainment: 3000,
    misc: 2000,
    custom: [],
  },
  loans: [
    { type: "education" as LoanType, emi: 8000, tenure: 48 },
  ],
  savings: 8000,
};
