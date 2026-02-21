import { useState, useEffect, useCallback, useRef } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Loader2, MessageSquare, SearchX, Plus, Search, ChevronDown, Check } from 'lucide-react';
import { ThreadCard } from '@/components/community/ThreadCard';
import { NewThreadDialog } from '@/components/community/NewThreadDialog';
import { ThreadSearchPanel } from '@/components/community/ThreadSearchPanel';
import { ThreadReplyDialog } from '@/components/community/ThreadReplyDialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

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

export default function Community() {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [newThreadOpen, setNewThreadOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFeed, setActiveFeed] = useState<'for_you' | 'following'>('for_you');
  const [feedOpen, setFeedOpen] = useState(false);
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
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
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
      {/* Feed selector top bar */}
      <div className="sticky top-16 z-30 bg-background/80 backdrop-blur-xl border-b border-border/30">
        <div className="mx-auto max-w-[680px] px-6 flex items-center justify-between h-12">
          <Popover open={feedOpen} onOpenChange={setFeedOpen}>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-foreground/80 transition-colors">
                {activeFeed === 'for_you' ? 'For you' : 'Following'}
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              sideOffset={8}
              className="w-56 p-0 rounded-xl bg-popover border border-border shadow-xl"
            >
              <div className="px-4 pt-3 pb-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">Feeds</span>
                <Plus className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="pb-1">
                <button
                  onClick={() => { setActiveFeed('for_you'); setFeedOpen(false); }}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-muted/50 transition-colors"
                >
                  <span className={activeFeed === 'for_you' ? 'text-foreground font-medium' : 'text-muted-foreground'}>For you</span>
                  {activeFeed === 'for_you' && <Check className="h-4 w-4 text-primary" />}
                </button>
                <button
                  onClick={() => { setActiveFeed('following'); setFeedOpen(false); }}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-muted/50 transition-colors"
                >
                  <span className={activeFeed === 'following' ? 'text-foreground font-medium' : 'text-muted-foreground'}>Following</span>
                  {activeFeed === 'following' && <Check className="h-4 w-4 text-primary" />}
                </button>
              </div>
            </PopoverContent>
          </Popover>
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

      {/* Feed */}
      <section className="py-4 sm:py-6 px-6">
        <div className="mx-auto max-w-[680px] space-y-1">
          {searchOpen && (
            <div className="pb-4">
              <ThreadSearchPanel open={searchOpen} onOpenChange={setSearchOpen} onSearchChange={handleSearchChange} activeCategory={activeCategory} onCategoryChange={handleCategoryChange} />
            </div>
          )}

          {searchQuery && (
            <p className="text-center text-sm text-muted-foreground pb-3">
              {threads.length > 0 ? (
                <>Found threads matching "<span className="font-medium text-foreground">{searchQuery}</span>"</>
              ) : (
                <>No threads found matching "<span className="font-medium text-foreground">{searchQuery}</span>"</>
              )}
            </p>
          )}

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
            <div className="divide-y divide-border/30">
              {threads.map((thread) => (
                <div key={thread.id} className="py-1">
                  <ThreadCard thread={thread} onReplyClick={handleReplyClick} />
                </div>
              ))}
            </div>
          )}

          {/* Infinite scroll sentinel */}
          <div ref={loadMoreRef} className="py-6 flex justify-center">
            {isFetchingNextPage && (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            )}
          </div>
        </div>
      </section>

      {/* Floating + button */}
      <button
        onClick={() => setNewThreadOpen(true)}
        className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30 hover:shadow-primary/50 hover:scale-105 transition-all duration-200 flex items-center justify-center"
      >
        <Plus className="h-7 w-7" />
      </button>

      <NewThreadDialog open={newThreadOpen} onOpenChange={setNewThreadOpen} />
      <ThreadReplyDialog thread={selectedThread} open={replyDialogOpen} onOpenChange={setReplyDialogOpen} />
    </div>
  );
}
