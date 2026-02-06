import { useMemo, memo, useState, useEffect, useRef, forwardRef } from 'react';
import { 
  SandpackTheme, 
  useSandpack, 
  SandpackProvider, 
  SandpackPreview as SandpackPreviewComponent,
  SandpackCodeEditor,
} from '@codesandbox/sandpack-react';
import { motion } from 'framer-motion';
import sellspayLogo from '@/assets/sellspay-s-logo-new.png';
import heroBg from '@/assets/hero-aurora-bg.jpg';
import { VIBECODER_STDLIB } from '@/lib/vibecoder-stdlib';
import type { ViewMode } from './types/generation';

interface VibecoderPreviewProps {
  code: string;
  isStreaming?: boolean;
  /**
   * When true, forces the premium loading overlay to remain visible.
   * Use this to cover Sandpack's short bundling phase after streaming ends.
   */
  showLoadingOverlay?: boolean;
  onError?: (error: string) => void;
  viewMode?: ViewMode;
  onReady?: () => void; // Called when Sandpack finishes initial bundle
}

// Nuclear CSS fix - forces all Sandpack internal wrappers to fill height
const SANDPACK_HEIGHT_FIX = `
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
  }
  .sp-preview-iframe {
    flex: 1 !important;
    height: 100% !important;
    min-height: 0 !important;
  }
  .sp-code-editor {
    flex: 1 !important;
    height: 100% !important;
  }
  .cm-editor {
    height: 100% !important;
  }
`;

// Premium loading steps - clean text labels
const LOADING_STEPS = [
  "Analyzing your vision...",
  "Designing premium layout...",
  "Scaffolding React components...",
  "Configuring product displays...",
  "Injecting Tailwind styles...",
  "Polishing interactions...",
];

