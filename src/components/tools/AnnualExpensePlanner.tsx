import { useEffect, useMemo, useState } from "react";
import { BudgetPlan } from "@/types/budget";
import { Button } from "@/components/ui/button";
import { CalendarRange, Plus, Trash2 } from "lucide-react";
import {
  AnnualExpense,
  ANNUAL_PRESETS,
  deriveBudget,
  monthlyProvision,
  summarizeAnnualExpenses,
} from "@/utils/tools";
import { formatCurrency } from "@/utils/budgetCalculations";
import { getToolkit, updateToolkit, generateId } from "@/utils/localDb";
import { ToolCard, NumField, TextField, Stat, InsightBox } from "./ToolShell";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export function AnnualExpensePlanner({ budget }: { budget: BudgetPlan | null }) {
  const [items, setItems] = useState<AnnualExpense[]>([]);
  const [draft, setDraft] = useState<Omit<AnnualExpense, "id">>({
    name: "",
    amount: 0,
    frequency: "yearly",
    dueMonth: new Date().getMonth() + 1,
  });

  useEffect(() => setItems(getToolkit().annualExpenses), []);

  const persist = (next: AnnualExpense[]) => {
    setItems(next);
    updateToolkit({ annualExpenses: next });
  };

  const net = deriveBudget(budget)?.totals.netIncome;
  const summary = useMemo(() => summarizeAnnualExpenses(items, net), [items, net]);

  const add = () => {
    if (!draft.name || !draft.amount) return;
    persist([...items, { ...draft, id: generateId() }]);
    setDraft({ ...draft, name: "", amount: 0 });
  };

  const monthTotals = useMemo(() => {
    const arr = new Array(12).fill(0);
    items.forEach((e) => {
      const step = e.frequency === "yearly" ? 12 : e.frequency === "half_yearly" ? 6 : 3;
      for (let m = e.dueMonth - 1; m < 12; m += step) arr[m] += e.amount;
    });
    return arr;
  }, [items]);
  const maxMonth = Math.max(1, ...monthTotals);

  return (
    <ToolCard
      icon={CalendarRange}
      title="Annual Expense Planner"
      subtitle="Insurance, fees and renewals don't arrive monthly — provision for them monthly."
    >
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-end">
        <TextField
          label="Expense"
          value={draft.name}
          onChange={(v) => setDraft({ ...draft, name: v })}
          placeholder="Vehicle insurance"
        />
        <NumField
          label="Amount per payment"
          value={draft.amount}
          onChange={(v) => setDraft({ ...draft, amount: v })}
        />
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Frequency</Label>
          <Select
            value={draft.frequency}
            onValueChange={(v) => setDraft({ ...draft, frequency: v as AnnualExpense["frequency"] })}
          >
            <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="yearly">Yearly</SelectItem>
              <SelectItem value="half_yearly">Half-yearly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Due month</Label>
          <Select
            value={String(draft.dueMonth)}
            onValueChange={(v) => setDraft({ ...draft, dueMonth: parseInt(v, 10) })}
          >
            <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => (
                <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={add} className="h-10">
          <Plus className="w-4 h-4 mr-1" /> Add
        </Button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {ANNUAL_PRESETS.filter((p) => !items.some((i) => i.name === p)).map((p) => (
          <button
            key={p}
            onClick={() => setDraft({ ...draft, name: p })}
            className="px-2.5 py-1 text-xs rounded-md border border-border text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
          >
            + {p}
          </button>
        ))}
      </div>

      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((e) => (
            <div
              key={e.id}
              className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-muted/40"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{e.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {formatCurrency(e.amount)} · {e.frequency.replace("_", "-")} · due {MONTHS[e.dueMonth - 1]}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-sm font-semibold text-primary">
                  {formatCurrency(monthlyProvision(e))}/mo
                </span>
                <button
                  onClick={() => persist(items.filter((x) => x.id !== e.id))}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label={`Remove ${e.name}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Stat label="Monthly provision" value={formatCurrency(summary.totalMonthlyProvision)} tone="primary" />
        <Stat label="Annual commitment" value={formatCurrency(summary.totalAnnual)} />
        <Stat
          label="Share of net income"
          value={summary.provisionPctOfNet !== null ? `${summary.provisionPctOfNet}%` : "—"}
          tone={summary.provisionPctOfNet && summary.provisionPctOfNet > 10 ? "warning" : "default"}
        />
      </div>

      {items.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">Due across the year</p>
          <div className="flex items-end gap-1.5 h-24">
            {monthTotals.map((amt, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex-1 flex items-end">
                  <div
                    className={`w-full rounded-t ${amt === maxMonth && amt > 0 ? "bg-warning" : "bg-primary/60"}`}
                    style={{ height: `${(amt / maxMonth) * 100}%` }}
                    title={`${MONTHS[i]}: ${formatCurrency(amt)}`}
                  />
                </div>
                <span className="text-[9px] text-muted-foreground">{MONTHS[i][0]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <InsightBox tone={summary.totalMonthlyProvision > 0 ? "warning" : "default"}>
        {summary.insight}
      </InsightBox>
    </ToolCard>
  );
}
