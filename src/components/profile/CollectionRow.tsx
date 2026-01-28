import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ChevronRight as ArrowIcon, Layers, Lock, Play, Heart, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';

interface Product {
  id: string;
  name: string;
  cover_image_url: string | null;
  youtube_url: string | null;
  preview_video_url: string | null;
  price_cents: number | null;
  currency: string | null;
  pricing_type?: string | null;
  subscription_access?: string | null;
  included_in_subscription?: boolean | null;
  locked?: boolean | null;
  created_at?: string | null;
  likeCount?: number;
  commentCount?: number;
}

interface CollectionRowProps {
  id: string;
  name: string;
  coverImage?: string | null;
  products: Product[];
  totalCount: number;
}

// Helper to generate YouTube thumbnail URL
const getYouTubeThumbnail = (youtubeUrl: string | null): string | null => {
  if (!youtubeUrl) return null;
  let videoId = youtubeUrl;
  if (youtubeUrl.includes('youtube.com/watch')) {
    const url = new URL(youtubeUrl);
    videoId = url.searchParams.get('v') || youtubeUrl;
  } else if (youtubeUrl.includes('youtu.be/')) {
    videoId = youtubeUrl.split('youtu.be/')[1]?.split('?')[0] || youtubeUrl;
  } else if (youtubeUrl.includes('youtube.com/embed/')) {
    videoId = youtubeUrl.split('embed/')[1]?.split('?')[0] || youtubeUrl;
  }
  videoId = videoId.split('?')[0].split('&')[0];
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
};

