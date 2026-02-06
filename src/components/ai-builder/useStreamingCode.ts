import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Regex pattern for extracting live log tags
const LOG_PATTERN = /\[LOG:\s*([^\]]+)\]/g;

interface UseStreamingCodeOptions {
  onChunk?: (accumulated: string) => void;
  onComplete?: (finalCode: string) => void;
  onChatResponse?: (text: string) => void;
  onLogUpdate?: (logs: string[]) => void; // Real-time transparency logs
  onSummary?: (summary: string) => void; // NEW: AI's natural language response extracted from stream
  onError?: (error: Error) => void;
  shouldAbort?: () => boolean; // Race condition guard: check if generation should be discarded
}

type StreamMode = 'detecting' | 'chat' | 'code';

interface StreamingState {
  isStreaming: boolean;
  code: string;
  error: string | null;
}

const DEFAULT_CODE = `export default function App() {
  return (
    <div className="min-h-screen bg-zinc-950" />
  );
}`;

export function useStreamingCode(options: UseStreamingCodeOptions = {}) {
  const [state, setState] = useState<StreamingState>({
    isStreaming: false,
    code: DEFAULT_CODE,
    error: null,
  });
  
  const abortControllerRef = useRef<AbortController | null>(null);

  const streamCode = useCallback(async (prompt: string, currentCode?: string) => {
    // Cancel any existing stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    
    setState(prev => ({ ...prev, isStreaming: true, error: null }));

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        throw new Error('Not authenticated');
      }

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
          }),
          signal: abortControllerRef.current.signal,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed: ${response.status}`);
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

      const extractCodeFromRaw = (raw: string): string => {
        // Prefer explicit begin marker; fallback to type marker
        const beginIdx = raw.indexOf(BEGIN_CODE_MARKER);
        const typeIdx = raw.indexOf('/// TYPE: CODE ///');

        let codePart = '';
        if (beginIdx >= 0) {
          codePart = raw.substring(beginIdx + BEGIN_CODE_MARKER.length);
        } else if (typeIdx >= 0) {
          // If backend hasn't adopted BEGIN_CODE yet, best-effort fallback:
          // take everything after TYPE marker (may include explanation, but we clean fences/logs)
          codePart = raw.substring(typeIdx + '/// TYPE: CODE ///'.length);
        } else {
          codePart = raw;
        }

        return codePart
          .replace(LOG_PATTERN, '')
          .replace(/^```(?:tsx?|jsx?|javascript|typescript)?\s*\n?/i, '')
          .replace(/\n?```\s*$/i, '')
          .trim();
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

        // Intent Router: detect response type as soon as the type flag appears
        if (mode === 'detecting') {
          if (rawStream.includes('/// TYPE: CHAT ///')) {
            mode = 'chat';
            // Stop streaming animation for chat responses
            setState(prev => ({ ...prev, isStreaming: false }));
          } else if (rawStream.includes('/// TYPE: CODE ///')) {
            mode = 'code';
          } else if (rawStream.length > 120) {
            // Fallback: assume code if no flag appears early
            mode = 'code';
          }
        }

        // Route based on detected mode
        if (mode === 'chat') {
          // Just accumulate chat text, don't update code
          continue;
        }

        if (mode === 'code') {
          // Update state with cleaned code portion only
          const cleanCode = extractCodeFromRaw(rawStream);
          setState(prev => ({ ...prev, code: cleanCode }));
          options.onChunk?.(cleanCode);
        }
      }

      // Final processing based on mode
      if (mode === 'chat') {
        // Return chat response
        const chatText = rawStream.replace('/// TYPE: CHAT ///', '').trim();
        setState(prev => ({ ...prev, isStreaming: false }));
        options.onChatResponse?.(chatText);
        return chatText;
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

      // 🛑 RACE CONDITION GUARD: Check if user switched projects during generation
      if (options.shouldAbort?.()) {
        console.warn('🛑 Aborted: Project changed during generation - discarding result');
        setState(prev => ({ ...prev, isStreaming: false }));
        return state.code; // Return existing code, don't fire onComplete
      }

      setState(prev => ({ ...prev, isStreaming: false, code: finalCode }));
      options.onComplete?.(finalCode);

      return finalCode;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Stream was cancelled, don't treat as error
        setState(prev => ({ ...prev, isStreaming: false }));
        return state.code;
      }

      const err = error instanceof Error ? error : new Error('Unknown error');
      setState(prev => ({ ...prev, isStreaming: false, error: err.message }));
      options.onError?.(err);
      throw err;
    }
  }, [options, state.code]);

  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setState(prev => ({ ...prev, isStreaming: false }));
  }, []);

  const resetCode = useCallback(() => {
    setState({
      isStreaming: false,
      code: DEFAULT_CODE,
      error: null,
    });
  }, []);

  const setCode = useCallback((code: string) => {
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
