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
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles, TrendingUp, Zap, Music, Palette, Film, Type, Layers, GraduationCap, FolderOpen, Sliders, Wand2 } from 'lucide-react';
interface Product {
  id: string;
  name: string;
  status: string;
  product_type: string | null;
  featured: boolean | null;
  cover_image_url: string | null;
  preview_video_url: string | null;
  pricing_type: string | null;
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
    async function fetchProducts() {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, status, product_type, featured, cover_image_url, preview_video_url, pricing_type, price_cents, currency, youtube_url, tags, created_at, creator_id')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to load products:', error);
        setProducts([]);
      } else {
        setProducts(data || []);
        
        // Fetch engagement stats for featured products
        const featured = (data || []).filter(p => p.featured === true);
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

// Featured Products Carousel Component
interface FeaturedProductsCarouselProps {
  products: FeaturedProduct[];
  loading: boolean;
}

function FeaturedProductsCarousel({ products, loading }: FeaturedProductsCarouselProps) {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Limit to 12 products max
  const displayProducts = products.slice(0, 12);
  
  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const cardWidth = container.querySelector('div')?.offsetWidth || 280;
    const gap = 20;
    const scrollAmount = (cardWidth + gap) * 4; // Scroll 4 cards at a time
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  return (
    <section className="relative py-12 sm:py-20 lg:py-28 overflow-hidden">
      {/* Subtle background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[1000px] h-[400px] sm:h-[600px] bg-gradient-to-r from-primary/3 via-transparent to-primary/3 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Section Header with scroll controls */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-10">
          <div>
            <p className="text-xs font-medium text-primary uppercase tracking-[0.2em] mb-1.5 sm:mb-2">Curated</p>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-foreground">
              Featured Products
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {/* Scroll arrows */}
            {displayProducts.length > 4 && (
              <div className="hidden sm:flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-full border-border/50 hover:bg-accent"
                  onClick={() => scroll('left')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-full border-border/50 hover:bg-accent"
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
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
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
            {/* Horizontal Scrolling Row - 4 per view */}
            <div
              ref={scrollRef}
              className="flex gap-5 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 snap-x snap-mandatory"
            >
              {displayProducts.map((product) => (
                <div 
                  key={product.id} 
                  className="flex-shrink-0 w-[calc(50%-10px)] sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)] xl:w-[calc(25%-15px)] snap-start"
                >
                  <ProductCard 
                    product={product} 
                    showFeaturedBadge={false} 
                    showType={true}
                    likeCount={product.likeCount}
                    commentCount={product.commentCount}
                    showEngagement={true}
                    isHot={product.isHot}
                    size="default"
                    showCreator={true}
                  />
                </div>
              ))}
            </div>

            {/* View More Button */}
            <div className="text-center mt-8">
              <Button 
                onClick={() => navigate('/products?featured=true')} 
                variant="outline"
                size="sm"
                className="group"
              >
                View More
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

// Category Explorer Component - Unified premium card with filter tabs
const CATEGORY_OPTIONS = [
  { id: 'all', label: 'All', icon: Sparkles },
  { id: 'preset', label: 'Presets', icon: Sliders },
  { id: 'lut', label: 'LUTs', icon: Palette },
  { id: 'sfx', label: 'SFX', icon: Music },
  { id: 'overlay', label: 'Overlays', icon: Layers },
  { id: 'transition', label: 'Transitions', icon: Wand2 },
  { id: 'template', label: 'Templates', icon: Film },
  { id: 'tutorial', label: 'Tutorials', icon: GraduationCap },
  { id: 'project_file', label: 'Project Files', icon: FolderOpen },
  { id: 'font', label: 'Fonts', icon: Type },
];

interface CategoryExplorerProps {
  products: Product[];
}

function CategoryExplorer({ products }: CategoryExplorerProps) {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Filter products by category and get 4 most recent
  const filteredProducts = selectedCategory === 'all'
    ? products.slice(0, 4)
    : products.filter(p => p.product_type === selectedCategory).slice(0, 4);

  // Check if we have any products at all
  if (products.length === 0) return null;

  return (
    <section className="relative py-12 sm:py-20 lg:py-28 overflow-hidden">
      {/* Premium background with floating orbs */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        
        {/* Floating orbs */}
        <div 
          className="absolute top-1/4 left-[15%] w-[250px] sm:w-[500px] h-[250px] sm:h-[500px] bg-primary/8 rounded-full blur-[80px] sm:blur-[120px] animate-float"
          style={{ animationDuration: '8s' }}
        />
        <div 
          className="hidden sm:block absolute bottom-1/4 right-[10%] w-[400px] h-[400px] bg-accent/10 rounded-full blur-[100px] animate-float"
          style={{ animationDelay: '-3s', animationDuration: '10s' }}
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative">
        {/* Premium Section Header */}
        <div className="text-center mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 mb-6 sm:mb-8 shadow-lg shadow-primary/5">
            <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
            <span className="text-xs sm:text-sm font-medium text-foreground">Browse by Category</span>
          </div>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-3 sm:mb-5 tracking-tight">
            Explore by Type
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            Find exactly what you need for your next project
          </p>
        </div>

        {/* Premium Unified Card */}
        <div className="relative">
          {/* Glassmorphism card wrapper with gradient border */}
          <div className="absolute -inset-px rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary/30 via-primary/5 to-accent/20 opacity-50" />
          <div className="relative rounded-2xl sm:rounded-3xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/10 overflow-hidden">
            
            {/* Inner glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
            
            <div className="relative p-4 sm:p-8 lg:p-10">
              {/* Filter Tabs */}
              <div className="mb-8 sm:mb-10">
                <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
                  {CATEGORY_OPTIONS.map((category) => {
                    const Icon = category.icon;
                    const isActive = selectedCategory === category.id;
                    return (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`
                          group flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium
                          transition-all duration-300 ease-out
                          ${isActive 
                            ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25 scale-105' 
                            : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground border border-white/10 hover:border-white/20'
                          }
                        `}
                      >
                        <Icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                        <span className="hidden sm:inline">{category.label}</span>
                        <span className="sm:hidden">{category.label.length > 6 ? category.label.slice(0, 6) : category.label}</span>
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
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-4">
                    <Sparkles className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground mb-2">No products in this category yet</p>
                  <p className="text-sm text-muted-foreground/70">Check back soon for new uploads!</p>
                </div>
              )}

              {/* View All Button */}
              <div className="flex justify-center mt-8 sm:mt-10">
                <Button 
                  onClick={() => navigate(selectedCategory === 'all' ? '/products' : `/products?type=${selectedCategory}`)}
                  className="group bg-gradient-to-r from-primary/90 to-primary hover:from-primary hover:to-primary/90 text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-300"
                >
                  View All {selectedCategory !== 'all' && CATEGORY_OPTIONS.find(c => c.id === selectedCategory)?.label}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
