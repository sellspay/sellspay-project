import React from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export const LOW_CREDIT_THRESHOLD = 50;

interface LowCreditWarningProps {
  credits: number;
  onClick?: () => void;
  variant?: "compact" | "banner";
  className?: string;
}

export function LowCreditWarning({ 
  credits, 
  onClick, 
  variant = "banner",
  className 
}: LowCreditWarningProps) {
  if (credits >= LOW_CREDIT_THRESHOLD) return null;

  if (variant === "compact") {
    return (
      <button
        onClick={onClick}
        className={cn(
          "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium",
          "bg-amber-500/15 text-amber-400 border border-amber-500/20",
          "hover:bg-amber-500/25 transition-colors",
          className
        )}
      >
        <AlertTriangle size={12} />
        <span>Low credits</span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg",
        "bg-amber-500/10 border border-amber-500/20",
        "text-amber-400 text-sm font-medium",
        "hover:bg-amber-500/15 transition-colors text-left",
        className
      )}
    >
      <AlertTriangle size={14} className="shrink-0" />
      <span>Running low on credits – Top up now</span>
    </button>
  );
}
