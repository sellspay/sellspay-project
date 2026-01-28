import { useEffect, useMemo, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Play, Star, Flame, Heart, MessageCircle, Bookmark, Sparkles, Crown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  cover_image_url: string | null;
  preview_video_url: string | null;
  youtube_url: string | null;
  pricing_type: string | null;
  price_cents: number | null;
  currency: string | null;
  product_type: string | null;
  featured?: boolean | null;
  creator_id?: string | null;
}

interface Creator {
  username: string | null;
  avatar_url: string | null;
}

interface ProductCardProps {
  product: Product;
  showFeaturedBadge?: boolean;
  showType?: boolean;
  likeCount?: number;
  commentCount?: number;
  showEngagement?: boolean;
  isHot?: boolean;
  size?: 'default' | 'large';
  showCreator?: boolean;
  createdAt?: string | null;
}

function getYouTubeThumbnail(youtubeUrl: string | null): string | null {
  if (!youtubeUrl) return null;
  const raw = youtubeUrl.trim();
  const idLike = /^[a-zA-Z0-9_-]{11}$/;
  if (idLike.test(raw)) return `https://img.youtube.com/vi/${raw}/hqdefault.jpg`;

  const match = raw.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([^?&]+)/);
  return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : null;
}

function getPreviewVideoUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const { data } = supabase.storage.from('product-media').getPublicUrl(path);
  return data?.publicUrl || null;
}

const productTypeLabels: Record<string, string> = {
  preset: "Preset",
  lut: "LUT",
  sfx: "SFX",
  music: "Music",
  template: "Template",
  overlay: "Overlay",
  font: "Font",
  tutorial: "Tutorial",
  project_file: "Project File",
  other: "Other",
};

function formatPrice(cents: number | null, currency: string | null, pricingType?: string | null): string {
  // If subscription-only, show that instead of "Free"
  if (pricingType === 'subscription') return 'Subscription';
  if (!cents || cents === 0) return 'Free';
  const amount = cents / 100;
  const cur = currency?.toUpperCase() || 'USD';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur }).format(amount);
}

