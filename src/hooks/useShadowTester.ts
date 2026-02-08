import { useState, useCallback, useRef } from 'react';

/**
 * Shadow Tester: Validate code in a hidden Sandpack before applying to main preview.
 * 
 * This prevents runtime crashes from reaching the user by testing code in an
 * invisible sandbox first. Only if the build succeeds do we apply to the main preview.
 * 
 * Architecture:
 * 1. User edits code or AI generates new code
 * 2. Code is applied to shadow Sandpack (invisible)
 * 3. Wait for build/bundle completion
 * 4. If success → apply to main preview
 * 5. If error → reject code, keep last-known-good, report error
 */

interface ShadowTestResult {
  success: boolean;
  code: string;
  error?: string;
  buildTime?: number;
}

interface UseShadowTesterOptions {
  /** Timeout for shadow build in ms (default: 10000) */
  buildTimeout?: number;
  /** Called when shadow test starts */
  onTestStart?: () => void;
  /** Called when shadow test completes */
  onTestComplete?: (result: ShadowTestResult) => void;
}

/**
 * Hook for shadow testing code before applying to main preview.
 * 
 * NOTE: This is a simplified version that uses syntax checking.
 * Full Sandpack shadow rendering requires a second SandpackProvider
 * which is implemented in the component layer (ShadowSandpack).
 */
export function useShadowTester(options: UseShadowTesterOptions = {}) {
  const { buildTimeout = 10000, onTestStart, onTestComplete } = options;
  
  const [isTesting, setIsTesting] = useState(false);
  const [lastTestResult, setLastTestResult] = useState<ShadowTestResult | null>(null);
  
  const pendingResolveRef = useRef<((result: ShadowTestResult) => void) | null>(null);
  const timeoutRef = useRef<number | null>(null);

  /**
   * Quick syntax validation before shadow test
   * Returns early if code has obvious syntax issues
   */
  const quickSyntaxCheck = useCallback((code: string): { valid: boolean; error?: string } => {
    if (!code || code.trim().length < 20) {
      return { valid: false, error: 'Code too short or empty' };
    }
    
    // Must have an export default
    if (!/export\s+default\s+/.test(code)) {
      return { valid: false, error: 'Missing export default' };
    }
    
    // Must have function App or similar
    if (!/function\s+App\b|const\s+App\s*=/.test(code)) {
      return { valid: false, error: 'Missing App component' };
    }
    
    // Check for balanced braces
    const openBraces = (code.match(/\{/g) || []).length;
    const closeBraces = (code.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
      return { valid: false, error: `Unbalanced braces: ${openBraces} open, ${closeBraces} close` };
    }
    
    // Check for balanced parentheses
    const openParens = (code.match(/\(/g) || []).length;
    const closeParens = (code.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      return { valid: false, error: `Unbalanced parentheses: ${openParens} open, ${closeParens} close` };
    }
    
    // Check for balanced brackets
    const openBrackets = (code.match(/\[/g) || []).length;
    const closeBrackets = (code.match(/\]/g) || []).length;
    if (openBrackets !== closeBrackets) {
      return { valid: false, error: `Unbalanced brackets: ${openBrackets} open, ${closeBrackets} close` };
    }
    
    // Check for unterminated strings (basic check)
    const singleQuotes = (code.match(/'/g) || []).length;
    const doubleQuotes = (code.match(/"/g) || []).length;
    const backticks = (code.match(/`/g) || []).length;
    
    // These should be even (each string has open + close)
    if (backticks % 2 !== 0) {
      return { valid: false, error: 'Unterminated template literal (backtick)' };
    }
    
    // Check for common JSX issues
    if (code.includes('<') && !code.includes('>')) {
      return { valid: false, error: 'Unterminated JSX tag' };
    }
    
    return { valid: true };
  }, []);

  /**
   * Test code in shadow sandbox
   * Returns a promise that resolves with the test result
   */
  const testCode = useCallback((code: string): Promise<ShadowTestResult> => {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      setIsTesting(true);
      onTestStart?.();
      
      // Quick syntax check first
      const syntaxResult = quickSyntaxCheck(code);
      if (!syntaxResult.valid) {
        const result: ShadowTestResult = {
          success: false,
          code,
          error: syntaxResult.error,
          buildTime: Date.now() - startTime,
        };
        setIsTesting(false);
        setLastTestResult(result);
        onTestComplete?.(result);
        resolve(result);
        return;
      }
      
      // For now, syntax check is our "shadow test"
      // In full implementation, this would render in a hidden Sandpack
      // and wait for the bundler to complete
      
      // Simulate build delay (Sandpack typically takes 500-2000ms)
      const buildDelay = 100; // Minimal delay for syntax check
      
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = window.setTimeout(() => {
        const result: ShadowTestResult = {
          success: true,
          code,
          buildTime: Date.now() - startTime,
        };
        
        setIsTesting(false);
        setLastTestResult(result);
        onTestComplete?.(result);
        resolve(result);
      }, buildDelay);
    });
  }, [quickSyntaxCheck, onTestStart, onTestComplete]);

  /**
   * Notify that shadow Sandpack reported build success
   * (Called from ShadowSandpack component)
   */
  const onShadowBuildSuccess = useCallback((code: string) => {
    if (pendingResolveRef.current) {
      pendingResolveRef.current({
        success: true,
        code,
      });
      pendingResolveRef.current = null;
    }
    setIsTesting(false);
  }, []);

  /**
   * Notify that shadow Sandpack reported build error
   * (Called from ShadowSandpack component)
   */
  const onShadowBuildError = useCallback((code: string, error: string) => {
    if (pendingResolveRef.current) {
      pendingResolveRef.current({
        success: false,
        code,
        error,
      });
      pendingResolveRef.current = null;
    }
    setIsTesting(false);
  }, []);

  /**
   * Cancel any pending shadow test
   */
  const cancelTest = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (pendingResolveRef.current) {
      pendingResolveRef.current({
        success: false,
        code: '',
        error: 'Test cancelled',
      });
      pendingResolveRef.current = null;
    }
    setIsTesting(false);
  }, []);

  return {
    // State
    isTesting,
    lastTestResult,
    
    // Actions
    testCode,
    cancelTest,
    
    // Callbacks for ShadowSandpack component
    onShadowBuildSuccess,
    onShadowBuildError,
    
    // Utilities
    quickSyntaxCheck,
  };
}

/**
 * Validates that code is safe to render in Sandpack
 * This is a standalone function that can be used without the hook
 */
export function validateCodeForPreview(code: string): { valid: boolean; error?: string } {
  if (!code || code.trim().length < 20) {
    return { valid: false, error: 'Code too short or empty' };
  }
  
  // Must have an export default
  if (!/export\s+default\s+/.test(code)) {
    return { valid: false, error: 'Missing export default' };
  }
  
  // Must have function App or similar
  if (!/function\s+App\b|const\s+App\s*=/.test(code)) {
    return { valid: false, error: 'Missing App component' };
  }
  
  // Check for balanced braces
  const openBraces = (code.match(/\{/g) || []).length;
  const closeBraces = (code.match(/\}/g) || []).length;
  if (openBraces !== closeBraces) {
    return { valid: false, error: `Unbalanced braces` };
  }
  
  // Check for balanced parentheses
  const openParens = (code.match(/\(/g) || []).length;
  const closeParens = (code.match(/\)/g) || []).length;
  if (openParens !== closeParens) {
    return { valid: false, error: `Unbalanced parentheses` };
  }
  
  return { valid: true };
}
