import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Users, Loader2 } from 'lucide-react';
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
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

interface Creator {
  id: string;
  user_id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  verified: boolean | null;
  followers_count: number;
  isAdmin?: boolean;
}

interface NominateCreatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NominateCreatorDialog({ open, onOpenChange }: NominateCreatorDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch top 20 most followed creators
  const { data: creators = [], isLoading } = useQuery({
    queryKey: ['top-creators-for-nomination'],
    queryFn: async () => {
      // Get all creators
      const { data: creatorsData, error } = await supabase
        .from('profiles')
        .select('id, user_id, username, full_name, avatar_url, verified')
        .eq('is_creator', true)
        .not('username', 'is', null);

      if (error) throw error;
      if (!creatorsData || creatorsData.length === 0) return [];

      // Get follower counts for all creators
      const creatorIds = creatorsData.map(c => c.id);
      const { data: followersData } = await supabase
        .from('followers')
        .select('following_id')
        .in('following_id', creatorIds);

      // Count followers per creator
      const followerCountMap = new Map<string, number>();
      followersData?.forEach(f => {
        followerCountMap.set(f.following_id, (followerCountMap.get(f.following_id) || 0) + 1);
      });

      // Fetch admin roles
      const userIds = creatorsData.map(c => c.user_id).filter(Boolean);
      const { data: adminRoles } = userIds.length
        ? await supabase.from('user_roles').select('user_id').eq('role', 'admin').in('user_id', userIds)
        : { data: [] };
      const adminUserIds = new Set(adminRoles?.map(r => r.user_id) || []);

      // Build creators with follower counts and admin status
      const creatorsWithData: Creator[] = creatorsData.map(creator => ({
        ...creator,
        followers_count: followerCountMap.get(creator.id) || 0,
        isAdmin: adminUserIds.has(creator.user_id),
      }));

      // Sort by followers (descending) and take top 20
      return creatorsWithData
        .sort((a, b) => b.followers_count - a.followers_count)
        .slice(0, 20);
    },
    enabled: open,
  });

  // Filter creators based on search
  const filteredCreators = useMemo(() => {
    if (!searchQuery.trim()) return creators;
    const query = searchQuery.toLowerCase();
    return creators.filter(
      c =>
        c.username?.toLowerCase().includes(query) ||
        c.full_name?.toLowerCase().includes(query)
    );
  }, [creators, searchQuery]);

  const handleNominate = (creator: Creator) => {
    toast.success(`You nominated @${creator.username} for spotlight!`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] p-0 gap-0">
        <DialogHeader className="p-4 pb-2 border-b border-border/50">
          <DialogTitle className="text-lg font-semibold">Nominate a Creator</DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="p-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search creators..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Top 20 most followed creators
          </p>
        </div>

        {/* Creators List */}
        <ScrollArea className="flex-1 max-h-[50vh]">
          <div className="p-4 pt-2 space-y-2">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredCreators.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                No creators found
              </div>
            ) : (
              filteredCreators.map((creator, index) => (
                <div
                  key={creator.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border/50 hover:border-primary/50 hover:bg-muted/30 transition-all group"
                >
                  {/* Rank */}
                  <span className="text-sm font-medium text-muted-foreground w-5 text-center">
                    {index + 1}
                  </span>

                  {/* Avatar */}
                  <Link to={creator.username ? `/@${creator.username}` : '#'}>
                    <Avatar className="h-10 w-10 ring-2 ring-border group-hover:ring-primary/50 transition-all">
                      <AvatarImage src={creator.avatar_url || ''} />
                      <AvatarFallback className="bg-muted text-muted-foreground">
                        {(creator.full_name || creator.username || '?')[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Link
                        to={creator.username ? `/@${creator.username}` : '#'}
                        className="font-medium text-foreground hover:text-primary transition-colors truncate"
                      >
                        {creator.full_name || creator.username}
                      </Link>
                      {creator.verified && <VerifiedBadge size="sm" isOwner={creator.isAdmin} />}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>@{creator.username}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {creator.followers_count.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Nominate Button */}
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0"
                    onClick={() => handleNominate(creator)}
                  >
                    Nominate
                  </Button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
