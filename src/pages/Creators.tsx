import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Search, Store } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { TooltipProvider } from '@/components/ui/tooltip';
import { CREATOR_CATEGORIES, PRODUCT_TYPE_TO_CATEGORY } from '@/components/creators/creatorCategories';
import { CreatorCard, type Creator } from '@/components/creators/CreatorCard';

export default function Creators() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    async function fetchCreators() {
      // Fetch creators from public_profiles view
      const { data, error } = await supabase
        .from('public_profiles')
        .select('id, user_id, username, full_name, avatar_url, banner_url, bio, is_creator, verified, creator_tags, is_owner')
        .eq('is_creator', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to load creators:', error);
        setCreators([]);
        setLoading(false);
        return;
      }

      // Fetch counts and derive tags for each creator
      const creatorsWithData = await Promise.all(
        (data || []).map(async (creator) => {
          // Get product count
          const { count: productCount } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('creator_id', creator.id)
            .eq('status', 'published');

          // Get total sales count
          const { count: salesCount } = await supabase
            .from('purchases')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'completed')
            .in('product_id', 
              await supabase
                .from('products')
                .select('id')
                .eq('creator_id', creator.id)
                .then(res => res.data?.map(p => p.id) || [])
            );

          // Use creator_tags or derive from products
          let tags: string[] = (creator as any).creator_tags || [];
          
          if (tags.length === 0) {
            // Derive from product types
            const { data: products } = await supabase
              .from('products')
              .select('product_type')
              .eq('creator_id', creator.id)
              .eq('status', 'published')
              .limit(10);
            
            const derivedTags = [...new Set(
              products?.map(p => PRODUCT_TYPE_TO_CATEGORY[p.product_type || ''] || 'design')
                .filter(Boolean)
            )].slice(0, 3);
            tags = derivedTags;
          }

          // Derive niche from first tag
          const primaryTag = tags[0];
          const niche = primaryTag 
            ? CREATOR_CATEGORIES.find(c => c.id === primaryTag)?.label || 'Creator'
            : 'Creator';

          return {
            id: creator.id,
            user_id: creator.user_id,
            username: creator.username,
            full_name: creator.full_name,
            avatar_url: creator.avatar_url,
            banner_url: creator.banner_url,
            bio: creator.bio,
            verified: creator.verified,
            isOwner: (creator as any).is_owner === true,
            creator_tags: tags,
            niche,
            stats: {
              productCount: productCount || 0,
              salesCount: salesCount ? (salesCount > 1000 ? `${(salesCount / 1000).toFixed(1)}k` : String(salesCount)) : '0',
            },
          };
        })
      );

      setCreators(creatorsWithData);
      setLoading(false);
    }

    fetchCreators();
  }, []);

  // Filter logic
  const filteredCreators = creators.filter(creator => {
    const matchesCategory = activeCategory === "all" || 
      creator.creator_tags.includes(activeCategory);
    
    const q = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      creator.full_name?.toLowerCase().includes(q) ||
      creator.username?.toLowerCase().includes(q) ||
      creator.bio?.toLowerCase().includes(q) ||
      creator.niche?.toLowerCase().includes(q);
    
    return matchesCategory && matchesSearch;
  });

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        {/* --- HERO SECTION --- */}
        <div className="relative overflow-hidden border-b border-border/50">
          {/* Background Gradient Mesh */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-violet-500/5" />
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl" />
          
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
              <Store size={14} />
              Explore Digital Brands
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-4">
              The marketplace for{' '}
              <span className="bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
                creators
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Buy courses, assets, and tools directly from the experts who build them.
            </p>

            {/* Search Bar */}
            <div className="relative max-w-md mx-auto">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Search size={18} />
              </div>
              <Input
                placeholder="Search by name, niche, or handle..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 h-12 bg-card/50 backdrop-blur-sm border-border/50 focus:border-primary/50 rounded-xl shadow-xl"
              />
            </div>
          </div>
        </div>

        {/* --- CATEGORY NAV (STICKY CHIP CLOUD) --- */}
        <div className="sticky top-16 z-30 bg-background/80 backdrop-blur-xl border-b border-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
            <p className="text-xs font-medium text-muted-foreground mb-3 hidden sm:block">Browse by Category</p>
            {/* Responsive: flex-wrap on desktop for chip cloud, horizontal scroll on mobile */}
            <div className="flex flex-wrap gap-2 max-sm:flex-nowrap max-sm:overflow-x-auto max-sm:scrollbar-none max-sm:pb-1">
              {CREATOR_CATEGORIES.map(cat => {
                const Icon = cat.icon;
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border shrink-0
                      ${isActive 
                        ? "bg-primary text-primary-foreground border-primary shadow-lg scale-105 z-10" 
                        : "bg-card/50 text-muted-foreground border-border hover:border-primary/50 hover:text-foreground hover:bg-card"
                      }
                    `}
                  >
                    <Icon size={14} />
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* --- STORE GRID --- */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {/* Results Header */}
          <div className="flex items-center gap-2 mb-8">
            <span className="text-sm text-muted-foreground">
              Found <span className="font-semibold text-foreground">{filteredCreators.length}</span> Brands
            </span>
            {activeCategory !== 'all' && (
              <span className="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
                {CREATOR_CATEGORIES.find(c => c.id === activeCategory)?.label}
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent mb-4" />
              <p className="text-sm text-muted-foreground">Loading stores...</p>
            </div>
          ) : filteredCreators.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-6">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No stores found</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Try searching for a different niche or category.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCreators.map(creator => (
                <CreatorCard key={creator.id} creator={creator} />
              ))}
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
