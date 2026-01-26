import { useQuery } from '@tanstack/react-query';
import { Crown, Medal, Trophy, Users, Loader2, Trash2, Star } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VerifiedBadge } from '@/components/ui/verified-badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

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

interface SpotlightLeaderboardProps {
  onSelectCreator: (creator: NominatedCreator) => void;
}

export default function SpotlightLeaderboard({ onSelectCreator }: SpotlightLeaderboardProps) {
  const queryClient = useQueryClient();

  // Fetch nominations with counts
  const { data: nominatedCreators = [], isLoading } = useQuery({
    queryKey: ['admin-spotlight-nominations'],
    queryFn: async () => {
      const { data: nominations, error } = await supabase
        .from('creator_nominations')
        .select('creator_id');

      if (error) throw error;
      if (!nominations || nominations.length === 0) return [];

      const nominationCounts = new Map<string, number>();
      nominations.forEach(n => {
        nominationCounts.set(n.creator_id, (nominationCounts.get(n.creator_id) || 0) + 1);
      });

      const creatorIds = [...nominationCounts.keys()];

      const { data: profiles } = await supabase
        .from('public_profiles')
        .select('id, user_id, username, full_name, avatar_url, verified, bio, is_owner')
        .in('id', creatorIds);

      if (!profiles) return [];

      const result: NominatedCreator[] = profiles.map(p => ({
        ...p,
        nomination_count: nominationCounts.get(p.id) || 0,
        isAdmin: (p as any).is_owner === true,
      }));

      return result.sort((a, b) => b.nomination_count - a.nomination_count);
    },
  });

  const handleClearNominations = async (creatorId: string, e: React.MouseEvent) => {
    e.stopPropagation();
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

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-5 w-5 text-amber-400" />;
      case 1:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 2:
        return <Medal className="h-5 w-5 text-amber-700" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">{index + 1}</span>;
    }
  };

  const getRankBg = (index: number) => {
    switch (index) {
      case 0:
        return 'bg-gradient-to-r from-amber-500/20 via-amber-400/10 to-transparent border-amber-500/30';
      case 1:
        return 'bg-gradient-to-r from-gray-400/20 via-gray-300/10 to-transparent border-gray-400/30';
      case 2:
        return 'bg-gradient-to-r from-amber-700/20 via-amber-600/10 to-transparent border-amber-700/30';
      default:
        return 'bg-muted/30 border-border/50';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (nominatedCreators.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Star className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground mb-2">No Nominations Yet</h3>
        <p className="text-sm text-muted-foreground/70 max-w-xs">
          Users will nominate creators for the spotlight. Check back at the end of the month!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          <h3 className="font-semibold text-lg">Nomination Leaderboard</h3>
        </div>
        <Badge variant="outline" className="text-muted-foreground">
          {nominatedCreators.length} creators nominated
        </Badge>
      </div>

      {/* Leaderboard */}
      <div className="space-y-2">
        {nominatedCreators.map((creator, index) => (
          <div
            key={creator.id}
            className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.01] hover:shadow-md ${getRankBg(index)}`}
            onClick={() => onSelectCreator(creator)}
          >
            {/* Rank */}
            <div className="w-8 flex items-center justify-center">
              {getRankIcon(index)}
            </div>

            {/* Avatar */}
            <Avatar className={`h-12 w-12 ring-2 ${index === 0 ? 'ring-amber-400' : index === 1 ? 'ring-gray-400' : index === 2 ? 'ring-amber-700' : 'ring-border'}`}>
              <AvatarImage src={creator.avatar_url || ''} />
              <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
                {(creator.full_name || creator.username || '?')[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-foreground truncate">
                  {creator.full_name || creator.username}
                </span>
                {creator.verified && <VerifiedBadge size="sm" isOwner={creator.isAdmin} />}
              </div>
              <span className="text-sm text-muted-foreground">@{creator.username}</span>
            </div>

            {/* Nomination Count - Prominent */}
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center px-4 py-2 rounded-lg bg-primary/10 border border-primary/20">
                <span className="text-2xl font-bold text-primary">{creator.nomination_count}</span>
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Votes</span>
              </div>

              {/* Clear button */}
              <Button
                size="icon"
                variant="ghost"
                className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0"
                onClick={(e) => handleClearNominations(creator.id, e)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer hint */}
      <p className="text-xs text-muted-foreground text-center pt-4">
        Click on a creator to add them to the spotlight
      </p>
    </div>
  );
}
