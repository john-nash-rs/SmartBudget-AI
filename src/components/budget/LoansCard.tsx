import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoanEntry, LoanType, LOAN_TYPE_LABELS } from "@/types/budget";
import { formatCurrency } from "@/utils/budgetCalculations";
import { Landmark, Plus, Trash2, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface LoansCardProps {
  loans: LoanEntry[];
  totalEmi: number;
  emiPercentage: number;
  onAddLoan: (loan: LoanEntry) => void;
  onRemoveLoan: (index: number) => void;
  onUpdateLoan: (index: number, loan: LoanEntry) => void;
}

export function LoansCard({
  loans,
  totalEmi,
  emiPercentage,
  onAddLoan,
  onRemoveLoan,
  onUpdateLoan,
}: LoansCardProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newLoanType, setNewLoanType] = useState<LoanType>("personal");
  const [newEmi, setNewEmi] = useState("");
  const [newTenure, setNewTenure] = useState("");

  const handleAddLoan = () => {
    const emi = parseFloat(newEmi) || 0;
    const tenure = parseInt(newTenure) || 0;

    if (emi > 0) {
      onAddLoan({
        type: newLoanType,
        emi,
        tenure,
      });
      setNewLoanType("personal");
      setNewEmi("");
      setNewTenure("");
      setShowAddDialog(false);
    }
  };

  return (
    <>
      <Card variant="elevated" className="overflow-hidden">
        <CardHeader className="bg-rose-500/5 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                <Landmark className="w-5 h-5 text-rose-500" />
              </div>
              <CardTitle className="text-base">Loans & EMIs</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAddDialog(true)}
              className="text-primary"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Loan
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-5 space-y-4">
          {loans.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No loans added. Click "Add Loan" to add your EMIs.
            </p>
          ) : (
            <div className="space-y-3">
              {loans.map((loan, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">{LOAN_TYPE_LABELS[loan.type]}</p>
                    <p className="text-xs text-muted-foreground">
                      {loan.tenure > 0 ? `${loan.tenure} months remaining` : "Ongoing"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{formatCurrency(loan.emi)}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => onRemoveLoan(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {loans.length > 0 && (
            <div className="p-3 rounded-lg bg-rose-500/10 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Monthly EMI</span>
                <span className="font-semibold">{formatCurrency(totalEmi)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">EMI % of Net Income</span>
                <span className={`font-semibold ${emiPercentage > 20 ? "text-destructive" : "text-foreground"}`}>
                  {emiPercentage}%
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Loan / EMI</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Loan Type</Label>
              <Select value={newLoanType} onValueChange={(v) => setNewLoanType(v as LoanType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LOAN_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Monthly EMI (₹)</Label>
              <Input
                type="number"
                placeholder="e.g., 15000"
                value={newEmi}
                onChange={(e) => setNewEmi(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Remaining Tenure (months)</Label>
              <Input
                type="number"
                placeholder="e.g., 36 (optional)"
                value={newTenure}
                onChange={(e) => setNewTenure(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddLoan} disabled={!newEmi || parseFloat(newEmi) <= 0}>
              Add Loan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
