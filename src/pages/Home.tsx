import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import HorizontalProductRow from '@/components/home/HorizontalProductRow';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

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
    <div className="min-h-screen w-full bg-background relative overflow-visible">
      {/* Hero */}
      <div
        className="relative z-10 w-full"
        style={{
          background: `
            radial-gradient(ellipse at top left, hsl(var(--primary) / 0.15), transparent 50%),
            radial-gradient(ellipse at bottom right, hsl(var(--accent) / 0.1), transparent 50%),
            hsl(var(--background))
          `
        }}
      >
        <div className="relative z-20 w-full px-6 py-16 md:py-24 max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="w-full lg:w-1/2 flex flex-col gap-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm w-fit">
                <Sparkles className="w-4 h-4" />
                Premium Creator Marketplace
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                Welcome to{' '}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  EditorsParadise
                </span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
                Access cutting-edge audio tools and premium creator products. Explore by type and see what the community loves.
              </p>
              {!user && (
                <div className="flex gap-3">
                  <Button size="lg" onClick={() => navigate('/signup')}>
                    Join for free
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => navigate('/products')}>
                    Browse Products
                  </Button>
                </div>
              )}
            </div>

            <div className="hidden lg:flex flex-1 items-center justify-end">
              <div className="relative w-full max-w-md aspect-square">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl blur-3xl" />
                <div className="relative w-full h-full bg-gradient-to-br from-primary/10 to-accent/10 rounded-3xl border border-border flex items-center justify-center">
                  <span className="text-6xl">🎬</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sliding banner */}
      <div className="relative z-10 w-full py-3 overflow-hidden border-y border-border bg-muted/30">
        <div className="slide-text whitespace-nowrap text-sm text-muted-foreground font-medium">
          New Voice Isolator • Music Splitter • Manga Generator • Professional Editors Available • New Voice Isolator • Music Splitter • Manga Generator • Professional Editors Available
        </div>
      </div>

      {/* Main content */}
      <section className="relative z-10 py-16 md:py-20">
        <div className="mx-auto w-full max-w-7xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-2">Tools to power your best work</h2>
            <p className="text-muted-foreground">Browse by product type and discover community favorites.</p>
          </div>

          {loading ? (
            <div className="text-center text-muted-foreground py-8">Loading…</div>
          ) : (
            <div className="space-y-12">
              {popularPicks.length > 0 && (
                <HorizontalProductRow title="Popular Picks" products={popularPicks} limit={12} />
              )}
              {tutorials.length > 0 && (
                <HorizontalProductRow title="Tutorials" products={tutorials} limit={12} />
              )}
              {projectFiles.length > 0 && (
                <HorizontalProductRow title="Project Files" products={projectFiles} limit={12} />
              )}
              {products.length === 0 && (
                <div className="text-center py-16">
                  <p className="text-muted-foreground mb-4">No products yet. Be the first to create one!</p>
                  {user && (
                    <Button onClick={() => navigate('/create-product')}>Create Product</Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
