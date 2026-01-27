import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { VerifiedBadge } from '@/components/ui/verified-badge';

interface FollowUser {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  verified: boolean | null;
}

interface FollowersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string;
  type: 'followers' | 'following';
  title?: string;
}

export function FollowersDialog({
  open,
  onOpenChange,
  profileId,
  type,
  title,
}: FollowersDialogProps) {
  const navigate = useNavigate();
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open || !profileId) return;

    const fetchUsers = async () => {
      setLoading(true);
      try {
        if (type === 'followers') {
          // Get users who follow this profile
          const { data: followData } = await supabase
            .from('followers')
            .select('follower_id')
            .eq('following_id', profileId);

          if (followData && followData.length > 0) {
            const followerIds = followData.map((f) => f.follower_id);
            const { data: profiles } = await supabase
              .from('public_profiles')
              .select('id, username, full_name, avatar_url, verified')
              .in('id', followerIds);

            setUsers(profiles || []);
          } else {
            setUsers([]);
          }
        } else {
          // Get users this profile is following
          const { data: followData } = await supabase
            .from('followers')
            .select('following_id')
            .eq('follower_id', profileId);

          if (followData && followData.length > 0) {
            const followingIds = followData.map((f) => f.following_id);
            const { data: profiles } = await supabase
              .from('public_profiles')
              .select('id, username, full_name, avatar_url, verified')
              .in('id', followingIds);

            setUsers(profiles || []);
          } else {
            setUsers([]);
          }
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [open, profileId, type]);

  const handleUserClick = (username: string | null) => {
    if (!username) return;
    onOpenChange(false);
    navigate(`/@${username}`);
  };

  const displayTitle = title || (type === 'followers' ? 'Followers' : 'Following');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0">
        <SheetHeader className="px-4 py-4 border-b border-border">
          <SheetTitle className="text-center">{displayTitle}</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-80px)]">
          <div className="px-4 py-2">
            {loading ? (
              // Loading skeletons
              <div className="space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                ))}
              </div>
            ) : users.length === 0 ? (
              // Empty state
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground">
                  {type === 'followers'
                    ? 'No followers yet'
                    : 'Not following anyone yet'}
                </p>
              </div>
            ) : (
              // User list
              <div className="space-y-1">
                {users.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleUserClick(user.username)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors text-left"
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {(user.username || user.full_name || 'U')
                          .charAt(0)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-foreground truncate">
                          {user.username || 'User'}
                        </span>
                        {user.verified && <VerifiedBadge size="sm" />}
                      </div>
                      {user.full_name && (
                        <p className="text-sm text-muted-foreground truncate">
                          {user.full_name}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
