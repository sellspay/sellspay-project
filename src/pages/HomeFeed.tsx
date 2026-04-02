import { useState, useEffect, forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { ProductCarousel } from '@/components/home/ProductCarousel';
import { Reveal } from '@/components/home/Reveal';
import { Button } from '@/components/ui/button';
import { ArrowRight, Wand2 } from 'lucide-react';
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
  const { user, profile } = useAuth();
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
      const [trendingRes, newRes, viewedRes, catImagesRes] = await Promise.all([
        supabase
          .from('product_likes')
          .select('product_id')
          .gte('created_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()),
        supabase
          .from('products')
          .select('id, name, status, product_type, featured, cover_image_url, preview_video_url, pricing_type, subscription_access, price_cents, currency, youtube_url, tags, created_at, creator_id')
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('product_views')
          .select('product_id')
          .eq('viewer_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('products')
          .select('product_type, cover_image_url')
          .eq('status', 'published')
          .not('cover_image_url', 'is', null)
          .not('product_type', 'is', null)
          .limit(100),
      ]);

      // Build category images map
      const imgMap: Record<string, string> = {};
      catImagesRes.data?.forEach(p => {
        if (p.product_type && p.cover_image_url && !imgMap[p.product_type]) {
          imgMap[p.product_type] = p.cover_image_url;
        }
      });
      setCategoryImages(imgMap);

      // Process trending
      const likeCounts = new Map<string, number>();
      trendingRes.data?.forEach(l => likeCounts.set(l.product_id, (likeCounts.get(l.product_id) || 0) + 1));
      const topIds = [...likeCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20).map(([id]) => id);

      let trendingData: Product[] = [];
      if (topIds.length > 0) {
        const { data } = await supabase
          .from('products')
          .select('id, name, status, product_type, featured, cover_image_url, preview_video_url, pricing_type, subscription_access, price_cents, currency, youtube_url, tags, created_at, creator_id')
          .in('id', topIds)
          .eq('status', 'published');
        trendingData = data || [];
      }

      if (trendingData.length < 6) {
        const existingIds = new Set(trendingData.map(p => p.id));
        const filler = (newRes.data || []).filter(p => !existingIds.has(p.id));
        trendingData = [...trendingData, ...filler].slice(0, 20);
      }

      setTrendingProducts(trendingData);

      // Fetch one product per category for "Browse by Category" row
      const allPublished = (newRes.data || []) as Product[];
      const seenTypes = new Set<string>();
      const catProds: Product[] = [];
      for (const cat of BROWSE_CATEGORIES) {
        const match = allPublished.find(p => p.product_type === cat.value && !seenTypes.has(cat.value));
        if (match) {
          seenTypes.add(cat.value);
          catProds.push(match);
        }
      }
      setCategoryProducts(catProds);

      // Process recently viewed
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

  // Enrich category cards with real product images
  const enrichedCategories = CATEGORY_CARDS.map(cat => ({
    ...cat,
    items: cat.items.map(item => {
      const typeMap: Record<string, string> = {
        'Color Presets': 'preset', 'LUTs': 'lut', 'SFX Packs': 'sfx',
        'Music': 'music', 'Templates': 'template', 'Project Files': 'project_file',
        'Overlays': 'overlay', 'Digital Art': 'digital_art',
      };
      const type = typeMap[item.label];
      return { ...item, image: (type && categoryImages[type]) || item.image };
    }),
  }));

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

      {/* Recently Viewed Carousel */}
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
