import { useState, useEffect, forwardRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { ProductCarousel } from '@/components/home/ProductCarousel';
import { Reveal } from '@/components/home/Reveal';
import { Button } from '@/components/ui/button';
import { ArrowRight, Wand2, Code, Sparkles } from 'lucide-react';
import aiStudioBanner from '@/assets/ai-studio-banner.jpg';
import aiBuilderBanner from '@/assets/ai-builder-banner.jpg';

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
        // Fetch recently viewed products
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
      {/* Greeting bar */}
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
            {/* Background image */}
            <img
              src={aiStudioBanner}
              alt="AI Studio"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            />
            {/* Overlay gradients */}
            <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />

            {/* Content */}
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
              <p className="text-sm sm:text-base text-zinc-400 leading-relaxed mb-5 max-w-md">
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

      {/* AI Builder — Interactive Demo Teaser */}
      <Reveal>
        <section className="px-6 sm:px-8 lg:px-10 pb-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 mb-4">
              <Code className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-emerald-400">VibeCoder</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight mb-2">
              What do you want to build?
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Describe your idea and AI will generate a live storefront for you
            </p>
          </div>

          {/* Mock terminal prompt */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              navigate('/ai-builder', { state: { initialPrompt: builderPrompt } });
            }}
            className="max-w-2xl mx-auto"
          >
            <div className="relative group">
              <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-emerald-500/50 via-primary/50 to-emerald-500/50 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 blur-[1px]" />
              <div className="relative flex items-center bg-card border border-border/60 rounded-xl overflow-hidden group-focus-within:border-transparent transition-colors">
                <div className="flex items-center gap-2 pl-4 pr-2 text-muted-foreground/50">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-xs font-mono hidden sm:inline">›</span>
                </div>
                <input
                  type="text"
                  value={builderPrompt}
                  onChange={(e) => setBuilderPrompt(e.target.value)}
                  placeholder="A sleek portfolio with dark theme and project gallery..."
                  className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground/40 py-4 pr-2"
                />
                <div className="pr-2">
                  <Button
                    type="submit"
                    size="sm"
                    className="h-8 px-4 text-xs font-bold bg-emerald-500 text-white hover:bg-emerald-600 rounded-lg gap-1.5 shadow-lg shadow-emerald-500/20"
                  >
                    Build
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </form>

          {/* Quick prompt suggestions */}
          <div className="flex flex-wrap justify-center gap-2 mt-4 max-w-2xl mx-auto">
            {['Music producer store', 'Photography portfolio', 'Digital art shop', 'SFX marketplace'].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => {
                  setBuilderPrompt(suggestion);
                  navigate('/ai-builder', { state: { initialPrompt: suggestion } });
                }}
                className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground bg-muted/30 hover:bg-muted/50 border border-border/30 rounded-full transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </section>
      </Reveal>

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

    </div>
  );
});

HomeFeed.displayName = 'HomeFeed';

export default HomeFeed;
