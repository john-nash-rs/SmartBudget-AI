import { BudgetPlan } from "@/types/budget";
import { formatCurrency } from "./budgetCalculations";

export function exportBudgetToJSON(plan: BudgetPlan): void {
  const dataStr = JSON.stringify(plan, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = `budget-plan-${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportBudgetToCSV(plan: BudgetPlan): void {
  const rows: string[][] = [
    ["Category", "Item", "Amount"],
    ["Income", "Gross Monthly Income", String(plan.income)],
    ["Tax", "Monthly Tax Deduction", String(plan.tax.monthlyTax)],
    ["", "", ""],
    ["Essentials", "Rent", String(plan.essentials.rent)],
    ["Essentials", "Groceries", String(plan.essentials.groceries)],
    ["Essentials", "Transport", String(plan.essentials.transport)],
    ["Essentials", "Bills", String(plan.essentials.bills)],
    ...plan.essentials.custom.map(c => ["Essentials", c.name, String(c.amount)]),
    ["", "", ""],
    ["Lifestyle", "Eating Out", String(plan.lifestyle.eating_out)],
    ["Lifestyle", "Shopping", String(plan.lifestyle.shopping)],
    ["Lifestyle", "Entertainment", String(plan.lifestyle.entertainment)],
    ["Lifestyle", "Miscellaneous", String(plan.lifestyle.misc)],
    ...plan.lifestyle.custom.map(c => ["Lifestyle", c.name, String(c.amount)]),
    ["", "", ""],
    ...plan.loans.map(l => ["Loans", `${l.type} EMI`, String(l.emi)]),
    ["", "", ""],
    ["Savings", "Monthly Savings", String(plan.savings)],
    ["", "", ""],
    ["Summary", "Essentials %", `${plan.percentages.essentials_pct}%`],
    ["Summary", "Lifestyle %", `${plan.percentages.lifestyle_pct}%`],
    ["Summary", "Loans %", `${plan.percentages.loans_pct}%`],
    ["Summary", "Savings %", `${plan.percentages.savings_pct}%`],
  ];

  const csvContent = rows.map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = `budget-plan-${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function generateBudgetSummaryText(plan: BudgetPlan): string {
  const netIncome = plan.income - plan.tax.monthlyTax;
  
  return `
SMARTBUDGET AI - Budget Summary
================================
Generated: ${new Date().toLocaleString("en-IN")}

INCOME
------
Gross Monthly Income: ${formatCurrency(plan.income)}
Tax Deduction (${plan.tax.regime === "new" ? "New Regime" : "Old Regime"}): ${formatCurrency(plan.tax.monthlyTax)}
Net Take-Home: ${formatCurrency(netIncome)}

BUDGET ALLOCATION
-----------------
Essentials: ${plan.percentages.essentials_pct}% of net income
Lifestyle: ${plan.percentages.lifestyle_pct}% of net income
Loans: ${plan.percentages.loans_pct}% of net income
Savings: ${plan.percentages.savings_pct}% of net income

---
Note: This is a demo-grade report from SmartBudget AI.
All data is stored locally in your browser.
  `.trim();
}
