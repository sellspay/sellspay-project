import { useState, useMemo } from 'react';
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

const categoryStyles: Record<string, { bg: string; text: string; gradient: string }> = {
  help: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', gradient: 'from-emerald-500 to-teal-600' },
  showcase: { bg: 'bg-violet-500/10', text: 'text-violet-400', gradient: 'from-violet-500 to-purple-600' },
  discussion: { bg: 'bg-sky-500/10', text: 'text-sky-400', gradient: 'from-sky-500 to-blue-600' },
  promotion: { bg: 'bg-amber-500/10', text: 'text-amber-400', gradient: 'from-amber-500 to-orange-600' },
  feedback: { bg: 'bg-rose-500/10', text: 'text-rose-400', gradient: 'from-rose-500 to-pink-600' },
};

const categoryLabels: Record<string, string> = {
  help: 'Help & Advice',
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

  // Fetch user profile
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

  // Check if thread author is owner (visible to everyone via public_profiles view)
  const { data: authorIsOwner = false } = useQuery({
    queryKey: ['thread-author-is-owner', thread.author_id],
    queryFn: async () => {
      // First get the user_id from public_profiles (accessible to all users)
      const { data: authorProfile, error: profileErr } = await supabase
        .from('public_profiles')
        .select('user_id')
        .eq('id', thread.author_id)
        .maybeSingle();
      if (profileErr || !authorProfile?.user_id) return false;

      // Then check if they have owner role (RLS allows public to check owner role)
      const { data: roleRow, error: roleErr } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('user_id', authorProfile.user_id)
        .eq('role', 'owner')
        .maybeSingle();
      if (roleErr) return false;
      return !!roleRow;
    },
    enabled: !!thread.author_id,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes since owner status rarely changes
  });

  const isThreadOwner = profile?.id === thread.author_id;

  // For promotions, extract and parse the URL
  const promotionData = useMemo(() => {
    if (thread.category !== 'promotion') return null;
    const url = extractPromotionUrl(thread.content);
    if (!url) return null;
    const youtubeId = extractYouTubeId(url);
    const cleanContent = getContentWithoutUrl(thread.content);
    return { url, youtubeId, cleanContent };
  }, [thread.content, thread.category]);

  // Use clean content for promotions, original for others
  const contentForDisplay = promotionData?.cleanContent || thread.content;
  const contentTooLong = contentForDisplay.length > 280;
  const displayContent =
    contentTooLong && !showFullContent ? contentForDisplay.slice(0, 280) + '...' : contentForDisplay;

  const categoryStyle = categoryStyles[thread.category] || { bg: 'bg-muted', text: 'text-muted-foreground', gradient: 'from-muted to-muted' };

  // Optimistic like mutation with duplicate prevention
  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.id) throw new Error('Must be logged in');

      if (thread.is_liked) {
        const { error } = await supabase
          .from('thread_likes')
          .delete()
          .eq('thread_id', thread.id)
          .eq('user_id', profile.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('thread_likes')
          .upsert(
            { thread_id: thread.id, user_id: profile.id },
            { onConflict: 'thread_id,user_id', ignoreDuplicates: true }
          );
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
          t.id === thread.id
            ? {
                ...t,
                is_liked: !t.is_liked,
                likes_count: t.is_liked ? t.likes_count - 1 : t.likes_count + 1,
              }
            : t
        )
      );

      return { previousThreads };
    },
    onError: (error: any, _, context) => {
      queryClient.setQueriesData({ queryKey: ['threads'] }, context?.previousThreads);
      toast.error(error.message || 'Failed to like thread');
    },
    onSettled: () => {
      setIsLiking(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('threads').delete().eq('id', thread.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['threads'] });
      toast.success('Thread deleted');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete thread');
    },
  });

  // Pin/unpin mutation (owner only)
  const pinMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('threads')
        .update({ is_pinned: !thread.is_pinned })
        .eq('id', thread.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['threads'] });
      toast.success(thread.is_pinned ? 'Thread unpinned' : 'Thread pinned');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update pin status');
    },
  });

  return (
    <div
      className={cn(
        "group relative rounded-3xl border border-border/40 bg-gradient-to-br from-card/90 via-card/70 to-card/50 backdrop-blur-xl p-6 transition-all duration-500 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1 overflow-hidden",
        thread.is_pinned && "border-primary/40 bg-gradient-to-br from-primary/10 via-card/70 to-card/50"
      )}
    >
      {/* Premium Glow Effect on Hover */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/10 via-transparent to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      {/* Subtle gradient line at top */}
      <div className={cn(
        "absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500",
        categoryStyle.gradient && `via-${categoryStyle.gradient.split(' ')[0].replace('from-', '')}`
      )} style={{ backgroundImage: `linear-gradient(to right, transparent, hsl(var(--primary) / 0.5), transparent)` }} />

      <div className="relative flex gap-4">
        {/* Avatar with ring */}
        <Link to={thread.author?.username ? `/@${thread.author.username}` : '#'} className="shrink-0">
          <div className="relative">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-primary/50 to-accent/50 opacity-0 group-hover:opacity-100 blur transition-opacity duration-500" />
            <Avatar className="relative h-12 w-12 ring-2 ring-border/50 hover:ring-primary/50 transition-all">
              <AvatarImage src={thread.author?.avatar_url || ''} />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-foreground font-semibold">
                {thread.author?.full_name?.charAt(0) || thread.author?.username?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
          </div>
        </Link>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                to={thread.author?.username ? `/@${thread.author.username}` : '#'}
                className="font-bold text-foreground hover:text-primary transition-colors"
              >
                @{thread.author?.username || 'unknown'}
              </Link>
              {thread.author?.verified && <VerifiedBadge size="sm" isOwner={authorIsOwner} />}
              {thread.is_pinned && (
                <Badge variant="secondary" className="text-xs gap-1 bg-gradient-to-r from-primary/20 to-accent/20 text-primary border-0 shadow-sm">
                  <Pin className="h-3 w-3" />
                  Pinned
                </Badge>
              )}
              <span className="text-muted-foreground/30 text-sm">·</span>
              <span className="text-muted-foreground/70 text-sm">
                {formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}
              </span>
            </div>

            {/* Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/10"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 bg-card/95 backdrop-blur-xl border-border/50">
                {/* Pin/Unpin - Owner only */}
                {isAppOwner && (
                  <DropdownMenuItem
                    className="focus:bg-primary/10"
                    onClick={() => pinMutation.mutate()}
                  >
                    <Pin className="h-4 w-4 mr-2" />
                    {thread.is_pinned ? 'Unpin Thread' : 'Pin Thread'}
                  </DropdownMenuItem>
                )}
                {/* Delete - Thread owner or App owner */}
                {(isThreadOwner || isAppOwner) && (
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                    onClick={() => deleteMutation.mutate()}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
                {/* Report - Non-owners only */}
                {!isThreadOwner && !isAppOwner && (
                  <DropdownMenuItem className="focus:bg-muted">
                    <Flag className="h-4 w-4 mr-2" />
                    Report
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Category Badge - Premium Gradient Style */}
          <div className="mb-3">
            <Badge
              variant="secondary"
              className={cn(
                "text-xs border-0 font-semibold tracking-wide uppercase px-3 py-1 shadow-sm",
                categoryStyle.bg,
                categoryStyle.text
              )}
            >
              {categoryLabels[thread.category] || thread.category}
            </Badge>
          </div>

          {/* Content */}
          <p className="text-foreground whitespace-pre-wrap break-words leading-relaxed text-[15px]">{displayContent}</p>
          {contentTooLong && !showFullContent && (
            <button
              onClick={() => setShowFullContent(true)}
              className="text-primary text-sm hover:underline mt-2 font-semibold"
            >
              Read more
            </button>
          )}

          {/* Promotion YouTube Embed or Link */}
          {promotionData && (
            <div className="mt-4">
              {promotionData.youtubeId ? (
                // YouTube Video Embed
                <div className="rounded-2xl overflow-hidden border border-border/30 shadow-lg aspect-video max-w-lg bg-black">
                  <iframe
                    src={`https://www.youtube.com/embed/${promotionData.youtubeId}`}
                    title="YouTube video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
              ) : (
                // Regular Link with preview
                <a
                  href={promotionData.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 rounded-xl bg-muted/30 border border-border/50 hover:border-primary/30 hover:bg-muted/50 transition-all group max-w-lg"
                >
                  <div className="shrink-0 p-2.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                    <ExternalLink className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                      {promotionData.url.replace(/^https?:\/\//, '').split('/')[0]}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{promotionData.url}</p>
                  </div>
                </a>
              )}
            </div>
          )}

          {/* Promotion Cover Image (only if not YouTube) */}
          {thread.category === 'promotion' && thread.image_url && !promotionData?.youtubeId && (
            <div className="mt-4 rounded-2xl overflow-hidden border border-border/30 max-w-md bg-gradient-to-br from-muted/50 to-muted/30 shadow-lg">
              <img
                src={thread.image_url}
                alt="Promotion cover"
                className="w-full h-auto max-h-72 object-cover"
              />
            </div>
          )}

          {/* GIF/Image with premium border (non-promotion) */}
          {thread.category !== 'promotion' && (thread.gif_url || thread.image_url) && (
            <div className="mt-4 rounded-2xl overflow-hidden border border-border/30 max-w-md bg-gradient-to-br from-muted/50 to-muted/30 shadow-lg">
              <img
                src={thread.gif_url || thread.image_url || ''}
                alt=""
                className="w-full h-auto max-h-72 object-cover"
              />
            </div>
          )}

          {/* Actions - Premium Style */}
          <div className="flex items-center gap-2 mt-5 -ml-3">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "gap-2 h-10 px-4 rounded-full transition-all duration-300",
                thread.is_liked
                  ? "text-rose-500 hover:text-rose-500 hover:bg-rose-500/10 bg-rose-500/5"
                  : "text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10"
              )}
              onClick={() => {
                if (!user) {
                  toast.error('Please log in to like');
                  return;
                }
                likeMutation.mutate();
              }}
            >
              <Heart className={cn("h-5 w-5 transition-transform", thread.is_liked && "fill-current scale-110")} />
              {thread.likes_count > 0 && <span className="text-sm font-semibold">{thread.likes_count}</span>}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="gap-2 h-10 px-4 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-300"
              onClick={() => onReplyClick?.(thread)}
            >
              <MessageCircle className="h-5 w-5" />
              {thread.replies_count > 0 && <span className="text-sm font-semibold">{thread.replies_count}</span>}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
