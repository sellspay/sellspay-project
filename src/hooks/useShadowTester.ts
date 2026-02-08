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
   * Enhanced for Multi-Agent Pipeline with completion sentinel awareness
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
    
    // Check for balanced braces (string-aware)
    const braceBalance = checkBraceBalance(code);
    if (!braceBalance.valid) {
      return braceBalance;
    }
    
    // Check for unterminated strings (enhanced)
    const stringCheck = checkStringTermination(code);
    if (!stringCheck.valid) {
      return stringCheck;
    }
    
    // Check for common JSX issues
    if (code.includes('<') && !code.includes('>')) {
      return { valid: false, error: 'Unterminated JSX tag' };
    }
    
    // Check for trailing operators (truncation symptom)
    const trimmed = code.trim();
    const lastChar = trimmed.slice(-1);
    const truncationChars = ['<', '{', '(', '[', ',', ':', '=', '.', '+', '-', '*', '/'];
    if (truncationChars.includes(lastChar)) {
      return { valid: false, error: `Code ends with incomplete character: ${lastChar}` };
    }
    
    return { valid: true };
  }, []);

  /**
   * Check brace balance while respecting strings and comments
   */
  const checkBraceBalance = (code: string): { valid: boolean; error?: string } => {
    let braces = 0;
    let parens = 0;
    let brackets = 0;
    
    let inSingle = false;
    let inDouble = false;
    let inTemplate = false;
    let inLineComment = false;
    let inBlockComment = false;
    let escaped = false;
    
    for (let i = 0; i < code.length; i++) {
      const c = code[i];
      const n = code[i + 1];
      
      if (inLineComment) {
        if (c === '\n') inLineComment = false;
        continue;
      }
      
      if (inBlockComment) {
        if (c === '*' && n === '/') {
          inBlockComment = false;
          i++;
        }
        continue;
      }
      
      if (inSingle || inDouble || inTemplate) {
        if (escaped) {
          escaped = false;
          continue;
        }
        if (c === '\\') {
          escaped = true;
          continue;
        }
        if (inSingle && c === "'") inSingle = false;
        else if (inDouble && c === '"') inDouble = false;
        else if (inTemplate && c === '`') inTemplate = false;
        continue;
      }
      
      if (c === '/' && n === '/') { inLineComment = true; i++; continue; }
      if (c === '/' && n === '*') { inBlockComment = true; i++; continue; }
      if (c === "'") { inSingle = true; continue; }
      if (c === '"') { inDouble = true; continue; }
      if (c === '`') { inTemplate = true; continue; }
      
      if (c === '{') braces++;
      else if (c === '}') braces--;
      else if (c === '(') parens++;
      else if (c === ')') parens--;
      else if (c === '[') brackets++;
      else if (c === ']') brackets--;
      
      if (braces < 0) return { valid: false, error: 'Extra closing brace }' };
      if (parens < 0) return { valid: false, error: 'Extra closing parenthesis )' };
      if (brackets < 0) return { valid: false, error: 'Extra closing bracket ]' };
    }
    
    // Check for unterminated strings
    if (inSingle || inDouble || inTemplate) {
      return { valid: false, error: 'Unterminated string literal' };
    }
    
    if (braces !== 0) return { valid: false, error: `Unbalanced braces: ${braces > 0 ? braces + ' unclosed' : Math.abs(braces) + ' extra closing'}` };
    if (parens !== 0) return { valid: false, error: `Unbalanced parentheses: ${parens > 0 ? parens + ' unclosed' : Math.abs(parens) + ' extra closing'}` };
    if (brackets !== 0) return { valid: false, error: `Unbalanced brackets: ${brackets > 0 ? brackets + ' unclosed' : Math.abs(brackets) + ' extra closing'}` };
    
    return { valid: true };
  };

  /**
   * Check for unterminated template literals specifically
   */
  const checkStringTermination = (code: string): { valid: boolean; error?: string } => {
    const backticks = (code.match(/`/g) || []).length;
    
    // Backticks should be even (template literals)
    if (backticks % 2 !== 0) {
      return { valid: false, error: 'Unterminated template literal (backtick)' };
    }
    
    return { valid: true };
  };

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
