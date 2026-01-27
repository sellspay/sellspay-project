import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Coins, Loader2, Plus, Crown, ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface TopUpPackage {
  id: string;
  name: string;
  credits: number;
  price_cents: number;
  stripe_price_id: string | null;
}

interface TopUpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentBalance: number;
  subscriptionTier?: string | null;
}

export function TopUpDialog({ open, onOpenChange, currentBalance, subscriptionTier }: TopUpDialogProps) {
  const navigate = useNavigate();
  const [packages, setPackages] = useState<TopUpPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchPackages();
    }
  }, [open]);

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase
        .from("credit_topups")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) throw error;
      setPackages(data || []);
    } catch (error) {
      console.error("Error fetching top-up packages:", error);
      toast.error("Failed to load top-up options");
    } finally {
      setLoading(false);
    }
  };

  const handleTopUp = async (pkg: TopUpPackage) => {
    if (!pkg.stripe_price_id) {
      toast.error("This package is not available for purchase");
      return;
    }

    setPurchasing(pkg.id);
    try {
      const { data, error } = await supabase.functions.invoke("create-topup-checkout", {
        body: { topup_id: pkg.id, price_id: pkg.stripe_price_id },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error starting top-up checkout:", error);
      toast.error("Failed to start checkout");
    } finally {
      setPurchasing(null);
    }
  };

  const handleViewPlans = () => {
    onOpenChange(false);
    navigate("/pricing");
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const getTierBadge = () => {
    if (!subscriptionTier) return null;
    
    const tierColors: Record<string, string> = {
      starter: "from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-400",
      pro: "from-primary/20 to-purple-500/20 border-primary/50 text-primary",
      enterprise: "from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-400",
    };
    
    return (
      <span className={cn(
        "text-xs px-2 py-0.5 rounded-full bg-gradient-to-r border capitalize",
        tierColors[subscriptionTier] || tierColors.starter
      )}>
        {subscriptionTier}
      </span>
    );
  };

  return (
    <Dialog modal={false} open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <Coins className="w-4 h-4 text-white" />
            </div>
            Credit Wallet
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Balance */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Balance</p>
                <p className="text-3xl font-bold text-amber-500">{currentBalance}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                {getTierBadge()}
                {subscriptionTier && (
                  <p className="text-xs text-muted-foreground">
                    Renews monthly
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Top-up Options */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium">Need more credits?</h4>
              <span className="text-xs text-muted-foreground">One-time purchase</span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {packages.map((pkg) => (
                  <button
                    key={pkg.id}
                    onClick={() => handleTopUp(pkg)}
                    disabled={purchasing === pkg.id}
                    className={cn(
                      "p-3 rounded-xl border border-border/50 bg-secondary/30",
                      "hover:bg-secondary/50 hover:border-primary/30 transition-all",
                      "flex flex-col items-center gap-1",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    {purchasing === pkg.id ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <div className="flex items-center gap-1">
                          <Coins className="h-4 w-4 text-amber-500" />
                          <span className="font-bold">{pkg.credits}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{formatPrice(pkg.price_cents)}</span>
                      </>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Subscription Upsell */}
          <div className="p-3 rounded-xl bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 border border-primary/20">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shrink-0">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Get better value with a plan!</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Save up to 60% per credit + unlock seller fee reductions
                </p>
              </div>
            </div>
            <Button
              onClick={handleViewPlans}
              variant="ghost"
              size="sm"
              className="w-full mt-3 text-primary hover:text-primary hover:bg-primary/10"
            >
              View Plans
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}