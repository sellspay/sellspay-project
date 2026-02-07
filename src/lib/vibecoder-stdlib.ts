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
};
