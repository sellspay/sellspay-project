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
   * Build a continuation prompt for the AI
   */
  const buildContinuationPrompt = useCallback((truncatedCode: string, originalPrompt?: string): string => {
    const contextTail = getContextTail(truncatedCode, 400);
    
    return `[CONTINUATION_MODE]
You previously generated code but it was cut off. Continue EXACTLY from where you left off.

LAST 400 CHARACTERS OF YOUR PREVIOUS OUTPUT:
\`\`\`
${contextTail}
\`\`\`

INSTRUCTIONS:
1. Continue EXACTLY from that point - do not repeat any code
2. Complete the remaining code logically
3. End with: ${VIBECODER_COMPLETE_SENTINEL}
4. Do NOT include the "/// TYPE: CODE ///" or "/// BEGIN_CODE ///" markers
5. Just output the remaining code that completes the file

${originalPrompt ? `Original request was: ${originalPrompt}` : ''}`;
  }, [getContextTail]);

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
