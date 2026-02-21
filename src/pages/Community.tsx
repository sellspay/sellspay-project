import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, MessageSquare, SearchX } from 'lucide-react';
import { ThreadCard } from '@/components/community/ThreadCard';
import { ThreadComposer } from '@/components/community/ThreadComposer';
import { CategoryFilter } from '@/components/community/CategoryFilter';
import { ThreadReplyDialog } from '@/components/community/ThreadReplyDialog';
import { ThreadSearch } from '@/components/community/ThreadSearch';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

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
  }, []);

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
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] to-transparent pointer-events-none" />
        <div className="relative mx-auto max-w-[680px] px-6 pt-20 sm:pt-28 pb-14 sm:pb-20 text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-muted-foreground mb-5">
            Community
          </p>
          <h1 className="text-4xl sm:text-5xl font-semibold text-foreground tracking-tight leading-[1.1]">
            Threads
          </h1>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
            Ask questions, share your work, and connect with creators.
          </p>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />
      </section>

      {/* Feed */}
      <section className="py-8 sm:py-12 px-6">
        <div className="mx-auto max-w-[680px] space-y-6">
          <ThreadComposer />

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1">
              <ThreadSearch onSearchChange={handleSearchChange} />
            </div>
          </div>

          <div className="flex justify-center">
            <CategoryFilter activeCategory={activeCategory} onCategoryChange={handleCategoryChange} />
          </div>

          {searchQuery && (
            <p className="text-center text-sm text-muted-foreground">
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
            <div className="space-y-3">
              {threads.map((thread) => (
                <ThreadCard key={thread.id} thread={thread} onReplyClick={handleReplyClick} />
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

      <ThreadReplyDialog thread={selectedThread} open={replyDialogOpen} onOpenChange={setReplyDialogOpen} />
    </div>
  );
}
