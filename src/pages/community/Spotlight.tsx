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
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] to-transparent pointer-events-none" />
        <div className="relative mx-auto max-w-3xl px-6 pt-20 sm:pt-28 pb-14 sm:pb-20 text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-muted-foreground mb-5">
            Celebrating Excellence
          </p>
          <h1 className="text-4xl sm:text-5xl font-semibold text-foreground tracking-tight leading-[1.1]">
            Creator Spotlight
          </h1>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Discover the inspiring journeys of creators who've made an impact.
          </p>
          <div className="mt-8">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full text-xs h-9 px-5 border-border/60 text-muted-foreground hover:text-foreground"
              onClick={() => setNominateDialogOpen(true)}
            >
              <Crown className="h-3.5 w-3.5 mr-2" />
              Nominate a Creator
            </Button>
          </div>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />
      </section>

      {/* Featured Creator */}
      {isLoading ? (
        <section className="py-20 px-6">
          <div className="flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </section>
      ) : featuredCreator ? (
        <section className="py-12 sm:py-20 px-6">
          <div className="mx-auto max-w-3xl">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-primary mb-8">
              Featured Creator
            </p>

            <div className="border border-border/40 rounded-2xl overflow-hidden">
              <div className="h-px bg-gradient-to-r from-primary/40 via-primary to-primary/40" />

              <div className="grid md:grid-cols-5 gap-0">
                {/* Main content */}
                <div className="p-8 sm:p-10 md:col-span-3">
                  <div className="flex items-center gap-5 mb-8">
                    <Avatar className="h-20 w-20 border border-border/50">
                      <AvatarImage src={featuredCreator.profile?.avatar_url || ''} />
                      <AvatarFallback className="text-xl bg-muted text-foreground">
                        {featuredCreator.profile?.full_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-xl sm:text-2xl font-semibold text-foreground tracking-tight">
                          {featuredCreator.profile?.full_name}
                        </h2>
                        {featuredCreator.profile?.verified && (
                          <VerifiedBadge size="md" isOwner={featuredCreator.profile?.isAdmin} />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">@{featuredCreator.profile?.username}</p>
                    </div>
                  </div>

                  <h3 className="text-lg font-medium text-foreground mb-3 leading-snug">
                    {featuredCreator.headline}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed mb-8 text-[15px]">
                    {featuredCreator.story}
                  </p>

                  {featuredCreator.achievement && (
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-0 mb-8 text-xs">
                      <Trophy className="h-3 w-3 mr-1.5" />
                      {featuredCreator.achievement}
                    </Badge>
                  )}

                  <div className="flex gap-8 mb-8 text-sm">
                    <div>
                      <span className="text-lg font-semibold text-foreground">{featuredCreator.products_count}</span>
                      <span className="text-muted-foreground ml-1.5">Products</span>
                    </div>
                    <div>
                      <span className="text-lg font-semibold text-foreground">{featuredCreator.followers_count.toLocaleString()}</span>
                      <span className="text-muted-foreground ml-1.5">Followers</span>
                    </div>
                  </div>

                  {featuredCreator.profile?.username && (
                    <Button variant="outline" size="sm" className="rounded-full h-9 px-5 text-xs" asChild>
                      <Link to={`/@${featuredCreator.profile.username}`}>
                        Visit Profile
                        <ChevronRight className="ml-1 h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  )}
                </div>

                {/* Quote panel */}
                {featuredCreator.quote && (
                  <div className="p-8 sm:p-10 md:col-span-2 flex flex-col justify-center border-t md:border-t-0 md:border-l border-border/40 bg-muted/[0.04]">
                    <Quote className="h-8 w-8 text-border mb-6" />
                    <blockquote className="text-foreground/90 italic leading-relaxed text-[15px]">
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
        <section className="py-12 sm:py-16 px-6">
          <div className="mx-auto max-w-3xl">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground mb-8">
              Past Spotlights
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pastSpotlights.map((spotlight) => (
                <div
                  key={spotlight.id}
                  className="group border border-border/40 rounded-2xl p-6 sm:p-7 hover:border-border/70 transition-all cursor-pointer"
                  onClick={() => setExpandedStory(expandedStory === spotlight.id ? null : spotlight.id)}
                >
                  <div className="flex items-start gap-4">
                    <Avatar className="h-11 w-11 border border-border/40 shrink-0">
                      <AvatarImage src={spotlight.profile?.avatar_url || ''} />
                      <AvatarFallback className="bg-muted text-foreground text-sm">
                        {spotlight.profile?.full_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-medium text-foreground truncate text-sm">
                          {spotlight.profile?.full_name}
                        </h3>
                        {spotlight.profile?.verified && (
                          <VerifiedBadge size="sm" isOwner={spotlight.profile?.isAdmin} />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">@{spotlight.profile?.username}</p>
                      <p className="text-sm font-medium text-foreground mb-2">{spotlight.headline}</p>

                      {expandedStory === spotlight.id ? (
                        <>
                          <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{spotlight.story}</p>
                          {spotlight.quote && (
                            <blockquote className="text-xs italic text-muted-foreground border-l-2 border-border pl-3 mb-3">
                              "{spotlight.quote}"
                            </blockquote>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground line-clamp-2">{spotlight.story}</p>
                      )}

                      {spotlight.achievement && (
                        <Badge variant="secondary" className="mt-3 text-xs bg-primary/10 text-primary border-0">
                          <Star className="h-3 w-3 mr-1" />
                          {spotlight.achievement}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {spotlight.profile?.username && (
                    <div className="mt-5 pt-4 border-t border-border/30 flex justify-between items-center">
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>{spotlight.products_count} products</span>
                        <span>{spotlight.followers_count.toLocaleString()} followers</span>
                      </div>
                      <Button variant="ghost" size="sm" className="text-xs h-7 px-3 text-muted-foreground hover:text-foreground" asChild onClick={(e) => e.stopPropagation()}>
                        <Link to={`/@${spotlight.profile.username}`}>
                          View
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

      {/* CTA */}
      <section className="py-16 sm:py-24 px-6">
        <div className="h-px bg-gradient-to-r from-transparent via-border/60 to-transparent mb-16 sm:mb-24" />
        <div className="mx-auto max-w-md text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight mb-3">
            Want to Be Featured?
          </h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Start your creator journey today and you could be our next spotlight.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="sm" className="rounded-full h-9 px-6 text-xs" asChild>
              <Link to="/settings">
                Become a Creator
                <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
            <Button size="sm" variant="outline" className="rounded-full h-9 px-6 text-xs border-border/60" asChild>
              <Link to="/community/discord">Join the Community</Link>
            </Button>
          </div>
        </div>
      </section>

      <NominateCreatorDialog open={nominateDialogOpen} onOpenChange={setNominateDialogOpen} />
    </div>
  );
}
