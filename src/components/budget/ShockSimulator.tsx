import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BudgetPlan } from "@/types/budget";
import { SHOCK_OPTIONS, ShockType, simulateShock, ShockResult } from "@/utils/shocks";
import { formatCurrency } from "@/utils/budgetCalculations";
import { AlertTriangle, RotateCcw, ArrowRight } from "lucide-react";

interface Props {
  budget: BudgetPlan;
}

export function ShockSimulator({ budget }: Props) {
  const [result, setResult] = useState<ShockResult | null>(null);
  const [activeShock, setActiveShock] = useState<ShockType | null>(null);

  const run = (type: ShockType, value: number, label: string) => {
    setActiveShock(type);
    setResult(simulateShock(budget, type, value, label));
  };
  const reset = () => {
    setResult(null);
    setActiveShock(null);
  };

  const before = result?.before;
  const after = result?.after;

  return (
    <Card variant="elevated">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="w-5 h-5 text-warning" />
            Financial Shock Simulator
          </CardTitle>
          {result && (
            <Button variant="ghost" size="sm" onClick={reset}>
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          What happens if life doesn't go according to plan?
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(Object.keys(SHOCK_OPTIONS) as ShockType[]).map((type) => {
            const meta = SHOCK_OPTIONS[type];
            const isActive = activeShock === type;
            return (
              <div
                key={type}
                className={`p-3 rounded-xl border transition-all ${
                  isActive
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{meta.icon}</span>
                  <div>
                    <p className="font-semibold text-sm text-foreground">
                      {meta.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{meta.subtitle}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {meta.options.map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => run(type, opt.value, opt.label)}
                      className={`px-2.5 py-1 text-xs rounded-md border transition-all ${
                        result?.shockType === type && result?.optionLabel === opt.label
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-foreground hover:border-primary/50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {result && before && after && (
          <div className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-2 gap-3">
              <MetricBlock title="Before" data={before} />
              <MetricBlock title="After" data={after} highlight />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <DiffPill
                label="Net Income"
                value={formatCurrency(result.diff.netIncome)}
                positive={result.diff.netIncome >= 0}
              />
              <DiffPill
                label="Savings"
                value={`${result.diff.savings > 0 ? "+" : ""}${result.diff.savings}%`}
                positive={result.diff.savings >= 0}
              />
              <DiffPill
                label="Health"
                value={`${result.diff.healthScore > 0 ? "+" : ""}${result.diff.healthScore}`}
                positive={result.diff.healthScore >= 0}
              />
              <DiffPill
                label="Flexibility"
                value={`${result.diff.flexibility > 0 ? "+" : ""}${result.diff.flexibility}`}
                positive={result.diff.flexibility >= 0}
              />
            </div>
            <div className="p-3 rounded-lg bg-accent/40 text-sm flex gap-2">
              <ArrowRight className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <p>{result.insight}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MetricBlock({
  title,
  data,
  highlight,
}: {
  title: string;
  data: any;
  highlight?: boolean;
}) {
  return (
    <div
      className={`p-3 rounded-lg ${
        highlight ? "bg-primary/10 border border-primary/30" : "bg-muted/50"
      }`}
    >
      <p className="text-xs text-muted-foreground mb-2">{title}</p>
      <div className="space-y-1 text-sm">
        <p>
          Net:{" "}
          <span className="font-semibold">{formatCurrency(data.netIncome)}</span>
        </p>
        <p>
          Savings:{" "}
          <span className="font-semibold">{data.percentages.savings_pct}%</span>
        </p>
        <p>
          Loans:{" "}
          <span className="font-semibold">{data.percentages.loans_pct}%</span>
        </p>
        <p>
          Health:{" "}
          <span className="font-semibold">{data.healthScore}/100</span>
        </p>
        <p>
          Buffer:{" "}
          <span className="font-semibold">
            {data.monthsOfBufferCovered} mo
          </span>
        </p>
      </div>
    </div>
  );
}

function DiffPill({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive: boolean;
}) {
  return (
    <div
      className={`p-2 rounded-lg border text-xs ${
        positive
          ? "border-success/30 bg-success/10 text-success"
          : "border-destructive/30 bg-destructive/10 text-destructive"
      }`}
    >
      <p className="text-[10px] opacity-80">{label}</p>
      <p className="font-bold">{value}</p>
    </div>
  );
}
