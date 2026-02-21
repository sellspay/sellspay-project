import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { X, Send, Loader2, Link2, ImagePlus, Crown, Lock } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { useSubscription } from '@/hooks/useSubscription';
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

interface NewThreadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewThreadDialog({ open, onOpenChange }: NewThreadDialogProps) {
  const { user, isOwner } = useAuth();
  const { plan } = useSubscription();
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('discussion');
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [promotionUrl, setPromotionUrl] = useState('');
  const [promotionImageUrl, setPromotionImageUrl] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

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

  const hasSubscription = plan !== 'browser';
  const isVerifiedCreator = !!profile?.is_creator;
  const canPostThreads = isOwner || isVerifiedCreator || hasSubscription;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.id) return;
    setIsUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`;
      const filePath = `thread-images/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('product-media').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('product-media').getPublicUrl(filePath);
      setPromotionImageUrl(publicUrl);
      toast.success('Image uploaded');
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
      if (!canPostThreads) throw new Error('Subscription required');
      const imageUrl = category === 'promotion' ? promotionImageUrl || null : null;
      const { error } = await supabase.from('threads').insert({
        author_id: profile.id,
        content: category === 'promotion' && promotionUrl ? `${content.trim()}\n\n🔗 ${promotionUrl}` : content.trim(),
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
      setPromotionUrl('');
      setPromotionImageUrl('');
      queryClient.invalidateQueries({ queryKey: ['threads'] });
      queryClient.invalidateQueries({ queryKey: ['threads-count'] });
      toast.success('Thread posted');
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to post thread');
    },
  });

  // Not logged in or can't post
  if (!user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-card/95 backdrop-blur-xl border-border/50 sm:max-w-[520px] rounded-2xl p-0 gap-0">
          <div className="p-8 text-center">
            <p className="text-muted-foreground">
              <Link to="/login" className="text-primary hover:underline font-semibold" onClick={() => onOpenChange(false)}>Log in</Link> to start a thread
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!canPostThreads) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-card/95 backdrop-blur-xl border-border/50 sm:max-w-[520px] rounded-2xl p-0 gap-0">
          <DialogHeader className="p-5 pb-0">
            <DialogTitle className="text-center text-lg font-bold">New thread</DialogTitle>
          </DialogHeader>
          <div className="p-6 text-center space-y-4">
            <div className="inline-flex p-3 rounded-full bg-amber-500/10">
              <Lock className="h-6 w-6 text-amber-500" />
            </div>
            <p className="text-muted-foreground">
              Thread posting requires a{' '}
              <Link to="/pricing" className="text-primary hover:underline font-medium" onClick={() => onOpenChange(false)}>Starter plan or above</Link>
            </p>
            <Button asChild className="rounded-full px-6 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white">
              <Link to="/pricing" onClick={() => onOpenChange(false)}>
                <Crown className="h-4 w-4 mr-2" />
                View Plans
              </Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card/95 backdrop-blur-xl border-border/50 sm:max-w-[520px] rounded-2xl p-0 gap-0 [&>button]:hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => onOpenChange(false)}>
            <X className="h-5 w-5" />
          </Button>
          <h2 className="text-base font-bold text-foreground">New thread</h2>
          <div className="w-8" />
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Author row */}
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10 ring-1 ring-border/50 shrink-0">
              <AvatarImage src={profile?.avatar_url || ''} />
              <AvatarFallback className="bg-muted text-foreground font-semibold text-sm">
                {profile?.full_name?.charAt(0) || profile?.username?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-sm text-foreground">{profile?.username || 'you'}</span>
                <span className="text-muted-foreground/50">·</span>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-6 w-auto border-0 bg-transparent p-0 text-xs text-muted-foreground hover:text-foreground focus:ring-0 gap-1 shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card/95 backdrop-blur-xl border-border/50">
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value} className="text-sm">{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Textarea
                placeholder="What's new?"
                className="min-h-[80px] resize-none border-0 p-0 text-[15px] focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/40 bg-transparent"
                value={content}
                onChange={(e) => setContent(e.target.value.slice(0, MAX_LENGTH))}
                autoFocus
              />
            </div>
          </div>

          {/* GIF preview */}
          {gifUrl && (
            <div className="relative inline-block ml-13">
              <img src={gifUrl} alt="GIF" className="max-h-36 rounded-xl border border-border/30" />
              <Button variant="secondary" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-card/90 border border-border/50 shadow-md hover:bg-destructive hover:text-destructive-foreground" onClick={() => setGifUrl(null)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}

          {/* Promotion fields */}
          {category === 'promotion' && (
            <div className="ml-13 space-y-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
              <div className="flex items-center gap-2 text-sm font-medium text-amber-500">
                <Link2 className="h-4 w-4" />
                Promotion Details
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="promo-url-dialog" className="text-xs text-muted-foreground">Link URL</Label>
                <Input id="promo-url-dialog" type="url" placeholder="https://..." value={promotionUrl} onChange={(e) => setPromotionUrl(e.target.value)} className="h-9 bg-background/50 border-border/50 rounded-lg text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Cover Image (optional)</Label>
                {promotionImageUrl ? (
                  <div className="relative inline-block">
                    <img src={promotionImageUrl} alt="Cover" className="max-h-28 rounded-lg border border-border/30" />
                    <Button variant="secondary" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={() => setPromotionImageUrl('')}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <Button type="button" variant="outline" size="sm" className="h-8 rounded-lg border-dashed text-xs" disabled={isUploadingImage} onClick={() => document.getElementById('promo-image-dialog')?.click()}>
                    {isUploadingImage ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5 mr-1.5" />}
                    Upload
                  </Button>
                )}
                <input id="promo-image-dialog" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </div>
            </div>
          )}

          {/* Toolbar */}
          <div className="flex items-center gap-2 ml-13">
            <GifPicker onSelect={(url) => setGifUrl(url)} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-border/30">
          <div className="flex items-center gap-3">
            {content.length > 0 && (
              <span className={cn("text-xs font-medium", content.length > MAX_LENGTH * 0.9 ? "text-destructive" : "text-muted-foreground")}>
                {content.length}/{MAX_LENGTH}
              </span>
            )}
          </div>
          <Button
            size="sm"
            disabled={!content.trim() || createMutation.isPending}
            onClick={() => createMutation.mutate()}
            className="rounded-full px-6 h-9 text-sm font-semibold"
          >
            {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Post'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}