// Helper to get full preview video URL from Supabase storage
const getPreviewVideoUrl = (path: string | null): string | null => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const { data } = supabase.storage.from('product-media').getPublicUrl(path);
  return data?.publicUrl || null;
};

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// Helper to format price
const formatPrice = (priceCents: number | null, currency: string | null, pricingType?: string | null): string => {
  if (pricingType === 'subscription' || pricingType === 'subscription_only') {
    return 'Subscription';
  }
  if (pricingType === 'free' || priceCents === null || priceCents === 0) {
    return 'Free';
  }
  const amount = priceCents / 100;
  const currencyCode = currency?.toUpperCase() || 'USD';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Product card with video preview on hover
function ProductCardWithPreview({ 
  product, 
  onClick 
}: { 
  product: Product; 
  onClick: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [videoError, setVideoError] = useState(false);
  
  const thumbnail = product.cover_image_url || getYouTubeThumbnail(product.youtube_url);
  const previewVideoUrl = getPreviewVideoUrl(product.preview_video_url);
  const isSubscriptionOnly =
    product.pricing_type === 'subscription' ||
    product.pricing_type === 'subscription_only' ||
    product.subscription_access === 'subscription_only' ||
    Boolean(product.included_in_subscription);
  const isLocked = product.locked || product.pricing_type === 'paid';

  const handleMouseEnter = () => {
    setIsHovering(true);
    if (videoRef.current && previewVideoUrl && !videoError) {
      videoRef.current.loop = true;
      videoRef.current.play().catch(() => setVideoError(true));
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <button
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group text-left w-full"
    >
      <div className="relative aspect-video rounded-lg overflow-hidden bg-muted border border-border">
        {/* Video preview (hidden until hover) */}
        {previewVideoUrl && !videoError && (
          <video
            ref={videoRef}
            src={previewVideoUrl}
            muted
            loop
            playsInline
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
              isHovering ? 'opacity-100' : 'opacity-0'
            }`}
            onError={() => setVideoError(true)}
          />
        )}
        
        {/* Thumbnail */}
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={product.name}
            className={`w-full h-full object-cover transition-all duration-300 ${
              isHovering && previewVideoUrl && !videoError ? 'opacity-0' : 'opacity-100 group-hover:scale-105'
            }`}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.src.includes('maxresdefault')) {
                target.src = target.src.replace('maxresdefault', 'hqdefault');
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
            <Layers className="w-12 h-12 text-muted-foreground" />
          </div>
        )}
        
        {/* Price Badge - Top Right */}
        <div className={`absolute top-2 right-2 px-2.5 py-1 rounded-full text-[11px] font-semibold shadow-sm ${
          (!isSubscriptionOnly && (product.pricing_type === 'free' || product.price_cents === null || product.price_cents === 0))
            ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white'
            : 'bg-background/95 backdrop-blur-md text-foreground border border-border/50'
        }`}>
          {isSubscriptionOnly
            ? 'Subscription'
            : formatPrice(product.price_cents, product.currency, product.pricing_type)}
        </div>
        
        {/* Play indicator - Bottom Left */}
        {previewVideoUrl && !videoError && !isHovering && (
          <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm rounded-full p-1.5">
            <Play className="w-3.5 h-3.5 text-white" fill="currentColor" />
          </div>
        )}
        
        {/* Locked Badge - Bottom Left (only if no preview video) */}
        {isLocked && (!previewVideoUrl || videoError) && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs text-white font-medium">
            <Lock className="w-3 h-3" />
            Locked
          </div>
        )}
        
        {/* Play Button for YouTube videos */}
        {!previewVideoUrl && product.youtube_url && (
          <div className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <Play className="w-5 h-5 text-black fill-black ml-0.5" />
          </div>
        )}
      </div>
      
      {/* Product Info */}
      <div className="mt-2.5">
        <h4 className="font-medium text-foreground text-sm line-clamp-2 group-hover:text-primary transition-colors">
          {product.name}
        </h4>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
          {product.created_at && <span>{formatDate(product.created_at)}</span>}
          <span className="flex items-center gap-1">
            <Heart className="w-3 h-3" />
            {product.likeCount ?? 0}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="w-3 h-3" />
            {product.commentCount ?? 0}
          </span>
        </div>
      </div>
    </button>
  );
}

export default function CollectionRow({ id, name, coverImage, products, totalCount }: CollectionRowProps) {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const productsPerPage = 3;
  const totalPages = Math.ceil(Math.min(products.length, 9) / productsPerPage);

  const currentProducts = products.slice(
    currentPage * productsPerPage,
    Math.min((currentPage + 1) * productsPerPage, 9)
  );

  const handlePrev = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
  };

  return (
    <>
      <div className="mb-10">
        {/* Collection Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity group"
          >
            {coverImage ? (
              <img
                src={coverImage}
                alt={name}
                className="w-12 h-12 rounded-lg object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                <Layers className="w-6 h-6 text-muted-foreground" />
              </div>
            )}
            <div className="text-left">
              <div className="flex items-center gap-1">
                <h3 className="text-lg font-semibold text-foreground">{name}</h3>
                <ArrowIcon className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" />
                {totalCount} {totalCount === 1 ? 'post' : 'posts'}
              </p>
            </div>
          </button>

          {/* Navigation Arrows */}
          {totalPages > 1 && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full w-9 h-9 border-border/50"
                onClick={handlePrev}
                disabled={currentPage === 0}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full w-9 h-9 border-border/50"
                onClick={handleNext}
                disabled={currentPage >= totalPages - 1}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Products Grid - horizontal scroll on mobile, 3 cols on desktop */}
        <div className="flex gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 sm:gap-5 sm:overflow-visible sm:pb-0 scrollbar-thin">
          {currentProducts.map((product) => (
            <div key={product.id} className="w-[75vw] flex-shrink-0 sm:w-auto">
              <ProductCardWithPreview
                product={product}
                onClick={() => navigate(`/product/${product.id}`)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Collection Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {coverImage ? (
                <img src={coverImage} alt={name} className="w-8 h-8 rounded object-cover" />
              ) : (
                <Layers className="w-5 h-5" />
              )}
              {name}
              <span className="text-sm font-normal text-muted-foreground">
                ({totalCount} {totalCount === 1 ? 'post' : 'posts'})
              </span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mt-4">
            {products.map((product) => (
              <ProductCardWithPreview
                key={product.id}
                product={product}
                onClick={() => {
                  setShowModal(false);
                  navigate(`/product/${product.id}`);
                }}
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
