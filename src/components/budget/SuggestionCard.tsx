import { Card, CardContent } from "@/components/ui/card";
import { Lightbulb, AlertTriangle, CheckCircle, TrendingUp, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface SuggestionCardProps {
  suggestions: string[];
}

function getSuggestionIcon(suggestion: string) {
  if (suggestion.includes("✅")) return <CheckCircle className="w-5 h-5 text-success" />;
  if (suggestion.includes("⚠️")) return <AlertTriangle className="w-5 h-5 text-warning" />;
  if (suggestion.includes("💰") || suggestion.includes("💎")) return <TrendingUp className="w-5 h-5 text-primary" />;
  if (suggestion.includes("🎉")) return <Sparkles className="w-5 h-5 text-warning" />;
  return <Lightbulb className="w-5 h-5 text-blue-500" />;
}

function cleanSuggestion(suggestion: string): string {
  return suggestion.replace(/[✅⚠️💡💰💎🎉📊]/g, "").trim();
}

function getSuggestionStyle(suggestion: string) {
  if (suggestion.includes("✅")) return "border-l-success bg-success/5";
  if (suggestion.includes("⚠️")) return "border-l-warning bg-warning/5";
  if (suggestion.includes("🎉")) return "border-l-warning bg-warning/5";
  if (suggestion.includes("💰") || suggestion.includes("💎")) return "border-l-primary bg-primary/5";
  return "border-l-blue-500 bg-blue-500/5";
}

export function SuggestionCard({ suggestions }: SuggestionCardProps) {
  if (!suggestions.length) return null;

  return (
    <Card variant="elevated">
      <CardContent className="pt-5 space-y-3">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-semibold text-base">AI Suggestions</h3>
        </div>
        
        {suggestions.map((suggestion, index) => (
          <div
            key={index}
            className={cn(
              "p-4 rounded-lg border-l-4 animate-slide-up",
              getSuggestionStyle(suggestion)
            )}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex gap-3">
              {getSuggestionIcon(suggestion)}
              <p className="text-sm text-foreground leading-relaxed flex-1">
                {cleanSuggestion(suggestion)}
              </p>
            </div>
          </div>
        ))}

        <p className="text-xs text-muted-foreground pt-2 italic">
          These suggestions are rule-based and educational, not financial advice.
        </p>
      </CardContent>
    </Card>
  );
}
