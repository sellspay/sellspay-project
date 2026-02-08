import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Regex pattern for extracting live log tags
const LOG_PATTERN = /\[LOG:\s*([^\]]+)\]/g;

// Plan structure returned by the AI in ARCHITECT_MODE
export interface PlanData {
  type: 'plan';
  title: string;
  summary: string;
  steps: string[];
  estimatedTokens?: number;
}

interface UseStreamingCodeOptions {
  onChunk?: (accumulated: string) => void;
  onComplete?: (finalCode: string) => void;
  onChatResponse?: (text: string) => void;
  onPlanResponse?: (plan: PlanData, originalPrompt: string) => void; // NEW: Plan mode callback
  onLogUpdate?: (logs: string[]) => void; // Real-time transparency logs
  onSummary?: (summary: string) => void; // NEW: AI's natural language response extracted from stream
  onError?: (error: Error) => void;
  shouldAbort?: () => boolean; // Race condition guard: check if generation should be discarded
  getProductsContext?: () => Promise<ProductContext[]>; // Fetch products for AI context
  getConversationHistory?: () => Array<{role: string; content: string}>; // Recent chat for context
}

interface ProductContext {
  id: string;
  name: string;
  price: string;
  type: string | null;
  image: string | null;
}

type StreamMode = 'detecting' | 'chat' | 'code' | 'plan';

interface StreamingState {
  isStreaming: boolean;
  code: string;
  error: string | null;
}

const DEFAULT_CODE = `export default function App() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-violet-500/30 flex items-center justify-center">
          <div className="w-8 h-8 rounded-lg bg-violet-500/50" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white">Vibecoder Ready</h1>
          <p className="text-zinc-400">Describe your vision to start building</p>
        </div>
      </div>
    </div>
  );
}`;

// ------------------------------
// Preview safety: validate TSX before applying
// ------------------------------

const hasTsxEntrypoint = (code: string) =>
  /export\s+default\s+function\s+App\b|export\s+default\s+function\b|export\s+default\b|function\s+App\b|const\s+App\b/.test(code);

/**
 * Lightweight TS/TSX “completeness” check.
 * Goal: prevent obviously-truncated output (e.g. trailing "<" or unterminated strings)
 * from ever replacing the last-known-good preview.
 */
const isLikelyCompleteTsx = (code: string): boolean => {
  const src = (code ?? '').trim();
  if (!src) return false;
  if (!hasTsxEntrypoint(src)) return false;

  // Common truncation symptom seen in the screenshot
  const lastChar = src.replace(/\s+$/g, '').slice(-1);
  if (['<', '{', '(', '[', ',', ':', '=', '.', '+', '-', '*', '/'].includes(lastChar)) {
    return false;
  }

  // Balance brackets/braces/parens while respecting strings/comments.
  let paren = 0;
  let brace = 0;
  let bracket = 0;

  let inSingle = false;
  let inDouble = false;
  let inTemplate = false;
  let inLineComment = false;
  let inBlockComment = false;
  let escaped = false;

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    const n = src[i + 1];

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

    // not inside string/comment
    if (c === '/' && n === '/') {
      inLineComment = true;
      i++;
      continue;
    }
    if (c === '/' && n === '*') {
      inBlockComment = true;
      i++;
      continue;
    }

    if (c === "'") {
      inSingle = true;
      continue;
    }
    if (c === '"') {
      inDouble = true;
      continue;
    }
    if (c === '`') {
      inTemplate = true;
      continue;
    }

    if (c === '(') paren++;
    else if (c === ')') paren--;
    else if (c === '{') brace++;
    else if (c === '}') brace--;
    else if (c === '[') bracket++;
    else if (c === ']') bracket--;

    if (paren < 0 || brace < 0 || bracket < 0) return false;
  }

  // If we ended inside a string/comment, it's truncated.
  if (inSingle || inDouble || inTemplate || inLineComment || inBlockComment) return false;

  // Must be balanced
  if (paren !== 0 || brace !== 0 || bracket !== 0) return false;

  // JSX should at least contain a return with a tag
  if (!/return\s*\(/.test(src) && !/<[A-Za-z]/.test(src)) return false;

  return true;
};

