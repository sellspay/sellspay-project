import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { CommunityNav } from '@/components/community/CommunityNav';
import { UpdateCard } from '@/components/community/UpdateCard';
import { UpdateComposer } from '@/components/community/UpdateComposer';
import { Loader2, Megaphone, Pin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-1/4 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[128px] animate-pulse" />
        <div className="absolute bottom-40 right-1/4 w-[500px] h-[500px] bg-orange-500/8 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px]" />
      </div>

      <div className="container mx-auto px-4 py-12 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-6">
            <Badge 
              variant="outline" 
              className="px-4 py-2 text-sm bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-400"
            >
              <Megaphone className="h-4 w-4 mr-2" />
              Official Updates
            </Badge>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent">
            Platform Updates
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Stay informed about the latest changes, features, and announcements from EditorsParadise.
          </p>
        </div>

        {/* Navigation */}
        <div className="flex justify-center mb-8">
          <CommunityNav />
        </div>

        {/* Owner Composer */}
        {isOwner && (
          <div className="max-w-3xl mx-auto mb-10">
            <UpdateComposer />
          </div>
        )}

        {/* Updates Feed */}
        <div className="max-w-3xl mx-auto space-y-6">
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
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
            <div className="text-center py-20">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                <Megaphone className="h-10 w-10 text-amber-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No Updates Yet</h3>
              <p className="text-muted-foreground">
                Check back soon for platform announcements and updates.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
