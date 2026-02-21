import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import HeroSection from '@/components/home/HeroSection';
import SlidingBanner from '@/components/home/SlidingBanner';
import { FeatureTabsBar } from '@/components/home/FeatureTabsBar';
import { AIToolsReveal } from '@/components/home/AIToolsReveal';
import { AIStudioPromo } from '@/components/home/AIStudioPromo';
import { ValueProps } from '@/components/home/ValueProps';
import { FeaturedCreators } from '@/components/home/FeaturedCreators';
import { Reveal } from '@/components/home/Reveal';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles, Flame } from 'lucide-react';
import HomeFeed from './HomeFeed';

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

  // Only fetch landing page data for guests
  useEffect(() => {
    if (user) {
      setLoading(false);
      return;
    }

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
  }, [user]);

  // Signed-in users see the feed
  if (user) {
    return <HomeFeed />;
  }

  // Guests see the landing page
  return (
    <div className="min-h-screen bg-background">
      <HeroSection />
      <SlidingBanner />
      <FeatureTabsBar />
      <AIToolsReveal />
      <AIStudioPromo />
      <ValueProps />
      <Reveal>
        <MassiveProductGrid 
          products={featuredWithStats} 
          allProducts={products}
          loading={loading} 
        />
      </Reveal>
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
    <section className="py-20 sm:py-28 lg:py-36">
      <div className="px-6 sm:px-8 lg:px-12 mb-14 sm:mb-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground mb-3">
              Curated Collection
            </p>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-foreground tracking-tight">
              Featured Assets
            </h2>
          </div>
          <Button 
            onClick={() => navigate('/products')} 
            variant="ghost"
            className="px-0 h-auto text-base font-medium group text-foreground/70 hover:text-foreground hover:bg-transparent"
          >
            View All
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </div>

      <div className="px-0">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-[2px]">
          {displayProducts.slice(0, 12).map((product, index) => (
            <div 
              key={product.id}
              className={`${
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

      <div className="text-center mt-16 sm:mt-20 px-6">
        <Button 
          onClick={() => navigate('/products')} 
          className="px-14 h-16 text-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300"
        >
          Explore All Assets
          <ArrowRight className="ml-3 h-6 w-6" />
        </Button>
      </div>
    </section>
  );
}
