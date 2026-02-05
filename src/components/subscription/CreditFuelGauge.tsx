import { useState } from "react";
import { Coins, Plus, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CreditFuelGaugeProps {
  credits: number;
  maxCredits?: number;
  plan: 'browser' | 'creator' | 'agency';
  isLoading?: boolean;
  variant?: "default" | "compact" | "header";
  className?: string;
}

export function CreditFuelGauge({ 
  credits, 
  maxCredits,
  plan,
  isLoading = false, 
  variant = "default",
  className,
}: CreditFuelGaugeProps) {
  const navigate = useNavigate();
  
  // Default max credits based on plan
  const defaultMaxCredits = plan === 'agency' ? 12000 : plan === 'creator' ? 2500 : 100;
  const max = maxCredits || defaultMaxCredits;
  const percentage = Math.min((credits / max) * 100, 100);
  
  const handleUpgrade = () => {
    navigate("/pricing");
  };

  if (plan === 'browser') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleUpgrade}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg",
                "bg-secondary/50 border border-border/50",
                "hover:bg-secondary/70 hover:border-border",
                "transition-all cursor-pointer",
                className
              )}
            >
              <Coins className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Free</span>
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Upgrade to unlock AI credits</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (variant === "compact" || variant === "header") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleUpgrade}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg",
                "bg-gradient-to-r from-primary/10 to-purple-500/10",
                "border border-primary/20",
                "hover:from-primary/20 hover:to-purple-500/20",
                "hover:border-primary/30",
                "transition-all cursor-pointer",
                className
              )}
            >
              <Zap className={cn(
                "w-4 h-4",
                credits < 100 ? "text-amber-500" : "text-primary"
              )} />
              <span className={cn(
                "text-sm font-semibold tabular-nums",
                credits < 100 ? "text-amber-500" : "text-foreground"
              )}>
                {isLoading ? "..." : credits.toLocaleString()}
              </span>
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{credits.toLocaleString()} credits remaining</p>
            <p className="text-xs text-muted-foreground">Click to upgrade</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Default full gauge
  return (
    <div className={cn(
      "p-4 rounded-xl",
      "bg-gradient-to-br from-primary/10 via-purple-500/5 to-transparent",
      "border border-primary/20",
      className
    )}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">AI Credits</p>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              credits < 100 ? "text-amber-500" : "text-primary"
            )}>
              {isLoading ? "..." : credits.toLocaleString()}
            </p>
          </div>
        </div>
        <span className={cn(
          "text-xs font-medium px-2 py-1 rounded-full",
          plan === 'agency' 
            ? "bg-amber-500/10 text-amber-500 border border-amber-500/30"
            : "bg-primary/10 text-primary border border-primary/30"
        )}>
          {plan === 'agency' ? 'Agency' : 'Creator'}
        </span>
      </div>
      
      <div className="space-y-2">
        <Progress 
          value={percentage} 
          className="h-2 bg-secondary"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{Math.round(percentage)}% remaining</span>
          <span>{max.toLocaleString()} / month</span>
        </div>
      </div>
      
      <Button
        onClick={handleUpgrade}
        size="sm"
        variant="outline"
        className="w-full mt-3 border-primary/30 text-primary hover:bg-primary/10"
      >
        <Plus className="w-4 h-4 mr-1" />
        {plan === 'creator' ? 'Upgrade to Agency' : 'Get More Credits'}
      </Button>
    </div>
  );
}
