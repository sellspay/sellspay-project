import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, MessageSquare, Sparkles, Zap } from 'lucide-react';
import { ThreadCard } from '@/components/community/ThreadCard';
import { ThreadComposer } from '@/components/community/ThreadComposer';
import { CategoryFilter } from '@/components/community/CategoryFilter';
import { CommunityNav } from '@/components/community/CommunityNav';
import { ThreadReplyDialog } from '@/components/community/ThreadReplyDialog';
import { Reveal } from '@/components/home/Reveal';
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
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);

  // Fetch user profile
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase.from('profiles').select('id').eq('user_id', user.id).single();
      return data;
    },
    enabled: !!user?.id,
  });

  const {
    data: threads = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['threads', activeCategory],
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'threads' }, () => {
        refetch();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'thread_replies' }, () => {
        refetch();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  const handleReplyClick = (thread: Thread) => {
    setSelectedThread(thread);
    setReplyDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Hero Section - Immersive Premium Design */}
      <section className="relative min-h-[70vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Layered Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.3),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,hsl(var(--accent)/0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,hsl(var(--primary)/0.1),transparent_50%)]" />

        {/* Floating Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/15 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-primary/10 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '2s' }} />

        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--primary)/0.03)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--primary)/0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />

        <div className="relative z-10 mx-auto max-w-5xl text-center">
          <Reveal>
            {/* Floating Badge */}
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm mb-8 hover:bg-primary/15 hover:border-primary/30 transition-all duration-300 cursor-default">
              <div className="relative">
                <Sparkles className="h-4 w-4 text-primary" />
                <div className="absolute inset-0 animate-ping">
                  <Sparkles className="h-4 w-4 text-primary opacity-50" />
                </div>
              </div>
              <span className="text-sm font-medium bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Community Hub
              </span>
            </div>
          </Reveal>

          <Reveal delay={100}>
            {/* Icon - Floating Style */}
            <div className="mb-10 flex justify-center">
              <div className="relative group">
                {/* Glow layers */}
                <div className="absolute inset-0 blur-[60px] bg-primary/50 rounded-full scale-150 group-hover:scale-[1.75] transition-transform duration-700" />
                <div className="absolute inset-0 blur-3xl bg-gradient-to-br from-primary to-accent opacity-40 rounded-full scale-125 group-hover:opacity-60 transition-all duration-500" />

                {/* Main Icon Container */}
                <div className="relative bg-gradient-to-br from-primary to-primary/80 rounded-3xl p-8 shadow-2xl shadow-primary/30 group-hover:shadow-primary/50 transition-all duration-500 group-hover:scale-105">
                  <MessageSquare className="h-16 w-16 text-primary-foreground drop-shadow-lg" />
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={200}>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground mb-6 tracking-tight">
              Join the{' '}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-[gradient_3s_linear_infinite]">
                  Conversation
                </span>
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-accent/20 blur-lg opacity-50" />
              </span>
            </h1>
          </Reveal>

          <Reveal delay={300}>
            <p className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed">
              Ask questions, share your work, get feedback, and connect with 
              <span className="text-foreground font-medium"> thousands of creators.</span>
            </p>
          </Reveal>

          <Reveal delay={400}>
            {/* Navigation */}
            <div className="flex justify-center mb-8">
              <CommunityNav />
            </div>
          </Reveal>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-muted-foreground/50 rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* Main Content - Thread Feed */}
      <section className="relative py-12 px-4 sm:px-6 lg:px-8">
        {/* Section Divider Gradient */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-[128px]" />
        <div className="absolute right-0 top-1/3 w-80 h-80 bg-accent/10 rounded-full blur-[100px]" />

        <div className="relative mx-auto max-w-2xl space-y-8">
          {/* Section Header */}
          <Reveal>
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                <Zap className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Latest Threads</span>
              </div>
            </div>
          </Reveal>

          {/* Thread Composer */}
          <Reveal delay={100}>
            <ThreadComposer />
          </Reveal>

          {/* Category Filter */}
          <Reveal delay={200}>
            <div className="flex justify-center">
              <CategoryFilter activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
            </div>
          </Reveal>

          {/* Threads List */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="relative">
                <div className="absolute inset-0 blur-xl bg-primary/30 rounded-full animate-pulse" />
                <Loader2 className="relative h-10 w-10 animate-spin text-primary" />
              </div>
            </div>
          ) : threads.length === 0 ? (
            <Reveal delay={300}>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative text-center py-20 px-8 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl border border-border/50 rounded-3xl">
                  <div className="inline-flex p-6 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 mb-6">
                    <MessageSquare className="h-12 w-12 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-3">No threads yet</h3>
                  <p className="text-muted-foreground text-lg">Be the first to start a conversation!</p>
                </div>
              </div>
            </Reveal>
          ) : (
            <div className="space-y-4">
              {threads.map((thread, index) => (
                <Reveal key={thread.id} delay={Math.min(index * 50, 300)}>
                  <ThreadCard thread={thread} onReplyClick={handleReplyClick} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Reply Dialog */}
      <ThreadReplyDialog thread={selectedThread} open={replyDialogOpen} onOpenChange={setReplyDialogOpen} />
    </div>
  );
}
