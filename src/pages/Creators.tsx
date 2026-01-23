import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Search, Users, Package, UserPlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { VerifiedBadge } from '@/components/ui/verified-badge';
import { useAuth } from '@/lib/auth';

interface Creator {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_creator: boolean | null;
  verified: boolean | null;
  productCount?: number;
  followersCount?: number;
  followingCount?: number;
}

export default function Creators() {
  const { user } = useAuth();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check if current user is admin
    setIsAdmin(user?.email === 'vizual90@gmail.com');
  }, [user]);

  useEffect(() => {
    async function fetchCreators() {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, bio, is_creator, verified')
        .eq('is_creator', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to load creators:', error);
        setCreators([]);
        setLoading(false);
        return;
      }

      // Fetch counts for each creator
      const creatorsWithCounts = await Promise.all(
        (data || []).map(async (creator) => {
          // Get product count
          const { count: productCount } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('creator_id', creator.id)
            .eq('status', 'published');

          // Get followers count
          const { count: followersCount } = await supabase
            .from('followers')
            .select('*', { count: 'exact', head: true })
            .eq('following_id', creator.id);

          // Get following count
          const { count: followingCount } = await supabase
            .from('followers')
            .select('*', { count: 'exact', head: true })
            .eq('follower_id', creator.id);

          return {
            ...creator,
            productCount: productCount || 0,
            followersCount: followersCount || 0,
            followingCount: followingCount || 0,
          };
        })
      );

      setCreators(creatorsWithCounts);
      setLoading(false);
    }

    fetchCreators();
  }, []);

  const filteredCreators = creators.filter((creator) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      creator.username?.toLowerCase().includes(searchLower) ||
      creator.full_name?.toLowerCase().includes(searchLower) ||
      creator.bio?.toLowerCase().includes(searchLower)
    );
  });

  // Check if a creator is the admin
  const isCreatorAdmin = (creatorId: string) => {
    // This is a simple check - in production you'd check against user_id
    return creators.find(c => c.id === creatorId)?.username?.toLowerCase() === 'yaboyvis';
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Creators</h1>
            </div>
            <p className="text-muted-foreground">Discover and follow talented creators in our community</p>
          </div>

          {/* Search */}
          <div className="relative max-w-md mb-8">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search creators..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Creators Grid */}
          {loading ? (
            <div className="text-center text-muted-foreground py-16">Loading creators...</div>
          ) : filteredCreators.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? 'No creators found matching your search' : 'No creators yet. Be the first to become one!'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCreators.map((creator) => {
                const creatorIsAdmin = isCreatorAdmin(creator.id);
                
                return (
                  <Link
                    key={creator.id}
                    to={`/@${creator.username || creator.id}`}
                    className="group p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-all"
                  >
                    <div className="flex flex-col items-center text-center">
                      <Avatar className="w-20 h-20 mb-4">
                        <AvatarImage src={creator.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/20 text-primary text-xl">
                          {(creator.username || 'C').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      {/* Name with verified badge */}
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <h3 className="font-semibold text-foreground group-hover:text-foreground/80 transition-colors">
                          {creator.full_name || creator.username || 'Creator'}
                        </h3>
                        {creator.verified && (
                          <VerifiedBadge isAdmin={creatorIsAdmin} size="sm" />
                        )}
                      </div>
                      
                      {/* Username */}
                      <p className="text-sm text-primary mb-2">
                        @{creator.username || 'creator'}
                      </p>
                      
                      {/* Bio/Description */}
                      {creator.bio && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                          {creator.bio}
                        </p>
                      )}
                      
                      {/* Stats row with icons */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-auto">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1">
                              <Package className="w-3.5 h-3.5" />
                              <span>{creator.productCount}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent><p>Products</p></TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5" />
                              <span>{creator.followersCount}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent><p>Followers</p></TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1">
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>{creator.followingCount}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent><p>Following</p></TooltipContent>
                        </Tooltip>
                      </div>
                      
                      {/* Owner badge */}
                      <Badge variant="outline" className="mt-3 text-muted-foreground border-muted-foreground/30">
                        Owner
                      </Badge>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
