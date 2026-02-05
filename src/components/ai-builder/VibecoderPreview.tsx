import { useMemo, memo } from 'react';
import { Sandpack, SandpackTheme } from '@codesandbox/sandpack-react';
import { Loader2 } from 'lucide-react';

interface VibecoderPreviewProps {
  code: string;
  isStreaming?: boolean;
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
  return (
    <div className="h-full w-full relative bg-zinc-950">
      {/* Streaming indicator */}
      {isStreaming && (
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2 px-3 py-1.5 bg-violet-500/20 border border-violet-500/30 rounded-full text-violet-400 text-sm backdrop-blur-sm">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Generating...</span>
        </div>
      )}

      {/* Sandpack preview */}
      <div className="h-full w-full">
        <SandpackRenderer code={code} />
      </div>
    </div>
  );
}
