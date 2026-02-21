import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Star, Users, Package, Quote, ChevronRight, Crown, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { VerifiedBadge } from '@/components/ui/verified-badge';
import { NominateCreatorDialog } from '@/components/community/NominateCreatorDialog';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

interface SpotlightCreator {
  id: string;
  headline: string;
  story: string;
  achievement: string | null;
  quote: string | null;
  featured_at: string;
  profile: {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
    verified: boolean | null;
    bio: string | null;
    isAdmin?: boolean;
  } | null;
  products_count: number;
  followers_count: number;
}

export default function Spotlight() {
  const [expandedStory, setExpandedStory] = useState<string | null>(null);
  const [nominateDialogOpen, setNominateDialogOpen] = useState(false);

  const { data: spotlights = [], isLoading } = useQuery({
    queryKey: ['creator-spotlights'],
    queryFn: async () => {
      const { data: spotlightsData, error } = await supabase.rpc('get_active_spotlights' as any);
      if (error) { console.error('Spotlight fetch error:', error); return []; }
      if (!spotlightsData || spotlightsData.length === 0) return [];

      const userIds = spotlightsData.map((s: any) => s.profile_user_id).filter(Boolean);
      const { data: profilesWithOwner } = await supabase
        .from('public_profiles')
        .select('user_id, is_owner')
        .in('user_id', userIds);
      
      const adminUserIds = new Set<string>(
        (profilesWithOwner || []).filter((p: any) => p.is_owner).map((p: any) => p.user_id)
      );

      const spotlightsWithData = await Promise.all(spotlightsData.map(async (s: any) => {
        const [productsResult, followersResult] = await Promise.all([
          supabase.from('products').select('id', { count: 'exact', head: true }).eq('creator_id', s.profile_id),
          supabase.from('followers').select('id', { count: 'exact', head: true }).eq('following_id', s.profile_id),
        ]);

        return {
          id: s.id,
          headline: s.headline,
          story: s.story,
          achievement: s.achievement,
          quote: s.quote,
          featured_at: s.featured_at,
          profile: {
            id: s.profile_id,
            user_id: s.profile_user_id,
            username: s.profile_username,
            full_name: s.profile_full_name,
            avatar_url: s.profile_avatar_url,
            verified: s.profile_verified,
            bio: s.profile_bio,
            isAdmin: adminUserIds.has(s.profile_user_id),
          },
          products_count: productsResult.count || 0,
          followers_count: followersResult.count || 0,
        };
      }));

      return spotlightsWithData as SpotlightCreator[];
    },
  });

  const featuredCreator = spotlights[0];
  const pastSpotlights = spotlights.slice(1);

  return (
    <div className="min-h-screen bg-background">
      {/* Compact Header */}
      <section className="border-b border-border/40 bg-background">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 pt-12 sm:pt-16 pb-8 sm:pb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-amber-500/10">
              <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
            </div>
            <span className="text-sm font-medium text-amber-500 tracking-wide uppercase">Celebrating Excellence</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-2">
            Creator Spotlight
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg mb-6">
            Discover the inspiring journeys of creators who've made an impact.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
            onClick={() => setNominateDialogOpen(true)}
          >
            <Crown className="h-4 w-4 mr-2" />
            Nominate a Creator
          </Button>
        </div>
      </section>

      {/* Featured Creator */}
      {isLoading ? (
        <section className="py-16 px-4 sm:px-6">
          <div className="mx-auto max-w-4xl flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </section>
      ) : featuredCreator ? (
        <section className="py-8 sm:py-12 px-4 sm:px-6">
          <div className="mx-auto max-w-4xl">
            <div className="text-sm font-medium text-amber-500 mb-4 flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Featured Creator
            </div>

            <div className="border border-border/40 rounded-2xl overflow-hidden bg-card/50">
              <div className="h-1 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500" />
              
              <div className="grid md:grid-cols-3 gap-0">
                <div className="p-6 sm:p-8 md:col-span-2">
                  <div className="flex items-center gap-4 mb-6">
                    <Avatar className="h-16 w-16 sm:h-20 sm:w-20 border-2 border-amber-500/30">
                      <AvatarImage src={featuredCreator.profile?.avatar_url || ''} />
                      <AvatarFallback className="text-xl bg-amber-500/10 text-amber-500">
                        {featuredCreator.profile?.full_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                          {featuredCreator.profile?.full_name}
                        </h2>
                        {featuredCreator.profile?.verified && (
                          <VerifiedBadge size="md" isOwner={featuredCreator.profile?.isAdmin} />
                        )}
                      </div>
                      <p className="text-muted-foreground">@{featuredCreator.profile?.username}</p>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-foreground mb-3">
                    {featuredCreator.headline}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed mb-6">
                    {featuredCreator.story}
                  </p>

                  {featuredCreator.achievement && (
                    <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 border-0 mb-6">
                      <Trophy className="h-3.5 w-3.5 mr-1.5" />
                      {featuredCreator.achievement}
                    </Badge>
                  )}

                  <div className="flex gap-6 mb-6 text-sm">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold text-foreground">{featuredCreator.products_count}</span>
                      <span className="text-muted-foreground">Products</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold text-foreground">{featuredCreator.followers_count.toLocaleString()}</span>
                      <span className="text-muted-foreground">Followers</span>
                    </div>
                  </div>

                  {featuredCreator.profile?.username && (
                    <Button size="sm" className="rounded-xl" asChild>
                      <Link to={`/@${featuredCreator.profile.username}`}>
                        Visit Profile
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </div>

                {featuredCreator.quote && (
                  <div className="p-6 sm:p-8 bg-muted/20 flex flex-col justify-center border-t md:border-t-0 md:border-l border-border/40">
                    <Quote className="h-8 w-8 text-muted-foreground/30 mb-4" />
                    <blockquote className="text-foreground italic leading-relaxed">
                      "{featuredCreator.quote}"
                    </blockquote>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* Past Spotlights */}
      {pastSpotlights.length > 0 && (
        <section className="py-8 sm:py-12 px-4 sm:px-6">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-xl font-semibold text-foreground mb-6">Past Spotlights</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pastSpotlights.map((spotlight) => (
                <div
                  key={spotlight.id}
                  className="group border border-border/40 rounded-2xl p-6 bg-card/30 hover:border-border/60 transition-all cursor-pointer"
                  onClick={() => setExpandedStory(expandedStory === spotlight.id ? null : spotlight.id)}
                >
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12 border border-border/50">
                      <AvatarImage src={spotlight.profile?.avatar_url || ''} />
                      <AvatarFallback className="bg-muted text-foreground text-sm">
                        {spotlight.profile?.full_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-semibold text-foreground truncate">
                          {spotlight.profile?.full_name}
                        </h3>
                        {spotlight.profile?.verified && (
                          <VerifiedBadge size="sm" isOwner={spotlight.profile?.isAdmin} />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">@{spotlight.profile?.username}</p>
                      <p className="text-sm font-medium text-foreground mb-2">{spotlight.headline}</p>

                      {expandedStory === spotlight.id ? (
                        <>
                          <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{spotlight.story}</p>
                          {spotlight.quote && (
                            <blockquote className="text-xs italic text-muted-foreground border-l-2 border-primary/50 pl-3 mb-3">
                              "{spotlight.quote}"
                            </blockquote>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground line-clamp-2">{spotlight.story}</p>
                      )}

                      {spotlight.achievement && (
                        <Badge variant="secondary" className="mt-3 text-xs bg-amber-500/10 text-amber-500 border-0">
                          <Star className="h-3 w-3 mr-1 fill-amber-500" />
                          {spotlight.achievement}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {spotlight.profile?.username && (
                    <div className="mt-4 pt-4 border-t border-border/30 flex justify-between items-center">
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>{spotlight.products_count} products</span>
                        <span>{spotlight.followers_count.toLocaleString()} followers</span>
                      </div>
                      <Button variant="ghost" size="sm" className="text-xs h-8" asChild onClick={(e) => e.stopPropagation()}>
                        <Link to={`/@${spotlight.profile.username}`}>
                          View Profile
                          <ChevronRight className="ml-1 h-3 w-3" />
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Simple CTA */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 border-t border-border/40">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-foreground mb-3">Want to Be Featured?</h2>
          <p className="text-muted-foreground mb-6">
            Start your creator journey today and you could be our next spotlight creator.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="sm" className="rounded-xl" asChild>
              <Link to="/settings">
                Become a Creator
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button size="sm" variant="outline" className="rounded-xl" asChild>
              <Link to="/community/discord">Join the Community</Link>
            </Button>
          </div>
        </div>
      </section>

      <NominateCreatorDialog open={nominateDialogOpen} onOpenChange={setNominateDialogOpen} />
    </div>
  );
}
