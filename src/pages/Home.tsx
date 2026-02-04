import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import HeroSection from '@/components/home/HeroSection';
import SlidingBanner from '@/components/home/SlidingBanner';
import { StatsBar } from '@/components/home/StatsBar';
import { PartnerLogos } from '@/components/home/PartnerLogos';
import { ValueProps } from '@/components/home/ValueProps';
import { Testimonials } from '@/components/home/Testimonials';
import { FeaturedCreators } from '@/components/home/FeaturedCreators';
import { Reveal } from '@/components/home/Reveal';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
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

interface FeaturedProduct extends Product {
  likeCount: number;
  commentCount: number;
  isHot: boolean;
}

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [featuredWithStats, setFeaturedWithStats] = useState<FeaturedProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Keep tab title exactly matching the app name for OAuth verification crawlers
    document.title = 'SellsPay';
  }, []);

  useEffect(() => {
    async function fetchProducts() {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, status, product_type, featured, cover_image_url, preview_video_url, pricing_type, subscription_access, price_cents, currency, youtube_url, tags, created_at, creator_id')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to load products:', error);
        setProducts([]);
      } else {
        const base = (data || []) as Product[];

        // Universal subscription tagging for home sections (featured + category explorer)
        const ids = base.map((p) => p.id);
        const includedIds = new Set<string>();
        if (ids.length > 0) {
          const { data: includedRows } = await supabase
            .from('subscription_plan_products')
            .select('product_id, creator_subscription_plans!inner(is_active)')
            .in('product_id', ids)
            .eq('creator_subscription_plans.is_active', true);
          (includedRows || []).forEach((r: any) => {
            if (r?.product_id) includedIds.add(r.product_id);
          });
        }

        const enriched = base.map((p) => ({
          ...p,
          included_in_subscription: includedIds.has(p.id),
        }));

        setProducts(enriched);
        
        // Fetch engagement stats for featured products
        const featured = enriched.filter(p => p.featured === true);
        if (featured.length > 0) {
          const productIds = featured.map(p => p.id);
          
          // Get like counts
          const { data: likes } = await supabase
            .from('product_likes')
            .select('product_id')
            .in('product_id', productIds);
          
          // Get comment counts
          const { data: comments } = await supabase
            .from('comments')
            .select('product_id')
            .in('product_id', productIds);
          
          // Build count maps
          const likeMap = new Map<string, number>();
          const commentMap = new Map<string, number>();
          
          likes?.forEach(like => {
            likeMap.set(like.product_id, (likeMap.get(like.product_id) || 0) + 1);
          });
          
          comments?.forEach(comment => {
            commentMap.set(comment.product_id, (commentMap.get(comment.product_id) || 0) + 1);
          });
          
          // Calculate "hot" threshold (top 20% of likes or recent with engagement)
          const allLikeCounts = featured.map(p => likeMap.get(p.id) || 0);
          const maxLikes = Math.max(...allLikeCounts, 1);
          const hotThreshold = maxLikes * 0.5; // Products with at least 50% of max likes
          
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          
           const featuredWithEngagement: FeaturedProduct[] = featured.map(p => {
            const likes = likeMap.get(p.id) || 0;
            const commentsCount = commentMap.get(p.id) || 0;
            const isRecent = p.created_at ? new Date(p.created_at) > sevenDaysAgo : false;
            const isHot = likes >= hotThreshold || (isRecent && (likes > 0 || commentsCount > 0));
            
            return {
              ...p,
              likeCount: likes,
              commentCount: commentsCount,
              isHot
            };
          });
          
          setFeaturedWithStats(featuredWithEngagement);
        }
      }
      setLoading(false);
    }

    fetchProducts();
  }, []);

  const tutorials = products.filter(p => p.product_type === 'tutorial');
  const projectFiles = products.filter(p => p.product_type === 'project_file');
  const presets = products.filter(p => p.product_type === 'preset');

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <HeroSection />

      {/* Sliding Banner - Right under hero */}
      <SlidingBanner />

      {/* Stats Bar - Social Proof */}
      <StatsBar />

      {/* Featured Products Section */}
      <Reveal>
        <FeaturedProductsCarousel 
          products={featuredWithStats} 
          loading={loading} 
        />
      </Reveal>

      {/* Value Propositions */}
      <ValueProps />

      {/* Unified Category Explorer */}
      <Reveal>
        <CategoryExplorer products={products} />
      </Reveal>

      {/* Testimonials */}
      <Testimonials />

      {/* Featured Creators */}
      <FeaturedCreators />

    </div>
  );
}

// Featured Products Section - Clean grid layout
interface FeaturedProductsCarouselProps {
  products: FeaturedProduct[];
  loading: boolean;
}

