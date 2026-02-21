import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import ProductCard from '@/components/ProductCard';
import { Reveal } from '@/components/home/Reveal';
import { ArrowRight, TrendingUp, Clock, Users, Sparkles, MessageSquare, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

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

interface Thread {
  id: string;
  content: string;
  category: string;
  created_at: string;
  author_id: string;
  author_username?: string;
  author_avatar?: string | null;
  reply_count: number;
  like_count: number;
}

const AI_TOOLS = [
  { name: 'Vocal Isolator', description: 'Extract vocals from any track', icon: '🎤', path: '/studio/voice-isolator', color: 'from-purple-500/20 to-purple-600/5' },
  { name: 'Music Splitter', description: 'Separate stems instantly', icon: '🎵', path: '/studio/music-splitter', color: 'from-blue-500/20 to-blue-600/5' },
  { name: 'SFX Generator', description: 'Create custom sound effects', icon: '🔊', path: '/studio/sfx-generator', color: 'from-emerald-500/20 to-emerald-600/5' },
  { name: 'Video Editor', description: 'AI-powered video tools', icon: '🎬', path: '/studio/video-editor', color: 'from-orange-500/20 to-orange-600/5' },
];

export default function HomeFeed() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'SellsPay — Home';
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchAll = async () => {
      // Fetch trending products (most liked recently)
      const { data: trendingLikes } = await supabase
        .from('product_likes')
        .select('product_id')
        .gte('created_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString());

      const likeCounts = new Map<string, number>();
      trendingLikes?.forEach(l => likeCounts.set(l.product_id, (likeCounts.get(l.product_id) || 0) + 1));
      
      const topProductIds = [...likeCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12)
        .map(([id]) => id);

      let trendingData: Product[] = [];
      if (topProductIds.length > 0) {
        const { data } = await supabase
          .from('products')
          .select('id, name, status, product_type, featured, cover_image_url, preview_video_url, pricing_type, subscription_access, price_cents, currency, youtube_url, tags, created_at, creator_id')
          .in('id', topProductIds)
          .eq('status', 'published');
        trendingData = data || [];
      }

      // Fallback: if not enough trending, fill with recent published
      if (trendingData.length < 6) {
        const { data: recentProducts } = await supabase
          .from('products')
          .select('id, name, status, product_type, featured, cover_image_url, preview_video_url, pricing_type, subscription_access, price_cents, currency, youtube_url, tags, created_at, creator_id')
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .limit(12);
        
        const existingIds = new Set(trendingData.map(p => p.id));
        const filler = (recentProducts || []).filter(p => !existingIds.has(p.id));
        trendingData = [...trendingData, ...filler].slice(0, 12);
      }

      setTrendingProducts(trendingData);

      // Fetch recently viewed products for this user
      const { data: viewedRows } = await supabase
        .from('product_views')
        .select('product_id')
        .eq('viewer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (viewedRows && viewedRows.length > 0) {
        const uniqueIds = [...new Set(viewedRows.map(r => r.product_id))].slice(0, 8);
        const { data: viewedProducts } = await supabase
          .from('products')
          .select('id, name, status, product_type, featured, cover_image_url, preview_video_url, pricing_type, subscription_access, price_cents, currency, youtube_url, tags, created_at, creator_id')
          .in('id', uniqueIds)
          .eq('status', 'published');
        setRecentlyViewed(viewedProducts || []);
      }

      // Fetch community threads
      const { data: threadData } = await supabase
        .from('threads')
        .select('id, content, category, created_at, author_id')
        .order('created_at', { ascending: false })
        .limit(5);

      if (threadData) {
        const authorIds = [...new Set(threadData.map(t => t.author_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', authorIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

        // Get reply & like counts
        const threadIds = threadData.map(t => t.id);
        const { data: replies } = await supabase
          .from('thread_replies')
          .select('thread_id')
          .in('thread_id', threadIds);
        const { data: likes } = await supabase
          .from('thread_likes')
          .select('thread_id')
          .in('thread_id', threadIds);

        const replyCounts = new Map<string, number>();
        const likeCounts2 = new Map<string, number>();
        replies?.forEach(r => replyCounts.set(r.thread_id, (replyCounts.get(r.thread_id) || 0) + 1));
        likes?.forEach(l => likeCounts2.set(l.thread_id, (likeCounts2.get(l.thread_id) || 0) + 1));

        setThreads(threadData.map(t => {
          const prof = profileMap.get(t.author_id);
          return {
            ...t,
            author_username: prof?.username || 'Unknown',
            author_avatar: prof?.avatar_url || null,
            reply_count: replyCounts.get(t.id) || 0,
            like_count: likeCounts2.get(t.id) || 0,
          };
        }));
      }

      setLoading(false);
    };

    fetchAll();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-3 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Welcome header */}
      <section className="px-6 sm:px-8 lg:px-12 pt-10 pb-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
          Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}
        </h1>
        <p className="text-muted-foreground mt-1">Here's what's happening today</p>
      </section>

      {/* AI Studio Quick Access */}
      <Reveal>
        <section className="px-6 sm:px-8 lg:px-12 pb-10">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">AI Studio</h2>
            </div>
            <Link to="/studio" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
              All tools <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {AI_TOOLS.map(tool => (
              <button
                key={tool.name}
                onClick={() => navigate(tool.path)}
                className={`p-4 rounded-xl bg-gradient-to-br ${tool.color} border border-border/50 text-left transition-all duration-200 hover:border-primary/30 hover:scale-[1.02] group`}
              >
                <span className="text-2xl mb-2 block">{tool.icon}</span>
                <p className="font-medium text-foreground text-sm">{tool.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{tool.description}</p>
              </button>
            ))}
          </div>
        </section>
      </Reveal>

      {/* Trending Products */}
      <Reveal>
        <section className="pb-12">
          <div className="px-6 sm:px-8 lg:px-12 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-destructive" />
                <h2 className="text-lg font-semibold text-foreground">Trending Now</h2>
              </div>
              <Link to="/products" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
          <div className="px-0">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-[2px]">
              {trendingProducts.slice(0, 12).map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  showType={true}
                  showCreator={true}
                />
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* Recently Viewed */}
      {recentlyViewed.length > 0 && (
        <Reveal>
          <section className="pb-12">
            <div className="px-6 sm:px-8 lg:px-12 mb-6">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold text-foreground">Recently Viewed</h2>
              </div>
            </div>
            <div className="px-0">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-[2px]">
                {recentlyViewed.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    showType={true}
                    showCreator={true}
                  />
                ))}
              </div>
            </div>
          </section>
        </Reveal>
      )}

      {/* Community Threads */}
      {threads.length > 0 && (
        <Reveal>
          <section className="px-6 sm:px-8 lg:px-12 pb-16">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Community</h2>
              </div>
              <Link to="/community" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                Browse all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="space-y-3">
              {threads.map(thread => (
                <Link
                  key={thread.id}
                  to={`/community?thread=${thread.id}`}
                  className="flex items-start gap-4 p-4 rounded-xl border border-border/50 bg-card/30 hover:bg-card/60 hover:border-border transition-all duration-200 group"
                >
                  <Avatar className="h-9 w-9 flex-shrink-0 mt-0.5">
                    <AvatarImage src={thread.author_avatar || undefined} />
                    <AvatarFallback className="text-xs bg-muted">{thread.author_username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-muted-foreground">@{thread.author_username}</span>
                      <span className="text-xs text-muted-foreground/50">·</span>
                      <span className="text-xs text-muted-foreground/50 capitalize">{thread.category}</span>
                    </div>
                    <p className="font-medium text-foreground text-sm group-hover:text-primary transition-colors line-clamp-2">
                      {thread.content}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" /> {thread.reply_count}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        ❤️ {thread.like_count}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </Reveal>
      )}
    </div>
  );
}
