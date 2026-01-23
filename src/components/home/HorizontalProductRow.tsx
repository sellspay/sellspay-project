import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Product {
  id: string;
  name: string;
  status: string;
  product_type: string | null;
  featured: boolean | null;
  cover_image_url: string | null;
  preview_video_url: string | null;
  pricing_type: string | null;
  price_cents: number | null;
  currency: string | null;
  youtube_url: string | null;
  tags: string[] | null;
}

interface HorizontalProductRowProps {
  title: string;
  products: Product[];
  limit?: number;
}

function formatPrice(cents: number | null, currency: string | null): string {
  if (!cents || cents === 0) return 'Free';
  const amount = cents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
  }).format(amount);
}

function getProductThumbnail(product: Product): string | null {
  if (product.cover_image_url) return product.cover_image_url;
  
  // Use YouTube thumbnail if available
  if (product.youtube_url) {
    // Handle both full URLs and video IDs
    let videoId = product.youtube_url;
    if (product.youtube_url.includes('/') || product.youtube_url.includes('?')) {
      const match = product.youtube_url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
      videoId = match ? match[1] : product.youtube_url;
    }
    return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
  }
  
  return null;
}

export default function HorizontalProductRow({ title, products, limit = 12 }: HorizontalProductRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const displayProducts = products.slice(0, limit);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 320;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  if (displayProducts.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-foreground">{title}</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => scroll('left')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => scroll('right')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4"
      >
        {displayProducts.map((product) => (
          <Link
            key={product.id}
            to={`/product/${product.id}`}
            className="flex-shrink-0 w-[280px] group"
          >
            <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
              {(() => {
                const thumbnail = getProductThumbnail(product);
                return thumbnail ? (
                  <img
                    src={thumbnail}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                    <Play className="w-12 h-12 text-muted-foreground" />
                  </div>
                );
              })()}
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              {/* Price badge */}
              <div className="absolute top-2 right-2">
                <Badge variant={product.pricing_type === 'free' ? 'secondary' : 'default'} className="backdrop-blur-sm">
                  {formatPrice(product.price_cents, product.currency)}
                </Badge>
              </div>

              {/* Featured badge */}
              {product.featured && (
                <div className="absolute top-2 left-2">
                  <Badge className="bg-primary/90 backdrop-blur-sm">Featured</Badge>
                </div>
              )}
            </div>

            <div className="mt-3 space-y-1">
              <h4 className="font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                {product.name}
              </h4>
              {product.product_type && (
                <p className="text-sm text-muted-foreground capitalize">
                  {product.product_type.replace('_', ' ')}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
