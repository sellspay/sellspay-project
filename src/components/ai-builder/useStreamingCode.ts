import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseStreamingCodeOptions {
  onChunk?: (accumulated: string) => void;
  onComplete?: (finalCode: string) => void;
  onChatResponse?: (text: string) => void;
  onError?: (error: Error) => void;
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

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;

        // Intent Router: Detect response type in first ~100 chars
        if (mode === 'detecting' && accumulated.length > 20) {
          if (accumulated.includes('/// TYPE: CHAT ///')) {
            mode = 'chat';
            accumulated = accumulated.replace('/// TYPE: CHAT ///', '').trim();
            // Stop streaming animation for chat responses
            setState(prev => ({ ...prev, isStreaming: false }));
          } else if (accumulated.includes('/// TYPE: CODE ///')) {
            mode = 'code';
            accumulated = accumulated.replace('/// TYPE: CODE ///', '').trim();
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
          // Clean up markdown code fences if the LLM includes them
          let cleanCode = accumulated
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

      // Final cleanup for code mode
      const finalCode = accumulated
        .replace(/^```(?:tsx?|jsx?|javascript|typescript)?\s*\n?/i, '')
        .replace(/\n?```\s*$/i, '')
        .trim();

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