export function useStreamingCode(options: UseStreamingCodeOptions = {}) {
  const [state, setState] = useState<StreamingState>({
    isStreaming: false,
    code: DEFAULT_CODE,
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  // Track original prompt for plan execution
  const originalPromptRef = useRef<string>('');

  // Last-known-good preview snapshot (never invalid / truncated)
  const lastGoodCodeRef = useRef<string>(DEFAULT_CODE);

  const streamCode = useCallback(async (prompt: string, currentCode?: string, jobId?: string) => {
    // Cancel any existing stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    // Store original prompt (strip ARCHITECT_MODE prefix for plan approval)
    const cleanPrompt = prompt.replace(/\[ARCHITECT_MODE_ACTIVE\]\nUser Request:\s*/i, '').split('\n\nINSTRUCTION:')[0].trim();
    originalPromptRef.current = cleanPrompt || prompt;

    setState(prev => ({ ...prev, isStreaming: true, error: null }));

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        throw new Error('Not authenticated');
      }

      // Fetch products context for AI if getter is provided
      let productsContext: ProductContext[] | undefined;
      if (options.getProductsContext) {
        try {
          productsContext = await options.getProductsContext();
        } catch (e) {
          console.warn('Failed to fetch products context:', e);
        }
      }

      // Get conversation history for pronoun resolution
      const conversationHistory = options.getConversationHistory?.() || [];

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
            prompt,
            currentCode,
            productsContext,
            conversationHistory, // Pass conversation history for pronoun resolution
            jobId, // Pass job ID for background-persistent generation
          }),
          signal: abortControllerRef.current.signal,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed: ${response.status}`);
      }

      // 🛡️ CRITICAL FIX: Detect JSON job status response vs streaming text
      // When jobId is passed, backend returns JSON instead of streaming.
      // We MUST NOT treat JSON as code or the preview will crash.
      const contentType = response.headers.get('Content-Type') || '';
      const isJsonResponse = contentType.includes('application/json');

      if (isJsonResponse) {
        // Backend returned a job status response (non-streaming mode)
        // The realtime subscription will handle the completed job
        console.log('[useStreamingCode] JSON response detected - deferring to realtime subscription');
        const jsonData = await response.json().catch(() => ({}));
        console.log('[useStreamingCode] Job status:', jsonData);

        // Return early WITHOUT modifying code state
        setState(prev => ({ ...prev, isStreaming: false }));
        return lastGoodCodeRef.current; // Keep existing code, don't set JSON as code
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      // Keep the raw stream intact (summary + logs + markers + code)
      let rawStream = '';
      let mode: StreamMode = 'detecting';

      // Real-time transparency: track logs as they stream in
      const seenLogs = new Set<string>();
      const accumulatedLogs: string[] = [];

      // Marker that separates explanation/logs from the actual TSX payload
      const BEGIN_CODE_MARKER = '/// BEGIN_CODE ///';

      // 🛡️ SAFETY: Helper to detect if content looks like JSON (not TSX code)
      const looksLikeJson = (text: string): boolean => {
        const trimmed = text.trim();
        if (!trimmed.startsWith('{')) return false;
        try {
          const parsed = JSON.parse(trimmed);
          // Check for known job status fields
          return parsed.success !== undefined || parsed.jobId !== undefined || parsed.status !== undefined;
        } catch {
          return false;
        }
      };

      const extractCodeFromRaw = (raw: string): string => {
        // 🛡️ SAFETY: Never return JSON as code
        if (looksLikeJson(raw)) {
          console.warn('[useStreamingCode] Raw stream looks like JSON - skipping code extraction');
          return '';
        }

        // Prefer explicit begin marker; fallback to type marker
        const beginIdx = raw.indexOf(BEGIN_CODE_MARKER);
        const typeIdx = raw.indexOf('/// TYPE: CODE ///');

        let codePart = '';
        if (beginIdx >= 0) {
          // Best case: backend explicitly marked where code begins
          codePart = raw.substring(beginIdx + BEGIN_CODE_MARKER.length);
        } else if (typeIdx >= 0) {
          // If BEGIN_CODE hasn't arrived yet, we may only have the summary/logs.
          // Do NOT push anything into the preview until we can detect real TSX.
          codePart = raw.substring(typeIdx + '/// TYPE: CODE ///'.length);
        } else {
          // No markers yet; treat as unknown. Don't risk updating preview.
          return '';
        }

        // Strip logs/fences then attempt to locate the real start of TSX
        const cleaned = codePart
          .replace(LOG_PATTERN, '')
          .replace(/^```(?:tsx?|jsx?|javascript|typescript)?\s*\n?/i, '')
          .replace(/\n?```\s*$/i, '')
          .trim();

        // Final safety check: don't return JSON
        if (looksLikeJson(cleaned)) {
          console.warn('[useStreamingCode] Cleaned code looks like JSON - returning empty');
          return '';
        }

        // 🛡️ CRITICAL: Only start updating the preview once we see real TSX code.
        // This prevents intermediate summary text (or stray '<') from breaking /App.tsx.
        const tsxStartPatterns: RegExp[] = [
          /(^|\n)import\s+[^\n]+/,
          /(^|\n)export\s+default\s+function\s+/, 
          /(^|\n)export\s+function\s+/, 
          /(^|\n)const\s+\w+\s*=\s*\(/,
          /(^|\n)function\s+\w+\s*\(/,
        ];

        let startIdx = -1;
        for (const pattern of tsxStartPatterns) {
          const match = cleaned.match(pattern);
          if (match?.index !== undefined) {
            startIdx = match.index;
            break;
          }
        }

        if (startIdx < 0) {
          // We don't have code yet (likely still summary) — don't update preview.
          return '';
        }

        return cleaned.substring(startIdx).trim();
      };

      const extractSummaryFromRaw = (raw: string): string => {
        const typeIdx = raw.indexOf('/// TYPE: CODE ///');
        if (typeIdx < 0) {
          console.log('[extractSummary] No TYPE: CODE marker found');
          return '';
        }

        // Try explicit BEGIN_CODE marker first
        let endIdx = raw.indexOf(BEGIN_CODE_MARKER);
        console.log('[extractSummary] BEGIN_CODE marker at:', endIdx);

        // Fallback: find where actual TSX code starts (export/function/const/import at line start)
        if (endIdx < 0) {
          // Look for the first line that starts with common code patterns
          const codePatterns = [
            /\n(export\s+default\s+function)/,
            /\n(export\s+function)/,
            /\n(function\s+\w+)/,
            /\n(const\s+\w+\s*=\s*\()/,
            /\nimport\s+/, 
          ];

          const afterType = raw.substring(typeIdx + '/// TYPE: CODE ///'.length);
          for (const pattern of codePatterns) {
            const match = afterType.match(pattern);
            if (match && match.index !== undefined) {
              endIdx = typeIdx + '/// TYPE: CODE ///'.length + match.index;
              console.log('[extractSummary] Found code start via pattern at:', endIdx);
              break;
            }
          }
        }

        // If still no end found, just strip logs and return everything after TYPE marker
        const summaryEnd = endIdx > typeIdx ? endIdx : raw.length;
        const afterType = raw.substring(typeIdx + '/// TYPE: CODE ///'.length, summaryEnd);

        const cleaned = afterType
          .replace(LOG_PATTERN, '')
          .replace(/```[\s\S]*$/m, '') // Remove any trailing code blocks
          .replace(/\n{3,}/g, '\n\n')
          .trim();

        console.log('[extractSummary] Extracted summary length:', cleaned.length, 'chars');
        console.log('[extractSummary] First 200 chars:', cleaned.substring(0, 200));

        return cleaned;
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        rawStream += chunk;

        // Extract [LOG: ...] tags for real-time transparency
        const logMatches = rawStream.matchAll(LOG_PATTERN);
        for (const match of logMatches) {
          const logText = match[1].trim();
          if (!seenLogs.has(logText)) {
            seenLogs.add(logText);
            accumulatedLogs.push(logText);
            options.onLogUpdate?.([...accumulatedLogs]);
          }
        }

        // 🛡️ SAFETY: Early detection of JSON response that slipped through
        // If the stream starts with { and looks like JSON, abort code processing
        if (mode === 'detecting' && rawStream.trim().startsWith('{') && rawStream.length > 50) {
          if (looksLikeJson(rawStream)) {
            console.warn('[useStreamingCode] JSON detected in stream - aborting code extraction');
            setState(prev => ({ ...prev, isStreaming: false }));
            return lastGoodCodeRef.current; // Keep existing code
          }
        }

        // Intent Router: detect response type as soon as the type flag appears
        if (mode === 'detecting') {
          if (rawStream.includes('/// TYPE: CHAT ///')) {
            mode = 'chat';
            // Stop streaming animation for chat responses
            setState(prev => ({ ...prev, isStreaming: false }));
          } else if (rawStream.includes('/// TYPE: PLAN ///')) {
            mode = 'plan';
            // Stop streaming animation for plan responses
            setState(prev => ({ ...prev, isStreaming: false }));
          } else if (rawStream.includes('/// TYPE: CODE ///')) {
            mode = 'code';
          } else if (rawStream.length > 120) {
            // 🛡️ SAFETY: Before falling back to code mode, verify it's not JSON
            if (looksLikeJson(rawStream)) {
              console.warn('[useStreamingCode] JSON detected before mode fallback - aborting');
              setState(prev => ({ ...prev, isStreaming: false }));
              return lastGoodCodeRef.current;
            }
            // Fallback: assume code if no flag appears early
            mode = 'code';
          }
        }

        // Route based on detected mode
        if (mode === 'chat' || mode === 'plan') {
          // Just accumulate text, don't update code
          continue;
        }

        if (mode === 'code') {
          const cleanCode = extractCodeFromRaw(rawStream);

          // 🛡️ IMPORTANT: only apply code to the preview when it looks complete.
          // This prevents Sandpack from ever seeing truncated TSX (which triggers the overlay loop).
          if (cleanCode && isLikelyCompleteTsx(cleanCode)) {
            lastGoodCodeRef.current = cleanCode;
            setState(prev => ({ ...prev, code: cleanCode }));
            options.onChunk?.(cleanCode);
          }
        }
      }

      // Final processing based on mode
      if (mode === 'chat') {
        const chatText = rawStream.replace('/// TYPE: CHAT ///', '').trim();
        setState(prev => ({ ...prev, isStreaming: false }));
        options.onChatResponse?.(chatText);
        return chatText;
      }

      if (mode === 'plan') {
        const planText = rawStream.replace('/// TYPE: PLAN ///', '').trim();
        setState(prev => ({ ...prev, isStreaming: false }));

        try {
          // Extract JSON from the response (may have markdown wrapper)
          const jsonMatch = planText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const planData: PlanData = JSON.parse(jsonMatch[0]);
            options.onPlanResponse?.(planData, originalPromptRef.current);
            return planData;
          }
        } catch (e) {
          console.error('Failed to parse plan JSON:', e);
          // Fallback: treat as chat response
          options.onChatResponse?.(planText);
        }
        return planText;
      }

      // Extract the AI's natural language summary (markdown explanation)
      // Expected backend format:
      // /// TYPE: CODE ///
      // <markdown summary>
      // [LOG: ...]
      // /// BEGIN_CODE ///
      // <tsx code>
      const aiSummary = extractSummaryFromRaw(rawStream);
      if (aiSummary) {
        options.onSummary?.(aiSummary);
      }

      const finalCode = extractCodeFromRaw(rawStream);

      // 🛡️ FINAL SAFETY: never replace the preview with invalid TSX.
      if (!finalCode || !isLikelyCompleteTsx(finalCode)) {
        const err = new Error('Generated code was incomplete/invalid; kept last working preview.');
        console.warn('[useStreamingCode] Invalid final TSX - keeping last known good snapshot');
        setState(prev => ({ ...prev, isStreaming: false, error: err.message, code: lastGoodCodeRef.current }));
        options.onError?.(err);
        return lastGoodCodeRef.current;
      }

      // 🛑 RACE CONDITION GUARD: Check if user switched projects during generation
      if (options.shouldAbort?.()) {
        console.warn('🛑 Aborted: Project changed during generation - discarding result');
        setState(prev => ({ ...prev, isStreaming: false }));
        return lastGoodCodeRef.current; // Return existing code, don't fire onComplete
      }

      lastGoodCodeRef.current = finalCode;
      setState(prev => ({ ...prev, isStreaming: false, code: finalCode }));
      options.onComplete?.(finalCode);

      return finalCode;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Stream was cancelled, don't treat as error
        setState(prev => ({ ...prev, isStreaming: false }));
        return lastGoodCodeRef.current;
      }

      const err = error instanceof Error ? error : new Error('Unknown error');
      setState(prev => ({ ...prev, isStreaming: false, error: err.message }));
      options.onError?.(err);
      throw err;
    }
  }, [options]);

  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setState(prev => ({ ...prev, isStreaming: false }));
  }, []);

  const resetCode = useCallback(() => {
    lastGoodCodeRef.current = DEFAULT_CODE;
    setState({
      isStreaming: false,
      code: DEFAULT_CODE,
      error: null,
    });
  }, []);

  const setCode = useCallback((code: string) => {
    // Only allow external setters to overwrite lastGood when it’s valid.
    if (isLikelyCompleteTsx(code)) {
      lastGoodCodeRef.current = code;
    }
    setState(prev => ({ ...prev, code }));
  }, []);

  // Force-reset streaming state (safety valve for stuck states)
  const forceResetStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setState(prev => ({ ...prev, isStreaming: false, error: null }));
  }, []);

  return {
    ...state,
    streamCode,
    cancelStream,
    resetCode,
    setCode,
    forceResetStreaming,
    DEFAULT_CODE,
  };
}
