import { Coins, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CreditEstimatorProps {
  baseCost: number;
  creditBalance: number;
  isLoading?: boolean;
}

export function CreditEstimator({ baseCost, creditBalance, isLoading }: CreditEstimatorProps) {
  const isFree = baseCost === 0;
  const hasEnough = creditBalance >= baseCost;

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
      <div className="flex items-center gap-2">
        <Coins className="h-4 w-4 text-amber-500" />
        <span className="text-xs font-medium text-foreground">Estimated cost</span>
      </div>
      <div className="flex items-center gap-2">
        {isFree ? (
          <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-xs">
            Free
          </Badge>
        ) : (
          <>
            <Badge variant="outline" className="gap-1 border-amber-500/30 bg-amber-500/10 text-amber-500 text-xs">
              <Coins className="h-3 w-3" /> {baseCost} credit{baseCost !== 1 ? "s" : ""}
            </Badge>
            {!isLoading && !hasEnough && (
              <span className="text-[10px] text-destructive flex items-center gap-1">
                <Info className="h-3 w-3" /> Not enough
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
