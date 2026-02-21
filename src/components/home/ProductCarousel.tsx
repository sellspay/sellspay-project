import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
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
  created_at: string | null;
  creator_id: string | null;
}

interface ProductCarouselProps {
  title: string;
  products: Product[];
  viewAllLink?: string;
}

export function ProductCarousel({ title, products, viewAllLink }: ProductCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    el?.addEventListener('scroll', checkScroll, { passive: true });
    return () => el?.removeEventListener('scroll', checkScroll);
  }, [products]);

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.75;
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  if (products.length === 0) return null;

  return (
    <section className="relative">
      {/* Header */}
      <div className="flex items-center justify-between px-6 sm:px-8 lg:px-10 mb-3">
        <h2 className="text-lg font-bold text-foreground tracking-tight">{title}</h2>
        {viewAllLink && (
          <Link to={viewAllLink} className="text-xs text-primary hover:underline">
            See more
          </Link>
        )}
      </div>

      {/* Carousel */}
      <div className="relative group/carousel">
        {/* Left arrow */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-1 top-1/2 -translate-y-1/2 z-10 h-20 w-10 bg-card/90 border border-border/50 rounded-md flex items-center justify-center text-foreground hover:bg-card transition-colors shadow-lg opacity-0 group-hover/carousel:opacity-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        {/* Right arrow */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-1 top-1/2 -translate-y-1/2 z-10 h-20 w-10 bg-card/90 border border-border/50 rounded-md flex items-center justify-center text-foreground hover:bg-card transition-colors shadow-lg opacity-0 group-hover/carousel:opacity-100"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}

        <div
          ref={scrollRef}
          className="flex gap-[2px] overflow-x-auto scrollbar-hide px-6 sm:px-8 lg:px-10"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {products.map((product) => (
            <div key={product.id} className="flex-none w-[200px] sm:w-[220px]">
              <ProductCard
                product={product}
                showType={true}
                showCreator={true}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
