import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BudgetPieChart } from "@/components/budget/BudgetCharts";
import { BenchmarkChart } from "@/components/budget/BenchmarkChart";
import { SuggestionCard } from "@/components/budget/SuggestionCard";
import { HealthScore } from "@/components/budget/HealthScore";
import { CashFlowTimeline } from "@/components/budget/CashFlowTimeline";
import { ScenarioSimulator } from "@/components/budget/ScenarioSimulator";
import { SmartAlerts } from "@/components/budget/SmartAlerts";
import { BudgetBuddyChat } from "@/components/budget/BudgetBuddyChat";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { HistoryTrendChart } from "@/components/budget/HistoryTrendChart";
import { KPICards } from "@/components/budget/KPICards";
import { BudgetPlan, BENCHMARK_AVERAGES, Percentages } from "@/types/budget";
import { calculateTotals, formatCurrency } from "@/utils/budgetCalculations";
import { savePlan, getHistory, getHistoryTrend } from "@/utils/localDb";
import { calculateDisposableIncome, calculateFlexibilityScore, calculateRiskIndex } from "@/utils/analytics";
import { toast } from "sonner";
import {
  Save, Edit, ChevronDown, ChevronUp, TrendingUp, Wallet, BarChart3, Lightbulb,
  History, ArrowRight,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export default function Summary() {
  const navigate = useNavigate();
  const [budget, setBudget] = useState<BudgetPlan | null>(null);
  const [showCalculation, setShowCalculation] = useState(false);
  const [scenarioPercentages, setScenarioPercentages] = useState<Percentages | null>(null);

  useEffect(() => {
    const data = sessionStorage.getItem("currentBudget");
    if (data) {
      setBudget(JSON.parse(data));
    } else {
      navigate("/input");
    }
  }, [navigate]);

  if (!budget) return null;

  const totals = calculateTotals(
    budget.income,
    budget.tax?.monthlyTax || 0,
    budget.essentials,
    budget.lifestyle,
    budget.loans || [],
    budget.savings
  );

  const displayPercentages = scenarioPercentages || budget.percentages;
  const disposableIncome = calculateDisposableIncome(totals);
  const flexibilityScore = calculateFlexibilityScore(displayPercentages);
  const riskIndex = calculateRiskIndex(displayPercentages);
  const history = getHistory();
  const trend = getHistoryTrend();

  const handleSave = () => {
    savePlan(budget);
    toast.success("Budget plan saved!");
    navigate("/saved");
  };

  const stats = [
    {
      label: "Essentials",
      current: totals.essentialsTotal,
      pct: displayPercentages.essentials_pct,
      benchmark: BENCHMARK_AVERAGES.essentials,
      color: "bg-chart-essentials",
    },
    {
      label: "Lifestyle",
      current: totals.lifestyleTotal,
      pct: displayPercentages.lifestyle_pct,
      benchmark: BENCHMARK_AVERAGES.lifestyle,
      color: "bg-chart-lifestyle",
    },
    {
      label: "Loans",
      current: totals.loansTotal,
      pct: displayPercentages.loans_pct,
      benchmark: BENCHMARK_AVERAGES.loans,
      color: "bg-rose-500",
    },
    {
      label: "Savings",
      current: totals.savingsTotal,
      pct: displayPercentages.savings_pct,
      benchmark: BENCHMARK_AVERAGES.savings,
      color: "bg-chart-savings",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      {/* Hero Header */}
      <div className="mb-8 animate-fade-in">
        <div className="flex items-center gap-4 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Wallet className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Your Budget Dashboard</h1>
            <p className="text-muted-foreground text-sm">Personalized insights for your financial journey</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground mt-4 p-4 rounded-xl bg-muted/30">
          <span>
            Gross: <span className="font-semibold text-foreground">{formatCurrency(budget.income)}</span>
          </span>
          <span>
            Tax: <span className="font-semibold text-foreground">{formatCurrency(budget.tax?.monthlyTax || 0)}</span>
          </span>
          <span>
            Net: <span className="font-bold text-primary text-base">{formatCurrency(totals.netIncome)}</span>
          </span>
        </div>
      </div>

      {/* Smart Alerts */}
      <div className="mb-6 animate-slide-up">
        <SmartAlerts percentages={displayPercentages} />
      </div>

      {/* KPI Cards */}
      <div className="mb-6 animate-slide-up" style={{ animationDelay: "50ms" }}>
        <KPICards
          netIncome={totals.netIncome}
          savingsRate={displayPercentages.savings_pct}
          loanBurden={displayPercentages.loans_pct}
          flexibilityScore={flexibilityScore}
          disposableIncome={disposableIncome}
          riskIndex={riskIndex}
        />
      </div>

      {/* Trend message */}
      {trend.savingsImprovement !== null && (
        <div className="mb-6 p-3 rounded-lg bg-accent/50 border border-primary/10 animate-slide-up">
          <p className="text-sm text-accent-foreground flex items-center gap-2">
            <History className="w-4 h-4 text-primary" />
            {trend.message}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Health Score */}
          <div className="animate-slide-up">
            <HealthScore percentages={displayPercentages} hasEmergencyBuffer={totals.remainingTotal > 0} />
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3 animate-slide-up" style={{ animationDelay: "50ms" }}>
            {stats.map((stat) => (
              <Card key={stat.label} variant="elevated" className="overflow-hidden group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-3 h-3 rounded-full ${stat.color}`} />
                    <span className="text-sm text-muted-foreground">{stat.label}</span>
                  </div>
                  <p className="text-xl font-bold text-foreground">{formatCurrency(stat.current)}</p>
                  <p className="text-sm text-muted-foreground">{stat.pct}% of net income</p>
                  <p className="text-xs text-muted-foreground mt-1">Benchmark: {stat.benchmark}%</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Cash Flow Timeline */}
          <div className="animate-slide-up" style={{ animationDelay: "100ms" }}>
            <CashFlowTimeline totals={totals} />
          </div>

          {/* History Trend */}
          {history.length >= 2 && (
            <div className="animate-slide-up" style={{ animationDelay: "120ms" }}>
              <HistoryTrendChart history={history} />
            </div>
          )}

          {/* Benchmark Chart */}
          <div className="animate-slide-up" style={{ animationDelay: "150ms" }}>
            <SectionHeader icon={BarChart3} title="Benchmark Comparison" subtitle="You vs. urban professionals" />
            <BenchmarkChart percentages={displayPercentages} />
          </div>

          {/* Pie Chart */}
          <div className="animate-slide-up" style={{ animationDelay: "200ms" }}>
            <BudgetPieChart income={totals.netIncome} totals={totals} percentages={displayPercentages} />
          </div>
        </div>

        {/* Sidebar - Right Column */}
        <div className="space-y-6">
          {/* Scenario Simulator */}
          <div className="animate-slide-up" style={{ animationDelay: "100ms" }}>
            <ScenarioSimulator budget={budget} onScenarioChange={setScenarioPercentages} />
          </div>

          {/* AI Insights */}
          <div className="animate-slide-up" style={{ animationDelay: "150ms" }}>
            <SectionHeader icon={Lightbulb} title="AI Insights" />
            <SuggestionCard suggestions={budget.aiSuggestions} />
          </div>

          {/* Risk Factors */}
          {riskIndex.factors.length > 0 && (
            <Card variant="bordered" className="animate-slide-up border-destructive/30" style={{ animationDelay: "170ms" }}>
              <CardContent className="p-4">
                <h3 className="font-semibold text-sm mb-2 text-destructive">⚠️ Risk Factors</h3>
                <ul className="space-y-1">
                  {riskIndex.factors.map((f, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                      <span className="text-destructive mt-0.5">•</span>{f}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Calculation Breakdown */}
          <Collapsible open={showCalculation} onOpenChange={setShowCalculation}>
            <Card variant="bordered" className="animate-slide-up" style={{ animationDelay: "200ms" }}>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      How we calculated this
                    </CardTitle>
                    {showCalculation ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="space-y-4 text-sm">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="font-medium mb-2">Income Calculation:</p>
                      <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                        <li>Gross income: {formatCurrency(budget.income)}</li>
                        <li>Monthly tax ({budget.tax?.regime === "new" ? "New Regime" : "Old Regime"}): {formatCurrency(budget.tax?.monthlyTax || 0)}</li>
                        <li>Net take-home: {formatCurrency(totals.netIncome)}</li>
                      </ol>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="font-medium mb-2">Expense Breakdown:</p>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• Essentials: {formatCurrency(totals.essentialsTotal)} ({budget.percentages.essentials_pct}%)</li>
                        <li>• Lifestyle: {formatCurrency(totals.lifestyleTotal)} ({budget.percentages.lifestyle_pct}%)</li>
                        <li>• Loans/EMIs: {formatCurrency(totals.loansTotal)} ({budget.percentages.loans_pct}%)</li>
                        <li>• Savings: {formatCurrency(totals.savingsTotal)} ({budget.percentages.savings_pct}%)</li>
                        <li>• Remaining: {formatCurrency(totals.remainingTotal)} ({budget.percentages.remaining_pct}%)</li>
                      </ul>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="font-medium mb-2">Benchmark Comparison:</p>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• Essentials: {BENCHMARK_AVERAGES.essentials}% (you: {budget.percentages.essentials_pct}%)</li>
                        <li>• Lifestyle: {BENCHMARK_AVERAGES.lifestyle}% (you: {budget.percentages.lifestyle_pct}%)</li>
                        <li>• Loans: {BENCHMARK_AVERAGES.loans}% (you: {budget.percentages.loans_pct}%)</li>
                        <li>• Savings: {BENCHMARK_AVERAGES.savings}% (you: {budget.percentages.savings_pct}%)</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 animate-slide-up" style={{ animationDelay: "250ms" }}>
            <Button variant="hero" size="xl" onClick={handleSave} className="w-full">
              <Save className="w-5 h-5 mr-2" />
              Save This Plan
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate("/input")} className="w-full">
              <Edit className="w-4 h-4 mr-2" />
              Edit Inputs
            </Button>
          </div>
        </div>
      </div>

      {/* BudgetBuddy Chatbot */}
      <BudgetBuddyChat budget={budget} />
    </div>
  );
}
