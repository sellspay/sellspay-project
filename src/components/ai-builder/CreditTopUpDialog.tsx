import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Coins, Sparkles, Check, Loader2, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CreditPack {
  id: string;
  name: string;
  description: string | null;
  credits: number;
  price_cents: number;
  price_per_credit: number;
}

interface CreditTopUpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentBalance?: number;
}

export function CreditTopUpDialog({ open, onOpenChange, currentBalance = 0 }: CreditTopUpDialogProps) {
  const [packs, setPacks] = useState<CreditPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchPacks();
    }
  }, [open]);

  const fetchPacks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('credit_packs')
      .select('*')
      .eq('is_active', true)
      .order('display_order');

    if (error) {
      console.error('Failed to fetch credit packs:', error);
      toast.error('Failed to load credit packs');
    } else {
      setPacks(data || []);
    }
    setLoading(false);
  };

  const handlePurchase = async (packId: string) => {
    setPurchasing(packId);
    try {
      const { data, error } = await supabase.functions.invoke('create-credit-checkout', {
        body: { packId }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
        toast.success('Redirecting to checkout...');
        onOpenChange(false);
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      toast.error('Failed to start checkout');
    } finally {
      setPurchasing(null);
    }
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(0)}`;
  };

  const getBestValue = (packs: CreditPack[]) => {
    if (packs.length === 0) return null;
    return packs.reduce((best, pack) => 
      pack.price_per_credit < best.price_per_credit ? pack : best
    );
  };

  const bestValuePack = getBestValue(packs);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Coins className="h-5 w-5 text-amber-400" />
            Top Up Credits
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Purchase additional credits to continue using AI features.
          </DialogDescription>
        </DialogHeader>

        {/* Current Balance */}
        <div className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-700 flex items-center justify-between">
          <span className="text-sm text-zinc-400">Current Balance</span>
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-violet-400" />
            <span className="font-bold text-white">{currentBalance.toLocaleString()} credits</span>
          </div>
        </div>

        {/* Credit Packs */}
        <div className="space-y-3 mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
            </div>
          ) : packs.length === 0 ? (
            <p className="text-center text-zinc-500 py-8">No credit packs available</p>
          ) : (
            packs.map((pack) => {
              const isBestValue = pack.id === bestValuePack?.id;
              const isPurchasing = purchasing === pack.id;
              
              return (
                <button
                  key={pack.id}
                  onClick={() => handlePurchase(pack.id)}
                  disabled={!!purchasing}
                  className={cn(
                    "w-full p-4 rounded-xl border transition-all text-left relative",
                    isBestValue
                      ? "bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border-violet-500/30 hover:border-violet-500/50"
                      : "bg-zinc-800/50 border-zinc-700 hover:border-zinc-600",
                    purchasing && !isPurchasing && "opacity-50"
                  )}
                >
                  {/* Best Value Badge */}
                  {isBestValue && (
                    <div className="absolute -top-2 right-4 px-2 py-0.5 bg-violet-500 text-white text-[10px] font-bold uppercase rounded-full">
                      Best Value
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white flex items-center gap-2">
                        {pack.name}
                        {isBestValue && <TrendingUp size={14} className="text-violet-400" />}
                      </div>
                      <div className="text-sm text-zinc-400 mt-0.5">
                        {pack.credits.toLocaleString()} credits
                      </div>
                      {pack.description && (
                        <div className="text-xs text-zinc-500 mt-1">{pack.description}</div>
                      )}
                    </div>

                    <div className="text-right">
                      <div className="text-xl font-bold text-white">
                        {formatPrice(pack.price_cents)}
                      </div>
                      <div className="text-xs text-zinc-500">
                        ${pack.price_per_credit.toFixed(3)}/credit
                      </div>
                    </div>
                  </div>

                  {isPurchasing && (
                    <div className="absolute inset-0 bg-zinc-900/80 rounded-xl flex items-center justify-center">
                      <Loader2 className="h-5 w-5 animate-spin text-violet-400" />
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Subscription Upsell */}
        <div className="mt-4 p-4 bg-gradient-to-r from-violet-500/5 to-fuchsia-500/5 rounded-xl border border-violet-500/20">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-violet-500/20 rounded-lg">
              <Sparkles size={16} className="text-violet-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">Get more value with a subscription</p>
              <p className="text-xs text-zinc-400 mt-1">
                Creator plan includes 2,500 credits/mo at $0.04/credit + Image Gen access
              </p>
              <Button
                variant="link"
                className="p-0 h-auto text-violet-400 text-xs mt-2"
                onClick={() => {
                  onOpenChange(false);
                  window.location.href = '/pricing';
                }}
              >
                View Plans →
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
