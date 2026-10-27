import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BudgetPlan, Percentages } from "@/types/budget";
import { calculateTotals, calculatePercentages, formatCurrency } from "@/utils/budgetCalculations";
import { Lightbulb, RotateCcw, TrendingUp, ArrowRight } from "lucide-react";

interface ScenarioSimulatorProps {
  budget: BudgetPlan;
  onScenarioChange: (percentages: Percentages | null) => void;
}

type ScenarioType = "income" | "loan_end" | "save_more" | null;

export function ScenarioSimulator({ budget, onScenarioChange }: ScenarioSimulatorProps) {
  const [activeScenario, setActiveScenario] = useState<ScenarioType>(null);
  const [incomeIncrease, setIncomeIncrease] = useState<number>(10000);
  const [loanMonths, setLoanMonths] = useState<number>(12);
  const [additionalSavings, setAdditionalSavings] = useState<number>(5000);
  const [simulatedResult, setSimulatedResult] = useState<{
    oldPercentages: Percentages;
    newPercentages: Percentages;
    insight: string;
  } | null>(null);

  const runSimulation = () => {
    let newIncome = budget.income;
    let newTax = budget.tax?.monthlyTax || 0;
    let newLoans = [...(budget.loans || [])];
    let newSavings = budget.savings;

    switch (activeScenario) {
      case "income":
        newIncome = budget.income + incomeIncrease;
        // Rough tax increase estimate (30% marginal rate)
        newTax = (budget.tax?.monthlyTax || 0) + Math.round(incomeIncrease * 0.3);
        break;
      case "loan_end":
        newLoans = newLoans.filter((loan) => loan.tenure > loanMonths);
        break;
      case "save_more":
        newSavings = budget.savings + additionalSavings;
        break;
    }

    const netIncome = newIncome - newTax;
    const newTotals = calculateTotals(
      newIncome,
      newTax,
      budget.essentials,
      budget.lifestyle,
      newLoans,
      newSavings
    );
    const newPercentages = calculatePercentages(netIncome, newTotals);

    let insight = "";
    switch (activeScenario) {
      case "income":
        const savingsImprovement = newPercentages.savings_pct - budget.percentages.savings_pct;
        insight = savingsImprovement > 0
          ? `With ₹${incomeIncrease.toLocaleString("en-IN")} more income, your savings rate could improve by ${savingsImprovement}% to ${newPercentages.savings_pct}%.`
          : `The income increase would be offset by higher taxes. Consider allocating the extra to savings.`;
        break;
      case "loan_end":
        const freedUp = budget.percentages.loans_pct - newPercentages.loans_pct;
        insight = freedUp > 0
          ? `When loans ending within ${loanMonths} months are paid off, you'll free up ${freedUp}% of your income. Redirect this to savings!`
          : "No loans will end within this period.";
        break;
      case "save_more":
        insight = `Saving an additional ₹${additionalSavings.toLocaleString("en-IN")}/month would bring your savings rate to ${newPercentages.savings_pct}%, closer to the 20% benchmark.`;
        break;
    }

    setSimulatedResult({
      oldPercentages: budget.percentages,
      newPercentages,
      insight,
    });
    onScenarioChange(newPercentages);
  };

  const resetSimulation = () => {
    setActiveScenario(null);
    setSimulatedResult(null);
    onScenarioChange(null);
  };

  const scenarios = [
    {
      type: "income" as ScenarioType,
      label: "Income increases",
      icon: TrendingUp,
    },
    {
      type: "loan_end" as ScenarioType,
      label: "Loan ends",
      icon: RotateCcw,
    },
    {
      type: "save_more" as ScenarioType,
      label: "Save more",
      icon: TrendingUp,
    },
  ];

  return (
    <Card variant="elevated" className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-warning" />
            Scenario Simulator
          </CardTitle>
          {simulatedResult && (
            <Button variant="ghost" size="sm" onClick={resetSimulation}>
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Test "what if" scenarios to see how changes affect your budget.
        </p>

        {/* Scenario Selection */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {scenarios.map((scenario) => (
            <button
              key={scenario.type}
              onClick={() => {
                setActiveScenario(scenario.type);
                setSimulatedResult(null);
              }}
              className={`p-3 rounded-lg border text-center transition-all ${
                activeScenario === scenario.type
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <scenario.icon
                className={`w-5 h-5 mx-auto mb-1 ${
                  activeScenario === scenario.type ? "text-primary" : "text-muted-foreground"
                }`}
              />
              <span className="text-xs font-medium text-foreground">{scenario.label}</span>
            </button>
          ))}
        </div>

        {/* Scenario Inputs */}
        {activeScenario && !simulatedResult && (
          <div className="space-y-4 p-4 rounded-lg bg-muted/50">
            {activeScenario === "income" && (
              <div>
                <Label className="text-sm">Income increase (₹/month)</Label>
                <Input
                  type="number"
                  value={incomeIncrease}
                  onChange={(e) => setIncomeIncrease(Number(e.target.value))}
                  className="mt-1"
                />
              </div>
            )}
            {activeScenario === "loan_end" && (
              <div>
                <Label className="text-sm">Months until loan ends</Label>
                <Input
                  type="number"
                  value={loanMonths}
                  onChange={(e) => setLoanMonths(Number(e.target.value))}
                  className="mt-1"
                />
              </div>
            )}
            {activeScenario === "save_more" && (
              <div>
                <Label className="text-sm">Additional monthly savings (₹)</Label>
                <Input
                  type="number"
                  value={additionalSavings}
                  onChange={(e) => setAdditionalSavings(Number(e.target.value))}
                  className="mt-1"
                />
              </div>
            )}
            <Button onClick={runSimulation} className="w-full">
              Run Simulation
            </Button>
          </div>
        )}

        {/* Results */}
        {simulatedResult && (
          <div className="space-y-4">
            {/* Comparison */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted/50">
              <div>
                <p className="text-xs text-muted-foreground mb-2">Current</p>
                <div className="space-y-1 text-sm">
                  <p>Savings: <span className="font-medium">{simulatedResult.oldPercentages.savings_pct}%</span></p>
                  <p>Loans: <span className="font-medium">{simulatedResult.oldPercentages.loans_pct}%</span></p>
                </div>
              </div>
              <div>
                <p className="text-xs text-primary mb-2 flex items-center gap-1">
                  <ArrowRight className="w-3 h-3" /> Simulated
                </p>
                <div className="space-y-1 text-sm">
                  <p>
                    Savings:{" "}
                    <span
                      className={`font-medium ${
                        simulatedResult.newPercentages.savings_pct > simulatedResult.oldPercentages.savings_pct
                          ? "text-success"
                          : ""
                      }`}
                    >
                      {simulatedResult.newPercentages.savings_pct}%
                    </span>
                  </p>
                  <p>
                    Loans:{" "}
                    <span
                      className={`font-medium ${
                        simulatedResult.newPercentages.loans_pct < simulatedResult.oldPercentages.loans_pct
                          ? "text-success"
                          : ""
                      }`}
                    >
                      {simulatedResult.newPercentages.loans_pct}%
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Insight */}
            <div className="p-3 rounded-lg bg-accent/50">
              <p className="text-sm text-accent-foreground">💡 {simulatedResult.insight}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
