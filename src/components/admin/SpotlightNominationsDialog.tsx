import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Star, Crown, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { VerifiedBadge } from '@/components/ui/verified-badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import SpotlightLeaderboard from './SpotlightLeaderboard';

interface NominatedCreator {
  id: string;
  user_id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  verified: boolean | null;
  bio: string | null;
  nomination_count: number;
  isAdmin?: boolean;
}

interface SpotlightNominationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SpotlightNominationsDialog({ open, onOpenChange }: SpotlightNominationsDialogProps) {
  const [selectedCreator, setSelectedCreator] = useState<NominatedCreator | null>(null);
  const [headline, setHeadline] = useState('');
  const [story, setStory] = useState('');
  const [achievement, setAchievement] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const handleSelectCreator = (creator: NominatedCreator) => {
    setSelectedCreator(creator);
    setHeadline('');
    setStory(creator.bio || '');
    setAchievement('Featured Creator');
  };

  const handleAddToSpotlight = async () => {
    if (!selectedCreator || !headline.trim() || !story.trim()) {
      toast.error('Please fill in headline and story');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('creator_spotlights')
        .insert({
          profile_id: selectedCreator.id,
          headline: headline.trim(),
          story: story.trim(),
          achievement: achievement.trim() || null,
          is_active: true,
          display_order: 0,
        });

      if (error) throw error;

      await supabase
        .from('creator_nominations')
        .delete()
        .eq('creator_id', selectedCreator.id);

      toast.success(`${selectedCreator.full_name || selectedCreator.username} added to spotlight!`);
      queryClient.invalidateQueries({ queryKey: ['admin-spotlight-nominations'] });
      queryClient.invalidateQueries({ queryKey: ['creator-spotlights'] });
      setSelectedCreator(null);
      setHeadline('');
      setStory('');
      setAchievement('');
    } catch (error) {
      console.error('Error adding spotlight:', error);
      toast.error('Failed to add creator to spotlight');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    setSelectedCreator(null);
    setHeadline('');
    setStory('');
    setAchievement('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b border-border/50">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <Crown className="h-5 w-5 text-amber-500" />
            {selectedCreator ? 'Add to Spotlight' : 'Nomination Leaderboard'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto p-6">
          {selectedCreator ? (
            // Spotlight Form
            <div className="space-y-6">
              <Button variant="ghost" size="sm" onClick={handleBack} className="mb-2">
                ← Back to Leaderboard
              </Button>

              <div className="flex items-center gap-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <Avatar className="h-14 w-14 ring-2 ring-amber-400">
                  <AvatarImage src={selectedCreator.avatar_url || ''} />
                  <AvatarFallback className="bg-amber-500/20 text-amber-600 font-bold">
                    {(selectedCreator.full_name || selectedCreator.username || '?')[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold">{selectedCreator.full_name || selectedCreator.username}</span>
                    {selectedCreator.verified && <VerifiedBadge size="sm" isOwner={selectedCreator.isAdmin} />}
                  </div>
                  <span className="text-sm text-muted-foreground">@{selectedCreator.username}</span>
                  <p className="text-sm text-amber-600 mt-1">{selectedCreator.nomination_count} nominations</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="headline">Headline *</Label>
                  <Input
                    id="headline"
                    placeholder="e.g., Building Amazing Presets"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="story">Story *</Label>
                  <Textarea
                    id="story"
                    placeholder="Their journey and contribution..."
                    value={story}
                    onChange={(e) => setStory(e.target.value)}
                    className="h-32 resize-none"
                  />
                </div>

                <div>
                  <Label htmlFor="achievement">Achievement Badge</Label>
                  <Input
                    id="achievement"
                    placeholder="e.g., Top Seller, Community Hero"
                    value={achievement}
                    onChange={(e) => setAchievement(e.target.value)}
                  />
                </div>
              </div>

              <Button
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-amber-950"
                onClick={handleAddToSpotlight}
                disabled={isSubmitting || !headline.trim() || !story.trim()}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Crown className="h-4 w-4 mr-2" />
                )}
                Add to Spotlight
              </Button>
            </div>
          ) : (
            // Leaderboard View
            <SpotlightLeaderboard onSelectCreator={handleSelectCreator} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
