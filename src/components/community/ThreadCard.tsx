import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, MoreHorizontal, Trash2, Flag, Pin } from 'lucide-react';
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

const categoryStyles: Record<string, { bg: string; text: string }> = {
  help: { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  showcase: { bg: 'bg-violet-500/10', text: 'text-violet-400' },
  discussion: { bg: 'bg-sky-500/10', text: 'text-sky-400' },
  promotion: { bg: 'bg-amber-500/10', text: 'text-amber-400' },
  feedback: { bg: 'bg-rose-500/10', text: 'text-rose-400' },
};

const categoryLabels: Record<string, string> = {
  help: 'Help & Advice',
  showcase: 'Showcase',
  discussion: 'Discussion',
  promotion: 'Promotion',
  feedback: 'Feedback',
};

export function ThreadCard({ thread, onReplyClick }: ThreadCardProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showFullContent, setShowFullContent] = useState(false);

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

  const isOwner = profile?.id === thread.author_id;
  const contentTooLong = thread.content.length > 280;
  const displayContent =
    contentTooLong && !showFullContent ? thread.content.slice(0, 280) + '...' : thread.content;

  // Optimistic like mutation
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
          .insert({ thread_id: thread.id, user_id: profile.id });
        if (error) throw error;
      }
    },
    onMutate: async () => {
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

  return (
    <div
      className={cn(
        "group relative rounded-2xl border border-border/40 bg-gradient-to-br from-card via-card to-card/80 p-5 transition-all duration-300 hover:border-border/60 hover:shadow-lg hover:shadow-primary/5",
        thread.is_pinned && "border-primary/30 bg-gradient-to-br from-primary/5 via-card to-card"
      )}
    >
      {/* Subtle glow effect on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      <div className="relative flex gap-4">
        {/* Avatar */}
        <Link to={thread.author?.username ? `/@${thread.author.username}` : '#'} className="shrink-0">
          <Avatar className="h-11 w-11 ring-2 ring-border/50 hover:ring-primary/50 transition-all">
            <AvatarImage src={thread.author?.avatar_url || ''} />
            <AvatarFallback className="bg-muted text-muted-foreground font-medium">
              {thread.author?.full_name?.charAt(0) || thread.author?.username?.charAt(0) || '?'}
            </AvatarFallback>
          </Avatar>
        </Link>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                to={thread.author?.username ? `/@${thread.author.username}` : '#'}
                className="font-semibold text-foreground hover:text-primary transition-colors"
              >
                {thread.author?.full_name || thread.author?.username || 'Unknown'}
              </Link>
              {thread.author?.verified && <VerifiedBadge size="sm" />}
              {thread.is_pinned && (
                <Badge variant="secondary" className="text-xs gap-1 bg-primary/10 text-primary border-0">
                  <Pin className="h-3 w-3" />
                  Pinned
                </Badge>
              )}
              <span className="text-muted-foreground text-sm">@{thread.author?.username || 'unknown'}</span>
              <span className="text-muted-foreground/50 text-sm">·</span>
              <span className="text-muted-foreground text-sm">
                {formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}
              </span>
            </div>

            {/* Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {isOwner ? (
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => deleteMutation.mutate()}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem>
                    <Flag className="h-4 w-4 mr-2" />
                    Report
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Category Badge */}
          <Badge
            variant="secondary"
            className={cn(
              "text-xs mb-3 border-0 font-medium",
              categoryStyles[thread.category]?.bg || 'bg-muted',
              categoryStyles[thread.category]?.text || 'text-muted-foreground'
            )}
          >
            {categoryLabels[thread.category] || thread.category}
          </Badge>

          {/* Content */}
          <p className="text-foreground/90 whitespace-pre-wrap break-words leading-relaxed">{displayContent}</p>
          {contentTooLong && !showFullContent && (
            <button
              onClick={() => setShowFullContent(true)}
              className="text-primary text-sm hover:underline mt-1 font-medium"
            >
              Read more
            </button>
          )}

          {/* GIF/Image */}
          {(thread.gif_url || thread.image_url) && (
            <div className="mt-4 rounded-xl overflow-hidden border border-border/50 max-w-md bg-muted/30">
              <img
                src={thread.gif_url || thread.image_url || ''}
                alt=""
                className="w-full h-auto max-h-72 object-cover"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-1 mt-4 -ml-2">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "gap-2 h-9 px-3 rounded-full transition-all",
                thread.is_liked
                  ? "text-rose-500 hover:text-rose-500 hover:bg-rose-500/10"
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
              <Heart className={cn("h-[18px] w-[18px]", thread.is_liked && "fill-current")} />
              {thread.likes_count > 0 && <span className="text-sm font-medium">{thread.likes_count}</span>}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="gap-2 h-9 px-3 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
              onClick={() => onReplyClick?.(thread)}
            >
              <MessageCircle className="h-[18px] w-[18px]" />
              {thread.replies_count > 0 && <span className="text-sm font-medium">{thread.replies_count}</span>}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
