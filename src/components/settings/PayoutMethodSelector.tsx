import { useState, useEffect } from "react";
import { CreditCard, Globe, Loader2, CheckCircle, AlertCircle, ExternalLink, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PayoutMethodSelectorProps {
  stripeConnected: boolean;
  stripeOnboardingComplete: boolean;
  onConnectStripe: () => void;
  connectingStripe: boolean;
  checkingStripeStatus: boolean;
  onCheckStripeStatus: () => void;
}

export function PayoutMethodSelector({
  stripeConnected,
  stripeOnboardingComplete,
  onConnectStripe,
  connectingStripe,
  checkingStripeStatus,
  onCheckStripeStatus,
}: PayoutMethodSelectorProps) {
  const [preferredMethod, setPreferredMethod] = useState<"stripe" | "payoneer">("stripe");
  const [payoneerEmail, setPayoneerEmail] = useState("");
  const [payoneerStatus, setPayoneerStatus] = useState<string | null>(null);
  const [payoneerConfigured, setPayoneerConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPayoneerDialog, setShowPayoneerDialog] = useState(false);
  const [connectingPayoneer, setConnectingPayoneer] = useState(false);
  const [savingPreference, setSavingPreference] = useState(false);

  useEffect(() => {
    fetchPayoneerStatus();
  }, []);

  const fetchPayoneerStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke("check-payoneer-status", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;

      if (data.success) {
        setPayoneerConfigured(data.payoneerConfigured);
        setPayoneerEmail(data.payoneerEmail || "");
        setPayoneerStatus(data.payoneerStatus);
        setPreferredMethod(data.preferredPayoutMethod || "stripe");
      }
    } catch (error) {
      console.error("Error fetching Payoneer status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectPayoneer = async () => {
    if (!payoneerEmail) {
      toast.error("Please enter your Payoneer email");
      return;
    }

    setConnectingPayoneer(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("register-payoneer-payee", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { payoneerEmail },
      });

      if (error) throw error;

      if (data.notConfigured) {
        toast.info("Payoneer integration coming soon! We're working on adding this feature.");
        setShowPayoneerDialog(false);
        return;
      }

      if (data.success) {
        toast.success("Payoneer account connected! Verification in progress.");
        setPayoneerStatus("pending");
        setShowPayoneerDialog(false);
      } else {
        throw new Error(data.error);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to connect Payoneer";
      toast.error(message);
    } finally {
      setConnectingPayoneer(false);
    }
  };

  const handleSetPreferredMethod = async (method: "stripe" | "payoneer") => {
    if (method === "stripe" && !stripeOnboardingComplete) {
      toast.error("Please complete Stripe setup first");
      return;
    }
    if (method === "payoneer" && payoneerStatus !== "active") {
      toast.error("Please complete Payoneer verification first");
      return;
    }

    setSavingPreference(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("profiles")
        .update({ preferred_payout_method: method })
        .eq("user_id", session.user.id);

      if (error) throw error;

      setPreferredMethod(method);
      toast.success(`Preferred payout method set to ${method === "stripe" ? "Stripe" : "Payoneer"}`);
    } catch (error) {
      console.error("Error updating preference:", error);
      toast.error("Failed to update preference");
    } finally {
      setSavingPreference(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stripe Section */}
      <Card className={`${preferredMethod === "stripe" ? "border-primary" : "border-border"}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  Stripe Connect
                  {preferredMethod === "stripe" && (
                    <Badge variant="secondary" className="bg-primary/20 text-primary text-xs">
                      Primary
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>Direct bank deposits in 45+ countries</CardDescription>
              </div>
            </div>
            {stripeOnboardingComplete ? (
              <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400">
                <CheckCircle className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            ) : stripeConnected ? (
              <Badge variant="secondary" className="bg-amber-500/20 text-amber-400">
                Pending
              </Badge>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {stripeOnboardingComplete
              ? "Your bank account is connected through Stripe. Payouts arrive in 1-3 business days."
              : stripeConnected
              ? "Complete your Stripe onboarding to receive payments."
              : "Connect your bank account through Stripe to receive payments. We take a 5% platform fee."}
          </p>

          <div className="flex flex-wrap gap-2">
            {stripeOnboardingComplete ? (
              <>
                <Button variant="outline" onClick={onConnectStripe} disabled={connectingStripe}>
                  {connectingStripe ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <ExternalLink className="w-4 h-4 mr-2" />
                  )}
                  Manage Stripe Account
                </Button>
                {preferredMethod !== "stripe" && (
                  <Button
                    variant="secondary"
                    onClick={() => handleSetPreferredMethod("stripe")}
                    disabled={savingPreference}
                  >
                    Set as Primary
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button onClick={onConnectStripe} disabled={connectingStripe}>
                  {connectingStripe ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : stripeConnected ? (
                    "Complete Onboarding"
                  ) : (
                    "Connect Stripe Account"
                  )}
                </Button>
                {stripeConnected && (
                  <Button variant="outline" onClick={onCheckStripeStatus} disabled={checkingStripeStatus}>
                    {checkingStripeStatus ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                  </Button>
                )}
              </>
            )}
          </div>

          <div className="pt-2 text-xs text-muted-foreground space-y-1">
            <p>✓ Standard withdrawal: <span className="text-emerald-500 font-medium">Free</span> (1-3 business days)</p>
            <p>✓ Instant withdrawal: <span className="text-amber-500 font-medium">3% fee</span></p>
          </div>
        </CardContent>
      </Card>

      {/* Payoneer Section */}
      <Card className={`${preferredMethod === "payoneer" ? "border-primary" : "border-border"}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Globe className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  Payoneer
                  {preferredMethod === "payoneer" && (
                    <Badge variant="secondary" className="bg-primary/20 text-primary text-xs">
                      Primary
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>Global payments in 150+ countries</CardDescription>
              </div>
            </div>
            {payoneerStatus === "active" ? (
              <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400">
                <CheckCircle className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            ) : payoneerStatus === "pending" ? (
              <Badge variant="secondary" className="bg-amber-500/20 text-amber-400">
                Pending Verification
              </Badge>
            ) : !payoneerConfigured ? (
              <Badge variant="secondary" className="bg-muted text-muted-foreground">
                Coming Soon
              </Badge>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {payoneerStatus === "active"
              ? `Connected as ${payoneerEmail}. Withdraw to local bank, mobile money, and more.`
              : payoneerStatus === "pending"
              ? "Your Payoneer account is being verified. This usually takes 1-2 business days."
              : payoneerConfigured
              ? "Connect your Payoneer account for international withdrawals to local banks, mobile money, and more."
              : "Payoneer integration is coming soon! This will allow withdrawals in 150+ countries."}
          </p>

          <div className="flex flex-wrap gap-2">
            {payoneerStatus === "active" ? (
              preferredMethod !== "payoneer" && (
                <Button
                  variant="secondary"
                  onClick={() => handleSetPreferredMethod("payoneer")}
                  disabled={savingPreference}
                >
                  Set as Primary
                </Button>
              )
            ) : payoneerStatus === "pending" ? (
              <Button variant="outline" onClick={fetchPayoneerStatus}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Check Status
              </Button>
            ) : payoneerConfigured ? (
              <Button onClick={() => setShowPayoneerDialog(true)}>
                Connect Payoneer
              </Button>
            ) : (
              <Button variant="outline" disabled className="opacity-50">
                Coming Soon
              </Button>
            )}
          </div>

          <div className="pt-2 text-xs text-muted-foreground space-y-1">
            <p>✓ Standard withdrawal: <span className="text-emerald-500 font-medium">Free</span> (1-3 business days)</p>
            <p>✓ Local currency support in 150+ countries</p>
            <p className="text-muted-foreground/70">Note: Payoneer may charge fees when withdrawing to local bank</p>
          </div>
        </CardContent>
      </Card>

      {/* Payoneer Connect Dialog */}
      <Dialog open={showPayoneerDialog} onOpenChange={setShowPayoneerDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-orange-500" />
              Connect Payoneer
            </DialogTitle>
            <DialogDescription>
              Enter the email address associated with your Payoneer account.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="payoneer-email">Payoneer Email</Label>
              <Input
                id="payoneer-email"
                type="email"
                placeholder="your@email.com"
                value={payoneerEmail}
                onChange={(e) => setPayoneerEmail(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Use the email address you registered with Payoneer
              </p>
            </div>

            <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
              <p className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                Don't have a Payoneer account?{" "}
                <a
                  href="https://www.payoneer.com/signup/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Sign up for free →
                </a>
              </p>
            </div>

            <Button
              className="w-full"
              onClick={handleConnectPayoneer}
              disabled={connectingPayoneer || !payoneerEmail}
            >
              {connectingPayoneer ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                "Connect Payoneer"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
