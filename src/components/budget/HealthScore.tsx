import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Percentages, BENCHMARK_AVERAGES } from "@/types/budget";
import { Heart, Info } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface HealthScoreProps {
  percentages: Percentages;
  hasEmergencyBuffer: boolean;
}

interface ScoreBreakdown {
  category: string;
  score: number;
  maxScore: number;
  explanation: string;
}

export function calculateHealthScore(
  percentages: Percentages,
  hasEmergencyBuffer: boolean
): { score: number; breakdown: ScoreBreakdown[] } {
  const breakdown: ScoreBreakdown[] = [];

  // 1. Savings Rate (0-30 points)
  let savingsScore = 0;
  if (percentages.savings_pct >= 20) savingsScore = 30;
  else if (percentages.savings_pct >= 15) savingsScore = 25;
  else if (percentages.savings_pct >= 10) savingsScore = 15;
  else if (percentages.savings_pct >= 5) savingsScore = 5;
  breakdown.push({
    category: "Savings Rate",
    score: savingsScore,
    maxScore: 30,
    explanation: `${percentages.savings_pct}% saved (benchmark: ${BENCHMARK_AVERAGES.savings}%)`,
  });

  // 2. Loan Burden (0-25 points)
  let loanScore = 25;
  if (percentages.loans_pct > 30) loanScore = 0;
  else if (percentages.loans_pct > 20) loanScore = 10;
  else if (percentages.loans_pct > 14) loanScore = 18;
  else loanScore = 25;
  breakdown.push({
    category: "Loan Burden",
    score: loanScore,
    maxScore: 25,
    explanation: `${percentages.loans_pct}% EMIs (benchmark: ${BENCHMARK_AVERAGES.loans}%)`,
  });

  // 3. Fixed Cost Rigidity (0-25 points)
  const fixedCosts = percentages.essentials_pct + percentages.loans_pct;
  let fixedScore = 25;
  if (fixedCosts > 70) fixedScore = 0;
  else if (fixedCosts > 60) fixedScore = 10;
  else if (fixedCosts > 55) fixedScore = 18;
  else fixedScore = 25;
  breakdown.push({
    category: "Fixed Costs",
    score: fixedScore,
    maxScore: 25,
    explanation: `${fixedCosts}% fixed (essentials + loans)`,
  });

  // 4. Emergency Buffer (0-20 points)
  const bufferScore = hasEmergencyBuffer ? 20 : 0;
  breakdown.push({
    category: "Emergency Buffer",
    score: bufferScore,
    maxScore: 20,
    explanation: hasEmergencyBuffer
      ? "Has remaining funds for emergencies"
      : "No buffer for unexpected expenses",
  });

  const totalScore = savingsScore + loanScore + fixedScore + bufferScore;

  return { score: totalScore, breakdown };
}

function getScoreLabel(score: number): { label: string; color: string } {
  if (score >= 71) return { label: "Healthy", color: "text-success" };
  if (score >= 41) return { label: "Stable", color: "text-warning" };
  return { label: "At Risk", color: "text-destructive" };
}

function getScoreColor(score: number): string {
  if (score >= 71) return "hsl(var(--success))";
  if (score >= 41) return "hsl(var(--warning))";
  return "hsl(var(--destructive))";
}

export function HealthScore({ percentages, hasEmergencyBuffer }: HealthScoreProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const { score, breakdown } = calculateHealthScore(percentages, hasEmergencyBuffer);
  const { label, color } = getScoreLabel(score);

  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <>
      <Card variant="elevated" className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Heart className="w-4 h-4 text-primary" />
              Financial Health Score
            </CardTitle>
            <button
              onClick={() => setShowBreakdown(true)}
              className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
              aria-label="How is this calculated?"
            >
              <Info className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            {/* Circular Progress */}
            <div className="relative w-28 h-28 flex-shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="hsl(var(--muted))"
                  strokeWidth="8"
                />
                {/* Progress circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke={getScoreColor(score)}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-foreground">{score}</span>
                <span className="text-xs text-muted-foreground">/100</span>
              </div>
            </div>

            {/* Status */}
            <div className="flex-1">
              <p className={`text-xl font-bold ${color}`}>{label}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {score >= 71 && "Your finances are well-balanced with good savings and manageable debt."}
                {score >= 41 && score < 71 && "Your finances need some attention. Focus on improving weak areas."}
                {score < 41 && "Your financial health needs immediate action. Review the breakdown."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showBreakdown} onOpenChange={setShowBreakdown}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary" />
              Health Score Breakdown
            </DialogTitle>
            <DialogDescription>
              Your score is calculated based on these 4 factors:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {breakdown.map((item) => (
              <div key={item.category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">{item.category}</span>
                  <span className="text-sm font-semibold text-primary">
                    {item.score}/{item.maxScore}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${(item.score / item.maxScore) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{item.explanation}</p>
              </div>
            ))}
            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground">Total Score</span>
                <span className={`text-lg font-bold ${color}`}>{score}/100</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
