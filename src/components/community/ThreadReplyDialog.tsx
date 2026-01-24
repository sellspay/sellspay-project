import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { X, Send, Heart, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { VerifiedBadge } from '@/components/ui/verified-badge';
import { GifPicker } from '@/components/comments/GifPicker';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
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

interface Reply {
  id: string;
  thread_id: string;
  author_id: string;
  content: string;
  gif_url: string | null;
  created_at: string;
  author?: ThreadAuthor;
  likes_count: number;
  is_liked: boolean;
}

interface ThreadReplyDialogProps {
  thread: Thread | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const categoryLabels: Record<string, string> = {
  help: 'Help & Advice',
  showcase: 'Showcase',
  discussion: 'Discussion',
  promotion: 'Promotion',
  feedback: 'Feedback',
};

export function ThreadReplyDialog({ thread, open, onOpenChange }: ThreadReplyDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [replyContent, setReplyContent] = useState('');
  const [selectedGif, setSelectedGif] = useState<string | null>(null);

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

  // Fetch replies
  const { data: replies = [], isLoading: repliesLoading, refetch: refetchReplies } = useQuery({
    queryKey: ['thread-replies', thread?.id],
    queryFn: async () => {
      if (!thread?.id) return [];

      const { data: repliesData, error } = await supabase
        .from('thread_replies')
        .select('*')
        .eq('thread_id', thread.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (!repliesData || repliesData.length === 0) return [];

      // Fetch authors
      const authorIds = [...new Set(repliesData.map((r) => r.author_id))];
      const { data: authorsData } = await supabase
        .from('profiles')
        .select('id, user_id, username, full_name, avatar_url, verified')
        .in('id', authorIds);

      const authorsMap = new Map(authorsData?.map((a) => [a.id, a]) || []);

      // Fetch admin roles
      const userIds = (authorsData || []).map((p: any) => p.user_id).filter(Boolean);
      const { data: adminRoles } = userIds.length
        ? await supabase.from('user_roles').select('user_id').eq('role', 'admin').in('user_id', userIds)
        : { data: [] as any[] };
      const adminUserIds = new Set((adminRoles || []).map((r: any) => r.user_id));

      // Fetch likes counts
      const replyIds = repliesData.map((r) => r.id);
      const { data: likesData } = await supabase
        .from('thread_reply_likes')
        .select('reply_id')
        .in('reply_id', replyIds);

      const likesCountMap = new Map<string, number>();
      likesData?.forEach((like) => {
        likesCountMap.set(like.reply_id, (likesCountMap.get(like.reply_id) || 0) + 1);
      });

      // Check user likes
      let userLikesSet = new Set<string>();
      if (profile?.id) {
        const { data: userLikes } = await supabase
          .from('thread_reply_likes')
          .select('reply_id')
          .eq('user_id', profile.id)
          .in('reply_id', replyIds);
        userLikesSet = new Set(userLikes?.map((l) => l.reply_id) || []);
      }

      return repliesData.map((reply) => ({
        ...reply,
        author: {
          ...authorsMap.get(reply.author_id),
          isAdmin: adminUserIds.has((authorsMap.get(reply.author_id) as any)?.user_id),
        },
        likes_count: likesCountMap.get(reply.id) || 0,
        is_liked: userLikesSet.has(reply.id),
      })) as Reply[];
    },
    enabled: !!thread?.id && open,
  });

  // Check if thread author is admin
  const { data: threadAuthorIsAdmin } = useQuery({
    queryKey: ['user-is-admin', thread?.author_id],
    queryFn: async () => {
      if (!thread?.author_id) return false;
      // threads.author_id points to profiles.id (not auth user id)
      const { data: authorProfile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('id', thread.author_id)
        .maybeSingle();
      if (!authorProfile?.user_id) return false;

      const { data: roleRow } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('user_id', authorProfile.user_id)
        .eq('role', 'admin')
        .maybeSingle();
      return !!roleRow;
    },
    enabled: !!thread?.author_id && open,
  });

  const postReplyMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.id || !thread?.id) throw new Error('Must be logged in');
      if (!replyContent.trim() && !selectedGif) throw new Error('Reply cannot be empty');

      const { error } = await supabase.from('thread_replies').insert({
        thread_id: thread.id,
        author_id: profile.id,
        content: replyContent.trim(),
        gif_url: selectedGif,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      setReplyContent('');
      setSelectedGif(null);
      refetchReplies();
      queryClient.invalidateQueries({ queryKey: ['threads'] });
      toast.success('Reply posted');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to post reply');
    },
  });

  const likeReplyMutation = useMutation({
    mutationFn: async ({ replyId, isLiked }: { replyId: string; isLiked: boolean }) => {
      if (!profile?.id) throw new Error('Must be logged in');

      if (isLiked) {
        await supabase
          .from('thread_reply_likes')
          .delete()
          .eq('reply_id', replyId)
          .eq('user_id', profile.id);
      } else {
        await supabase.from('thread_reply_likes').insert({
          reply_id: replyId,
          user_id: profile.id,
        });
      }
    },
    onMutate: async ({ replyId, isLiked }) => {
      await queryClient.cancelQueries({ queryKey: ['thread-replies', thread?.id] });
      
      const previousReplies = queryClient.getQueryData(['thread-replies', thread?.id]);
      
      queryClient.setQueryData(['thread-replies', thread?.id], (old: Reply[] | undefined) =>
        old?.map((reply) =>
          reply.id === replyId
            ? {
                ...reply,
                is_liked: !isLiked,
                likes_count: isLiked ? reply.likes_count - 1 : reply.likes_count + 1,
              }
            : reply
        )
      );

      return { previousReplies };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['thread-replies', thread?.id], context?.previousReplies);
      toast.error('Failed to like reply');
    },
  });

  if (!thread) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] p-0 gap-0 bg-card border-border/50">
        <DialogHeader className="p-4 pb-3 border-b border-border/50">
          <DialogTitle className="text-lg font-semibold">Thread</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[50vh]">
          {/* Original Thread */}
          <div className="p-4 border-b border-border/30">
            <div className="flex gap-3">
              <Avatar className="h-10 w-10 ring-2 ring-border">
                <AvatarImage src={thread.author?.avatar_url || ''} />
                <AvatarFallback className="bg-muted text-muted-foreground">
                  {thread.author?.full_name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-foreground">
                    {thread.author?.full_name || thread.author?.username}
                  </span>
                  {thread.author?.verified && <VerifiedBadge size="sm" isOwner={threadAuthorIsAdmin} />}
                  <span className="text-muted-foreground text-sm">
                    · {formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}
                  </span>
                </div>
                <Badge variant="secondary" className="text-xs mb-2">
                  {categoryLabels[thread.category] || thread.category}
                </Badge>
                <p className="text-foreground whitespace-pre-wrap">{thread.content}</p>
                {thread.gif_url && (
                  <img
                    src={thread.gif_url}
                    alt=""
                    className="mt-3 rounded-lg max-h-48 object-cover border border-border/50"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Replies */}
          <div className="divide-y divide-border/30">
            {repliesLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : replies.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                No replies yet. Be the first!
              </div>
            ) : (
              replies.map((reply) => (
                <div key={reply.id} className="p-4">
                  <div className="flex gap-3">
                    <Avatar className="h-8 w-8 ring-1 ring-border">
                      <AvatarImage src={reply.author?.avatar_url || ''} />
                      <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                        {reply.author?.full_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-medium text-sm text-foreground">
                          {reply.author?.full_name || reply.author?.username}
                        </span>
                        {reply.author?.verified && <VerifiedBadge size="sm" isOwner={(reply.author as any)?.isAdmin} />}
                        <span className="text-muted-foreground text-xs">
                          · {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-foreground text-sm whitespace-pre-wrap">{reply.content}</p>
                      {reply.gif_url && (
                        <img
                          src={reply.gif_url}
                          alt=""
                          className="mt-2 rounded-lg max-h-32 object-cover border border-border/50"
                        />
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "mt-1 -ml-2 h-7 px-2 text-xs gap-1",
                          reply.is_liked ? "text-destructive" : "text-muted-foreground hover:text-destructive"
                        )}
                        onClick={() => {
                          if (!user) {
                            toast.error('Please log in to like');
                            return;
                          }
                          likeReplyMutation.mutate({ replyId: reply.id, isLiked: reply.is_liked });
                        }}
                      >
                        <Heart className={cn("h-3.5 w-3.5", reply.is_liked && "fill-current")} />
                        {reply.likes_count > 0 && reply.likes_count}
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Reply Input */}
        {user ? (
          <div className="p-4 border-t border-border/50 bg-muted/30">
            {selectedGif && (
              <div className="relative mb-3 inline-block">
                <img
                  src={selectedGif}
                  alt="Selected GIF"
                  className="h-20 rounded-lg border border-border"
                />
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                  onClick={() => setSelectedGif(null)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
            <div className="flex gap-2 items-end">
              <Avatar className="h-8 w-8 ring-1 ring-border shrink-0">
                <AvatarImage src={profile?.avatar_url || ''} />
                <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                  {profile?.full_name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 relative">
                <Textarea
                  placeholder="Write a reply..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="min-h-[60px] resize-none pr-20 bg-background border-border/50 focus:border-primary/50"
                  rows={2}
                />
                <div className="absolute right-2 bottom-2 flex items-center gap-1">
                  <GifPicker onSelect={(url) => setSelectedGif(url)} />
                  <Button
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    disabled={(!replyContent.trim() && !selectedGif) || postReplyMutation.isPending}
                    onClick={() => postReplyMutation.mutate()}
                  >
                    {postReplyMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 border-t border-border/50 text-center text-muted-foreground text-sm">
            Log in to reply
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
