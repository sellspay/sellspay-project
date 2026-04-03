import { useState, useEffect, forwardRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { ProductCarousel } from '@/components/home/ProductCarousel';
import { Reveal } from '@/components/home/Reveal';
import { Button } from '@/components/ui/button';
import { ArrowRight, Wand2, Code, Sparkles } from 'lucide-react';
import { TrendingProducts } from '@/components/home/TrendingProducts';
import { AIToolsShowcase } from '@/components/home/AIToolsShowcase';
import { EditorMarketplaceTeaser } from '@/components/home/EditorMarketplaceTeaser';
import { CreatorSpotlights } from '@/components/home/CreatorSpotlights';
import { BrowseCategories } from '@/components/home/BrowseCategories';
import { HomeCtaBanner } from '@/components/home/HomeCtaBanner';
import { SectionBanner } from '@/components/home/SectionBanner';
import bannerMarketplace from '@/assets/banner-marketplace.jpg';
import bannerEditors from '@/assets/banner-editors.jpg';
import bannerCreators from '@/assets/banner-creators.jpg';
import aiStudioBanner from '@/assets/ai-studio-banner.jpg';

interface Product {
  id: string;
  name: string;
  status: string;
  product_type: string | null;
  featured: boolean | null;
  cover_image_url: string | null;
  preview_video_url: string | null;
  pricing_type: string | null;
  subscription_access?: string | null;
  included_in_subscription?: boolean | null;
  price_cents: number | null;
  currency: string | null;
  youtube_url: string | null;
  tags: string[] | null;
  created_at: string | null;
  creator_id: string | null;
}

const HomeFeed = forwardRef<HTMLDivElement>((_, ref) => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [builderPrompt, setBuilderPrompt] = useState('');
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'SellsPay — Home';
  }, []);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchAll = async () => {
      try {
        const viewedRes = await supabase
          .from('product_views')
          .select('product_id')
          .eq('viewer_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20);

        if (viewedRes.data && viewedRes.data.length > 0) {
          const uniqueIds = [...new Set(viewedRes.data.map(r => r.product_id))].slice(0, 12);
          const { data: viewedProducts } = await supabase
            .from('products')
            .select('id, name, status, product_type, featured, cover_image_url, preview_video_url, pricing_type, subscription_access, price_cents, currency, youtube_url, tags, created_at, creator_id')
            .in('id', uniqueIds)
            .eq('status', 'published');
          setRecentlyViewed(viewedProducts || []);
        }
      } catch (err) {
        console.error('HomeFeed fetchAll error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-3 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div ref={ref} className="min-h-screen bg-background pb-16">
      {/* Greeting */}
      <div className="px-6 sm:px-8 lg:px-10 pt-8 pb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
          Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}
        </h1>
      </div>

      {/* AI Studio Hero Banner */}
      <Reveal>
        <section className="px-6 sm:px-8 lg:px-10 pb-8">
          <Link
            to="/studio"
            className="group relative block w-full overflow-hidden rounded-2xl border border-primary/20"
            style={{ aspectRatio: '21/8' }}
          >
            <img
              src={aiStudioBanner}
              alt="AI Studio"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
            <div className="relative z-10 flex flex-col justify-center h-full px-8 sm:px-12 lg:px-16 max-w-2xl">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/15 border border-primary/25">
                  <Wand2 className="h-3.5 w-3.5 text-primary" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-primary">AI-Powered Tools</span>
                </div>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-foreground tracking-tight leading-tight mb-2">
                Create with AI Studio
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-5 max-w-md">
                Generate images, isolate vocals, split stems, create SFX, and more — all powered by cutting-edge AI models.
              </p>
              <Button
                className="w-fit px-6 h-10 sm:h-11 text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 gap-2 shadow-lg shadow-primary/20"
                asChild
              >
                <span>
                  Try Now
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Button>
            </div>
          </Link>
        </section>
      </Reveal>

      {/* AI Tools — Artlist-style visual cards */}
      <AIToolsShowcase />

      {/* Marketplace Banner */}
      <SectionBanner
        image={bannerMarketplace}
        headline="Discover digital assets made by real creators"
        subtitle="Browse beats, SFX, presets, templates and more from independent artists worldwide."
        ctaLabel="Explore Marketplace"
        ctaLink="/explore"
      />

      {/* Trending Products */}
      <TrendingProducts />

      {/* Browse by Category — Artlist-style image strip */}
      <BrowseCategories />

      {/* VibeCoder — Interactive builder teaser */}
      <Reveal>
        <section className="px-6 sm:px-8 lg:px-10 pb-8">
          <div className="relative py-16 sm:py-24 lg:py-28">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-emerald-500/[0.07] rounded-full blur-[120px] animate-pulse" />
              <div className="absolute top-1/3 left-1/3 w-[400px] h-[300px] bg-primary/[0.05] rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
              <div className="absolute bottom-1/4 right-1/3 w-[350px] h-[250px] bg-emerald-400/[0.04] rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            <div className="relative z-10 text-center mb-10 sm:mb-12">
              <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 mb-6">
                <Code className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-semibold uppercase tracking-[0.15em] text-emerald-400">VibeCoder</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight mb-4">
                What do you want to build?
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
                Describe your idea and watch AI generate a live storefront — no code needed
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (builderPrompt.trim()) {
                  navigate('/ai-builder', { state: { initialPrompt: builderPrompt.trim() } });
                } else {
                  navigate('/ai-builder');
                }
              }}
              className="relative z-10 max-w-3xl mx-auto"
            >
              <div className="relative group">
                <div className="absolute -inset-[2px] rounded-2xl bg-gradient-to-r from-emerald-500/60 via-primary/40 to-emerald-500/60 opacity-0 group-focus-within:opacity-100 transition-all duration-500 blur-sm" />
                <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-emerald-500/40 via-primary/30 to-emerald-500/40 opacity-0 group-focus-within:opacity-100 transition-all duration-500" />

                <div className="relative flex items-center bg-card/80 backdrop-blur-sm border border-border/40 rounded-2xl overflow-hidden group-focus-within:border-transparent transition-colors shadow-2xl shadow-background/50">
                  <div className="flex items-center gap-2 pl-5 pr-2">
                    <div className="relative">
                      <Sparkles className="h-5 w-5 text-emerald-400/70 group-focus-within:text-emerald-400 transition-colors" />
                      <div className="absolute inset-0 h-5 w-5 text-emerald-400 blur-sm opacity-0 group-focus-within:opacity-50 transition-opacity">
                        <Sparkles className="h-5 w-5" />
                      </div>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={builderPrompt}
                    onChange={(e) => setBuilderPrompt(e.target.value)}
                    placeholder="A sleek portfolio with dark theme and project gallery..."
                    className="flex-1 bg-transparent border-none outline-none text-base sm:text-lg text-foreground placeholder:text-muted-foreground/30 py-6 pr-2 font-medium"
                  />
                  <div className="pr-4">
                    <Button
                      type="submit"
                      className="h-12 px-7 text-sm font-bold bg-emerald-500 text-white hover:bg-emerald-400 rounded-xl gap-2 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 hover:scale-[1.02]"
                    >
                      Build
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </form>

            <div className="relative z-10 flex flex-wrap justify-center gap-2.5 mt-6 max-w-3xl mx-auto">
              {['Music producer store', 'Photography portfolio', 'Digital art shop', 'SFX marketplace'].map((suggestion, i) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setBuilderPrompt(suggestion);
                    navigate('/ai-builder', { state: { initialPrompt: suggestion } });
                  }}
                  className="px-4 py-2 text-xs font-medium text-muted-foreground/70 hover:text-emerald-400 bg-card/50 hover:bg-emerald-500/10 border border-border/20 hover:border-emerald-500/30 rounded-full transition-all duration-300"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* Editors Banner */}
      <SectionBanner
        image={bannerEditors}
        headline="Work with professional editors who bring your vision to life"
        subtitle="Book vetted audio & video editors by the hour. Chat directly and get results fast."
        ctaLabel="Browse Editors"
        ctaLink="/editors"
      />

      {/* Editor Marketplace */}
      <EditorMarketplaceTeaser />

      {/* Creators Banner */}
      <SectionBanner
        image={bannerCreators}
        headline="Join a community of independent creators selling worldwide"
        subtitle="Start your own storefront, sell digital products, and grow your audience — all in one place."
        ctaLabel="Become a Creator"
        ctaLink="/apply"
      />

      {/* Creator Spotlights */}
      <CreatorSpotlights />

      {/* Recently Viewed */}
      {recentlyViewed.length > 0 && (
        <Reveal>
          <div className="pb-8">
            <ProductCarousel
              title="Based on Your History"
              products={recentlyViewed}
            />
          </div>
        </Reveal>
      )}

      {/* Final CTA Banner */}
      <HomeCtaBanner />
    </div>
  );
});

HomeFeed.displayName = 'HomeFeed';

export default HomeFeed;
