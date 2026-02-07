import { useMemo, memo, useEffect, useRef, forwardRef } from 'react';
import { 
  SandpackTheme, 
  useSandpack, 
  SandpackProvider, 
  SandpackPreview as SandpackPreviewComponent,
  SandpackCodeEditor,
} from '@codesandbox/sandpack-react';
import { VIBECODER_STDLIB } from '@/lib/vibecoder-stdlib';
import type { ViewMode } from './types/generation';
import { useSuppressPreviewNoise } from './hooks/useSuppressPreviewNoise';

interface VibecoderPreviewProps {
  code: string;
  isStreaming?: boolean;
  showLoadingOverlay?: boolean;
  onError?: (error: string) => void;
  viewMode?: ViewMode;
  onReady?: () => void;
}

// NUCLEAR ERROR SILENCE PROTOCOL - Layer 5: Parent CSS Nuclear Strike
// Forces all Sandpack internal wrappers to fill height AND
// COMPLETELY HIDES all error overlays, banners, and diagnostic UI
const SANDPACK_HEIGHT_FIX = `
  /* Height fixes for Sandpack layout */
  .sp-wrapper, 
  .sp-layout, 
  .sp-stack { 
    height: 100% !important; 
    width: 100% !important; 
    display: flex !important; 
    flex-direction: column !important; 
    background: transparent !important;
  }
  .sp-preview-container {
    flex: 1 !important;
    height: 100% !important;
    display: flex !important;
    flex-direction: column !important;
    background: transparent !important;
  }
  .sp-preview {
    background: transparent !important;
  }
  .sp-preview-iframe {
    flex: 1 !important;
    height: 100% !important;
    min-height: 0 !important;
    background: transparent !important;
  }
  .sp-code-editor {
    flex: 1 !important;
    height: 100% !important;
  }
  .cm-editor {
    height: 100% !important;
  }

  /* ======================================================
   * NUCLEAR ERROR SILENCE PROTOCOL - HIDE EVERYTHING
   * ======================================================
   * These styles hide ALL error overlays, banners, and 
   * diagnostic messages from Sandpack, React, and CodeMirror.
   * The user will only see FixErrorToast at the bottom.
   * ====================================================== */

  /* Sandpack error overlays */
  .sp-error-overlay,
  .sp-error,
  .sp-error-message,
  .sp-error-title,
  .sp-error-stack,
  .sp-error-banner,
  .sp-bridge-frame,
  .sp-preview-actions-error {
    display: none !important;
    opacity: 0 !important;
    visibility: hidden !important;
    pointer-events: none !important;
    width: 0 !important;
    height: 0 !important;
    position: absolute !important;
    left: -9999px !important;
    z-index: -1 !important;
  }

  /* React error overlay */
  #react-error-overlay,
  [data-react-error-overlay],
  .error-overlay,
  [class*="error-overlay"],
  [class*="errorOverlay"],
  [class*="ErrorOverlay"] {
    display: none !important;
    opacity: 0 !important;
    visibility: hidden !important;
    pointer-events: none !important;
  }

  /* CodeMirror diagnostics/lint messages */
  .cm-diagnosticMessage,
  .cm-diagnostic,
  .cm-lintRange-error,
  .cm-lintRange-warning,
  .cm-lint-marker,
  .cm-panel-lint,
  .cm-tooltip-lint {
    display: none !important;
    opacity: 0 !important;
    visibility: hidden !important;
  }

  /* Generic red error banners (fallback selectors) */
  div[style*="background-color: rgb(255, 0, 0)"],
  div[style*="background-color: red"],
  div[style*="background: red"],
  div[style*="background: rgb(255"],
  div[style*="position: fixed"][style*="z-index: 9999"],
  div[style*="position: fixed"][style*="top: 0"][style*="background"] {
    display: none !important;
    opacity: 0 !important;
    visibility: hidden !important;
    pointer-events: none !important;
  }

  /* Sandpack console error panel */
  .sp-console,
  .sp-console-list,
  .sp-console-item-error {
    display: none !important;
  }

  /* Any iframe-injected error overlays (catches dynamically added) */
  iframe[title*="error"],
  iframe[src*="error"] {
    display: none !important;
  }
`;


