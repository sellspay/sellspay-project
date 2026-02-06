import { useMemo, memo, useState, useEffect, useRef } from 'react';
import { 
  SandpackTheme, 
  useSandpack, 
  SandpackProvider, 
  SandpackPreview as SandpackPreviewComponent,
  SandpackCodeEditor,
} from '@codesandbox/sandpack-react';
import { Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import sellspayLogo from '@/assets/sellspay-s-logo-new.png';
import { VIBECODER_STDLIB } from '@/lib/vibecoder-stdlib';

interface VibecoderPreviewProps {
  code: string;
  isStreaming?: boolean;
  onError?: (error: string) => void;
  viewMode?: 'preview' | 'code';
}

// Premium loading steps with icons
const LOADING_STEPS = [
  { id: 1, label: "Analyzing your vision...", icon: "🧠" },
  { id: 2, label: "Designing premium layout...", icon: "🎨" },
  { id: 3, label: "Scaffolding React components...", icon: "⚛️" },
  { id: 4, label: "Configuring product displays...", icon: "🛍️" },
  { id: 5, label: "Injecting Tailwind styles...", icon: "💅" },
  { id: 6, label: "Polishing interactions...", icon: "✨" },
];

// Premium "Lovable-style" Loading Overlay with card shuffle animation
function LoadingOverlay({ currentStep }: { currentStep: number }) {
  const step = LOADING_STEPS[currentStep % LOADING_STEPS.length];
  const progress = ((currentStep % LOADING_STEPS.length) + 1) / LOADING_STEPS.length * 100;

  return (
    <div className="absolute inset-0 z-20 bg-zinc-950/90 backdrop-blur-xl flex flex-col items-center justify-center">
      {/* Ambient glow effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Logo with pulsing glow */}
      <motion.div 
        className="relative mb-12"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Glow ring */}
        <div className="absolute -inset-4 bg-gradient-to-r from-violet-500/20 via-blue-500/20 to-violet-500/20 rounded-3xl blur-xl animate-pulse" />
        
        {/* Logo container */}
        <div className="relative p-6 bg-zinc-900/80 border border-zinc-800/50 rounded-2xl backdrop-blur-sm">
          <img 
            src={sellspayLogo} 
            alt="SellsPay" 
            className="w-16 h-16 object-contain"
          />
        </div>

        {/* Orbiting sparkle */}
        <motion.div
          className="absolute -right-2 -top-2"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        >
          <Sparkles className="w-5 h-5 text-violet-400" />
        </motion.div>
      </motion.div>

      {/* The Card Shuffle Animation */}
      <div className="relative h-24 w-80">
        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            initial={{ y: 40, opacity: 0, scale: 0.95, rotateX: -15 }}
            animate={{ y: 0, opacity: 1, scale: 1, rotateX: 0 }}
            exit={{ y: -40, opacity: 0, scale: 0.95, rotateX: 15 }}
            transition={{ 
              duration: 0.5, 
              ease: [0.32, 0.72, 0, 1],
            }}
            className="absolute inset-0"
          >
            {/* Glassmorphism card */}
            <div className="h-full w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-2xl shadow-violet-500/10 flex items-center justify-center gap-4 px-6">
              <span className="text-3xl">{step.icon}</span>
              <span className="text-zinc-200 font-medium tracking-tight">
                {step.label}
              </span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress bar */}
      <div className="mt-10 w-64 h-1 bg-zinc-800/50 rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-gradient-to-r from-violet-500 to-blue-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      {/* Subtle branding */}
      <p className="mt-6 text-xs text-zinc-600 font-medium tracking-wide">
        Powered by Vibecoder AI
      </p>
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

// Error detector component that monitors Sandpack state
function ErrorDetector({ onError }: { onError?: (error: string) => void }) {
  const { sandpack } = useSandpack();
  const lastErrorRef = useRef<string | null>(null);
  
  useEffect(() => {
    // Check for bundler errors
    const bundlerError = sandpack.error?.message;
    
    if (bundlerError && bundlerError !== lastErrorRef.current) {
      lastErrorRef.current = bundlerError;
      onError?.(bundlerError);
    } else if (!bundlerError) {
      lastErrorRef.current = null;
    }
  }, [sandpack.error, onError]);
  
  return null;
}

// Memoized Sandpack component to prevent unnecessary re-renders during streaming
const SandpackRenderer = memo(function SandpackRenderer({ 
  code, 
  onError,
  viewMode = 'preview',
}: { 
  code: string; 
  onError?: (error: string) => void;
  viewMode?: 'preview' | 'code';
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
        <ErrorDetector onError={onError} />
        <div className="h-full w-full flex-1 flex flex-col" style={{ height: '100%' }}>
          {viewMode === 'preview' ? (
            <SandpackPreviewComponent 
              showOpenInCodeSandbox={false}
              showRefreshButton={true}
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
      </SandpackProvider>
    </div>
  );
});

export function VibecoderPreview({ code, isStreaming, onError, viewMode = 'preview' }: VibecoderPreviewProps) {
  const [loadingStep, setLoadingStep] = useState(0);

  // Cycle through the premium build steps while streaming
  useEffect(() => {
    if (!isStreaming) {
      setLoadingStep(0);
      return;
    }
    const interval = setInterval(() => {
      setLoadingStep(prev => prev + 1);
    }, 2000); // Change step every 2 seconds for smoother animation
    return () => clearInterval(interval);
  }, [isStreaming]);

  return (
    <div className="h-full w-full relative bg-zinc-950 flex flex-col">
      {/* Premium Loading Overlay - Only visible when streaming */}
      {isStreaming && <LoadingOverlay currentStep={loadingStep} />}

      {/* Sandpack preview/code - Always rendered, but hidden behind overlay during build */}
      <div className="h-full w-full flex-1">
        <SandpackRenderer code={code} onError={onError} viewMode={viewMode} />
      </div>
    </div>
  );
}