function FeaturedProductsCarousel({ products, loading }: FeaturedProductsCarouselProps) {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const displayProducts = products.slice(0, 8);
  
  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const cardWidth = container.querySelector('div')?.offsetWidth || 280;
    const gap = 16;
    const scrollAmount = (cardWidth + gap) * 3;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  return (
    <section className="py-20 sm:py-28 lg:py-36">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 sm:mb-14">
          <div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-2">
              Featured
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg">
              Hand-picked by our team
            </p>
          </div>
          <div className="flex items-center gap-3">
            {displayProducts.length > 4 && (
              <div className="hidden sm:flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-full border-border hover:bg-card hover:border-foreground/20"
                  onClick={() => scroll('left')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-full border-border hover:bg-card hover:border-foreground/20"
                  onClick={() => scroll('right')}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
            <Link 
              to="/products?featured=true"
              className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
          </div>
        ) : displayProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-muted-foreground mb-4">No featured products yet</p>
            <Button onClick={() => navigate('/products')} variant="outline" size="sm">
              Browse Store
            </Button>
          </div>
        ) : (
          <>
            {/* Horizontal scroll */}
            <div
              ref={scrollRef}
              className="flex gap-4 sm:gap-5 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 snap-x snap-mandatory"
            >
              {displayProducts.map((product) => (
                <div 
                  key={product.id} 
                  className="flex-shrink-0 w-[75vw] sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)] xl:w-[calc(25%-15px)] snap-start"
                >
                  <ProductCard 
                    product={product} 
                    showFeaturedBadge={false} 
                    showType={true}
                    likeCount={product.likeCount}
                    commentCount={product.commentCount}
                    showEngagement={true}
                    isHot={product.isHot}
                    size="large"
                    showCreator={true}
                  />
                </div>
              ))}
            </div>

            {/* View More */}
            <div className="text-center mt-10">
              <Button 
                onClick={() => navigate('/products?featured=true')} 
                variant="outline"
                className="rounded-full px-8 group"
              >
                View All Featured
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

// Category Explorer - Clean minimal design
const CATEGORY_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'preset', label: 'Presets' },
  { id: 'lut', label: 'LUTs' },
  { id: 'sfx', label: 'SFX' },
  { id: 'overlay', label: 'Overlays' },
  { id: 'transition', label: 'Transitions' },
  { id: 'template', label: 'Templates' },
  { id: 'tutorial', label: 'Tutorials' },
  { id: 'project_file', label: 'Project Files' },
  { id: 'font', label: 'Fonts' },
  { id: 'digital_art', label: 'Digital Art' },
  { id: 'art', label: 'Art' },
  { id: '3d_artist', label: '3D' },
];

interface CategoryExplorerProps {
  products: Product[];
}

function CategoryExplorer({ products }: CategoryExplorerProps) {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const filteredProducts = selectedCategory === 'all'
    ? products.slice(0, 4)
    : products.filter(p => p.product_type === selectedCategory).slice(0, 4);

  if (products.length === 0) return null;

  return (
    <section className="py-20 sm:py-28 lg:py-36 bg-card/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-3">
            Browse by category
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg">
            Find exactly what you need
          </p>
        </div>

        {/* Filter Tabs - Clean pill style */}
        <div className="mb-10 sm:mb-14 -mx-4 sm:mx-0">
          <div className="flex sm:flex-wrap gap-2 sm:gap-3 sm:justify-center overflow-x-auto scrollbar-hide px-4 sm:px-0 pb-2 sm:pb-0">
            {CATEGORY_OPTIONS.map((category) => {
              const isActive = selectedCategory === category.id;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`
                    flex-shrink-0 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-sm font-medium
                    transition-all duration-200 whitespace-nowrap
                    ${isActive 
                      ? 'bg-foreground text-background' 
                      : 'bg-card text-muted-foreground hover:text-foreground border border-border hover:border-foreground/30'
                    }
                  `}
                >
                  {category.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                showFeaturedBadge={true} 
                showType={true}
                showCreator={true}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-muted-foreground mb-2">No products in this category yet</p>
            <p className="text-sm text-muted-foreground/70">Check back soon for new uploads!</p>
          </div>
        )}

        {/* View All */}
        <div className="flex justify-center mt-10 sm:mt-14">
          <Button 
            onClick={() => navigate(selectedCategory === 'all' ? '/products' : `/products?type=${selectedCategory}`)}
            variant="outline"
            className="rounded-full px-8 group"
          >
            View All {selectedCategory !== 'all' && CATEGORY_OPTIONS.find(c => c.id === selectedCategory)?.label}
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </div>
    </section>
  );
}
