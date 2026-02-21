import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'platform_updates' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['platform-updates'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const pinnedUpdates = updates?.filter((u) => u.is_pinned) || [];
  const regularUpdates = updates?.filter((u) => !u.is_pinned) || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Compact Header */}
      <section className="border-b border-border/40 bg-background">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 pt-12 sm:pt-16 pb-8 sm:pb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-amber-500/10">
              <Megaphone className="h-5 w-5 text-amber-400" />
            </div>
            <span className="text-sm font-medium text-amber-400 tracking-wide uppercase">Official</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-2">
            Platform Updates
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg">
            Stay informed about the latest changes and announcements from
            <span className="text-foreground font-medium"> SellsPay.</span>
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-6 sm:py-8 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {isOwner && <UpdateComposer />}

          {/* Pinned Updates */}
          {pinnedUpdates.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-amber-400 text-sm font-medium">
                <Pin className="h-4 w-4" />
                Pinned
              </div>
              {pinnedUpdates.map((update) => (
                <UpdateCard key={update.id} update={update} isOwner={isOwner} />
              ))}
            </div>
          )}

          {/* Regular Updates */}
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : regularUpdates.length > 0 ? (
            <div className="space-y-3">
              {pinnedUpdates.length > 0 && (
                <div className="text-muted-foreground text-sm font-medium pt-2">
                  All Updates
                </div>
              )}
              {regularUpdates.map((update) => (
                <UpdateCard key={update.id} update={update} isOwner={isOwner} />
              ))}
            </div>
          ) : pinnedUpdates.length === 0 ? (
            <div className="text-center py-16 px-6 border border-border/40 rounded-2xl bg-muted/10">
              <div className="inline-flex p-4 rounded-2xl bg-muted/30 mb-4">
                <Megaphone className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">No Updates Yet</h3>
              <p className="text-muted-foreground text-sm">
                Check back soon for platform announcements.
              </p>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
