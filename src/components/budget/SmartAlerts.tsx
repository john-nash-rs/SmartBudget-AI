import { useState } from "react";
import { Percentages, BENCHMARK_AVERAGES, STRESS_THRESHOLDS } from "@/types/budget";
import { AlertTriangle, Info, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface Alert {
  id: string;
  type: "low_savings" | "high_debt" | "high_mandatory" | "lifestyle_creep";
  label: string;
  severity: "warning" | "danger";
  shortExplanation: string;
  fullExplanation: string;
  actionStep: string;
}

interface SmartAlertsProps {
  percentages: Percentages;
}

export function calculateSmartAlerts(percentages: Percentages): Alert[] {
  const alerts: Alert[] = [];

  // Low savings
  if (percentages.savings_pct < STRESS_THRESHOLDS.lowSavings) {
    alerts.push({
      id: "low_savings",
      type: "low_savings",
      label: "Low Savings",
      severity: percentages.savings_pct < 5 ? "danger" : "warning",
      shortExplanation: `Only ${percentages.savings_pct}% saved`,
      fullExplanation: `Your savings rate of ${percentages.savings_pct}% is below the recommended ${BENCHMARK_AVERAGES.savings}% for urban professionals. This leaves you vulnerable to unexpected expenses and delays long-term wealth building.`,
      actionStep: "Set up an automatic SIP of at least 10% of your income. Start with liquid funds for easy access.",
    });
  }

  // High debt
  if (percentages.loans_pct > STRESS_THRESHOLDS.highDebt) {
    alerts.push({
      id: "high_debt",
      type: "high_debt",
      label: "High EMI Load",
      severity: percentages.loans_pct > 30 ? "danger" : "warning",
      shortExplanation: `${percentages.loans_pct}% on EMIs`,
      fullExplanation: `Your EMI obligations at ${percentages.loans_pct}% exceed the ${BENCHMARK_AVERAGES.loans}% benchmark. High debt-to-income ratio can strain your finances and limit future borrowing capacity.`,
      actionStep: "Consider refinancing high-interest loans or making partial prepayments to reduce the EMI burden.",
    });
  }

  // High mandatory fees (essentials)
  if (percentages.essentials_pct > 50) {
    alerts.push({
      id: "high_mandatory",
      type: "high_mandatory",
      label: "High Fixed Costs",
      severity: percentages.essentials_pct > 60 ? "danger" : "warning",
      shortExplanation: `${percentages.essentials_pct}% on essentials`,
      fullExplanation: `Your essential expenses consume ${percentages.essentials_pct}% of income (benchmark: ${BENCHMARK_AVERAGES.essentials}%). High fixed costs reduce your ability to save or handle emergencies.`,
      actionStep: "Review if you can reduce rent (relocate, shared housing) or switch to cheaper utility plans.",
    });
  }

  // Lifestyle creep
  if (
    percentages.lifestyle_pct > BENCHMARK_AVERAGES.lifestyle &&
    percentages.savings_pct < BENCHMARK_AVERAGES.savings
  ) {
    alerts.push({
      id: "lifestyle_creep",
      type: "lifestyle_creep",
      label: "Lifestyle Creep",
      severity: "warning",
      shortExplanation: `${percentages.lifestyle_pct}% on lifestyle`,
      fullExplanation: `Your lifestyle spending (${percentages.lifestyle_pct}%) is above the ${BENCHMARK_AVERAGES.lifestyle}% benchmark while savings (${percentages.savings_pct}%) is below target. This pattern suggests lifestyle creep — expenses rising faster than savings.`,
      actionStep: "Audit subscriptions and dining expenses. Redirect at least ₹3,000/month from lifestyle to savings.",
    });
  }

  return alerts;
}

export function SmartAlerts({ percentages }: SmartAlertsProps) {
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const alerts = calculateSmartAlerts(percentages);

  if (alerts.length === 0) return null;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {alerts.map((alert) => (
          <button
            key={alert.id}
            onClick={() => setSelectedAlert(alert)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:scale-105 ${
              alert.severity === "danger"
                ? "bg-destructive/10 text-destructive border border-destructive/20"
                : "bg-warning/10 text-warning border border-warning/20"
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            {alert.label}
            <Info className="w-3 h-3 opacity-60" />
          </button>
        ))}
      </div>

      <Dialog open={!!selectedAlert} onOpenChange={() => setSelectedAlert(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle
                className={`w-5 h-5 ${
                  selectedAlert?.severity === "danger" ? "text-destructive" : "text-warning"
                }`}
              />
              {selectedAlert?.label}
            </DialogTitle>
            <DialogDescription>{selectedAlert?.shortExplanation}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <h4 className="font-medium text-foreground mb-2">Why this matters</h4>
              <p className="text-sm text-muted-foreground">{selectedAlert?.fullExplanation}</p>
            </div>
            <div className="p-4 rounded-lg bg-accent/50">
              <h4 className="font-medium text-accent-foreground mb-1">💡 Recommended Action</h4>
              <p className="text-sm text-accent-foreground/80">{selectedAlert?.actionStep}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
