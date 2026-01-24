import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Send, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
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
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const categories = [
  { value: 'discussion', label: 'Discussion' },
  { value: 'help', label: 'Help & Advice' },
  { value: 'showcase', label: 'Showcase' },
  { value: 'promotion', label: 'Promotion' },
  { value: 'feedback', label: 'Feedback' },
];

const MAX_LENGTH = 1000;

export function ThreadComposer() {
  const { user } = useAuth();
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

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.id) throw new Error('Must be logged in');
      if (!content.trim()) throw new Error('Content is required');

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
    createMutation.mutate();
  };

  if (!user) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">
            <a href="/login" className="text-primary hover:underline">Log in</a>
            {' '}to start a thread
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "border-border/50 transition-all duration-200",
      isFocused && "border-primary/50 shadow-lg shadow-primary/5"
    )}>
      <CardContent className="p-4">
        <div className="flex gap-3">
          {/* Avatar */}
          <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-border">
            <AvatarImage src={profile?.avatar_url || ''} />
            <AvatarFallback className="bg-muted">
              {profile?.full_name?.charAt(0) || profile?.username?.charAt(0) || '?'}
            </AvatarFallback>
          </Avatar>

          {/* Input Area */}
          <div className="flex-1 space-y-3">
            <Textarea
              placeholder="Start a thread..."
              className="min-h-[60px] resize-none border-0 p-0 text-base focus-visible:ring-0 placeholder:text-muted-foreground/60"
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
                  className="max-h-40 rounded-lg border border-border"
                />
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                  onClick={() => setGifUrl(null)}
                >
                  ×
                </Button>
              </div>
            )}

            {/* Footer */}
            {(isFocused || content) && (
              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <div className="flex items-center gap-2">
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="h-9 w-[140px] text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <GifPicker onSelect={handleGifSelect} />
                </div>

                <div className="flex items-center gap-3">
                  {content.length > 0 && (
                    <span className={cn(
                      "text-xs",
                      content.length > MAX_LENGTH * 0.9 ? "text-destructive" : "text-muted-foreground"
                    )}>
                      {content.length}/{MAX_LENGTH}
                    </span>
                  )}
                  <Button
                    size="sm"
                    disabled={!content.trim() || createMutation.isPending}
                    onClick={handleSubmit}
                    className="rounded-full px-4"
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
      </CardContent>
    </Card>
  );
}
