import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BudgetPlan } from "@/types/budget";
import { FutureProjection } from "@/components/budget/FutureProjection";
import { ShockSimulator } from "@/components/budget/ShockSimulator";
import { GoalPlanner } from "@/components/budget/GoalPlanner";
import { BudgetBuddyChat } from "@/components/budget/BudgetBuddyChat";
import { getSavedPlans } from "@/utils/localDb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Compass, TrendingUp, AlertTriangle, Target } from "lucide-react";

export default function Planning() {
  const navigate = useNavigate();
  const [budget, setBudget] = useState<BudgetPlan | null>(null);

  useEffect(() => {
    const session = sessionStorage.getItem("currentBudget");
    if (session) {
      setBudget(JSON.parse(session));
      return;
    }
    const saved = getSavedPlans();
    if (saved.length > 0) setBudget(saved[0]);
  }, []);

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
          <Compass className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Financial Planning Studio
          </h1>
          <p className="text-sm text-muted-foreground">
            Project the future, stress-test your plan, and chase real goals.
          </p>
        </div>
      </div>

      {!budget && (
        <Card variant="bordered" className="mb-6">
          <CardContent className="p-6 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Create a budget first to unlock projections and shock simulations.
              You can still set financial goals below.
            </p>
            <Button onClick={() => navigate("/input")}>Create Budget</Button>
          </CardContent>
        </Card>
      )}

      <Tabs key={budget ? "with-budget" : "no-budget"} defaultValue={budget ? "projection" : "goals"} className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="projection" disabled={!budget}>
            <TrendingUp className="w-4 h-4 mr-1.5 hidden sm:inline" />
            Projection
          </TabsTrigger>
          <TabsTrigger value="shocks" disabled={!budget}>
            <AlertTriangle className="w-4 h-4 mr-1.5 hidden sm:inline" />
            Shocks
          </TabsTrigger>
          <TabsTrigger value="goals">
            <Target className="w-4 h-4 mr-1.5 hidden sm:inline" />
            Goals
          </TabsTrigger>
        </TabsList>

        {budget && (
          <TabsContent value="projection">
            <FutureProjection budget={budget} />
          </TabsContent>
        )}
        {budget && (
          <TabsContent value="shocks">
            <ShockSimulator budget={budget} />
          </TabsContent>
        )}
        <TabsContent value="goals">
          <GoalPlanner budget={budget} />
        </TabsContent>
      </Tabs>

      <BudgetBuddyChat budget={budget} />
    </div>
  );
}
