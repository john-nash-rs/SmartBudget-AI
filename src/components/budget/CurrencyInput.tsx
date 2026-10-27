import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CurrencyInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  max?: number;
  step?: number;
  tooltip?: string;
  showSlider?: boolean;
  error?: string;
  className?: string;
}

export function CurrencyInput({
  label,
  value,
  onChange,
  max = 100000,
  step = 500,
  tooltip,
  showSlider = false,
  error,
  className,
}: CurrencyInputProps) {
  const [inputValue, setInputValue] = useState(value.toString());

  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    setInputValue(raw);
    
    const num = parseInt(raw, 10);
    if (!isNaN(num) && num >= 0) {
      onChange(num);
    } else if (raw === "") {
      onChange(0);
    }
  };

  const handleBlur = () => {
    setInputValue(value.toString());
  };

  const handleSliderChange = (values: number[]) => {
    onChange(values[0]);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Label htmlFor={label} className="text-sm font-medium text-foreground">
            {label}
          </Label>
          {tooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-xs">{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <span className="text-sm font-semibold text-primary">
          ₹{value.toLocaleString("en-IN")}
        </span>
      </div>

      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
          ₹
        </span>
        <Input
          id={label}
          type="text"
          inputMode="numeric"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          className={cn(
            "pl-8 pr-4 h-11 text-right font-medium bg-background border-border focus:border-primary focus:ring-primary/20",
            error && "border-destructive focus:border-destructive"
          )}
          placeholder="0"
        />
      </div>

      {showSlider && (
        <Slider
          value={[value]}
          onValueChange={handleSliderChange}
          max={max}
          step={step}
          className="py-2"
        />
      )}

      {error && (
        <p className="text-xs text-destructive mt-1">{error}</p>
      )}
    </div>
  );
}
