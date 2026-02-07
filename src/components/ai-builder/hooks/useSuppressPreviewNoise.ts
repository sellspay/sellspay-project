import { useEffect, useRef } from "react";

const DEFAULT_PATTERNS: RegExp[] = [
  /Cannot assign to read only property 'message'/i,
  /react-error-overlay/i,
  /\/static\/js\/sandbox\./i,
];

/**
 * Suppresses noisy preview-overlay errors coming from the embedded Sandpack runtime.
 * This does NOT hide our own FixErrorToast; it only prevents the full-screen overlay + console spam.
 */
export function useSuppressPreviewNoise(enabled: boolean, extraPatterns: RegExp[] = []) {
  const originals = useRef<{ error: typeof console.error; warn: typeof console.warn } | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const patterns = [...DEFAULT_PATTERNS, ...extraPatterns];
    const matches = (value: unknown) => {
      const msg = typeof value === "string" ? value : (value as any)?.message;
      if (typeof msg !== "string") return false;
      return patterns.some((p) => p.test(msg));
    };

    const onWindowError = (event: ErrorEvent) => {
      if (matches(event.message) || matches(event.error)) {
        event.preventDefault();
        // stopImmediatePropagation is not always present on ErrorEvent in TS
        (event as any).stopImmediatePropagation?.();
      }
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (matches(event.reason)) {
        event.preventDefault();
        (event as any).stopImmediatePropagation?.();
      }
    };

    // Patch console spam (only error/warn) for known noisy patterns.
    if (!originals.current) {
      originals.current = {
        error: console.error,
        warn: console.warn,
      };

      console.error = (...args: any[]) => {
        if (args.some(matches)) return;
        originals.current!.error(...args);
      };

      console.warn = (...args: any[]) => {
        if (args.some(matches)) return;
        originals.current!.warn(...args);
      };
    }

    window.addEventListener("error", onWindowError, true);
    window.addEventListener("unhandledrejection", onUnhandledRejection, true);

    return () => {
      window.removeEventListener("error", onWindowError, true);
      window.removeEventListener("unhandledrejection", onUnhandledRejection, true);

      if (originals.current) {
        console.error = originals.current.error;
        console.warn = originals.current.warn;
        originals.current = null;
      }
    };
  }, [enabled, extraPatterns]);
}
