import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Send, Loader2, Sparkles, Crown, Lock } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GifPicker } from '@/components/comments/GifPicker';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useCredits } from '@/hooks/useCredits';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

const categories = [
  { value: 'discussion', label: 'Discussion' },
  { value: 'help', label: 'Help & Advice' },
  { value: 'showcase', label: 'Showcase' },
  { value: 'promotion', label: 'Promotion' },
  { value: 'feedback', label: 'Feedback' },
];

const MAX_LENGTH = 1000;

export function ThreadComposer() {
  const { user, isOwner } = useAuth();
  const { subscription } = useCredits();
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('discussion');
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);

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

  // Check if user can post threads (owner always can, or has any subscription)
  const hasSubscription = !!subscription;
  const canPostThreads = isOwner || hasSubscription;

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.id) throw new Error('Must be logged in');
      if (!content.trim()) throw new Error('Content is required');
      if (!canPostThreads) throw new Error('Subscription required to post threads');

      const { error } = await supabase.from('threads').insert({
        author_id: profile.id,
        content: content.trim(),
        category,
        gif_url: gifUrl,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      setContent('');
      setGifUrl(null);
      setCategory('discussion');
      setIsFocused(false);
      queryClient.invalidateQueries({ queryKey: ['threads'] });
      toast.success('Thread posted!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to post thread');
    },
  });

  const handleGifSelect = (gifUrl: string) => {
    setGifUrl(gifUrl);
  };

  const handleSubmit = () => {
    if (!user) {
      toast.error('Please log in to post');
      return;
    }
    if (!canPostThreads) {
      toast.error('You need a subscription to post threads');
      return;
    }
    createMutation.mutate();
  };

  // Not logged in state
  if (!user) {
    return (
      <div className="group relative">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative bg-gradient-to-br from-card/90 via-card/70 to-card/50 backdrop-blur-xl border border-border/50 rounded-3xl p-8 text-center hover:border-primary/30 transition-all duration-500">
          <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <p className="text-muted-foreground text-lg">
            <Link to="/login" className="text-primary hover:underline font-semibold">Log in</Link>
            {' '}to start a thread
          </p>
        </div>
      </div>
    );
  }

  // Logged in but no subscription (and not owner)
  if (!canPostThreads) {
    return (
      <div className="group relative">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative bg-gradient-to-br from-card/90 via-card/70 to-card/50 backdrop-blur-xl border border-amber-500/30 rounded-3xl p-6 hover:border-amber-500/50 transition-all duration-500">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <Avatar className="h-12 w-12 ring-2 ring-border/50 shrink-0">
              <AvatarImage src={profile?.avatar_url || ''} />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-foreground font-semibold">
                {profile?.full_name?.charAt(0) || profile?.username?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-3">
              {/* Locked input area */}
              <div className="relative">
                <div className="min-h-[60px] rounded-xl bg-muted/30 border border-border/30 p-4 flex items-center justify-center gap-3">
                  <Lock className="h-5 w-5 text-amber-500" />
                  <span className="text-muted-foreground">Thread posting requires a subscription</span>
                </div>
              </div>

              {/* CTA */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Crown className="h-4 w-4 text-amber-500" />
                  <span>Unlock with any plan</span>
                </div>
                <Button
                  asChild
                  size="sm"
                  className="rounded-full px-6 h-10 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/25"
                >
                  <Link to="/pricing">
                    <Crown className="h-4 w-4 mr-2" />
                    View Plans
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Info note */}
          <p className="mt-4 text-xs text-muted-foreground text-center">
            You can still browse, like, and reply to threads without a subscription.
          </p>
        </div>
      </div>
    );
  }

  // Has subscription or is owner - full composer
  return (
    <div className={cn(
      "group relative transition-all duration-500",
      isFocused && "scale-[1.01]"
    )}>
      {/* Premium glow effect */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl blur-xl transition-opacity duration-500",
        isFocused ? "opacity-100" : "opacity-0 group-hover:opacity-50"
      )} />
      
      <div className={cn(
        "relative bg-gradient-to-br from-card/90 via-card/70 to-card/50 backdrop-blur-xl border rounded-3xl p-5 transition-all duration-500 overflow-hidden",
        isFocused 
          ? "border-primary/40 shadow-2xl shadow-primary/10" 
          : "border-border/50 hover:border-primary/20"
      )}>
        {/* Subtle gradient line at top when focused */}
        <div className={cn(
          "absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent transition-opacity duration-500",
          isFocused ? "opacity-100" : "opacity-0"
        )} />

        <div className="relative flex gap-4">
          {/* Avatar with glow */}
          <div className="relative shrink-0">
            <div className={cn(
              "absolute -inset-1 rounded-full bg-gradient-to-br from-primary/50 to-accent/50 blur transition-opacity duration-500",
              isFocused ? "opacity-100" : "opacity-0"
            )} />
            <Avatar className="relative h-12 w-12 ring-2 ring-border/50">
              <AvatarImage src={profile?.avatar_url || ''} />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-foreground font-semibold">
                {profile?.full_name?.charAt(0) || profile?.username?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Input Area */}
          <div className="flex-1 space-y-4">
            <Textarea
              placeholder="What's on your mind? Start a thread..."
              className="min-h-[60px] resize-none border-0 p-0 text-base focus-visible:ring-0 placeholder:text-muted-foreground/50 bg-transparent"
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, MAX_LENGTH))}
              onFocus={() => setIsFocused(true)}
              rows={isFocused ? 3 : 1}
            />

            {/* GIF Preview */}
            {gifUrl && (
              <div className="relative inline-block">
                <img
                  src={gifUrl}
                  alt="Selected GIF"
                  className="max-h-40 rounded-xl border border-border/30 shadow-lg"
                />
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-card/90 backdrop-blur-sm border border-border/50 shadow-md hover:bg-destructive hover:text-destructive-foreground transition-colors"
                  onClick={() => setGifUrl(null)}
                >
                  ×
                </Button>
              </div>
            )}

            {/* Footer */}
            {(isFocused || content) && (
              <div className="flex items-center justify-between pt-4 border-t border-border/30">
                <div className="flex items-center gap-3">
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="h-10 w-[150px] text-sm bg-muted/50 border-border/50 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card/95 backdrop-blur-xl border-border/50">
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <GifPicker onSelect={handleGifSelect} />
                </div>

                <div className="flex items-center gap-4">
                  {content.length > 0 && (
                    <span className={cn(
                      "text-sm font-medium",
                      content.length > MAX_LENGTH * 0.9 ? "text-destructive" : "text-muted-foreground"
                    )}>
                      {content.length}/{MAX_LENGTH}
                    </span>
                  )}
                  <Button
                    size="sm"
                    disabled={!content.trim() || createMutation.isPending}
                    onClick={handleSubmit}
                    className="rounded-full px-6 h-10 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300"
                  >
                    {createMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Post
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
