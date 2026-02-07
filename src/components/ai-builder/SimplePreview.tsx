import { useRef, useEffect, memo } from 'react';
import { Loader2 } from 'lucide-react';

interface SimplePreviewProps {
  code: string;
  isLoading?: boolean;
  onError?: (error: string) => void;
}

/**
 * SimplePreview - Stable iframe-based React preview
 * 
 * Unlike Sandpack, this uses a simple srcdoc approach:
 * - No service workers (no __csb_sw crashes)
 * - No mutation observers inside preview
 * - No DataCloneError bridging issues
 * - Single DOM update per code change
 */
export const SimplePreview = memo(function SimplePreview({ 
  code, 
  isLoading = false,
  onError 
}: SimplePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  useEffect(() => {
    if (!iframeRef.current || !code) return;
    
    // Create a self-contained HTML document with React + Tailwind CDN
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://unpkg.com/lucide-react@0.462.0/dist/umd/lucide-react.min.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #09090b;
      color: #fafafa;
      min-height: 100vh;
    }
    #root { min-height: 100vh; }
    .error-display {
      padding: 24px;
      background: #450a0a;
      border: 1px solid #dc2626;
      border-radius: 8px;
      margin: 24px;
      color: #fca5a5;
      font-family: monospace;
      font-size: 14px;
      white-space: pre-wrap;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" data-presets="react">
    try {
      // Make Lucide icons available globally
      const { 
        Star, Heart, ShoppingCart, User, Menu, X, ChevronRight, ChevronDown,
        Check, Plus, Minus, Search, Bell, Settings, Mail, Phone, MapPin,
        Calendar, Clock, ArrowRight, ArrowLeft, ExternalLink, Download,
        Play, Pause, Volume2, VolumeX, Share2, Copy, Trash2, Edit,
        Eye, EyeOff, Lock, Unlock, AlertCircle, Info, HelpCircle,
        CheckCircle, XCircle, Loader2, RefreshCw, MoreHorizontal, MoreVertical,
        Home, Bookmark, Tag, Filter, Grid, List, Image, Video, FileText,
        Zap, Award, Trophy, Crown, Sparkles, Flame, TrendingUp
      } = lucideReact || {};
      
      // User's generated code
      ${code}
      
      // Render the App component
      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(React.createElement(App));
    } catch (err) {
      // Display error in iframe
      document.getElementById('root').innerHTML = 
        '<div class="error-display"><strong>Runtime Error:</strong>\\n' + 
        (err.message || err) + '</div>';
      
      // Also notify parent window
      window.parent.postMessage({ type: 'preview-error', error: err.message || String(err) }, '*');
    }
  </script>
</body>
</html>`;
    
    // Write to iframe - simple, no mutation observer conflicts
    iframeRef.current.srcdoc = html;
  }, [code]);
  
  // Listen for error messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'preview-error' && onError) {
        onError(event.data.error);
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onError]);
  
  return (
    <div className="h-full w-full relative bg-zinc-950 flex flex-col">
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-10 bg-zinc-950/80 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
            <span className="text-sm text-zinc-400">Generating...</span>
          </div>
        </div>
      )}
      
      {/* Preview iframe */}
      <iframe 
        ref={iframeRef}
        className="w-full h-full border-0 bg-zinc-950"
        sandbox="allow-scripts"
        title="Preview"
      />
    </div>
  );
});
