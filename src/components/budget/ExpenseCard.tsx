import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CurrencyInput } from "./CurrencyInput";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { CustomCategory } from "@/types/budget";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ExpenseField {
  key: string;
  label: string;
  tooltip?: string;
}

interface ExpenseCardProps {
  title: string;
  icon: React.ReactNode;
  fields: ExpenseField[];
  values: Record<string, number>;
  customCategories: CustomCategory[];
  onFieldChange: (key: string, value: number) => void;
  onAddCustom: (name: string, amount: number) => void;
  onRemoveCustom: (index: number) => void;
  onUpdateCustom: (index: number, amount: number) => void;
  maxCustom?: number;
  accentColor?: string;
}

export function ExpenseCard({
  title,
  icon,
  fields,
  values,
  customCategories,
  onFieldChange,
  onAddCustom,
  onRemoveCustom,
  onUpdateCustom,
  maxCustom = 2,
  accentColor = "primary",
}: ExpenseCardProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAmount, setNewAmount] = useState("");

  const canAddMore = customCategories.length < maxCustom;

  const handleAddCustom = () => {
    if (newName.trim() && newAmount) {
      onAddCustom(newName.trim(), parseInt(newAmount, 10) || 0);
      setNewName("");
      setNewAmount("");
      setShowAddForm(false);
    }
  };

  const total = Object.values(values).reduce((sum, v) => sum + v, 0) +
    customCategories.reduce((sum, c) => sum + c.amount, 0);

  return (
    <Card variant="elevated" className="overflow-hidden">
      <CardHeader className={cn(
        "border-b border-border/50",
        accentColor === "primary" && "bg-accent/30",
        accentColor === "blue" && "bg-blue-50 dark:bg-blue-950/30"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              accentColor === "primary" && "bg-primary/10 text-primary",
              accentColor === "blue" && "bg-blue-500/10 text-blue-500"
            )}>
              {icon}
            </div>
            <CardTitle className="text-base">{title}</CardTitle>
          </div>
          <div className={cn(
            "text-lg font-bold",
            accentColor === "primary" && "text-primary",
            accentColor === "blue" && "text-blue-500"
          )}>
            ₹{total.toLocaleString("en-IN")}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-5 space-y-4">
        {fields.map((field) => (
          <CurrencyInput
            key={field.key}
            label={field.label}
            value={values[field.key] || 0}
            onChange={(v) => onFieldChange(field.key, v)}
            tooltip={field.tooltip}
          />
        ))}

        {/* Custom Categories */}
        {customCategories.map((cat, index) => (
          <div key={index} className="flex items-end gap-2">
            <div className="flex-1">
              <CurrencyInput
                label={cat.name}
                value={cat.amount}
                onChange={(v) => onUpdateCustom(index, v)}
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="mb-0.5 text-muted-foreground hover:text-destructive"
              onClick={() => onRemoveCustom(index)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))}

        {/* Add Custom Form */}
        {showAddForm ? (
          <div className="p-4 rounded-xl bg-muted/50 space-y-3 animate-scale-in">
            <Input
              placeholder="Category name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="bg-background"
            />
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                ₹
              </span>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="Amount"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value.replace(/[^0-9]/g, ""))}
                className="pl-8 bg-background"
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddCustom} disabled={!newName.trim()}>
                Add
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          canAddMore && (
            <Button
              variant="outline"
              size="sm"
              className="w-full border-dashed"
              onClick={() => setShowAddForm(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Custom Category
            </Button>
          )
        )}
      </CardContent>
    </Card>
  );
}