export default function ProductCard({ 
  product, 
  showFeaturedBadge = true, 
  showType = true,
  likeCount,
  commentCount,
  showEngagement = false,
  isHot = false,
  size = 'default',
  showCreator = false,
  createdAt
}: ProductCardProps) {
  const { user } = useAuth();
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoError, setVideoError] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [userProfileId, setUserProfileId] = useState<string | null>(null);
  const [creator, setCreator] = useState<Creator | null>(null);

  const thumbnail = useMemo(
    () => product.cover_image_url || getYouTubeThumbnail(product.youtube_url),
    [product.cover_image_url, product.youtube_url],
  );
  const videoUrl = useMemo(
    () => getPreviewVideoUrl(product.preview_video_url),
    [product.preview_video_url],
  );

  const canShowVideo = Boolean(videoUrl) && !videoError;
  const hasThumbnail = Boolean(thumbnail);
  const showVideo = canShowVideo && (isHovered || !hasThumbnail);

  const isLarge = size === 'large';
  const isSubscriptionOnly = product.pricing_type === 'subscription';
  const isFree = !isSubscriptionOnly && (!product.price_cents || product.price_cents === 0);

  // Fetch creator info from public_profiles view (excludes sensitive PII)
  useEffect(() => {
    const fetchCreator = async () => {
      if (!showCreator || !product.creator_id) return;
      
      const { data } = await supabase
        .from('public_profiles')
        .select('username, avatar_url')
        .eq('id', product.creator_id)
        .maybeSingle();
      
      if (data) setCreator(data);
    };
    fetchCreator();
  }, [showCreator, product.creator_id]);

  // Fetch user profile and saved status
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) {
        setUserProfileId(null);
        setIsSaved(false);
        return;
      }
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (profile) {
        setUserProfileId(profile.id);
        
        // Check if product is saved
        const { data: saved } = await supabase
          .from("saved_products")
          .select("id")
          .eq("product_id", product.id)
          .eq("user_id", profile.id)
          .maybeSingle();
        
        setIsSaved(!!saved);
      }
    };
    fetchUserData();
  }, [user, product.id]);

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast.error("Please sign in to save products");
      return;
    }
    
    if (!userProfileId) return;

    setSavingProduct(true);
    try {
      if (isSaved) {
        await supabase
          .from("saved_products")
          .delete()
          .eq("product_id", product.id)
          .eq("user_id", userProfileId);
        
        setIsSaved(false);
        toast.success("Removed from saved");
      } else {
        await supabase
          .from("saved_products")
          .insert({ product_id: product.id, user_id: userProfileId });
        
        setIsSaved(true);
        toast.success("Saved! View it in your profile.");
      }
    } catch (error) {
      console.error("Error toggling save:", error);
      toast.error("Failed to save product");
    } finally {
      setSavingProduct(false);
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (videoRef.current && canShowVideo) {
      videoRef.current.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  useEffect(() => {
    if (!thumbnail && canShowVideo && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [thumbnail, canShowVideo]);

  return (
    <Link
      to={`/product/${product.id}`}
      className="group block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className={`relative overflow-hidden rounded-xl bg-card border border-border/50 group-hover:border-primary/30 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-primary/5 ${isLarge ? 'rounded-2xl' : ''}`}>
        {/* Media Container */}
        <div className={`relative ${isLarge ? 'aspect-[4/3]' : 'aspect-video'} overflow-hidden`}>
          {/* Video Preview */}
          {canShowVideo && (
            <video
              ref={videoRef}
              src={videoUrl}
              muted
              loop
              playsInline
              preload="metadata"
              className={`absolute inset-0 h-full w-full object-cover transition-all duration-500 ${
                showVideo ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
              }`}
              onError={() => setVideoError(true)}
            />
          )}

          {/* Thumbnail Image */}
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={product.name}
              className={`absolute inset-0 h-full w-full object-cover transition-all duration-500 group-hover:scale-105 ${
                showVideo ? 'opacity-0' : 'opacity-100'
              }`}
            />
          ) : !canShowVideo ? (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <Play className="h-8 w-8 text-muted-foreground" />
            </div>
          ) : null}

          {/* Minimal Price Badge */}
          <div className={`absolute top-2.5 left-2.5 flex items-center gap-1 rounded-md backdrop-blur-sm border transition-all duration-300 ${
            isSubscriptionOnly
              ? 'bg-violet-500/20 border-violet-400/30 text-violet-300 px-2 py-0.5'
              : isFree 
                ? 'bg-white/10 border-white/20 text-white/90 px-2 py-0.5' 
                : 'bg-black/50 border-white/10 text-white/90 px-2 py-0.5'
          } text-[10px] font-medium tracking-wide`}>
            {isSubscriptionOnly && (
              <span className="w-1 h-1 rounded-full bg-violet-400 animate-pulse" />
            )}
            {isFree && !isSubscriptionOnly && (
              <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
            )}
            <span className={(isFree || isSubscriptionOnly) ? 'uppercase tracking-wider' : ''}>
              {formatPrice(product.price_cents, product.currency, product.pricing_type)}
            </span>
          </div>

          {/* Minimal "Hot" Badge */}
          {isHot && (
            <div className="absolute top-2.5 left-[4.5rem] flex items-center gap-1 rounded-md bg-amber-500/20 border border-amber-400/30 backdrop-blur-sm px-2 py-0.5 text-[10px] font-medium text-amber-300 tracking-wider uppercase">
              <Flame className="h-2.5 w-2.5" />
              Hot
            </div>
          )}

          {/* Premium Featured Badge */}
          {showFeaturedBadge && product.featured && (
            <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 rounded-lg overflow-hidden">
              {/* Animated gradient background */}
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 animate-shimmer bg-[length:200%_100%]" />
              <div className="relative flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-amber-950 tracking-wider uppercase">
                <Crown className="h-3 w-3" />
                Featured
              </div>
            </div>
          )}

          {/* Save Button - shows on hover */}
          {!product.featured && (
            <button
              onClick={handleSave}
              disabled={savingProduct}
              className={`absolute top-2.5 right-2.5 p-1.5 rounded-md bg-black/40 backdrop-blur-sm border border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-black/60 ${
                isSaved ? 'text-primary' : 'text-white/70 hover:text-white'
              }`}
              title={isSaved ? "Remove from saved" : "Save product"}
            >
              <Bookmark className={`h-3.5 w-3.5 ${isSaved ? 'fill-primary' : ''}`} />
            </button>
          )}

          {/* Product Type Badge */}
          {showType && product.product_type && (
            <div className="absolute bottom-2.5 left-2.5 rounded-md bg-black/50 border border-white/10 backdrop-blur-sm px-2 py-0.5 text-[10px] font-medium text-white/80 tracking-wide">
              {productTypeLabels[product.product_type] || product.product_type}
            </div>
          )}

          {/* Premium hover gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        </div>

        {/* Product Info */}
        <div className={`${isLarge ? 'p-5' : 'p-3'}`}>
          <h3 className={`truncate font-semibold text-foreground group-hover:text-primary transition-colors ${isLarge ? 'text-lg' : 'text-sm'}`}>
            {product.name}
          </h3>
          
          {/* Creator Username & Date */}
          {showCreator && (
            <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
              {creator?.username && (
                <Link
                  to={`/@${creator.username}`}
                  onClick={(e) => e.stopPropagation()}
                  className="hover:text-primary transition-colors"
                >
                  @{creator.username}
                </Link>
              )}
              {creator?.username && createdAt && <span className="opacity-50">•</span>}
              {createdAt && (
                <span className="opacity-70">
                  {new Date(createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              )}
            </div>
          )}
          
          {/* Engagement Stats */}
          {showEngagement && (likeCount !== undefined || commentCount !== undefined) && (
            <div className={`flex items-center gap-4 ${isLarge ? 'mt-3' : 'mt-2'} text-muted-foreground`}>
              {likeCount !== undefined && (
                <span className={`flex items-center gap-1.5 ${isLarge ? 'text-sm' : 'text-xs'}`}>
                  <Heart className={`${isLarge ? 'h-4 w-4' : 'h-3 w-3'}`} />
                  {likeCount}
                </span>
              )}
              {commentCount !== undefined && (
                <span className={`flex items-center gap-1.5 ${isLarge ? 'text-sm' : 'text-xs'}`}>
                  <MessageCircle className={`${isLarge ? 'h-4 w-4' : 'h-3 w-3'}`} />
                  {commentCount}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
