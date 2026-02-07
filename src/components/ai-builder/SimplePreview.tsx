import { useRef, useEffect, useState, memo } from 'react';
import { Loader2, AlertTriangle, Zap, ChevronDown, ChevronUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import sellspayLogo from '@/assets/sellspay-s-logo-new.png';

interface SimplePreviewProps {
  code: string;
  isLoading?: boolean;
  onError?: (error: string) => void;
  onFixError?: (error: string) => void;
  showPlaceholder?: boolean;
  projectId?: string | null; // For project-scoped error validation
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
  showPlaceholder = false,
  projectId = null, // Project-scoped error validation
}: SimplePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isFixing, setIsFixing] = useState(false);
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  const [isPreviewReady, setIsPreviewReady] = useState(false);
  const loadingTimeoutRef = useRef<number | null>(null);
  const fixingRef = useRef(false); // Track fixing state without re-renders
  const runIdRef = useRef<string>(''); // Scope postMessage events to the current render
  const projectIdRef = useRef<string | null>(projectId); // Track which project this render belongs to
  
  // Update projectIdRef when prop changes
  useEffect(() => {
    projectIdRef.current = projectId;
  }, [projectId]);
  
  // Clear error state when project changes (prevent cross-project error bleeding)
  useEffect(() => {
    setPreviewError(null);
    setIsFixing(false);
    fixingRef.current = false;
  }, [projectId]);
  
  // Handle auto-fix - clears error and enters "fixing" mode
  const handleFixError = () => {
    if (previewError && onFixError) {
      fixingRef.current = true;
      setIsFixing(true);
      setPreviewError(null); // Clear the error immediately when fixing starts
      onFixError(previewError);
    }
  };
  
  // Reset fixing state when new code arrives (not on error change)
  useEffect(() => {
    // When code changes, we exit fixing mode since new code was generated
    fixingRef.current = false;
    setIsFixing(false);
  }, [code]);
  
  // Check if we should show placeholder (default code or empty)
  const isDefaultCode = code.includes('Welcome to Vibecoder') || !code.trim();
  
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!iframeRef.current || !code) return;

    // New render scope: prevents late postMessage events from older code/projects
    const runId = crypto.randomUUID();
    runIdRef.current = runId;

    // Hold loading state briefly, but force-show iframe after 3s max to prevent stuck states
    setIsPreviewReady(false);
    
    // Clear any existing timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    
    // Safety net: force show preview after 3 seconds even if no 'preview-ready' message
    loadingTimeoutRef.current = window.setTimeout(() => {
      setIsPreviewReady(true);
    }, 3000);

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

    // If the generated file isn't wrapped in App(), try to find a reasonable fallback component.
    // This prevents the whole preview from hard-crashing on "No App component found".
    const fallbackComponentName = (() => {
      const functionMatches = Array.from(safeCode.matchAll(/\bfunction\s+([A-Z][A-Za-z0-9_]*)\s*\(/g)).map(m => m[1]);
      const constMatches = Array.from(safeCode.matchAll(/\bconst\s+([A-Z][A-Za-z0-9_]*)\s*=\s*(?:\(|function\b)/g)).map(m => m[1]);
      const candidates = [...functionMatches, ...constMatches].filter(n => n && n !== 'App');
      return candidates[candidates.length - 1] || null;
    })();
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
     const __RUN_ID__ = "${runId}";
     const __FALLBACK_COMPONENT__ = ${fallbackComponentName ? JSON.stringify(fallbackComponentName) : 'null'};
     const reportError = (payload) => {
       try {
         window.parent.postMessage({ ...payload, runId: __RUN_ID__ }, '*');
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
      // Make common React APIs available even when imports are stripped.
      // This prevents "useState is not defined" and similar runtime crashes.
      const {
        useState,
        useEffect,
        useMemo,
        useCallback,
        useRef,
        useReducer,
        useLayoutEffect,
        useContext,
        Fragment,
        createElement,
      } = React;

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
      
      // === MOCK HOOKS AND COMPONENTS ===
      
      // Mock useSellsPayCheckout hook
      const useSellsPayCheckout = () => ({
        buyProduct: (id) => console.log('[SellsPay] Buy product:', id),
        isProcessing: false,
        error: null,
      });
      
       // Mock framer-motion (simplified passthrough)
       const motion = new Proxy({}, {
         get: (_, prop) => {
           return React.forwardRef((props, ref) => {
             const { children, initial, animate, exit, transition, whileHover, whileTap, variants, ...rest } = props;
             return React.createElement(String(prop), { ...rest, ref }, children);
           });
         }
       });

       // Minimal framer-motion hook stubs (prevents ReferenceError like "useScroll is not defined")
       const __motionValue = (initial = 0) => {
         let v = initial;
         const subs = new Set();
         return {
           get: () => v,
           set: (next) => { v = next; subs.forEach((fn) => { try { fn(v); } catch {} }); },
           on: (_evt, fn) => { subs.add(fn); return () => subs.delete(fn); },
           onChange: (fn) => { subs.add(fn); return () => subs.delete(fn); },
         };
       };
       const useMotionValue = (v = 0) => __motionValue(v);
       const useSpring = (value) => value;
       const useTransform = (_value, _input, output) => {
         const first = Array.isArray(output) ? output[0] : 0;
         return __motionValue(typeof first === 'number' ? first : 0);
       };
       const useScroll = () => ({ scrollY: __motionValue(0), scrollYProgress: __motionValue(0) });

       // Mock AnimatePresence (passthrough)
       const AnimatePresence = ({ children }) => children;

      
      // Mock Lucide icons (simplified)
      const createIconComponent = (name) => ({ size = 24, className = '', ...props }) => 
        React.createElement('svg', {
          xmlns: 'http://www.w3.org/2000/svg',
          width: size,
          height: size,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 2,
          className: className,
          'data-icon': name,
          ...props
        }, React.createElement('circle', { cx: 12, cy: 12, r: 10 }));
      
      // Common Lucide icons
      const ChevronDown = createIconComponent('ChevronDown');
      const ChevronUp = createIconComponent('ChevronUp');
      const ChevronLeft = createIconComponent('ChevronLeft');
      const ChevronRight = createIconComponent('ChevronRight');
      const ArrowRight = createIconComponent('ArrowRight');
      const ArrowLeft = createIconComponent('ArrowLeft');
      const Star = createIconComponent('Star');
      const Heart = createIconComponent('Heart');
      const ShoppingCart = createIconComponent('ShoppingCart');
      const Play = createIconComponent('Play');
      const Pause = createIconComponent('Pause');
      const Check = createIconComponent('Check');
      const X = createIconComponent('X');
      const Menu = createIconComponent('Menu');
      const Search = createIconComponent('Search');
      const User = createIconComponent('User');
      const Settings = createIconComponent('Settings');
      const Sparkles = createIconComponent('Sparkles');
      const Zap = createIconComponent('Zap');
      const Crown = createIconComponent('Crown');
      const Diamond = createIconComponent('Diamond');
      const Music = createIconComponent('Music');
      const Video = createIconComponent('Video');
      const Image = createIconComponent('Image');
      const Download = createIconComponent('Download');
      const Upload = createIconComponent('Upload');
      const Share = createIconComponent('Share');
      const Clock = createIconComponent('Clock');
      const Calendar = createIconComponent('Calendar');
      const Eye = createIconComponent('Eye');
      const Package = createIconComponent('Package');
      const Gift = createIconComponent('Gift');
      const Award = createIconComponent('Award');
      const TrendingUp = createIconComponent('TrendingUp');
      const Flame = createIconComponent('Flame');
      const Target = createIconComponent('Target');
      const Headphones = createIconComponent('Headphones');
      const Camera = createIconComponent('Camera');
      const Mic = createIconComponent('Mic');
      const Volume2 = createIconComponent('Volume2');
      const Film = createIconComponent('Film');
      const Palette = createIconComponent('Palette');
      const Layers = createIconComponent('Layers');
      const Grid = createIconComponent('Grid');
      const List = createIconComponent('List');
      const Filter = createIconComponent('Filter');
      const Plus = createIconComponent('Plus');
      const Minus = createIconComponent('Minus');
      const ExternalLink = createIconComponent('ExternalLink');
      const MapPin = createIconComponent('MapPin');
      const Mail = createIconComponent('Mail');
      const Phone = createIconComponent('Phone');
      const Globe = createIconComponent('Globe');
      const Shield = createIconComponent('Shield');
      const Lock = createIconComponent('Lock');
      const Unlock = createIconComponent('Unlock');
      const CreditCard = createIconComponent('CreditCard');
      const DollarSign = createIconComponent('DollarSign');
      const Percent = createIconComponent('Percent');
      const Tag = createIconComponent('Tag');
      const Bookmark = createIconComponent('Bookmark');
      const Bell = createIconComponent('Bell');
      const Info = createIconComponent('Info');
      const AlertCircle = createIconComponent('AlertCircle');
      const CheckCircle = createIconComponent('CheckCircle');
      const XCircle = createIconComponent('XCircle');
      const HelpCircle = createIconComponent('HelpCircle');
      const RefreshCw = createIconComponent('RefreshCw');
      const RotateCw = createIconComponent('RotateCw');
      const Loader2 = createIconComponent('Loader2');
      const MoreHorizontal = createIconComponent('MoreHorizontal');
      const MoreVertical = createIconComponent('MoreVertical');
      const Move = createIconComponent('Move');
      const Maximize = createIconComponent('Maximize');
      const Minimize = createIconComponent('Minimize');
      const Shuffle = createIconComponent('Shuffle');
      const Repeat = createIconComponent('Repeat');
      const SkipBack = createIconComponent('SkipBack');
      const SkipForward = createIconComponent('SkipForward');
      const Volume = createIconComponent('Volume');
      const VolumeX = createIconComponent('VolumeX');
      const Disc = createIconComponent('Disc');
      const Radio = createIconComponent('Radio');
      const Tv = createIconComponent('Tv');
      const Monitor = createIconComponent('Monitor');
      const Smartphone = createIconComponent('Smartphone');
      const Tablet = createIconComponent('Tablet');
      const Laptop = createIconComponent('Laptop');
      const Watch = createIconComponent('Watch');
      const Home = createIconComponent('Home');
      const Store = createIconComponent('Store');
      const Users = createIconComponent('Users');
      const LogIn = createIconComponent('LogIn');
      const LogOut = createIconComponent('LogOut');
      const Footprints = createIconComponent('Footprints');
      const Activity = createIconComponent('Activity');
      const Truck = createIconComponent('Truck');
      const Box = createIconComponent('Box');
      
      // === END MOCKS ===
      
       // User's generated code (sanitized)
       ${safeCode}

       // Choose what to render:
       // 1) App (preferred)
       // 2) Fallback component (best-effort) if the builder forgot the App wrapper
       let RootComponent = (typeof App === 'function') ? App : null;
       if (!RootComponent && __FALLBACK_COMPONENT__) {
         try {
           const maybe = eval(__FALLBACK_COMPONENT__);
           if (typeof maybe === 'function') RootComponent = maybe;
         } catch (e) {
           // ignore
         }
       }

       if (typeof RootComponent !== 'function') {
         throw new Error(
           'No App component found. Expected function App() (or export default function App()).' +
           (__FALLBACK_COMPONENT__ ? ' Also tried fallback: ' + __FALLBACK_COMPONENT__ : '')
         );
       }

       // Render the root component
       const root = ReactDOM.createRoot(document.getElementById('root'));
       root.render(React.createElement(RootComponent));
      
       // Signal success after successful render (Phase 2: Preview Ready)
       setTimeout(() => {
         window.parent.postMessage({ type: 'preview-ready', runId: __RUN_ID__ }, '*');
       }, 100);
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
         fullDetails: stack || message,
         runId: __RUN_ID__,
       }, '*');
    }
  <\/script>
</body>
</html>`;
    
    // Write to iframe - simple, no mutation observer conflicts
    iframeRef.current.srcdoc = html;
  }, [code, onError]);
  
  // Listen for error messages from iframe - now captures structured payloads
  // IMPORTANT: Suppresses errors during fixing mode to prevent UI spam
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data) return;

      // Ignore stale events from previous iframe renders/projects
      if ((data.type === 'preview-ready' || data.type === 'preview-error') && data.runId !== runIdRef.current) {
        return;
      }

      if (data.type === 'preview-ready') {
        // Clear the safety timeout since we got a real success signal
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
          loadingTimeoutRef.current = null;
        }
        setIsPreviewReady(true);
        return;
      }

      if (data.type === 'preview-error') {
        // If we're currently fixing, don't show new errors (they're expected while rebuilding)
        if (fixingRef.current || isFixing) {
          console.log('[Preview] Suppressing error during fix mode');
          return;
        }

        // Build a rich error string that includes stack trace when available
        const errorDetails = data.fullDetails || data.stack || data.error;
        const source = data.source ? `[${data.source}]` : '';
        const location = data.line ? ` at line ${data.line}${data.col ? ':' + data.col : ''}` : '';

        const fullError = `${source}${location} ${errorDetails}`.trim();

        setPreviewError(fullError);
        if (onError) {
          onError(fullError);
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onError, isFixing]);
  
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
  
  // NOTE: We intentionally do NOT replace the preview with a full-screen error page.
  // Preview stays mounted so you can still see the last render (or the iframe's own error display).
  // We surface errors as a small, dismissible popup instead.

  return (
    <div className="h-full w-full relative bg-background flex flex-col">
      {/* Loading overlay - only for explicit isLoading, NOT for preview ready state */}
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

      {/* Fixing popup (non-blocking) */}
      {isFixing && !isLoading && (
        <div className="absolute bottom-4 right-4 z-20 w-[420px] max-w-[calc(100%-2rem)]">
          <div className="rounded-2xl border border-border/60 bg-background/95 backdrop-blur-xl shadow-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-foreground">Fixing error…</div>
                <div className="text-xs text-muted-foreground">AI is repairing the code. Preview stays visible.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Build error popup (dismissible, non-blocking) */}
      {previewError && !isLoading && (
        <div className="absolute bottom-4 right-4 z-20 w-[520px] max-w-[calc(100%-2rem)]">
          <div className="rounded-2xl border border-border/60 bg-background/95 backdrop-blur-xl shadow-2xl">
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-foreground">Build error detected</div>
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewError(null);
                        setShowErrorDetails(false);
                      }}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Dismiss error"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    You can keep browsing the preview. Fix it now, or dismiss this popup.
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {onFixError && (
                      <Button
                        onClick={handleFixError}
                        size="sm"
                        className="h-9 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-violet-500/20"
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        Fix This Now
                      </Button>
                    )}
                    <Button
                      onClick={() => {
                        setPreviewError(null);
                        setShowErrorDetails(false);
                      }}
                      size="sm"
                      variant="outline"
                      className="h-9"
                    >
                      Dismiss
                    </Button>
                  </div>

                  <Collapsible open={showErrorDetails} onOpenChange={setShowErrorDetails}>
                    <div className="mt-3">
                      <CollapsibleTrigger asChild>
                        <button className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                          {showErrorDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          <span>{showErrorDetails ? 'Hide' : 'View'} details</span>
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="mt-2 rounded-xl border border-border/60 bg-muted/30 p-3">
                          <pre className="text-[11px] leading-relaxed text-foreground/80 whitespace-pre-wrap break-words font-mono max-h-40 overflow-auto">
                            {previewError}
                          </pre>
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
