import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ChevronRight as ArrowIcon, Layers, Lock, Play, Heart, MessageCircle, Youtube } from 'lucide-react';
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
  pricing_type?: string | null;
  locked?: boolean | null;
  created_at?: string | null;
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

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

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

        {/* Products Grid - 3 per row, centered */}
        <div className="grid grid-cols-3 gap-5">
          {currentProducts.map((product) => {
            const thumbnail = product.cover_image_url || getYouTubeThumbnail(product.youtube_url);
            const isLocked = product.locked || product.pricing_type === 'paid';
            const hasVideo = product.preview_video_url || product.youtube_url;
            const hasYoutube = !!product.youtube_url;
            
            return (
              <button
                key={product.id}
                onClick={() => navigate(`/product/${product.id}`)}
                className="group text-left w-full"
              >
                {/* Thumbnail */}
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
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                      <Layers className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                  
                  {/* Locked Badge */}
                  {isLocked && (
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded text-xs text-white font-medium">
                      <Lock className="w-3 h-3" />
                      Locked
                    </div>
                  )}
                  
                  {/* YouTube Badge */}
                  {hasYoutube && !isLocked && (
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded text-xs text-white font-medium">
                      <Youtube className="w-3 h-3 text-red-500" />
                      YouTube
                    </div>
                  )}
                  
                  {/* Play Button */}
                  {hasVideo && (
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
                    <span>{formatDate(product.created_at)}</span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      0
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" />
                      0
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
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
          
          <div className="grid grid-cols-3 gap-4 mt-4">
            {products.map((product) => {
              const thumbnail = product.cover_image_url || getYouTubeThumbnail(product.youtube_url);
              const isLocked = product.locked || product.pricing_type === 'paid';
              const hasVideo = product.preview_video_url || product.youtube_url;
              
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
                    
                    {isLocked && (
                      <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm px-2 py-1 rounded text-xs text-white">
                        <Lock className="w-3 h-3" />
                        Locked
                      </div>
                    )}
                    
                    {hasVideo && (
                      <div className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center">
                        <Play className="w-4 h-4 text-black fill-black ml-0.5" />
                      </div>
                    )}
                  </div>
                  <div className="mt-2">
                    <h4 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                      {product.name}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(product.created_at)}
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
