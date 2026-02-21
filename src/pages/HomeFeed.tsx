import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { CategoryCard } from '@/components/home/CategoryCard';
import { ProductCarousel } from '@/components/home/ProductCarousel';
import { Reveal } from '@/components/home/Reveal';
import { Sparkles, ArrowRight } from 'lucide-react';

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

const CATEGORY_CARDS = [
  {
    title: 'Presets & LUTs',
    items: [
      { label: 'Color Presets', image: null, link: '/products?type=preset' },
      { label: 'LUTs', image: null, link: '/products?type=lut' },
      { label: 'Film Looks', image: null, link: '/products?tag=film' },
      { label: 'Cinematic', image: null, link: '/products?tag=cinematic' },
    ],
    footerLink: { label: 'Explore all presets', to: '/products?type=preset' },
  },
  {
    title: 'Sound & Music',
    items: [
      { label: 'SFX Packs', image: null, link: '/products?type=sfx' },
      { label: 'Music', image: null, link: '/products?type=music' },
      { label: 'Transitions', image: null, link: '/products?tag=transition' },
      { label: 'Ambience', image: null, link: '/products?tag=ambience' },
    ],
    footerLink: { label: 'Browse all audio', to: '/products?type=sfx' },
  },
  {
    title: 'AI Studio Tools',
    items: [
      { label: 'Vocal Isolator', image: null, link: '/studio/voice-isolator' },
      { label: 'Music Splitter', image: null, link: '/studio/music-splitter' },
      { label: 'SFX Generator', image: null, link: '/studio/sfx-generator' },
      { label: 'Video Editor', image: null, link: '/studio/video-editor' },
    ],
    footerLink: { label: 'Open AI Studio', to: '/studio' },
  },
  {
    title: 'Templates & Projects',
    items: [
      { label: 'Templates', image: null, link: '/products?type=template' },
      { label: 'Project Files', image: null, link: '/products?type=project_file' },
      { label: 'Overlays', image: null, link: '/products?type=overlay' },
      { label: 'Digital Art', image: null, link: '/products?type=digital_art' },
    ],
    footerLink: { label: 'See all templates', to: '/products?type=template' },
  },
];

export default function HomeFeed() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [newReleases, setNewReleases] = useState<Product[]>([]);
  const [freeProducts, setFreeProducts] = useState<Product[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const [categoryImages, setCategoryImages] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'SellsPay — Home';
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchAll = async () => {
      // Parallel fetches for speed
      const [trendingRes, newRes, freeRes, viewedRes, catImagesRes] = await Promise.all([
        // Trending (most liked in 14 days)
        supabase
          .from('product_likes')
          .select('product_id')
          .gte('created_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()),
        // New releases
        supabase
          .from('products')
          .select('id, name, status, product_type, featured, cover_image_url, preview_video_url, pricing_type, subscription_access, price_cents, currency, youtube_url, tags, created_at, creator_id')
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .limit(20),
        // Free products
        supabase
          .from('products')
          .select('id, name, status, product_type, featured, cover_image_url, preview_video_url, pricing_type, subscription_access, price_cents, currency, youtube_url, tags, created_at, creator_id')
          .eq('status', 'published')
          .or('price_cents.is.null,price_cents.eq.0')
          .order('created_at', { ascending: false })
          .limit(20),
        // Recently viewed
        supabase
          .from('product_views')
          .select('product_id')
          .eq('viewer_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20),
        // Category card images - grab one product image per type
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

      // Fallback: fill with recent if not enough trending
      if (trendingData.length < 6) {
        const existingIds = new Set(trendingData.map(p => p.id));
        const filler = (newRes.data || []).filter(p => !existingIds.has(p.id));
        trendingData = [...trendingData, ...filler].slice(0, 20);
      }

      setTrendingProducts(trendingData);
      setNewReleases((newRes.data || []) as Product[]);
      setFreeProducts((freeRes.data || []) as Product[]);

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

      setLoading(false);
    };

    fetchAll();
  }, [user]);

  // Enrich category cards with real product images
  const enrichedCategories = CATEGORY_CARDS.map(cat => ({
    ...cat,
    items: cat.items.map(item => {
      // Try to match a product type from the label
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
    <div className="min-h-screen bg-background pb-16">
      {/* Greeting bar */}
      <div className="px-6 sm:px-8 lg:px-10 pt-8 pb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
          Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}
        </h1>
      </div>

      {/* Category Cards Grid - Amazon style */}
      <Reveal>
        <section className="px-6 sm:px-8 lg:px-10 pb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {enrichedCategories.map(cat => (
              <CategoryCard
                key={cat.title}
                title={cat.title}
                items={cat.items}
                footerLink={cat.footerLink}
              />
            ))}
          </div>
        </section>
      </Reveal>

      {/* Trending Products Carousel */}
      <Reveal>
        <div className="pb-8">
          <ProductCarousel
            title="Trending Now"
            products={trendingProducts}
            viewAllLink="/products"
          />
        </div>
      </Reveal>

      {/* New Releases Carousel */}
      <Reveal>
        <div className="pb-8">
          <ProductCarousel
            title="New Releases"
            products={newReleases}
            viewAllLink="/products?sort=newest"
          />
        </div>
      </Reveal>

      {/* Free Downloads Carousel */}
      {freeProducts.length > 0 && (
        <Reveal>
          <div className="pb-8">
            <ProductCarousel
              title="Free Downloads"
              products={freeProducts}
              viewAllLink="/products?pricing=free"
            />
          </div>
        </Reveal>
      )}

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

      {/* AI Studio Banner */}
      <Reveal>
        <section className="px-6 sm:px-8 lg:px-10 pb-8">
          <Link
            to="/studio"
            className="block rounded-lg border border-border/40 bg-card p-6 hover:border-primary/30 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-sm">AI Studio</h3>
                  <p className="text-xs text-muted-foreground">Vocal isolation, stem splitting, SFX generation & more</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </Link>
        </section>
      </Reveal>
    </div>
  );
}
