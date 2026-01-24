import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Star, Users, Package, Quote, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { VerifiedBadge } from '@/components/ui/verified-badge';
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
  } | null;
  products_count: number;
  followers_count: number;
}

export default function Spotlight() {
  const [expandedStory, setExpandedStory] = useState<string | null>(null);

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
          .select('id, username, full_name, avatar_url, verified, bio')
          .in('id', profileIds);

        const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

        // Get products and followers counts
        const spotlightsWithData = await Promise.all(spotlightsData.map(async (s) => {
          const profile = profilesMap.get(s.profile_id);
          
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
            profile: profile || null,
            products_count: productsResult.count || 0,
            followers_count: followersResult.count || 0,
          };
        }));

        return spotlightsWithData as SpotlightCreator[];
      }

      // Fallback: if no spotlights exist, show real verified creators
      const { data: creatorsData } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, verified, bio')
        .eq('is_creator', true)
        .eq('verified', true)
        .limit(6);

      if (!creatorsData || creatorsData.length === 0) return [];

      // Build spotlights from real creators
      const creatorSpotlights = await Promise.all(creatorsData.map(async (creator, index) => {
        const [productsResult, followersResult] = await Promise.all([
          supabase.from('products').select('id', { count: 'exact', head: true }).eq('creator_id', creator.id),
          supabase.from('followers').select('id', { count: 'exact', head: true }).eq('following_id', creator.id),
        ]);

        return {
          id: creator.id,
          headline: index === 0 ? 'Building EditorsParadise' : 'Verified Creator',
          story: creator.bio || 'A passionate creator building amazing content for the community.',
          achievement: 'Verified Creator',
          quote: null,
          featured_at: new Date().toISOString(),
          profile: creator,
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
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
        
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Celebrating Our Creators</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            Creator <span className="text-primary">Spotlight</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Discover the inspiring journeys of creators who've built successful businesses 
            and made an impact in our community.
          </p>
          
          <Button variant="outline" className="rounded-full" asChild>
            <Link to="/community">
              Nominate a Creator
              <ChevronRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Featured Creator */}
      {featuredCreator && (
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="mb-8">
              <Badge variant="secondary" className="mb-4">
                <Star className="h-3 w-3 mr-1 fill-primary text-primary" />
                Featured Creator
              </Badge>
            </div>
            
            <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-card via-card to-primary/5">
              <CardContent className="p-0">
                <div className="grid md:grid-cols-3 gap-0">
                  {/* Creator Info */}
                  <div className="p-8 md:p-10 md:col-span-2">
                    <div className="flex items-center gap-4 mb-6">
                      <Avatar className="h-20 w-20 border-4 border-primary/20">
                        <AvatarImage src={featuredCreator.profile?.avatar_url || ''} />
                        <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                          {featuredCreator.profile?.full_name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-2xl font-bold text-foreground">
                            {featuredCreator.profile?.full_name}
                          </h2>
                          {featuredCreator.profile?.verified && <VerifiedBadge size="md" />}
                        </div>
                        <p className="text-muted-foreground">@{featuredCreator.profile?.username}</p>
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-semibold text-foreground mb-4">
                      {featuredCreator.headline}
                    </h3>
                    
                    <p className="text-muted-foreground leading-relaxed mb-6">
                      {featuredCreator.story}
                    </p>
                    
                    {featuredCreator.achievement && (
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                        <Star className="h-4 w-4 text-primary fill-primary" />
                        <span className="text-sm font-medium text-primary">{featuredCreator.achievement}</span>
                      </div>
                    )}
                    
                    <div className="flex gap-6 mb-6">
                      <div className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-muted-foreground" />
                        <span className="font-semibold text-foreground">{featuredCreator.products_count}</span>
                        <span className="text-muted-foreground">Products</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-muted-foreground" />
                        <span className="font-semibold text-foreground">{featuredCreator.followers_count.toLocaleString()}</span>
                        <span className="text-muted-foreground">Followers</span>
                      </div>
                    </div>
                    
                    {featuredCreator.profile?.username && (
                      <Button asChild>
                        <Link to={`/@${featuredCreator.profile.username}`}>
                          Visit Profile
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                  </div>
                  
                  {/* Quote Section */}
                  {featuredCreator.quote && (
                    <div className="p-8 md:p-10 bg-primary/5 flex flex-col justify-center border-t md:border-t-0 md:border-l border-primary/10">
                      <Quote className="h-10 w-10 text-primary/30 mb-4" />
                      <blockquote className="text-lg text-foreground italic leading-relaxed">
                        "{featuredCreator.quote}"
                      </blockquote>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Past Spotlights Grid */}
      {pastSpotlights.length > 0 && (
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-2xl font-bold text-foreground mb-8">Past Spotlights</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pastSpotlights.map((spotlight) => (
                <Card 
                  key={spotlight.id} 
                  className="group hover:border-primary/50 transition-all duration-300 cursor-pointer"
                  onClick={() => setExpandedStory(expandedStory === spotlight.id ? null : spotlight.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-14 w-14 border-2 border-border group-hover:border-primary/50 transition-colors">
                        <AvatarImage src={spotlight.profile?.avatar_url || ''} />
                        <AvatarFallback className="bg-muted">
                          {spotlight.profile?.full_name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground truncate">
                            {spotlight.profile?.full_name}
                          </h3>
                          {spotlight.profile?.verified && <VerifiedBadge size="sm" />}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">@{spotlight.profile?.username}</p>
                        <p className="font-medium text-foreground mb-2">{spotlight.headline}</p>
                        
                        {expandedStory === spotlight.id ? (
                          <>
                            <p className="text-sm text-muted-foreground mb-4">{spotlight.story}</p>
                            {spotlight.quote && (
                              <blockquote className="text-sm italic text-muted-foreground border-l-2 border-primary/50 pl-3 mb-4">
                                "{spotlight.quote}"
                              </blockquote>
                            )}
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground line-clamp-2">{spotlight.story}</p>
                        )}
                        
                        {spotlight.achievement && (
                          <Badge variant="secondary" className="mt-3">
                            <Star className="h-3 w-3 mr-1 fill-primary text-primary" />
                            {spotlight.achievement}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {spotlight.profile?.username && (
                      <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          <span>{spotlight.products_count} products</span>
                          <span>{spotlight.followers_count.toLocaleString()} followers</span>
                        </div>
                        <Button variant="ghost" size="sm" asChild onClick={(e) => e.stopPropagation()}>
                          <Link to={`/@${spotlight.profile.username}`}>
                            View Profile
                          </Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Become a Creator CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <Sparkles className="h-12 w-12 text-primary mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Want to Be Featured?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Start your creator journey today. Build your store, grow your audience, 
            and you could be our next spotlight creator.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link to="/settings">
                Become a Creator
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/community/discord">
                Join the Community
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
