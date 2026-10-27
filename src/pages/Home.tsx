import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Sparkles, PieChart, TrendingUp, Shield, Wallet } from "lucide-react";
import { DEMO_DATA } from "@/types/budget";
import { saveDraft } from "@/utils/localDb";
import { toast } from "sonner";

const features = [
  {
    icon: PieChart,
    title: "Smart Breakdown",
    description: "Visualize your spending with beautiful charts",
  },
  {
    icon: Sparkles,
    title: "AI Suggestions",
    description: "Get personalized tips to optimize your budget",
  },
  {
    icon: TrendingUp,
    title: "Track Progress",
    description: "Save plans and track your financial journey",
  },
  {
    icon: Shield,
    title: "100% Private",
    description: "All data stays on your device, always",
  },
];

export default function Home() {
  const navigate = useNavigate();

  const handleTryDemo = () => {
    saveDraft({
      income: DEMO_DATA.income,
      tax: DEMO_DATA.tax,
      essentials: DEMO_DATA.essentials,
      lifestyle: DEMO_DATA.lifestyle,
      loans: DEMO_DATA.loans,
      savings: DEMO_DATA.savings,
    });
    toast.success("Demo data loaded!");
    navigate("/input");
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/50 to-background" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl" />

        <div className="container relative mx-auto px-4 pt-16 pb-20">
          <div className="max-w-2xl mx-auto text-center animate-fade-in">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <div className="w-20 h-20 rounded-3xl bg-primary flex items-center justify-center shadow-xl shadow-primary/30 animate-bounce-soft">
                <Wallet className="w-10 h-10 text-primary-foreground" />
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
              Make Your Money
              <span className="text-gradient block">Work Smarter</span>
            </h1>

            <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
              AI-powered budget optimization for young professionals.
              Simple, private, and designed for India.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="hero"
                size="xl"
                onClick={() => navigate("/input")}
                className="group"
              >
                Start Budgeting
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="outline" size="xl" onClick={handleTryDemo}>
                Try Demo Data
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature, index) => (
            <Card
              key={feature.title}
              variant="elevated"
              className="card-hover animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Built for India */}
      <section className="container mx-auto px-4 pb-16">
        <Card variant="accent" className="overflow-hidden">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex-1">
                <h2 className="text-xl font-bold mb-2">Built for Indian Professionals</h2>
                <p className="text-muted-foreground text-sm mb-4">
                  Designed for salaried professionals aged 22-30 in Tier-1 cities earning ₹4-15 LPA:
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-orange-500" />
                    <span className="text-sm"><strong>Tax Calculator</strong> — Old vs New regime comparison</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-rose-500" />
                    <span className="text-sm"><strong>Loan Tracking</strong> — EMIs, education & personal loans</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-chart-essentials" />
                    <span className="text-sm"><strong>Benchmark Comparison</strong> — See how you compare to peers</span>
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0">
                <Button onClick={() => navigate("/input")} className="gap-2">
                  Create Your Budget
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Data Privacy Notice */}
      <section className="container mx-auto px-4 pb-16">
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">
              <strong>🔒 Your Privacy Matters:</strong> All data is stored locally in your browser.
              We never send your financial information to any server. This is an educational tool
              for budgeting guidance.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
