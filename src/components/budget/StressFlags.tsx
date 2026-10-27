import { StressFlag } from "@/utils/budgetCalculations";
import { AlertTriangle, ShieldAlert, TrendingDown } from "lucide-react";

interface StressFlagsProps {
  flags: StressFlag[];
}

const FLAG_ICONS = {
  low_savings: TrendingDown,
  high_debt: ShieldAlert,
  low_flexibility: AlertTriangle,
};

export function StressFlags({ flags }: StressFlagsProps) {
  if (flags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {flags.map((flag) => {
        const Icon = FLAG_ICONS[flag.type];
        const bgColor = flag.severity === "danger" ? "bg-destructive/10" : "bg-warning/10";
        const textColor = flag.severity === "danger" ? "text-destructive" : "text-warning";
        const borderColor = flag.severity === "danger" ? "border-destructive/30" : "border-warning/30";

        return (
          <div
            key={flag.type}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${bgColor} ${textColor} ${borderColor}`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{flag.label}</span>
          </div>
        );
      })}
    </div>
  );
}
