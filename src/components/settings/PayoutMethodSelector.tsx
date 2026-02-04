import { useState, useEffect } from "react";
import { CreditCard, Globe, Loader2, CheckCircle, AlertCircle, ExternalLink, RefreshCw, Building, Unlink, Wallet } from "lucide-react";
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PayoutMethodSelectorProps {
  stripeConnected: boolean;
  stripeOnboardingComplete: boolean;
  onConnectStripe: () => void;
  connectingStripe: boolean;
  checkingStripeStatus: boolean;
  onCheckStripeStatus: () => void;
  onStripeDisconnected?: () => void;
  onStripeStatusLoaded?: (connected: boolean, onboardingComplete: boolean) => void;
  sellerMode?: "CONNECT" | "MOR" | null;
}

interface BankAccount {
  id: string;
  bank_name: string | null;
  last4: string;
  account_type: string | null;
  currency: string;
  default_for_currency: boolean;
  status: string | null;
}

export function PayoutMethodSelector({
  stripeConnected,
  stripeOnboardingComplete,
  onConnectStripe,
  connectingStripe,
  checkingStripeStatus,
  onCheckStripeStatus,
  onStripeDisconnected,
  onStripeStatusLoaded,
  sellerMode,
}: PayoutMethodSelectorProps) {
  const isMorMode = sellerMode === "MOR";
  const [preferredMethod, setPreferredMethod] = useState<"stripe" | "payoneer" | "paypal">("stripe");
  const [payoneerEmail, setPayoneerEmail] = useState("");
  const [payoneerStatus, setPayoneerStatus] = useState<string | null>(null);
  const [payoneerConfigured, setPayoneerConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPayoneerDialog, setShowPayoneerDialog] = useState(false);
  const [connectingPayoneer, setConnectingPayoneer] = useState(false);
  const [savingPreference, setSavingPreference] = useState(false);
  
  // PayPal state
  const [paypalEmail, setPaypalEmail] = useState("");
  const [paypalConnected, setPaypalConnected] = useState(false);
  // showPaypalDialog removed - now using OAuth redirect flow
  const [connectingPaypal, setConnectingPaypal] = useState(false);
  const [paypalAuthUrl, setPaypalAuthUrl] = useState<string | null>(null);
  const [paypalAuthUrlPrefetchedAt, setPaypalAuthUrlPrefetchedAt] = useState<number | null>(null);
  const [statusLoadSlow, setStatusLoadSlow] = useState(false);
  const [showDisconnectPaypalDialog, setShowDisconnectPaypalDialog] = useState(false);
  const [disconnectingPaypal, setDisconnectingPaypal] = useState(false);
  
  // Bank account state
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loadingBankAccounts, setLoadingBankAccounts] = useState(false);
  const [openingDashboard, setOpeningDashboard] = useState(false);
  
  // Disconnect dialogs
  const [showDisconnectStripeDialog, setShowDisconnectStripeDialog] = useState(false);
  const [showDisconnectPayoneerDialog, setShowDisconnectPayoneerDialog] = useState(false);
  const [disconnectingStripe, setDisconnectingStripe] = useState(false);
  const [disconnectingPayoneer, setDisconnectingPayoneer] = useState(false);

  useEffect(() => {
    fetchPayoneerStatus();
  }, []);

  // If the status call is slow/cold-starting, don't block the entire Billing tab UI.
  useEffect(() => {
    if (!loading) return;
    const t = window.setTimeout(() => {
      // Let the UI render even if the status call hasn't returned yet.
      setStatusLoadSlow(true);
      setLoading(false);
    }, 4000);
    return () => window.clearTimeout(t);
  }, [loading]);

  useEffect(() => {
    if (stripeOnboardingComplete) {
      fetchBankAccounts();
    }
  }, [stripeOnboardingComplete]);

  const fetchBankAccounts = async () => {
    setLoadingBankAccounts(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke("get-external-accounts", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;

      if (data.success && data.accounts) {
        setBankAccounts(data.accounts);
      }
    } catch (error) {
      console.error("Error fetching bank accounts:", error);
    } finally {
      setLoadingBankAccounts(false);
    }
  };

  const handleOpenDashboard = async () => {
    setOpeningDashboard(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("create-login-link", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;

      if (data.success && data.url) {
        window.open(data.url, "_blank");
        toast.success("Opening your bank account dashboard...");
      } else {
        throw new Error(data.error || "Failed to create login link");
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to open dashboard";
      toast.error(message);
    } finally {
      setOpeningDashboard(false);
    }
  };

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
        // Also check for PayPal
        setPaypalEmail(data.paypalEmail || "");
        setPaypalConnected(data.paypalConnected || false);
        setPreferredMethod(data.preferredPayoutMethod || "stripe");
        
        // Notify parent of Stripe status from this unified call
        if (onStripeStatusLoaded) {
          onStripeStatusLoaded(
            data.stripeConnected || false,
            data.stripeOnboardingComplete || false
          );
        }

        // Prefetch PayPal OAuth URL so the button click can redirect instantly.
        // Safe because the state token is stored with a 10-minute expiry.
        if (!data.paypalConnected && data.paypalConfigured) {
          void prefetchPaypalAuthUrl();
        }
      }
    } catch (error) {
      console.error("Error fetching Payoneer status:", error);
    } finally {
      setStatusLoadSlow(false);
      setLoading(false);
    }
  };

  const prefetchPaypalAuthUrl = async () => {
    // If we already have a fresh URL, skip.
    if (paypalAuthUrl && paypalAuthUrlPrefetchedAt && Date.now() - paypalAuthUrlPrefetchedAt < 8 * 60 * 1000) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke("initiate-paypal-connect", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { origin: window.location.origin },
      });

      if (error) return;
      if (data?.success && data?.authUrl) {
        setPaypalAuthUrl(data.authUrl);
        setPaypalAuthUrlPrefetchedAt(Date.now());
      }
    } catch {
      // Silent: prefetch should never block the UI.
    }
  };

  const handleConnectPaypal = async () => {
    // If we already prefetched a fresh OAuth URL, redirect immediately.
    if (paypalAuthUrl && paypalAuthUrlPrefetchedAt && Date.now() - paypalAuthUrlPrefetchedAt < 9 * 60 * 1000) {
      window.location.href = paypalAuthUrl;
      return;
    }

    setConnectingPaypal(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("initiate-paypal-connect", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { origin: window.location.origin },
      });

      if (error) throw error;

      if (data.notConfigured) {
        toast.info("PayPal integration coming soon!");
        return;
      }

      if (data.success && data.authUrl) {
        setPaypalAuthUrl(data.authUrl);
        setPaypalAuthUrlPrefetchedAt(Date.now());
        // Redirect user to PayPal for real OAuth login
        window.location.href = data.authUrl;
      } else {
        throw new Error(data.error || "Failed to initiate PayPal connection");
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to connect PayPal";
      toast.error(message);
    } finally {
      setConnectingPaypal(false);
    }
  };

  const handleDisconnectPaypal = async () => {
    setDisconnectingPaypal(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // Call the disconnect RPC
      const { error } = await supabase.rpc("disconnect_seller_paypal", { 
        p_user_id: session.user.id 
      });

      if (error) throw error;

      toast.success("PayPal account disconnected successfully");
      setPaypalEmail("");
      setPaypalConnected(false);
      if (preferredMethod === "paypal") {
        setPreferredMethod("stripe");
      }
      setShowDisconnectPaypalDialog(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to disconnect PayPal";
      toast.error(message);
    } finally {
      setDisconnectingPaypal(false);
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

  const handleSetPreferredMethod = async (method: "stripe" | "payoneer" | "paypal") => {
    if (method === "stripe" && !stripeOnboardingComplete) {
      toast.error("Please complete Stripe setup first");
      return;
    }
    if (method === "payoneer" && payoneerStatus !== "active") {
      toast.error("Please complete Payoneer verification first");
      return;
    }
    if (method === "paypal" && !paypalConnected) {
      toast.error("Please connect your PayPal account first");
      return;
    }

    setSavingPreference(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // Update preference via edge function (stored in private.seller_config)
      const { data, error } = await supabase.functions.invoke("disconnect-stripe", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { action: "set_preference", preferred_method: method },
      });

      // For now, just update local state since the edge function handles preferences
      setPreferredMethod(method);
      toast.success(`Preferred payout method set to ${method === "stripe" ? "Stripe" : "Payoneer"}`);
    } catch (error) {
      console.error("Error updating preference:", error);
      toast.error("Failed to update preference");
    } finally {
      setSavingPreference(false);
    }
  };

  const handleDisconnectStripe = async () => {
    setDisconnectingStripe(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("disconnect-stripe", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;

      if (data.success) {
        toast.success("Stripe account disconnected successfully");
        setBankAccounts([]);
        setShowDisconnectStripeDialog(false);
        onStripeDisconnected?.();
      } else {
        throw new Error(data.error || "Failed to disconnect Stripe");
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to disconnect Stripe";
      toast.error(message);
    } finally {
      setDisconnectingStripe(false);
    }
  };

  const handleDisconnectPayoneer = async () => {
    setDisconnectingPayoneer(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("disconnect-payoneer", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;

      if (data.success) {
        toast.success("Payoneer account disconnected successfully");
        setPayoneerStatus(null);
        setPayoneerEmail("");
        setPreferredMethod("stripe");
        setShowDisconnectPayoneerDialog(false);
      } else {
        throw new Error(data.error || "Failed to disconnect Payoneer");
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to disconnect Payoneer";
      toast.error(message);
    } finally {
      setDisconnectingPayoneer(false);
    }
  };

  return (
    <div className="space-y-6">
      {statusLoadSlow && (
        <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          Loading payout status is taking longer than usual. You can still connect providers now, and the status will update when it finishes.
        </div>
      )}
      {/* Bank Account Section - Only shown when Stripe is connected */}
      {stripeOnboardingComplete && (
        <Card className="border-primary/50 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <Building className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    Bank Account
                    <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400 text-xs">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Connected
                    </Badge>
                  </CardTitle>
                  <CardDescription>Your bank account for receiving payouts</CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingBankAccounts ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading bank account info...
              </div>
            ) : bankAccounts.length > 0 ? (
              <div className="space-y-3">
                {bankAccounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-background">
                        <Building className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {account.bank_name || "Bank Account"} •••• {account.last4}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {account.currency} {account.account_type ? `• ${account.account_type}` : ""}
                          {account.default_for_currency && (
                            <span className="ml-1 text-emerald-500">• Default</span>
                          )}
                        </p>
                      </div>
                    </div>
                    {account.status && (
                      <Badge variant="secondary" className="text-xs capitalize">
                        {account.status}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Your bank account is connected through Stripe. Click "Manage Bank Account" to view or update your banking details.
              </p>
            )}

            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                variant="outline"
                onClick={handleOpenDashboard}
                disabled={openingDashboard}
              >
                {openingDashboard ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <ExternalLink className="w-4 h-4 mr-2" />
                )}
                Manage Bank Account
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={fetchBankAccounts}
                disabled={loadingBankAccounts}
              >
                <RefreshCw className={`w-4 h-4 ${loadingBankAccounts ? "animate-spin" : ""}`} />
              </Button>
            </div>

            <p className="text-xs text-muted-foreground pt-2">
              Your bank account is securely managed through Stripe. All verification and compliance is handled by Stripe.
            </p>
          </CardContent>
        </Card>
      )}

      <Separator />

      <p className="text-sm font-medium text-muted-foreground">Payout Providers</p>

      {/* Stripe Section - Hidden for MOR mode unless already connected */}
      {(!isMorMode || stripeConnected || stripeOnboardingComplete) && (
      <Card className={`${preferredMethod === "stripe" ? "border-primary" : "border-border"} ${isMorMode && !stripeOnboardingComplete ? "opacity-60" : ""}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  Stripe Connect
                  {preferredMethod === "stripe" && !isMorMode && (
                    <Badge variant="secondary" className="bg-primary/20 text-primary text-xs">
                      Primary
                    </Badge>
                  )}
                  {isMorMode && !stripeOnboardingComplete && (
                    <Badge variant="secondary" className="bg-muted text-muted-foreground text-xs">
                      Not Available
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
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Pending Review
              </Badge>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {isMorMode && !stripeOnboardingComplete
              ? "Stripe Connect is not available in your region. Use PayPal or Payoneer for withdrawals."
              : stripeOnboardingComplete
              ? "Your bank account is connected through Stripe. Payouts arrive in 1-3 business days."
              : stripeConnected
              ? "Your information is being reviewed by Stripe. This typically takes a few minutes, but can take up to 24 hours. Click refresh to check status."
              : "Connect your bank account through Stripe to receive payments. We take a 5% platform fee."}
          </p>

          <div className="flex flex-wrap gap-2">
            {stripeOnboardingComplete ? (
              <>
                <Button variant="outline" onClick={handleOpenDashboard} disabled={openingDashboard}>
                  {openingDashboard ? (
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
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => setShowDisconnectStripeDialog(true)}
                >
                  <Unlink className="w-4 h-4 mr-2" />
                  Disconnect
                </Button>
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
                  <>
                    <Button variant="outline" onClick={onCheckStripeStatus} disabled={checkingStripeStatus}>
                      {checkingStripeStatus ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setShowDisconnectStripeDialog(true)}
                    >
                      <Unlink className="w-4 h-4 mr-2" />
                      Disconnect
                    </Button>
                  </>
                )}
              </>
            )}
          </div>

          {!isMorMode && (
          <div className="pt-2 text-xs text-muted-foreground space-y-1">
            <p>✓ Standard withdrawal: <span className="text-emerald-500 font-medium">Free</span> (1-3 business days)</p>
            <p>✓ Instant withdrawal: <span className="text-amber-500 font-medium">3% fee</span></p>
          </div>
          )}
        </CardContent>
      </Card>
      )}

      {/* Payoneer Section */}
      <Card className={`${preferredMethod === "payoneer" ? "border-primary" : "border-border"} ${isMorMode ? "ring-1 ring-amber-500/30" : ""}`}>
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
                  {isMorMode && payoneerStatus !== "active" && (
                    <Badge variant="secondary" className="bg-amber-500/20 text-amber-400 text-xs">
                      Recommended
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
              <>
                {preferredMethod !== "payoneer" && (
                  <Button
                    variant="secondary"
                    onClick={() => handleSetPreferredMethod("payoneer")}
                    disabled={savingPreference}
                  >
                    Set as Primary
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => setShowDisconnectPayoneerDialog(true)}
                >
                  <Unlink className="w-4 h-4 mr-2" />
                  Disconnect
                </Button>
              </>
            ) : payoneerStatus === "pending" ? (
              <>
                <Button variant="outline" onClick={fetchPayoneerStatus}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Check Status
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => setShowDisconnectPayoneerDialog(true)}
                >
                  <Unlink className="w-4 h-4 mr-2" />
                  Disconnect
                </Button>
              </>
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

      {/* PayPal Section */}
      <Card className={`${preferredMethod === "paypal" ? "border-primary" : "border-border"} ${isMorMode ? "ring-1 ring-amber-500/30" : ""}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Wallet className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  PayPal
                  {preferredMethod === "paypal" && (
                    <Badge variant="secondary" className="bg-primary/20 text-primary text-xs">
                      Primary
                    </Badge>
                  )}
                  {isMorMode && !paypalConnected && (
                    <Badge variant="secondary" className="bg-amber-500/20 text-amber-400 text-xs">
                      Recommended
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>Fast, worldwide payments to your PayPal account</CardDescription>
              </div>
            </div>
            <Badge variant="secondary" className="bg-muted text-muted-foreground">
              Coming Soon
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            PayPal integration is coming soon! This will allow you to receive fast, worldwide payouts directly to your PayPal balance.
          </p>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" disabled className="opacity-50">
              Coming Soon
            </Button>
          </div>

          <div className="pt-2 text-xs text-muted-foreground space-y-1">
            <p>✓ Instant access to funds in your PayPal balance</p>
            <p>✓ Available in 200+ countries and 25 currencies</p>
            <p className="text-muted-foreground/70">Note: PayPal fees apply when receiving payments</p>
          </div>
        </CardContent>
      </Card>
      {/* PayPal Connect Dialog removed - now using OAuth redirect */}

      {/* Disconnect PayPal Confirmation */}
      <AlertDialog open={showDisconnectPaypalDialog} onOpenChange={setShowDisconnectPaypalDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect PayPal Account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove your PayPal connection. You won't be able to receive payouts via PayPal until you reconnect.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={disconnectingPaypal}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisconnectPaypal}
              disabled={disconnectingPaypal}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {disconnectingPaypal ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Disconnecting...
                </>
              ) : (
                "Disconnect"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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

      {/* Disconnect Stripe Confirmation */}
      <AlertDialog open={showDisconnectStripeDialog} onOpenChange={setShowDisconnectStripeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Stripe Account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove your bank account connection. You won't be able to receive payouts until you reconnect. 
              Any pending withdrawals will still be processed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={disconnectingStripe}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisconnectStripe}
              disabled={disconnectingStripe}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {disconnectingStripe ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Disconnecting...
                </>
              ) : (
                "Disconnect"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Disconnect Payoneer Confirmation */}
      <AlertDialog open={showDisconnectPayoneerDialog} onOpenChange={setShowDisconnectPayoneerDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Payoneer Account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove your Payoneer connection. You won't be able to receive payouts via Payoneer until you reconnect.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={disconnectingPayoneer}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisconnectPayoneer}
              disabled={disconnectingPayoneer}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {disconnectingPayoneer ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Disconnecting...
                </>
              ) : (
                "Disconnect"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
