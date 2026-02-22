import { useMemo, memo, useEffect, useRef, forwardRef, useState, useCallback } from 'react';
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
import { CodeFileExplorer } from './CodeFileExplorer';
import type { VirtualFile } from '@/utils/codeFileParser';

/** Map of file paths to file contents (multi-file mode). */
export type ProjectFiles = Record<string, string>;

interface VibecoderPreviewProps {
  /** Single-file code (legacy / backward compat). Ignored when `files` is provided. */
  code?: string;
  /** Multi-file project map. Takes precedence over `code`. */
  files?: ProjectFiles;
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
  projectFiles,
  onError,
  onReady,
  viewMode = 'preview',
  isStreaming = false,
}: { 
  code?: string; 
  projectFiles?: ProjectFiles;
  onError?: (error: string) => void;
  onReady?: () => void;
  viewMode?: ViewMode;
  isStreaming?: boolean;
}) {
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [scrollToLine, setScrollToLine] = useState<number | null>(null);

  const handleFileSelect = useCallback((file: VirtualFile) => {
    setActiveFileId(file.id);
    setScrollToLine(file.startLine);
  }, []);

  // Build the Sandpack file map from either `projectFiles` (multi-file) or `code` (legacy single-file)
  const files = useMemo(() => {
    // --- Project files (AI-generated) ---
    const generatedFiles: Record<string, { code: string; active?: boolean }> = {};

    if (projectFiles && Object.keys(projectFiles).length > 0) {
      // Multi-file mode: spread all project files into Sandpack
      for (const [path, content] of Object.entries(projectFiles)) {
        const sandpackPath = path.startsWith('/') ? path : `/${path}`;
        generatedFiles[sandpackPath] = {
          code: content,
          active: sandpackPath === '/App.tsx',
        };
      }
    } else if (code) {
      // Legacy single-file mode
      generatedFiles['/App.tsx'] = { code, active: true };
    }

    return {
      // Standard library (hooks, utils) - always available to prevent crashes
      ...Object.fromEntries(
        Object.entries(VIBECODER_STDLIB).map(([path, content]) => [
          path,
          { code: content, hidden: true }
        ])
      ),
      // AI-generated files
      ...generatedFiles,
      // Entry point with NUCLEAR error suppression
      '/index.tsx': {
        code: `import "./styles/error-silence.css";
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

// NUCLEAR ERROR SILENCE PROTOCOL
(function() {
  const safeHandler = () => true;
  window.onerror = safeHandler;
  window.onunhandledrejection = (e) => { try { e.preventDefault(); } catch {} return true; };
  
  const origError = console.error;
  console.error = (...args) => {
    const str = args.join(' ');
    if (/read.only|frozen|extensible|SyntaxError|TypeError/i.test(str)) return;
    origError.apply(console, args);
  };

  const nukeOverlays = () => {
    const dangerous = document.querySelectorAll(
      '#react-error-overlay, [class*="error"], [class*="Error"], .sp-error, [style*="position: fixed"][style*="z-index"]'
    );
    dangerous.forEach(el => {
      if (el.id === 'root' || el.closest('#root')) return;
      try { el.remove(); } catch { (el as HTMLElement).style.display = 'none'; }
    });
  };

  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      m.addedNodes.forEach(node => {
        if (node.nodeType === 1) {
          const el = node as HTMLElement;
          const isOverlay = el.id?.includes('error') || 
                           el.className?.toString().includes('error') ||
                           el.style?.position === 'fixed';
          if (isOverlay && el.id !== 'root') {
            try { el.remove(); } catch { el.style.display = 'none'; }
          }
        }
      });
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  nukeOverlays();
  setInterval(nukeOverlays, 100);
})();

const root = createRoot(document.getElementById("root")!);
root.render(<App />);`,
        hidden: true,
      },
      '/styles/error-silence.css': {
        code: `#react-error-overlay,[class*="error-overlay"],[class*="ErrorOverlay"],
.sp-error,.sp-error-overlay,.sp-error-message,
div[style*="position: fixed"][style*="z-index: 9999"],
div[style*="background-color: red"],div[style*="background: red"] {
  display:none!important;visibility:hidden!important;opacity:0!important;
  pointer-events:none!important;width:0!important;height:0!important;
  position:absolute!important;left:-99999px!important;z-index:-99999!important;
}`,
        hidden: true,
      },
    };
  }, [code, projectFiles]);

  const isCodeView = viewMode === 'code';

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
          recompileMode: 'delayed',
          recompileDelay: isStreaming ? 20000 : 500,
        }}
        customSetup={{
          dependencies: {
            'lucide-react': 'latest',
            'framer-motion': '^11.0.0',
            'clsx': 'latest',
            'tailwind-merge': 'latest',
            'react-router-dom': '^6.30.0',
          },
        }}
      >
        <div className="h-full w-full flex-1 flex flex-col relative" style={{ height: '100%' }}>
          <ErrorDetector onError={onError} isStreaming={isStreaming} />
          <ReadyDetector onReady={onReady} />
          <div className="h-full w-full flex-1 flex flex-row" style={{ height: '100%' }}>
            {/* Code view: File explorer sidebar + editor */}
            {isCodeView && code && (
              <CodeFileExplorer
                code={code}
                activeFileId={activeFileId}
                onFileSelect={handleFileSelect}
              />
            )}

            {/* Main content area */}
            <div className="flex-1 min-w-0 flex flex-col" style={{ height: '100%' }}>
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
                  showInlineErrors={false}
                  wrapContent={true}
                  readOnly={true}
                  style={{ height: '100%', flex: 1 }}
                />
              )}
            </div>
          </div>
        </div>
      </SandpackProvider>
    </div>
  );
});

export function VibecoderPreview({
  code,
  files,
  isStreaming = false,
  onError,
  onReady,
  viewMode = 'preview',
}: VibecoderPreviewProps) {
  // NUCLEAR ERROR SILENCE PROTOCOL - Layer 4: Parent Window Suppression
  useSuppressPreviewNoise(true);

  // 🛡️ SANDPACK UNMOUNT GUARD: Prevent removeChild errors during rapid project switching.
  // When Sandpack unmounts while still injecting scripts, DOM removeChild can throw.
  // We debounce the mount and catch any DOM exceptions during cleanup.
  const [isMounted, setIsMounted] = useState(false);
  const mountTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Small debounce on mount to prevent rapid mount/unmount cycles
    mountTimerRef.current = setTimeout(() => {
      setIsMounted(true);
    }, 50);

    return () => {
      if (mountTimerRef.current) clearTimeout(mountTimerRef.current);
      setIsMounted(false);
      
      // Guard: Clean up any orphaned Sandpack iframes to prevent removeChild errors
      try {
        const container = containerRef.current;
        if (container) {
          const iframes = container.querySelectorAll('iframe');
          iframes.forEach(iframe => {
            try {
              iframe.src = 'about:blank';
              iframe.remove();
            } catch {
              // Node already removed - safe to ignore
            }
          });
        }
      } catch {
        // DOM already cleaned up - safe to ignore
      }
    };
  }, [code, files]);

  return (
    <div ref={containerRef} className="h-full w-full relative bg-background flex flex-col">
      <style>{SANDPACK_HEIGHT_FIX}</style>
      <div className="h-full w-full flex-1 min-h-0">
        {isMounted ? (
          <SandpackRenderer
            code={code}
            projectFiles={files}
            onError={onError}
            onReady={onReady}
            viewMode={viewMode}
            isStreaming={isStreaming}
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-background">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
