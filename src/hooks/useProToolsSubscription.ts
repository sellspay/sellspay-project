import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

interface ProToolsStatus {
  subscribed: boolean;
  usageCount: number;
  usageLimit: number;
  subscriptionEnd: string | null;
  isLoading: boolean;
  error: string | null;
}

// AI-powered tools that require subscription
export const PRO_TOOLS = [
  "sfx-generator",
  "voice-isolator",
  "sfx-isolator",
  "music-splitter",
  "nano-banana",
];

export function useProToolsSubscription() {
  const { user } = useAuth();
  const [status, setStatus] = useState<ProToolsStatus>({
    subscribed: false,
    usageCount: 0,
    usageLimit: 50,
    subscriptionEnd: null,
    isLoading: true,
    error: null,
  });

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setStatus({
        subscribed: false,
        usageCount: 0,
        usageLimit: 50,
        subscriptionEnd: null,
        isLoading: false,
        error: null,
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("check-pro-tools-subscription");
      
      if (error) throw error;
      
      setStatus({
        subscribed: data.subscribed,
        usageCount: data.usage_count,
        usageLimit: data.usage_limit,
        subscriptionEnd: data.subscription_end,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      console.error("Error checking subscription:", err);
      setStatus((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : "Failed to check subscription",
      }));
    }
  }, [user]);

  const recordUsage = useCallback(async (toolId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase.from("tool_usage").insert({
        user_id: user.id,
        tool_id: toolId,
      });

      if (error) throw error;

      // Refresh usage count
      await checkSubscription();
      return true;
    } catch (err) {
      console.error("Error recording usage:", err);
      return false;
    }
  }, [user, checkSubscription]);

  const startCheckout = useCallback(async () => {
    if (!user) return null;

    try {
      const { data, error } = await supabase.functions.invoke("create-pro-tools-checkout");
      
      if (error) throw error;
      
      if (data.url) {
        window.open(data.url, "_blank");
      }
      
      return data.url;
    } catch (err) {
      console.error("Error starting checkout:", err);
      return null;
    }
  }, [user]);

  const canUseTool = useCallback((toolId: string) => {
    // Free tools - always available to authenticated users
    if (!PRO_TOOLS.includes(toolId)) return true;
    
    // Pro tools require subscription
    if (!status.subscribed) return false;
    
    // Check usage limit
    if (status.usageCount >= status.usageLimit) return false;
    
    return true;
  }, [status]);

  const isProTool = useCallback((toolId: string) => {
    return PRO_TOOLS.includes(toolId);
  }, []);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  return {
    ...status,
    checkSubscription,
    recordUsage,
    startCheckout,
    canUseTool,
    isProTool,
    remainingUses: Math.max(0, status.usageLimit - status.usageCount),
  };
}
