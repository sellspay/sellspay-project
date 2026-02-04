import { CreditCard, Globe, Wallet } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CountryEligibilityBadge } from "./CountryEligibilityBadge";

interface SellerModeIndicatorProps {
  sellerMode: "CONNECT" | "MOR" | null;
  countryCode: string | null;
  countryName?: string;
  onModeChange?: (mode: "CONNECT" | "MOR") => void;
}

export function SellerModeIndicator({ 
  sellerMode, 
  countryCode, 
  countryName,
  onModeChange 
}: SellerModeIndicatorProps) {
  const handleEligibilityChange = (isEligible: boolean, mode: "CONNECT" | "MOR") => {
    onModeChange?.(mode);
  };

  if (!countryCode) {
    return (
      <Card className="border-muted/50 bg-muted/20">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <Globe className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg">Payout Region</CardTitle>
              <CardDescription>Your country determines available payout methods</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Complete your creator application to set your country and unlock payout options.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border transition-colors ${
      sellerMode === "CONNECT" 
        ? "border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-transparent" 
        : "border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent"
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              sellerMode === "CONNECT" 
                ? "bg-emerald-500/10" 
                : "bg-amber-500/10"
            }`}>
              {sellerMode === "CONNECT" ? (
                <CreditCard className={`w-5 h-5 ${sellerMode === "CONNECT" ? "text-emerald-500" : "text-amber-500"}`} />
              ) : (
                <Wallet className="w-5 h-5 text-amber-500" />
              )}
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {sellerMode === "CONNECT" ? "Stripe Connect" : "Platform Payouts"}
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${
                    sellerMode === "CONNECT" 
                      ? "bg-emerald-500/20 text-emerald-400" 
                      : "bg-amber-500/20 text-amber-400"
                  }`}
                >
                  {sellerMode === "CONNECT" ? "Direct" : "Held"}
                </Badge>
              </CardTitle>
              <CardDescription>
                {sellerMode === "CONNECT" 
                  ? "Receive earnings directly to your bank" 
                  : "Withdraw via PayPal or Payoneer"
                }
              </CardDescription>
            </div>
          </div>
          <CountryEligibilityBadge 
            countryCode={countryCode} 
            countryName={countryName}
            onEligibilityChange={handleEligibilityChange}
          />
        </div>
      </CardHeader>
      <CardContent>
        {sellerMode === "CONNECT" ? (
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">
              Your country supports Stripe Connect. Earnings are transferred to your connected bank account 
              with minimal platform fees.
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
              <li>Instant transfers on each sale</li>
              <li>Lower fees (3-5% platform + Stripe processing)</li>
              <li>Direct bank deposits</li>
            </ul>
          </div>
        ) : (
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">
              Earnings are held by the platform and available for withdrawal after a 7-day hold period.
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
              <li>7-day holding period for all sales</li>
              <li>Minimum $10 withdrawal</li>
              <li>PayPal or Payoneer withdrawal options</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
