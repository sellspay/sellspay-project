import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { X, Loader2, Link2, ImagePlus, Crown, Lock, Image, List, MapPin, MoreHorizontal, Copy, Clock, ArrowLeft, FileText } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { GifPicker } from '@/components/comments/GifPicker';
import { EmojiPicker } from '@/components/community/thread-composer/EmojiPicker';
import { PollCreator, type PollData } from '@/components/community/thread-composer/PollCreator';
import { LocationPicker } from '@/components/community/thread-composer/LocationPicker';
import { ReplyOptions, type ReplySettings } from '@/components/community/thread-composer/ReplyOptions';
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
  const [poll, setPoll] = useState<PollData | null>(null);
  const [location, setLocation] = useState<string | null>(null);
  const [locationOpen, setLocationOpen] = useState(false);
  const [replySettings, setReplySettings] = useState<ReplySettings>({ whoCanReply: 'anyone', reviewReplies: false });
  const [view, setView] = useState<'compose' | 'drafts' | 'text-attachment'>('compose');
  const [textAttachment, setTextAttachment] = useState('');
  const [isAiLabeled, setIsAiLabeled] = useState(false);
  const [isPaidPartnership, setIsPaidPartnership] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);

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

  const handleEmojiSelect = (emoji: string) => {
    setContent(prev => prev + emoji);
  };

  const togglePoll = () => {
    if (poll) {
      setPoll(null);
    } else {
      setPoll({ options: ['', ''], duration: '24h' });
    }
  };

  const resetState = () => {
    setContent('');
    setGifUrl(null);
    setCategory('discussion');
    setPromotionUrl('');
    setPromotionImageUrl('');
    setPoll(null);
    setLocation(null);
    setTextAttachment('');
    setIsAiLabeled(false);
    setIsPaidPartnership(false);
    setScheduledDate(null);
    setScheduleOpen(false);
    setReplySettings({ whoCanReply: 'anyone', reviewReplies: false });
    setView('compose');
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.id) throw new Error('Must be logged in');
      if (!content.trim()) throw new Error('Content is required');
      if (!canPostThreads) throw new Error('Subscription required');

      let finalContent = content.trim();
      if (category === 'promotion' && promotionUrl) {
        finalContent += `\n\n🔗 ${promotionUrl}`;
      }
      if (location) {
        finalContent += `\n\n📍 ${location}`;
      }
      if (textAttachment) {
        finalContent += `\n\n${textAttachment}`;
      }
      if (isAiLabeled) finalContent = `[AI Generated] ${finalContent}`;
      if (isPaidPartnership) finalContent = `[Paid Partnership] ${finalContent}`;

      const imageUrl = promotionImageUrl || null;
      const { data: threadData, error } = await supabase.from('threads').insert({
        author_id: profile.id,
        content: finalContent,
        category,
        gif_url: gifUrl,
        image_url: imageUrl,
      }).select('id').single();
      if (error) throw error;

      // Create poll if present
      if (poll && threadData) {
        const pollOptions = poll.options.filter(o => o.trim());
        if (pollOptions.length >= 2) {
          const durationMs = poll.duration === '24h' ? 86400000 : poll.duration === '3d' ? 259200000 : 604800000;
          const expiresAt = new Date(Date.now() + durationMs).toISOString();
          const { error: pollError } = await supabase.from('thread_polls').insert({
            thread_id: threadData.id,
            options: pollOptions,
            duration: poll.duration,
            expires_at: expiresAt,
          });
          if (pollError) throw pollError;
        }
      }
    },
    onSuccess: () => {
      resetState();
      queryClient.invalidateQueries({ queryKey: ['threads'] });
      queryClient.invalidateQueries({ queryKey: ['threads-count'] });
      toast.success('Thread posted');
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to post thread');
    },
  });

  if (!user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-card border-border/50 sm:max-w-[520px] rounded-2xl p-0 gap-0 [&>button]:hidden">
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
        <DialogContent className="bg-card border-border/50 sm:max-w-[520px] rounded-2xl p-0 gap-0 [&>button]:hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => onOpenChange(false)}>
              <X className="h-5 w-5" />
            </Button>
            <h2 className="text-base font-bold text-foreground">New thread</h2>
            <div className="w-8" />
          </div>
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

  // Drafts view
  if (view === 'drafts') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-card border-border/50 sm:max-w-[520px] rounded-2xl p-0 gap-0 [&>button]:hidden max-h-[80vh] flex flex-col">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border/30">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setView('compose')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-sm font-bold text-foreground flex-1 text-center pr-8">Drafts</h2>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="inline-flex p-4 rounded-2xl bg-muted/30 mb-4">
              <FileText className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <h3 className="text-base font-medium text-muted-foreground mb-1">No drafts yet</h3>
            <p className="text-sm text-muted-foreground/60">Your drafts will appear here.</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Text attachment view
  if (view === 'text-attachment') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-card border-border/50 sm:max-w-[520px] rounded-2xl p-0 gap-0 [&>button]:hidden max-h-[80vh] flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setView('compose')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-sm font-bold text-foreground">Text attachment</h2>
            <Button
              variant="ghost"
              size="sm"
              className="text-sm font-semibold text-primary"
              onClick={() => setView('compose')}
            >
              Done
            </Button>
          </div>
          <div className="flex-1 p-4">
            <Textarea
              placeholder="Say even more..."
              value={textAttachment}
              onChange={(e) => setTextAttachment(e.target.value)}
              autoFocus
              className="min-h-[200px] resize-none border-0 p-0 text-[15px] leading-relaxed focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/40 bg-transparent"
            />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetState(); onOpenChange(v); }}>
      <DialogContent className="bg-card border-border/50 sm:max-w-[520px] rounded-2xl p-0 gap-0 [&>button]:hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => { resetState(); onOpenChange(false); }}>
            <X className="h-5 w-5" />
          </Button>
          <h2 className="text-sm font-bold text-foreground">New thread</h2>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setView('drafts')}>
              <Copy className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 bg-popover border-border/50 shadow-lg">
                <DropdownMenuItem
                  onSelect={(e) => { e.preventDefault(); setIsAiLabeled(!isAiLabeled); }}
                  className="text-sm cursor-pointer flex items-center justify-between"
                >
                  Add AI label
                  {isAiLabeled && <span className="text-primary font-bold">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={(e) => { e.preventDefault(); setIsPaidPartnership(!isPaidPartnership); }}
                  className="text-sm cursor-pointer flex items-center justify-between"
                >
                  Mark as paid partnership
                  {isPaidPartnership && <span className="text-primary font-bold">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-sm cursor-pointer flex items-center justify-between"
                  onSelect={(e) => { e.preventDefault(); setScheduleOpen(true); }}
                >
                  {scheduledDate ? `Scheduled: ${scheduledDate.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}` : 'Schedule...'}
                  <Clock className={cn("h-4 w-4", scheduledDate ? "text-primary" : "text-muted-foreground")} />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Labels bar */}
        {(isAiLabeled || isPaidPartnership || location || scheduledDate) && (
          <div className="flex flex-wrap items-center gap-1.5 px-4 pt-3">
            {isAiLabeled && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/15 text-[11px] font-semibold text-blue-400 border border-blue-500/20">
                🤖 AI Generated
                <button onClick={() => setIsAiLabeled(false)} className="hover:text-blue-200 ml-0.5"><X className="h-3 w-3" /></button>
              </span>
            )}
            {isPaidPartnership && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 text-[11px] font-semibold text-amber-400 border border-amber-500/20">
                💰 Paid Partnership
                <button onClick={() => setIsPaidPartnership(false)} className="hover:text-amber-200 ml-0.5"><X className="h-3 w-3" /></button>
              </span>
            )}
            {location && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-500/15 text-[11px] font-semibold text-green-400 border border-green-500/20">
                📍 {location}
                <button onClick={() => setLocation(null)} className="hover:text-green-200 ml-0.5"><X className="h-3 w-3" /></button>
              </span>
            )}
            {scheduledDate && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-500/15 text-[11px] font-semibold text-purple-400 border border-purple-500/20">
                🕐 {scheduledDate.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                <button onClick={() => setScheduledDate(null)} className="hover:text-purple-200 ml-0.5"><X className="h-3 w-3" /></button>
              </span>
            )}
          </div>
        )}

        {/* Compose area */}
        <div className="px-4 py-4">
          <div className="flex items-start gap-3">
            <div className="flex flex-col items-center gap-2">
              <Avatar className="h-9 w-9 ring-1 ring-border/50 shrink-0">
                <AvatarImage src={profile?.avatar_url || ''} />
                <AvatarFallback className="bg-muted text-foreground font-semibold text-sm">
                  {profile?.full_name?.charAt(0) || profile?.username?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="w-0.5 flex-1 bg-border/40 rounded-full min-h-[24px]" />
            </div>
            <div className="flex-1 min-w-0 pb-4">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="font-bold text-sm text-foreground">{profile?.username || 'you'}</span>
                <span className="text-muted-foreground/40">›</span>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-auto w-auto border-0 bg-transparent p-0 text-xs text-muted-foreground hover:text-foreground focus:ring-0 gap-0.5 shadow-none font-normal">
                    <SelectValue placeholder="Add a topic" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border/50 shadow-lg">
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value} className="text-sm">{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Textarea
                placeholder="What's new?"
                className="min-h-[60px] resize-none border-0 p-0 text-[15px] leading-relaxed focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/40 bg-transparent"
                value={content}
                onChange={(e) => setContent(e.target.value.slice(0, MAX_LENGTH))}
                autoFocus
              />

              {/* GIF preview */}
              {gifUrl && (
                <div className="relative inline-block mt-2">
                  <img src={gifUrl} alt="GIF" className="max-h-36 rounded-xl border border-border/30" />
                  <Button variant="secondary" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-card border border-border/50 shadow-md hover:bg-destructive hover:text-destructive-foreground" onClick={() => setGifUrl(null)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}

              {/* Image preview */}
              {promotionImageUrl && !gifUrl && (
                <div className="relative inline-block mt-2">
                  <img src={promotionImageUrl} alt="Upload" className="max-h-36 rounded-xl border border-border/30" />
                  <Button variant="secondary" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-card border border-border/50 shadow-md hover:bg-destructive hover:text-destructive-foreground" onClick={() => setPromotionImageUrl('')}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}

              {/* Text attachment preview */}
              {textAttachment && (
                <div className="mt-2 p-2.5 rounded-lg bg-muted/30 border border-border/30">
                  <p className="text-xs text-muted-foreground line-clamp-2">{textAttachment}</p>
                  <button onClick={() => setView('text-attachment')} className="text-xs text-primary mt-1">Edit attachment</button>
                </div>
              )}

              {/* Promotion fields */}
              {category === 'promotion' && (
                <div className="mt-3 space-y-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                  <div className="flex items-center gap-2 text-xs font-medium text-amber-500">
                    <Link2 className="h-3.5 w-3.5" />
                    Promotion Details
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="promo-url-dialog" className="text-xs text-muted-foreground">Link URL</Label>
                    <Input id="promo-url-dialog" type="url" placeholder="https://..." value={promotionUrl} onChange={(e) => setPromotionUrl(e.target.value)} className="h-9 bg-background/50 border-border/50 rounded-lg text-sm" />
                  </div>
                </div>
              )}

              {/* Poll */}
              {poll && (
                <PollCreator poll={poll} onChange={setPoll} onRemove={() => setPoll(null)} />
              )}

              {/* Media toolbar */}
              <div className="flex items-center gap-1 mt-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
                  onClick={() => document.getElementById('thread-image-upload')?.click()}
                  disabled={isUploadingImage}
                >
                  {isUploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Image className="h-4 w-4" />}
                </Button>
                <input id="thread-image-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                <GifPicker onSelect={(url) => setGifUrl(url)} />
                <EmojiPicker onSelect={handleEmojiSelect} />
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn("h-7 w-7 rounded-full text-muted-foreground hover:text-foreground", poll && "text-primary")}
                  onClick={togglePoll}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
                  onClick={() => setView('text-attachment')}
                >
                  <FileText className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn("h-7 w-7 rounded-full text-muted-foreground hover:text-foreground", location && "text-primary")}
                  onClick={() => setLocationOpen(true)}
                >
                  <MapPin className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* "Add to thread" row */}
          <div className="flex items-center gap-3 pl-1">
            <Avatar className="h-5 w-5 opacity-40">
              <AvatarImage src={profile?.avatar_url || ''} />
              <AvatarFallback className="bg-muted text-foreground text-[10px]">
                {profile?.full_name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground/50">Add to thread</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border/30">
          <div className="flex items-center gap-3">
            <ReplyOptions settings={replySettings} onChange={setReplySettings} />
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
            className="rounded-xl px-5 h-9 text-sm font-semibold"
          >
            {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : scheduledDate ? 'Schedule' : 'Post'}
          </Button>
        </div>
      </DialogContent>

      {/* Location picker dialog */}
      <LocationPicker open={locationOpen} onOpenChange={setLocationOpen} onSelect={setLocation} />

      {/* Schedule dialog */}
      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent className="bg-card border-border/50 sm:max-w-[340px] rounded-2xl p-0 gap-0 [&>button]:hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setScheduleOpen(false)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-sm font-bold text-foreground">Schedule post</h2>
            <div className="w-8" />
          </div>
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Date & time</Label>
              <Input
                type="datetime-local"
                min={new Date().toISOString().slice(0, 16)}
                value={scheduledDate ? new Date(scheduledDate.getTime() - scheduledDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                onChange={(e) => setScheduledDate(e.target.value ? new Date(e.target.value) : null)}
                className="h-10 bg-background/50 border-border/50 rounded-lg text-sm"
              />
            </div>
            <div className="flex gap-2">
              {scheduledDate && (
                <Button variant="outline" size="sm" className="flex-1 rounded-lg" onClick={() => { setScheduledDate(null); setScheduleOpen(false); }}>
                  Remove
                </Button>
              )}
              <Button
                size="sm"
                className="flex-1 rounded-lg"
                disabled={!scheduledDate}
                onClick={() => setScheduleOpen(false)}
              >
                Set schedule
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
