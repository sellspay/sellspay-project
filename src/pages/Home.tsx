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
        <section className="relative py-20 lg:py-28 overflow-hidden">
          {/* Subtle background */}
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-gradient-to-r from-primary/3 via-transparent to-primary/3 rounded-full blur-3xl" />
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            {/* Minimal Section Header */}
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-xs font-medium text-primary uppercase tracking-[0.2em] mb-2">Curated</p>
                <h2 className="text-2xl lg:text-3xl font-semibold text-foreground">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
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
          <section className="py-16 lg:py-24 bg-muted/30">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
              {/* Section Header */}
              <div className="text-center mb-16">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/50 border border-border mb-6">
                  <TrendingUp className="h-4 w-4 text-foreground" />
                  <span className="text-sm font-medium text-foreground">Browse by Category</span>
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                  Explore by Type
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Find exactly what you need for your next project
                </p>
              </div>

              <div className="space-y-20">
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

      {/* CTA Section */}
      <Reveal>
        <section className="py-24 lg:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl text-center">
            <div className="relative p-12 lg:p-16 rounded-3xl bg-gradient-to-br from-primary/10 via-background to-accent/10 border border-border overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
              
              <div className="relative z-10">
                <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                  Ready to create something amazing?
                </h2>
                <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
                  Join thousands of creators using EditorsParadise to level up their content.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild size="lg" className="rounded-full px-8">
                    <Link to="/products">Browse Store</Link>
                  </Button>
                  {!user && (
                    <Button asChild size="lg" variant="outline" className="rounded-full px-8">
                      <Link to="/signup">Create Account</Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </Reveal>
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
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            {icon}
          </div>
          <div>
            <h3 className="text-2xl font-semibold text-foreground">{title}</h3>
            <p className="text-muted-foreground">{description}</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          className="group hidden sm:flex"
          onClick={() => navigate(`/products?type=${title.toLowerCase()}`)}
        >
          View All
          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.slice(0, 4).map((product) => (
          <ProductCard key={product.id} product={product} showFeaturedBadge={true} showType={false} />
        ))}
      </div>

      <div className="mt-6 text-center sm:hidden">
        <Button 
          variant="outline" 
          onClick={() => navigate(`/products?type=${title.toLowerCase()}`)}
        >
          View All {title}
        </Button>
      </div>
    </div>
  );
}
