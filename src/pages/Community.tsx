import { useState, useEffect, useCallback, useRef } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Loader2, MessageSquare, SearchX, Plus, Search, Hash, HelpCircle, Star, Megaphone, MessageCircleQuestion, Lightbulb, LayoutList } from 'lucide-react';
import { ThreadCard } from '@/components/community/ThreadCard';
import { NewThreadDialog } from '@/components/community/NewThreadDialog';
import { ThreadSearchPanel } from '@/components/community/ThreadSearchPanel';
import { ThreadReplyDialog } from '@/components/community/ThreadReplyDialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const THREADS_PER_PAGE = 20;

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

const SIDEBAR_CATEGORIES = [
  { key: 'all', label: 'All categories', icon: LayoutList },
  { key: 'discussion', label: 'Discussions', icon: MessageSquare },
  { key: 'help', label: 'Questions', icon: HelpCircle },
  { key: 'showcase', label: 'Showcase', icon: Star },
  { key: 'feedback', label: 'Feedback', icon: Lightbulb },
  { key: 'promotion', label: 'Promotions', icon: Megaphone },
];

const SORT_TABS = ['Latest', 'Top', 'Unanswered'] as const;

export default function Community() {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [newThreadOpen, setNewThreadOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSort, setActiveSort] = useState<typeof SORT_TABS[number]>('Latest');
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase.from('profiles').select('id').eq('user_id', user.id).single();
      return data;
    },
    enabled: !!user?.id,
  });

  const fetchThreadsPage = useCallback(async ({ pageParam = 0 }: { pageParam?: number }) => {
    const start = pageParam * THREADS_PER_PAGE;
    const end = start + THREADS_PER_PAGE - 1;

    let query = supabase
      .from('threads')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .range(start, end);

    if (activeCategory === 'all') {
      query = query.neq('category', 'promotion');
    } else {
      query = query.eq('category', activeCategory);
    }
    if (searchQuery) {
      query = query.neq('category', 'promotion').ilike('content', `%${searchQuery}%`);
    }

    const { data: threadsData, error } = await query;
    if (error) throw error;
    if (!threadsData || threadsData.length === 0) return { threads: [], nextPage: undefined };

    const authorIds = [...new Set(threadsData.map((t) => t.author_id))];
    const { data: authorsData } = await supabase
      .from('public_profiles')
      .select('id, username, full_name, avatar_url, verified')
      .in('id', authorIds);

    const authorsMap = new Map(authorsData?.map((a) => [a.id, a]) || []);

    const threadIds = threadsData.map((t) => t.id);
    const { data: likesData } = await supabase.from('thread_likes').select('thread_id').in('thread_id', threadIds);
    const { data: repliesData } = await supabase.from('thread_replies').select('thread_id').in('thread_id', threadIds);

    const likesCountMap = new Map<string, number>();
    likesData?.forEach((like) => {
      likesCountMap.set(like.thread_id, (likesCountMap.get(like.thread_id) || 0) + 1);
    });

    const repliesCountMap = new Map<string, number>();
    repliesData?.forEach((reply) => {
      repliesCountMap.set(reply.thread_id, (repliesCountMap.get(reply.thread_id) || 0) + 1);
    });

    let userLikesSet = new Set<string>();
    if (profile?.id) {
      const { data: userLikes } = await supabase
        .from('thread_likes')
        .select('thread_id')
        .eq('user_id', profile.id)
        .in('thread_id', threadIds);
      userLikesSet = new Set(userLikes?.map((l) => l.thread_id) || []);
    }

    const threads = threadsData.map((thread) => ({
      ...thread,
      author: authorsMap.get(thread.author_id),
      likes_count: likesCountMap.get(thread.id) || 0,
      replies_count: repliesCountMap.get(thread.id) || 0,
      is_liked: userLikesSet.has(thread.id),
    })) as Thread[];

    return {
      threads,
      nextPage: threadsData.length === THREADS_PER_PAGE ? pageParam + 1 : undefined,
    };
  }, [activeCategory, searchQuery, profile?.id]);

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['threads-infinite', activeCategory, searchQuery, profile?.id],
    queryFn: fetchThreadsPage,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
  });

  const threads = data?.pages.flatMap((p) => p.threads) ?? [];

  // Intersection observer for infinite scroll
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
      },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('threads-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'threads' }, () => refetch())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'thread_replies' }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [refetch]);

  const handleReplyClick = (thread: Thread) => {
    setSelectedThread(thread);
    setReplyDialogOpen(true);
  };

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleCategoryChange = useCallback((category: string) => {
    setActiveCategory(category);
    setSearchQuery('');
    setSearchOpen(false);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto flex">
        {/* ───── Left Sidebar ───── */}
        <aside className="hidden lg:block w-[260px] shrink-0 border-r border-border/30 min-h-[calc(100vh-4rem)] sticky top-16 self-start">
          <div className="p-5">
            {/* New Thread Button */}
            <Button
              onClick={() => setNewThreadOpen(true)}
              className="w-full mb-6 h-10 font-bold gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              New Thread
            </Button>

            {/* Categories */}
            <div className="mb-6">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60 mb-3 px-2">
                Categories
              </h3>
              <nav className="space-y-0.5">
                {SIDEBAR_CATEGORIES.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => handleCategoryChange(key)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      activeCategory === key
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search threads..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-muted/30 border border-border/30 rounded-lg text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-primary/40 transition-colors"
              />
            </div>
          </div>
        </aside>

        {/* ───── Main Content ───── */}
        <main className="flex-1 min-w-0">
          {/* Tab bar */}
          <div className="sticky top-16 z-30 bg-background/80 backdrop-blur-xl border-b border-border/30">
            <div className="flex items-center justify-between px-6 h-12">
              <div className="flex items-center gap-1">
                {SORT_TABS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveSort(tab)}
                    className={cn(
                      "px-3.5 py-1.5 text-sm font-medium rounded-md transition-colors",
                      activeSort === tab
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Mobile category + search */}
              <div className="flex items-center gap-2 lg:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={() => setSearchOpen(!searchOpen)}
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile search panel */}
          {searchOpen && (
            <div className="px-6 py-3 lg:hidden">
              <ThreadSearchPanel open={searchOpen} onOpenChange={setSearchOpen} onSearchChange={handleSearchChange} activeCategory={activeCategory} onCategoryChange={handleCategoryChange} />
            </div>
          )}

          {/* Table Header */}
          <div className="hidden sm:grid grid-cols-[1fr_80px_80px] items-center px-6 py-2.5 border-b border-border/20 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50">
            <span>Topic</span>
            <span className="text-center">Replies</span>
            <span className="text-center">Activity</span>
          </div>

          {/* Thread List */}
          <div className="divide-y divide-border/20">
            {isLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : threads.length === 0 ? (
              <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full border border-border/50 mb-5">
                  {searchQuery ? <SearchX className="h-6 w-6 text-muted-foreground" /> : <MessageSquare className="h-6 w-6 text-muted-foreground" />}
                </div>
                <h3 className="text-base font-medium text-foreground mb-1">
                  {searchQuery ? 'No matches found' : 'No threads yet'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? 'Try adjusting your search or browse all threads' : 'Be the first to start a conversation.'}
                </p>
              </div>
            ) : (
              threads.map((thread) => (
                <ThreadCard key={thread.id} thread={thread} onReplyClick={handleReplyClick} />
              ))
            )}
          </div>

          {/* Infinite scroll sentinel */}
          <div ref={loadMoreRef} className="py-6 flex justify-center">
            {isFetchingNextPage && (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            )}
          </div>
        </main>
      </div>

      {/* Floating + button (mobile) */}
      <button
        onClick={() => setNewThreadOpen(true)}
        className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30 hover:shadow-primary/50 hover:scale-105 transition-all duration-200 flex items-center justify-center lg:hidden"
      >
        <Plus className="h-7 w-7" />
      </button>

      <NewThreadDialog open={newThreadOpen} onOpenChange={setNewThreadOpen} />
      <ThreadReplyDialog thread={selectedThread} open={replyDialogOpen} onOpenChange={setReplyDialogOpen} />
    </div>
  );
}
