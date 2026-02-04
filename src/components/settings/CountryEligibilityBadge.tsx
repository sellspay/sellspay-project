import { useState, useEffect } from "react";
import { Globe, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CountryEligibilityBadgeProps {
  countryCode: string | null;
  countryName?: string;
  onEligibilityChange?: (isEligible: boolean, mode: "CONNECT" | "MOR") => void;
}

export function CountryEligibilityBadge({ 
  countryCode, 
  countryName,
  onEligibilityChange 
}: CountryEligibilityBadgeProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isEligible, setIsEligible] = useState<boolean | null>(null);
  const [displayName, setDisplayName] = useState(countryName || "");

  useEffect(() => {
    if (!countryCode) {
      setIsEligible(null);
      return;
    }
    checkEligibility(countryCode);
  }, [countryCode]);

  const checkEligibility = async (code: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("check-country-eligibility", {
        body: { countryCode: code },
      });

      if (error) throw error;

      const eligible = data?.connectEligible ?? false;
      setIsEligible(eligible);
      setDisplayName(data?.countryName || countryName || code);
      
      onEligibilityChange?.(eligible, eligible ? "CONNECT" : "MOR");
    } catch (error) {
      console.error("Error checking country eligibility:", error);
      setIsEligible(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (!countryCode) {
    return null;
  }

  if (isLoading) {
    return (
      <Badge variant="secondary" className="gap-1.5">
        <Loader2 className="w-3 h-3 animate-spin" />
        Checking eligibility...
      </Badge>
    );
  }

  if (isEligible === null) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={`gap-1.5 ${
              isEligible 
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" 
                : "border-amber-500/30 bg-amber-500/10 text-amber-400"
            }`}
          >
            <Globe className="w-3 h-3" />
            {displayName}
            {isEligible ? (
              <CheckCircle className="w-3 h-3" />
            ) : (
              <AlertCircle className="w-3 h-3" />
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          {isEligible ? (
            <p className="text-xs">
              <strong>Stripe Connect supported!</strong> You can receive instant payouts directly to your bank account.
            </p>
          ) : (
            <p className="text-xs">
              <strong>Platform payout mode.</strong> Stripe Connect isn't available in your country. 
              You can withdraw earnings via PayPal or Payoneer after a 7-day hold.
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
