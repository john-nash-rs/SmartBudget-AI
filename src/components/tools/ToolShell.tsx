import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export function ToolCard({
  icon: Icon,
  title,
  subtitle,
  children,
  action,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <Card variant="elevated">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg leading-tight">{title}</CardTitle>
              {subtitle && (
                <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
              )}
            </div>
          </div>
          {action}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">{children}</CardContent>
    </Card>
  );
}

export function NumField({
  label,
  value,
  onChange,
  prefix = "₹",
  suffix,
  placeholder = "0",
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  prefix?: string | null;
  suffix?: string;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            {prefix}
          </span>
        )}
        <Input
          type="text"
          inputMode="numeric"
          value={value === 0 ? "" : String(value)}
          placeholder={placeholder}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^0-9.]/g, "");
            const num = parseFloat(raw);
            onChange(isNaN(num) ? 0 : num);
          }}
          className={cn("h-10 text-right font-medium", prefix && "pl-7", suffix && "pr-9")}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <Input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-10"
      />
    </div>
  );
}

export function Stat({
  label,
  value,
  tone = "default",
  sub,
}: {
  label: string;
  value: string;
  tone?: "default" | "success" | "warning" | "danger" | "primary";
  sub?: string;
}) {
  const tones = {
    default: "bg-muted/50 border-border",
    primary: "bg-primary/10 border-primary/30",
    success: "bg-success/10 border-success/30",
    warning: "bg-warning/10 border-warning/30",
    danger: "bg-destructive/10 border-destructive/30",
  } as const;
  const text = {
    default: "text-foreground",
    primary: "text-primary",
    success: "text-success",
    warning: "text-warning",
    danger: "text-destructive",
  } as const;
  return (
    <div className={cn("p-3 rounded-xl border", tones[tone])}>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={cn("text-base font-bold mt-0.5", text[tone])}>{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

export function InsightBox({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const tones = {
    default: "bg-accent/40 border-border",
    success: "bg-success/10 border-success/30",
    warning: "bg-warning/10 border-warning/30",
    danger: "bg-destructive/10 border-destructive/30",
  } as const;
  return (
    <div className={cn("p-3.5 rounded-xl border text-sm leading-relaxed", tones[tone])}>
      {children}
    </div>
  );
}

export function VerdictBadge({
  verdict,
  label,
}: {
  verdict: "green" | "yellow" | "red";
  label: string;
}) {
  const map = {
    green: "bg-success/15 text-success border-success/40",
    yellow: "bg-warning/15 text-warning border-warning/40",
    red: "bg-destructive/15 text-destructive border-destructive/40",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border",
        map[verdict]
      )}
    >
      {label}
    </span>
  );
}

export function EmptyBudgetNote({ what }: { what: string }) {
  return (
    <InsightBox>
      Create or open a budget first — {what} uses your income, expenses and EMIs.
    </InsightBox>
  );
}
