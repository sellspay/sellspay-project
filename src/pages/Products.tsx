import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Search, X, ChevronDown, Check, Grid3X3, LayoutGrid } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ProductCard from '@/components/ProductCard';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  description: string | null;
  status: string;
  product_type: string | null;
  featured: boolean | null;
  cover_image_url: string | null;
  preview_video_url: string | null;
  youtube_url: string | null;
  pricing_type: string | null;
  subscription_access?: string | null;
  included_in_subscription?: boolean;
  price_cents: number | null;
  currency: string | null;
  tags: string[] | null;
  created_at: string | null;
  creator_id: string | null;
}

const productTypes = [
  { value: "preset", label: "Presets" },
  { value: "lut", label: "LUTs" },
  { value: "sfx", label: "Sound Effects" },
  { value: "music", label: "Music" },
  { value: "template", label: "Templates" },
  { value: "overlay", label: "Overlays" },
  { value: "font", label: "Fonts" },
  { value: "tutorial", label: "Tutorials" },
  { value: "project_file", label: "Project Files" },
  { value: "transition", label: "Transitions" },
  { value: "color_grading", label: "Color Grading" },
  { value: "motion_graphics", label: "Motion Graphics" },
  { value: "digital_art", label: "Digital Art" },
  { value: "art", label: "Art" },
  { value: "3d_artist", label: "3D Assets" },
  { value: "other", label: "Other" },
];

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priceFilter, setPriceFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [gridSize, setGridSize] = useState<'normal' | 'large'>('large');

  useEffect(() => {
    async function fetchProducts() {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, description, status, product_type, featured, cover_image_url, preview_video_url, youtube_url, pricing_type, subscription_access, price_cents, currency, tags, created_at, creator_id')
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
        setProducts(base.map((p) => ({ ...p, included_in_subscription: includedIds.has(p.id) })));
      }
      setLoading(false);
    }
    fetchProducts();
  }, []);

  const productTypeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach(p => {
      if (p.product_type) counts[p.product_type] = (counts[p.product_type] || 0) + 1;
    });
    return counts;
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === 'all' || product.product_type === typeFilter;
      const matchesPrice = priceFilter === 'all' ||
        (priceFilter === 'free' && product.pricing_type === 'free') ||
        (priceFilter === 'paid' && product.pricing_type !== 'free');
      return matchesSearch && matchesType && matchesPrice;
    });

    switch (sortBy) {
      case 'price-low':
        result = [...result].sort((a, b) => (a.price_cents || 0) - (b.price_cents || 0));
        break;
      case 'price-high':
        result = [...result].sort((a, b) => (b.price_cents || 0) - (a.price_cents || 0));
        break;
      case 'featured':
        result = [...result].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
        break;
    }
    return result;
  }, [products, searchQuery, typeFilter, priceFilter, sortBy]);

  const clearFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setPriceFilter('all');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Search Bar — full width */}
      <div className="sticky top-16 z-40 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-4 sm:px-6 py-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 bg-muted/50 border-border/50 focus-visible:ring-primary/30 text-sm"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Sort */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-10 border-border/50 bg-muted/50 text-sm shrink-0">
                Sort
                <ChevronDown className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card border-border">
              {[
                { value: 'newest', label: 'Newest' },
                { value: 'featured', label: 'Featured' },
                { value: 'price-low', label: 'Price: Low → High' },
                { value: 'price-high', label: 'Price: High → Low' },
              ].map((opt) => (
                <DropdownMenuItem key={opt.value} onClick={() => setSortBy(opt.value)}>
                  {sortBy === opt.value && <Check className="h-3.5 w-3.5 mr-2" />}
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Grid toggle — desktop only */}
          <div className="hidden md:flex items-center gap-1 p-1 bg-muted/50 rounded-lg border border-border/50">
            <button
              onClick={() => setGridSize('normal')}
              className={cn("p-1.5 rounded transition-colors", gridSize === 'normal' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground')}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setGridSize('large')}
              className={cn("p-1.5 rounded transition-colors", gridSize === 'large' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground')}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content: Sidebar + Grid */}
      <div className="flex">
        {/* Left Sidebar — categories */}
        <aside className="hidden lg:block w-56 shrink-0 border-r border-border/40 sticky top-[7.5rem] h-[calc(100vh-7.5rem)] overflow-y-auto p-4">
          <h3 className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-4">Categories</h3>
          <nav className="flex flex-col gap-0.5">
            <button
              onClick={() => setTypeFilter('all')}
              className={cn(
                "flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all",
                typeFilter === 'all'
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-foreground/60 hover:text-foreground hover:bg-muted/50'
              )}
            >
              <span>All</span>
              <span className="text-xs text-muted-foreground">{products.length}</span>
            </button>
            {productTypes.map((t) => {
              const count = productTypeCounts[t.value] || 0;
              if (count === 0) return null;
              return (
                <button
                  key={t.value}
                  onClick={() => setTypeFilter(t.value)}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all",
                    typeFilter === t.value
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-foreground/60 hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  <span>{t.label}</span>
                  <span className="text-xs text-muted-foreground">{count}</span>
                </button>
              );
            })}
          </nav>

          {/* Price filter */}
          <div className="mt-6 pt-6 border-t border-border/40">
            <h3 className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-4">Price</h3>
            <nav className="flex flex-col gap-0.5">
              {[
                { value: 'all', label: 'All' },
                { value: 'free', label: 'Free' },
                { value: 'paid', label: 'Paid' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPriceFilter(opt.value)}
                  className={cn(
                    "px-3 py-2 rounded-lg text-sm text-left transition-all",
                    priceFilter === opt.value
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-foreground/60 hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Mobile category pills */}
        <div className="lg:hidden sticky top-[7.5rem] z-30 bg-background/80 backdrop-blur-xl border-b border-border/40">
          <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-hide">
            <button
              onClick={() => setTypeFilter('all')}
              className={cn(
                "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                typeFilter === 'all'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border/50 text-foreground/60 hover:text-foreground'
              )}
            >
              All
            </button>
            {productTypes.map((t) => {
              const count = productTypeCounts[t.value] || 0;
              if (count === 0) return null;
              return (
                <button
                  key={t.value}
                  onClick={() => setTypeFilter(t.value)}
                  className={cn(
                    "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                    typeFilter === t.value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border/50 text-foreground/60 hover:text-foreground'
                  )}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Products Grid — fills remaining space */}
        <main className="flex-1 min-w-0 p-4 sm:p-6">
          {loading ? (
            <div className={cn(
              "grid gap-4",
              gridSize === 'large' ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            )}>
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-[4/3] bg-muted/30 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                <Search className="w-7 h-7 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No products found</h3>
              <p className="text-sm text-muted-foreground mb-6">Try adjusting your filters or search</p>
              <Button variant="outline" size="sm" onClick={clearFilters} className="border-border/50">
                <X className="h-4 w-4 mr-2" />
                Clear filters
              </Button>
            </div>
          ) : (
            <motion.div
              layout
              className={cn(
                "grid gap-4",
                gridSize === 'large' ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              )}
            >
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.2) }}
                  >
                    <ProductCard
                      product={product}
                      showFeaturedBadge={true}
                      showType={true}
                      showCreator={true}
                      createdAt={product.created_at}
                      size={gridSize === 'large' ? 'large' : 'default'}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
}
