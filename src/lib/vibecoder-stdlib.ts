/**
 * Standard Library for Vibecoder Sandpack Previews
 * These files are automatically injected into every preview environment
 * to prevent crashes when AI-generated code imports platform hooks.
 * 
 * Path Aliases: The AI may import from various paths (@/, ./, etc.)
 * We provide multiple aliases to catch common variations.
 * 
 * NUCLEAR ERROR SILENCE PROTOCOL:
 * - iframe-silence.js: Patches console/window.onerror inside iframe
 * - iframe-silence.css: Hides all error overlays inside iframe
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
  // NUCLEAR SILENCE: Iframe Error Suppression Script
  // This runs BEFORE React boots and patches all error handlers
  // ============================================
  '/src/iframe-silence.js': `
// NUCLEAR ERROR SILENCE PROTOCOL - Layer 2: Iframe Runtime Silencer
// Patches console.error, window.onerror, removes error overlays,
// and intercepts navigation attempts that fail in sandboxed iframes.

(function() {
  'use strict';
  
  // ── SAFE NAVIGATION PATCH ──────────────────────────────
  // Sandpack iframes cannot do top-level navigation (window.location.href = ...).
  // We intercept assignments to window.location.href and window.location.assign()
  // and convert them to window.open() which works in sandboxed iframes.
  
  try {
    // Patch window.location.assign and window.location.replace
    const origAssign = window.location.assign.bind(window.location);
    const origReplace = window.location.replace.bind(window.location);
    
    window.location.assign = function(url) {
      try { origAssign(url); } catch(e) {
        console.log('[Sandpack] Navigation blocked, opening in new tab:', url);
        window.open(url, '_blank');
      }
    };
    
    window.location.replace = function(url) {
      try { origReplace(url); } catch(e) {
        console.log('[Sandpack] Navigation blocked, opening in new tab:', url);
        window.open(url, '_blank');
      }
    };
  } catch(e) { /* location patches not supported */ }

  // Intercept clicks on <a> tags that would navigate the top frame
  document.addEventListener('click', function(e) {
    var target = e.target;
    while (target && target.tagName !== 'A') target = target.parentElement;
    if (!target || !target.href) return;
    
    var href = target.href;
    // Skip same-page anchors and javascript: links
    if (href.startsWith('#') || href.startsWith('javascript:')) return;
    // Skip internal sandbox links
    if (href.includes('codesandbox.io') || href.includes('sandpack')) return;
    
    // External link — open in new tab to avoid sandbox violation
    e.preventDefault();
    e.stopPropagation();
    window.open(href, '_blank');
  }, true);

  // Patch window.onerror to catch navigation errors silently
  var origOnError = window.onerror;
  window.onerror = function(message) {
    if (typeof message === 'string' && (
      message.includes('allow-top-navigation') ||
      message.includes('Unsafe attempt to initiate navigation') ||
      message.includes('Blocked a frame with origin')
    )) {
      return true; // Suppress sandbox navigation errors
    }
    if (shouldSuppress(message)) return true;
    if (origOnError) return origOnError.apply(this, arguments);
    return false;
  };
  
  // ── ERROR SUPPRESSION ──────────────────────────────────
  var NOISE_PATTERNS = [
    /Cannot assign to read only property/i,
    /MutationRecord/i,
    /which has only a getter/i,
    /react-error-overlay/i,
    /SyntaxError/i,
    /Unexpected token/i,
    /Cannot find module/i,
    /is not defined/i,
    /Cannot read properties of/i,
    /undefined is not an object/i,
    /Minified React error/i,
    /The above error occurred/i,
    /sandpack/i,
    /bundler/i,
    /removeChild/i,
    /allow-top-navigation/i,
    /Unsafe attempt to initiate navigation/i,
  ];
  
  function shouldSuppress(msg) {
    if (!msg) return false;
    var str = typeof msg === 'string' ? msg : String(msg.message || msg);
    return NOISE_PATTERNS.some(function(p) { return p.test(str); });
  }
  
  // Patch console.error
  var origError = console.error;
  console.error = function() {
    if ([].some.call(arguments, shouldSuppress)) return;
    origError.apply(console, arguments);
  };
  
  // Patch console.warn
  var origWarn = console.warn;
  console.warn = function() {
    if ([].some.call(arguments, shouldSuppress)) return;
    origWarn.apply(console, arguments);
  };
  
  // Patch unhandled rejections
  window.onunhandledrejection = function(event) {
    if (shouldSuppress(event && event.reason)) {
      event.preventDefault();
      return true;
    }
    return false;
  };
  
  // Mutation observer to remove error overlays as they appear
  var removeErrorOverlays = function() {
    var selectors = [
      '#react-error-overlay',
      '.error-overlay',
      '[data-react-error-overlay]',
      '.sp-error-overlay',
      '.sp-error',
      '.sp-error-message',
      '.sp-error-title',
      '.sp-error-stack',
    ];
    
    selectors.forEach(function(sel) {
      document.querySelectorAll(sel).forEach(function(el) {
        el.style.display = 'none';
        el.style.visibility = 'hidden';
        el.style.opacity = '0';
        el.style.pointerEvents = 'none';
      });
    });
  };
  
  removeErrorOverlays();
  
  if (typeof MutationObserver !== 'undefined') {
    var observer = new MutationObserver(removeErrorOverlays);
    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    } else {
      document.addEventListener('DOMContentLoaded', function() {
        observer.observe(document.body, { childList: true, subtree: true });
      });
    }
  }
  
  setInterval(removeErrorOverlays, 500);
})();
`,

  // ============================================
  // NUCLEAR SILENCE: Iframe Error Overlay CSS
  // Hides all known error overlay components
  // ============================================
  '/src/iframe-silence.css': `
