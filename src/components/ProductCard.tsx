import { useEffect, useMemo, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Play, Star, Flame, Heart, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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
}

interface ProductCardProps {
  product: Product;
  showFeaturedBadge?: boolean;
  showType?: boolean;
  likeCount?: number;
  commentCount?: number;
  showEngagement?: boolean;
  isHot?: boolean;
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

function formatPrice(cents: number | null, currency: string | null): string {
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
  isHot = false
}: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoError, setVideoError] = useState(false);

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
      <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
        {/* Video Preview */}
        {canShowVideo && (
          <video
            ref={videoRef}
            src={videoUrl}
            muted
            loop
            playsInline
            preload="metadata"
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
              showVideo ? 'opacity-100' : 'opacity-0'
            }`}
            onError={() => setVideoError(true)}
          />
        )}

        {/* Thumbnail Image */}
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={product.name}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
              showVideo ? 'opacity-0' : 'opacity-100'
            }`}
          />
        ) : !canShowVideo ? (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <Play className="h-8 w-8 text-muted-foreground" />
          </div>
        ) : null}

        {/* Price Badge */}
        <div className="absolute top-2 left-2 rounded bg-background/90 px-2 py-0.5 text-xs font-medium text-foreground backdrop-blur-sm">
          {formatPrice(product.price_cents, product.currency)}
        </div>

        {/* Hot Badge */}
        {isHot && (
          <div className="absolute top-2 left-16 flex items-center gap-1 rounded bg-orange-500/90 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
            <Flame className="h-3 w-3" />
            Hot
          </div>
        )}

        {/* Featured Badge */}
        {showFeaturedBadge && product.featured && (
          <div className="absolute top-2 right-2 flex items-center gap-1 rounded bg-primary/90 px-2 py-0.5 text-xs font-medium text-primary-foreground backdrop-blur-sm">
            <Star className="h-3 w-3" />
            Featured
          </div>
        )}

        {/* Product Type Badge */}
        {showType && product.product_type && (
          <div className="absolute bottom-2 left-2 rounded bg-secondary/90 px-2 py-0.5 text-xs font-medium text-secondary-foreground backdrop-blur-sm">
            {productTypeLabels[product.product_type] || product.product_type}
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      </div>

      {/* Product Info */}
      <div className="mt-2">
        <h3 className="truncate text-sm font-medium text-foreground group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        
        {/* Engagement Stats */}
        {showEngagement && (likeCount !== undefined || commentCount !== undefined) && (
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            {likeCount !== undefined && (
              <span className="flex items-center gap-1">
                <Heart className="h-3 w-3" />
                {likeCount}
              </span>
            )}
            {commentCount !== undefined && (
              <span className="flex items-center gap-1">
                <MessageCircle className="h-3 w-3" />
                {commentCount}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
