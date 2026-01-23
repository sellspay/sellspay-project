import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";

interface CreditStatus {
  creditBalance: number;
  isLoading: boolean;
  error: string | null;
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

  const startCheckout = useCallback(async (packageId: string) => {
    if (!user) {
      navigate("/login");
      return null;
    }

    try {
      const { data, error } = await supabase.functions.invoke("create-credit-checkout", {
        body: { package_id: packageId },
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
  }, [checkCredits]);

  return {
    ...status,
    checkCredits,
    deductCredit,
    startCheckout,
    verifyPurchase,
    canUseTool,
    isProTool,
    goToPricing,
  };
}
