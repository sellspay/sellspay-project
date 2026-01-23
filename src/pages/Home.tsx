import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import HeroSection from '@/components/home/HeroSection';
import SlidingBanner from '@/components/home/SlidingBanner';
import HorizontalProductRow from '@/components/home/HorizontalProductRow';
import { Button } from '@/components/ui/button';

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
}

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, status, product_type, featured, cover_image_url, preview_video_url, pricing_type, price_cents, currency, youtube_url, tags')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to load products:', error);
        setProducts([]);
      } else {
        setProducts(data || []);
      }
      setLoading(false);
    }

    fetchProducts();
  }, []);

  const popularPicks = products.filter(p => p.featured === true);
  const tutorials = products.filter(p => p.product_type === 'tutorial');
  const projectFiles = products.filter(p => p.product_type === 'project_file');

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <HeroSection />

      {/* Sliding Banner */}
      <SlidingBanner />

      {/* Products Section */}
      <section className="relative py-20 lg:py-24">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.06),transparent_60%)]" />

        <div className="max-w-7xl mx-auto px-6">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Tools to power your best work
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Browse by product type and discover community favorites.
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent mb-4" />
              <p className="text-muted-foreground">Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="text-muted-foreground mb-6">No products available yet.</p>
              {user && (
                <Button onClick={() => navigate('/create-product')} size="lg">
                  Create Product
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-16">
              {popularPicks.length > 0 && (
                <HorizontalProductRow title="Popular Picks" products={popularPicks} />
              )}
              {tutorials.length > 0 && (
                <HorizontalProductRow title="Tutorials" products={tutorials} />
              )}
              {projectFiles.length > 0 && (
                <HorizontalProductRow title="Project Files" products={projectFiles} />
              )}
              {products.length > 0 && !popularPicks.length && !tutorials.length && !projectFiles.length && (
                <HorizontalProductRow title="All Products" products={products} />
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
