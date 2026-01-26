import { useState, useEffect } from 'react';
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
import { ArrowRight, Sparkles, TrendingUp, Zap } from 'lucide-react';

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
        <section className="relative py-12 sm:py-20 lg:py-28 overflow-hidden">
          {/* Subtle background */}
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[1000px] h-[400px] sm:h-[600px] bg-gradient-to-r from-primary/3 via-transparent to-primary/3 rounded-full blur-3xl" />
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            {/* Minimal Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-10">
              <div>
                <p className="text-xs font-medium text-primary uppercase tracking-[0.2em] mb-1.5 sm:mb-2">Curated</p>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-foreground">
                  Featured Products
                </h2>
              </div>
              {featuredWithStats.length > 4 && (
                <Link 
                  to="/products?featured=true"
                  className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                >
                  View all
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : featuredWithStats.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-muted-foreground mb-4">No featured products yet</p>
                <Button onClick={() => navigate('/products')} variant="outline" size="sm">
                  Browse Store
                </Button>
              </div>
            ) : (
              <>
                {/* Clean Grid Layout */}
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
                  {featuredWithStats.slice(0, 8).map((product) => (
                    <ProductCard 
                      key={product.id}
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
                  ))}
                </div>

                {/* Mobile View All */}
                {featuredWithStats.length > 4 && (
                  <div className="text-center mt-8 sm:hidden">
                    <Button 
                      onClick={() => navigate('/products?featured=true')} 
                      variant="outline"
                      size="sm"
                    >
                      View All Featured
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </Reveal>

      {/* Value Propositions */}
      <ValueProps />

      {/* Category Sections */}
      {(tutorials.length > 0 || projectFiles.length > 0 || presets.length > 0) && (
        <Reveal>
          <section className="relative py-12 sm:py-20 lg:py-28 overflow-hidden">
            {/* Premium background with floating orbs */}
            <div className="absolute inset-0 -z-10">
              <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background" />
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
              
              {/* Floating orbs - smaller on mobile */}
              <div 
                className="absolute top-1/4 left-[15%] w-[250px] sm:w-[500px] h-[250px] sm:h-[500px] bg-primary/8 rounded-full blur-[80px] sm:blur-[120px] animate-float"
                style={{ animationDuration: '8s' }}
              />
              <div 
                className="hidden sm:block absolute bottom-1/4 right-[10%] w-[400px] h-[400px] bg-accent/10 rounded-full blur-[100px] animate-float"
                style={{ animationDelay: '-3s', animationDuration: '10s' }}
              />
              <div 
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[600px] h-[150px] sm:h-[300px] bg-primary/5 rounded-full blur-[60px] sm:blur-[80px]"
              />
            </div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative">
              {/* Premium Section Header */}
              <div className="text-center mb-10 sm:mb-16 lg:mb-20">
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

              <div className="space-y-12 sm:space-y-24">
                {/* Tutorials */}
                {tutorials.length > 0 && (
                  <CategorySection
                    title="Tutorials"
                    description="Learn new techniques from expert creators"
                    products={tutorials}
                    icon={<Zap className="h-5 w-5" />}
                  />
                )}

                {/* Project Files */}
                {projectFiles.length > 0 && (
                  <CategorySection
                    title="Project Files"
                    description="Ready-to-use templates and source files"
                    products={projectFiles}
                    icon={<Sparkles className="h-5 w-5" />}
                  />
                )}

                {/* Presets */}
                {presets.length > 0 && (
                  <CategorySection
                    title="Presets"
                    description="One-click styles for your edits"
                    products={presets}
                    icon={<TrendingUp className="h-5 w-5" />}
                  />
                )}
              </div>
            </div>
          </section>
        </Reveal>
      )}

      {/* Testimonials */}
      <Testimonials />

      {/* Featured Creators */}
      <FeaturedCreators />

    </div>
  );
}

// Category Section Component
interface CategorySectionProps {
  title: string;
  description: string;
  products: Product[];
  icon: React.ReactNode;
}

function CategorySection({ title, description, products, icon }: CategorySectionProps) {
  const navigate = useNavigate();
  
  return (
    <div className="relative">
      {/* Glassmorphism card wrapper */}
      <div className="absolute inset-0 -z-10 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10" />
      
      <div className="p-4 sm:p-8 lg:p-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary border border-primary/20 shadow-lg shadow-primary/10">
              {icon}
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-foreground">{title}</h3>
              <p className="text-sm sm:text-base text-muted-foreground">{description}</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            className="group hidden sm:flex bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
            onClick={() => navigate(`/products?type=${title.toLowerCase()}`)}
          >
            View All
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
          {products.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} showFeaturedBadge={true} showType={false} />
          ))}
        </div>

        <div className="mt-6 sm:mt-8 text-center sm:hidden">
          <Button 
            variant="outline" 
            size="sm"
            className="bg-white/5 border-white/10"
            onClick={() => navigate(`/products?type=${title.toLowerCase()}`)}
          >
            View All {title}
          </Button>
        </div>
      </div>
    </div>
  );
}
