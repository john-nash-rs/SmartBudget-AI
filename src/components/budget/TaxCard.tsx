import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CurrencyInput } from "./CurrencyInput";
import { TaxRegime } from "@/types/budget";
import { formatCurrency } from "@/utils/budgetCalculations";
import { Receipt, AlertCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface TaxCardProps {
  regime: TaxRegime;
  calculatedTax: number;
  manualTax: number;
  manualOverride: boolean;
  netIncome: number;
  onRegimeChange: (regime: TaxRegime) => void;
  onManualTaxChange: (tax: number) => void;
  onOverrideChange: (override: boolean) => void;
}

export function TaxCard({
  regime,
  calculatedTax,
  manualTax,
  manualOverride,
  netIncome,
  onRegimeChange,
  onManualTaxChange,
  onOverrideChange,
}: TaxCardProps) {
  const displayTax = manualOverride ? manualTax : calculatedTax;

  return (
    <Card variant="elevated" className="overflow-hidden">
      <CardHeader className="bg-orange-500/5 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
            <Receipt className="w-5 h-5 text-orange-500" />
          </div>
          <CardTitle className="text-base">Tax Calculation</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-5 space-y-4">
        <div className="space-y-2">
          <Label>Tax Regime</Label>
          <Select value={regime} onValueChange={(v) => onRegimeChange(v as TaxRegime)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">New Tax Regime (2024-25)</SelectItem>
              <SelectItem value="old">Old Tax Regime</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="p-3 rounded-lg bg-muted/50 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Estimated Monthly Tax</span>
            <span className="font-semibold">{formatCurrency(calculatedTax)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Net Take-Home</span>
            <span className="font-semibold text-primary">{formatCurrency(netIncome)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Manual Override</Label>
            <p className="text-xs text-muted-foreground">Enter your actual tax deduction</p>
          </div>
          <Switch checked={manualOverride} onCheckedChange={onOverrideChange} />
        </div>

        {manualOverride && (
          <div className="space-y-2">
            <CurrencyInput
              label="Actual Monthly Tax"
              value={manualTax}
              onChange={onManualTaxChange}
              tooltip="Enter your actual monthly tax deduction from salary slip"
            />
            <div className="flex items-start gap-2 p-2 rounded-lg bg-warning/10 text-warning text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>For estimation only. Actual tax may vary based on deductions, HRA, and other exemptions.</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
