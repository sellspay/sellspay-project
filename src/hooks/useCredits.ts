import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";

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

// Query keys for cache management
const CREDIT_QUERY_KEY = "user-credits";
const SUBSCRIPTION_QUERY_KEY = "user-credit-subscription";

export function useCredits() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Credit balance query - globally cached
  const {
    data: creditBalance = 0,
    isLoading,
    error: creditError,
    refetch: refetchCredits,
  } = useQuery({
    queryKey: [CREDIT_QUERY_KEY, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("check-credits");
      if (error) throw error;
      return data?.credit_balance ?? 0;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache
    refetchOnMount: false, // Don't refetch if cache exists
    refetchOnWindowFocus: false, // Don't refetch on tab focus
  });

  // Subscription status query - globally cached
  const {
    data: subscription = null,
    isLoading: subscriptionLoading,
    refetch: refetchSubscription,
  } = useQuery({
    queryKey: [SUBSCRIPTION_QUERY_KEY, user?.id],
    queryFn: async (): Promise<CreditSubscription | null> => {
      const { data, error } = await supabase.functions.invoke("manage-credit-subscription", {
        body: { action: "check" },
      });
      if (error) throw error;
      if (data?.hasSubscription && data?.subscription) {
        return data.subscription;
      }
      return null;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const checkCredits = useCallback(async () => {
    await refetchCredits();
  }, [refetchCredits]);

  const checkSubscription = useCallback(async () => {
    await refetchSubscription();
  }, [refetchSubscription]);

  const invalidateCredits = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [CREDIT_QUERY_KEY] });
  }, [queryClient]);

  const invalidateSubscription = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [SUBSCRIPTION_QUERY_KEY] });
  }, [queryClient]);

  const deductCredit = useCallback(async (toolId: string) => {
    if (!user) return { success: false, error: "Not authenticated" };

    try {
      const { data, error } = await supabase.functions.invoke("deduct-credit", {
        body: { tool_id: toolId },
      });
      
      if (error) throw error;
      
      if (data.success) {
        // Update cache immediately with new balance
        queryClient.setQueryData([CREDIT_QUERY_KEY, user.id], data.credit_balance);
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
  }, [user, queryClient]);

  const startCheckout = useCallback(async (packageId: string, priceId?: string): Promise<{ url?: string; upgraded?: boolean; message?: string; creditsAdded?: number; error?: string } | null> => {
    if (!user) {
      navigate("/login");
      return null;
    }

    try {
      const { data, error } = await supabase.functions.invoke("create-credit-checkout", {
        body: { package_id: packageId, price_id: priceId },
      });
      
      if (error) throw error;
      
      // Handle upgrade response (no redirect needed)
      if (data.upgraded) {
        // Invalidate caches to refresh data
        invalidateCredits();
        invalidateSubscription();
        return { 
          upgraded: true, 
          message: data.message,
          creditsAdded: data.creditsAdded 
        };
      }
      
      // Handle new subscription checkout (redirect to Stripe)
      if (data.url) {
        window.open(data.url, "_blank");
        return { url: data.url };
      }
      
      return null;
    } catch (err) {
      console.error("Error starting checkout:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to process request";
      return { error: errorMessage };
    }
  }, [user, navigate, invalidateCredits, invalidateSubscription]);

  const verifyPurchase = useCallback(async (sessionId: string) => {
    if (!user) return { success: false };

    try {
      const { data, error } = await supabase.functions.invoke("add-credits", {
        body: { session_id: sessionId },
      });
      
      if (error) throw error;
      
      if (data.success) {
        // Update cache with new balance
        queryClient.setQueryData([CREDIT_QUERY_KEY, user.id], data.credit_balance);
        // Invalidate subscription to refresh
        invalidateSubscription();
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
  }, [user, queryClient, invalidateSubscription]);

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
    return creditBalance > 0;
  }, [creditBalance]);

  const isProTool = useCallback((toolId: string) => {
    return PRO_TOOLS.includes(toolId);
  }, []);

  const goToPricing = useCallback(() => {
    navigate("/pricing");
  }, [navigate]);

  return {
    creditBalance,
    isLoading,
    error: creditError instanceof Error ? creditError.message : null,
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
