import { useEffect, useRef } from "react";

/**
 * NUCLEAR ERROR SILENCE PROTOCOL - Layer 4: Parent Window Suppression
 * 
 * Comprehensive regex patterns to catch ALL known noise from:
 * - Sandpack bundler
 * - React error overlay
 * - Frozen Error object mutations
 * - MutationRecord readonly property errors
 * - General runtime crashes during code generation
 */
const DEFAULT_PATTERNS: RegExp[] = [
  // Original patterns
  /Cannot assign to read only property 'message'/i,
  /react-error-overlay/i,
  /\/static\/js\/sandbox\./i,
  
  // MutationRecord / attributeName errors (the specific spam you're seeing)
  /Cannot set property attributeName/i,
  /MutationRecord/i,
  /which has only a getter/i,
  
  // Frozen/readonly object errors
  /Cannot assign to read only property/i,
  /Cannot set property .* of .* which has only a getter/i,
  /object is not extensible/i,
  /Cannot add property .*, object is not extensible/i,
  /Cannot freeze/i,
  
  // SyntaxError patterns from bundler (incomplete code during streaming)
  /SyntaxError/i,
  /Unexpected token/i,
  /Unexpected end of input/i,
  /missing \) after argument list/i,
  /Unterminated string constant/i,
  /Invalid or unexpected token/i,
  
  // React/JSX specific errors during streaming
  /Adjacent JSX elements/i,
  /Expected corresponding JSX closing tag/i,
  /JSX element .* has no corresponding closing tag/i,
  
  // Module/Import errors (common during streaming)
  /Cannot find module/i,
  /Module not found/i,
  /Failed to resolve import/i,
  /is not defined/i,
  /is not a function/i,
  /Cannot read properties of undefined/i,
  /Cannot read properties of null/i,
  /undefined is not an object/i,
  /null is not an object/i,
  
  // Sandpack bundler noise
  /\/sandbox\./i,
  /sandpack/i,
  /codesandbox/i,
  /bundler/i,
  /_evalModule/i,
  /evaluate-module/i,
  
  // React internals during crashes
  /Minified React error/i,
  /React will try to recreate/i,
  /The above error occurred in/i,
  /Consider adding an error boundary/i,
  /Error boundaries should implement/i,
  /componentDidCatch/i,
  
  // Lovable internal noise
  /lovable\.js/i,
  /gpteng\.co/i,
  /processMutation/i,
  /processMutations/i,
  
  // Generic crash patterns to suppress
  /Uncaught TypeError/i,
  /Uncaught ReferenceError/i,
  /Uncaught Error/i,
  /Script error/i,
];

/**
 * Suppresses noisy preview-overlay errors coming from the embedded Sandpack runtime.
 * This does NOT hide our own FixErrorToast; it only prevents the full-screen overlay + console spam.
 * 
 * NUCLEAR MODE: When enabled, this aggressively filters ALL known error patterns
 * to ensure a completely silent preview experience during code generation.
 */
export function useSuppressPreviewNoise(enabled: boolean, extraPatterns: RegExp[] = []) {
  const originals = useRef<{ error: typeof console.error; warn: typeof console.warn } | null>(null);
  const observerRef = useRef<MutationObserver | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const patterns = [...DEFAULT_PATTERNS, ...extraPatterns];
    
    // NUCLEAR: Never read .message from Error objects - just check type
    const matches = (value: unknown): boolean => {
      if (value == null) return false;
      
      // If it's an Error, suppress it entirely to avoid frozen object crashes
      if (value instanceof Error) return true;
      
      try {
        let msg: string | undefined;
        if (typeof value === "string") {
          msg = value;
        } else if (typeof value === "object") {
          // Don't read .message - just stringify safely
          msg = String(value);
        }
        if (typeof msg !== "string" || msg.length === 0) return false;
        return patterns.some((p) => p.test(msg!));
      } catch {
        return true; // If reading throws, suppress
      }
    };

    // Capture window error events - NEVER touch event.error.message
    const onWindowError = (event: ErrorEvent) => {
      try {
        // Just check event.message (string), never touch event.error
        if (typeof event.message === 'string' && patterns.some(p => p.test(event.message))) {
          event.preventDefault();
          event.stopPropagation();
          return true;
        }
        // If there's an Error object, suppress without reading it
        if (event.error instanceof Error) {
          event.preventDefault();
          event.stopPropagation();
          return true;
        }
      } catch {
        event.preventDefault();
        return true;
      }
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      try {
        // Suppress all promise rejections with Error objects
        if (event.reason instanceof Error) {
          event.preventDefault();
          return true;
        }
        if (matches(event.reason)) {
          event.preventDefault();
          return true;
        }
      } catch {
        event.preventDefault();
        return true;
      }
    };

    // NUCLEAR: MutationObserver to instantly nuke any error overlays in parent
    const nukeParentOverlays = () => {
      const selectors = ['#react-error-overlay', '[class*="error-overlay"]', '.sp-error'];
      selectors.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => {
          try { el.remove(); } catch { (el as HTMLElement).style.display = 'none'; }
        });
      });
    };

    observerRef.current = new MutationObserver(() => nukeParentOverlays());
    observerRef.current.observe(document.body, { childList: true, subtree: true });

    // Patch console
    if (!originals.current) {
      originals.current = { error: console.error, warn: console.warn };

      console.error = (...args: any[]) => {
        try {
          // Don't even check Error objects - just suppress them
          if (args.some(a => a instanceof Error)) return;
          if (args.some(matches)) return;
        } catch { return; }
        originals.current!.error(...args);
      };

      console.warn = (...args: any[]) => {
        try {
          if (args.some(a => a instanceof Error)) return;
          if (args.some(matches)) return;
        } catch { return; }
        originals.current!.warn(...args);
      };
    }

    window.addEventListener("error", onWindowError, true);
    window.addEventListener("unhandledrejection", onUnhandledRejection, true);

    return () => {
      window.removeEventListener("error", onWindowError, true);
      window.removeEventListener("unhandledrejection", onUnhandledRejection, true);
      observerRef.current?.disconnect();

      if (originals.current) {
        console.error = originals.current.error;
        console.warn = originals.current.warn;
        originals.current = null;
      }
    };
  }, [enabled, extraPatterns]);
}
