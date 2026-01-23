import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Play, Star } from 'lucide-react';

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
}

function getYouTubeThumbnail(youtubeUrl: string | null): string | null {
  if (!youtubeUrl) return null;
  const match = youtubeUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([^?&]+)/);
  return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : null;
}

function getPreviewVideoUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `https://cdpfchadvvfdupkgzeiy.supabase.co/storage/v1/object/public/product-media/${path}`;
}

function formatPrice(cents: number | null, currency: string | null): string {
  if (!cents || cents === 0) return 'Free';
  const amount = cents / 100;
  const cur = currency?.toUpperCase() || 'USD';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur }).format(amount);
}

export default function ProductCard({ product, showFeaturedBadge = true, showType = true }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const thumbnail = product.cover_image_url || getYouTubeThumbnail(product.youtube_url);
  const videoUrl = getPreviewVideoUrl(product.preview_video_url);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (videoRef.current && videoUrl) {
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

  return (
    <Link
      to={`/product/${product.id}`}
      className="group block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
        {/* Thumbnail Image */}
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={product.name}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
              isHovered && videoUrl ? 'opacity-0' : 'opacity-100'
            }`}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <Play className="h-8 w-8 text-muted-foreground" />
          </div>
        )}

        {/* Video Preview */}
        {videoUrl && (
          <video
            ref={videoRef}
            src={videoUrl}
            muted
            loop
            playsInline
            preload="metadata"
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}

        {/* Price Badge */}
        <div className="absolute top-2 left-2 rounded bg-background/90 px-2 py-0.5 text-xs font-medium text-foreground backdrop-blur-sm">
          {formatPrice(product.price_cents, product.currency)}
        </div>

        {/* Featured Badge */}
        {showFeaturedBadge && product.featured && (
          <div className="absolute top-2 right-2 flex items-center gap-1 rounded bg-primary/90 px-2 py-0.5 text-xs font-medium text-primary-foreground backdrop-blur-sm">
            <Star className="h-3 w-3" />
            Featured
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
        {showType && product.product_type && (
          <p className="text-xs text-muted-foreground capitalize">
            {product.product_type.replace('_', ' ')}
          </p>
        )}
      </div>
    </Link>
  );
}
