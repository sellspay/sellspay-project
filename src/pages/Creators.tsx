import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Search, Users, Package, UserPlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { VerifiedBadge } from '@/components/ui/verified-badge';
import { useAuth, checkUserRole } from '@/lib/auth';

interface Creator {
  id: string;
  user_id: string | null;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_creator: boolean | null;
  verified: boolean | null;
  productCount?: number;
  followersCount?: number;
  followingCount?: number;
  isOwner?: boolean;
}

export default function Creators() {
  const { user } = useAuth();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check if current user is admin via database
    if (user) {
      checkUserRole('admin').then(setIsAdmin);
    } else {
      setIsAdmin(false);
    }
  }, [user]);

  useEffect(() => {
    async function fetchCreators() {
      // Use public_profiles view for public access - includes is_owner computed field
      const { data, error } = await supabase
        .from('public_profiles')
        .select('id, user_id, username, full_name, avatar_url, bio, is_creator, verified, is_owner')
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
            isOwner: (creator as any).is_owner === true,
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


  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        {/* Hero Header */}
        <div className="relative overflow-hidden border-b border-border/50">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
          <div className="relative max-w-7xl mx-auto px-6 py-16 lg:py-20">
            <div className="max-w-2xl">
              <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-4">
                Creators
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Discover and follow talented creators in our community. Explore their work, connect, and get inspired.
              </p>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-7xl mx-auto px-6 py-12">
          {/* Search & Stats Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search creators..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 h-11 bg-card border-border/50"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {filteredCreators.length} {filteredCreators.length === 1 ? 'creator' : 'creators'} found
            </p>
          </div>

          {/* Creators Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent mb-4" />
              <p className="text-muted-foreground">Loading creators...</p>
            </div>
          ) : filteredCreators.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-6">
                <Users className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No creators found</h3>
              <p className="text-muted-foreground max-w-sm">
                {searchQuery ? 'Try adjusting your search terms' : 'Be the first to become a creator!'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCreators.map((creator) => (
                <Link
                  key={creator.id}
                  to={`/@${creator.username || creator.id}`}
                  className="group relative overflow-hidden rounded-2xl transition-all duration-500 hover:scale-[1.02]"
                >
                  {/* Glossy gradient border */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/40 via-violet-500/30 to-fuchsia-500/40 p-[1px]">
                    <div className="absolute inset-[1px] rounded-2xl bg-card" />
                  </div>
                  
                  {/* Glossy shine overlay */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  
                  {/* Glass reflection stripe */}
                  <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/5 to-transparent rounded-t-2xl pointer-events-none" />
                  
                  {/* Content */}
                  <div className="relative p-6 backdrop-blur-sm">
                    <div className="flex flex-col items-center text-center">
                      {/* Avatar with glow */}
                      <div className="relative mb-4">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/50 to-violet-500/50 blur-xl opacity-0 group-hover:opacity-60 transition-opacity duration-500 scale-150" />
                        <Avatar className="relative w-20 h-20 ring-2 ring-white/10 group-hover:ring-primary/50 transition-all duration-300 shadow-lg shadow-black/20">
                          <AvatarImage src={creator.avatar_url || undefined} className="object-cover" />
                          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-violet-500/20 text-primary text-xl font-medium">
                            {(creator.username || 'C').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      
                      {/* Name with verified badge */}
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors duration-300">
                          {creator.full_name || creator.username || 'Creator'}
                        </h3>
                        {creator.verified && (
                          <VerifiedBadge isOwner={creator.isOwner} size="sm" />
                        )}
                      </div>
                      
                      {/* Username */}
                      <p className="text-sm bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent font-medium mb-2">
                        @{creator.username || 'creator'}
                      </p>
                      
                      {/* Bio/Description */}
                      {creator.bio && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-4 min-h-[2rem]">
                          {creator.bio}
                        </p>
                      )}
                      {!creator.bio && <div className="mb-4 min-h-[2rem]" />}
                      
                      {/* Stats row with glass effect */}
                      <div className="flex items-center justify-center gap-4 text-xs w-full py-3 px-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1.5 text-muted-foreground group-hover:text-foreground transition-colors">
                              <Package className="w-3.5 h-3.5" />
                              <span className="font-semibold">{creator.productCount}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent><p>Products</p></TooltipContent>
                        </Tooltip>
                        
                        <div className="w-px h-3 bg-white/10" />
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1.5 text-muted-foreground group-hover:text-foreground transition-colors">
                              <Users className="w-3.5 h-3.5" />
                              <span className="font-semibold">{creator.followersCount}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent><p>Followers</p></TooltipContent>
                        </Tooltip>
                        
                        <div className="w-px h-3 bg-white/10" />
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1.5 text-muted-foreground group-hover:text-foreground transition-colors">
                              <UserPlus className="w-3.5 h-3.5" />
                              <span className="font-semibold">{creator.followingCount}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent><p>Following</p></TooltipContent>
                        </Tooltip>
                      </div>
                      
                      {/* Owner badge - premium style */}
                      {creator.isOwner && (
                        <div className="mt-3 px-3 py-1 rounded-full bg-gradient-to-r from-primary/20 to-violet-500/20 border border-primary/30">
                          <span className="text-xs font-medium bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
                            Owner
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
