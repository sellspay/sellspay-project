import { useState, useEffect } from 'react';
import { DollarSign, Wallet, Zap, Clock, Loader2, RefreshCw, Globe, CreditCard, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface EarningsCardProps {
  productEarnings: number; // in dollars
  editorEarnings: number; // in dollars
}

type PayoutProvider = 'stripe' | 'payoneer';
type WithdrawalSpeed = 'standard' | 'instant';

interface PayoutStatus {
  preferredMethod: PayoutProvider;
  stripeConnected: boolean;
  payoneerConnected: boolean;
  payoneerStatus: string | null;
}

export function EarningsCard({ productEarnings, editorEarnings }: EarningsCardProps) {
  const [stripeBalance, setStripeBalance] = useState<{
    connected: boolean;
    availableBalance: number;
    pendingBalance: number;
    pendingEarnings?: number;
    stripeBalance?: number;
    needsOnboarding?: boolean;
    breakdown?: {
      productEarnings: number;
      bookingEarnings: number;
      stripeAvailable?: number;
      stripePending?: number;
    };
  } | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [processingPayout, setProcessingPayout] = useState(false);
  const [payoutStatus, setPayoutStatus] = useState<PayoutStatus | null>(null);
  
  // Withdrawal options
  const [selectedProvider, setSelectedProvider] = useState<PayoutProvider>('stripe');
  const [selectedSpeed, setSelectedSpeed] = useState<WithdrawalSpeed>('standard');

  const totalEarnings = productEarnings + editorEarnings;
  const MINIMUM_WITHDRAWAL = 10; // $10 minimum per Terms of Service

  useEffect(() => {
    fetchStripeBalance();
    fetchPayoutStatus();
  }, []);

  const fetchPayoutStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke('check-payoneer-status', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!error && data) {
        setPayoutStatus({
          preferredMethod: data.preferredMethod || 'stripe',
          stripeConnected: data.stripeConnected || false,
          payoneerConnected: data.payoneerConnected || false,
          payoneerStatus: data.payoneerStatus,
        });
        setSelectedProvider(data.preferredMethod || 'stripe');
      }
    } catch (error) {
      console.error('Failed to fetch payout status:', error);
    }
  };

  const fetchStripeBalance = async () => {
    setLoadingBalance(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke('get-stripe-balance', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;
      setStripeBalance(data);
    } catch (error) {
      console.error('Failed to fetch Stripe balance:', error);
    } finally {
      setLoadingBalance(false);
    }
  };

  const calculateFees = (amount: number, provider: PayoutProvider, speed: WithdrawalSpeed) => {
    // Fee structure per Terms of Service
    if (provider === 'stripe') {
      if (speed === 'instant') {
        const fee = amount * 0.03; // 3% instant payout fee
        return { fee, netAmount: amount - fee, feeLabel: '3% instant fee' };
      }
      return { fee: 0, netAmount: amount, feeLabel: 'Free' };
    } else {
      // Payoneer - platform charges no fee, but Payoneer may charge withdrawal fees
      return { fee: 0, netAmount: amount, feeLabel: 'Free (Payoneer may charge withdrawal fees)' };
    }
  };

  const handleWithdraw = async () => {
    const availableAmount = availableBalanceDollars;
    
    if (availableAmount < MINIMUM_WITHDRAWAL) {
      toast.error(`Minimum withdrawal amount is $${MINIMUM_WITHDRAWAL}`);
      return;
    }

    setProcessingPayout(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to withdraw');
        return;
      }

      if (selectedProvider === 'stripe') {
        const { data, error } = await supabase.functions.invoke('create-payout', {
          headers: { Authorization: `Bearer ${session.access_token}` },
          body: { instant: selectedSpeed === 'instant' },
        });

        if (error) throw error;

        if (data.success) {
          const { fee, netAmount } = calculateFees(data.amount / 100, 'stripe', selectedSpeed);
          toast.success(
            selectedSpeed === 'instant'
              ? `$${netAmount.toFixed(2)} withdrawn instantly! (3% fee: $${fee.toFixed(2)})`
              : `$${(data.amount / 100).toFixed(2)} withdrawal initiated. Arrives in 1-3 business days.`
          );
          setWithdrawDialogOpen(false);
          fetchStripeBalance();
        } else {
          throw new Error(data.error || 'Failed to process withdrawal');
        }
      } else {
        // Payoneer withdrawal
        const amountCents = Math.floor(availableAmount * 100);
        const { data, error } = await supabase.functions.invoke('create-payoneer-payout', {
          headers: { Authorization: `Bearer ${session.access_token}` },
          body: { amountCents },
        });

        if (error) throw error;

        if (data.notConfigured) {
          toast.error('Payoneer integration is coming soon. Please use Stripe for now.');
          return;
        }

        if (data.success) {
          toast.success(data.message || `$${(data.amount / 100).toFixed(2)} withdrawal initiated via Payoneer.`);
          setWithdrawDialogOpen(false);
          fetchStripeBalance();
        } else {
          throw new Error(data.error || 'Failed to process Payoneer withdrawal');
        }
      }
    } catch (error: any) {
      console.error('Withdrawal error:', error);
      toast.error(error.message || 'Failed to process withdrawal');
    } finally {
      setProcessingPayout(false);
    }
  };

  const availableBalanceDollars = (stripeBalance?.availableBalance || 0) / 100;
  const pendingBalanceDollars = (stripeBalance?.pendingBalance || 0) / 100;
  const pendingEarningsDollars = (stripeBalance?.pendingEarnings || 0) / 100;
  const stripeBalanceDollars = (stripeBalance?.stripeBalance || 0) / 100;
  const { fee, netAmount, feeLabel } = calculateFees(availableBalanceDollars, selectedProvider, selectedSpeed);

  // User has earnings even if Stripe not connected (pending platform earnings)
  const hasAvailableFunds = availableBalanceDollars >= MINIMUM_WITHDRAWAL;
  const isStripeAvailable = stripeBalance?.connected || payoutStatus?.stripeConnected;
  const isPayoneerAvailable = payoutStatus?.payoneerConnected && payoutStatus?.payoneerStatus === 'active';
  const needsOnboarding = stripeBalance?.needsOnboarding && !isStripeAvailable;
  const canWithdraw = hasAvailableFunds && 
    ((selectedProvider === 'stripe' && isStripeAvailable) || 
     (selectedProvider === 'payoneer' && isPayoneerAvailable));

  return (
    <>
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wallet className="w-5 h-5 text-primary" />
            Your Earnings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Total Earnings */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Total Earned (All Time)</span>
            <span className="text-2xl font-bold text-primary">
              ${totalEarnings.toFixed(2)}
            </span>
          </div>

          {/* Breakdown */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/50">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <DollarSign className="w-3 h-3" />
                Product Sales
              </div>
              <div className="font-semibold">${productEarnings.toFixed(2)}</div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                Editor Services
              </div>
              <div className="font-semibold">${editorEarnings.toFixed(2)}</div>
            </div>
          </div>

          {/* Available Balance - show for all users with funds */}
          {availableBalanceDollars > 0 && (
            <div className="pt-2 border-t border-border/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Available to Withdraw</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-emerald-500">
                    ${availableBalanceDollars.toFixed(2)}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6"
                    onClick={fetchStripeBalance}
                    disabled={loadingBalance}
                  >
                    <RefreshCw className={`w-3 h-3 ${loadingBalance ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
              
              {/* Breakdown for users with pending earnings */}
              {pendingEarningsDollars > 0 && stripeBalanceDollars > 0 && (
                <div className="text-xs space-y-1 text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Platform pending</span>
                    <span>${pendingEarningsDollars.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Stripe balance</span>
                    <span>${stripeBalanceDollars.toFixed(2)}</span>
                  </div>
                </div>
              )}
              
              {pendingBalanceDollars > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Pending (7-day hold)</span>
                  <span className="text-warning">${pendingBalanceDollars.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}

          {/* Withdraw Button - show if Stripe connected and has funds */}
          {isStripeAvailable && hasAvailableFunds && (
            <Button 
              className="w-full" 
              onClick={() => setWithdrawDialogOpen(true)}
              disabled={loadingBalance}
            >
              <Wallet className="w-4 h-4 mr-2" />
              Withdraw Funds
            </Button>
          )}

          {/* Needs Onboarding - has funds but no payout method */}
          {needsOnboarding && hasAvailableFunds && (
            <div className="space-y-2">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  You have ${availableBalanceDollars.toFixed(2)} in pending earnings. Complete payout setup in Settings to withdraw.
                </AlertDescription>
              </Alert>
              <Button variant="outline" className="w-full" asChild>
                <a href="/settings">Complete Payout Setup</a>
              </Button>
            </div>
          )}

          {availableBalanceDollars > 0 && availableBalanceDollars < MINIMUM_WITHDRAWAL && (
            <p className="text-xs text-muted-foreground text-center">
              Minimum withdrawal: ${MINIMUM_WITHDRAWAL}
            </p>
          )}

          {loadingBalance && (
            <div className="flex items-center justify-center py-2">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          )}

          {!loadingBalance && availableBalanceDollars === 0 && (
            <p className="text-xs text-muted-foreground text-center">
              {isStripeAvailable ? 'No funds available to withdraw' : 'Complete payout setup in Settings to withdraw funds'}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Withdraw Dialog */}
      <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Withdraw Funds</DialogTitle>
            <DialogDescription>
              Choose your payout provider and withdrawal speed. Available: ${availableBalanceDollars.toFixed(2)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            {/* Provider Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Payout Provider</Label>
              <RadioGroup 
                value={selectedProvider} 
                onValueChange={(v) => setSelectedProvider(v as PayoutProvider)}
                className="space-y-2"
              >
                {/* Stripe Option */}
                <div className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                  selectedProvider === 'stripe' ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent/50'
                } ${!isStripeAvailable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                  <RadioGroupItem value="stripe" id="stripe" disabled={!isStripeAvailable} />
                  <Label htmlFor="stripe" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-primary" />
                      <span className="font-medium">Stripe Connect</span>
                      {isStripeAvailable && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">Connected</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Direct bank deposit in 45+ countries
                    </p>
                  </Label>
                </div>

                {/* Payoneer Option */}
                <div className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                  selectedProvider === 'payoneer' ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent/50'
                } ${!isPayoneerAvailable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                  <RadioGroupItem value="payoneer" id="payoneer" disabled={!isPayoneerAvailable} />
                  <Label htmlFor="payoneer" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-orange-500" />
                      <span className="font-medium">Payoneer</span>
                      {isPayoneerAvailable ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">Connected</span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {payoutStatus?.payoneerStatus === 'pending' ? 'Pending Verification' : 'Not Connected'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Global payouts, local currency, mobile money
                    </p>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Speed Selection (Stripe only) */}
            {selectedProvider === 'stripe' && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Withdrawal Speed</Label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Standard */}
                  <button
                    onClick={() => setSelectedSpeed('standard')}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      selectedSpeed === 'standard' ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-primary" />
                      <span className="font-medium text-sm">Standard</span>
                    </div>
                    <p className="text-xs text-muted-foreground">1-3 business days</p>
                    <p className="text-xs font-medium text-emerald-500 mt-1">Free</p>
                  </button>

                  {/* Instant */}
                  <button
                    onClick={() => setSelectedSpeed('instant')}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      selectedSpeed === 'instant' ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="w-4 h-4 text-warning" />
                      <span className="font-medium text-sm">Instant</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Arrives instantly</p>
                    <p className="text-xs font-medium text-warning mt-1">3% fee</p>
                  </button>
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="p-4 rounded-lg bg-muted/50 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Withdrawal Amount</span>
                <span>${availableBalanceDollars.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Platform Fee</span>
                <span className={fee > 0 ? 'text-warning' : 'text-emerald-500'}>
                  {fee > 0 ? `-$${fee.toFixed(2)}` : feeLabel}
                </span>
              </div>
              <div className="flex justify-between font-semibold pt-2 border-t border-border">
                <span>You'll Receive</span>
                <span className="text-primary">${netAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Regulatory Notice */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                By withdrawing, you agree to our <a href="/terms" className="underline">Terms of Service</a> and confirm compliance with applicable tax reporting requirements. 
                Earnings are subject to a 7-day holding period for fraud prevention.
              </AlertDescription>
            </Alert>

            {/* Withdraw Button */}
            <Button 
              className="w-full" 
              onClick={handleWithdraw}
              disabled={processingPayout || !canWithdraw}
            >
              {processingPayout ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Wallet className="w-4 h-4 mr-2" />
                  Withdraw ${netAmount.toFixed(2)} via {selectedProvider === 'stripe' ? 'Stripe' : 'Payoneer'}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
