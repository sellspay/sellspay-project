import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, MessageSquare, SearchX, Plus, Search, ChevronDown } from 'lucide-react';
import { ThreadCard } from '@/components/community/ThreadCard';
import { NewThreadDialog } from '@/components/community/NewThreadDialog';
import { ThreadSearchPanel } from '@/components/community/ThreadSearchPanel';
import { ThreadReplyDialog } from '@/components/community/ThreadReplyDialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { cn } from '@/lib/utils';

const THREADS_PER_PAGE = 20;

const FILTER_OPTIONS = [
  { id: 'all', label: 'For you' },
  { id: 'help', label: 'Help & Advice' },
  { id: 'showcase', label: 'Showcase' },
  { id: 'discussion', label: 'Discussion' },
  { id: 'promotion', label: 'Promotion' },
  { id: 'feedback', label: 'Feedback' },
];

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
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, searchQuery]);

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase.from('profiles').select('id').eq('user_id', user.id).single();
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: totalCount = 0 } = useQuery({
    queryKey: ['threads-count', activeCategory, searchQuery],
    queryFn: async () => {
      let query = supabase.from('threads').select('id', { count: 'exact', head: true });
      if (activeCategory === 'all') {
        query = query.neq('category', 'promotion');
      } else {
        query = query.eq('category', activeCategory);
      }
      if (searchQuery) {
        query = query.neq('category', 'promotion').ilike('content', `%${searchQuery}%`);
      }
      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    },
  });

  const totalPages = Math.ceil(totalCount / THREADS_PER_PAGE);

  const {
    data: threads = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['threads', activeCategory, currentPage, searchQuery],
    queryFn: async () => {
      const start = (currentPage - 1) * THREADS_PER_PAGE;
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
      if (!threadsData || threadsData.length === 0) return [];

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

      return threadsData.map((thread) => ({
        ...thread,
        author: authorsMap.get(thread.author_id),
        likes_count: likesCountMap.get(thread.id) || 0,
        replies_count: repliesCountMap.get(thread.id) || 0,
        is_liked: userLikesSet.has(thread.id),
      })) as Thread[];
    },
  });

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

  const activeFilterLabel = FILTER_OPTIONS.find(f => f.id === activeCategory)?.label || 'For you';

  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (currentPage <= 3) {
      for (let i = 1; i <= Math.min(maxVisible, totalPages); i++) pages.push(i);
    } else if (currentPage >= totalPages - 2) {
      for (let i = Math.max(1, totalPages - maxVisible + 1); i <= totalPages; i++) pages.push(i);
    } else {
      for (let i = currentPage - 2; i <= currentPage + 2; i++) pages.push(i);
    }
    return pages;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal top bar with filter dropdown + search icon */}
      <div className="sticky top-16 z-30 bg-background/80 backdrop-blur-xl border-b border-border/30">
        <div className="mx-auto max-w-[680px] px-6 flex items-center justify-between h-12">
          {/* Filter dropdown — centered */}
          <div className="flex-1" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground hover:text-primary transition-colors">
                {activeFilterLabel}
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-48 bg-popover backdrop-blur-xl border-border/50 shadow-lg">
              {FILTER_OPTIONS.map(opt => (
                <DropdownMenuItem
                  key={opt.id}
                  onClick={() => handleCategoryChange(opt.id)}
                  className={cn(
                    "text-sm cursor-pointer",
                    activeCategory === opt.id && "text-primary font-semibold"
                  )}
                >
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex-1 flex justify-end">
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

      {/* Feed */}
      <section className="py-4 sm:py-6 px-6">
        <div className="mx-auto max-w-[680px] space-y-1">
          {/* Search panel (collapsible) */}
          {searchOpen && (
            <div className="pb-4">
              <ThreadSearchPanel open={searchOpen} onOpenChange={setSearchOpen} onSearchChange={handleSearchChange} activeCategory={activeCategory} onCategoryChange={handleCategoryChange} />
            </div>
          )}

          {searchQuery && (
            <p className="text-center text-sm text-muted-foreground pb-3">
              {totalCount > 0 ? (
                <>Found <span className="font-medium text-foreground">{totalCount}</span> thread{totalCount !== 1 ? 's' : ''} matching "<span className="font-medium text-foreground">{searchQuery}</span>"</>
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

          {totalPages > 1 && !isLoading && threads.length > 0 && (
            <div className="pt-8">
              <Pagination>
                <PaginationContent className="gap-1">
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  {getPageNumbers().map((pageNum) => (
                    <PaginationItem key={pageNum}>
                      <PaginationLink onClick={() => setCurrentPage(pageNum)} isActive={currentPage === pageNum} className="cursor-pointer">
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
              <p className="text-center mt-3 text-xs text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Floating + button (bottom-right) */}
      <button
        onClick={() => setNewThreadOpen(true)}
        className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30 hover:shadow-primary/50 hover:scale-105 transition-all duration-200 flex items-center justify-center"
      >
        <Plus className="h-7 w-7" />
      </button>

      {/* New Thread Dialog */}
      <NewThreadDialog open={newThreadOpen} onOpenChange={setNewThreadOpen} />

      <ThreadReplyDialog thread={selectedThread} open={replyDialogOpen} onOpenChange={setReplyDialogOpen} />
    </div>
  );
}