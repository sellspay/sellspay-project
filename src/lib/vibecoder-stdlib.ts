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
// Patches console.error, window.onerror, and removes error overlays

(function() {
  'use strict';
  
  // Patterns to suppress (same as parent window)
  const NOISE_PATTERNS = [
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
  ];
  
  const shouldSuppress = (msg) => {
    if (!msg) return false;
    const str = typeof msg === 'string' ? msg : String(msg?.message || msg);
    return NOISE_PATTERNS.some(p => p.test(str));
  };
  
  // Patch console.error
  const origError = console.error;
  console.error = function(...args) {
    if (args.some(shouldSuppress)) return;
    origError.apply(console, args);
  };
  
  // Patch console.warn
  const origWarn = console.warn;
  console.warn = function(...args) {
    if (args.some(shouldSuppress)) return;
    origWarn.apply(console, args);
  };
  
  // Patch window.onerror
  window.onerror = function(message) {
    if (shouldSuppress(message)) return true;
    return false;
  };
  
  // Patch unhandled rejections
  window.onunhandledrejection = function(event) {
    if (shouldSuppress(event?.reason)) {
      event.preventDefault();
      return true;
    }
    return false;
  };
  
  // Mutation observer to remove error overlays as they appear
  const removeErrorOverlays = () => {
    const selectors = [
      '#react-error-overlay',
      '.error-overlay',
      '[data-react-error-overlay]',
      '.sp-error-overlay',
      '.sp-error',
      '.sp-error-message',
      '.sp-error-title',
      '.sp-error-stack',
    ];
    
    selectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        el.style.display = 'none';
        el.style.visibility = 'hidden';
        el.style.opacity = '0';
        el.style.pointerEvents = 'none';
      });
    });
  };
  
  // Run immediately
  removeErrorOverlays();
  
  // Set up mutation observer to catch dynamically added overlays
  if (typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver(removeErrorOverlays);
    
    // Start observing once DOM is ready
    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        observer.observe(document.body, { childList: true, subtree: true });
      });
    }
  }
  
  // Fallback interval (catches edge cases)
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
};
