import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { CommunityNav } from '@/components/community/CommunityNav';
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

  // Fetch updates (no author fetching needed - displayed as bot)
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

  // Subscribe to realtime updates
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
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Hero Section - Match Community page structure */}
      <section className="relative min-h-[50vh] sm:min-h-[70vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Layered Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 via-background to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(35_100%_50%/0.2),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,hsl(25_100%_50%/0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,hsl(35_100%_50%/0.08),transparent_50%)]" />

        {/* Floating Orbs - Hidden on mobile */}
        <div className="hidden sm:block absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/15 rounded-full blur-[128px] animate-pulse" />
        <div className="hidden sm:block absolute bottom-1/4 right-1/4 w-80 h-80 bg-orange-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="hidden sm:block absolute top-1/2 right-1/3 w-64 h-64 bg-amber-500/8 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '2s' }} />

        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(hsl(35_100%_50%/0.02)_1px,transparent_1px),linear-gradient(90deg,hsl(35_100%_50%/0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

        <div className="relative z-10 mx-auto max-w-5xl text-center px-2">
          {/* Floating Badge */}
          <div className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-amber-500/10 border border-amber-500/20 backdrop-blur-sm mb-6 sm:mb-8">
            <Megaphone className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-400" />
            <span className="text-xs sm:text-sm font-medium text-amber-400">
              Official Updates
            </span>
          </div>

          {/* Icon - Floating Style */}
          <div className="mb-6 sm:mb-10 flex justify-center">
            <div className="relative group">
              <div className="absolute inset-0 blur-[40px] sm:blur-[60px] bg-amber-500/40 rounded-full scale-125 sm:scale-150 group-hover:scale-[1.75] transition-transform duration-700" />
              <div className="absolute inset-0 blur-2xl sm:blur-3xl bg-gradient-to-br from-amber-500 to-orange-500 opacity-30 rounded-full scale-110 sm:scale-125 group-hover:opacity-50 transition-all duration-500" />
              <div className="relative bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl shadow-amber-500/30 group-hover:shadow-amber-500/50 transition-all duration-500 group-hover:scale-105">
                <Megaphone className="h-10 w-10 sm:h-16 sm:w-16 text-white drop-shadow-lg" />
              </div>
            </div>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-7xl font-bold text-foreground mb-4 sm:mb-6 tracking-tight">
            Platform{' '}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent">
                Updates
              </span>
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-400/20 to-orange-400/20 blur-lg opacity-50" />
            </span>
          </h1>

          <p className="text-base sm:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto mb-8 sm:mb-12 leading-relaxed px-2">
            Stay informed about the latest changes, features, and announcements from
              <span className="text-foreground font-medium"> SellsPay.</span>
          </p>

        </div>

        {/* Scroll Indicator - Hidden on mobile */}
        <div className="hidden sm:block absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-muted-foreground/50 rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="relative py-8 sm:py-12 px-3 sm:px-6 lg:px-8">
        {/* Section Divider Gradient */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />

        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-amber-500/5 to-background" />
        <div className="hidden sm:block absolute left-0 top-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-[128px]" />
        <div className="hidden sm:block absolute right-0 top-1/3 w-80 h-80 bg-orange-500/10 rounded-full blur-[100px]" />

        <div className="relative max-w-3xl mx-auto space-y-6 sm:space-y-8">
          {/* Owner Composer */}
          {isOwner && (
            <div className="mb-8 sm:mb-10">
              <UpdateComposer />
            </div>
          )}

          {/* Updates Feed */}
          <div className="space-y-4 sm:space-y-6">
            {/* Pinned Updates */}
            {pinnedUpdates.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-amber-400 text-sm font-medium">
                  <Pin className="h-4 w-4" />
                  Pinned Updates
                </div>
                {pinnedUpdates.map((update) => (
                  <UpdateCard key={update.id} update={update} isOwner={isOwner} />
                ))}
              </div>
            )}

            {/* Regular Updates */}
            {isLoading ? (
              <div className="flex justify-center py-20">
                <div className="relative">
                  <div className="absolute inset-0 blur-xl bg-amber-500/30 rounded-full animate-pulse" />
                  <Loader2 className="relative h-10 w-10 animate-spin text-amber-400" />
                </div>
              </div>
            ) : regularUpdates.length > 0 ? (
              <div className="space-y-4">
                {pinnedUpdates.length > 0 && (
                  <div className="text-muted-foreground text-sm font-medium pt-4">
                    All Updates
                  </div>
                )}
                {regularUpdates.map((update) => (
                  <UpdateCard key={update.id} update={update} isOwner={isOwner} />
                ))}
              </div>
            ) : pinnedUpdates.length === 0 ? (
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative text-center py-20 px-8 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl border border-border/50 rounded-3xl">
                  <div className="inline-flex p-6 rounded-3xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 mb-6">
                    <Megaphone className="h-12 w-12 text-amber-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-3">No Updates Yet</h3>
                  <p className="text-muted-foreground text-lg">
                    Check back soon for platform announcements and updates.
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
