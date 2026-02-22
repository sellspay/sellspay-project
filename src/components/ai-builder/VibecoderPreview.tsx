import { useMemo, memo, useEffect, useRef, forwardRef, useState, useCallback } from 'react';
import { 
  SandpackTheme, 
  useSandpack, 
  SandpackProvider, 
  SandpackPreview as SandpackPreviewComponent,
  SandpackCodeEditor,
  useSandpackConsole,
} from '@codesandbox/sandpack-react';
import { VIBECODER_STDLIB } from '@/lib/vibecoder-stdlib';
import type { ViewMode } from './types/generation';
import { useSuppressPreviewNoise } from './hooks/useSuppressPreviewNoise';
import { CodeFileExplorer, type VirtualFile } from './CodeFileExplorer';

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
  /** Callback when console errors are detected (runtime errors, not build errors) */
  onConsoleErrors?: (errors: string[]) => void;
  viewMode?: ViewMode;
  onReady?: () => void;
  /** Active page path from PageNavigator — triggers in-sandbox navigation */
  activePage?: string;
  /** When true, enables click-to-select element picker overlay in the preview */
  visualEditMode?: boolean;
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
  div[style*="position: fixed"][style*="z-index: 9999"]:not([data-vibe-overlay]),
  div[style*="position: fixed"][style*="top: 0"][style*="background"]:not([data-vibe-overlay]) {
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

// Console error detector - captures runtime console.error() calls from inside Sandpack
// and surfaces them to the parent for AI debugging (not just build errors).
const ConsoleErrorDetector = forwardRef<HTMLDivElement, { 
  onConsoleErrors?: (errors: string[]) => void; 
  isStreaming?: boolean;
}>(
  function ConsoleErrorDetector({ onConsoleErrors, isStreaming = false }, ref) {
    const { logs, reset } = useSandpackConsole({ 
      maxMessageCount: 50, 
      showSyntaxError: false,
      resetOnPreviewRestart: true,
    });
    const onConsoleErrorsRef = useRef(onConsoleErrors);
    const lastReportedRef = useRef<string>('');

    useEffect(() => {
      onConsoleErrorsRef.current = onConsoleErrors;
    }, [onConsoleErrors]);

    useEffect(() => {
      if (isStreaming) return;

      // Extract only error-level logs
      const errorLogs = logs
        .filter(log => log.method === 'error')
        .map(log => {
          if (!log.data) return 'Unknown error';
          return log.data
            .map(d => typeof d === 'string' ? d : JSON.stringify(d))
            .join(' ')
            .slice(0, 300); // truncate
        })
        .filter(msg => {
          // Filter out known noise patterns
          if (/cdn\.tailwindcss\.com/i.test(msg)) return false;
          if (/lovable\.js/i.test(msg)) return false;
          if (/MutationRecord/i.test(msg)) return false;
          if (/attributeName.*getter/i.test(msg)) return false;
          if (/col\.csbops\.io/i.test(msg)) return false;
          return true;
        });

      if (errorLogs.length === 0) return;

      // Deduplicate: only report if the set of errors changed
      const key = errorLogs.join('|||');
      if (key === lastReportedRef.current) return;
      lastReportedRef.current = key;

      onConsoleErrorsRef.current?.(errorLogs);
    }, [logs, isStreaming]);

    return <div ref={ref} style={{ display: 'none' }} aria-hidden="true" />;
  }
);
ConsoleErrorDetector.displayName = 'ConsoleErrorDetector';

// Syncs the file explorer selection to Sandpack's active file
function SandpackFileActivator({ activeFileId }: { activeFileId: string | null }) {
  const { sandpack } = useSandpack();
  
  useEffect(() => {
    if (!activeFileId) return;
    // activeFileId is the file path (e.g. "/App.tsx", "/components/Hero.tsx")
    const availableFiles = Object.keys(sandpack.files);
    const targetPath = activeFileId.startsWith('/') ? activeFileId : `/${activeFileId}`;
    if (availableFiles.includes(targetPath)) {
      sandpack.setActiveFile(targetPath);
    }
  }, [activeFileId, sandpack]);

  return null;
}

// Bridge component: posts navigation messages to the Sandpack iframe
function PageNavigationBridge({ activePage }: { activePage?: string }) {
  const prevPageRef = useRef(activePage);
  
  useEffect(() => {
    if (!activePage || activePage === prevPageRef.current) return;
    prevPageRef.current = activePage;
    
    const iframe = document.querySelector('.sp-preview-iframe') as HTMLIFrameElement | null;
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage({ 
        type: 'VIBECODER_PAGE_NAVIGATE', 
        page: activePage.replace(/^\//, '') || 'home'
      }, '*');
    }
  }, [activePage]);
  
  return null;
}
// Visual Edit Injector: sends enable/disable messages to the Sandpack iframe
// to activate the element picker overlay
function VisualEditInjector({ active }: { active: boolean }) {
  useEffect(() => {
    const sendMessage = () => {
      const iframe = document.querySelector('.sp-preview-iframe') as HTMLIFrameElement | null;
      if (!iframe?.contentWindow) return false;
      iframe.contentWindow.postMessage({
        type: 'VIBECODER_VISUAL_EDIT_MODE',
        active,
      }, '*');
      return true;
    };

    // Try immediately, then retry a few times for iframe load timing
    if (!sendMessage()) {
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (sendMessage() || attempts > 10) clearInterval(interval);
      }, 200);
      return () => clearInterval(interval);
    }
  }, [active]);

  return null;
}


