import { useAITheme } from './AIThemeProvider';
import type { FeaturedProductsProps } from './types';
import { ShoppingBag, ArrowRight } from 'lucide-react';

interface Props {
  id: string;
  props: FeaturedProductsProps & { 
    // Legacy section props support
    title?: string;
    description?: string;
    products?: Array<{ id: string; title: string; price?: string | number; imageUrl?: string }>;
    buttonText?: string;
  };
}

export function FeaturedProductsBlock({ props }: Props) {
  const theme = useAITheme();
  const {
    title = 'Featured Products',
    subtitle,
    layout = 'grid',
    columns = 3,
    products = [],
  } = props;

  // Handle both legacy and new formats
  const displayProducts = products.length > 0 ? products : [
    { id: 'p1', title: 'Premium Pack', price: '$29', imageUrl: '' },
    { id: 'p2', title: 'Starter Bundle', price: '$19', imageUrl: '' },
    { id: 'p3', title: 'Pro Collection', price: '$49', imageUrl: '' },
  ];

  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
  }[columns] || 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

  return (
    <section
      style={{
        backgroundColor: 'var(--ai-background)',
        padding: 'var(--ai-section-spacing) 2rem',
      }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        {(title || subtitle) && (
          <div className="text-center mb-10">
            {title && (
              <h2
                className="text-2xl md:text-3xl font-bold mb-3"
                style={{ color: 'var(--ai-foreground)' }}
              >
                {title}
              </h2>
            )}
            {subtitle && (
              <p
                className="text-base max-w-2xl mx-auto"
                style={{ color: 'var(--ai-muted-foreground)' }}
              >
                {subtitle}
              </p>
            )}
          </div>
        )}

        {/* Products Grid */}
        <div className={`grid ${gridCols} gap-6`}>
          {displayProducts.slice(0, columns === 4 ? 8 : 6).map((product, index) => (
            <ProductCard key={product.id || index} product={product} />
          ))}
        </div>

        {/* View All Link */}
        {displayProducts.length > 3 && (
          <div className="text-center mt-8">
            <a
              href="#"
              className="inline-flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80"
              style={{ color: 'var(--ai-accent)' }}
            >
              View All Products
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

function ProductCard({ product }: { product: { id?: string; title: string; price?: string | number; imageUrl?: string; description?: string } }) {
  const formatPrice = (price: string | number | undefined) => {
    if (!price) return 'Free';
    if (typeof price === 'number') return price === 0 ? 'Free' : `$${price}`;
    return price;
  };

  return (
    <div
      className="group relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
      style={{
        backgroundColor: 'var(--ai-muted)',
        borderRadius: 'var(--ai-radius)',
      }}
    >
      {/* Product Image / Placeholder */}
      <div 
        className="aspect-[4/3] relative overflow-hidden"
        style={{ borderRadius: 'var(--ai-radius) var(--ai-radius) 0 0' }}
      >
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div 
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: 'var(--ai-accent)', opacity: 0.15 }}
          >
            <ShoppingBag 
              className="w-12 h-12" 
              style={{ color: 'var(--ai-accent)' }}
            />
          </div>
        )}
        
        {/* Price Badge */}
        <div
          className="absolute top-3 right-3 px-3 py-1 text-sm font-semibold"
          style={{
            backgroundColor: 'var(--ai-accent)',
            color: 'var(--ai-accent-foreground)',
            borderRadius: 'calc(var(--ai-radius) / 2)',
          }}
        >
          {formatPrice(product.price)}
        </div>
      </div>

      {/* Product Info */}
      <div style={{ padding: 'var(--ai-element-spacing)' }}>
        <h3
          className="font-semibold text-base mb-1 line-clamp-1"
          style={{ color: 'var(--ai-foreground)' }}
        >
          {product.title}
        </h3>
        {product.description && (
          <p
            className="text-sm line-clamp-2"
            style={{ color: 'var(--ai-muted-foreground)' }}
          >
            {product.description}
          </p>
        )}
      </div>
    </div>
  );
}