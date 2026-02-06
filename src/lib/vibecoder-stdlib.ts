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
  // PRIMARY: The SellsPay Checkout Hook (mocked for preview)
  // ============================================
  '/hooks/useSellsPayCheckout.ts': `import { useState } from 'react';

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

  return { buyProduct, isProcessing };
}

// Default export for compatibility
export default useSellsPayCheckout;

// Alias for backwards compatibility
export const useMarketplace = useSellsPayCheckout;
`,

  // ============================================
  // PATH ALIASES: Catch common import variations
  // ============================================
  
  // Alias: /hooks/useMarketplace.ts -> re-exports from useSellsPayCheckout
  '/hooks/useMarketplace.ts': `export * from './useSellsPayCheckout';
export { useSellsPayCheckout as default } from './useSellsPayCheckout';
`,

  // Alias: Root level import (if AI forgets /hooks/)
  '/useSellsPayCheckout.ts': `export * from './hooks/useSellsPayCheckout';
export { useSellsPayCheckout as default } from './hooks/useSellsPayCheckout';
`,

  // Alias: Root level useMarketplace
  '/useMarketplace.ts': `export * from './hooks/useSellsPayCheckout';
export { useSellsPayCheckout as useMarketplace, useSellsPayCheckout as default } from './hooks/useSellsPayCheckout';
`,

  // ============================================
  // SPELLING VARIATIONS: AI sometimes uses "Sales" instead of "Sells"
  // ============================================
  
  // Catch "useSalesPayCheckout" (one L) spelling
  '/hooks/useSalesPayCheckout.ts': `export * from './useSellsPayCheckout';
export { useSellsPayCheckout as useSalesPayCheckout, useSellsPayCheckout as default } from './useSellsPayCheckout';
`,

  '/useSalesPayCheckout.ts': `export * from './hooks/useSellsPayCheckout';
export { useSellsPayCheckout as useSalesPayCheckout, useSellsPayCheckout as default } from './hooks/useSellsPayCheckout';
`,

  // Catch src/ prefix variations
  '/src/hooks/useSellsPayCheckout.ts': `export * from '../hooks/useSellsPayCheckout';
export { useSellsPayCheckout as default } from '../hooks/useSellsPayCheckout';
`,

  '/src/hooks/useSalesPayCheckout.ts': `export * from '../hooks/useSellsPayCheckout';
export { useSellsPayCheckout as useSalesPayCheckout, useSellsPayCheckout as default } from '../hooks/useSellsPayCheckout';
`,

  // ============================================
  // UTILITIES: Common helper functions
  // ============================================
  
  // cn() utility for conditional classNames
  '/lib/utils.ts': `import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`,

  // Root level utils alias
  '/utils.ts': `export * from './lib/utils';
`,
};