const SandpackRenderer = memo(function SandpackRenderer({ 
  code, 
  projectFiles,
  onError,
  onConsoleErrors,
  onReady,
  viewMode = 'preview',
  isStreaming = false,
  activePage,
  visualEditMode = false,
}: { 
  code?: string; 
  projectFiles?: ProjectFiles;
  onError?: (error: string) => void;
  onConsoleErrors?: (errors: string[]) => void;
  onReady?: () => void;
  viewMode?: ViewMode;
  isStreaming?: boolean;
  activePage?: string;
  visualEditMode?: boolean;
}) {
  const [activeFileId, setActiveFileId] = useState<string | null>(null);

  const handleFileSelect = useCallback((file: VirtualFile) => {
    setActiveFileId(file.id);
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
      // Thumbnail capture helper — listens for parent postMessage and captures viewport
      '/utils/capture.ts': {
        code: `// Thumbnail capture script — activated via postMessage from parent
window.addEventListener('message', async (event) => {
  if (event.data?.type !== 'VIBECODER_CAPTURE_REQUEST') return;
  try {
    const hero = document.querySelector('[data-hero="true"]') as HTMLElement | null;
    const target = hero || document.body;
    const rect = hero ? hero.getBoundingClientRect() : { x: 0, y: 0, width: window.innerWidth, height: Math.min(900, document.body.scrollHeight) };
    const canvas = document.createElement('canvas');
    const scale = 0.5; // Half-res for smaller file size
    canvas.width = rect.width * scale;
    canvas.height = rect.height * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // Use SVG foreignObject to render DOM to canvas
    const svgData = '<svg xmlns="http://www.w3.org/2000/svg" width="' + rect.width + '" height="' + rect.height + '">' +
      '<foreignObject width="100%" height="100%">' +
      new XMLSerializer().serializeToString(document.documentElement) +
      '</foreignObject></svg>';
    const img = new Image();
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      ctx.scale(scale, scale);
      ctx.drawImage(img, -rect.x, -rect.y);
      URL.revokeObjectURL(url);
      canvas.toBlob((jpegBlob) => {
        if (!jpegBlob) return;
        jpegBlob.arrayBuffer().then((buffer) => {
          window.parent.postMessage({ type: 'VIBECODER_CAPTURE_RESPONSE', buffer }, '*', [buffer]);
        });
      }, 'image/jpeg', 0.7);
    };
    img.onerror = () => URL.revokeObjectURL(url);
    img.src = url;
  } catch (e) {
    console.warn('Capture failed:', e);
  }
});
export {};`,
        hidden: true,
      },
      '/index.tsx': {
        code: `import "./styles/error-silence.css";
import "./utils/capture";
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

  const isVibeOverlay = (el) => el.hasAttribute && el.hasAttribute('data-vibe-overlay');

  const nukeOverlays = () => {
    const dangerous = document.querySelectorAll(
      '#react-error-overlay, [class*="error"], [class*="Error"], .sp-error, [style*="position: fixed"][style*="z-index"]'
    );
    dangerous.forEach(el => {
      if (el.id === 'root' || el.closest('#root') || isVibeOverlay(el)) return;
      try { el.remove(); } catch { (el as HTMLElement).style.display = 'none'; }
    });
  };

  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      m.addedNodes.forEach(node => {
        if (node.nodeType === 1) {
          const el = node as HTMLElement;
          if (isVibeOverlay(el)) return;
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

// PAGE NAVIGATION BRIDGE: Listen for parent page-switch messages
window.addEventListener('message', (event) => {
  const msg = event.data;
  if (!msg || msg.type !== 'VIBECODER_PAGE_NAVIGATE') return;
  const page = (msg.page || 'home').toLowerCase();
  
  // Strategy 1: Find and click nav buttons/links whose text matches the page name
  const allClickables = document.querySelectorAll('button, a, [role="tab"], [data-tab]');
  for (const el of allClickables) {
    const text = (el.textContent || '').trim().toLowerCase();
    if (text === page || text === page.replace(/-/g, ' ')) {
      (el as HTMLElement).click();
      return;
    }
  }
  
  // Strategy 2: Find elements with data-page or data-section attributes
  const dataEl = document.querySelector('[data-page="' + page + '"], [data-section="' + page + '"], [data-tab="' + page + '"]');
  if (dataEl) {
    (dataEl as HTMLElement).click();
    return;
  }
});

// VISUAL EDIT PICKER: Element selection overlay for design mode
(function() {
  let pickerActive = false;
  let hoverOverlay: HTMLDivElement | null = null;
  let selectedOverlay: HTMLDivElement | null = null;
  let hoverLabel: HTMLDivElement | null = null;
  let lastHoveredEl: Element | null = null;
  let selectedEl: Element | null = null;
  let scrollRaf: number | null = null;

  function onScroll() {
    if (scrollRaf) return;
    scrollRaf = requestAnimationFrame(() => {
      scrollRaf = null;
      if (selectedEl && selectedOverlay && selectedOverlay.style.display !== 'none') {
        positionOverlay(selectedOverlay, selectedEl);
      }
      if (lastHoveredEl && hoverOverlay && hoverOverlay.style.display !== 'none') {
        positionOverlay(hoverOverlay, lastHoveredEl);
        if (hoverLabel) {
          const rect = lastHoveredEl.getBoundingClientRect();
          hoverLabel.style.left = rect.left + 'px';
          hoverLabel.style.top = Math.max(0, rect.top - 22) + 'px';
        }
      }
    });
  }

  function createOverlay(color: string, id: string) {
    const existing = document.getElementById(id);
    if (existing) existing.remove();
    const el = document.createElement('div');
    el.id = id;
    el.setAttribute('data-vibe-overlay', 'true');
    el.style.cssText = 'position:fixed;pointer-events:none;z-index:2147483646;border:2px solid ' + color + ';background:' + color.replace(')', ',0.06)').replace('rgb', 'rgba') + ';transition:all 0.05s ease;display:none;';
    document.body.appendChild(el);
    return el;
  }

  function createLabel() {
    const existing = document.getElementById('vibe-hover-label');
    if (existing) existing.remove();
    const el = document.createElement('div');
    el.id = 'vibe-hover-label';
    el.setAttribute('data-vibe-overlay', 'true');
    el.style.cssText = 'position:fixed;pointer-events:none;z-index:2147483647;background:#2563eb;color:#fff;font-size:11px;font-family:monospace;padding:2px 6px;border-radius:3px;display:none;white-space:nowrap;';
    document.body.appendChild(el);
    return el;
  }

  function positionOverlay(overlay: HTMLDivElement, el: Element) {
    const rect = el.getBoundingClientRect();
    overlay.style.left = rect.left + 'px';
    overlay.style.top = rect.top + 'px';
    overlay.style.width = rect.width + 'px';
    overlay.style.height = rect.height + 'px';
    overlay.style.display = 'block';
  }

  function getElementPath(el: Element): string {
    const parts: string[] = [];
    let current: Element | null = el;
    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();
      if (current.id) selector += '#' + current.id;
      else if (current.className && typeof current.className === 'string') {
        const cls = current.className.trim().split(/\\s+/).slice(0, 2).join('.');
        if (cls) selector += '.' + cls;
      }
      parts.unshift(selector);
      current = current.parentElement;
    }
    return parts.join(' > ');
  }

  function isOverlayElement(el: Element | null): boolean {
    if (!el) return false;
    return el.hasAttribute('data-vibe-overlay') || el.id === 'vibe-hover-overlay' || el.id === 'vibe-selected-overlay' || el.id === 'vibe-hover-label';
  }

  function removeAllOverlays() {
    ['vibe-hover-overlay', 'vibe-selected-overlay', 'vibe-hover-label'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.remove();
    });
    hoverOverlay = null;
    selectedOverlay = null;
    hoverLabel = null;
    lastHoveredEl = null;
    selectedEl = null;
  }

  function handleMouseMove(e: MouseEvent) {
    if (!pickerActive) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el || isOverlayElement(el) || el.id === 'root' || el === document.body || el === document.documentElement) {
      if (hoverOverlay) hoverOverlay.style.display = 'none';
      if (hoverLabel) hoverLabel.style.display = 'none';
      lastHoveredEl = null;
      return;
    }
    if (el === lastHoveredEl) return;
    lastHoveredEl = el;
    if (!hoverOverlay) hoverOverlay = createOverlay('rgb(59,130,246)', 'vibe-hover-overlay');
    if (!hoverLabel) hoverLabel = createLabel();
    positionOverlay(hoverOverlay, el);
    const rect = el.getBoundingClientRect();
    const tagStr = el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\\s+/)[0] : '');
    hoverLabel.textContent = tagStr;
    hoverLabel.style.left = rect.left + 'px';
    hoverLabel.style.top = Math.max(0, rect.top - 22) + 'px';
    hoverLabel.style.display = 'block';
  }

  function handleMouseLeave() {
    if (hoverOverlay) hoverOverlay.style.display = 'none';
    if (hoverLabel) hoverLabel.style.display = 'none';
    lastHoveredEl = null;
  }

  function handleClick(e: MouseEvent) {
    if (!pickerActive) return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el || isOverlayElement(el) || el.id === 'root' || el === document.body || el === document.documentElement) return;
    
    if (!selectedOverlay) selectedOverlay = createOverlay('rgb(249,115,22)', 'vibe-selected-overlay');
    selectedEl = el;
    positionOverlay(selectedOverlay, el);
    selectedOverlay.style.borderWidth = '2px';
    selectedOverlay.style.borderStyle = 'solid';

    const computed = window.getComputedStyle(el);
    window.parent.postMessage({
      type: 'VIBECODER_ELEMENT_SELECTED',
      element: {
        tagName: el.tagName,
        text: (el.textContent || '').trim().slice(0, 100),
        classList: Array.from(el.classList).slice(0, 10),
        id: el.id || undefined,
        styles: {
          color: computed.color,
          backgroundColor: computed.backgroundColor,
          fontSize: computed.fontSize,
          fontWeight: computed.fontWeight,
          padding: computed.padding,
          margin: computed.margin,
          borderRadius: computed.borderRadius,
        },
        path: getElementPath(el),
      }
    }, '*');
  }

  function enablePicker() {
    pickerActive = true;
    document.body.style.cursor = 'crosshair';
    document.addEventListener('mousemove', handleMouseMove, true);
    document.addEventListener('click', handleClick, true);
    document.addEventListener('mouseleave', handleMouseLeave, true);
    window.addEventListener('scroll', onScroll, true);
  }

  function disablePicker() {
    pickerActive = false;
    document.body.style.cursor = '';
    document.removeEventListener('mousemove', handleMouseMove, true);
    document.removeEventListener('click', handleClick, true);
    document.removeEventListener('mouseleave', handleMouseLeave, true);
    window.removeEventListener('scroll', onScroll, true);
    removeAllOverlays();
  }

  // Clean up any leftover overlays on script init
  removeAllOverlays();

  window.addEventListener('message', (event) => {
    const msg = event.data;
    if (!msg || msg.type !== 'VIBECODER_VISUAL_EDIT_MODE') return;
    if (msg.active) enablePicker();
    else disablePicker();
  });
})();

// COLOR EXTRACTION: Deep DOM scan to extract actual colors used in the project
window.addEventListener('message', (event) => {
  const msg = event.data;
  if (!msg || msg.type !== 'VIBECODER_EXTRACT_COLORS') return;

  function rgbToHex(rgb) {
    if (!rgb || rgb === 'transparent' || rgb === 'rgba(0, 0, 0, 0)') return null;
    if (rgb.startsWith('#')) return rgb;
    const match = rgb.match(/[\\d.]+/g);
    if (!match || match.length < 3) return null;
    const hex = '#' + [0,1,2].map(i => Math.round(parseFloat(match[i])).toString(16).padStart(2, '0')).join('');
    return hex === '#000000' && rgb.includes('0, 0, 0') ? '#000000' : hex;
  }

  function luminance(hex) {
    const r = parseInt(hex.slice(1,3),16)/255, g = parseInt(hex.slice(3,5),16)/255, b = parseInt(hex.slice(5,7),16)/255;
    return 0.299*r + 0.587*g + 0.114*b;
  }

  function isNearBlackOrWhite(hex) {
    const l = luminance(hex);
    return l < 0.08 || l > 0.92;
  }

  // Scan all visible elements and collect color usage
  const bgColors = new Map(); // hex -> count
  const fgColors = new Map();
  const borderColors = new Map();
  const allEls = document.querySelectorAll('#root *:not([data-vibe-overlay])');

  for (const el of allEls) {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;
    const cs = window.getComputedStyle(el);

    const bg = rgbToHex(cs.backgroundColor);
    if (bg) bgColors.set(bg, (bgColors.get(bg) || 0) + rect.width * rect.height);

    const fg = rgbToHex(cs.color);
    if (fg) fgColors.set(fg, (fgColors.get(fg) || 0) + 1);

    const bc = rgbToHex(cs.borderTopColor);
    if (bc && cs.borderTopWidth !== '0px') borderColors.set(bc, (borderColors.get(bc) || 0) + 1);
  }

  // Sort by usage
  const sortedBgs = [...bgColors.entries()].sort((a,b) => b[1] - a[1]);
  const sortedFgs = [...fgColors.entries()].sort((a,b) => b[1] - a[1]);
  const sortedBorders = [...borderColors.entries()].sort((a,b) => b[1] - a[1]);

  // Background = largest area bg color
  const pageBg = sortedBgs[0]?.[0] || '#000000';

  // Foreground = most used text color
  const pageFg = sortedFgs[0]?.[0] || '#ffffff';

  // Primary = most used NON-black/white/gray bg color (the accent/brand color)
  const accentBgs = sortedBgs.filter(([hex]) => {
    if (hex === pageBg) return false;
    const l = luminance(hex);
    // Skip near-black and near-white and pure grays
    if (l < 0.05 || l > 0.95) return false;
    const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    const max = Math.max(r,g,b), min = Math.min(r,g,b);
    // Has some saturation (not gray)
    return (max - min) > 15 || !isNearBlackOrWhite(hex);
  });

  // Also check text colors for accent
  const accentFgs = sortedFgs.filter(([hex]) => {
    if (hex === pageFg || hex === pageBg) return false;
    const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    const max = Math.max(r,g,b), min = Math.min(r,g,b);
    return (max - min) > 30;
  });

  const primaryColor = accentBgs[0]?.[0] || accentFgs[0]?.[0] || '#f97316';
  const accentColor = accentFgs[0]?.[0] || accentBgs[1]?.[0] || primaryColor;

  // Card = second most-used bg color that differs from page bg
  const cardBg = sortedBgs.find(([hex]) => hex !== pageBg)?.[0] || pageBg;

  // Secondary bg
  const secondaryBg = sortedBgs.find(([hex]) => hex !== pageBg && hex !== cardBg)?.[0] || cardBg;

  // Muted text = text color that's between fg and bg in luminance
  const mutedFg = sortedFgs.find(([hex]) => {
    if (hex === pageFg) return false;
    const l = luminance(hex);
    const fgL = luminance(pageFg);
    return Math.abs(l - fgL) > 0.1;
  })?.[0] || '#a1a1aa';

  // Card text
  const cardFg = sortedFgs.find(([hex]) => hex !== pageFg)?.[0] || pageFg;

  // Border
  const borderHex = sortedBorders.find(([hex]) => hex !== pageBg && hex !== pageFg)?.[0] || '#27272a';

  // Derive foreground for primary (white on dark, black on light)
  const primaryFg = luminance(primaryColor) > 0.5 ? '#000000' : '#ffffff';
  const accentFg = luminance(accentColor) > 0.5 ? '#000000' : '#ffffff';

  const colors = {
    primary: primaryColor,
    'primary-foreground': primaryFg,
    secondary: secondaryBg,
    'secondary-foreground': pageFg,
    accent: accentColor,
    'accent-foreground': accentFg,
    background: pageBg,
    foreground: pageFg,
    card: cardBg,
    'card-foreground': cardFg !== pageFg ? cardFg : pageFg,
    popover: cardBg,
    'popover-foreground': pageFg,
    muted: secondaryBg,
    'muted-foreground': mutedFg,
    destructive: '#ef4444',
    'destructive-foreground': '#ffffff',
    border: borderHex,
    input: borderHex,
    ring: primaryColor,
    'chart-1': primaryColor,
    'chart-2': accentColor,
    'chart-3': '#06b6d4',
    'chart-4': '#10b981',
    'chart-5': '#f59e0b',
  };

  window.parent.postMessage({ type: 'VIBECODER_COLORS_EXTRACTED', colors }, '*');
});

// LIVE THEME PREVIEW: Apply CSS variables to :root when theme editor changes colors
window.addEventListener('message', (event) => {
  const msg = event.data;
  if (!msg || msg.type !== 'VIBECODER_APPLY_THEME') return;
  const colors = msg.colors;
  if (!colors) return;

  function hexToHSL(hex) {
    const r = parseInt(hex.slice(1,3), 16) / 255;
    const g = parseInt(hex.slice(3,5), 16) / 255;
    const b = parseInt(hex.slice(5,7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break;
        case g: h = ((b - r) / d + 2) * 60; break;
        case b: h = ((r - g) / d + 4) * 60; break;
      }
    }
    return Math.round(h) + ' ' + Math.round(s * 100) + '% ' + Math.round(l * 100) + '%';
  }

  const root = document.documentElement;
  for (const [key, hex] of Object.entries(colors)) {
    if (typeof hex === 'string' && hex.startsWith('#') && hex.length === 7) {
      root.style.setProperty('--' + key, hexToHSL(hex));
    }
  }
});

const root = createRoot(document.getElementById("root")!);
root.render(<App />);`,
        hidden: true,
      },
      '/styles/error-silence.css': {
        code: `#react-error-overlay,[class*="error-overlay"],[class*="ErrorOverlay"],
.sp-error,.sp-error-overlay,.sp-error-message,
div[style*="position: fixed"][style*="z-index: 9999"]:not([data-vibe-overlay]),
div[style*="background-color: red"],div[style*="background: red"] {
  display:none!important;visibility:hidden!important;opacity:0!important;
  pointer-events:none!important;width:0!important;height:0!important;
  position:absolute!important;left:-99999px!important;z-index:-99999!important;
}
[data-vibe-overlay] {
  display:block!important;visibility:visible!important;opacity:1!important;
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
          <ConsoleErrorDetector onConsoleErrors={onConsoleErrors} isStreaming={isStreaming} />
          <ReadyDetector onReady={onReady} />
          <PageNavigationBridge activePage={activePage} />
          <VisualEditInjector active={visualEditMode} />
          {/* File activator: syncs activeFileId to Sandpack's internal state */}
          {isCodeView && <SandpackFileActivator activeFileId={activeFileId} />}
          <div className="h-full w-full flex-1 flex flex-row" style={{ height: '100%' }}>
            {/* Code view: File explorer sidebar + editor */}
            {isCodeView && (code || projectFiles) && (
              <CodeFileExplorer
                code={code}
                projectFiles={projectFiles}
                activeFileId={activeFileId}
                onFileSelect={handleFileSelect}
              />
            )}

            {/* Main content area */}
            <div className="flex-1 min-w-0 flex flex-col" style={{ height: '100%' }}>
              {viewMode === 'preview' || viewMode === 'image' || viewMode === 'video' || viewMode === 'design' ? (
                <SandpackPreviewComponent
                  showOpenInCodeSandbox={false}
                  showRefreshButton={false}
                  showSandpackErrorOverlay={false}
                  style={{ height: '100%', flex: 1 }}
                />
              ) : (
                <SandpackCodeEditor
                  showTabs={false}
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
  onConsoleErrors,
  onReady,
  viewMode = 'preview',
  activePage,
  visualEditMode = false,
}: VibecoderPreviewProps) {
  // NUCLEAR ERROR SILENCE PROTOCOL - Layer 4: Parent Window Suppression
  useSuppressPreviewNoise(true);

  // 🛡️ SANDPACK UNMOUNT GUARD: Prevent removeChild errors during rapid project switching.
  // When Sandpack unmounts while still injecting scripts, DOM removeChild can throw.
  // We debounce the mount and catch any DOM exceptions during cleanup.
  const [isMounted, setIsMounted] = useState(false);
  const mountTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // Track the initial mount key — only remount on TRUE identity changes (not code updates)
  const mountKeyRef = useRef(0);

  // 🔗 NAVIGATION BRIDGE: Listen for postMessage navigation from Sandpack iframe
  useEffect(() => {
    const onNavMessage = (event: MessageEvent) => {
      const msg = event.data;
      if (!msg || msg.type !== 'VIBECODER_NAVIGATE') return;
      if (typeof msg.url !== 'string') return;
      const target = msg.target === '_blank' ? '_blank' : '_self';
      window.open(msg.url, target, target === '_blank' ? 'noopener,noreferrer' : '');
    };
    window.addEventListener('message', onNavMessage);
    return () => window.removeEventListener('message', onNavMessage);
  }, []);

  // Mount once on initial render; do NOT remount when code/files change during streaming.
  // Sandpack's internal file system handles hot-updates — remounting destroys the iframe.
  useEffect(() => {
    mountKeyRef.current += 1;
    const currentKey = mountKeyRef.current;

    mountTimerRef.current = setTimeout(() => {
      if (mountKeyRef.current === currentKey) {
        setIsMounted(true);
      }
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
  }, []); // ← empty deps: mount once, never remount on code changes

  return (
    <div ref={containerRef} className="h-full w-full relative bg-background flex flex-col">
      <style>{SANDPACK_HEIGHT_FIX}</style>
      <div className="h-full w-full flex-1 min-h-0">
        {isMounted ? (
          <SandpackRenderer
            code={code}
            projectFiles={files}
            onError={onError}
            onConsoleErrors={onConsoleErrors}
            onReady={onReady}
            viewMode={viewMode}
            isStreaming={isStreaming}
            activePage={activePage}
            visualEditMode={visualEditMode}
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
