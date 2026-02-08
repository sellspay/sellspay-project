import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Completion sentinel that MUST be present in every AI-generated code block.
 * If missing, the output is considered truncated.
 */
export const VIBECODER_COMPLETE_SENTINEL = '// --- VIBECODER_COMPLETE ---';

/**
 * Component markers for modular generation
 */
export const COMPONENT_START_PATTERN = /\/\/\/\s*COMPONENT_START:\s*(\w+)\s*\/\/\//;
export const COMPONENT_END_PATTERN = /\/\/\/\s*COMPONENT_END\s*\/\/\//;

interface GhostFixerState {
  isFixing: boolean;
  retryCount: number;
  lastTruncatedCode: string | null;
  error: string | null;
}

interface UseGhostFixerOptions {
  maxRetries?: number;
  onFixAttempt?: (attempt: number) => void;
  onFixSuccess?: (code: string) => void;
  onFixFailure?: (reason: string) => void;
}

/**
 * Ghost Fixer: Automatic self-correction for truncated AI output.
 * 
 * When the AI hits token limits mid-generation, the output is incomplete.
 * This hook detects truncation and automatically triggers continuation prompts
 * to stitch together the full output.
 * 
 * Detection: Missing VIBECODER_COMPLETE sentinel at end of code.
 * Recovery: Call AI with "Continue from: [last 200 chars]" prompt.
 * Merge: Stitch continuation onto existing code.
 */
