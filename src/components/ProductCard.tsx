import { useEffect, useMemo, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Play, Flame, Heart, MessageCircle, Bookmark, Crown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { playClickSound } from '@/hooks/useClickSound';

interface Product {
  id: string;
  name: string;
  cover_image_url: string | null;
  preview_video_url: string | null;
  youtube_url: string | null;
  pricing_type: string | null;
  subscription_access?: string | null;
  included_in_subscription?: boolean | null;
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

function formatPrice(cents: number | null, currency: string | null, pricingType?: string | null, isSubIncluded?: boolean): string {
  if (isSubIncluded) return 'Subscription';
  if (pricingType === 'subscription' || pricingType === 'subscription_only') return 'Subscription';
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
  const isSubscriptionOnly =
    product.pricing_type === 'subscription' ||
    product.pricing_type === 'subscription_only' ||
    product.subscription_access === 'subscription_only' ||
    Boolean(product.included_in_subscription);
  const isFree = !isSubscriptionOnly && (!product.price_cents || product.price_cents === 0);

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
      className="group block h-full"
      onClick={playClickSound}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* STRAIGHT EDGES - No rounded corners, tight borders */}
      <div className="relative overflow-hidden bg-card border-0 h-full">
        {/* Media Container - Edge to edge, no gaps */}
        <div className={`relative ${isLarge ? 'aspect-[4/5]' : 'aspect-[4/5]'} overflow-hidden`}>
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

          {/* Price Badge - Top Left */}
          <div className={`absolute top-3 left-3 flex items-center gap-1.5 backdrop-blur-md border transition-all duration-300 ${
            isSubscriptionOnly
              ? 'bg-violet-500/30 border-violet-400/40 text-violet-200 px-2.5 py-1'
              : isFree 
                ? 'bg-emerald-500/30 border-emerald-400/40 text-emerald-200 px-2.5 py-1' 
                : 'bg-black/60 border-white/20 text-white px-2.5 py-1'
          } text-xs font-semibold tracking-wide`}>
            {isFree && !isSubscriptionOnly && (
              <span className="w-1.5 h-1.5 bg-emerald-400" />
            )}
            <span className="uppercase tracking-wider">
              {formatPrice(product.price_cents, product.currency, product.pricing_type, Boolean(product.included_in_subscription))}
            </span>
          </div>

          {/* Hot Badge */}
          {isHot && (
            <div className="absolute top-3 left-[5.5rem] flex items-center gap-1.5 bg-amber-500/30 border border-amber-400/40 backdrop-blur-md px-2.5 py-1 text-xs font-semibold text-amber-200 tracking-wider uppercase">
              <Flame className="h-3 w-3" />
              Hot
            </div>
          )}

          {/* Featured Badge - Premium Gold */}
          {showFeaturedBadge && product.featured && (
            <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-yellow-400 px-2.5 py-1 text-xs font-bold text-amber-950 tracking-wider uppercase">
              <Crown className="h-3 w-3" />
              Featured
            </div>
          )}

          {/* Save Button */}
          {!product.featured && (
            <button
              onClick={handleSave}
              disabled={savingProduct}
              className={`absolute top-3 right-3 p-2 bg-black/50 backdrop-blur-md border border-white/20 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-black/70 ${
                isSaved ? 'text-primary' : 'text-white/80 hover:text-white'
              }`}
              title={isSaved ? "Remove from saved" : "Save product"}
            >
              <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-primary' : ''}`} />
            </button>
          )}

          {/* Product Type Badge */}
          {showType && product.product_type && (
            <div className="absolute bottom-3 left-3 bg-black/60 border border-white/20 backdrop-blur-md px-2.5 py-1 text-xs font-medium text-white/90 tracking-wide">
              {productTypeLabels[product.product_type] || product.product_type}
            </div>
          )}

          {/* Bottom gradient overlay */}
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />
        </div>

        {/* Product Info - Minimal, Clean */}
        <div className={`absolute inset-x-0 bottom-0 ${isLarge ? 'p-5' : 'p-4'}`}>
          <h3 className={`truncate font-bold text-white group-hover:text-primary transition-colors ${isLarge ? 'text-lg' : 'text-sm'}`}>
            {product.name}
          </h3>
          
          {/* Creator Username */}
          {showCreator && creator?.username && (
            <div className={`mt-1 ${isLarge ? 'text-sm' : 'text-xs'} text-white/70`}>
              <Link
                to={`/@${creator.username}`}
                onClick={(e) => e.stopPropagation()}
                className="hover:text-primary transition-colors"
              >
                @{creator.username}
              </Link>
            </div>
          )}
          
          {/* Engagement Stats */}
          {showEngagement && (likeCount !== undefined || commentCount !== undefined) && (
            <div className={`flex items-center gap-4 ${isLarge ? 'mt-3' : 'mt-2'} text-white/60`}>
              {likeCount !== undefined && (
                <span className={`flex items-center gap-1 ${isLarge ? 'text-sm' : 'text-xs'}`}>
                  <Heart className="h-3.5 w-3.5" />
                  {likeCount}
                </span>
              )}
              {commentCount !== undefined && (
                <span className={`flex items-center gap-1 ${isLarge ? 'text-sm' : 'text-xs'}`}>
                  <MessageCircle className="h-3.5 w-3.5" />
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
