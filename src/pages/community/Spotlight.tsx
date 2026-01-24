import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Star, Users, Package, Quote, ChevronRight, Sparkles, Crown, ArrowRight, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { VerifiedBadge } from '@/components/ui/verified-badge';
import { NominateCreatorDialog } from '@/components/community/NominateCreatorDialog';
import { Reveal } from '@/components/home/Reveal';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

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

  // Fetch real creators from the database
  const { data: spotlights = [], isLoading } = useQuery({
    queryKey: ['creator-spotlights'],
    queryFn: async () => {
      // First try to get spotlights from the creator_spotlights table
      const { data: spotlightsData } = await supabase
        .from('creator_spotlights')
        .select(`
          id,
          headline,
          story,
          achievement,
          quote,
          featured_at,
          profile_id
        `)
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .limit(10);

      // If we have spotlights, join with profiles
      if (spotlightsData && spotlightsData.length > 0) {
        const profileIds = spotlightsData.map(s => s.profile_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, user_id, username, full_name, avatar_url, verified, bio')
          .in('id', profileIds);

        const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

        // Fetch owner roles for these profiles (for Owner badge)
        const userIds = (profilesData || []).map((p: any) => p.user_id).filter(Boolean);
        const { data: ownerRoles } = userIds.length
          ? await supabase.from('user_roles').select('user_id').eq('role', 'owner').in('user_id', userIds)
          : { data: [] as any[] };
        const adminUserIds = new Set((ownerRoles || []).map((r: any) => r.user_id));

        // Get products and followers counts
        const spotlightsWithData = await Promise.all(spotlightsData.map(async (s) => {
           const profile = profilesMap.get(s.profile_id);
           const profileWithAdmin = profile
             ? { ...profile, isAdmin: adminUserIds.has((profile as any).user_id) }
             : null;
          
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
             profile: (profileWithAdmin as any) || null,
            products_count: productsResult.count || 0,
            followers_count: followersResult.count || 0,
          };
        }));

        return spotlightsWithData as SpotlightCreator[];
      }

      // Fallback: if no spotlights exist, show real verified creators
      const { data: creatorsData } = await supabase
        .from('profiles')
        .select('id, user_id, username, full_name, avatar_url, verified, bio')
        .eq('is_creator', true)
        .eq('verified', true)
        .limit(20);

      if (!creatorsData || creatorsData.length === 0) return [];

      // Fetch owner roles for all creators (for Owner badge)
      const userIds = creatorsData.map(c => c.user_id).filter(Boolean);
      const { data: ownerRoles } = userIds.length
        ? await supabase.from('user_roles').select('user_id').eq('role', 'owner').in('user_id', userIds)
        : { data: [] as any[] };
      const adminUserIds = new Set((ownerRoles || []).map((r: any) => r.user_id));

      // Sort: owners first, then others
      const sortedCreators = [...creatorsData].sort((a, b) => {
        const aIsOwner = adminUserIds.has(a.user_id);
        const bIsOwner = adminUserIds.has(b.user_id);
        if (aIsOwner && !bIsOwner) return -1;
        if (!aIsOwner && bIsOwner) return 1;
        return 0;
      }).slice(0, 6);

      // Build spotlights from real creators
      const creatorSpotlights = await Promise.all(sortedCreators.map(async (creator) => {
        const isOwner = adminUserIds.has(creator.user_id);

        const [productsResult, followersResult] = await Promise.all([
          supabase.from('products').select('id', { count: 'exact', head: true }).eq('creator_id', creator.id),
          supabase.from('followers').select('id', { count: 'exact', head: true }).eq('following_id', creator.id),
        ]);

        return {
          id: creator.id,
          headline: isOwner ? 'Building EditorsParadise' : 'Verified Creator',
          story: creator.bio || 'A passionate creator building amazing content for the community.',
          achievement: isOwner ? 'Platform Founder' : 'Verified Creator',
          quote: null,
          featured_at: new Date().toISOString(),
          profile: { ...creator, isAdmin: isOwner },
          products_count: productsResult.count || 0,
          followers_count: followersResult.count || 0,
        } as SpotlightCreator;
      }));

      return creatorSpotlights;
    },
  });

  const featuredCreator = spotlights[0];
  const pastSpotlights = spotlights.slice(1);

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Hero Section - Immersive Premium Design */}
      <section className="relative min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Layered Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 via-background to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(45_100%_50%/0.2),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,hsl(var(--primary)/0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,hsl(45_100%_50%/0.1),transparent_50%)]" />

        {/* Floating Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/20 rounded-full blur-[128px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/15 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '2s' }} />

        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(hsl(45_100%_50%/0.02)_1px,transparent_1px),linear-gradient(90deg,hsl(45_100%_50%/0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

        <div className="relative z-10 mx-auto max-w-5xl text-center">
          <Reveal>
            {/* Floating Badge */}
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-500/10 border border-amber-500/20 backdrop-blur-sm mb-8 hover:bg-amber-500/15 hover:border-amber-500/30 transition-all duration-300 cursor-default">
              <div className="relative">
                <Trophy className="h-4 w-4 text-amber-500" />
                <div className="absolute inset-0 animate-ping">
                  <Trophy className="h-4 w-4 text-amber-500 opacity-50" />
                </div>
              </div>
              <span className="text-sm font-medium bg-gradient-to-r from-amber-500 to-amber-300 bg-clip-text text-transparent">
                Celebrating Excellence
              </span>
            </div>
          </Reveal>

          <Reveal delay={100}>
            {/* Icon - Floating Style */}
            <div className="mb-10 flex justify-center">
              <div className="relative group">
                {/* Glow layers */}
                <div className="absolute inset-0 blur-[60px] bg-amber-500/50 rounded-full scale-150 group-hover:scale-[1.75] transition-transform duration-700" />
                <div className="absolute inset-0 blur-3xl bg-gradient-to-br from-amber-500 to-amber-600 opacity-40 rounded-full scale-125 group-hover:opacity-60 transition-all duration-500" />

                {/* Main Icon Container */}
                <div className="relative bg-gradient-to-br from-amber-500 to-amber-600 rounded-3xl p-8 shadow-2xl shadow-amber-500/30 group-hover:shadow-amber-500/50 transition-all duration-500 group-hover:scale-105">
                  <Star className="h-16 w-16 text-white fill-white drop-shadow-lg" />
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={200}>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground mb-6 tracking-tight">
              Creator{' '}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 bg-clip-text text-transparent bg-[length:200%_auto] animate-[gradient_3s_linear_infinite]">
                  Spotlight
                </span>
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 to-amber-400/20 blur-lg opacity-50" />
              </span>
            </h1>
          </Reveal>

          <Reveal delay={300}>
            <p className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed">
              Discover the inspiring journeys of creators who've built successful businesses
              <span className="text-foreground font-medium"> and made an impact in our community.</span>
            </p>
          </Reveal>

          <Reveal delay={400}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="group relative bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-10 py-7 text-lg font-semibold rounded-2xl shadow-2xl shadow-amber-500/30 hover:shadow-amber-500/50 transition-all duration-500 hover:scale-105 overflow-hidden"
                onClick={() => setNominateDialogOpen(true)}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                <Crown className="mr-3 h-5 w-5" />
                Nominate a Creator
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </Reveal>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-muted-foreground/50 rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* Featured Creator - Premium Design */}
      {featuredCreator && (
        <section className="relative py-24 px-4 sm:px-6 lg:px-8">
          {/* Section Divider Gradient */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />

          {/* Background Effects */}
          <div className="absolute inset-0 bg-gradient-to-b from-background via-amber-500/5 to-background" />
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-[128px]" />

          <div className="relative mx-auto max-w-5xl">
            <Reveal>
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 mb-6">
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                  <span className="text-sm font-medium text-amber-500">Featured Creator</span>
                </div>
              </div>
            </Reveal>

            <Reveal delay={100}>
              <div className="group relative">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-primary/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative bg-gradient-to-br from-card/90 via-card/70 to-card/50 backdrop-blur-xl border border-border/50 rounded-3xl overflow-hidden hover:border-amber-500/30 transition-all duration-500">
                  {/* Gradient line at top */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500" />

                  <div className="grid md:grid-cols-3 gap-0">
                    {/* Creator Info */}
                    <div className="p-10 md:p-12 md:col-span-2">
                      <div className="flex items-center gap-5 mb-8">
                        <div className="relative">
                          <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-amber-500/50 to-amber-400/50 blur" />
                          <Avatar className="relative h-24 w-24 border-4 border-amber-500/30">
                            <AvatarImage src={featuredCreator.profile?.avatar_url || ''} />
                            <AvatarFallback className="text-3xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 text-amber-500">
                              {featuredCreator.profile?.full_name?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h2 className="text-3xl font-bold text-foreground">
                              {featuredCreator.profile?.full_name}
                            </h2>
                            {featuredCreator.profile?.verified && (
                              <VerifiedBadge size="md" isOwner={featuredCreator.profile?.isAdmin} />
                            )}
                          </div>
                          <p className="text-muted-foreground text-lg">@{featuredCreator.profile?.username}</p>
                        </div>
                      </div>

                      <h3 className="text-2xl font-bold text-foreground mb-4">
                        {featuredCreator.headline}
                      </h3>

                      <p className="text-muted-foreground leading-relaxed text-lg mb-8">
                        {featuredCreator.story}
                      </p>

                      {featuredCreator.achievement && (
                        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500/20 to-amber-500/10 border border-amber-500/20 mb-8">
                          <Trophy className="h-5 w-5 text-amber-500" />
                          <span className="font-semibold text-amber-500">{featuredCreator.achievement}</span>
                        </div>
                      )}

                      <div className="flex gap-8 mb-8">
                        <div className="flex items-center gap-3">
                          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
                            <Package className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <span className="text-2xl font-bold text-foreground">{featuredCreator.products_count}</span>
                            <p className="text-sm text-muted-foreground">Products</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
                            <Users className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <span className="text-2xl font-bold text-foreground">{featuredCreator.followers_count.toLocaleString()}</span>
                            <p className="text-sm text-muted-foreground">Followers</p>
                          </div>
                        </div>
                      </div>

                      {featuredCreator.profile?.username && (
                        <Button
                          size="lg"
                          className="rounded-xl bg-gradient-to-r from-primary to-primary/90 shadow-lg shadow-primary/25"
                          asChild
                        >
                          <Link to={`/@${featuredCreator.profile.username}`}>
                            Visit Profile
                            <ChevronRight className="ml-2 h-5 w-5" />
                          </Link>
                        </Button>
                      )}
                    </div>

                    {/* Quote Section */}
                    {featuredCreator.quote && (
                      <div className="p-10 md:p-12 bg-gradient-to-br from-amber-500/10 to-amber-500/5 flex flex-col justify-center border-t md:border-t-0 md:border-l border-amber-500/20">
                        <Quote className="h-12 w-12 text-amber-500/30 mb-6" />
                        <blockquote className="text-xl text-foreground italic leading-relaxed">
                          "{featuredCreator.quote}"
                        </blockquote>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* Past Spotlights Grid - Premium Design */}
      {pastSpotlights.length > 0 && (
        <section className="relative py-24 px-4 sm:px-6 lg:px-8">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/30 to-background" />
          <div className="absolute right-0 top-1/3 w-80 h-80 bg-primary/10 rounded-full blur-[100px]" />

          <div className="relative mx-auto max-w-6xl">
            <Reveal>
              <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Past Spotlights</h2>
                <p className="text-muted-foreground text-lg">Creators who've made their mark</p>
              </div>
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pastSpotlights.map((spotlight, index) => (
                <Reveal key={spotlight.id} delay={index * 100}>
                  <div
                    className="group relative cursor-pointer"
                    onClick={() => setExpandedStory(expandedStory === spotlight.id ? null : spotlight.id)}
                  >
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="relative bg-gradient-to-br from-card/90 via-card/70 to-card/50 backdrop-blur-xl border border-border/50 rounded-3xl p-8 hover:border-primary/30 transition-all duration-500 group-hover:-translate-y-1">
                      <div className="flex items-start gap-5">
                        <div className="relative shrink-0">
                          <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-primary/50 to-accent/50 opacity-0 group-hover:opacity-100 blur transition-opacity duration-500" />
                          <Avatar className="relative h-16 w-16 border-2 border-border/50 group-hover:border-primary/50 transition-colors">
                            <AvatarImage src={spotlight.profile?.avatar_url || ''} />
                            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-foreground font-semibold">
                              {spotlight.profile?.full_name?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-foreground text-lg truncate">
                              {spotlight.profile?.full_name}
                            </h3>
                            {spotlight.profile?.verified && (
                              <VerifiedBadge size="sm" isOwner={spotlight.profile?.isAdmin} />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">@{spotlight.profile?.username}</p>
                          <p className="font-semibold text-foreground mb-3">{spotlight.headline}</p>

                          {expandedStory === spotlight.id ? (
                            <>
                              <p className="text-muted-foreground mb-4 leading-relaxed">{spotlight.story}</p>
                              {spotlight.quote && (
                                <blockquote className="text-sm italic text-muted-foreground border-l-2 border-primary/50 pl-4 mb-4">
                                  "{spotlight.quote}"
                                </blockquote>
                              )}
                            </>
                          ) : (
                            <p className="text-muted-foreground line-clamp-2">{spotlight.story}</p>
                          )}

                          {spotlight.achievement && (
                            <Badge variant="secondary" className="mt-4 bg-gradient-to-r from-amber-500/20 to-amber-500/10 text-amber-500 border-0">
                              <Star className="h-3 w-3 mr-1 fill-amber-500" />
                              {spotlight.achievement}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {spotlight.profile?.username && (
                        <div className="mt-6 pt-6 border-t border-border/30 flex justify-between items-center">
                          <div className="flex gap-6 text-sm text-muted-foreground">
                            <span className="font-medium">{spotlight.products_count} products</span>
                            <span className="font-medium">{spotlight.followers_count.toLocaleString()} followers</span>
                          </div>
                          <Button variant="ghost" size="sm" className="rounded-xl hover:bg-primary/10" asChild onClick={(e) => e.stopPropagation()}>
                            <Link to={`/@${spotlight.profile.username}`}>
                              View Profile
                              <ChevronRight className="ml-1 h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section - Premium Design */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8">
        {/* Section Divider */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[128px]" />

        <div className="relative mx-auto max-w-3xl text-center">
          <Reveal>
            <div className="relative group inline-block mb-8">
              <div className="absolute inset-0 blur-[40px] bg-primary/40 rounded-full group-hover:scale-125 transition-transform duration-500" />
              <div className="relative bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-5 shadow-2xl shadow-primary/30">
                <Sparkles className="h-10 w-10 text-primary-foreground" />
              </div>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
              Want to Be Featured?
            </h2>
          </Reveal>

          <Reveal delay={200}>
            <p className="text-xl text-muted-foreground mb-10 leading-relaxed">
              Start your creator journey today. Build your store, grow your audience,
              and you could be our next spotlight creator.
            </p>
          </Reveal>

          <Reveal delay={300}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="group relative bg-gradient-to-r from-primary to-primary/90 px-8 py-7 text-lg font-semibold rounded-2xl shadow-2xl shadow-primary/30 hover:shadow-primary/50 transition-all duration-500 hover:scale-105 overflow-hidden"
                asChild
              >
                <Link to="/settings">
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  Become a Creator
                  <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="px-8 py-7 text-lg rounded-2xl border-border/50 hover:border-primary/50 hover:bg-primary/5"
                asChild
              >
                <Link to="/community/discord">
                  Join the Community
                </Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Nominate Creator Dialog */}
      <NominateCreatorDialog open={nominateDialogOpen} onOpenChange={setNominateDialogOpen} />
    </div>
  );
}
