import { useMemo, memo, useState, useEffect } from 'react';
import { Sandpack, SandpackTheme } from '@codesandbox/sandpack-react';
import { Loader2, Terminal, CheckCircle2 } from 'lucide-react';

interface VibecoderPreviewProps {
  code: string;
  isStreaming?: boolean;
}

// Storefront-specific build steps for the loading overlay
const BUILD_STEPS = [
  "Analyzing store brand identity...",
  "Structuring storefront layout...",
  "Designing product grids...",
  "Polishing typography & colors...",
  "Injecting conversion elements...",
  "Finalizing store preview..."
];

// Build Overlay - The "Hacker Terminal" that hides the ugly streaming
function BuildOverlay({ currentStep }: { currentStep: number }) {
  return (
    <div className="absolute inset-0 z-20 bg-zinc-950/95 backdrop-blur-md flex items-center justify-center">
      <div className="w-full max-w-md p-8">
        {/* Spinner with glow effect */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-violet-500/20 blur-xl rounded-full" />
            <div className="relative p-4 bg-zinc-900 border border-zinc-800 rounded-2xl">
              <Terminal className="w-8 h-8 text-violet-400 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Steps List */}
        <div className="space-y-3 font-mono text-sm">
          {BUILD_STEPS.map((step, idx) => {
            const isCompleted = idx < currentStep;
            const isCurrent = idx === currentStep;
            
            return (
              <div 
                key={step}
                className={`flex items-center gap-3 transition-all duration-300 ${
                  isCompleted ? 'text-emerald-400' : 
                  isCurrent ? 'text-violet-400' : 
                  'text-zinc-600'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
                ) : (
                  <div className="w-4 h-4 shrink-0 rounded-full border border-zinc-700" />
                )}
                <span className={isCurrent ? 'animate-pulse' : ''}>{step}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

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

// Memoized Sandpack component to prevent unnecessary re-renders during streaming
const SandpackRenderer = memo(function SandpackRenderer({ code }: { code: string }) {
  // Wrap the code in proper structure
  const files = useMemo(() => ({
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
    <Sandpack
      template="react-ts"
      theme={customTheme}
      files={files}
      options={{
        externalResources: [
          'https://cdn.tailwindcss.com',
        ],
        showNavigator: false,
        showLineNumbers: true,
        showTabs: false,
        editorHeight: '100%',
        classes: {
          'sp-wrapper': 'h-full !rounded-none !border-0',
          'sp-layout': 'h-full !rounded-none !border-0 !bg-transparent',
          'sp-stack': 'h-full',
          'sp-editor': 'h-full',
          'sp-preview': 'h-full !bg-zinc-950',
          'sp-preview-container': 'h-full',
          'sp-preview-iframe': 'h-full',
        },
        // Only show preview, hide editor
        editorWidthPercentage: 0,
      }}
      customSetup={{
        dependencies: {
          'lucide-react': 'latest',
          'framer-motion': '^11.0.0',
        },
      }}
    />
  );
});

export function VibecoderPreview({ code, isStreaming }: VibecoderPreviewProps) {
  const [loadingStep, setLoadingStep] = useState(0);

  // Cycle through the fake build steps while streaming
  useEffect(() => {
    if (!isStreaming) {
      setLoadingStep(0);
      return;
    }
    const interval = setInterval(() => {
      setLoadingStep(prev => (prev < BUILD_STEPS.length - 1 ? prev + 1 : prev));
    }, 1200); // Change step every 1.2s
    return () => clearInterval(interval);
  }, [isStreaming]);

  return (
    <div className="h-full w-full relative bg-zinc-950">
      {/* The Hacker Terminal Overlay - Only visible when streaming */}
      {isStreaming && <BuildOverlay currentStep={loadingStep} />}

      {/* Sandpack preview - Always rendered, but hidden behind overlay during build */}
      <div className="h-full w-full">
        <SandpackRenderer code={code} />
      </div>
    </div>
  );
}