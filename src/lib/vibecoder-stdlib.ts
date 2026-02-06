/**
 * Standard Library for Vibecoder Sandpack Previews
 * These files are automatically injected into every preview environment
 * to prevent crashes when AI-generated code imports platform hooks.
 */
export const VIBECODER_STDLIB: Record<string, string> = {
  // The SellsPay Checkout Hook (mocked for preview)
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

// Alias for backwards compatibility
export const useMarketplace = useSellsPayCheckout;
`,

  // Common utilities (prevents missing cn() crashes)
  '/lib/utils.ts': `import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`,
};
