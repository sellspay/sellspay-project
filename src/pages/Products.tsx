import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Search, X, Sparkles, Filter, Grid3X3, LayoutGrid, ChevronDown, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
  created_at: string | null;
  creator_id: string | null;
}

// Product types matching CreateProduct.tsx
const productTypes = [
  { value: "preset", label: "Preset Pack", icon: "🎨" },
  { value: "lut", label: "LUT Pack", icon: "🌈" },
  { value: "sfx", label: "Sound Effects", icon: "🔊" },
  { value: "music", label: "Music", icon: "🎵" },
  { value: "template", label: "Template", icon: "📐" },
  { value: "overlay", label: "Overlay", icon: "✨" },
  { value: "font", label: "Font", icon: "🔤" },
  { value: "tutorial", label: "Tutorial", icon: "📚" },
  { value: "project_file", label: "Project File", icon: "📁" },
  { value: "transition", label: "Transition Pack", icon: "🎬" },
  { value: "color_grading", label: "Color Grading", icon: "🎭" },
  { value: "motion_graphics", label: "Motion Graphics", icon: "🎪" },
  { value: "other", label: "Other", icon: "📦" },
];

const productTypeLabels: Record<string, string> = Object.fromEntries(
  productTypes.map(t => [t.value, t.label])
);

const productTypeIcons: Record<string, string> = Object.fromEntries(
  productTypes.map(t => [t.value, t.icon])
);

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
        .select('id, name, description, status, product_type, featured, cover_image_url, preview_video_url, youtube_url, pricing_type, price_cents, currency, tags, created_at, creator_id')
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
      <section className="relative pt-12 sm:pt-20 pb-10 sm:pb-16 px-4">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          {/* Floating Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge 
              variant="outline" 
              className="mb-4 sm:mb-6 px-3 sm:px-4 py-1.5 sm:py-2 border-purple-500/30 bg-purple-500/10 text-purple-300 backdrop-blur-sm text-xs sm:text-sm"
            >
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1.5 sm:mr-2" />
              {products.length}+ Premium Digital Assets
            </Badge>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-4 sm:mb-6"
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
            className="text-sm sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-6 sm:mb-10 px-2"
          >
            Discover handcrafted presets, LUTs, sound effects, and templates from the world's top creators
          </motion.p>

          {/* Premium Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="max-w-2xl mx-auto px-2"
          >
            <div className="relative group">
              {/* Glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/50 via-pink-600/50 to-purple-600/50 rounded-xl sm:rounded-2xl blur-lg opacity-0 group-hover:opacity-75 transition-opacity duration-500" />
              
              <div className="relative flex items-center bg-card/80 backdrop-blur-xl border border-white/10 rounded-lg sm:rounded-xl overflow-hidden">
                <Search className="absolute left-3 sm:left-4 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                <Input
                  placeholder="Search presets, LUTs, templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 sm:pl-12 pr-4 py-4 sm:py-6 text-sm sm:text-lg border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchQuery('')}
                    className="mr-2 hover:bg-white/10 h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Filters Bar - Consolidated */}
      <section className="relative px-3 sm:px-4 pb-6 sm:pb-8 sticky top-14 sm:top-16 z-40">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="max-w-7xl mx-auto"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4 p-3 sm:p-4 bg-card/60 backdrop-blur-xl border border-white/10 rounded-lg sm:rounded-xl">
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Filter Dropdown Button */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="h-8 sm:h-10 bg-white/5 border-white/10 hover:bg-white/10 hover:border-purple-500/30 transition-all gap-1.5 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3"
                  >
                    <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden xs:inline">Filter</span>
                    {activeFiltersCount > 0 && (
                      <Badge className="ml-0.5 sm:ml-1 h-4 w-4 sm:h-5 sm:w-5 p-0 flex items-center justify-center text-[9px] sm:text-[10px] bg-purple-500 hover:bg-purple-500">
                        {activeFiltersCount}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-80 p-0 bg-card/95 backdrop-blur-xl border-white/10" 
                  align="start"
                  sideOffset={8}
                >
                  <div className="p-4 border-b border-white/10">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm">Filters</h4>
                      {activeFiltersCount > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearFilters}
                          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                        >
                          Clear all
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* Category Filter */}
                  <div className="p-4 border-b border-white/10">
                    <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Category</p>
                    <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto pr-2">
                      <button
                        onClick={() => setTypeFilter('all')}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          typeFilter === 'all'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground border border-transparent'
                        }`}
                      >
                        {typeFilter === 'all' && <Check className="h-3 w-3" />}
                        All
                      </button>
                      {productTypes.map(({ value, label, icon }) => (
                        <button
                          key={value}
                          onClick={() => setTypeFilter(value)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                            typeFilter === value
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground border border-transparent'
                          }`}
                        >
                          {typeFilter === value && <Check className="h-3 w-3" />}
                          <span>{icon}</span>
                          <span className="truncate">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Price Filter */}
                  <div className="p-4">
                    <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Price</p>
                    <div className="flex gap-2">
                      {[
                        { value: 'all', label: 'All Prices' },
                        { value: 'free', label: 'Free' },
                        { value: 'paid', label: 'Paid' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setPriceFilter(option.value)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all flex-1 justify-center ${
                            priceFilter === option.value
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground border border-transparent'
                          }`}
                        >
                          {priceFilter === option.value && <Check className="h-3 w-3" />}
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              
              <span className="text-xs sm:text-sm text-muted-foreground hidden xs:inline">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
              </span>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Sort Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 sm:h-9 bg-white/5 border-white/10 hover:bg-white/10 text-xs sm:text-sm px-2 sm:px-3">
                    <span className="hidden xs:inline">Sort by</span>
                    <span className="xs:hidden">Sort</span>
                    <ChevronDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-card/95 backdrop-blur-xl border-white/10">
                  <DropdownMenuItem onClick={() => setSortBy('newest')}>
                    {sortBy === 'newest' && <Check className="h-3.5 w-3.5 mr-2" />}
                    Newest First
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('featured')}>
                    {sortBy === 'featured' && <Check className="h-3.5 w-3.5 mr-2" />}
                    Featured
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('price-low')}>
                    {sortBy === 'price-low' && <Check className="h-3.5 w-3.5 mr-2" />}
                    Price: Low to High
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('price-high')}>
                    {sortBy === 'price-high' && <Check className="h-3.5 w-3.5 mr-2" />}
                    Price: High to Low
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Grid Size Toggle - Hidden on mobile */}
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
      <section className="relative px-3 sm:px-4 pb-12 sm:pb-20">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-[4/3] bg-card/50 rounded-lg sm:rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12 sm:py-20"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                <Search className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">No products found</h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">Try adjusting your filters or search query</p>
              <Button 
                variant="outline" 
                size="sm"
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
              className={`grid gap-3 sm:gap-6 ${
                gridSize === 'large'
                  ? 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3'
                  : 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
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
                      showCreator={true}
                      createdAt={product.created_at}
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
