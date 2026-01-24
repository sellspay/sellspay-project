import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Star, Search, Users, Loader2, Crown, Plus, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { VerifiedBadge } from '@/components/ui/verified-badge';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCreator, setSelectedCreator] = useState<NominatedCreator | null>(null);
  const [headline, setHeadline] = useState('');
  const [story, setStory] = useState('');
  const [achievement, setAchievement] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  // Fetch nominations with counts
  const { data: nominatedCreators = [], isLoading } = useQuery({
    queryKey: ['admin-spotlight-nominations'],
    queryFn: async () => {
      // Get all nominations
      const { data: nominations, error } = await supabase
        .from('creator_nominations')
        .select('creator_id');

      if (error) throw error;
      if (!nominations || nominations.length === 0) return [];

      // Count nominations per creator
      const nominationCounts = new Map<string, number>();
      nominations.forEach(n => {
        nominationCounts.set(n.creator_id, (nominationCounts.get(n.creator_id) || 0) + 1);
      });

      // Get unique creator IDs
      const creatorIds = [...nominationCounts.keys()];

      // Fetch profiles for these creators
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, user_id, username, full_name, avatar_url, verified, bio')
        .in('id', creatorIds);

      if (!profiles) return [];

      // Fetch owner roles
      const userIds = profiles.map(p => p.user_id).filter(Boolean);
      const { data: ownerRoles } = userIds.length
        ? await supabase.from('user_roles').select('user_id').eq('role', 'owner').in('user_id', userIds)
        : { data: [] };
      const adminUserIds = new Set(ownerRoles?.map(r => r.user_id) || []);

      // Build result with nomination counts
      const result: NominatedCreator[] = profiles.map(p => ({
        ...p,
        nomination_count: nominationCounts.get(p.id) || 0,
        isAdmin: adminUserIds.has(p.user_id),
      }));

      // Sort by nomination count descending
      return result.sort((a, b) => b.nomination_count - a.nomination_count);
    },
    enabled: open,
  });

  // Filter by search
  const filteredCreators = useMemo(() => {
    if (!searchQuery.trim()) return nominatedCreators;
    const query = searchQuery.toLowerCase();
    return nominatedCreators.filter(
      c => c.username?.toLowerCase().includes(query) || c.full_name?.toLowerCase().includes(query)
    );
  }, [nominatedCreators, searchQuery]);

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
      // Add to creator_spotlights
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

      // Clear nominations for this creator
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

  const handleClearNominations = async (creatorId: string) => {
    try {
      const { error } = await supabase
        .from('creator_nominations')
        .delete()
        .eq('creator_id', creatorId);

      if (error) throw error;
      toast.success('Nominations cleared');
      queryClient.invalidateQueries({ queryKey: ['admin-spotlight-nominations'] });
    } catch (error) {
      console.error('Error clearing nominations:', error);
      toast.error('Failed to clear nominations');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0 gap-0">
        <DialogHeader className="p-4 pb-2 border-b border-border/50">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <Star className="h-5 w-5 text-amber-500" />
            Creator Spotlight Nominations
          </DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-0 h-[60vh]">
          {/* Left: Nominations List */}
          <div className="border-r border-border/50 flex flex-col">
            <div className="p-4 pb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search nominees..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {nominatedCreators.length} creators with nominations
              </p>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-4 pt-2 space-y-2">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredCreators.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground text-sm">
                    No nominations yet
                  </div>
                ) : (
                  filteredCreators.map((creator) => (
                    <div
                      key={creator.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                        selectedCreator?.id === creator.id
                          ? 'border-amber-500 bg-amber-500/10'
                          : 'border-border/50 hover:border-primary/50 hover:bg-muted/30'
                      }`}
                      onClick={() => handleSelectCreator(creator)}
                    >
                      <Avatar className="h-10 w-10 ring-2 ring-border">
                        <AvatarImage src={creator.avatar_url || ''} />
                        <AvatarFallback className="bg-muted text-muted-foreground">
                          {(creator.full_name || creator.username || '?')[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-foreground truncate">
                            {creator.full_name || creator.username}
                          </span>
                          {creator.verified && <VerifiedBadge size="sm" isOwner={creator.isAdmin} />}
                        </div>
                        <span className="text-xs text-muted-foreground">@{creator.username}</span>
                      </div>

                      <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                        <Users className="h-3 w-3 mr-1" />
                        {creator.nomination_count}
                      </Badge>

                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClearNominations(creator.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Right: Spotlight Form */}
          <div className="flex flex-col p-4">
            {selectedCreator ? (
              <>
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border/50">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={selectedCreator.avatar_url || ''} />
                    <AvatarFallback>
                      {(selectedCreator.full_name || selectedCreator.username || '?')[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{selectedCreator.full_name || selectedCreator.username}</span>
                      {selectedCreator.verified && <VerifiedBadge size="sm" isOwner={selectedCreator.isAdmin} />}
                    </div>
                    <span className="text-sm text-muted-foreground">@{selectedCreator.username}</span>
                  </div>
                </div>

                <div className="space-y-4 flex-1">
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
                      className="h-24 resize-none"
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
                  className="mt-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
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
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center text-muted-foreground">
                <div>
                  <Star className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>Select a nominated creator to add them to the spotlight</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
