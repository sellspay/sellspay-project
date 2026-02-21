import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { CategoryCard } from '@/components/home/CategoryCard';
import { ProductCarousel } from '@/components/home/ProductCarousel';
import { Reveal } from '@/components/home/Reveal';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight, Play, Music, Palette, Video, BookOpen, Code, Image, Layers, FileText, Package, Mic, Shapes, Brush, MonitorSmartphone, PenTool, Camera, Gamepad2, Presentation, ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from '@/components/ProductCard';

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

const BROWSE_CATEGORIES = [
  { label: 'Presets', value: 'preset', icon: Palette },
  { label: 'LUTs', value: 'lut', icon: Video },
  { label: 'Sound Effects', value: 'sfx', icon: Music },
  { label: 'Music', value: 'music', icon: Mic },
  { label: 'Templates', value: 'template', icon: Layers },
  { label: 'Courses', value: 'course', icon: BookOpen },
  { label: 'Tutorials', value: 'tutorial', icon: Presentation },
  { label: 'Digital Art', value: 'digital_art', icon: Brush },
  { label: 'SaaS', value: 'saas', icon: Code },
  { label: 'Software', value: 'software', icon: MonitorSmartphone },
  { label: 'Plugins', value: 'plugin', icon: Package },
  { label: '3D Assets', value: '3d_asset', icon: Shapes },
  { label: 'UI Kits', value: 'ui_kit', icon: PenTool },
  { label: 'Mockups', value: 'mockup', icon: Image },
  { label: 'Photography', value: 'photography', icon: Camera },
  { label: 'eBooks', value: 'ebook', icon: FileText },
  { label: 'Illustrations', value: 'illustration', icon: Brush },
  { label: 'Motion Graphics', value: 'motion_graphics', icon: Gamepad2 },
  { label: 'Overlays', value: 'overlay', icon: Layers },
  { label: 'Fonts', value: 'font', icon: PenTool },
];

export default function HomeFeed() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const [categoryImages, setCategoryImages] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollCatLeft, setCanScrollCatLeft] = useState(false);
  const [canScrollCatRight, setCanScrollCatRight] = useState(true);

  useEffect(() => {
    document.title = 'SellsPay — Home';
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchAll = async () => {
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

      setLoading(false);
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
    <div className="min-h-screen bg-background pb-16">
      {/* Greeting bar */}
      <div className="px-6 sm:px-8 lg:px-10 pt-8 pb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
          Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}
        </h1>
      </div>

      {/* Category Cards Grid */}
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

      {/* Browse by Category — single horizontal row of product cards */}
      {categoryProducts.length > 0 && (
        <Reveal>
          <section className="relative pb-8">
            <div className="flex items-center justify-between px-6 sm:px-8 lg:px-10 mb-3">
              <h2 className="text-lg font-bold text-foreground tracking-tight">Browse by Category</h2>
              <Link to="/products" className="text-xs text-primary hover:underline flex items-center gap-1">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="relative group/catcarousel">
              {canScrollCatLeft && (
                <button
                  onClick={() => {
                    categoryScrollRef.current?.scrollBy({ left: -(categoryScrollRef.current.clientWidth * 0.75), behavior: 'smooth' });
                  }}
                  className="absolute left-1 top-1/2 -translate-y-1/2 z-10 h-20 w-10 bg-card/90 border border-border/50 rounded-md flex items-center justify-center text-foreground hover:bg-card transition-colors shadow-lg opacity-0 group-hover/catcarousel:opacity-100"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}
              {canScrollCatRight && (
                <button
                  onClick={() => {
                    categoryScrollRef.current?.scrollBy({ left: categoryScrollRef.current.clientWidth * 0.75, behavior: 'smooth' });
                  }}
                  className="absolute right-1 top-1/2 -translate-y-1/2 z-10 h-20 w-10 bg-card/90 border border-border/50 rounded-md flex items-center justify-center text-foreground hover:bg-card transition-colors shadow-lg opacity-0 group-hover/catcarousel:opacity-100"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              )}

              <div
                ref={categoryScrollRef}
                className="flex gap-[2px] overflow-x-auto scrollbar-hide px-6 sm:px-8 lg:px-10"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                onScroll={() => {
                  const el = categoryScrollRef.current;
                  if (!el) return;
                  setCanScrollCatLeft(el.scrollLeft > 4);
                  setCanScrollCatRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
                }}
              >
                {categoryProducts.map((product) => {
                  const cat = BROWSE_CATEGORIES.find(c => c.value === product.product_type);
                  return (
                    <Link
                      key={product.id}
                      to={`/products?type=${product.product_type}`}
                      className="flex-none w-[200px] sm:w-[220px] relative group"
                    >
                      <ProductCard product={product} showType={true} showCreator={true} />
                      {cat && (
                        <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded bg-primary text-primary-foreground text-[10px] font-semibold uppercase tracking-wider">
                          {cat.label}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
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

      {/* AI Studio Banner — big cinematic video banner */}
      <Reveal>
        <section className="px-6 sm:px-8 lg:px-10 pb-8">
          <Link
            to="/studio"
            className="group relative block w-full overflow-hidden rounded-xl border border-border/40"
            style={{ aspectRatio: '21/7' }}
          >
            {/* Video background — user can add a video later */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-primary/10" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_40%,_hsl(var(--background))_100%)]" />

            {/* Content overlay */}
            <div className="relative z-10 flex flex-col items-center justify-center h-full gap-4 sm:gap-5">
              <div className="flex items-center gap-2.5">
                <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                <span className="text-xs sm:text-sm font-medium uppercase tracking-[0.2em] text-primary">
                  AI-Powered
                </span>
              </div>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight text-center">
                AI Studio
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground text-center max-w-md px-4">
                Vocal isolation, stem splitting, SFX generation & more
              </p>
              <Button
                className="mt-1 sm:mt-2 px-8 h-11 sm:h-12 text-sm sm:text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                asChild
              >
                <span>
                  Open Studio
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Button>
            </div>
          </Link>
        </section>
      </Reveal>
    </div>
  );
}
