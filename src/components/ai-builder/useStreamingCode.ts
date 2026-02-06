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
      let accumulated = '';
      let mode: StreamMode = 'detecting';
      
      // Real-time transparency: track logs as they stream in
      const seenLogs = new Set<string>();
      const accumulatedLogs: string[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;

        // Extract [LOG: ...] tags for real-time transparency
        const logMatches = accumulated.matchAll(LOG_PATTERN);
        for (const match of logMatches) {
          const logText = match[1].trim();
          if (!seenLogs.has(logText)) {
            seenLogs.add(logText);
            accumulatedLogs.push(logText);
            options.onLogUpdate?.([...accumulatedLogs]);
          }
        }

        // Intent Router: Detect response type in first ~100 chars
        if (mode === 'detecting' && accumulated.length > 20) {
          if (accumulated.includes('/// TYPE: CHAT ///')) {
            mode = 'chat';
            accumulated = accumulated.replace('/// TYPE: CHAT ///', '').trim();
            // Stop streaming animation for chat responses
            setState(prev => ({ ...prev, isStreaming: false }));
          } else if (accumulated.includes('/// TYPE: CODE ///')) {
            mode = 'code';
            // Clean the type flag and all LOG tags from the code portion
            accumulated = accumulated
              .replace('/// TYPE: CODE ///', '')
              .replace(LOG_PATTERN, '')
              .trim();
          } else if (accumulated.length > 100) {
            // Fallback: assume code if no flag found after 100 chars
            mode = 'code';
          }
        }

        // Route based on detected mode
        if (mode === 'chat') {
          // Just accumulate chat text, don't update code
          continue;
        }

        if (mode === 'code') {
          // Clean up markdown code fences and LOG tags if the LLM includes them
          let cleanCode = accumulated
            .replace(LOG_PATTERN, '') // Remove any LOG tags
            .replace(/^```(?:tsx?|jsx?|javascript|typescript)?\s*\n?/i, '')
            .replace(/\n?```\s*$/i, '')
            .trim();

          // Update state with cleaned code
          setState(prev => ({ ...prev, code: cleanCode }));
          options.onChunk?.(cleanCode);
        }
      }

      // Final processing based on mode
      if (mode === 'chat') {
        // Return chat response
        const chatText = accumulated.trim();
        setState(prev => ({ ...prev, isStreaming: false }));
        options.onChatResponse?.(chatText);
        return chatText;
      }

      // Extract the AI's natural language summary (text before /// TYPE: CODE ///)
      // This captures the AI's explanation of what it built
      const extractAISummary = (rawStream: string): string => {
        // Remove LOG tags first
        let cleaned = rawStream.replace(LOG_PATTERN, '').trim();
        
        // Find the TYPE: CODE marker
        const codeMarkerIndex = cleaned.indexOf('/// TYPE: CODE ///');
        
        if (codeMarkerIndex > 0) {
          // Everything before the code marker is the AI's summary
          const summaryText = cleaned.substring(0, codeMarkerIndex).trim();
          // Clean up any stray type markers that might have been partially detected
          return summaryText.replace(/\/\/\/\s*TYPE:\s*\w+\s*\/\/\//g, '').trim();
        }
        
        return ''; // No summary found (pure code response)
      };

      const aiSummary = extractAISummary(accumulated);
      if (aiSummary) {
        options.onSummary?.(aiSummary);
      }

      // Final cleanup for code mode - strip LOG tags and markdown fences
      const finalCode = accumulated
        .replace(LOG_PATTERN, '') // Remove any remaining LOG tags
        .replace(/^```(?:tsx?|jsx?|javascript|typescript)?\s*\n?/i, '')
        .replace(/\n?```\s*$/i, '')
        .trim();

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

  return {
    ...state,
    streamCode,
    cancelStream,
    resetCode,
    setCode,
    DEFAULT_CODE,
  };
}
