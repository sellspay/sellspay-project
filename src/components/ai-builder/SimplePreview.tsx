import { useRef, useEffect, memo } from 'react';
import { Loader2 } from 'lucide-react';
import sellspayLogo from '@/assets/sellspay-s-logo-new.png';

interface SimplePreviewProps {
  code: string;
  isLoading?: boolean;
  onError?: (error: string) => void;
  showPlaceholder?: boolean;
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
  onError,
  showPlaceholder = false
}: SimplePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // Check if we should show placeholder (default code or empty)
  const isDefaultCode = code.includes('Welcome to Vibecoder') || !code.trim();
  
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
  <script type="text/babel" data-presets="react,typescript">
    try {
      // Simple icon components as SVG (no external dependency)
      const Icon = ({ name, size = 24, className = '' }) => {
        const icons = {
          star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
          heart: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
          shoppingCart: '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>',
          sparkles: '<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>',
          arrowRight: '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
          check: '<polyline points="20 6 9 17 4 12"/>',
          x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
          menu: '<line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>',
          play: '<polygon points="5 3 19 12 5 21 5 3"/>',
          zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
        };
        return (
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width={size} 
            height={size} 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className={className}
            dangerouslySetInnerHTML={{ __html: icons[name] || icons.star }}
          />
        );
      };
      
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
  
  // Vibecoder Ready placeholder for initial state
  if ((showPlaceholder || isDefaultCode) && !isLoading) {
    return (
      <div className="h-full w-full relative bg-background flex flex-col items-center justify-center">
        <div className="flex flex-col items-center text-center animate-fade-in">
          {/* Logo badge */}
          <div className="w-16 h-16 mb-6 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center border border-violet-500/30 shadow-lg shadow-violet-500/10">
            <img src={sellspayLogo} alt="" className="w-10 h-10" />
          </div>
          
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Vibecoder Ready
          </h3>
          <p className="text-muted-foreground text-sm">
            Describe your vision to start building
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-full w-full relative bg-background flex flex-col">
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-10 bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 animate-fade-in">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <span className="text-sm text-muted-foreground">Generating...</span>
          </div>
        </div>
      )}
      
      {/* Preview iframe */}
      <iframe 
        ref={iframeRef}
        className="w-full h-full border-0 bg-background rounded-lg"
        sandbox="allow-scripts"
        title="Preview"
      />
    </div>
  );
});
