import { useState, useEffect, useCallback, useRef } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";

export type PlanTier = 'browser' | 'starter' | 'basic' | 'creator' | 'agency';
export type BadgeType = 'none' | 'grey' | 'gold';

export interface SubscriptionCapabilities {
  vibecoder: boolean;
  imageGen: boolean;
  videoGen: boolean;
}

export interface SubscriptionState {
  plan: PlanTier;
  credits: number;
  capabilities: SubscriptionCapabilities;
  sellerFee: number;
  badge: BadgeType;
  expiresAt: string | null;
  stripeSubscriptionId: string | null;
}

// Credit costs for different actions
// Must match LEGACY_CREDIT_COSTS in deduct-ai-credits edge function
export const CREDIT_COSTS = {
  vibecoder_gen: 3,
  vibecoder_flash: 0,
  image_gen: 10,
  video_gen: 50,
  sfx_gen: 5,
  voice_isolator: 5,
  sfx_isolator: 5,
  music_splitter: 5,
} as const;

// AI-powered tools that require credits
export const PRO_TOOLS = [
  "sfx-generator",
  "voice-isolator",
  "sfx-isolator",
  "music-splitter",
  "nano-banana",
];

// Global cache for subscription state
let subscriptionCache: { userId: string; state: SubscriptionState; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function isCacheValid(cache: typeof subscriptionCache, userId: string): boolean {
  if (!cache) return false;
  if (cache.userId !== userId) return false;
  return Date.now() - cache.timestamp < CACHE_DURATION;
}

export function clearSubscriptionCache() {
  subscriptionCache = null;
}

const DEFAULT_STATE: SubscriptionState = {
  plan: 'browser',
  credits: 0,
  capabilities: {
    vibecoder: false,
    imageGen: false,
    videoGen: false,
  },
  sellerFee: 10,
  badge: 'none',
  expiresAt: null,
  stripeSubscriptionId: null,
};

export function useSubscription() {
  const { user, isAdmin, isOwner } = useAuth();
  const navigate = useNavigate();
  const fetchedRef = useRef(false);

  // Admin/Owner gets full capabilities but uses real credit balance from DB
  const isPrivileged = isAdmin || isOwner;

  const [state, setState] = useState<SubscriptionState>(() => {
    if (user && isCacheValid(subscriptionCache, user.id)) {
      return subscriptionCache!.state;
    }
    return DEFAULT_STATE;
  });

  const [loading, setLoading] = useState<boolean>(() => {
    if (user && isCacheValid(subscriptionCache, user.id)) {
      return false;
    }
    return !!user;
  });

  const [error, setError] = useState<string | null>(null);

  // Broadcast subscription updates across the app
  const broadcastSubscription = useCallback((userId: string, newState: SubscriptionState) => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(
      new CustomEvent("subscription:changed", { detail: { userId, state: newState } })
    );
  }, []);

  const refreshSubscription = useCallback(async (forceRefresh = false) => {
    if (!user) {
      setState(DEFAULT_STATE);
      setLoading(false);
      return;
    }

    // Use cache if valid and not forcing refresh
    if (!forceRefresh && isCacheValid(subscriptionCache, user.id)) {
      setState(subscriptionCache!.state);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke("check-subscription");
      
      if (error) throw error;
      
      // Admin/Owner gets full capabilities but real credit balance
      const newState: SubscriptionState = {
        plan: isPrivileged ? 'agency' : (data?.plan || 'browser'),
        credits: data?.credits || 0,
        capabilities: isPrivileged 
          ? { vibecoder: true, imageGen: true, videoGen: true }
          : (data?.capabilities || DEFAULT_STATE.capabilities),
        sellerFee: isPrivileged ? 0 : (data?.sellerFee ?? 10),
        badge: isPrivileged ? 'gold' : (data?.badge || 'none'),
        expiresAt: data?.expiresAt || null,
        stripeSubscriptionId: data?.stripeSubscriptionId || null,
      };
      
      // Update global cache
      subscriptionCache = {
        userId: user.id,
        state: newState,
        timestamp: Date.now(),
      };
      
      setState(newState);
      broadcastSubscription(user.id, newState);
      setError(null);
    } catch (err) {
      console.error("Error checking subscription:", err);
      setError(err instanceof Error ? err.message : "Failed to check subscription");
    } finally {
      setLoading(false);
    }
  }, [user, broadcastSubscription]);

  const deductCredits = useCallback(async (action: keyof typeof CREDIT_COSTS): Promise<{ success: boolean; error?: string; newBalance?: number }> => {
    if (!user) return { success: false, error: "Not authenticated" };

    const cost = CREDIT_COSTS[action];
    if (state.credits < cost) {
      return { success: false, error: "Insufficient credits" };
    }

    try {
      const { data, error } = await supabase.functions.invoke("deduct-ai-credits", {
        body: { action, amount: cost },
      });
      
      if (error) throw error;
      
      if (data.success) {
        const newBalance = data.newBalance;
        const newState = { ...state, credits: newBalance };
        
        setState(newState);
        subscriptionCache = {
          userId: user.id,
          state: newState,
          timestamp: Date.now(),
        };
        broadcastSubscription(user.id, newState);
        
        return { success: true, newBalance };
      } else {
        return { success: false, error: data.error || "Failed to deduct credits" };
      }
    } catch (err) {
      console.error("Error deducting credits:", err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : "Failed to deduct credits" 
      };
    }
  }, [user, state, broadcastSubscription]);

  const canUseFeature = useCallback((feature: 'vibecoder' | 'imageGen' | 'videoGen' | string): boolean => {
    // Map tool IDs to features
    const toolToFeature: Record<string, keyof SubscriptionCapabilities> = {
      'sfx-generator': 'vibecoder',
      'voice-isolator': 'vibecoder',
      'sfx-isolator': 'vibecoder',
      'music-splitter': 'vibecoder',
      'nano-banana': 'vibecoder',
    };

    const mappedFeature = toolToFeature[feature] || feature;
    
    if (mappedFeature === 'vibecoder') return state.capabilities.vibecoder;
    if (mappedFeature === 'imageGen') return state.capabilities.imageGen;
    if (mappedFeature === 'videoGen') return state.capabilities.videoGen;
    
    return false;
  }, [state.capabilities]);

  const hasCredits = useCallback((amount: number = 1): boolean => {
    return state.credits >= amount;
  }, [state.credits]);

  const isProTool = useCallback((toolId: string): boolean => {
    return PRO_TOOLS.includes(toolId);
  }, []);

  const startCheckout = useCallback(async (planId: 'basic' | 'creator' | 'agency', yearly = false): Promise<{ url?: string; error?: string }> => {
    if (!user) {
      navigate("/login");
      return { error: "Not authenticated" };
    }

    try {
      const { data, error } = await supabase.functions.invoke("create-plan-checkout", {
        body: { planId, yearly },
      });
      
      if (error) throw error;
      
      if (data.url) {
        window.open(data.url, "_blank");
        return { url: data.url };
      }
      
      return { error: "Failed to create checkout session" };
    } catch (err) {
      console.error("Error starting checkout:", err);
      return { error: err instanceof Error ? err.message : "Failed to start checkout" };
    }
  }, [user, navigate]);

  const openCustomerPortal = useCallback(async (): Promise<string | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      
      if (error) throw error;
      
      if (data.url) {
        window.open(data.url, "_blank");
        return data.url;
      }
      
      return null;
    } catch (err) {
      console.error("Error opening customer portal:", err);
      return null;
    }
  }, [user]);

  const goToPricing = useCallback(() => {
    navigate("/pricing");
  }, [navigate]);

  // Single consolidated fetch effect
  useEffect(() => {
    if (!user) {
      setState(DEFAULT_STATE);
      setLoading(false);
      fetchedRef.current = false;
      return;
    }

    if (isCacheValid(subscriptionCache, user.id)) {
      setState(subscriptionCache!.state);
      setLoading(false);
    } else if (!fetchedRef.current) {
      fetchedRef.current = true;
      refreshSubscription(isPrivileged);
    }
  }, [user?.id, isPrivileged]);

  // Keep all hook instances in sync
  useEffect(() => {
    if (!user) return;
    
    const handler = (e: Event) => {
      const evt = e as CustomEvent<{ userId: string; state: SubscriptionState }>;
      if (!evt.detail || evt.detail.userId !== user.id) return;
      setState(evt.detail.state);
    };

    window.addEventListener("subscription:changed", handler);
    return () => window.removeEventListener("subscription:changed", handler);
  }, [user]);

  // Real-time wallet balance sync — updates credits immediately on DB change
  useEffect(() => {
    if (!user || isPrivileged) return;

    let channel: RealtimeChannel | null = null;

    const setup = () => {
      channel = supabase
        .channel(`wallet-sync-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'user_wallets',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            if (payload.new && 'balance' in payload.new) {
              const newBalance = payload.new.balance as number;
              setState(prev => {
                const updated = { ...prev, credits: newBalance };
                subscriptionCache = { userId: user.id, state: updated, timestamp: Date.now() };
                return updated;
              });
            }
          }
        )
        .subscribe();
    };

    setup();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [user?.id, isPrivileged]);

  return {
    // State
    plan: state.plan,
    credits: state.credits,
    capabilities: state.capabilities,
    sellerFee: state.sellerFee,
    badge: state.badge,
    expiresAt: state.expiresAt,
    loading,
    error,
    
    // Computed
    isPremium: state.plan !== 'browser',
    isAgency: state.plan === 'agency',
    
    // Actions
    refreshSubscription,
    deductCredits,
    canUseFeature,
    hasCredits,
    isProTool,
    startCheckout,
    openCustomerPortal,
    goToPricing,
    
    // Legacy compatibility
    creditBalance: state.credits,
    isLoading: loading,
  };
}