// Custom dark theme matching our app
const customTheme: SandpackTheme = {
  colors: {
    surface1: '#09090b', // zinc-950
    surface2: '#18181b', // zinc-900
    surface3: '#27272a', // zinc-800
    clickable: '#a1a1aa', // zinc-400
    base: '#fafafa', // zinc-50
    disabled: '#52525b', // zinc-600
    hover: '#d4d4d8', // zinc-300
    accent: '#8b5cf6', // violet-500
    error: '#ef4444',
    errorSurface: '#7f1d1d',
  },
  syntax: {
    plain: '#e4e4e7', // zinc-200
    comment: { color: '#71717a', fontStyle: 'italic' }, // zinc-500
    keyword: '#c084fc', // violet-400
    tag: '#60a5fa', // blue-400
    punctuation: '#a1a1aa', // zinc-400
    definition: '#4ade80', // green-400
    property: '#38bdf8', // sky-400
    static: '#f472b6', // pink-400
    string: '#a5f3fc', // cyan-200
  },
  font: {
    body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: '"JetBrains Mono", "Fira Code", Consolas, monospace',
    size: '13px',
    lineHeight: '1.6',
  },
};

// Error detector component that monitors Sandpack state
// ONLY notifies parent of errors - does NOT render any UI overlay.
// The parent (AIBuilderCanvas) shows the FixErrorToast at the bottom.
// CRITICAL: Suppresses error reporting while isStreaming is true to prevent flashing.
// NUCLEAR: All error object access is wrapped in try/catch to prevent secondary crashes.
const ErrorDetector = forwardRef<HTMLDivElement, { onError?: (error: string) => void; isStreaming?: boolean }>(
  function ErrorDetector({ onError, isStreaming = false }, ref) {
    const { sandpack } = useSandpack();
    const lastErrorRef = useRef<string | null>(null);
    const onErrorRef = useRef(onError);
    const isStreamingRef = useRef(isStreaming);
    const debounceTimerRef = useRef<number | null>(null);

    // Keep refs in sync to avoid stale closures without causing re-renders
    useEffect(() => {
      onErrorRef.current = onError;
    }, [onError]);

    useEffect(() => {
      isStreamingRef.current = isStreaming;
    }, [isStreaming]);

    // NUCLEAR SAFE ERROR EXTRACTION
    // Never touch the original error object - create brand new strings immediately
    useEffect(() => {
      // 🛡️ GUARD: Suppress ALL error reporting while streaming
      if (isStreamingRef.current) {
        return;
      }

      // Debounce to prevent rapid-fire error reporting
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = window.setTimeout(() => {
        let safeMessage: string | null = null;

        // CRITICAL: Triple-wrapped try/catch to handle frozen Error objects
        try {
          if (sandpack.error) {
            try {
              // Attempt to read message property
              const errorObj = sandpack.error;
              if (typeof errorObj === 'object' && errorObj !== null) {
                // Read into local variable immediately
                let rawMsg: unknown;
                try {
                  rawMsg = (errorObj as any).message;
                } catch {
                  rawMsg = null;
                }
                
                if (typeof rawMsg === 'string' && rawMsg.length > 0) {
                  // Create BRAND NEW string - never pass original reference
                  safeMessage = String(rawMsg).slice(0, 500); // Truncate for safety
                }
              }
            } catch {
              // If reading throws, use generic fallback
              safeMessage = 'Build error detected';
            }
          }
        } catch {
          // Outer catch for any edge case
          safeMessage = 'Build error detected';
        }

        // Only report if this is a NEW error (not the same as last time)
        if (safeMessage && safeMessage !== lastErrorRef.current) {
          lastErrorRef.current = safeMessage;
          // Pass brand new string up to parent
          try {
            onErrorRef.current?.(safeMessage);
          } catch {
            // Ignore callback errors
          }
        }

        // Clear ref when error is resolved
        if (!safeMessage && lastErrorRef.current) {
          lastErrorRef.current = null;
        }
      }, 300); // 300ms debounce

      return () => {
        if (debounceTimerRef.current) {
          window.clearTimeout(debounceTimerRef.current);
        }
      };
    }, [sandpack.error, isStreaming]);

    // Render a tiny node so any injected refs are safe (prevents ref warnings)
    return <div ref={ref} style={{ display: 'none' }} aria-hidden="true" />;
  }
);
ErrorDetector.displayName = 'ErrorDetector';