/* NUCLEAR ERROR SILENCE PROTOCOL - Layer 1: Iframe CSS Suppression */
/* Hides ALL known error overlay components inside the Sandpack iframe */

#react-error-overlay,
.error-overlay,
[data-react-error-overlay],
.sp-error-overlay,
.sp-error,
.sp-error-message,
.sp-error-title,
.sp-error-stack,
.sp-error-banner,
.cm-diagnosticMessage,
.cm-diagnostic,
.cm-lintRange-error,
.cm-lintRange-warning,
div[style*="background-color: rgb(255, 0, 0)"],
div[style*="background-color: red"],
div[style*="background: red"],
div[style*="position: fixed"][style*="z-index: 9999"],
div[style*="position: fixed"][style*="background"][style*="color: white"] {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
  pointer-events: none !important;
  width: 0 !important;
  height: 0 !important;
  overflow: hidden !important;
  position: absolute !important;
  left: -9999px !important;
}

/* Hide any element with "error" in class that looks like an overlay */
[class*="error-overlay"],
[class*="error_overlay"],
[class*="errorOverlay"],
[class*="ErrorOverlay"] {
  display: none !important;
}

/* Prevent fixed position error banners */
body > div[style*="position: fixed"][style*="top: 0"] {
  display: none !important;
}
`,

  // ============================================
  // PRIMARY: The SellsPay Checkout Hook (mocked for preview)
  // ============================================
  '/src/hooks/useSellsPayCheckout.ts': `import { useState } from 'react';

/**
 * SellsPay Unified Checkout Hook
 * Handles product navigation safely from inside Sandpack iframes.
 * Uses window.open() to avoid cross-origin security errors.
 */
