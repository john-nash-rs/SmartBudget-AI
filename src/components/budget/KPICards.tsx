import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/utils/budgetCalculations";
import { getFlexibilityLabel, type RiskLevel } from "@/utils/analytics";
import { Wallet, PiggyBank, CreditCard, Activity, Shield, TrendingDown } from "lucide-react";

interface KPICardsProps {
  netIncome: number;
  savingsRate: number;
  loanBurden: number;
  flexibilityScore: number;
  disposableIncome: number;
  riskIndex: { level: RiskLevel; score: number; color: string };
}

export function KPICards({
  netIncome,
  savingsRate,
  loanBurden,
  flexibilityScore,
  disposableIncome,
  riskIndex,
}: KPICardsProps) {
  const flexibility = getFlexibilityLabel(flexibilityScore);

  const kpis = [
    {
      label: "Net Income",
      value: formatCurrency(netIncome),
      icon: Wallet,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Savings Rate",
      value: `${savingsRate}%`,
      icon: PiggyBank,
      color: savingsRate >= 20 ? "text-success" : savingsRate >= 10 ? "text-warning" : "text-destructive",
      bgColor: savingsRate >= 20 ? "bg-success/10" : savingsRate >= 10 ? "bg-warning/10" : "bg-destructive/10",
    },
    {
      label: "Loan Burden",
      value: `${loanBurden}%`,
      icon: CreditCard,
      color: loanBurden <= 14 ? "text-success" : loanBurden <= 20 ? "text-warning" : "text-destructive",
      bgColor: loanBurden <= 14 ? "bg-success/10" : loanBurden <= 20 ? "bg-warning/10" : "bg-destructive/10",
    },
    {
      label: "Flexibility",
      value: `${flexibilityScore}%`,
      subtitle: flexibility.label,
      icon: Activity,
      color: flexibility.color,
      bgColor: "bg-primary/10",
    },
    {
      label: "Disposable",
      value: formatCurrency(disposableIncome),
      icon: TrendingDown,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Risk Index",
      value: riskIndex.level,
      icon: Shield,
      color: riskIndex.color,
      bgColor: riskIndex.level === "Low" ? "bg-success/10" : riskIndex.level === "Medium" ? "bg-warning/10" : "bg-destructive/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {kpis.map((kpi) => (
        <Card
          key={kpi.label}
          variant="elevated"
          className="overflow-hidden group hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
        >
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-lg ${kpi.bgColor} flex items-center justify-center`}>
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
            </div>
            <p className={`text-lg font-bold ${kpi.color}`}>{kpi.value}</p>
            <p className="text-xs text-muted-foreground">{kpi.label}</p>
            {kpi.subtitle && (
              <p className={`text-xs font-medium ${kpi.color}`}>{kpi.subtitle}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
