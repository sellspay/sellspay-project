import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ChevronRight as ArrowIcon, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Product {
  id: string;
  name: string;
  cover_image_url: string | null;
  youtube_url: string | null;
  preview_video_url: string | null;
  price_cents: number | null;
  currency: string | null;
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

const formatPrice = (cents: number | null, currency: string | null) => {
  if (!cents) return 'Free';
  const amount = cents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
  }).format(amount);
};

export default function CollectionRow({ id, name, coverImage, products, totalCount }: CollectionRowProps) {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showModal, setShowModal] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(products.length > 3);

  const updateScrollButtons = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const cardWidth = 320;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -cardWidth : cardWidth,
        behavior: 'smooth',
      });
      setTimeout(updateScrollButtons, 300);
    }
  };

  return (
    <>
      <div className="mb-8">
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
                className="w-10 h-10 rounded-lg object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <Layers className="w-5 h-5 text-muted-foreground" />
              </div>
            )}
            <div className="text-left">
              <div className="flex items-center gap-1">
                <h3 className="font-semibold text-foreground">{name}</h3>
                <ArrowIcon className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-xs text-muted-foreground">
                <Layers className="w-3 h-3 inline mr-1" />
                {totalCount} {totalCount === 1 ? 'post' : 'posts'}
              </p>
            </div>
          </button>

          {/* Navigation Arrows */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full w-8 h-8"
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full w-8 h-8"
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Products Row */}
        <div
          ref={scrollRef}
          onScroll={updateScrollButtons}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {products.slice(0, 9).map((product) => {
            const thumbnail = product.cover_image_url || getYouTubeThumbnail(product.youtube_url);
            return (
              <button
                key={product.id}
                onClick={() => navigate(`/product/${product.id}`)}
                className="flex-shrink-0 w-[300px] group text-left"
                style={{ scrollSnapAlign: 'start' }}
              >
                <div className="relative aspect-video rounded-lg overflow-hidden bg-muted border border-border">
                  {thumbnail ? (
                    <img
                      src={thumbnail}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (target.src.includes('maxresdefault')) {
                          target.src = target.src.replace('maxresdefault', 'hqdefault');
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <Layers className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="mt-2">
                  <h4 className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                    {product.name}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {formatPrice(product.price_cents, product.currency)}
                  </p>
                </div>
              </button>
            );
          })}

          {/* View More Card */}
          {totalCount > 9 && (
            <button
              onClick={() => setShowModal(true)}
              className="flex-shrink-0 w-[300px] aspect-video rounded-lg bg-muted/50 border border-border flex flex-col items-center justify-center hover:bg-muted transition-colors"
            >
              <span className="text-sm font-medium text-foreground">View More</span>
              <span className="text-xs text-muted-foreground">+{totalCount - 9} more</span>
            </button>
          )}
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
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
            {products.map((product) => {
              const thumbnail = product.cover_image_url || getYouTubeThumbnail(product.youtube_url);
              return (
                <button
                  key={product.id}
                  onClick={() => {
                    setShowModal(false);
                    navigate(`/product/${product.id}`);
                  }}
                  className="group text-left"
                >
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-muted border border-border">
                    {thumbnail ? (
                      <img
                        src={thumbnail}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (target.src.includes('maxresdefault')) {
                            target.src = target.src.replace('maxresdefault', 'hqdefault');
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <Layers className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="mt-2">
                    <h4 className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                      {product.name}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {formatPrice(product.price_cents, product.currency)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
