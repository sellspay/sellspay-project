import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";

interface CreditStatus {
  creditBalance: number;
  isLoading: boolean;
  error: string | null;
}

interface CreditSubscription {
  id: string;
  status: string;
  currentPeriodEnd: string;
  currentPeriodStart: string;
  cancelAtPeriodEnd: boolean;
  priceAmount: number;
  credits: number;
  productId: string;
}

// AI-powered tools that require credits (1 credit per use)
export const PRO_TOOLS = [
  "sfx-generator",
  "voice-isolator",
  "sfx-isolator",
  "music-splitter",
];

export function useCredits() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<CreditStatus>({
    creditBalance: 0,
    isLoading: true,
    error: null,
  });
  const [subscription, setSubscription] = useState<CreditSubscription | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  const checkCredits = useCallback(async () => {
    if (!user) {
      setStatus({
        creditBalance: 0,
        isLoading: false,
        error: null,
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("check-credits");
      
      if (error) throw error;
      
      setStatus({
        creditBalance: data.credit_balance ?? 0,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      console.error("Error checking credits:", err);
      setStatus((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : "Failed to check credits",
      }));
    }
  }, [user]);

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setSubscription(null);
      return;
    }

    setSubscriptionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-credit-subscription", {
        body: { action: "check" },
      });
      
      if (error) throw error;
      
      if (data.hasSubscription && data.subscription) {
        setSubscription(data.subscription);
      } else {
        setSubscription(null);
      }
    } catch (err) {
      console.error("Error checking subscription:", err);
      setSubscription(null);
    } finally {
      setSubscriptionLoading(false);
    }
  }, [user]);

  const deductCredit = useCallback(async (toolId: string) => {
    if (!user) return { success: false, error: "Not authenticated" };

    try {
      const { data, error } = await supabase.functions.invoke("deduct-credit", {
        body: { tool_id: toolId },
      });
      
      if (error) throw error;
      
      if (data.success) {
        setStatus((prev) => ({
          ...prev,
          creditBalance: data.credit_balance,
        }));
        return { success: true, newBalance: data.credit_balance };
      } else {
        return { success: false, error: data.error || "Failed to deduct credit" };
      }
    } catch (err) {
      console.error("Error deducting credit:", err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : "Failed to deduct credit" 
      };
    }
  }, [user]);

  const startCheckout = useCallback(async (packageId: string, priceId?: string) => {
    if (!user) {
      navigate("/login");
      return null;
    }

    try {
      const { data, error } = await supabase.functions.invoke("create-credit-checkout", {
        body: { package_id: packageId, price_id: priceId },
      });
      
      if (error) throw error;
      
      if (data.url) {
        window.open(data.url, "_blank");
      }
      
      return data.url;
    } catch (err) {
      console.error("Error starting checkout:", err);
      return null;
    }
  }, [user, navigate]);

  const verifyPurchase = useCallback(async (sessionId: string) => {
    if (!user) return { success: false };

    try {
      const { data, error } = await supabase.functions.invoke("add-credits", {
        body: { session_id: sessionId },
      });
      
      if (error) throw error;
      
      if (data.success) {
        setStatus((prev) => ({
          ...prev,
          creditBalance: data.credit_balance,
        }));
        // Also refresh subscription status
        checkSubscription();
        return { 
          success: true, 
          creditsAdded: data.credits_added,
          newBalance: data.credit_balance 
        };
      }
      return { success: false };
    } catch (err) {
      console.error("Error verifying purchase:", err);
      return { success: false };
    }
  }, [user, checkSubscription]);

  const openCustomerPortal = useCallback(async () => {
    if (!user) return null;

    try {
      const { data, error } = await supabase.functions.invoke("manage-credit-subscription", {
        body: { action: "portal" },
      });
      
      if (error) throw error;
      
      if (data.url) {
        window.open(data.url, "_blank");
      }
      
      return data.url;
    } catch (err) {
      console.error("Error opening customer portal:", err);
      return null;
    }
  }, [user]);

  const canUseTool = useCallback((toolId: string) => {
    // Free tools - always available
    if (!PRO_TOOLS.includes(toolId)) return true;
    
    // Pro tools require credits
    return status.creditBalance > 0;
  }, [status.creditBalance]);

  const isProTool = useCallback((toolId: string) => {
    return PRO_TOOLS.includes(toolId);
  }, []);

  const goToPricing = useCallback(() => {
    navigate("/pricing");
  }, [navigate]);

  useEffect(() => {
    checkCredits();
    checkSubscription();
  }, [checkCredits, checkSubscription]);

  return {
    ...status,
    subscription,
    subscriptionLoading,
    checkCredits,
    checkSubscription,
    deductCredit,
    startCheckout,
    verifyPurchase,
    openCustomerPortal,
    canUseTool,
    isProTool,
    goToPricing,
  };
}
