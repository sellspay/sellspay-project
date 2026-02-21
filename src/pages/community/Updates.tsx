import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { UpdateCard } from '@/components/community/UpdateCard';
import { UpdateComposer } from '@/components/community/UpdateComposer';
import { Loader2, Megaphone, Pin } from 'lucide-react';

interface PlatformUpdate {
  id: string;
  author_id: string;
  title: string;
  content: string;
  category: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export default function Updates() {
  const { user, isOwner } = useAuth();
  const queryClient = useQueryClient();

  const { data: updates, isLoading } = useQuery({
    queryKey: ['platform-updates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_updates')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as PlatformUpdate[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel('platform-updates-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'platform_updates' }, () => {
        queryClient.invalidateQueries({ queryKey: ['platform-updates'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const pinnedUpdates = updates?.filter((u) => u.is_pinned) || [];
  const regularUpdates = updates?.filter((u) => !u.is_pinned) || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] to-transparent pointer-events-none" />
        <div className="relative mx-auto max-w-[720px] px-6 pt-20 sm:pt-28 pb-14 sm:pb-20 text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-muted-foreground mb-5">
            Official
          </p>
          <h1 className="text-4xl sm:text-5xl font-semibold text-foreground tracking-tight leading-[1.1]">
            Platform Updates
          </h1>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Stay informed about the latest changes and announcements from
            <span className="text-foreground font-medium"> SellsPay</span>.
          </p>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />
      </section>

      {/* Content */}
      <section className="py-8 sm:py-12 px-6">
        <div className="max-w-[720px] mx-auto space-y-8">
          {isOwner && <UpdateComposer />}

          {/* Pinned */}
          {pinnedUpdates.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
                <Pin className="h-3.5 w-3.5" />
                Pinned
              </div>
              {pinnedUpdates.map((update) => (
                <UpdateCard key={update.id} update={update} isOwner={isOwner} />
              ))}
            </div>
          )}

          {/* All */}
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : regularUpdates.length > 0 ? (
            <div className="space-y-4">
              {pinnedUpdates.length > 0 && (
                <p className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground pt-4">
                  All Updates
                </p>
              )}
              {regularUpdates.map((update) => (
                <UpdateCard key={update.id} update={update} isOwner={isOwner} />
              ))}
            </div>
          ) : pinnedUpdates.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full border border-border/50 mb-5">
                <Megaphone className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-base font-medium text-foreground mb-1">No Updates Yet</h3>
              <p className="text-sm text-muted-foreground">Check back soon for announcements.</p>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
