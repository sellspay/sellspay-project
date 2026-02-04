import { useState, useEffect } from "react";
import { Wallet, TrendingUp, Clock, Lock, ArrowUpRight, Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

  useEffect(() => {
    fetchBalance();
  }, []);

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

  return (
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
                  ? "bg-green-500/10 text-green-500 border-green-500/20"
                  : "bg-orange-500/10 text-orange-500 border-orange-500/20"
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
            <TrendingUp className="h-4 w-4 mx-auto mb-1 text-green-500" />
            <p className="text-xs text-muted-foreground">Available</p>
            <p className="font-semibold">${balance.available_usd}</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <Clock className="h-4 w-4 mx-auto mb-1 text-yellow-500" />
            <p className="text-xs text-muted-foreground">Pending</p>
            <p className="font-semibold">${balance.pending_usd}</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <Lock className="h-4 w-4 mx-auto mb-1 text-red-500" />
            <p className="text-xs text-muted-foreground">Locked</p>
            <p className="font-semibold">${balance.locked_usd}</p>
          </div>
        </div>

        {/* Progress Bar */}
        {totalBalance > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Available</span>
              <span>Pending (7-day hold)</span>
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
          disabled={!canWithdraw}
          onClick={onRequestPayout}
        >
          <ArrowUpRight className="h-4 w-4 mr-2" />
          {canWithdraw
            ? `Withdraw $${balance.available_usd}`
            : `Min. $20 to withdraw`}
        </Button>

        {balance.pending_cents > 0 && (
          <p className="text-xs text-center text-muted-foreground">
            Pending funds become available after a 7-day hold period
          </p>
        )}
      </CardContent>
    </Card>
  );
}
