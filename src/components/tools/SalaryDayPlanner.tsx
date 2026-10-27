import { useEffect, useMemo, useState } from "react";
import { BudgetPlan } from "@/types/budget";
import { Button } from "@/components/ui/button";
import { CalendarClock, Plus, Trash2, Wand2 } from "lucide-react";
import {
  analyzeCashFlow,
  CashFlowEvent,
  deriveBudget,
} from "@/utils/tools";
import { formatCurrency } from "@/utils/budgetCalculations";
import { getToolkit, updateToolkit, generateId } from "@/utils/localDb";
import { ToolCard, NumField, TextField, Stat, InsightBox } from "./ToolShell";
import { Input } from "@/components/ui/input";

interface Props {
  budget: BudgetPlan | null;
}

export function SalaryDayPlanner({ budget }: Props) {
  const [events, setEvents] = useState<CashFlowEvent[]>([]);
  const [opening, setOpening] = useState(0);
  const [draft, setDraft] = useState({ label: "", day: 1, amount: 0, inflow: false });

  useEffect(() => {
    setEvents(getToolkit().cashFlowEvents);
  }, []);

  const persist = (next: CashFlowEvent[]) => {
    setEvents(next);
    updateToolkit({ cashFlowEvents: next });
  };

  const autoFill = () => {
    if (!budget) return;
    const d = deriveBudget(budget)!;
    const next: CashFlowEvent[] = [
      { id: generateId(), label: "Salary credited", day: 1, amount: d.totals.netIncome },
      { id: generateId(), label: "Rent", day: 5, amount: -budget.essentials.rent },
      ...(budget.loans || []).map((l, i) => ({
        id: generateId(),
        label: `${l.type.replace("_", " ")} EMI`,
        day: 7 + i,
        amount: -l.emi,
      })),
      { id: generateId(), label: "Utilities & bills", day: 10, amount: -budget.essentials.bills },
      { id: generateId(), label: "Savings / SIP", day: 3, amount: -budget.savings },
      { id: generateId(), label: "Groceries", day: 12, amount: -budget.essentials.groceries },
      { id: generateId(), label: "Essential transport", day: 15, amount: -budget.essentials.transport },
      { id: generateId(), label: "Lifestyle spend", day: 20, amount: -d.totals.lifestyleTotal },
    ].filter((e) => e.amount !== 0);
    persist(next);
  };

  const add = () => {
    if (!draft.label || !draft.amount) return;
    persist([
      ...events,
      {
        id: generateId(),
        label: draft.label,
        day: Math.min(31, Math.max(1, draft.day || 1)),
        amount: draft.inflow ? Math.abs(draft.amount) : -Math.abs(draft.amount),
      },
    ]);
    setDraft({ label: "", day: 1, amount: 0, inflow: false });
  };

  const analysis = useMemo(() => analyzeCashFlow(events, opening), [events, opening]);
  const maxAbs = Math.max(
    1,
    ...analysis.timeline.map((d) => Math.abs(d.balance))
  );

  return (
    <ToolCard
      icon={CalendarClock}
      title="Salary-Day Planner"
      subtitle="Map when money lands and leaves, so nothing bounces mid-month."
      action={
        budget && (
          <Button variant="outline" size="sm" onClick={autoFill}>
            <Wand2 className="w-3.5 h-3.5 mr-1.5" />
            Auto-fill
          </Button>
        )
      }
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <NumField label="Opening balance" value={opening} onChange={setOpening} />
        <div className="col-span-2 sm:col-span-3 grid grid-cols-1 sm:grid-cols-4 gap-2 items-end">
          <TextField
            label="Event"
            value={draft.label}
            onChange={(v) => setDraft({ ...draft, label: v })}
            placeholder="e.g. Rent"
          />
          <NumField
            label="Day of month"
            value={draft.day}
            onChange={(v) => setDraft({ ...draft, day: v })}
            prefix={null}
          />
          <NumField
            label="Amount"
            value={draft.amount}
            onChange={(v) => setDraft({ ...draft, amount: v })}
          />
          <div className="flex gap-2">
            <Button
              variant={draft.inflow ? "default" : "outline"}
              size="sm"
              className="flex-1"
              onClick={() => setDraft({ ...draft, inflow: !draft.inflow })}
            >
              {draft.inflow ? "In" : "Out"}
            </Button>
            <Button size="sm" onClick={add}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {events.length === 0 ? (
        <InsightBox>
          Add your salary date and recurring debits (or hit Auto-fill) to see where
          your month gets tight.
        </InsightBox>
      ) : (
        <>
          <div className="space-y-1.5">
            {analysis.timeline.map((d) => (
              <div key={d.day} className="flex items-center gap-3">
                <span className="w-12 text-xs text-muted-foreground shrink-0">
                  Day {d.day}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs truncate text-foreground">
                      {d.events.map((e) => e.label).join(", ")}
                    </p>
                    <span
                      className={`text-xs font-semibold shrink-0 ${
                        d.net >= 0 ? "text-success" : "text-muted-foreground"
                      }`}
                    >
                      {d.net >= 0 ? "+" : ""}
                      {formatCurrency(d.net)}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted mt-1 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        d.balance < 0 ? "bg-destructive" : d.balance < 15000 ? "bg-warning" : "bg-primary"
                      }`}
                      style={{
                        width: `${Math.min(100, (Math.abs(d.balance) / maxAbs) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
                <span
                  className={`w-20 text-right text-xs font-bold shrink-0 ${
                    d.balance < 0 ? "text-destructive" : "text-foreground"
                  }`}
                >
                  {formatCurrency(d.balance)}
                </span>
                <button
                  onClick={() =>
                    persist(events.filter((e) => !d.events.some((x) => x.id === e.id)))
                  }
                  className="text-muted-foreground hover:text-destructive shrink-0"
                  aria-label={`Remove day ${d.day} events`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Stat
              label="Lowest balance"
              value={formatCurrency(analysis.lowestBalance)}
              sub={`around day ${analysis.lowestDay}`}
              tone={analysis.lowestBalance < 0 ? "danger" : analysis.lowestBalance < 15000 ? "warning" : "success"}
            />
            <Stat label="Month-end balance" value={formatCurrency(analysis.endBalance)} tone="primary" />
            <Stat label="Events tracked" value={String(events.length)} />
          </div>

          {analysis.warnings.length > 0 && (
            <div className="space-y-2">
              {analysis.warnings.map((w, i) => (
                <InsightBox key={i} tone={analysis.goesNegative ? "danger" : "warning"}>
                  {w}
                </InsightBox>
              ))}
            </div>
          )}
        </>
      )}
    </ToolCard>
  );
}
