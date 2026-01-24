import { useState, useEffect } from 'react';
import { DollarSign, Wallet, Zap, Clock, Loader2, RefreshCw } from 'lucide-react';
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

interface EarningsCardProps {
  productEarnings: number; // in dollars
  editorEarnings: number; // in dollars
}

export function EarningsCard({ productEarnings, editorEarnings }: EarningsCardProps) {
  const [stripeBalance, setStripeBalance] = useState<{
    connected: boolean;
    availableBalance: number;
    pendingBalance: number;
  } | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [processingPayout, setProcessingPayout] = useState(false);

  const totalEarnings = productEarnings + editorEarnings;

  useEffect(() => {
    fetchStripeBalance();
  }, []);

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

  const handleWithdraw = async (instant: boolean) => {
    setProcessingPayout(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to withdraw');
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-payout', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { instant },
      });

      if (error) throw error;

      if (data.success) {
        toast.success(
          instant 
            ? `$${(data.amount / 100).toFixed(2)} withdrawn instantly! (3% fee: $${(data.fee / 100).toFixed(2)})`
            : `$${(data.amount / 100).toFixed(2)} withdrawal initiated. Arrives in 1-3 business days.`
        );
        setWithdrawDialogOpen(false);
        fetchStripeBalance(); // Refresh balance
      } else {
        throw new Error(data.error || 'Failed to process withdrawal');
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

          {/* Stripe Balance */}
          {stripeBalance?.connected && (
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
              {pendingBalanceDollars > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Pending</span>
                  <span className="text-warning">${pendingBalanceDollars.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}

          {/* Withdraw Button */}
          {stripeBalance?.connected && (
            <Button 
              className="w-full" 
              onClick={() => setWithdrawDialogOpen(true)}
              disabled={loadingBalance || availableBalanceDollars <= 0}
            >
              <Wallet className="w-4 h-4 mr-2" />
              Withdraw Funds
            </Button>
          )}

          {loadingBalance && (
            <div className="flex items-center justify-center py-2">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          )}

          {!loadingBalance && !stripeBalance?.connected && (
            <p className="text-xs text-muted-foreground text-center">
              Complete Stripe setup in Settings to withdraw funds
            </p>
          )}
        </CardContent>
      </Card>

      {/* Withdraw Dialog */}
      <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Withdraw Funds</DialogTitle>
            <DialogDescription>
              Choose your withdrawal method. Available balance: ${availableBalanceDollars.toFixed(2)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            {/* Standard Withdrawal */}
            <button
              onClick={() => handleWithdraw(false)}
              disabled={processingPayout || availableBalanceDollars <= 0}
              className="w-full p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold">Standard Withdrawal</div>
                  <div className="text-sm text-muted-foreground">
                    1-3 business days • <span className="text-emerald-500 font-medium">Free</span>
                  </div>
                  <div className="text-lg font-bold mt-1">
                    ${availableBalanceDollars.toFixed(2)}
                  </div>
                </div>
              </div>
            </button>

            {/* Instant Withdrawal */}
            <button
              onClick={() => handleWithdraw(true)}
              disabled={processingPayout || availableBalanceDollars <= 0}
              className="w-full p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-warning/10">
                  <Zap className="w-5 h-5 text-warning" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold">Instant Withdrawal</div>
                  <div className="text-sm text-muted-foreground">
                    Arrives instantly • <span className="text-warning font-medium">3% fee</span>
                  </div>
                  <div className="text-lg font-bold mt-1">
                    ${(availableBalanceDollars * 0.97).toFixed(2)}
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      (fee: ${(availableBalanceDollars * 0.03).toFixed(2)})
                    </span>
                  </div>
                </div>
              </div>
            </button>

            {processingPayout && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing withdrawal...
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
