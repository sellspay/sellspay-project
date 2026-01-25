import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Send, Loader2, Sparkles, Crown, Lock, Link2, ImagePlus, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  const [promotionUrl, setPromotionUrl] = useState('');
  const [promotionImageUrl, setPromotionImageUrl] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Fetch user profile
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, is_creator')
        .eq('user_id', user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  // Check if user can post threads (owner, verified creators, or has any subscription)
  const hasSubscription = !!subscription;
  const isVerifiedCreator = !!profile?.is_creator;
  const canPostThreads = isOwner || isVerifiedCreator || hasSubscription;

  // Handle promotion image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.id) return;

    setIsUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`;
      const filePath = `thread-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-media')
        .getPublicUrl(filePath);

      setPromotionImageUrl(publicUrl);
      toast.success('Image uploaded!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.id) throw new Error('Must be logged in');
      if (!content.trim()) throw new Error('Content is required');
      if (!canPostThreads) throw new Error('Subscription required to post threads');

      // For promotions, store embed URL in content metadata via image_url field
      const imageUrl = category === 'promotion' ? promotionImageUrl || null : null;

      const { error } = await supabase.from('threads').insert({
        author_id: profile.id,
        content: category === 'promotion' && promotionUrl 
          ? `${content.trim()}\n\n🔗 ${promotionUrl}` 
          : content.trim(),
        category,
        gif_url: gifUrl,
        image_url: imageUrl,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      setContent('');
      setGifUrl(null);
      setCategory('discussion');
      setIsFocused(false);
      setPromotionUrl('');
      setPromotionImageUrl('');
      queryClient.invalidateQueries({ queryKey: ['threads'] });
      queryClient.invalidateQueries({ queryKey: ['threads-count'] });
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
                  <span className="text-muted-foreground">
                    Thread posting requires{' '}
                    <Link to="/pricing" className="text-primary hover:underline font-medium">
                      Starter plan or above
                    </Link>
                  </span>
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
      <div className={cn(
        "relative bg-gradient-to-br from-card/90 via-card/70 to-card/50 backdrop-blur-xl border rounded-3xl p-5 transition-all duration-500 overflow-hidden",
        isFocused 
          ? "border-primary/40 shadow-xl shadow-primary/5" 
          : "border-border/50 hover:border-primary/20"
      )}>
        {/* Subtle gradient line at top when focused */}
        <div className={cn(
          "absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent transition-opacity duration-500",
          isFocused ? "opacity-100" : "opacity-0"
        )} />

        <div className="relative flex gap-4">
          {/* Avatar - no glow effect */}
          <Avatar className="shrink-0 h-12 w-12 ring-2 ring-border/50">
            <AvatarImage src={profile?.avatar_url || ''} />
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-foreground font-semibold">
              {profile?.full_name?.charAt(0) || profile?.username?.charAt(0) || '?'}
            </AvatarFallback>
          </Avatar>

          {/* Input Area */}
          <div className="flex-1 space-y-4">
            <Textarea
              placeholder="What's on your mind? Start a thread..."
              className="min-h-[60px] resize-none border-0 p-0 text-base focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/50 bg-transparent"
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

            {/* Promotion Fields */}
            {category === 'promotion' && (isFocused || content) && (
              <div className="space-y-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                <div className="flex items-center gap-2 text-sm font-medium text-amber-500">
                  <Link2 className="h-4 w-4" />
                  Promotion Details
                </div>
                
                {/* URL Input */}
                <div className="space-y-1.5">
                  <Label htmlFor="promo-url" className="text-xs text-muted-foreground">
                    Link URL (required)
                  </Label>
                  <Input
                    id="promo-url"
                    type="url"
                    placeholder="https://example.com/your-product"
                    value={promotionUrl}
                    onChange={(e) => setPromotionUrl(e.target.value)}
                    className="h-10 bg-background/50 border-border/50 rounded-lg"
                  />
                </div>

                {/* Image Upload */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Cover Image (optional)
                  </Label>
                  {promotionImageUrl ? (
                    <div className="relative inline-block">
                      <img
                        src={promotionImageUrl}
                        alt="Promotion cover"
                        className="max-h-32 rounded-lg border border-border/30"
                      />
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-card/90 backdrop-blur-sm border border-border/50 shadow-md hover:bg-destructive hover:text-destructive-foreground transition-colors"
                        onClick={() => setPromotionImageUrl('')}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-9 rounded-lg border-dashed"
                        disabled={isUploadingImage}
                        onClick={() => document.getElementById('promo-image-upload')?.click()}
                      >
                        {isUploadingImage ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <ImagePlus className="h-4 w-4 mr-2" />
                        )}
                        Upload Image
                      </Button>
                      <input
                        id="promo-image-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </div>
                  )}
                </div>
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
