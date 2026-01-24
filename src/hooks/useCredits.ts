import { useState, useEffect, useCallback, useRef } from "react";
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

// Global cache to persist across component mounts
let creditsCache: { userId: string; balance: number; timestamp: number } | null = null;
let subscriptionCache: { userId: string; subscription: CreditSubscription | null; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function isCacheValid(cache: { timestamp: number; userId: string } | null, userId: string): boolean {
  if (!cache) return false;
  if (cache.userId !== userId) return false;
  return Date.now() - cache.timestamp < CACHE_DURATION;
}

// Clear cache (used when user logs out)
export function clearCreditsCache() {
  creditsCache = null;
  subscriptionCache = null;
}

export function useCredits() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fetchedRef = useRef(false);
  
  const [creditBalance, setCreditBalance] = useState<number>(() => {
    // Initialize from cache if valid and same user
    if (user && isCacheValid(creditsCache, user.id)) {
      return creditsCache!.balance;
    }
    return 0;
  });
  
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    // Skip loading if we have valid cache
    if (user && isCacheValid(creditsCache, user.id)) {
      return false;
    }
    return !!user; // Only show loading if user exists
  });
  
  const [error, setError] = useState<string | null>(null);
  
  const [subscription, setSubscription] = useState<CreditSubscription | null>(() => {
    if (user && isCacheValid(subscriptionCache, user.id)) {
      return subscriptionCache!.subscription;
    }
    return null;
  });
  
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  const checkCredits = useCallback(async (forceRefresh = false) => {
    if (!user) {
      setCreditBalance(0);
      setIsLoading(false);
      setError(null);
      return;
    }

    // Use cache if valid and not forcing refresh
    if (!forceRefresh && isCacheValid(creditsCache, user.id)) {
      setCreditBalance(creditsCache!.balance);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase.functions.invoke("check-credits");
      
      if (error) throw error;
      
      const balance = data?.credit_balance ?? 0;
      
      // Update global cache
      creditsCache = {
        userId: user.id,
        balance,
        timestamp: Date.now(),
      };
      
      setCreditBalance(balance);
      setError(null);
    } catch (err) {
      console.error("Error checking credits:", err);
      setError(err instanceof Error ? err.message : "Failed to check credits");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const checkSubscription = useCallback(async (forceRefresh = false) => {
    if (!user) {
      setSubscription(null);
      return;
    }

    // Use cache if valid and not forcing refresh
    if (!forceRefresh && isCacheValid(subscriptionCache, user.id)) {
      setSubscription(subscriptionCache!.subscription);
      return;
    }

    setSubscriptionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-credit-subscription", {
        body: { action: "check" },
      });
      
      if (error) throw error;
      
      const sub = data?.hasSubscription && data?.subscription ? data.subscription : null;
      
      // Update global cache
      subscriptionCache = {
        userId: user.id,
        subscription: sub,
        timestamp: Date.now(),
      };
      
      setSubscription(sub);
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
        // Update local state and cache
        setCreditBalance(data.credit_balance);
        creditsCache = {
          userId: user.id,
          balance: data.credit_balance,
          timestamp: Date.now(),
        };
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
        // Force refresh caches
        await checkCredits(true);
        await checkSubscription(true);
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
  }, [user, navigate, checkCredits, checkSubscription]);

  const verifyPurchase = useCallback(async (sessionId: string) => {
    if (!user) return { success: false };

    try {
      const { data, error } = await supabase.functions.invoke("add-credits", {
        body: { session_id: sessionId },
      });
      
      if (error) throw error;
      
      if (data.success) {
        // Update local state and cache
        setCreditBalance(data.credit_balance);
        creditsCache = {
          userId: user.id,
          balance: data.credit_balance,
          timestamp: Date.now(),
        };
        // Force refresh subscription
        await checkSubscription(true);
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
    return creditBalance > 0;
  }, [creditBalance]);

  const isProTool = useCallback((toolId: string) => {
    return PRO_TOOLS.includes(toolId);
  }, []);

  const goToPricing = useCallback(() => {
    navigate("/pricing");
  }, [navigate]);

  // Initial fetch - only once per user session
  useEffect(() => {
    if (!user) {
      setCreditBalance(0);
      setIsLoading(false);
      setSubscription(null);
      fetchedRef.current = false;
      return;
    }

    // Check if we already have valid cache for this user
    const hasValidCreditsCache = isCacheValid(creditsCache, user.id);
    const hasValidSubCache = isCacheValid(subscriptionCache, user.id);

    if (hasValidCreditsCache) {
      setCreditBalance(creditsCache!.balance);
      setIsLoading(false);
    }
    
    if (hasValidSubCache) {
      setSubscription(subscriptionCache!.subscription);
    }

    // Only fetch if cache is invalid
    if (!hasValidCreditsCache || !hasValidSubCache) {
      if (!hasValidCreditsCache) {
        checkCredits();
      }
      if (!hasValidSubCache) {
        checkSubscription();
      }
    }
  }, [user?.id]); // Only depend on user ID

  return {
    creditBalance,
    isLoading,
    error,
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
