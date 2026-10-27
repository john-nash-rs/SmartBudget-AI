import { Card, CardContent } from "@/components/ui/card";
import { Shield, Heart, Code, Wallet } from "lucide-react";

export default function About() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="mb-8 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/30">
          <Wallet className="w-8 h-8 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          SmartBudget <span className="text-primary">AI</span>
        </h1>
        <p className="text-muted-foreground">
          Your personal budget optimization companion
        </p>
      </div>

      <div className="space-y-6">
        <Card variant="elevated" className="animate-slide-up">
          <CardContent className="pt-6">
            <h2 className="font-semibold text-lg mb-3">About This App</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              SmartBudget AI is a lightweight, mobile-first budget optimization tool designed 
              specifically for young urban professionals in India. We help you understand where 
              your money goes and provide smart, rule-based suggestions to optimize your spending.
            </p>
            <p className="text-muted-foreground text-sm leading-relaxed mt-3">
              Our AI uses the popular 50/30/20 budgeting rule as a foundation, with flexible 
              bands that adapt to your specific situation. No complex algorithms, no paid APIs — 
              just smart, practical advice.
            </p>
          </CardContent>
        </Card>

        <Card variant="elevated" className="animate-slide-up" style={{ animationDelay: "100ms" }}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <h2 className="font-semibold text-lg">Privacy First</h2>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Your financial data is 100% private. All calculations happen locally in your 
              browser, and your budget plans are stored only on your device using LocalStorage. 
              We don't collect, store, or transmit any of your personal or financial information.
            </p>
          </CardContent>
        </Card>

        <Card variant="elevated" className="animate-slide-up" style={{ animationDelay: "200ms" }}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Code className="w-5 h-5 text-primary" />
              </div>
              <h2 className="font-semibold text-lg">How It Works</h2>
            </div>
            <ul className="text-muted-foreground text-sm space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">1.</span>
                <span>Enter your monthly income and expenses</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">2.</span>
                <span>Our AI analyzes your spending patterns</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">3.</span>
                <span>Get personalized suggestions to optimize your budget</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">4.</span>
                <span>Save plans and track your progress over time</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card variant="accent" className="animate-slide-up" style={{ animationDelay: "300ms" }}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Heart className="w-5 h-5 text-primary" />
              </div>
              <h2 className="font-semibold text-lg">Made with Care</h2>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Built for the young professionals navigating their financial journey. 
              Whether you're just starting out or looking to optimize your existing budget, 
              SmartBudget AI is here to help.
            </p>
            <p className="text-xs text-muted-foreground mt-4 italic">
              Note: This app provides educational guidance based on general budgeting principles. 
              For professional financial advice, please consult a certified financial advisor.
            </p>
          </CardContent>
        </Card>

        <div className="text-center py-6 text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: "400ms" }}>
          <p>Version 1.0.0</p>
          <p className="mt-1">© 2024 SmartBudget AI</p>
        </div>
      </div>
    </div>
  );
}
