import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/ProductCard';

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
}

interface HorizontalProductRowProps {
  title: string;
  products: Product[];
  limit?: number;
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-semibold text-foreground">{title}</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-full border-border/50 hover:bg-accent"
            onClick={() => scroll('left')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-full border-border/50 hover:bg-accent"
            onClick={() => scroll('right')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto scrollbar-hide pb-4 -mx-6 px-6"
      >
        {displayProducts.map((product) => (
          <div key={product.id} className="flex-shrink-0 w-[280px]">
            <ProductCard product={product} showFeaturedBadge={true} showType={true} />
          </div>
        ))}
      </div>
    </div>
  );
}
