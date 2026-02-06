import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { AgentStep } from './AgentProgress';

/**
 * Orchestrator Event Types (from backend)
 */
interface OrchestratorEvent {
  type: 'status' | 'log' | 'plan' | 'code' | 'error' | 'complete';
  step?: 'architect' | 'builder' | 'linter' | 'healing';
  data: unknown;
}

interface ArchitectPlan {
  vibeAnalysis?: {
    visualStyle: string;
    colorPalette: Record<string, string>;
    typography: Record<string, string>;
  };
  componentArchitecture?: string[];
  executionSteps?: string[];
  debugForecast?: string[];
}

interface OrchestratorState {
  isRunning: boolean;
  step: AgentStep;
  logs: string[];
  plan: ArchitectPlan | null;
  code: string;
  error: string | null;
  lockedProjectId: string | null;
}

interface UseOrchestratorOptions {
  onStepChange?: (step: AgentStep) => void;
  onLog?: (log: string) => void;
  onPlan?: (plan: ArchitectPlan) => void;
  onCodeChunk?: (code: string) => void;
  onComplete?: (code: string, summary: string) => void;
  onError?: (error: string) => void;
  shouldAbort?: () => boolean;
}

const DEFAULT_CODE = `export default function App() {
  return (
    <div className="min-h-screen bg-zinc-950" />
  );
}`;

const INITIAL_STATE: OrchestratorState = {
  isRunning: false,
  step: 'idle',
  logs: [],
  plan: null,
  code: DEFAULT_CODE,
  error: null,
  lockedProjectId: null,
};

/**
 * useOrchestratorStream
 * 
 * Connects to the vibecoder-orchestrator edge function and streams events
 * from the multi-agent pipeline (Architect → Builder → Linter → Self-Heal)
 */
export function useOrchestratorStream(options: UseOrchestratorOptions = {}) {
  const [state, setState] = useState<OrchestratorState>(INITIAL_STATE);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Start a new orchestrator generation
   */
  const startGeneration = useCallback(async (
    prompt: string,
    currentCode?: string,
    styleProfile?: string,
    projectId?: string,
    skipArchitect?: boolean
  ) => {
    // Cancel any existing stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    // Get user auth
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    const userId = sessionData.session?.user?.id;

    if (!accessToken || !userId) {
      const error = 'Not authenticated';
      setState(prev => ({ ...prev, error, isRunning: false }));
      options.onError?.(error);
      return;
    }

    // Lock to this project
    setState({
      isRunning: true,
      step: 'architect',
      logs: ['> Initializing multi-agent pipeline...'],
      plan: null,
      code: currentCode || DEFAULT_CODE,
      error: null,
      lockedProjectId: projectId || null,
    });

    options.onStepChange?.('architect');
    options.onLog?.('> Initializing multi-agent pipeline...');

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vibecoder-orchestrator`,
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
            styleProfile,
            userId,
            projectId,
            skipArchitect,
          }),
          signal: abortControllerRef.current.signal,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.error || `Request failed: ${response.status}`;
        throw new Error(errorMsg);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Check abort
        if (options.shouldAbort?.()) {
          console.warn('🛑 Orchestrator aborted: Project changed');
          setState(INITIAL_STATE);
          return;
        }

        textBuffer += decoder.decode(value, { stream: true });

        // Process SSE line-by-line
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') continue;

          try {
            const event = JSON.parse(jsonStr) as OrchestratorEvent;
            handleEvent(event);
          } catch {
            // Incomplete JSON, put it back
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Flush remaining buffer
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split('\n')) {
          if (!raw) continue;
          if (raw.endsWith('\r')) raw = raw.slice(0, -1);
          if (raw.startsWith(':') || raw.trim() === '') continue;
          if (!raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const event = JSON.parse(jsonStr) as OrchestratorEvent;
            handleEvent(event);
          } catch { /* ignore partial */ }
        }
      }

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        setState(prev => ({ ...prev, isRunning: false }));
        return;
      }

      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({ ...prev, error: errMsg, isRunning: false, step: 'error' }));
      options.onError?.(errMsg);
    }

    function handleEvent(event: OrchestratorEvent) {
      switch (event.type) {
        case 'status': {
          const step = mapStep(event.step);
          setState(prev => ({ ...prev, step }));
          options.onStepChange?.(step);
          break;
        }
        case 'log': {
          const log = String(event.data);
          setState(prev => ({ ...prev, logs: [...prev.logs, log] }));
          options.onLog?.(log);
          break;
        }
        case 'plan': {
          const plan = event.data as ArchitectPlan;
          setState(prev => ({ ...prev, plan }));
          options.onPlan?.(plan);
          break;
        }
        case 'code': {
          const { code, summary } = event.data as { code: string; summary: string };
          setState(prev => ({ ...prev, code, step: 'done', isRunning: false }));
          options.onCodeChunk?.(code);
          options.onComplete?.(code, summary);
          break;
        }
        case 'error': {
          const { message } = event.data as { message: string };
          setState(prev => ({ ...prev, error: message, step: 'error', isRunning: false }));
          options.onError?.(message);
          break;
        }
        case 'complete': {
          setState(prev => ({ ...prev, isRunning: false, step: 'done' }));
          break;
        }
      }
    }
  }, [options]);

  /**
   * Cancel the current stream
   */
  const cancelGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setState(prev => ({ ...prev, isRunning: false, step: 'idle' }));
  }, []);

  /**
   * Reset to initial state
   */
  const reset = useCallback(() => {
    cancelGeneration();
    setState(INITIAL_STATE);
  }, [cancelGeneration]);

  /**
   * Set code directly (for restoration from history)
   */
  const setCode = useCallback((code: string) => {
    setState(prev => ({ ...prev, code }));
  }, []);

  /**
   * Mount/unmount for project isolation
   */
  const mountProject = useCallback((projectId: string) => {
    setState(prev => ({
      ...INITIAL_STATE,
      lockedProjectId: projectId,
    }));
  }, []);

  const unmountProject = useCallback(() => {
    cancelGeneration();
    setState(INITIAL_STATE);
  }, [cancelGeneration]);

  return {
    // State
    isRunning: state.isRunning,
    step: state.step,
    logs: state.logs,
    plan: state.plan,
    code: state.code,
    error: state.error,
    lockedProjectId: state.lockedProjectId,
    
    // Actions
    startGeneration,
    cancelGeneration,
    reset,
    setCode,
    mountProject,
    unmountProject,
    
    // Constants
    DEFAULT_CODE,
  };
}

/**
 * Map orchestrator step to AgentStep type
 */
function mapStep(step?: string): AgentStep {
  switch (step) {
    case 'architect': return 'architect';
    case 'builder': return 'building';
    case 'linter': return 'linting';
    case 'healing': return 'healing';
    default: return 'planning';
  }
}
