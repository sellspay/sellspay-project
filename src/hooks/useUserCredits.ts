import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

export interface CreditBreakdown {
  rollover: number;
  monthly: number;
  bonus: number;
}

interface UseUserCreditsReturn {
  credits: number;
  creditBreakdown: CreditBreakdown;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  deductCredits: (amount: number, action: string) => Promise<boolean>;
}

export function useUserCredits(): UseUserCreditsReturn {
  const { isAdmin, isOwner } = useAuth();
  const isPrivileged = isAdmin || isOwner;

  const [credits, setCredits] = useState(0);
  const [creditBreakdown, setCreditBreakdown] = useState<CreditBreakdown>({ rollover: 0, monthly: 0, bonus: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCredits = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) {
          setCredits(0);
          setCreditBreakdown({ rollover: 0, monthly: 0, bonus: 0 });
          return;
      }

      const { data: wallet, error: walletError } = await supabase
        .from('user_wallets')
        .select('balance, rollover_credits, monthly_credits, bonus_credits')
        .eq('user_id', session.session.user.id)
        .single();

      if (walletError) {
        // User might not have a wallet yet - that's okay
        if (walletError.code === 'PGRST116') {
          setCredits(0);
          return;
        }
        throw walletError;
      }

      setCredits(wallet?.balance ?? 0);
      setCreditBreakdown({
        rollover: (wallet as any)?.rollover_credits ?? 0,
        monthly: (wallet as any)?.monthly_credits ?? 0,
        bonus: (wallet as any)?.bonus_credits ?? 0,
      });
    } catch (err) {
      console.error('Error fetching credits:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch credits');
      setCredits(0);
      setCreditBreakdown({ rollover: 0, monthly: 0, bonus: 0 });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deductCredits = useCallback(async (amount: number, action: string): Promise<boolean> => {

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('deduct-ai-credits', {
        body: { action, amount }
      });

      if (error) throw error;

      if (!data.success) {
        if (data.error === 'INSUFFICIENT_CREDITS') {
          setError('Insufficient credits');
          return false;
        }
        throw new Error(data.error);
      }

      // Update local state with new balance
      setCredits(data.newBalance);
      return true;
    } catch (err) {
      console.error('Error deducting credits:', err);
      setError(err instanceof Error ? err.message : 'Failed to deduct credits');
      return false;
    }
  }, []);

  useEffect(() => {
    fetchCredits();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchCredits();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchCredits]);

  // Subscribe to wallet changes in real-time
  useEffect(() => {

    const setupRealtimeSubscription = async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) return;

      const channel = supabase
        .channel('user-wallet-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'user_wallets',
            filter: `user_id=eq.${session.session.user.id}`,
          },
          (payload) => {
            if (payload.new && 'balance' in payload.new) {
              setCredits(payload.new.balance as number);
              setCreditBreakdown({
                rollover: (payload.new as any).rollover_credits ?? 0,
                monthly: (payload.new as any).monthly_credits ?? 0,
                bonus: (payload.new as any).bonus_credits ?? 0,
              });
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    setupRealtimeSubscription();
  }, []);

  return {
    credits,
    creditBreakdown,
    isLoading,
    error,
    refetch: fetchCredits,
    deductCredits,
  };
}
