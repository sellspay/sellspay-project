import { useState } from "react";
import { Coins, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TopUpDialog } from "./TopUpDialog";

interface CreditWalletProps {
  balance: number;
  isLoading?: boolean;
  showTopUp?: boolean;
  variant?: "default" | "compact" | "sidebar";
  className?: string;
  subscriptionTier?: string | null;
}

export function CreditWallet({ 
  balance, 
  isLoading = false, 
  showTopUp = true,
  variant = "default",
  className,
  subscriptionTier
}: CreditWalletProps) {
  const [topUpOpen, setTopUpOpen] = useState(false);

  const handleOpenTopUp = () => {
    setTopUpOpen(true);
  };

  if (variant === "compact") {
    return (
      <>
        <button
          onClick={handleOpenTopUp}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg",
            "bg-gradient-to-r from-primary to-primary/80",
            "hover:from-primary/90 hover:to-primary/70",
            "transition-all hover:scale-105 shadow-md shadow-primary/20",
            className
          )}
        >
          <Coins className="w-4 h-4 text-white" />
          <span className="text-sm font-semibold text-white">
            {isLoading ? "..." : balance}
          </span>
        </button>
        <TopUpDialog
          open={topUpOpen}
          onOpenChange={setTopUpOpen}
          currentBalance={balance}
          subscriptionTier={subscriptionTier}
        />
      </>
    );
  }

  if (variant === "sidebar") {
    return (
      <>
        <div className={cn(
          "p-4 rounded-xl",
          "bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent",
          "border border-amber-500/20",
          className
        )}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <Coins className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Your Credits</p>
                <p className="text-lg font-bold text-amber-500">
                  {isLoading ? "..." : balance}
                </p>
              </div>
            </div>
          </div>
          {showTopUp && (
            <Button
              onClick={handleOpenTopUp}
              size="sm"
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
            >
              <Plus className="w-4 h-4 mr-1" />
              Top Up
            </Button>
          )}
        </div>
        <TopUpDialog
          open={topUpOpen}
          onOpenChange={setTopUpOpen}
          currentBalance={balance}
          subscriptionTier={subscriptionTier}
        />
      </>
    );
  }

  return (
    <>
      <div className={cn(
        "flex items-center gap-3 p-3 rounded-xl",
        "bg-gradient-to-r from-amber-500/10 to-orange-500/5",
        "border border-amber-500/20",
        className
      )}>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
          <Coins className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">Credit Balance</p>
          <p className="text-xl font-bold text-amber-500">
            {isLoading ? "..." : balance}
          </p>
        </div>
        {showTopUp && (
          <Button
            onClick={handleOpenTopUp}
            size="sm"
            variant="outline"
            className="border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
          >
            <Plus className="w-4 h-4 mr-1" />
            Top Up
          </Button>
        )}
      </div>
      <TopUpDialog
        open={topUpOpen}
        onOpenChange={setTopUpOpen}
        currentBalance={balance}
        subscriptionTier={subscriptionTier}
      />
    </>
  );
}
