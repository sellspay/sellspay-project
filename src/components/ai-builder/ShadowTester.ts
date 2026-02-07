/**
 * ShadowTester - Hidden iframe validation for generated code
 * 
 * Tests code in an invisible iframe BEFORE showing to the user.
 * This catches runtime errors that static analysis cannot detect:
 * - ReferenceError: X is not defined
 * - SyntaxError during Babel transpilation
 * - React hook violations
 * - Undefined component errors
 * 
 * Part of the "Zero-Guessing" Architecture (Phase 2)
 */

// Build the same HTML structure as SimplePreview but for testing
function buildTestHtml(code: string): string {
  // Sanitize the code (same logic as SimplePreview)
  const safeCode = code
    .replace(/^\s*import\s+[\s\S]*?;\s*$/gm, '')
    .replace(/^\s*export\s+default\s+/gm, '')
    .replace(/^\s*export\s+(?=(const|function|class)\s)/gm, '')
    .replace(/^\s*export\s*\{[\s\S]*?\}\s*;?\s*$/gm, '')
    .replace(/^\s*['\"]use client['\"];?\s*$/gm, '')
    .trim();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Shadow Test</title>
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
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script>
    // Error capture for shadow testing
    const reportResult = (payload) => {
      try { 
        window.parent.postMessage(payload, '*'); 
      } catch (e) {
        console.error('[ShadowTest] Failed to report:', e);
      }
    };

    window.addEventListener('error', function(event) {
      const error = event.error;
      reportResult({ 
        type: 'shadow-test-error', 
        error: error?.message || event.message || 'Unknown error',
        stack: error?.stack || '',
      });
      event.preventDefault();
      return true;
    }, true);

    window.addEventListener('unhandledrejection', function(event) {
      const reason = event.reason;
      reportResult({ 
        type: 'shadow-test-error', 
        error: reason?.message || String(reason) || 'Unhandled promise rejection',
        stack: reason?.stack || '',
      });
      event.preventDefault();
      return true;
    }, true);
  <\/script>
  <script type="text/babel" data-presets="react,typescript">
    try {
      // Simple icon components (same as SimplePreview)
      const Icon = ({ name, size = 24, className = '' }) => {
        const icons = {
          star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
          heart: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
          shoppingCart: '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>',
          sparkles: '<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>',
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
      
      // === MOCK HOOKS AND COMPONENTS FOR SHADOW TESTING ===
      
      // Mock useSellsPayCheckout hook
      const useSellsPayCheckout = () => ({
        buyProduct: (id) => console.log('[Mock] Buy product:', id),
        isProcessing: false,
        error: null,
      });
      
      // Mock framer-motion (simplified passthrough)
      const motion = new Proxy({}, {
        get: (_, prop) => {
          // Return a component that renders the element with props
          return React.forwardRef((props, ref) => {
            const { children, initial, animate, exit, transition, whileHover, whileTap, variants, ...rest } = props;
            return React.createElement(String(prop), { ...rest, ref }, children);
          });
        }
      });
      
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
      const Wifi = createIconComponent('Wifi');
      const Bluetooth = createIconComponent('Bluetooth');
      const Battery = createIconComponent('Battery');
      const Power = createIconComponent('Power');
      const Sun = createIconComponent('Sun');
      const Moon = createIconComponent('Moon');
      const CloudRain = createIconComponent('CloudRain');
      const Wind = createIconComponent('Wind');
      const Thermometer = createIconComponent('Thermometer');
      const Droplet = createIconComponent('Droplet');
      const Umbrella = createIconComponent('Umbrella');
      const Sunrise = createIconComponent('Sunrise');
      const Sunset = createIconComponent('Sunset');
      const Send = createIconComponent('Send');
      const MessageCircle = createIconComponent('MessageCircle');
      const MessageSquare = createIconComponent('MessageSquare');
      const AtSign = createIconComponent('AtSign');
      const Hash = createIconComponent('Hash');
      const Link = createIconComponent('Link');
      const Paperclip = createIconComponent('Paperclip');
      const File = createIconComponent('File');
      const FileText = createIconComponent('FileText');
      const Folder = createIconComponent('Folder');
      const FolderOpen = createIconComponent('FolderOpen');
      const Trash = createIconComponent('Trash');
      const Trash2 = createIconComponent('Trash2');
      const Edit = createIconComponent('Edit');
      const Edit2 = createIconComponent('Edit2');
      const Edit3 = createIconComponent('Edit3');
      const Scissors = createIconComponent('Scissors');
      const Copy = createIconComponent('Copy');
      const Clipboard = createIconComponent('Clipboard');
      const Save = createIconComponent('Save');
      const Printer = createIconComponent('Printer');
      const Archive = createIconComponent('Archive');
      const Box = createIconComponent('Box');
      const Truck = createIconComponent('Truck');
      const Home = createIconComponent('Home');
      const Building = createIconComponent('Building');
      const Store = createIconComponent('Store');
      const Briefcase = createIconComponent('Briefcase');
      const Users = createIconComponent('Users');
      const UserPlus = createIconComponent('UserPlus');
      const UserMinus = createIconComponent('UserMinus');
      const UserCheck = createIconComponent('UserCheck');
      const UserX = createIconComponent('UserX');
      const LogIn = createIconComponent('LogIn');
      const LogOut = createIconComponent('LogOut');
      const Key = createIconComponent('Key');
      const Footprints = createIconComponent('Footprints');
      const Activity = createIconComponent('Activity');
      const Aperture = createIconComponent('Aperture');
      
      // === END MOCKS ===
      
      // User's generated code
      ${safeCode}
      
      if (typeof App !== 'function') {
        throw new Error('No App component found');
      }

      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(React.createElement(App));
      
      // Signal success after render
      setTimeout(() => {
        window.parent.postMessage({ type: 'shadow-test-ready' }, '*');
      }, 100);
    } catch (err) {
      window.parent.postMessage({ 
        type: 'shadow-test-error', 
        error: err.message || String(err),
        stack: err.stack || '',
      }, '*');
    }
  <\/script>
</body>
</html>`;
}

export interface ShadowTestResult {
  success: boolean;
  error?: string;
  stack?: string;
}

/**
 * Test code in a hidden iframe before showing to user
 * Returns success if the code renders without throwing
 */
export function testCodeInShadow(code: string): Promise<ShadowTestResult> {
  return new Promise((resolve) => {
    // Quick syntax check first (catches 50% of errors instantly)
    const openBraces = (code.match(/{/g) || []).length;
    const closeBraces = (code.match(/}/g) || []).length;
    const openParens = (code.match(/\(/g) || []).length;
    const closeParens = (code.match(/\)/g) || []).length;
    
    if (Math.abs(openBraces - closeBraces) > 2) {
      resolve({
        success: false,
        error: `Unbalanced braces: ${openBraces} open, ${closeBraces} close`,
      });
      return;
    }
    
    if (Math.abs(openParens - closeParens) > 2) {
      resolve({
        success: false,
        error: `Unbalanced parentheses: ${openParens} open, ${closeParens} close`,
      });
      return;
    }

    // Create hidden iframe for runtime test
    const shadowFrame = document.createElement('iframe');
    shadowFrame.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;';
    shadowFrame.sandbox.add('allow-scripts');
    
    let resolved = false;
    
    const cleanup = () => {
      if (!resolved) {
        resolved = true;
        window.removeEventListener('message', handleMessage);
        if (shadowFrame.parentNode) {
          document.body.removeChild(shadowFrame);
        }
      }
    };
    
    // Timeout after 4 seconds (faster feedback loop)
    const timeout = setTimeout(() => {
      cleanup();
      // Timeout without response is a FAILURE (something hung)
      resolve({ 
        success: false, 
        error: 'Shadow test timeout - code may have infinite loop or hung during render'
      });
    }, 4000);
    
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== shadowFrame.contentWindow) return;
      
      if (event.data?.type === 'shadow-test-error') {
        clearTimeout(timeout);
        cleanup();
        resolve({
          success: false,
          error: event.data.error,
          stack: event.data.stack,
        });
      } else if (event.data?.type === 'shadow-test-ready') {
        clearTimeout(timeout);
        cleanup();
        resolve({ success: true });
      }
    };
    
    window.addEventListener('message', handleMessage);
    document.body.appendChild(shadowFrame);
    
    try {
      shadowFrame.srcdoc = buildTestHtml(code);
    } catch (err) {
      clearTimeout(timeout);
      cleanup();
      resolve({
        success: false,
        error: err instanceof Error ? err.message : 'Failed to create shadow frame',
      });
    }
  });
}

/**
 * Silent heal - calls the vibecoder-heal endpoint without user seeing
 */
export async function silentHeal(
  supabaseUrl: string,
  accessToken: string,
  failedCode: string,
  errorMessage: string,
  profileId: string,
): Promise<string | null> {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/vibecoder-heal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        runtimeError: errorMessage,
        failedCode,
        userId: profileId,
      }),
    });
    
    if (!response.ok || !response.body) {
      console.warn('[ShadowTester] Heal request failed:', response.status);
      return null;
    }
    
    // Parse SSE stream to extract healed code
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let healedCode = '';
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      
      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        let line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);
        
        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (!line.startsWith('data: ')) continue;
        
        const jsonStr = line.slice(6).trim();
        if (!jsonStr || jsonStr === '[DONE]') continue;
        
        try {
          const event = JSON.parse(jsonStr);
          if (event.type === 'code' && event.data?.code) {
            healedCode = event.data.code;
          }
        } catch {
          // Partial JSON, wait for more
          buffer = `data: ${jsonStr}\n` + buffer;
          break;
        }
      }
    }
    
    return healedCode || null;
  } catch (err) {
    console.error('[ShadowTester] Silent heal error:', err);
    return null;
  }
}
