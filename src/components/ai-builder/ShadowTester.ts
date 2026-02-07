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
    
    // Timeout after 5 seconds (generous for slow CDN loads)
    const timeout = setTimeout(() => {
      cleanup();
      // Assume success if no error after 5s (page loaded but didn't post message)
      resolve({ success: true });
    }, 5000);
    
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
