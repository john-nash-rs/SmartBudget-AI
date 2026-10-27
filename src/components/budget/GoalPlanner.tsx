import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { BudgetPlan } from "@/types/budget";
import {
  FinancialGoal,
  GoalPriority,
  analyzeGoal,
} from "@/utils/goals";
import {
  getGoals,
  saveGoal,
  deleteGoal,
  generateId,
} from "@/utils/localDb";
import { formatCurrency } from "@/utils/budgetCalculations";
import { Target, Plus, Trash2, Lightbulb } from "lucide-react";
import { toast } from "sonner";

interface Props {
  budget: BudgetPlan | null;
}

const PRESETS = [
  "New Laptop",
  "Emergency Fund",
  "Master's Degree",
  "Vehicle",
  "Vacation",
  "House Deposit",
];

export function GoalPlanner({ budget }: Props) {
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState<number>(50000);
  const [targetDate, setTargetDate] = useState<string>(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split("T")[0];
  });
  const [priority, setPriority] = useState<GoalPriority>("medium");
  const [savedSoFar, setSavedSoFar] = useState<number>(0);

  useEffect(() => {
    setGoals(getGoals());
  }, []);

  const reset = () => {
    setName("");
    setAmount(50000);
    setSavedSoFar(0);
    setPriority("medium");
    setShowForm(false);
  };

  const submit = () => {
    if (!name.trim()) return toast.error("Please enter a goal name");
    if (amount <= 0) return toast.error("Amount must be greater than zero");
    const goal: FinancialGoal = {
      id: generateId(),
      name: name.trim(),
      amount,
      targetDate,
      priority,
      savedSoFar,
      createdAt: new Date().toISOString(),
    };
    saveGoal(goal);
    setGoals(getGoals());
    toast.success("Goal added!");
    reset();
  };

  const remove = (id: string) => {
    deleteGoal(id);
    setGoals(getGoals());
    toast.success("Goal removed");
  };

  return (
    <Card variant="elevated">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="w-5 h-5 text-primary" />
            Financial Goals
          </CardTitle>
          <Button size="sm" onClick={() => setShowForm((s) => !s)}>
            <Plus className="w-4 h-4 mr-1" />
            {showForm ? "Cancel" : "New Goal"}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Transform savings into real-world achievements.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        {showForm && (
          <div className="p-4 rounded-lg bg-muted/40 border border-border space-y-3 animate-slide-up">
            <div>
              <Label className="text-xs">Goal name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Master's Degree"
                className="mt-1"
              />
              <div className="flex flex-wrap gap-1 mt-2">
                {PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setName(p)}
                    className="text-[11px] px-2 py-0.5 rounded-full border border-border hover:border-primary/50 text-muted-foreground"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Target amount (₹)</Label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value) || 0)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Saved so far (₹)</Label>
                <Input
                  type="number"
                  value={savedSoFar}
                  onChange={(e) => setSavedSoFar(Number(e.target.value) || 0)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Target date</Label>
                <Input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Priority</Label>
                <Select
                  value={priority}
                  onValueChange={(v) => setPriority(v as GoalPriority)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={submit} className="w-full">
              Save Goal
            </Button>
          </div>
        )}

        {goals.length === 0 && !showForm && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No goals yet. Tap <strong>New Goal</strong> to plan your first one.
          </div>
        )}

        <div className="space-y-3">
          {goals.map((g) => {
            const a = analyzeGoal(g, budget);
            const healthColor =
              a.health === "green"
                ? "text-success"
                : a.health === "yellow"
                ? "text-warning"
                : "text-destructive";
            const healthBg =
              a.health === "green"
                ? "bg-success/10 border-success/30"
                : a.health === "yellow"
                ? "bg-warning/10 border-warning/30"
                : "bg-destructive/10 border-destructive/30";
            return (
              <div
                key={g.id}
                className={`p-4 rounded-xl border ${healthBg} space-y-3`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground">{g.name}</p>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-semibold ${
                          g.priority === "high"
                            ? "bg-destructive/15 text-destructive"
                            : g.priority === "medium"
                            ? "bg-warning/15 text-warning"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {g.priority}
                      </span>
                      <span className={`text-xs font-semibold ${healthColor}`}>
                        {a.feasibility}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatCurrency(g.amount)} by{" "}
                      {new Date(g.targetDate).toLocaleDateString("en-IN", {
                        month: "short",
                        year: "numeric",
                      })}{" "}
                      • {a.monthsRemaining} mo left
                    </p>
                  </div>
                  <button
                    onClick={() => remove(g.id)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Progress {a.progressPct}%</span>
                    <span>Probability {a.probability}/100</span>
                  </div>
                  <Progress value={a.progressPct} className="h-2" />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-background/50">
                    <p className="text-muted-foreground">Required / month</p>
                    <p className="font-bold text-foreground">
                      {formatCurrency(a.requiredMonthly)}
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-background/50">
                    <p className="text-muted-foreground">Est. completion</p>
                    <p className="font-bold text-foreground">
                      {a.estimatedCompletion}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 text-xs items-start">
                  <Lightbulb className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <p>{a.recommendation}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
