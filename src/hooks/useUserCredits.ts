import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

interface UseUserCreditsReturn {
  credits: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  deductCredits: (amount: number, action: string) => Promise<boolean>;
}

const PRIVILEGED_CREDITS = 999_999;

export function useUserCredits(): UseUserCreditsReturn {
  const { isAdmin, isOwner } = useAuth();
  const isPrivileged = isAdmin || isOwner;

  const [credits, setCredits] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCredits = useCallback(async () => {
    // Owner/Admin bypass: treat as unlimited and skip all wallet reads.
    if (isPrivileged) {
      setCredits(PRIVILEGED_CREDITS);
      setError(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) {
        setCredits(0);
        return;
      }

      const { data: wallet, error: walletError } = await supabase
        .from('user_wallets')
        .select('balance')
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
    } catch (err) {
      console.error('Error fetching credits:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch credits');
      setCredits(0);
    } finally {
      setIsLoading(false);
    }
  }, [isPrivileged]);

  const deductCredits = useCallback(async (amount: number, action: string): Promise<boolean> => {
    // Owner/Admin bypass: never deduct.
    if (isPrivileged) return true;

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
  }, [isPrivileged]);

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
    // Owner/Admin bypass: nothing to subscribe to.
    if (isPrivileged) return;

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
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    setupRealtimeSubscription();
  }, [isPrivileged]);

  return {
    credits,
    isLoading,
    error,
    refetch: fetchCredits,
    deductCredits,
  };
}
