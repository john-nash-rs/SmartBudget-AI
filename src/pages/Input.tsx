import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CurrencyInput } from "@/components/budget/CurrencyInput";
import { ExpenseCard } from "@/components/budget/ExpenseCard";
import { TaxCard } from "@/components/budget/TaxCard";
import { LoansCard } from "@/components/budget/LoansCard";
import {
  EssentialExpenses,
  LifestyleExpenses,
  LoanEntry,
  TaxRegime,
  DEFAULT_ESSENTIALS,
  DEFAULT_LIFESTYLE,
  DEFAULT_TAX,
} from "@/types/budget";
import {
  calculateTotals,
  calculatePercentages,
  calculateMonthlyTax,
  formatCurrency,
} from "@/utils/budgetCalculations";
import { generateSmartRecommendations } from "@/utils/analytics";
import { saveDraft, getDraft, clearDraft, generateId, addHistoryEntry, getHistory } from "@/utils/localDb";
import { calculateHealthScore } from "@/components/budget/HealthScore";
import { calculateFlexibilityScore, calculateRiskIndex } from "@/utils/analytics";
import { toast } from "sonner";
import { Sparkles, RotateCcw, Save, Home as HomeIcon, ShoppingBag, PiggyBank, IndianRupee } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ESSENTIAL_FIELDS = [
  { key: "rent", label: "Rent / Housing", tooltip: "Monthly rent, EMI, or housing costs" },
  { key: "groceries", label: "Groceries", tooltip: "Monthly groceries and household items" },
  { key: "transport", label: "Transport", tooltip: "Fuel, metro, auto, cab fares" },
  { key: "bills", label: "Bills & Utilities", tooltip: "Electricity, water, internet, phone" },
];

const LIFESTYLE_FIELDS = [
  { key: "eating_out", label: "Eating Out", tooltip: "Restaurants, cafes, food delivery" },
  { key: "shopping", label: "Shopping", tooltip: "Clothes, electronics, personal items" },
  { key: "entertainment", label: "Entertainment", tooltip: "Movies, streaming, games, hobbies" },
  { key: "misc", label: "Miscellaneous", tooltip: "Other lifestyle expenses" },
];

