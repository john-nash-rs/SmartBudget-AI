import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BudgetPlan } from "@/types/budget";
import { getSavedPlans, deletePlan, saveDraft, resetAllData, exportAllDataAsJSON } from "@/utils/localDb";
import { exportBudgetToJSON, exportBudgetToCSV } from "@/utils/export";
import { formatCurrency } from "@/utils/budgetCalculations";
import { toast } from "sonner";
import {
  Trash2, Eye, RotateCcw, FolderOpen, Calendar, PlusCircle,
  Download, FileJson, FileSpreadsheet, AlertTriangle,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Saved() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<BudgetPlan[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showClearAll, setShowClearAll] = useState(false);

  useEffect(() => {
    setPlans(getSavedPlans());
  }, []);

  const handleDelete = () => {
    if (deleteId) {
      deletePlan(deleteId);
      setPlans(getSavedPlans());
      toast.success("Plan deleted");
      setDeleteId(null);
    }
  };

  const handleClearAll = () => {
    resetAllData();
    setPlans([]);
    toast.success("All data cleared");
    setShowClearAll(false);
  };

  const handleView = (plan: BudgetPlan) => {
    sessionStorage.setItem("currentBudget", JSON.stringify(plan));
    navigate("/summary");
  };

  const handleRestore = (plan: BudgetPlan) => {
    saveDraft({
      income: plan.income,
      tax: plan.tax,
      essentials: plan.essentials,
      lifestyle: plan.lifestyle,
      loans: plan.loans,
      savings: plan.savings,
    });
    toast.success("Plan restored as draft");
    navigate("/input");
  };

  const handleExportJSON = (plan: BudgetPlan) => {
    exportBudgetToJSON(plan);
    toast.success("Exported as JSON");
  };

  const handleExportCSV = (plan: BudgetPlan) => {
    exportBudgetToCSV(plan);
    toast.success("Exported as CSV");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  if (plans.length === 0) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="mb-6 animate-fade-in">
          <h1 className="text-2xl font-bold text-foreground">Saved Plans</h1>
          <p className="text-muted-foreground text-sm mt-1">Your saved budget plans appear here</p>
        </div>
        <Card variant="bordered" className="animate-scale-in">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2">No saved plans yet</h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">
              Create your first budget plan and save it to track your financial progress over time.
            </p>
            <Button onClick={() => navigate("/input")} className="gap-2">
              <PlusCircle className="w-4 h-4" />
              Create Your First Plan
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="mb-6 animate-fade-in flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Saved Plans</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {plans.length} plan{plans.length !== 1 ? "s" : ""} saved
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportAllDataAsJSON}>
            <Download className="w-4 h-4 mr-1" />
            Export All
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => setShowClearAll(true)}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Reset All
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {plans.map((plan, index) => (
          <Card key={plan.id} variant="elevated" className="animate-slide-up overflow-hidden" style={{ animationDelay: `${index * 50}ms` }}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {formatCurrency(plan.income)}
                    <span className="text-sm font-normal text-muted-foreground">/month</span>
                  </CardTitle>
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {formatDate(plan.dateSaved)}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-muted-foreground">
                        <Download className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleExportJSON(plan)}>
                        <FileJson className="w-4 h-4 mr-2" />
                        Export as JSON
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExportCSV(plan)}>
                        <FileSpreadsheet className="w-4 h-4 mr-2" />
                        Export as CSV
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => setDeleteId(plan.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 mb-4">
                {[
                  { label: "Essentials", pct: plan.percentages.essentials_pct, color: "bg-chart-essentials" },
                  { label: "Lifestyle", pct: plan.percentages.lifestyle_pct, color: "bg-chart-lifestyle" },
                  ...(plan.percentages.loans_pct > 0 ? [{ label: "Loans", pct: plan.percentages.loans_pct, color: "bg-rose-500" }] : []),
                  { label: "Savings", pct: plan.percentages.savings_pct, color: "bg-chart-savings" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <div className="w-20 text-xs text-muted-foreground">{item.label}</div>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full transition-all duration-500`} style={{ width: `${Math.min(item.pct, 100)}%` }} />
                    </div>
                    <div className="w-10 text-xs font-medium text-right">{item.pct}%</div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="soft" size="sm" className="flex-1" onClick={() => handleView(plan)}>
                  <Eye className="w-4 h-4 mr-1" /> View
                </Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={() => handleRestore(plan)}>
                  <RotateCcw className="w-4 h-4 mr-1" /> Restore
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this plan?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this budget plan.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset All Confirmation */}
      <AlertDialog open={showClearAll} onOpenChange={setShowClearAll}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Reset all data?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete ALL your saved budget plans, history, and drafts. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Reset All Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
