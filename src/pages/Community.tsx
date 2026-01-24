import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, MessageSquare, Sparkles } from 'lucide-react';
import { ThreadCard } from '@/components/community/ThreadCard';
import { ThreadComposer } from '@/components/community/ThreadComposer';
import { CategoryFilter } from '@/components/community/CategoryFilter';
import { CommunityNav } from '@/components/community/CommunityNav';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

interface ThreadAuthor {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  verified: boolean | null;
}

interface Thread {
  id: string;
  author_id: string;
  content: string;
  gif_url: string | null;
  image_url: string | null;
  category: string;
  is_pinned: boolean;
  created_at: string;
  author?: ThreadAuthor;
  likes_count: number;
  replies_count: number;
  is_liked: boolean;
}

export default function Community() {
  const { profile } = useAuth();
  const [activeCategory, setActiveCategory] = useState('all');

  const { data: threads = [], isLoading, refetch } = useQuery({
    queryKey: ['threads', activeCategory, profile?.id],
    queryFn: async () => {
      let query = supabase
        .from('threads')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50);

      if (activeCategory !== 'all') {
        query = query.eq('category', activeCategory);
      }

      const { data: threadsData, error } = await query;
      if (error) throw error;

      if (!threadsData || threadsData.length === 0) return [];

      // Fetch authors
      const authorIds = [...new Set(threadsData.map((t) => t.author_id))];
      const { data: authorsData } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, verified')
        .in('id', authorIds);

      const authorsMap = new Map(authorsData?.map((a) => [a.id, a]) || []);

      // Fetch likes counts
      const threadIds = threadsData.map((t) => t.id);
      const { data: likesData } = await supabase
        .from('thread_likes')
        .select('thread_id')
        .in('thread_id', threadIds);

      const likesCountMap = new Map<string, number>();
      likesData?.forEach((like) => {
        likesCountMap.set(like.thread_id, (likesCountMap.get(like.thread_id) || 0) + 1);
      });

      // Fetch replies counts
      const { data: repliesData } = await supabase
        .from('thread_replies')
        .select('thread_id')
        .in('thread_id', threadIds);

      const repliesCountMap = new Map<string, number>();
      repliesData?.forEach((reply) => {
        repliesCountMap.set(reply.thread_id, (repliesCountMap.get(reply.thread_id) || 0) + 1);
      });

      // Check if current user liked threads
      let userLikesSet = new Set<string>();
      if (profile?.id) {
        const { data: userLikes } = await supabase
          .from('thread_likes')
          .select('thread_id')
          .eq('user_id', profile.id)
          .in('thread_id', threadIds);
        userLikesSet = new Set(userLikes?.map((l) => l.thread_id) || []);
      }

      return threadsData.map((thread) => ({
        ...thread,
        author: authorsMap.get(thread.author_id),
        likes_count: likesCountMap.get(thread.id) || 0,
        replies_count: repliesCountMap.get(thread.id) || 0,
        is_liked: userLikesSet.has(thread.id),
      })) as Thread[];
    },
  });

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('threads-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'threads' },
        () => {
          refetch();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'thread_likes' },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        
        <div className="relative mx-auto max-w-4xl text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Community Hub</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
            Join the Conversation
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Ask questions, share your work, get feedback, and connect with thousands of creators.
          </p>
        </div>

        {/* Navigation */}
        <div className="relative mx-auto max-w-4xl flex justify-center">
          <CommunityNav />
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Thread Composer */}
          <ThreadComposer />

          {/* Category Filter */}
          <div className="flex justify-center">
            <CategoryFilter
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
            />
          </div>

          {/* Threads List */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : threads.length === 0 ? (
            <div className="text-center py-16">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No threads yet</h3>
              <p className="text-muted-foreground">
                Be the first to start a conversation!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {threads.map((thread) => (
                <ThreadCard key={thread.id} thread={thread} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