// Ready detector - fires onReady when Sandpack finishes bundling.
// Includes a fallback timer to avoid the workspace getting stuck behind the transition mask.
const ReadyDetector = forwardRef<HTMLDivElement, { onReady?: () => void }>(
  function ReadyDetector({ onReady }, ref) {
    const { sandpack } = useSandpack();
    const hasCalledReady = useRef(false);

    const callReady = () => {
      if (hasCalledReady.current) return;
      hasCalledReady.current = true;
      onReady?.();
    };

    useEffect(() => {
      // Sandpack status: 'initial' | 'idle' | 'running'
      // 'idle' means bundling is complete
      if (sandpack.status === 'idle') {
        callReady();
      }
    }, [sandpack.status]);

    useEffect(() => {
      // Fallback: if we never hit 'idle' (edge-case), release after a short delay.
      // This prevents the entire canvas from appearing to "vanish" behind the mask.
      const t = window.setTimeout(() => {
        if (!hasCalledReady.current && sandpack.status !== 'initial') {
          callReady();
        }
      }, 1500);

      return () => window.clearTimeout(t);
    }, []);

    return <div ref={ref} style={{ display: 'none' }} aria-hidden="true" />;
  }
);
ReadyDetector.displayName = 'ReadyDetector';

// Memoized Sandpack component to prevent unnecessary re-renders during streaming
const SandpackRenderer = memo(function SandpackRenderer({ 
  code, 
  onError,
  onReady,
  viewMode = 'preview',
  isStreaming = false,
}: { 
  code: string; 
  onError?: (error: string) => void;
  onReady?: () => void;
  viewMode?: ViewMode;
  isStreaming?: boolean;
}) {
  // Wrap the code in proper structure, including the standard library
  // NUCLEAR: Also inject iframe-silence.js and iframe-silence.css
  const files = useMemo(() => ({
    // Standard library (hooks, utils) - always available to prevent crashes
    ...Object.fromEntries(
      Object.entries(VIBECODER_STDLIB).map(([path, content]) => [
        path,
        { code: content, hidden: true }
      ])
    ),
    // The AI-generated code
    '/App.tsx': {
      code,
      active: true,
    },
    // Entry point that imports the silence script FIRST
    '/index.tsx': {
      code: `// NUCLEAR ERROR SILENCE - Import silencer before anything else
import "./iframe-silence.css";
import "./iframe-silence.js";

import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

const root = createRoot(document.getElementById("root")!);
root.render(<App />);`,
      hidden: true,
    },
  }), [code]);

  return (
    <div className="h-full w-full flex flex-col" style={{ height: '100%' }}>
      <SandpackProvider
        template="react-ts"
        theme={customTheme}
        files={files}
        options={{
          externalResources: [
            'https://cdn.tailwindcss.com',
          ],
          // Prevent preview "spazzing" during streaming by delaying recompiles.
          // When streaming ends, this snaps back to the normal delay.
          recompileMode: 'delayed',
          recompileDelay: isStreaming ? 20000 : 500,
        }}
        customSetup={{
          dependencies: {
            'lucide-react': 'latest',
            'framer-motion': '^11.0.0',
            'clsx': 'latest',
            'tailwind-merge': 'latest',
          },
        }}
      >
        <div className="h-full w-full flex-1 flex flex-col relative" style={{ height: '100%' }}>
          <ErrorDetector onError={onError} isStreaming={isStreaming} />
          <ReadyDetector onReady={onReady} />
          <div className="h-full w-full flex-1 flex flex-col" style={{ height: '100%' }}>
            {viewMode === 'preview' || viewMode === 'image' || viewMode === 'video' ? (
              <SandpackPreviewComponent
                showOpenInCodeSandbox={false}
                showRefreshButton={true}
                showSandpackErrorOverlay={false}
                style={{ height: '100%', flex: 1 }}
              />
            ) : (
              <SandpackCodeEditor
                showTabs={true}
                showLineNumbers={true}
                showInlineErrors={false} // NUCLEAR: Disable inline errors in editor too
                wrapContent={true}
                readOnly={true}
                style={{ height: '100%', flex: 1 }}
              />
            )}
          </div>
        </div>
      </SandpackProvider>
    </div>
  );
});

export function VibecoderPreview({
  code,
  isStreaming = false,
  onError,
  onReady,
  viewMode = 'preview',
}: VibecoderPreviewProps) {
  // NUCLEAR ERROR SILENCE PROTOCOL - Layer 4: Parent Window Suppression
  // Prevents Sandpack/react-error-overlay from taking over the whole UI,
  // and suppresses the noisy repeated console errors from frozen SyntaxError objects.
  useSuppressPreviewNoise(true);

  return (
    <div className="h-full w-full relative bg-background flex flex-col">
      {/* NUCLEAR CSS Fix - Inject global styles to force Sandpack height AND hide all error UI */}
      <style>{SANDPACK_HEIGHT_FIX}</style>

      {/* Sandpack preview/code - no loading overlay, just renders directly */}
      <div className="h-full w-full flex-1 min-h-0">
        <SandpackRenderer code={code} onError={onError} onReady={onReady} viewMode={viewMode} isStreaming={isStreaming} />
      </div>
    </div>
  );
}
