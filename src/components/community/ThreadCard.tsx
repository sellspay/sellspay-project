import { useState, useMemo } from 'react';
import { ThreadPoll } from '@/components/community/ThreadPoll';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, MoreHorizontal, Trash2, Flag, Pin, ExternalLink } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { VerifiedBadge } from '@/components/ui/verified-badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Helper to extract YouTube video ID from various URL formats
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Helper to extract URL from content
function extractPromotionUrl(content: string): string | null {
  const urlMatch = content.match(/🔗\s*(https?:\/\/[^\s]+)/);
  return urlMatch ? urlMatch[1] : null;
}

// Helper to get content without the URL line
function getContentWithoutUrl(content: string): string {
  return content.replace(/\n\n🔗\s*https?:\/\/[^\s]+$/, '').trim();
}

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

interface ThreadCardProps {
  thread: Thread;
  onReplyClick?: (thread: Thread) => void;
}

const categoryStyles: Record<string, { bg: string; text: string; dot: string }> = {
  help: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  showcase: { bg: 'bg-violet-500/10', text: 'text-violet-400', dot: 'bg-violet-400' },
  discussion: { bg: 'bg-sky-500/10', text: 'text-sky-400', dot: 'bg-sky-400' },
  promotion: { bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-400' },
  feedback: { bg: 'bg-rose-500/10', text: 'text-rose-400', dot: 'bg-rose-400' },
};

const categoryLabels: Record<string, string> = {
  help: 'Questions',
  showcase: 'Showcase',
  discussion: 'Discussion',
  promotion: 'Promotion',
  feedback: 'Feedback',
};

export function ThreadCard({ thread, onReplyClick }: ThreadCardProps) {
  const { user, isOwner: isAppOwner } = useAuth();
  const queryClient = useQueryClient();
  const [showFullContent, setShowFullContent] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .eq('user_id', user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: authorIsOwner = false } = useQuery({
    queryKey: ['thread-author-is-owner', thread.author_id],
    queryFn: async () => {
      const { data: authorProfile, error } = await supabase
        .from('public_profiles')
        .select('is_owner')
        .eq('id', thread.author_id)
        .maybeSingle();
      if (error || !authorProfile) return false;
      return authorProfile.is_owner === true;
    },
    enabled: !!thread.author_id,
    staleTime: 1000 * 60 * 5,
  });

  const isThreadOwner = profile?.id === thread.author_id;

  const promotionData = useMemo(() => {
    if (thread.category !== 'promotion') return null;
    const url = extractPromotionUrl(thread.content);
    if (!url) return null;
    const youtubeId = extractYouTubeId(url);
    const cleanContent = getContentWithoutUrl(thread.content);
    return { url, youtubeId, cleanContent };
  }, [thread.content, thread.category]);

  const contentForDisplay = promotionData?.cleanContent || thread.content;
  // Get first line as "title", rest as body
  const firstLine = contentForDisplay.split('\n')[0].slice(0, 120);
  const hasMoreContent = contentForDisplay.length > 120 || contentForDisplay.includes('\n');

  const categoryStyle = categoryStyles[thread.category] || { bg: 'bg-muted', text: 'text-muted-foreground', dot: 'bg-muted-foreground' };

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.id) throw new Error('Must be logged in');
      if (thread.is_liked) {
        const { error } = await supabase.from('thread_likes').delete().eq('thread_id', thread.id).eq('user_id', profile.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('thread_likes').upsert({ thread_id: thread.id, user_id: profile.id }, { onConflict: 'thread_id,user_id', ignoreDuplicates: true });
        if (error) throw error;
      }
    },
    onMutate: async () => {
      if (isLiking) return;
      setIsLiking(true);
      await queryClient.cancelQueries({ queryKey: ['threads'] });
      const previousThreads = queryClient.getQueryData(['threads']);
      queryClient.setQueriesData({ queryKey: ['threads'] }, (old: Thread[] | undefined) =>
        old?.map((t) =>
          t.id === thread.id ? { ...t, is_liked: !t.is_liked, likes_count: t.is_liked ? t.likes_count - 1 : t.likes_count + 1 } : t
        )
      );
      return { previousThreads };
    },
    onError: (error: any, _, context) => {
      queryClient.setQueriesData({ queryKey: ['threads'] }, context?.previousThreads);
      toast.error(error.message || 'Failed to like thread');
    },
    onSettled: () => setIsLiking(false),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('threads').delete().eq('id', thread.id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['threads'] }); toast.success('Thread deleted'); },
    onError: (error: any) => toast.error(error.message || 'Failed to delete thread'),
  });

  const pinMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('threads').update({ is_pinned: !thread.is_pinned }).eq('id', thread.id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['threads'] }); toast.success(thread.is_pinned ? 'Thread unpinned' : 'Thread pinned'); },
    onError: (error: any) => toast.error(error.message || 'Failed to update pin status'),
  });

  return (
    <div className={cn("group", thread.is_pinned && "bg-primary/[0.03]")}>
      {/* Row layout: Topic | Replies | Activity */}
      <div
        className="grid grid-cols-1 sm:grid-cols-[1fr_80px_80px] items-start sm:items-center px-6 py-4 gap-3 sm:gap-0 hover:bg-muted/20 transition-colors cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Topic column */}
        <div className="flex items-start gap-3 min-w-0">
          <Link to={thread.author?.username ? `/@${thread.author.username}` : '#'} className="shrink-0 mt-0.5" onClick={(e) => e.stopPropagation()}>
            <Avatar className="h-9 w-9 ring-1 ring-border/30 hover:ring-primary/40 transition-all">
              <AvatarImage src={thread.author?.avatar_url || ''} />
              <AvatarFallback className="bg-muted text-foreground font-semibold text-xs">
                {thread.author?.full_name?.charAt(0) || thread.author?.username?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
          </Link>

          <div className="flex-1 min-w-0">
            {/* Title row */}
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              {thread.is_pinned && (
                <Pin className="h-3.5 w-3.5 text-primary shrink-0" />
              )}
              <span className="text-[15px] font-semibold text-foreground leading-snug line-clamp-1">
                {firstLine}
              </span>
            </div>

            {/* Meta row */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
              <Badge
                variant="secondary"
                className={cn(
                  "text-[10px] border-0 font-semibold tracking-wide uppercase px-2 py-0.5 h-auto",
                  categoryStyle.bg,
                  categoryStyle.text
                )}
              >
                {categoryLabels[thread.category] || thread.category}
              </Badge>
              <span>·</span>
              <Link
                to={thread.author?.username ? `/@${thread.author.username}` : '#'}
                className="hover:text-foreground transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                @{thread.author?.username || 'unknown'}
              </Link>
              {thread.author?.verified && <VerifiedBadge size="sm" isOwner={authorIsOwner} />}
              <span>·</span>
              <span>{formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}</span>
            </div>
          </div>
        </div>

        {/* Replies column */}
        <div className="hidden sm:flex flex-col items-center justify-center">
          <span className={cn("text-sm font-bold", thread.replies_count > 0 ? "text-foreground" : "text-muted-foreground/30")}>
            {thread.replies_count}
          </span>
        </div>

        {/* Activity column */}
        <div className="hidden sm:flex flex-col items-center justify-center">
          <span className="text-xs text-muted-foreground/50">
            {formatDistanceToNow(new Date(thread.created_at), { addSuffix: false })}
          </span>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-6 pb-5 pl-[4.5rem]">
          {/* Full content */}
          <p className="text-foreground whitespace-pre-wrap break-words leading-relaxed text-sm mb-3">
            {showFullContent ? contentForDisplay : contentForDisplay.slice(0, 500)}
            {contentForDisplay.length > 500 && !showFullContent && '...'}
          </p>
          {contentForDisplay.length > 500 && !showFullContent && (
            <button onClick={() => setShowFullContent(true)} className="text-primary text-sm hover:underline mb-3 font-semibold">
              Read more
            </button>
          )}

          {/* Promotion embeds */}
          {promotionData && (
            <div className="mb-3">
              {promotionData.youtubeId ? (
                <div className="rounded-xl overflow-hidden border border-border/30 aspect-video max-w-md bg-black">
                  <iframe src={`https://www.youtube.com/embed/${promotionData.youtubeId}`} title="YouTube video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full h-full" />
                </div>
              ) : (
                <a href={promotionData.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50 hover:border-primary/30 hover:bg-muted/50 transition-all group max-w-md">
                  <div className="shrink-0 p-2 rounded-lg bg-primary/10 text-primary"><ExternalLink className="h-4 w-4" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{promotionData.url.replace(/^https?:\/\//, '').split('/')[0]}</p>
                    <p className="text-xs text-muted-foreground truncate">{promotionData.url}</p>
                  </div>
                </a>
              )}
            </div>
          )}

          {/* Images */}
          {(thread.gif_url || thread.image_url) && (
            <div className="mb-3 rounded-xl overflow-hidden border border-border/30 max-w-md">
              <img src={thread.gif_url || thread.image_url || ''} alt="" className="w-full h-auto max-h-60 object-cover" />
            </div>
          )}

          {/* Poll */}
          <ThreadPoll threadId={thread.id} profileId={profile?.id || null} />

          {/* Actions */}
          <div className="flex items-center gap-1 mt-2 -ml-2">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "gap-1.5 h-8 px-3 rounded-full text-xs transition-all",
                thread.is_liked ? "text-rose-500 hover:text-rose-500 hover:bg-rose-500/10" : "text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10"
              )}
              onClick={(e) => { e.stopPropagation(); if (!user) { toast.error('Please log in to like'); return; } likeMutation.mutate(); }}
            >
              <Heart className={cn("h-4 w-4", thread.is_liked && "fill-current")} />
              {thread.likes_count > 0 && <span>{thread.likes_count}</span>}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 h-8 px-3 rounded-full text-xs text-muted-foreground hover:text-primary hover:bg-primary/10"
              onClick={(e) => { e.stopPropagation(); onReplyClick?.(thread); }}
            >
              <MessageCircle className="h-4 w-4" />
              Reply
            </Button>

            {/* Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 bg-popover border-border/50 shadow-lg">
                {isAppOwner && (
                  <DropdownMenuItem onClick={() => pinMutation.mutate()}>
                    <Pin className="h-4 w-4 mr-2" />
                    {thread.is_pinned ? 'Unpin' : 'Pin'}
                  </DropdownMenuItem>
                )}
                {(isThreadOwner || isAppOwner) && (
                  <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => deleteMutation.mutate()}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
                {!isThreadOwner && !isAppOwner && (
                  <DropdownMenuItem><Flag className="h-4 w-4 mr-2" />Report</DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}
    </div>
  );
}
