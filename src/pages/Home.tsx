import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import HeroSection from '@/components/home/HeroSection';
import SlidingBanner from '@/components/home/SlidingBanner';
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

  const featuredProducts = products.filter(p => p.featured === true);
  const tutorials = products.filter(p => p.product_type === 'tutorial');
  const projectFiles = products.filter(p => p.product_type === 'project_file');
  const presets = products.filter(p => p.product_type === 'preset');

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <HeroSection />

      {/* Sliding Banner */}
      <SlidingBanner />

      {/* Featured Products Section */}
      <section className="relative py-24 lg:py-32">
        {/* Background effects */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Curated Selection</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Featured Products
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Hand-picked tools and resources to elevate your creative workflow
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mb-4" />
              <p className="text-muted-foreground">Loading products...</p>
            </div>
          ) : featuredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-6">
                <Sparkles className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No featured products yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                Check back soon for hand-picked creator tools and resources.
              </p>
              <Button onClick={() => navigate('/products')} size="lg" variant="outline">
                Browse All Products
              </Button>
            </div>
          ) : (
            <>
              {/* Featured Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
                {featuredProducts.slice(0, 8).map((product) => (
                  <ProductCard key={product.id} product={product} showFeaturedBadge={false} showType={true} />
                ))}
              </div>

              {/* View All Button */}
              {featuredProducts.length > 8 && (
                <div className="text-center">
                  <Button 
                    onClick={() => navigate('/products?featured=true')} 
                    size="lg"
                    className="group"
                  >
                    View All Featured
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Category Sections */}
      {(tutorials.length > 0 || projectFiles.length > 0 || presets.length > 0) && (
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
      )}

      {/* CTA Section */}
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