export function useGhostFixer(options: UseGhostFixerOptions = {}) {
  const { maxRetries = 3, onFixAttempt, onFixSuccess, onFixFailure } = options;
  
  const [state, setState] = useState<GhostFixerState>({
    isFixing: false,
    retryCount: 0,
    lastTruncatedCode: null,
    error: null,
  });
  
  const abortRef = useRef(false);

  /**
   * Check if code has the completion sentinel (indicating full generation)
   */
  const hasCompleteSentinel = useCallback((code: string): boolean => {
    return code.includes(VIBECODER_COMPLETE_SENTINEL);
  }, []);

  /**
   * Extract the last N characters of code for continuation context
   */
  const getContextTail = useCallback((code: string, chars = 300): string => {
    const trimmed = code.trim();
    return trimmed.slice(-chars);
  }, []);

  /**
   * Truncation type for surgical continuation prompts
   */
  type TruncationType = 
    | 'OPEN_DOUBLE_QUOTE'
    | 'OPEN_SINGLE_QUOTE'
    | 'OPEN_TEMPLATE_LITERAL'
    | 'OPEN_JSX_TAG'
    | 'UNBALANCED_BRACES'
    | 'UNBALANCED_PARENS'
    | 'GENERAL_TRUNCATION';

  /**
   * Detects the specific type of truncation for surgical continuation.
   * This allows the AI to know EXACTLY how to resume (e.g., close a string first).
   */
  const detectTruncationType = useCallback((code: string): TruncationType => {
    const trimmed = code.trim();
    const lines = trimmed.split('\n');
    const lastLine = lines[lines.length - 1] || '';
    const lastFiveLines = lines.slice(-5).join('\n');

    // Check for unclosed quotes in last line (most precise)
    const doubleQuotesInLast = (lastLine.match(/(?<!\\)"/g) || []).length;
    if (doubleQuotesInLast % 2 !== 0) {
      return 'OPEN_DOUBLE_QUOTE';
    }

    const singleQuotesInLast = (lastLine.match(/(?<!\\)'/g) || []).length;
    if (singleQuotesInLast % 2 !== 0) {
      return 'OPEN_SINGLE_QUOTE';
    }

    const templateLiteralsInLast = (lastFiveLines.match(/(?<!\\)`/g) || []).length;
    if (templateLiteralsInLast % 2 !== 0) {
      return 'OPEN_TEMPLATE_LITERAL';
    }

    // Check for unclosed JSX tag
    if (/<(\w+)[^>]*$/.test(lastLine)) {
      return 'OPEN_JSX_TAG';
    }

    // Check brace balance
    const openBraces = (trimmed.match(/\{/g) || []).length;
    const closeBraces = (trimmed.match(/\}/g) || []).length;
    if (openBraces > closeBraces + 1) {
      return 'UNBALANCED_BRACES';
    }

    // Check paren balance
    const openParens = (trimmed.match(/\(/g) || []).length;
    const closeParens = (trimmed.match(/\)/g) || []).length;
    if (openParens > closeParens + 1) {
      return 'UNBALANCED_PARENS';
    }

    return 'GENERAL_TRUNCATION';
  }, []);

  /**
   * Detect if code appears truncated
   */
  const isTruncated = useCallback((code: string): boolean => {
    if (!code || code.trim().length < 50) return false;
    
    // Check for explicit completion marker
    if (hasCompleteSentinel(code)) return false;
    
    // Check for common truncation symptoms
    const trimmed = code.trim();
    const lastChar = trimmed.slice(-1);
    
    // Trailing operators or incomplete constructs
    const truncationChars = ['<', '{', '(', '[', ',', ':', '=', '.', '+', '-', '*', '/', '`', '"', "'"];
    if (truncationChars.includes(lastChar)) return true;
    
    // Check for unbalanced braces (strong indicator)
    const openBraces = (code.match(/\{/g) || []).length;
    const closeBraces = (code.match(/\}/g) || []).length;
    if (openBraces > closeBraces + 1) return true;
    
    // Check for unbalanced parentheses
    const openParens = (code.match(/\(/g) || []).length;
    const closeParens = (code.match(/\)/g) || []).length;
    if (openParens > closeParens + 1) return true;
    
    return false;
  }, [hasCompleteSentinel]);

  /**
   * Get string-safety instruction based on truncation type
   */
  const getStringSafetyInstruction = useCallback((truncationType: TruncationType): string => {
    switch (truncationType) {
      case 'OPEN_DOUBLE_QUOTE':
        return `⚠️ STRING SAFETY: Your last token was inside an unclosed DOUBLE-QUOTE string.
YOUR FIRST OUTPUT MUST: Close the string with " and complete any open JSX attribute.
EXAMPLE: gradient-to-r from-zinc-900"> to close a className.`;

      case 'OPEN_SINGLE_QUOTE':
        return `⚠️ STRING SAFETY: Your last token was inside an unclosed SINGLE-QUOTE string.
YOUR FIRST OUTPUT MUST: Close the string with ' and complete any open expression.`;

      case 'OPEN_TEMPLATE_LITERAL':
        return `⚠️ STRING SAFETY: Your last token was inside an unclosed TEMPLATE LITERAL.
YOUR FIRST OUTPUT MUST: Close the template literal with \` and any interpolation \${} if open.`;

      case 'OPEN_JSX_TAG':
        return `⚠️ JSX SAFETY: Your last token was inside an unclosed JSX tag.
YOUR FIRST OUTPUT MUST: Complete the tag's attributes and close with > or />.`;

      case 'UNBALANCED_BRACES':
        return `⚠️ STRUCTURAL SAFETY: The code has unbalanced braces { }.
YOUR FIRST OUTPUT MUST: Ensure you close any open blocks before adding new code.`;

      case 'UNBALANCED_PARENS':
        return `⚠️ STRUCTURAL SAFETY: The code has unbalanced parentheses ( ).
YOUR FIRST OUTPUT MUST: Ensure you close any open function calls or expressions.`;

      default:
        return '';
    }
  }, []);

  /**
   * Build a continuation prompt for the AI with string-safety awareness
   */
  const buildContinuationPrompt = useCallback((truncatedCode: string, originalPrompt?: string): string => {
    const contextTail = getContextTail(truncatedCode, 400);
    const truncationType = detectTruncationType(truncatedCode);
    const stringSafetyInstruction = getStringSafetyInstruction(truncationType);
    const lines = truncatedCode.trim().split('\n');
    
    return `[HEALER_MODE: AUTO_RESUME]
Your previous generation was TRUNCATED at approximately line ${lines.length}.
ERROR TYPE: ${truncationType}

${stringSafetyInstruction}

LAST 400 CHARACTERS OF YOUR PREVIOUS OUTPUT:
\`\`\`
${contextTail}
\`\`\`

CRITICAL INSTRUCTIONS:
1. Continue EXACTLY from the cutoff point - do not repeat any code
2. If truncation was mid-string, your FIRST characters must close that string/tag
3. Complete the remaining code logically
4. End with: ${VIBECODER_COMPLETE_SENTINEL}
5. Do NOT include the "/// TYPE: CODE ///" or "/// BEGIN_CODE ///" markers
6. Just output the remaining code that completes the file

${originalPrompt ? `Original request was: ${originalPrompt}` : ''}`;
  }, [getContextTail, detectTruncationType, getStringSafetyInstruction]);

  /**
   * Merge continuation onto the truncated code
   */
  const mergeCode = useCallback((truncated: string, continuation: string): string => {
    // Clean up the continuation
    let clean = continuation.trim();
    
    // Remove any accidental markers
    clean = clean.replace(/\/\/\/\s*TYPE:\s*\w+\s*\/\/\//g, '');
    clean = clean.replace(/\/\/\/\s*BEGIN_CODE\s*\/\/\//g, '');
    clean = clean.replace(/```[\s\S]*?```/g, match => {
      // Extract code from markdown blocks
      return match.replace(/```\w*\n?/g, '').replace(/```$/g, '');
    });
    
    // The truncated code might have trailing incomplete tokens
    // We need to find the last complete line/token
    const truncLines = truncated.trimEnd().split('\n');
    
    // If the last line looks incomplete (no semicolon, brace, etc.), remove it
    const lastLine = truncLines[truncLines.length - 1];
    const incompleteEndings = ['<', '{', '(', '[', ',', ':', '=', '+', '-', '*', '/'];
    
    let baseCode = truncated.trimEnd();
    if (incompleteEndings.includes(lastLine.trim().slice(-1))) {
      // Don't remove the line - let the AI continue it
      // Just make sure there's a clean join point
    }
    
    // Simple concatenation - AI should continue from exact point
    const merged = baseCode + clean;
    
    return merged;
  }, []);

  /**
   * Trigger a continuation request to complete truncated code
   */
  const triggerContinuation = useCallback(async (
    truncatedCode: string,
    originalPrompt?: string
  ): Promise<string | null> => {
    if (state.retryCount >= maxRetries) {
      const reason = `Max retry limit (${maxRetries}) reached`;
      setState(prev => ({ ...prev, error: reason }));
      onFixFailure?.(reason);
      return null;
    }
    
    abortRef.current = false;
    const attemptNum = state.retryCount + 1;
    
    setState(prev => ({
      ...prev,
      isFixing: true,
      retryCount: attemptNum,
      lastTruncatedCode: truncatedCode,
      error: null,
    }));
    
    onFixAttempt?.(attemptNum);
    console.log(`[GhostFixer] Attempt ${attemptNum}/${maxRetries} - Triggering continuation...`);
    
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      
      if (!accessToken) {
        throw new Error('Not authenticated');
      }
      
      const continuationPrompt = buildContinuationPrompt(truncatedCode, originalPrompt);
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vibecoder-v2`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            prompt: continuationPrompt,
            currentCode: null, // Don't pass current code - we include context in prompt
            model: 'vibecoder-flash', // Use fast model for continuations
          }),
        }
      );
      
      if (!response.ok) {
        throw new Error(`Continuation request failed: ${response.status}`);
      }
      
      if (!response.body) {
        throw new Error('No response body');
      }
      
      // Collect the streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let continuation = '';
      
      while (true) {
        if (abortRef.current) {
          console.log('[GhostFixer] Continuation aborted');
          break;
        }
        
        const { done, value } = await reader.read();
        if (done) break;
        
        continuation += decoder.decode(value, { stream: true });
      }
      
      // Extract code from the continuation response
      let codeOnly = continuation;
      
      // Try to extract from markers if present
      if (continuation.includes('/// BEGIN_CODE ///')) {
        codeOnly = continuation.split('/// BEGIN_CODE ///')[1] || continuation;
      }
      if (continuation.includes('/// TYPE: CODE ///')) {
        const parts = continuation.split('/// TYPE: CODE ///');
        codeOnly = parts[parts.length - 1] || continuation;
      }
      
      // Merge with the original truncated code
      const merged = mergeCode(truncatedCode, codeOnly);
      
      // Check if the merged result is now complete
      if (hasCompleteSentinel(merged)) {
        console.log('[GhostFixer] ✅ Continuation successful - sentinel found');
        setState(prev => ({ ...prev, isFixing: false, error: null }));
        onFixSuccess?.(merged);
        return merged;
      }
      
      // Still truncated - check if we should retry
      if (isTruncated(merged) && attemptNum < maxRetries) {
        console.log('[GhostFixer] Merged result still truncated - retrying...');
        // Recursive retry (this will increment the counter)
        return triggerContinuation(merged, originalPrompt);
      }
      
      // If we're out of retries but have something, return it anyway
      console.log('[GhostFixer] ⚠️ Max retries reached, returning best effort');
      setState(prev => ({ ...prev, isFixing: false }));
      return merged;
      
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Unknown error';
      console.error('[GhostFixer] Error:', reason);
      setState(prev => ({ ...prev, isFixing: false, error: reason }));
      onFixFailure?.(reason);
      return null;
    }
  }, [state.retryCount, maxRetries, buildContinuationPrompt, mergeCode, hasCompleteSentinel, isTruncated, onFixAttempt, onFixSuccess, onFixFailure]);

  /**
   * Cancel any ongoing fix attempt
   */
  const cancelFix = useCallback(() => {
    abortRef.current = true;
    setState(prev => ({ ...prev, isFixing: false }));
  }, []);

  /**
   * Reset the fixer state
   */
  const resetFixer = useCallback(() => {
    abortRef.current = true;
    setState({
      isFixing: false,
      retryCount: 0,
      lastTruncatedCode: null,
      error: null,
    });
  }, []);

  return {
    // State
    isFixing: state.isFixing,
    retryCount: state.retryCount,
    error: state.error,
    
    // Detection
    isTruncated,
    hasCompleteSentinel,
    
    // Actions
    triggerContinuation,
    cancelFix,
    resetFixer,
    
    // Constants (exported for other modules)
    VIBECODER_COMPLETE_SENTINEL,
  };
}
