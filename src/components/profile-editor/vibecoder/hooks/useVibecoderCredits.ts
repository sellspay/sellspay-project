 import { useState, useCallback } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 import { useCredits } from '@/hooks/useCredits';
 import { CREDIT_COSTS } from '../types';
 
 type ActionType = keyof typeof CREDIT_COSTS;
 
 interface CreditCheck {
   canAfford: boolean;
   cost: number;
   balance: number;
 }
 
 export function useVibecoderCredits(profileId: string) {
   const { creditBalance, isLoading: creditsLoading, checkCredits: refreshCredits } = useCredits();
   const [deducting, setDeducting] = useState(false);
 
   const checkCreditCost = useCallback((actionType: ActionType, count: number = 1): CreditCheck => {
     const cost = CREDIT_COSTS[actionType] * count;
     return {
       canAfford: creditBalance >= cost,
       cost,
       balance: creditBalance,
     };
   }, [creditBalance]);
 
   const deductCredits = useCallback(async (actionType: ActionType, count: number = 1): Promise<boolean> => {
     const { canAfford, cost } = checkCreditCost(actionType, count);
     
     if (!canAfford) {
       return false;
     }
 
     if (cost === 0) {
       // Free action, no deduction needed
       return true;
     }
 
     setDeducting(true);
     try {
       // Log usage
       const { error: usageError } = await supabase
         .from('storefront_ai_usage')
         .insert({
           profile_id: profileId,
           action_type: actionType,
           credits_used: cost,
         });
 
       if (usageError) {
         console.error('Error logging AI usage:', usageError);
       }
 
       // Deduct credits using edge function
       const { error } = await supabase.functions.invoke('deduct-credit', {
         body: { amount: cost, description: `AI Builder: ${actionType}` },
       });
 
       if (error) throw error;
 
       await refreshCredits(true);
       return true;
     } catch (err) {
       console.error('Error deducting credits:', err);
       return false;
     } finally {
       setDeducting(false);
     }
   }, [profileId, checkCreditCost, refreshCredits]);
 
   const getUsageStats = useCallback(async () => {
     try {
       const { data, error } = await supabase
         .from('storefront_ai_usage')
         .select('action_type, credits_used')
         .eq('profile_id', profileId)
         .gte('created_at', new Date(new Date().setDate(1)).toISOString());
 
       if (error) throw error;
 
       const stats = (data || []).reduce((acc, row) => {
         acc.total += row.credits_used;
         acc.byType[row.action_type] = (acc.byType[row.action_type] || 0) + row.credits_used;
         return acc;
       }, { total: 0, byType: {} as Record<string, number> });
 
       return stats;
     } catch (err) {
       console.error('Error getting usage stats:', err);
       return { total: 0, byType: {} };
     }
   }, [profileId]);
 
   return {
     credits: creditBalance,
     loading: creditsLoading,
     deducting,
     checkCredits: checkCreditCost,
     deductCredits,
     getUsageStats,
     CREDIT_COSTS,
   };
 }