// Premium Loading Overlay - matches PremiumLoadingScreen aesthetic
const LoadingOverlay = forwardRef<HTMLDivElement, { currentStep: number }>(
  function LoadingOverlay({ currentStep }, ref) {
    const stepLabel = LOADING_STEPS[currentStep % LOADING_STEPS.length];
    const progress =
      (((currentStep % LOADING_STEPS.length) + 1) / LOADING_STEPS.length) * 100;

    return (
      <div
        ref={ref}
        className="absolute inset-0 z-20 bg-black flex flex-col items-center justify-center overflow-hidden"
      >
        {/* Background Image - Same as PremiumLoadingScreen */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroBg})` }}
        />

        {/* Subtle overlay for depth */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Animated ambient glow orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-violet-600/10 rounded-full blur-[120px] animate-pulse-slow" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-fuchsia-600/10 rounded-full blur-[120px] animate-pulse-slow [animation-delay:1000ms]" />
        </div>

        {/* MAIN CONTENT */}
        <div className="relative z-10 flex flex-col items-center">
          {/* Pulsing Logo Container */}
          <div className="mb-8 relative">
            {/* Subtle glow behind logo */}
            <div className="absolute inset-0 bg-orange-500/20 blur-2xl rounded-full animate-pulse-slow scale-150" />

            <div className="relative bg-zinc-900/80 backdrop-blur-md border border-white/10 p-5 rounded-2xl shadow-2xl shadow-orange-500/10 animate-pulse">
              <img
                src={sellspayLogo}
                alt="SellsPay"
                className="w-12 h-12 object-contain"
              />
            </div>
          </div>

          {/* Dynamic Status Text */}
          <motion.h2
            key={stepLabel}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="text-xl md:text-2xl font-bold text-white mb-3 tracking-tight text-center"
          >
            {stepLabel}
          </motion.h2>

          {/* Subtext */}
          <p className="text-zinc-400 text-sm mb-8">Building your storefront</p>

          {/* PROGRESS BAR - Same style as PremiumLoadingScreen */}
          <div className="w-64 h-1 bg-zinc-800/50 rounded-full overflow-hidden relative">
            {/* Animated Gradient Bar */}
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-orange-500 via-rose-500 to-orange-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>

          {/* Subtle status indicator */}
          <div className="flex items-center gap-2 mt-6 text-xs text-zinc-500">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span>VibeCoder generating</span>
          </div>
        </div>
      </div>
    );
  }
);
LoadingOverlay.displayName = 'LoadingOverlay';

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
const ErrorDetector = forwardRef<HTMLDivElement, { onError?: (error: string) => void }>(
  function ErrorDetector({ onError }, ref) {
    const { sandpack } = useSandpack();
    const lastErrorRef = useRef<string | null>(null);
    const onErrorRef = useRef(onError);

    // Keep ref in sync to avoid stale closures without causing re-renders
    useEffect(() => {
      onErrorRef.current = onError;
    }, [onError]);

    // Safely extract error message - never mutate the original error object
    // Some browsers lock error objects as read-only
    // CRITICAL: Do this inside the effect to avoid issues with frozen objects
    useEffect(() => {
      // CRITICAL: Never touch or mutate sandpack.error - it may be frozen/read-only.
      // Extract message into a brand new string immediately.
      let safeMessage: string | null = null;

      try {
        if (sandpack.error && typeof sandpack.error === 'object') {
          // Read into local variable - DO NOT assign back to error object
          const rawMsg = sandpack.error.message;
          if (typeof rawMsg === 'string' && rawMsg.length > 0) {
            // Create a completely NEW string - never pass the original reference
            safeMessage = String(rawMsg);
          }
        }
      } catch {
        // If reading throws (frozen object edge case), use a generic fallback
        safeMessage = sandpack.error ? 'Build error occurred' : null;
      }

      // Only report if this is a NEW error (not the same as last time)
      if (safeMessage && safeMessage !== lastErrorRef.current) {
        lastErrorRef.current = safeMessage;
        // Pass brand new string up to parent
        onErrorRef.current?.(safeMessage);
      }

      // Clear ref when error is resolved
      if (!safeMessage && lastErrorRef.current) {
        lastErrorRef.current = null;
      }
    }, [sandpack.error]);

    // Render a tiny node so any injected refs are safe (prevents ref warnings)
    return <div ref={ref} style={{ display: 'none' }} aria-hidden="true" />;
  }
);
ErrorDetector.displayName = 'ErrorDetector';

// Ready detector - fires onReady when Sandpack finishes bundling
const ReadyDetector = forwardRef<HTMLDivElement, { onReady?: () => void }>(
  function ReadyDetector({ onReady }, ref) {
    const { sandpack } = useSandpack();
    const hasCalledReady = useRef(false);

    useEffect(() => {
      // Sandpack status: 'initial' | 'idle' | 'running'
      // 'idle' means bundling is complete
      if (sandpack.status === 'idle' && !hasCalledReady.current) {
        hasCalledReady.current = true;
        onReady?.();
      }
    }, [sandpack.status, onReady]);

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
}: { 
  code: string; 
  onError?: (error: string) => void;
  onReady?: () => void;
  viewMode?: ViewMode;
}) {
  // Wrap the code in proper structure, including the standard library
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
    '/index.tsx': {
      code: `import React from "react";
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
          recompileMode: 'delayed',
          recompileDelay: 500,
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
          <ErrorDetector onError={onError} />
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
                showInlineErrors={true}
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
  isStreaming,
  showLoadingOverlay,
  onError,
  onReady,
  viewMode = 'preview',
}: VibecoderPreviewProps) {
  const [loadingStep, setLoadingStep] = useState(0);

  const isOverlayVisible = Boolean(showLoadingOverlay ?? isStreaming);

  // Cycle through the premium build steps while streaming / bundling
  useEffect(() => {
    if (!isOverlayVisible) {
      setLoadingStep(0);
      return;
    }
    const interval = setInterval(() => {
      setLoadingStep((prev) => prev + 1);
    }, 2000); // Change step every 2 seconds for smoother animation
    return () => clearInterval(interval);
  }, [isOverlayVisible]);

  return (
    <div className="h-full w-full relative bg-zinc-950 flex flex-col">
      {/* Nuclear CSS Fix - Inject global styles to force Sandpack height */}
      <style>{SANDPACK_HEIGHT_FIX}</style>

      {/* Premium Loading Overlay - visible while streaming OR until bundler is ready */}
      {isOverlayVisible && <LoadingOverlay currentStep={loadingStep} />}

      {/* Sandpack preview/code - Always rendered, but hidden behind overlay during build */}
      <div className="h-full w-full flex-1 min-h-0">
        <SandpackRenderer code={code} onError={onError} onReady={onReady} viewMode={viewMode} />
      </div>
    </div>
  );
}
