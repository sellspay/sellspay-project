import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import HeroSection from '@/components/home/HeroSection';
import { PartnerLogos } from '@/components/home/PartnerLogos';
import { ValueProps } from '@/components/home/ValueProps';
import { FeaturedCreators } from '@/components/home/FeaturedCreators';
import { Reveal } from '@/components/home/Reveal';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles, Flame, TrendingUp } from 'lucide-react';

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
        
        const featured = enriched.filter(p => p.featured === true);
        if (featured.length > 0) {
          const productIds = featured.map(p => p.id);
          
          const { data: likes } = await supabase
            .from('product_likes')
            .select('product_id')
            .in('product_id', productIds);
          
          const { data: comments } = await supabase
            .from('comments')
            .select('product_id')
            .in('product_id', productIds);
          
          const likeMap = new Map<string, number>();
          const commentMap = new Map<string, number>();
          
          likes?.forEach(like => {
            likeMap.set(like.product_id, (likeMap.get(like.product_id) || 0) + 1);
          });
          
          comments?.forEach(comment => {
            commentMap.set(comment.product_id, (commentMap.get(comment.product_id) || 0) + 1);
          });
          
          const allLikeCounts = featured.map(p => likeMap.get(p.id) || 0);
          const maxLikes = Math.max(...allLikeCounts, 1);
          const hotThreshold = maxLikes * 0.5;
          
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

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <HeroSection />

      {/* Partner Logos */}
      <PartnerLogos />

      {/* MASSIVE Content Grid - Featured Products */}
      <Reveal>
        <MassiveProductGrid 
          products={featuredWithStats} 
          allProducts={products}
          loading={loading} 
        />
      </Reveal>

      {/* Value Propositions */}
      <ValueProps />

      {/* Category Showcase - Full Width Dense Grid */}
      <Reveal>
        <CategoryShowcase products={products} />
      </Reveal>

      {/* Featured Creators */}
      <FeaturedCreators />
    </div>
  );
}

// MASSIVE Product Grid - Edge to edge, dense like Artlist
interface MassiveProductGridProps {
  products: FeaturedProduct[];
  allProducts: Product[];
  loading: boolean;
}

function MassiveProductGrid({ products, allProducts, loading }: MassiveProductGridProps) {
  const navigate = useNavigate();
  
  // Show featured products or fall back to all products
  const displayProducts = products.length > 0 ? products : allProducts.slice(0, 12);
  
  if (loading) {
    return (
      <section className="py-16">
        <div className="flex items-center justify-center py-32">
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-primary border-t-transparent" />
        </div>
      </section>
    );
  }

  if (displayProducts.length === 0) {
    return null;
  }

  return (
    <section className="py-16 sm:py-24">
      {/* Section Header - Full width */}
      <div className="px-4 sm:px-8 lg:px-12 mb-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20">
              <Sparkles className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight">
                Featured Assets
              </h2>
              <p className="text-muted-foreground text-base sm:text-lg mt-1">
                Hand-picked by our editorial team
              </p>
            </div>
          </div>
          <Button 
            onClick={() => navigate('/products')} 
            variant="outline"
            className="rounded-full px-8 h-12 text-base font-medium group border-2"
          >
            View All
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </div>

      {/* EDGE-TO-EDGE Dense Grid */}
      <div className="px-2 sm:px-4 lg:px-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 sm:gap-3 lg:gap-4">
          {displayProducts.slice(0, 12).map((product, index) => (
            <div 
              key={product.id}
              className={`${
                // Make first item larger on desktop
                index === 0 ? 'sm:col-span-2 sm:row-span-2' : ''
              }`}
            >
              <ProductCard 
                product={product} 
                showFeaturedBadge={true} 
                showType={true}
                likeCount={'likeCount' in product ? (product as FeaturedProduct).likeCount : undefined}
                commentCount={'commentCount' in product ? (product as FeaturedProduct).commentCount : undefined}
                showEngagement={'likeCount' in product}
                isHot={'isHot' in product ? (product as FeaturedProduct).isHot : false}
                size={index === 0 ? 'large' : 'default'}
                showCreator={true}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Load More CTA */}
      <div className="text-center mt-12 px-4">
        <Button 
          onClick={() => navigate('/products')} 
          className="rounded-full px-12 h-14 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
        >
          Explore All Assets
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </section>
  );
}

// Category Showcase - Dense grid per category
const SHOWCASE_CATEGORIES = [
  { id: 'lut', label: 'LUTs', icon: '🎨' },
  { id: 'preset', label: 'Presets', icon: '⚡' },
  { id: 'sfx', label: 'Sound Effects', icon: '🔊' },
  { id: 'template', label: 'Templates', icon: '📐' },
  { id: 'overlay', label: 'Overlays', icon: '✨' },
  { id: 'tutorial', label: 'Tutorials', icon: '📚' },
];

interface CategoryShowcaseProps {
  products: Product[];
}

function CategoryShowcase({ products }: CategoryShowcaseProps) {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('lut');
  
  const filteredProducts = products.filter(p => p.product_type === activeCategory);
  const displayProducts = filteredProducts.slice(0, 8);

  if (products.length === 0) return null;

  return (
    <section className="py-16 sm:py-24 bg-card/50">
      {/* Section Header */}
      <div className="px-4 sm:px-8 lg:px-12 mb-10">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20">
            <TrendingUp className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight">
              Browse by Category
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg mt-1">
              Find exactly what you're looking for
            </p>
          </div>
        </div>

        {/* Category Pills - Large & Bold */}
        <div className="flex flex-wrap gap-3">
          {SHOWCASE_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            const count = products.filter(p => p.product_type === cat.id).length;
            
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`
                  flex items-center gap-2.5 px-6 py-3 rounded-full text-base font-medium
                  transition-all duration-200
                  ${isActive 
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' 
                    : 'bg-card text-foreground border-2 border-border hover:border-primary/50 hover:bg-card/80'
                  }
                `}
              >
                <span className="text-lg">{cat.icon}</span>
                {cat.label}
                <span className={`text-sm ${isActive ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                  ({count})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Products Grid - Dense */}
      <div className="px-2 sm:px-4 lg:px-6">
        {displayProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
            {displayProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                showFeaturedBadge={true} 
                showType={false}
                showCreator={true}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-muted-foreground text-lg mb-2">No products in this category yet</p>
            <p className="text-sm text-muted-foreground/70">Check back soon!</p>
          </div>
        )}
      </div>

      {/* View Category CTA */}
      {displayProducts.length > 0 && (
        <div className="text-center mt-10 px-4">
          <Button 
            onClick={() => navigate(`/products?type=${activeCategory}`)}
            variant="outline"
            className="rounded-full px-10 h-12 text-base font-medium group border-2"
          >
            View All {SHOWCASE_CATEGORIES.find(c => c.id === activeCategory)?.label}
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      )}
    </section>
  );
}
