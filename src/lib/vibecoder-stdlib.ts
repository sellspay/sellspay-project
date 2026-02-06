/**
 * Standard Library for Vibecoder Sandpack Previews
 * These files are automatically injected into every preview environment
 * to prevent crashes when AI-generated code imports platform hooks.
 * 
 * Path Aliases: The AI may import from various paths (@/, ./, etc.)
 * We provide multiple aliases to catch common variations.
 */
export const VIBECODER_STDLIB: Record<string, string> = {
  // ============================================
  // CONFIG: Teach the browser that "@/" means "src/"
  // ============================================
  '/tsconfig.json': JSON.stringify({
    compilerOptions: {
      target: "ESNext",
      module: "ESNext",
      jsx: "react-jsx",
      baseUrl: ".",
      paths: { "@/*": ["./src/*"] }
    }
  }),

  // ============================================
  // PRIMARY: The SellsPay Checkout Hook (mocked for preview)
  // ============================================
  '/src/hooks/useSellsPayCheckout.ts': `import { useState } from 'react';

/**
 * SellsPay Unified Checkout Hook
 * This is a preview mock. In production, this triggers the real checkout.
 */
export function useSellsPayCheckout() {
  const [isProcessing, setIsProcessing] = useState(false);

  const buyProduct = async (productId: string) => {
    setIsProcessing(true);
    console.log('[SellsPay Preview] Checkout triggered for:', productId);
    
    // Simulate checkout delay
    setTimeout(() => {
      setIsProcessing(false);
      alert('SellsPay Checkout: Redirecting to secure gateway... (Preview Mode)');
    }, 1000);
  };

  const triggerCheckout = buyProduct; // Alias for backwards compatibility

  return { buyProduct, triggerCheckout, isProcessing };
}

// Default export for compatibility
export default useSellsPayCheckout;

// Alias for backwards compatibility
export const useMarketplace = useSellsPayCheckout;
`,

  // ============================================
  // SPELLING VARIATIONS: AI sometimes uses "Sales" instead of "Sells"
  // ============================================
  '/src/hooks/useSalesPayCheckout.ts': `import { useState } from 'react';

export function useSalesPayCheckout() {
  const [isProcessing, setIsProcessing] = useState(false);

  const triggerCheckout = (productId?: string) => {
    setIsProcessing(true);
    console.log('[SalesPay Preview] Checkout triggered for:', productId);
    setTimeout(() => {
      setIsProcessing(false);
      alert('SalesPay Checkout: This is a demo transaction.');
    }, 1000);
  };

  const buyProduct = triggerCheckout;

  return { triggerCheckout, buyProduct, isProcessing };
}

export default useSalesPayCheckout;
`,

  // ============================================
  // PATH ALIASES: Catch common import variations
  // ============================================
  
  // Root-level aliases (without src/)
  '/hooks/useSellsPayCheckout.ts': `export * from '../src/hooks/useSellsPayCheckout';
export { useSellsPayCheckout as default } from '../src/hooks/useSellsPayCheckout';
`,

  '/hooks/useSalesPayCheckout.ts': `export * from '../src/hooks/useSalesPayCheckout';
export { useSalesPayCheckout as default } from '../src/hooks/useSalesPayCheckout';
`,

  '/hooks/useMarketplace.ts': `export * from '../src/hooks/useSellsPayCheckout';
export { useSellsPayCheckout as useMarketplace, useSellsPayCheckout as default } from '../src/hooks/useSellsPayCheckout';
`,

  // Root level imports (if AI forgets /hooks/)
  '/useSellsPayCheckout.ts': `export * from './src/hooks/useSellsPayCheckout';
export { useSellsPayCheckout as default } from './src/hooks/useSellsPayCheckout';
`,

  '/useSalesPayCheckout.ts': `export * from './src/hooks/useSalesPayCheckout';
export { useSalesPayCheckout as default } from './src/hooks/useSalesPayCheckout';
`,

  '/useMarketplace.ts': `export * from './src/hooks/useSellsPayCheckout';
export { useSellsPayCheckout as useMarketplace, useSellsPayCheckout as default } from './src/hooks/useSellsPayCheckout';
`,

  // ============================================
  // UTILITIES: Common helper functions
  // ============================================
  
  // cn() utility for conditional classNames
  '/src/lib/utils.ts': `import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`,

  '/lib/utils.ts': `import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`,

  // Root level utils alias
  '/utils.ts': `export * from './lib/utils';
`,

  // ============================================
  // SELLSPAY SDK: Pre-built marketplace components
  // ============================================
  
  '/src/components/sellspay/ProductCard.tsx': `import React from 'react';
import { useSellsPayCheckout } from '@/hooks/useSellsPayCheckout';

interface ProductCardProps {
  id: string;
  title: string;
  price: number;
  image: string;
  description?: string;
  className?: string;
}

export function ProductCard({ id, title, price, image, description, className = '' }: ProductCardProps) {
  const { buyProduct, isProcessing } = useSellsPayCheckout();
  
  return (
    <div className={\`group relative bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 hover:border-zinc-700 transition-all duration-300 \${className}\`}>
      <div className="aspect-square overflow-hidden">
        <img 
          src={image} 
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-zinc-100 truncate">{title}</h3>
        {description && <p className="text-sm text-zinc-400 line-clamp-2">{description}</p>}
        <div className="flex items-center justify-between pt-2">
          <span className="text-lg font-bold text-zinc-100">\${price}</span>
          <button
            onClick={() => buyProduct(id)}
            disabled={isProcessing}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {isProcessing ? 'Processing...' : 'Buy Now'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
`,

  '/src/components/sellspay/CheckoutButton.tsx': `import React from 'react';
import { useSellsPayCheckout } from '@/hooks/useSellsPayCheckout';

interface CheckoutButtonProps {
  productId: string;
  children?: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
}

export function CheckoutButton({ 
  productId, 
  children = 'Buy Now', 
  className = '',
  variant = 'primary'
}: CheckoutButtonProps) {
  const { buyProduct, isProcessing } = useSellsPayCheckout();
  
  const baseStyles = "px-6 py-3 font-semibold rounded-xl transition-all duration-200 disabled:opacity-50";
  const variants = {
    primary: "bg-violet-600 hover:bg-violet-500 text-white",
    secondary: "bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700",
    ghost: "bg-transparent hover:bg-zinc-800 text-zinc-100",
  };
  
  return (
    <button
      onClick={() => buyProduct(productId)}
      disabled={isProcessing}
      className={\`\${baseStyles} \${variants[variant]} \${className}\`}
    >
      {isProcessing ? 'Processing...' : children}
    </button>
  );
}

export default CheckoutButton;
`,

  '/src/components/sellspay/FeaturedProducts.tsx': `import React from 'react';
import { ProductCard } from './ProductCard';

interface Product {
  id: string;
  title: string;
  price: number;
  image: string;
  description?: string;
}

interface FeaturedProductsProps {
  products: Product[];
  title?: string;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function FeaturedProducts({ 
  products, 
  title = 'Featured Products',
  columns = 3,
  className = ''
}: FeaturedProductsProps) {
  const gridCols = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };
  
  return (
    <section className={\`py-16 px-6 \${className}\`}>
      {title && (
        <h2 className="text-3xl font-bold text-zinc-100 mb-8">{title}</h2>
      )}
      <div className={\`grid \${gridCols[columns]} gap-6\`}>
        {products.map(product => (
          <ProductCard key={product.id} {...product} />
        ))}
      </div>
    </section>
  );
}

export default FeaturedProducts;
`,

  '/src/components/sellspay/CreatorBio.tsx': `import React from 'react';

interface CreatorBioProps {
  name: string;
  avatar: string;
  bio: string;
  socialLinks?: { platform: string; url: string }[];
  className?: string;
}

export function CreatorBio({ name, avatar, bio, socialLinks, className = '' }: CreatorBioProps) {
  return (
    <section className={\`py-16 px-6 \${className}\`}>
      <div className="max-w-2xl mx-auto text-center space-y-6">
        <img 
          src={avatar} 
          alt={name}
          className="w-24 h-24 rounded-full mx-auto object-cover border-2 border-zinc-700"
        />
        <h2 className="text-2xl font-bold text-zinc-100">{name}</h2>
        <p className="text-zinc-400 leading-relaxed">{bio}</p>
        {socialLinks && socialLinks.length > 0 && (
          <div className="flex justify-center gap-4 pt-4">
            {socialLinks.map((link, i) => (
              <a 
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {link.platform}
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default CreatorBio;
`,

  // Hero Section component
  '/src/components/sellspay/HeroSection.tsx': `import React from 'react';
import { motion } from 'framer-motion';

interface HeroSectionProps {
  title: string;
  subtitle?: string;
  backgroundImage?: string;
  ctaText?: string;
  onCtaClick?: () => void;
  overlay?: 'dark' | 'gradient' | 'none';
  className?: string;
}

export function HeroSection({
  title,
  subtitle,
  backgroundImage,
  ctaText,
  onCtaClick,
  overlay = 'dark',
  className = ''
}: HeroSectionProps) {
  const overlayStyles = {
    dark: 'bg-black/60',
    gradient: 'bg-gradient-to-b from-black/80 via-black/40 to-black/80',
    none: '',
  };

  return (
    <section 
      className={\`relative min-h-[80vh] flex items-center justify-center overflow-hidden \${className}\`}
      style={backgroundImage ? { backgroundImage: \`url(\${backgroundImage})\`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
    >
      {overlay !== 'none' && (
        <div className={\`absolute inset-0 \${overlayStyles[overlay]}\`} />
      )}
      
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-6"
        >
          {title}
        </motion.h1>
        
        {subtitle && (
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl text-zinc-300 max-w-2xl mx-auto mb-8"
          >
            {subtitle}
          </motion.p>
        )}
        
        {ctaText && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            onClick={onCtaClick}
            className="px-8 py-4 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors"
          >
            {ctaText}
          </motion.button>
        )}
      </div>
    </section>
  );
}

export default HeroSection;
`,

  // Sticky Navigation component
  '/src/components/sellspay/StickyNav.tsx': `import React from 'react';

interface StickyNavProps {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  variant?: 'glass' | 'solid' | 'minimal';
  className?: string;
}

export function StickyNav({
  tabs,
  activeTab,
  onTabChange,
  variant = 'glass',
  className = ''
}: StickyNavProps) {
  const variants = {
    glass: 'bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-800',
    solid: 'bg-zinc-900 border-b border-zinc-800',
    minimal: 'bg-transparent',
  };

  return (
    <nav className={\`sticky top-0 z-40 \${variants[variant]} \${className}\`}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex gap-1 py-2">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={\`px-4 py-2 rounded-lg font-medium transition-colors \${
                activeTab === tab 
                  ? 'bg-zinc-800 text-white' 
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }\`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}

export default StickyNav;
`,

  // Testimonial Card component
  '/src/components/sellspay/TestimonialCard.tsx': `import React from 'react';
import { Star } from 'lucide-react';

interface TestimonialCardProps {
  quote: string;
  author: string;
  avatar?: string;
  rating?: number;
  className?: string;
}

export function TestimonialCard({
  quote,
  author,
  avatar,
  rating = 5,
  className = ''
}: TestimonialCardProps) {
  return (
    <div className={\`bg-zinc-900 border border-zinc-800 rounded-2xl p-6 \${className}\`}>
      {rating > 0 && (
        <div className="flex gap-1 mb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star 
              key={i} 
              size={16} 
              className={i < rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-700'} 
            />
          ))}
        </div>
      )}
      <p className="text-zinc-300 mb-4 leading-relaxed">"{quote}"</p>
      <div className="flex items-center gap-3">
        {avatar && (
          <img 
            src={avatar} 
            alt={author} 
            className="w-10 h-10 rounded-full object-cover"
          />
        )}
        <span className="font-medium text-zinc-100">{author}</span>
      </div>
    </div>
  );
}

export default TestimonialCard;
`,

  // Stats Bar component
  '/src/components/sellspay/StatsBar.tsx': `import React from 'react';
import { motion } from 'framer-motion';

interface Stat {
  value: string;
  label: string;
}

interface StatsBarProps {
  stats: Stat[];
  className?: string;
}

export function StatsBar({ stats, className = '' }: StatsBarProps) {
  return (
    <div className={\`py-12 px-6 bg-zinc-900/50 border-y border-zinc-800 \${className}\`}>
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="text-center"
          >
            <div className="text-3xl md:text-4xl font-bold text-white mb-1">
              {stat.value}
            </div>
            <div className="text-sm text-zinc-500 uppercase tracking-wider">
              {stat.label}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default StatsBar;
`,

  // SDK index export (updated)
  '/src/components/sellspay/index.ts': `export { ProductCard } from './ProductCard';
export { CheckoutButton } from './CheckoutButton';
export { FeaturedProducts } from './FeaturedProducts';
export { CreatorBio } from './CreatorBio';
export { HeroSection } from './HeroSection';
export { StickyNav } from './StickyNav';
export { TestimonialCard } from './TestimonialCard';
export { StatsBar } from './StatsBar';
`,

  // Alias for @sellspay/core style imports
  '/sellspay/index.ts': `export * from '../src/components/sellspay';
`,
};
