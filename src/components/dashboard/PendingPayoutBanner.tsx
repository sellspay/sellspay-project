import { useState, useEffect } from "react";
import { AlertTriangle, ArrowRight, Loader2, CheckCircle2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PendingPayoutBannerProps {
  pendingBalance: number; // in cents
  isOnboardingComplete: boolean;
  onOnboardingComplete?: () => void;
}

export function PendingPayoutBanner({ 
  pendingBalance, 
  isOnboardingComplete,
  onOnboardingComplete 
}: PendingPayoutBannerProps) {
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);

  // Don't show if onboarding is complete or no pending balance
  if (isOnboardingComplete) return null;

  const formattedBalance = (pendingBalance / 100).toFixed(2);
  const hasEarnings = pendingBalance > 0;

  const handleCompleteSetup = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in to continue");
        return;
      }

      // Call create-connect-account which will redirect to Stripe onboarding
      const { data, error } = await supabase.functions.invoke("create-connect-account", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Error starting onboarding:", err);
      toast.error(err instanceof Error ? err.message : "Failed to start verification");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    setCheckingStatus(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke("check-connect-status", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.onboarding_complete) {
        toast.success("Verification complete! You can now withdraw your earnings.");
        onOnboardingComplete?.();
      } else {
        toast.info("Verification not yet complete. Please finish the Stripe setup.");
      }
    } catch (err) {
      console.error("Error checking status:", err);
    } finally {
      setCheckingStatus(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-background p-4 mb-6">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl" />
      
      <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
            {hasEarnings ? (
              <Wallet className="w-6 h-6 text-amber-500" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-amber-500" />
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground">
            {hasEarnings ? (
              <>You have <span className="text-amber-500">${formattedBalance}</span> waiting!</>
            ) : (
              "Complete account setup to withdraw earnings"
            )}
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            {hasEarnings 
              ? "Complete your account verification to withdraw your earnings to your bank."
              : "You can start selling now! Set up your bank details whenever you're ready to get paid."
            }
          </p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          {/* Check status button (only show if they might have completed externally) */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCheckStatus}
            disabled={checkingStatus}
            className="text-muted-foreground hover:text-foreground"
          >
            {checkingStatus ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span className="sr-only sm:not-sr-only sm:ml-2">Check Status</span>
          </Button>

          <Button
            onClick={handleCompleteSetup}
            disabled={loading}
            className="bg-amber-500 hover:bg-amber-600 text-white flex-1 sm:flex-none"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            {hasEarnings ? "Withdraw Earnings" : "Set Up Payouts"}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