export function useSellsPayCheckout() {
  const [isProcessing, setIsProcessing] = useState(false);

  const buyProduct = async (productId: string) => {
    setIsProcessing(true);
    console.log('[SellsPay] Navigating to product:', productId);

    // Always use the known production domain for product links.
    // Inside Sandpack iframes, window.location is codesandbox.io
    // and document.referrer may be empty, so we hardcode the real site.
    const productUrl = 'https://sellspay.lovable.app/product/' + productId;

    // Open in new tab — safest approach from inside any iframe context
    window.open(productUrl, '_blank');

    setTimeout(() => setIsProcessing(false), 500);
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
    console.log('[SalesPay] Navigating to product:', productId);

    const url = productId 
      ? 'https://sellspay.lovable.app/product/' + productId 
      : 'https://sellspay.lovable.app';
    window.open(url, '_blank');

    setTimeout(() => setIsProcessing(false), 500);
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
  // PATH ALIASES: Silencer assets (match preview imports)
  // Some previews import ./lib/* while the canonical files live in /src/*
  // ============================================
  '/lib/iframe-silence.js': `// Alias entrypoint for Sandpack previews
import "../src/iframe-silence.js";
`,

  '/lib/iframe-silence.css': `/* Alias stylesheet for Sandpack previews */
@import "../src/iframe-silence.css";
`,

  // Extra root-level aliases for robustness
  '/iframe-silence.js': `import "./src/iframe-silence.js";
`,

  '/iframe-silence.css': `@import "./src/iframe-silence.css";
`,

  // ============================================
  // STOREFRONT PRIMITIVES: Pre-built commerce components
  // AI should compose these instead of recreating commerce logic
  // ============================================

  '/storefront/primitives/BuyButton.tsx': `import { useSellsPayCheckout } from '../../src/hooks/useSellsPayCheckout';

interface BuyButtonProps {
  productId: string;
  label?: string;
  className?: string;
}

export function BuyButton({ productId, label = 'Buy Now', className = '' }: BuyButtonProps) {
  const { buyProduct, isProcessing } = useSellsPayCheckout();
  return (
    <button
      onClick={() => buyProduct(productId)}
      disabled={isProcessing}
      className={\`px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 \${className}\`}
    >
      {isProcessing ? 'Processing...' : label}
    </button>
  );
}

export default BuyButton;
`,

  '/storefront/primitives/ProductCard.tsx': `interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price_cents?: number | null;
    cover_image_url?: string | null;
    slug?: string | null;
    excerpt?: string | null;
  };
  className?: string;
}

export function ProductCard({ product, className = '' }: ProductCardProps) {
  const price = product.price_cents != null ? (product.price_cents / 100).toFixed(2) : 'Free';

  const handleClick = () => {
    const url = '/product/' + (product.slug || product.id);
    window.parent?.postMessage({ type: 'VIBECODER_NAVIGATE', url, target: '_self' }, '*');
  };

  return (
    <div
      onClick={handleClick}
      className={\`group cursor-pointer bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 hover:border-violet-500/50 transition-all \${className}\`}
    >
      {product.cover_image_url && (
        <div className="aspect-[4/3] overflow-hidden">
          <img src={product.cover_image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        </div>
      )}
      <div className="p-4">
        <h3 className="text-white font-semibold text-lg">{product.name}</h3>
        {product.excerpt && <p className="text-zinc-400 text-sm mt-1 line-clamp-2">{product.excerpt}</p>}
        <p className="text-violet-400 font-bold mt-2">{typeof price === 'string' && price !== 'Free' ? '$' + price : price}</p>
      </div>
    </div>
  );
}

export default ProductCard;
`,

  '/storefront/primitives/ProductGrid.tsx': `import { ProductCard } from './ProductCard';

interface Product {
  id: string;
  name: string;
  price_cents?: number | null;
  cover_image_url?: string | null;
  slug?: string | null;
  excerpt?: string | null;
}

interface ProductGridProps {
  products: Product[];
  columns?: 2 | 3 | 4;
  className?: string;
}

export function ProductGrid({ products, columns = 3, className = '' }: ProductGridProps) {
  const gridCols = columns === 2 ? 'grid-cols-1 sm:grid-cols-2' : columns === 4 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

  return (
    <div className={\`grid \${gridCols} gap-6 \${className}\`}>
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

export default ProductGrid;
`,

  '/storefront/primitives/FeaturedProducts.tsx': `import { ProductGrid } from './ProductGrid';

interface Product {
  id: string;
  name: string;
  price_cents?: number | null;
  cover_image_url?: string | null;
  slug?: string | null;
  excerpt?: string | null;
}

interface FeaturedProductsProps {
  products: Product[];
  title?: string;
  subtitle?: string;
  className?: string;
}

export function FeaturedProducts({ products, title = 'Featured Products', subtitle, className = '' }: FeaturedProductsProps) {
  return (
    <section className={\`py-16 px-4 \${className}\`}>
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-white mb-2">{title}</h2>
        {subtitle && <p className="text-zinc-400 mb-8">{subtitle}</p>}
        <ProductGrid products={products} columns={3} />
      </div>
    </section>
  );
}

export default FeaturedProducts;
`,

  '/storefront/primitives/UserHeader.tsx': `interface UserHeaderProps {
  username: string;
  bio?: string;
  avatarUrl?: string;
  className?: string;
}

export function UserHeader({ username, bio, avatarUrl, className = '' }: UserHeaderProps) {
  return (
    <div className={\`flex items-center gap-4 \${className}\`}>
      {avatarUrl ? (
        <img src={avatarUrl} alt={username} className="w-12 h-12 rounded-full object-cover border-2 border-violet-500/50" />
      ) : (
        <div className="w-12 h-12 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold text-lg">
          {username.charAt(0).toUpperCase()}
        </div>
      )}
      <div>
        <h3 className="text-white font-semibold text-lg">{username}</h3>
        {bio && <p className="text-zinc-400 text-sm">{bio}</p>}
      </div>
    </div>
  );
}

export default UserHeader;
`,

  '/storefront/primitives/StoreThemeProvider.tsx': `import React from 'react';

interface StoreThemeProviderProps {
  children: React.ReactNode;
  primaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
}

export function StoreThemeProvider({
  children,
  primaryColor = '#8b5cf6',
  accentColor = '#3b82f6',
  fontFamily = 'Inter, system-ui, sans-serif',
}: StoreThemeProviderProps) {
  return (
    <div
      style={{
        '--store-primary': primaryColor,
        '--store-accent': accentColor,
        fontFamily,
      } as React.CSSProperties}
      className="min-h-screen bg-zinc-950 text-zinc-100"
    >
      {children}
    </div>
  );
}

export default StoreThemeProvider;
`,
};
