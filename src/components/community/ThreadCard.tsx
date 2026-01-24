import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, Share2, MoreHorizontal, Trash2, Flag, Pin } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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

const categoryStyles: Record<string, { bg: string; text: string; border: string }> = {
  help: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20' },
  showcase: { bg: 'bg-accent/20', text: 'text-accent-foreground', border: 'border-accent/30' },
  discussion: { bg: 'bg-secondary/50', text: 'text-secondary-foreground', border: 'border-secondary' },
  promotion: { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-border' },
  feedback: { bg: 'bg-primary/5', text: 'text-primary', border: 'border-primary/10' },
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
  const displayContent = contentTooLong && !showFullContent 
    ? thread.content.slice(0, 280) + '...' 
    : thread.content;

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['threads'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to like thread');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('threads')
        .delete()
        .eq('id', thread.id);
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

  const handleShare = async () => {
    const url = `${window.location.origin}/community/thread/${thread.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  return (
    <Card className={cn(
      "border-border/50 hover:border-border transition-colors",
      thread.is_pinned && "border-primary/30 bg-primary/5"
    )}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex gap-3 sm:gap-4">
          {/* Avatar */}
          <Link to={thread.author?.username ? `/@${thread.author.username}` : '#'}>
            <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-border hover:border-primary/50 transition-colors">
              <AvatarImage src={thread.author?.avatar_url || ''} />
              <AvatarFallback className="bg-muted">
                {thread.author?.full_name?.charAt(0) || thread.author?.username?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
          </Link>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Link 
                  to={thread.author?.username ? `/@${thread.author.username}` : '#'}
                  className="font-semibold text-foreground hover:underline"
                >
                  {thread.author?.full_name || thread.author?.username || 'Unknown'}
                </Link>
                {thread.author?.verified && <VerifiedBadge size="sm" />}
                {thread.is_pinned && (
                  <Badge variant="secondary" className="text-xs">
                    <Pin className="h-3 w-3 mr-1" />
                    Pinned
                  </Badge>
                )}
                <span className="text-muted-foreground text-sm">
                  @{thread.author?.username || 'unknown'}
                </span>
                <span className="text-muted-foreground text-sm">·</span>
                <span className="text-muted-foreground text-sm">
                  {formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}
                </span>
              </div>

              {/* Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
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
              variant="outline" 
              className={cn(
                "text-xs mb-3",
                categoryStyles[thread.category]?.bg || 'bg-muted',
                categoryStyles[thread.category]?.text || 'text-muted-foreground',
                categoryStyles[thread.category]?.border || 'border-border'
              )}
            >
              {categoryLabels[thread.category] || thread.category}
            </Badge>

            {/* Content */}
            <p className="text-foreground whitespace-pre-wrap break-words mb-3">
              {displayContent}
            </p>
            {contentTooLong && !showFullContent && (
              <button
                onClick={() => setShowFullContent(true)}
                className="text-primary text-sm hover:underline mb-3"
              >
                Read more
              </button>
            )}

            {/* GIF/Image */}
            {(thread.gif_url || thread.image_url) && (
              <div className="mt-3 mb-4 rounded-xl overflow-hidden border border-border max-w-md">
                <img
                  src={thread.gif_url || thread.image_url || ''}
                  alt=""
                  className="w-full h-auto max-h-80 object-cover"
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-1 -ml-2 mt-2">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "text-muted-foreground hover:text-destructive gap-1.5 h-9 px-3",
                  thread.is_liked && "text-destructive"
                )}
                onClick={() => {
                  if (!user) {
                    toast.error('Please log in to like');
                    return;
                  }
                  likeMutation.mutate();
                }}
              >
                <Heart className={cn("h-4 w-4", thread.is_liked && "fill-current")} />
                {thread.likes_count > 0 && <span>{thread.likes_count}</span>}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-primary gap-1.5 h-9 px-3"
                onClick={() => onReplyClick?.(thread)}
              >
                <MessageCircle className="h-4 w-4" />
                {thread.replies_count > 0 && <span>{thread.replies_count}</span>}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-primary h-9 px-3"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
