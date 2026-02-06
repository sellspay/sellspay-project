import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { 
  Search, Package, Star, Flame,
  Zap, Code2, TrendingUp, Briefcase, PenTool, 
  Video, BookOpen, Layers, Music, Gamepad2, Smile, Box
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { VerifiedBadge } from '@/components/ui/verified-badge';
import { TooltipProvider } from '@/components/ui/tooltip';

// --- CATEGORY CONFIGURATION ---
const CREATOR_CATEGORIES = [
  { id: "all", label: "All Creators", icon: Zap },
  { id: "software", label: "Software & SaaS", icon: Code2 },
  { id: "finance", label: "Trading & Finance", icon: TrendingUp },
  { id: "business", label: "E-commerce & Biz", icon: Briefcase },
  { id: "design", label: "Design & Art", icon: PenTool },
  { id: "3d", label: "3D & VFX", icon: Box },
  { id: "video", label: "Video & LUTs", icon: Video },
  { id: "education", label: "Courses & Tutorials", icon: BookOpen },
  { id: "productivity", label: "Notion & Templates", icon: Layers },
  { id: "audio", label: "Audio & Music", icon: Music },
  { id: "gaming", label: "Gaming & Mods", icon: Gamepad2 },
  { id: "lifestyle", label: "Fitness & Lifestyle", icon: Smile },
];

// Map product types to categories for fallback
const PRODUCT_TYPE_TO_CATEGORY: Record<string, string> = {
  'preset': 'video',
  'lut': 'video',
  'sfx': 'audio',
  'music': 'audio',
  'template': 'productivity',
  'overlay': 'video',
  'tutorial': 'education',
  'project_file': 'video',
  'digital_art': 'design',
  '3d_model': '3d',
  'plugin': 'software',
  'script': 'software',
};

interface Creator {
  id: string;
  user_id: string | null;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  bio: string | null;
  verified: boolean | null;
  isOwner: boolean;
  creator_tags: string[];
  niche: string;
  stats: {
    productCount: number;
    salesCount: string;
  };
}

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
          {/* Background Effects */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-violet-500/5" />
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl" />
          
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-4">
              Find your favorite{' '}
              <span className="bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
                Creator
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              From Day Traders to 3D Artists—discover the pros powering the digital economy.
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

        {/* --- CATEGORY NAV (STICKY) --- */}
        <div className="sticky top-16 z-30 bg-background/80 backdrop-blur-xl border-b border-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
        {CREATOR_CATEGORIES.map(cat => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all border shrink-0
                ${isActive 
                  ? "bg-primary text-primary-foreground border-primary shadow-lg scale-105" 
                  : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
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

        {/* --- CREATOR GRID --- */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {/* Results Header */}
          <div className="flex items-center gap-2 mb-8">
            <span className="text-sm text-muted-foreground">
              Showing {filteredCreators.length} results for
            </span>
            <span className="text-sm font-semibold text-foreground">
              {CREATOR_CATEGORIES.find(c => c.id === activeCategory)?.label}
            </span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent mb-4" />
              <p className="text-sm text-muted-foreground">Loading creators...</p>
            </div>
          ) : filteredCreators.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-6">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No creators found</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Try adjusting your search or category filter.
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

// --- CREATOR CARD COMPONENT ---
function CreatorCard({ creator }: { creator: Creator }) {
  return (
    <Link
      to={`/@${creator.username || creator.id}`}
      className="group relative overflow-hidden rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-500 hover:shadow-xl hover:shadow-primary/5"
    >
      {/* Cover Banner */}
      <div className="relative h-24 overflow-hidden">
        {creator.banner_url ? (
          <img 
            src={creator.banner_url} 
            alt="" 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-violet-500/20 to-fuchsia-500/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
      </div>

      {/* Profile Content */}
      <div className="relative px-5 pb-5 -mt-10">
        {/* Avatar Row */}
        <div className="flex items-end justify-between mb-3">
          <div className="relative">
            <Avatar className="w-16 h-16 ring-4 ring-card shadow-lg">
              <AvatarImage src={creator.avatar_url || undefined} className="object-cover" />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-violet-500/20 text-primary text-xl font-medium">
                {(creator.username || 'C').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {creator.verified && (
              <div className="absolute -bottom-1 -right-1">
                <VerifiedBadge isOwner={creator.isOwner} size="sm" />
              </div>
            )}
          </div>
          
          <button className="px-3 py-1.5 text-xs font-semibold bg-primary/10 text-primary rounded-full hover:bg-primary hover:text-primary-foreground transition-colors">
            View Shop
          </button>
        </div>
        
        {/* Name & Badges */}
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="font-semibold text-foreground truncate">
            {creator.full_name || creator.username || 'Creator'}
          </h3>
        {creator.isOwner && (
            <span className="px-2 py-0.5 text-[10px] font-bold bg-gradient-to-r from-primary to-violet-500 text-primary-foreground rounded-full">
              Admin
            </span>
          )}
        </div>
        
        {/* Niche */}
        <p className="text-xs text-muted-foreground mb-0.5">{creator.niche}</p>
        
        {/* Handle */}
        <p className="text-xs bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent font-medium mb-2">
          @{creator.username || 'creator'}
        </p>
        
        {/* Bio */}
        {creator.bio && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3 min-h-[2rem]">
            {creator.bio}
          </p>
        )}
        {!creator.bio && <div className="mb-3 min-h-[2rem]" />}

        {/* Tags */}
        {creator.creator_tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {creator.creator_tags.slice(0, 3).map(tag => {
              const cat = CREATOR_CATEGORIES.find(c => c.id === tag);
              const Icon = cat?.icon;
              return (
                <span
                  key={tag}
                  className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium bg-muted/50 text-muted-foreground rounded-full"
                >
                  {Icon && <Icon size={10} />}
                  {tag}
                </span>
              );
            })}
          </div>
        )}

        {/* Stats Footer */}
        <div className="flex items-center gap-4 pt-3 border-t border-border/50">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Package size={12} />
            <span className="font-medium">{creator.stats.productCount}</span>
            <span className="hidden sm:inline">Products</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Flame size={12} />
            <span className="font-medium">{creator.stats.salesCount}</span>
            <span className="hidden sm:inline">Sales</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
