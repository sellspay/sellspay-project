import { useRef, useEffect, useState, memo } from 'react';
import { Loader2, AlertTriangle, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import sellspayLogo from '@/assets/sellspay-s-logo-new.png';

interface SimplePreviewProps {
  code: string;
  isLoading?: boolean;
  onError?: (error: string) => void;
  onFixError?: (error: string) => void;
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
  onFixError,
  showPlaceholder = false
}: SimplePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isFixing, setIsFixing] = useState(false);
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  
  // Handle auto-fix
  const handleFixError = () => {
    if (previewError && onFixError) {
      setIsFixing(true);
      onFixError(previewError);
    }
  };
  
  // Reset fixing state when error changes
  useEffect(() => {
    setIsFixing(false);
  }, [previewError]);
  
  // Check if we should show placeholder (default code or empty)
  const isDefaultCode = code.includes('Welcome to Vibecoder') || !code.trim();
  
  useEffect(() => {
    if (!iframeRef.current || !code) return;
    
    // Reset error state
    setPreviewError(null);

    // Sanitize generated code for iframe execution (no module loader in srcdoc)
    const sanitize = (raw: string) => {
      return raw
        // remove imports (including CSS imports)
        .replace(/^\s*import\s+[\s\S]*?;\s*$/gm, '')
        // remove export default
        .replace(/^\s*export\s+default\s+/gm, '')
        // remove named exports (export const/function/class)
        .replace(/^\s*export\s+(?=(const|function|class)\s)/gm, '')
        // remove export { ... } statements
        .replace(/^\s*export\s*\{[\s\S]*?\}\s*;?\s*$/gm, '')
        // remove "use client" directives
        .replace(/^\s*['\"]use client['\"];?\s*$/gm, '')
        .trim();
    };

    const safeCode = sanitize(code);
    
    // Check for obvious syntax issues before even trying
    const openBraces = (safeCode.match(/\{/g) || []).length;
    const closeBraces = (safeCode.match(/\}/g) || []).length;
    const openParens = (safeCode.match(/\(/g) || []).length;
    const closeParens = (safeCode.match(/\)/g) || []).length;
    
    if (Math.abs(openBraces - closeBraces) > 2 || Math.abs(openParens - closeParens) > 2) {
      const errMsg = `Syntax error: Unbalanced brackets detected (braces: ${openBraces}/${closeBraces}, parens: ${openParens}/${closeParens}). The generated code is incomplete.`;
      setPreviewError(errMsg);
      if (onError) onError(errMsg);
      return;
    }

    // Create a self-contained HTML document with React + Tailwind CDN
    // Added crossorigin="anonymous" to CDN scripts to get real stack traces (not "Script error.")
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Preview</title>
  <script src="https://cdn.tailwindcss.com" crossorigin="anonymous"><\/script>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin="anonymous"><\/script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin="anonymous"><\/script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js" crossorigin="anonymous"><\/script>
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
      word-break: break-word;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script>
    // ═══════════════════════════════════════════════════════════════
    // ENHANCED ERROR CAPTURE - Phase B of bulletproof plan
    // ═══════════════════════════════════════════════════════════════
    // Reports structured error payloads with stack traces to parent
    const reportError = (payload) => {
      try { 
        window.parent.postMessage(payload, '*'); 
      } catch (e) {
        console.error('[Preview] Failed to report error to parent:', e);
      }
    };

    const showError = (title, details) => {
      document.getElementById('root').innerHTML =
        '<div class="error-display"><strong>' + title + ':</strong>\\n' + details + '</div>';
    };

    // Global error handler (synchronous errors)
    window.addEventListener('error', function(event) {
      const error = event.error;
      const message = error?.message || event.message || 'Unknown error';
      const stack = error?.stack || '';
      const source = 'window.onerror';
      const line = event.lineno;
      const col = event.colno;
      
      const details = stack || message;
      showError('Error', details);
      
      reportError({ 
        type: 'preview-error', 
        error: message,
        stack: stack,
        source: source,
        line: line,
        col: col,
        fullDetails: details
      });
      
      event.preventDefault();
      return true;
    }, true);

    // Promise rejection handler (async errors)
    window.addEventListener('unhandledrejection', function(event) {
      const reason = event.reason;
      const message = reason?.message || String(reason) || 'Unhandled promise rejection';
      const stack = reason?.stack || '';
      const source = 'unhandledrejection';
      
      const details = stack || message;
      showError('Error', details);
      
      reportError({ 
        type: 'preview-error', 
        error: message,
        stack: stack,
        source: source,
        fullDetails: details
      });
      
      event.preventDefault();
      return true;
    }, true);
  </script>
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
          search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
          user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
          home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
          chevronRight: '<polyline points="9 18 15 12 9 6"/>',
          chevronLeft: '<polyline points="15 18 9 12 15 6"/>',
          chevronDown: '<polyline points="6 9 12 15 18 9"/>',
          plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
          minus: '<line x1="5" y1="12" x2="19" y2="12"/>',
          settings: '<circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>',
        };
        return React.createElement('svg', {
          xmlns: 'http://www.w3.org/2000/svg',
          width: size,
          height: size,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 2,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          className: className,
          dangerouslySetInnerHTML: { __html: icons[name] || icons.star }
        });
      };
      
      // User's generated code (sanitized)
      ${safeCode}
      
      if (typeof App !== 'function') {
        throw new Error('No App component found. Make sure the generated code defines function App() or const App = () => ...');
      }

      // Render the App component
      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(React.createElement(App));
    } catch (err) {
      // Runtime error during component initialization
      const message = err.message || String(err);
      const stack = err.stack || '';
      
      document.getElementById('root').innerHTML = 
        '<div class="error-display"><strong>Runtime Error:</strong>\\n' + 
        (stack || message) + '</div>';
      
      // Notify parent window with structured payload
      window.parent.postMessage({ 
        type: 'preview-error', 
        error: message,
        stack: stack,
        source: 'runtime-trycatch',
        fullDetails: stack || message
      }, '*');
    }
  <\/script>
</body>
</html>`;
    
    // Write to iframe - simple, no mutation observer conflicts
    iframeRef.current.srcdoc = html;
  }, [code, onError]);
  
  // Listen for error messages from iframe - now captures structured payloads
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'preview-error') {
        // Build a rich error string that includes stack trace when available
        const errorDetails = event.data.fullDetails || event.data.stack || event.data.error;
        const source = event.data.source ? `[${event.data.source}]` : '';
        const location = event.data.line ? ` at line ${event.data.line}${event.data.col ? ':' + event.data.col : ''}` : '';
        
        const fullError = `${source}${location} ${errorDetails}`.trim();
        
        setPreviewError(fullError);
        if (onError) {
          onError(fullError);
        }
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
  
  // Show error state if there's a preview error and not loading
  if (previewError && !isLoading && !isFixing) {
    return (
      <div className="h-full w-full relative bg-background flex flex-col items-center justify-center p-8">
        <div className="max-w-lg w-full">
          {/* Error header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 mb-4 mx-auto rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/30 animate-pulse">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Build Error Detected
            </h3>
            <p className="text-sm text-muted-foreground">
              The generated code has issues. Let AI analyze and fix them automatically.
            </p>
          </div>
          
          {/* Fix button - prominent */}
          {onFixError && (
            <Button
              onClick={handleFixError}
              className="w-full mb-4 h-12 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold shadow-lg shadow-violet-500/25"
            >
              <Zap className="w-5 h-5 mr-2" />
              Fix This Now
            </Button>
          )}
          
          {/* Collapsible error details */}
          <Collapsible open={showErrorDetails} onOpenChange={setShowErrorDetails}>
            <CollapsibleTrigger asChild>
              <button className="w-full flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                {showErrorDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                <span>{showErrorDetails ? 'Hide' : 'View'} Error Details</span>
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 p-4 rounded-lg bg-red-950/50 border border-red-500/30 text-left">
                <pre className="text-xs text-red-300 whitespace-pre-wrap break-words font-mono max-h-40 overflow-auto">
                  {previewError}
                </pre>
              </div>
            </CollapsibleContent>
          </Collapsible>
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
