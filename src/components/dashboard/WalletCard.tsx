import { useState, useEffect } from "react";
import { Wallet, TrendingUp, Clock, Lock, ArrowUpRight, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface WalletBalance {
  available_cents: number;
  pending_cents: number;
  locked_cents: number;
  total_earned_cents: number;
  total_withdrawn_cents: number;
  seller_mode: string | null;
  seller_status: string | null;
  available_usd: string;
  pending_usd: string;
  locked_usd: string;
}

interface WalletCardProps {
  onRequestPayout?: () => void;
}

export default function WalletCard({ onRequestPayout }: WalletCardProps) {
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPayoutDialog, setShowPayoutDialog] = useState(false);
  const [payoutProvider, setPayoutProvider] = useState<"stripe" | "paypal" | "payoneer">("stripe");
  const [instantPayout, setInstantPayout] = useState(false);
  const [processingPayout, setProcessingPayout] = useState(false);
  const [stripeOnboardingComplete, setStripeOnboardingComplete] = useState(true);
  const [redirectingToOnboarding, setRedirectingToOnboarding] = useState(false);
  const [payoutSuccess, setPayoutSuccess] = useState<{
    amount: number;
    provider: string;
    mode: string;
    message?: string;
  } | null>(null);

  useEffect(() => {
    fetchBalance();
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data } = await supabase.functions.invoke("check-connect-status", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (data) {
        setStripeOnboardingComplete(data.onboarding_complete ?? false);
      }
    } catch (err) {
      console.error("Error checking onboarding status:", err);
    }
  };

  const fetchBalance = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("Not authenticated");
        setLoading(false);
        return;
      }

      const response = await supabase.functions.invoke("get-wallet-balance", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to fetch balance");
      }

      setBalance(response.data);
    } catch (err) {
      console.error("Error fetching wallet balance:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPayout = async () => {
    // If Stripe onboarding not complete, redirect to complete it first
    if (!stripeOnboardingComplete && balance?.seller_mode === "CONNECT") {
      setRedirectingToOnboarding(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Not authenticated");

        const { data, error } = await supabase.functions.invoke("create-connect-account", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        if (data?.url) {
          window.location.href = data.url;
          return;
        }
      } catch (err) {
        console.error("Error starting onboarding:", err);
        toast.error(err instanceof Error ? err.message : "Failed to start verification");
      } finally {
        setRedirectingToOnboarding(false);
      }
      return;
    }

    // Set default provider based on seller mode
    if (balance?.seller_mode === "MOR") {
      setPayoutProvider("paypal");
    } else {
      setPayoutProvider("stripe");
    }
    setInstantPayout(false);
    setShowPayoutDialog(true);
  };

  const handleConfirmPayout = async () => {
    setProcessingPayout(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke("request-payout", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: {
          provider: payoutProvider,
          instant: instantPayout,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to request payout");
      }

      if (!response.data.success) {
        throw new Error(response.data.error || "Payout request failed");
      }

      setPayoutSuccess({
        amount: response.data.amount,
        provider: response.data.provider,
        mode: response.data.mode,
        message: response.data.message,
      });

      // Refresh balance
      await fetchBalance();
      
      if (response.data.mode === "auto") {
        toast.success(`Payout of $${(response.data.amount / 100).toFixed(2)} initiated!`);
      } else {
        toast.success("Payout request submitted for approval!");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to request payout";
      toast.error(message);
    } finally {
      setProcessingPayout(false);
    }
  };

  const closeDialog = () => {
    setShowPayoutDialog(false);
    setPayoutSuccess(null);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>Failed to load wallet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!balance) return null;

  const totalBalance = balance.available_cents + balance.pending_cents;
  const availablePercent = totalBalance > 0 ? (balance.available_cents / totalBalance) * 100 : 0;
  const minWithdrawal = 2000; // $20 minimum
  const canWithdraw = balance.available_cents >= minWithdrawal;
  const isMorMode = balance.seller_mode === "MOR";

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Wallet</CardTitle>
            </div>
            {balance.seller_mode && (
              <Badge
                variant="outline"
                className={
                  balance.seller_mode === "CONNECT"
                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                }
              >
                {balance.seller_mode === "CONNECT" ? "Stripe Connect" : "Platform Payouts"}
              </Badge>
            )}
          </div>
          <CardDescription>Your earnings and payout status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Balance */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Available Balance</p>
            <p className="text-4xl font-bold tracking-tight">${balance.available_usd}</p>
          </div>

          {/* Balance Breakdown */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <TrendingUp className="h-4 w-4 mx-auto mb-1 text-emerald-500" />
              <p className="text-xs text-muted-foreground">Available</p>
              <p className="font-semibold">${balance.available_usd}</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <Clock className="h-4 w-4 mx-auto mb-1 text-amber-500" />
              <p className="text-xs text-muted-foreground">Pending</p>
              <p className="font-semibold">${balance.pending_usd}</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <Lock className="h-4 w-4 mx-auto mb-1 text-destructive" />
              <p className="text-xs text-muted-foreground">Locked</p>
              <p className="font-semibold">${balance.locked_usd}</p>
            </div>
          </div>

          {/* Progress Bar */}
          {totalBalance > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Available</span>
                <span>Pending {isMorMode && "(7-day hold)"}</span>
              </div>
              <Progress value={availablePercent} className="h-2" />
            </div>
          )}

          {/* Lifetime Stats */}
          <div className="flex justify-between pt-4 border-t text-sm">
            <div>
              <p className="text-muted-foreground">Total Earned</p>
              <p className="font-semibold">${(balance.total_earned_cents / 100).toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-muted-foreground">Total Withdrawn</p>
              <p className="font-semibold">${(balance.total_withdrawn_cents / 100).toFixed(2)}</p>
            </div>
          </div>

          {/* Withdraw Button */}
          <Button
            className="w-full"
            disabled={!canWithdraw || redirectingToOnboarding}
            onClick={handleRequestPayout}
          >
            {redirectingToOnboarding ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Redirecting...
              </>
            ) : !stripeOnboardingComplete && balance.seller_mode === "CONNECT" ? (
              <>
                <ArrowUpRight className="h-4 w-4 mr-2" />
                Complete Setup to Withdraw
              </>
            ) : canWithdraw ? (
              <>
                <ArrowUpRight className="h-4 w-4 mr-2" />
                Withdraw ${balance.available_usd}
              </>
            ) : (
              <>
                <ArrowUpRight className="h-4 w-4 mr-2" />
                Min. $20 to withdraw
              </>
            )}
          </Button>

          {!stripeOnboardingComplete && balance.seller_mode === "CONNECT" && (
            <p className="text-xs text-center text-amber-500">
              Complete your account verification to withdraw earnings
            </p>
          )}

          {balance.pending_cents > 0 && isMorMode && (
            <p className="text-xs text-center text-muted-foreground">
              Pending funds become available after a 7-day hold period
            </p>
          )}
        </CardContent>
      </Card>

      {/* Payout Request Dialog */}
      <Dialog open={showPayoutDialog} onOpenChange={closeDialog}>
        <DialogContent className="sm:max-w-md">
          {payoutSuccess ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                  {payoutSuccess.mode === "auto" ? "Payout Initiated!" : "Request Submitted!"}
                </DialogTitle>
                <DialogDescription>
                  {payoutSuccess.message || (
                    payoutSuccess.mode === "auto"
                      ? `Your payout of $${(payoutSuccess.amount / 100).toFixed(2)} via ${payoutSuccess.provider} has been initiated.`
                      : `Your payout request for $${(payoutSuccess.amount / 100).toFixed(2)} via ${payoutSuccess.provider} is pending admin approval.`
                  )}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button onClick={closeDialog}>Done</Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Request Payout</DialogTitle>
                <DialogDescription>
                  Withdraw ${balance?.available_usd} to your connected account
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-3">
                  <Label>Payout Method</Label>
                  <RadioGroup
                    value={payoutProvider}
                    onValueChange={(v) => setPayoutProvider(v as "stripe" | "paypal" | "payoneer")}
                    className="space-y-2"
                  >
                    {!isMorMode && (
                      <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                        <RadioGroupItem value="stripe" id="stripe" />
                        <Label htmlFor="stripe" className="flex-1 cursor-pointer">
                          <div className="font-medium">Stripe</div>
                          <div className="text-xs text-muted-foreground">
                            Direct bank deposit (1-3 days)
                          </div>
                        </Label>
                      </div>
                    )}
                    <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                      <RadioGroupItem value="paypal" id="paypal" />
                      <Label htmlFor="paypal" className="flex-1 cursor-pointer">
                        <div className="font-medium">PayPal</div>
                        <div className="text-xs text-muted-foreground">
                          Instant to PayPal balance
                        </div>
                      </Label>
                      {isMorMode && (
                        <Badge variant="secondary" className="bg-amber-500/20 text-amber-500 text-xs">
                          Recommended
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                      <RadioGroupItem value="payoneer" id="payoneer" />
                      <Label htmlFor="payoneer" className="flex-1 cursor-pointer">
                        <div className="font-medium">Payoneer</div>
                        <div className="text-xs text-muted-foreground">
                          Global bank transfer (1-3 days)
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {payoutProvider === "stripe" && !isMorMode && (
                  <div className="space-y-3">
                    <Label>Payout Speed</Label>
                    <RadioGroup
                      value={instantPayout ? "instant" : "standard"}
                      onValueChange={(v) => setInstantPayout(v === "instant")}
                      className="space-y-2"
                    >
                      <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                        <RadioGroupItem value="standard" id="standard" />
                        <Label htmlFor="standard" className="flex-1 cursor-pointer">
                          <div className="font-medium">Standard (Free)</div>
                          <div className="text-xs text-muted-foreground">1-3 business days</div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                        <RadioGroupItem value="instant" id="instant" />
                        <Label htmlFor="instant" className="flex-1 cursor-pointer">
                          <div className="font-medium">Instant (3% fee)</div>
                          <div className="text-xs text-muted-foreground">
                            Arrive in minutes • Fee: ${((balance?.available_cents || 0) * 0.03 / 100).toFixed(2)}
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                )}

                {isMorMode && (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                      <AlertCircle className="h-4 w-4 inline mr-1" />
                      Platform payouts require admin approval and typically process within 1-2 business days.
                    </p>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={closeDialog} disabled={processingPayout}>
                  Cancel
                </Button>
                <Button onClick={handleConfirmPayout} disabled={processingPayout}>
                  {processingPayout ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <ArrowUpRight className="h-4 w-4 mr-2" />
                      Request Payout
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