export default function Input() {
  const navigate = useNavigate();
  const [income, setIncome] = useState(0);
  const [taxRegime, setTaxRegime] = useState<TaxRegime>("new");
  const [manualTax, setManualTax] = useState(0);
  const [manualTaxOverride, setManualTaxOverride] = useState(false);
  const [essentials, setEssentials] = useState<EssentialExpenses>({ ...DEFAULT_ESSENTIALS });
  const [lifestyle, setLifestyle] = useState<LifestyleExpenses>({ ...DEFAULT_LIFESTYLE });
  const [loans, setLoans] = useState<LoanEntry[]>([]);
  const [savings, setSavings] = useState(0);
  const [showResetDialog, setShowResetDialog] = useState(false);

  useEffect(() => {
    const draft = getDraft();
    if (draft) {
      if (draft.income) setIncome(draft.income);
      if (draft.tax) {
        setTaxRegime(draft.tax.regime || "new");
        setManualTax(draft.tax.monthlyTax || 0);
        setManualTaxOverride(draft.tax.manualOverride || false);
      }
      if (draft.essentials) setEssentials({ ...DEFAULT_ESSENTIALS, ...draft.essentials });
      if (draft.lifestyle) setLifestyle({ ...DEFAULT_LIFESTYLE, ...draft.lifestyle });
      if (draft.loans) setLoans(draft.loans);
      if (draft.savings) setSavings(draft.savings);
    }
  }, []);

  const calculatedTax = calculateMonthlyTax(income, taxRegime);
  const effectiveTax = manualTaxOverride ? manualTax : calculatedTax;
  const netIncome = income - effectiveTax;

  const totals = calculateTotals(income, effectiveTax, essentials, lifestyle, loans, savings);
  const percentages = calculatePercentages(netIncome, totals);
  const hasData = income > 0 || totals.totalExpenses > 0;
  const exceedsIncome = totals.totalExpenses > netIncome && netIncome > 0;

  const getEssentialValues = (): Record<string, number> => ({
    rent: essentials.rent,
    groceries: essentials.groceries,
    transport: essentials.transport,
    bills: essentials.bills,
  });

  const getLifestyleValues = (): Record<string, number> => ({
    eating_out: lifestyle.eating_out,
    shopping: lifestyle.shopping,
    entertainment: lifestyle.entertainment,
    misc: lifestyle.misc,
  });

  const handleEssentialChange = (key: string, value: number) => {
    setEssentials((prev) => ({ ...prev, [key]: value }));
  };

  const handleLifestyleChange = (key: string, value: number) => {
    setLifestyle((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddEssentialCustom = (name: string, amount: number) => {
    setEssentials((prev) => ({ ...prev, custom: [...prev.custom, { name, amount }] }));
  };
  const handleRemoveEssentialCustom = (index: number) => {
    setEssentials((prev) => ({ ...prev, custom: prev.custom.filter((_, i) => i !== index) }));
  };
  const handleUpdateEssentialCustom = (index: number, amount: number) => {
    setEssentials((prev) => ({ ...prev, custom: prev.custom.map((c, i) => (i === index ? { ...c, amount } : c)) }));
  };

  const handleAddLifestyleCustom = (name: string, amount: number) => {
    setLifestyle((prev) => ({ ...prev, custom: [...prev.custom, { name, amount }] }));
  };
  const handleRemoveLifestyleCustom = (index: number) => {
    setLifestyle((prev) => ({ ...prev, custom: prev.custom.filter((_, i) => i !== index) }));
  };
  const handleUpdateLifestyleCustom = (index: number, amount: number) => {
    setLifestyle((prev) => ({ ...prev, custom: prev.custom.map((c, i) => (i === index ? { ...c, amount } : c)) }));
  };

  const handleAddLoan = (loan: LoanEntry) => setLoans((prev) => [...prev, loan]);
  const handleRemoveLoan = (index: number) => setLoans((prev) => prev.filter((_, i) => i !== index));
  const handleUpdateLoan = (index: number, loan: LoanEntry) => setLoans((prev) => prev.map((l, i) => (i === index ? loan : l)));

  const handleSaveDraft = () => {
    saveDraft({
      income,
      tax: { regime: taxRegime, monthlyTax: manualTax, manualOverride: manualTaxOverride },
      essentials,
      lifestyle,
      loans,
      savings,
    });
    toast.success("Draft saved!");
  };

  const handleReset = () => {
    setIncome(0);
    setTaxRegime("new");
    setManualTax(0);
    setManualTaxOverride(false);
    setEssentials({ ...DEFAULT_ESSENTIALS });
    setLifestyle({ ...DEFAULT_LIFESTYLE });
    setLoans([]);
    setSavings(0);
    clearDraft();
    setShowResetDialog(false);
    toast.success("All inputs cleared");
  };

  const handleGenerate = () => {
    if (income <= 0) {
      toast.error("Please enter your monthly income");
      return;
    }
    if (exceedsIncome) {
      toast.error("Your expenses exceed your net income. Please revise your values.");
      return;
    }

    const history = getHistory();
    const suggestions = generateSmartRecommendations(percentages, totals, history.length);
    const { score: healthScore } = calculateHealthScore(percentages, totals.remainingTotal > 0);
    const flexScore = calculateFlexibilityScore(percentages);
    const risk = calculateRiskIndex(percentages);

    const planId = generateId();

    // Save history snapshot
    addHistoryEntry({
      id: planId,
      dateSaved: new Date().toISOString(),
      income,
      percentages,
      healthScore,
      savingsRate: percentages.savings_pct,
      loanBurden: percentages.loans_pct,
      flexibilityScore: flexScore,
      riskIndex: risk.level,
    });

    const plan = {
      id: planId,
      dateSaved: new Date().toISOString(),
      income,
      tax: { regime: taxRegime, monthlyTax: effectiveTax, manualOverride: manualTaxOverride },
      essentials,
      lifestyle,
      loans,
      savings,
      percentages,
      aiSuggestions: suggestions,
      benchmarksUsed: true,
    };

    sessionStorage.setItem("currentBudget", JSON.stringify(plan));
    navigate("/summary");
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="mb-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">Create Your Budget</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Enter your income and expenses to get personalized insights
        </p>
      </div>

      <div className="space-y-6">
        {/* Income Card */}
        <Card variant="elevated" className="animate-slide-up overflow-hidden">
          <CardHeader className="bg-primary/5 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <IndianRupee className="w-5 h-5 text-primary" />
              </div>
              <CardTitle className="text-base">Gross Monthly Income</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-5">
            <CurrencyInput
              label="Monthly salary (before tax)"
              value={income}
              onChange={setIncome}
              max={500000}
              step={5000}
              showSlider
              tooltip="Your monthly CTC or gross salary before any deductions"
            />
          </CardContent>
        </Card>

        {/* Tax Card */}
        <div className="animate-slide-up" style={{ animationDelay: "50ms" }}>
          <TaxCard
            regime={taxRegime}
            calculatedTax={calculatedTax}
            manualTax={manualTax}
            manualOverride={manualTaxOverride}
            netIncome={netIncome}
            onRegimeChange={setTaxRegime}
            onManualTaxChange={setManualTax}
            onOverrideChange={setManualTaxOverride}
          />
        </div>

        {/* Essentials */}
        <div className="animate-slide-up" style={{ animationDelay: "100ms" }}>
          <ExpenseCard
            title="Essential Expenses"
            icon={<HomeIcon className="w-5 h-5" />}
            fields={ESSENTIAL_FIELDS}
            values={getEssentialValues()}
            customCategories={essentials.custom}
            onFieldChange={handleEssentialChange}
            onAddCustom={handleAddEssentialCustom}
            onRemoveCustom={handleRemoveEssentialCustom}
            onUpdateCustom={handleUpdateEssentialCustom}
            accentColor="primary"
          />
        </div>

        {/* Lifestyle */}
        <div className="animate-slide-up" style={{ animationDelay: "150ms" }}>
          <ExpenseCard
            title="Lifestyle Expenses"
            icon={<ShoppingBag className="w-5 h-5" />}
            fields={LIFESTYLE_FIELDS}
            values={getLifestyleValues()}
            customCategories={lifestyle.custom}
            onFieldChange={handleLifestyleChange}
            onAddCustom={handleAddLifestyleCustom}
            onRemoveCustom={handleRemoveLifestyleCustom}
            onUpdateCustom={handleUpdateLifestyleCustom}
            accentColor="blue"
          />
        </div>

        {/* Loans & EMIs */}
        <div className="animate-slide-up" style={{ animationDelay: "200ms" }}>
          <LoansCard
            loans={loans}
            totalEmi={totals.loansTotal}
            emiPercentage={percentages.loans_pct}
            onAddLoan={handleAddLoan}
            onRemoveLoan={handleRemoveLoan}
            onUpdateLoan={handleUpdateLoan}
          />
        </div>

        {/* Savings */}
        <Card variant="elevated" className="animate-slide-up overflow-hidden" style={{ animationDelay: "250ms" }}>
          <CardHeader className="bg-warning/5 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                <PiggyBank className="w-5 h-5 text-warning" />
              </div>
              <CardTitle className="text-base">Savings & Investments</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-5">
            <CurrencyInput
              label="Monthly savings"
              value={savings}
              onChange={setSavings}
              tooltip="Fixed deposits, SIPs, investments, emergency fund"
            />
          </CardContent>
        </Card>

        {/* Summary Bar */}
        <Card
          variant={exceedsIncome ? "bordered" : "accent"}
          className={`animate-slide-up ${exceedsIncome ? "border-destructive" : ""}`}
          style={{ animationDelay: "300ms" }}
        >
          <CardContent className="py-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Gross Income</p>
                <p className="font-bold text-lg text-foreground">{formatCurrency(income)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Net Income</p>
                <p className="font-bold text-lg text-primary">{formatCurrency(netIncome)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Expenses</p>
                <p className={`font-bold text-lg ${exceedsIncome ? "text-destructive" : "text-foreground"}`}>
                  {formatCurrency(totals.totalExpenses)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Remaining</p>
                <p className={`font-bold text-lg ${totals.remainingTotal >= 0 ? "text-success" : "text-destructive"}`}>
                  {formatCurrency(totals.remainingTotal)}
                </p>
              </div>
            </div>
            {exceedsIncome && (
              <p className="text-destructive text-sm mt-3 font-medium">
                ⚠️ Your expenses exceed your net income. Please adjust your values.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 animate-slide-up" style={{ animationDelay: "350ms" }}>
          <Button
            variant="hero"
            size="xl"
            onClick={handleGenerate}
            disabled={income <= 0 || exceedsIncome}
            className="w-full"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Generate Budget Insights
          </Button>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => (hasData ? setShowResetDialog(true) : null)}
              disabled={!hasData}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button
              variant="secondary"
              className="flex-1"
              onClick={handleSaveDraft}
              disabled={!hasData}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </Button>
          </div>
        </div>
      </div>

      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset all inputs?</AlertDialogTitle>
            <AlertDialogDescription>
              This will clear all your entered data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
