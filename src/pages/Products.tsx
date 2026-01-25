import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Search, X, Sparkles, Filter, Grid3X3, LayoutGrid, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ProductCard from '@/components/ProductCard';
import { motion, AnimatePresence } from 'framer-motion';

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
  price_cents: number | null;
  currency: string | null;
  tags: string[] | null;
}

const productTypeLabels: Record<string, string> = {
  preset: "Preset Pack",
  lut: "LUT Pack",
  sfx: "Sound Effects",
  music: "Music",
  template: "Template",
  overlay: "Overlay",
  font: "Font",
  tutorial: "Tutorial",
  project_file: "Project File",
  transition: "Transition Pack",
  color_grading: "Color Grading",
  motion_graphics: "Motion Graphics",
  other: "Other",
};

const productTypeIcons: Record<string, string> = {
  preset: "🎨",
  lut: "🌈",
  sfx: "🔊",
  music: "🎵",
  template: "📐",
  overlay: "✨",
  font: "🔤",
  tutorial: "📚",
  project_file: "📁",
  transition: "🎬",
  color_grading: "🎭",
  motion_graphics: "🎪",
  other: "📦",
};

// Floating orb component
const FloatingOrb = ({ className, delay = 0 }: { className?: string; delay?: number }) => (
  <motion.div
    className={`absolute rounded-full blur-3xl opacity-30 pointer-events-none ${className}`}
    animate={{
      y: [0, -30, 0],
      x: [0, 15, 0],
      scale: [1, 1.1, 1],
    }}
    transition={{
      duration: 8,
      repeat: Infinity,
      delay,
      ease: "easeInOut",
    }}
  />
);

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priceFilter, setPriceFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [gridSize, setGridSize] = useState<'normal' | 'large'>('normal');

  useEffect(() => {
    async function fetchProducts() {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, description, status, product_type, featured, cover_image_url, preview_video_url, youtube_url, pricing_type, price_cents, currency, tags')
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

    // Sort products
    switch (sortBy) {
      case 'newest':
        // Already sorted by created_at desc from DB
        break;
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

  const activeFiltersCount = [
    typeFilter !== 'all',
    priceFilter !== 'all',
    searchQuery.length > 0,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setPriceFilter('all');
  };

  const productTypeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach(p => {
      if (p.product_type) {
        counts[p.product_type] = (counts[p.product_type] || 0) + 1;
      }
    });
    return counts;
  }, [products]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-950/20 via-background to-background" />
        <FloatingOrb className="w-[600px] h-[600px] bg-purple-600/20 -top-40 -left-40" delay={0} />
        <FloatingOrb className="w-[500px] h-[500px] bg-pink-600/15 top-1/3 -right-32" delay={2} />
        <FloatingOrb className="w-[400px] h-[400px] bg-blue-600/10 bottom-20 left-1/4" delay={4} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(var(--background))_70%)]" />
      </div>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-4">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          {/* Floating Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge 
              variant="outline" 
              className="mb-6 px-4 py-2 border-purple-500/30 bg-purple-500/10 text-purple-300 backdrop-blur-sm"
            >
              <Sparkles className="w-3.5 h-3.5 mr-2" />
              {products.length}+ Premium Digital Assets
            </Badge>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight mb-6"
          >
            <span className="bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
              Creator Store
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
          >
            Discover handcrafted presets, LUTs, sound effects, and templates from the world's top creators
          </motion.p>

          {/* Premium Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="max-w-2xl mx-auto"
          >
            <div className="relative group">
              {/* Glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/50 via-pink-600/50 to-purple-600/50 rounded-2xl blur-lg opacity-0 group-hover:opacity-75 transition-opacity duration-500" />
              
              <div className="relative flex items-center bg-card/80 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden">
                <Search className="absolute left-4 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search presets, LUTs, templates, and more..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 py-6 text-lg border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchQuery('')}
                    className="mr-2 hover:bg-white/10"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Category Pills */}
      <section className="relative px-4 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="max-w-7xl mx-auto"
        >
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                typeFilter === 'all'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25'
                  : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground border border-white/10'
              }`}
            >
              All Products
            </button>
            {Object.entries(productTypeLabels).map(([value, label]) => {
              const count = productTypeCounts[value] || 0;
              if (count === 0) return null;
              return (
                <button
                  key={value}
                  onClick={() => setTypeFilter(value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                    typeFilter === value
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25'
                      : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground border border-white/10'
                  }`}
                >
                  <span>{productTypeIcons[value]}</span>
                  {label}
                  <span className="text-xs opacity-60">({count})</span>
                </button>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* Filters Bar */}
      <section className="relative px-4 pb-8 sticky top-0 z-40">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="max-w-7xl mx-auto"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-card/60 backdrop-blur-xl border border-white/10 rounded-xl">
            <div className="flex items-center gap-3">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
              </span>
              
              {activeFiltersCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear filters
                  <Badge variant="secondary" className="ml-1.5 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                    {activeFiltersCount}
                  </Badge>
                </Button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Price Filter */}
              <Select value={priceFilter} onValueChange={setPriceFilter}>
                <SelectTrigger className="w-[130px] h-9 bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
                  <SelectValue placeholder="Price" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Prices</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 bg-white/5 border-white/10 hover:bg-white/10">
                    Sort by
                    <ChevronDown className="ml-2 h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setSortBy('newest')}>
                    Newest First
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('featured')}>
                    Featured
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('price-low')}>
                    Price: Low to High
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('price-high')}>
                    Price: High to Low
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Grid Size Toggle */}
              <div className="hidden md:flex items-center gap-1 p-1 bg-white/5 rounded-lg border border-white/10">
                <button
                  onClick={() => setGridSize('normal')}
                  className={`p-1.5 rounded transition-colors ${
                    gridSize === 'normal' ? 'bg-white/10 text-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setGridSize('large')}
                  className={`p-1.5 rounded transition-colors ${
                    gridSize === 'large' ? 'bg-white/10 text-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Products Grid */}
      <section className="relative px-4 pb-20">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-[4/3] bg-card/50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No products found</h3>
              <p className="text-muted-foreground mb-6">Try adjusting your filters or search query</p>
              <Button 
                variant="outline" 
                onClick={clearFilters}
                className="border-white/10 hover:bg-white/5"
              >
                <X className="h-4 w-4 mr-2" />
                Clear all filters
              </Button>
            </motion.div>
          ) : (
            <motion.div
              layout
              className={`grid gap-6 ${
                gridSize === 'large'
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                  : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              }`}
            >
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ 
                      duration: 0.4, 
                      delay: Math.min(index * 0.05, 0.3),
                      layout: { duration: 0.3 }
                    }}
                  >
                    <ProductCard 
                      product={product} 
                      showFeaturedBadge={true} 
                      showType={true}
                      size={gridSize === 'large' ? 'large' : 'default'}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
}
