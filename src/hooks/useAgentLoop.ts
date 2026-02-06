import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { AgentStep } from '@/components/ai-builder/AgentProgress';
import { parseCreditsError, isCreditsError } from '@/components/ai-builder/InsufficientCreditsCard';

// Structured error details for better UI handling
interface ErrorDetails {
  creditsNeeded?: number;
  creditsAvailable?: number;
  message: string;
}

interface AgentState {
  step: AgentStep;
  logs: string[];
  isRunning: boolean;
  error?: string;
  errorType?: 'credits' | 'auth' | 'api' | 'unknown';
  errorDetails?: ErrorDetails;
  lockedProjectId: string | null;
  architectPlan?: Record<string, unknown>;
  lastGeneratedCode?: string; // Track last code for healing
  styleProfile?: string; // Track style for healing
}

interface UseAgentLoopOptions {
  onStreamCode: (prompt: string, existingCode?: string) => void;
  onCodeGenerated?: (code: string, summary: string) => void;
  onPlanGenerated?: (plan: Record<string, unknown>) => void;
  onComplete?: () => void;
  getActiveProjectId?: () => string | null;
  getUserId?: () => string | null;
}

const INITIAL_STATE: AgentState = {
  step: 'idle',
  logs: [],
  isRunning: false,
  lockedProjectId: null,
};

function createFreshState(): AgentState {
  return { ...INITIAL_STATE };
}

/**
 * VibeCoder 2.1 Agent Loop - Multi-Agent Orchestration
 * 
 * IMPROVEMENTS in v2.1:
 * - healCode() method for runtime error recovery
 * - Tracks lastGeneratedCode for healing context
 * - Direct connection to vibecoder-heal endpoint
 * 
 * Connects to the vibecoder-orchestrator edge function which chains:
 * 1. Architect Agent → Creates blueprint
 * 2. Builder Agent → Generates code
 * 3. Shadow Render → Transpilation check
 * 4. Linter Agent → Validates code
 * 5. Self-Heal Loop → Auto-fixes errors
 */
export function useAgentLoop({ 
  onStreamCode, 
  onCodeGenerated,
  onPlanGenerated,
  onComplete, 
  getActiveProjectId,
  getUserId,
}: UseAgentLoopOptions) {
  const [state, setState] = useState<AgentState>(INITIAL_STATE);
  const abortRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const addLog = useCallback((msg: string) => {
    setState(prev => ({ 
      ...prev, 
      logs: [...prev.logs, msg] 
    }));
  }, []);

  const setStep = useCallback((step: AgentStep) => {
    setState(prev => ({ ...prev, step }));
  }, []);

  /**
   * Starts the multi-agent orchestration pipeline
   */
  const startAgent = useCallback(async (
    prompt: string, 
    existingCode?: string, 
    projectId?: string,
    styleProfile?: string,
    skipArchitect?: boolean
  ) => {
    abortRef.current = false;
    
    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    
    const lockedId = projectId || getActiveProjectId?.() || null;
    const userId = getUserId?.() || null;
    
    if (!userId) {
      console.error('[AgentLoop] No user ID available');
      setState(prev => ({
        ...prev,
        step: 'error',
        error: 'User not authenticated',
        isRunning: false,
      }));
      return;
    }
    
    setState({ 
      step: skipArchitect ? 'building' : 'architect', 
      logs: ['> Initializing VibeCoder 2.1...'], 
      isRunning: true,
      lockedProjectId: lockedId,
      styleProfile: styleProfile || undefined,
    });

    try {
      // Get the orchestrator URL
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const orchestratorUrl = `${supabaseUrl}/functions/v1/vibecoder-orchestrator`;
      
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token;
      
      if (!authToken) {
        throw new Error('Not authenticated');
      }
      
      addLog('Connecting to orchestration pipeline...');
      
      // Start SSE connection to orchestrator
      const response = await fetch(orchestratorUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          prompt,
          currentCode: existingCode,
          styleProfile,
          userId,
          projectId: lockedId,
          skipArchitect,
        }),
        signal: abortControllerRef.current.signal,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Orchestrator error: ${errorText}`);
      }
      
      if (!response.body) {
        throw new Error('No response stream');
      }
      
      // Process SSE stream (robust against chunk-splitting)
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let buffer = '';
      let receivedAnyEvent = false;
      let receivedTerminalEvent = false; // code|error|complete

      while (true) {
        if (abortRef.current) {
          await reader.cancel();
          break;
        }

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
            const event = JSON.parse(jsonStr) as { type?: string };
            receivedAnyEvent = true;
            if (event.type === 'code' || event.type === 'error' || event.type === 'complete') {
              receivedTerminalEvent = true;
            }
            // @ts-expect-error - runtime event typing is handled in the callback
            handleOrchestratorEvent(event);
          } catch {
            // If JSON was cut mid-chunk, put it back and wait for more data
            buffer = `data: ${jsonStr}\n` + buffer;
            break;
          }
        }
      }

      // Flush remaining buffer at end (best-effort)
      if (!abortRef.current && buffer.trim()) {
        for (const raw of buffer.split('\n')) {
          const line = raw.endsWith('\r') ? raw.slice(0, -1) : raw;
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr || jsonStr === '[DONE]') continue;
          try {
            const event = JSON.parse(jsonStr) as { type?: string };
            receivedAnyEvent = true;
            if (event.type === 'code' || event.type === 'error' || event.type === 'complete') {
              receivedTerminalEvent = true;
            }
            // @ts-expect-error - runtime event typing is handled in the callback
            handleOrchestratorEvent(event);
          } catch {
            // ignore partial
          }
        }
      }

      // Fail-safe: stream ended without any terminal event -> surface explicit error
      if (!abortRef.current && receivedAnyEvent && !receivedTerminalEvent) {
        const msg = 'Generation ended unexpectedly (connection dropped). Please retry.';
        console.warn('[AgentLoop] ' + msg);
        setState(prev => ({
          ...prev,
          step: 'error',
          error: msg,
          errorType: 'api',
          errorDetails: { message: msg },
          isRunning: false,
        }));
        addLog(`! Error: ${msg}`);
      }
      
    } catch (err) {
      if (abortRef.current) return; // Ignore abort errors
      
      const message = err instanceof Error ? err.message : 'Agent crashed';
      console.error('[AgentLoop] Error:', err);
      setState(prev => ({
        ...prev,
        step: 'error',
        error: message,
        isRunning: false,
      }));
      addLog(`! Error: ${message}`);
    }
  }, [addLog, getActiveProjectId, getUserId]);
  
  /**
   * Handle events from the orchestrator SSE stream
   */
  const handleOrchestratorEvent = useCallback((event: {
    type: 'status' | 'log' | 'plan' | 'code' | 'error' | 'complete';
    step?: 'architect' | 'builder' | 'linter' | 'healing';
    data: unknown;
  }) => {
    switch (event.type) {
      case 'status': {
        const stepMap: Record<string, AgentStep> = {
          'architect': 'architect',
          'builder': 'building',
          'linter': 'linting',
          'healing': 'healing',
        };
        const newStep = event.step ? stepMap[event.step] || 'planning' : 'planning';
        setStep(newStep);
        
        const statusData = event.data as { message?: string };
        if (statusData?.message) {
          addLog(`> ${statusData.message}`);
        }
        break;
      }
      
      case 'log': {
        const logMsg = typeof event.data === 'string' ? event.data : String(event.data);
        addLog(logMsg);
        break;
      }
      
      case 'plan': {
        const plan = event.data as Record<string, unknown>;
        setState(prev => ({ ...prev, architectPlan: plan }));
        onPlanGenerated?.(plan);
        addLog('> Blueprint created');
        break;
      }
      
      case 'code': {
        const codeData = event.data as { code: string; summary?: string };
        setStep('verifying');
        addLog('> Code delivered');
        // Track last generated code for healing
        setState(prev => ({ ...prev, lastGeneratedCode: codeData.code }));
        onCodeGenerated?.(codeData.code, codeData.summary || 'Storefront generated.');
        break;
      }
      
      case 'error': {
        const errorData = event.data as { message?: string };
        const errorMsg = errorData?.message || 'Unknown error';
        const isCreditError = isCreditsError(errorMsg);
        
        setState(prev => ({
          ...prev,
          step: 'error',
          error: errorMsg,
          errorType: isCreditError ? 'credits' : 'unknown',
          errorDetails: isCreditError ? parseCreditsError(errorMsg) : { message: errorMsg },
          isRunning: false,
        }));
        addLog(`! Error: ${errorMsg}`);
        break;
      }
      
      case 'complete': {
        const completeData = event.data as { success: boolean; attempts?: number; creditsUsed?: number };
        setStep('done');
        addLog(`> Build complete (${completeData.attempts || 1} attempt${completeData.attempts !== 1 ? 's' : ''})`);
        if (completeData.creditsUsed) {
          addLog(`Credits used: ${completeData.creditsUsed}`);
        }
        setState(prev => ({ ...prev, isRunning: false, lockedProjectId: null }));
        onComplete?.();
        break;
      }
    }
  }, [setStep, addLog, onPlanGenerated, onCodeGenerated, onComplete]);

  /**
   * Legacy callback for streaming start (compatibility)
   */
  const onStreamingStart = useCallback(() => {
    if (state.step === 'building') {
      addLog('Code generation in progress...');
    }
  }, [state.step, addLog]);

  /**
   * Legacy callback for log updates (compatibility)
   */
  const onStreamLog = useCallback((logMessage: string) => {
    addLog(logMessage);
  }, [addLog]);

  /**
   * Legacy callback for streaming complete (compatibility)
   */
  const onStreamingComplete = useCallback(async () => {
    if (abortRef.current) return;
    
    const currentProjectId = getActiveProjectId?.();
    if (state.lockedProjectId && currentProjectId !== state.lockedProjectId) {
      console.warn(`🛑 Agent completion blocked: was for ${state.lockedProjectId} but now viewing ${currentProjectId}`);
      setState(INITIAL_STATE);
      return;
    }
    
    setStep('done');
    addLog('> Build successful.');
    
    setState(prev => ({ ...prev, isRunning: false, lockedProjectId: null }));
    onComplete?.();
  }, [setStep, addLog, onComplete, getActiveProjectId, state.lockedProjectId]);

  /**
   * Legacy callback for streaming error (compatibility)
   */
  const onStreamingError = useCallback((error: string) => {
    setState(prev => ({
      ...prev,
      step: 'error',
      error,
      isRunning: false,
    }));
    addLog(`! Error: ${error}`);
  }, [addLog]);

  /**
   * Trigger self-correction feedback (UI only)
   */
  const triggerSelfCorrection = useCallback(async (errorMsg: string) => {
    setStep('healing');
    addLog(`! Runtime error detected: ${errorMsg.slice(0, 100)}`);
    addLog('> Triggering self-correction...');
  }, [setStep, addLog]);

  /**
   * VibeCoder 2.1: Direct healing with runtime error context
   * 
   * Called when Sandpack crashes with a runtime error.
   * Goes directly to vibecoder-heal endpoint (skips Architect).
   * 
   * @param runtimeError - The actual error message from Sandpack
   * @param failedCode - The current code that crashed
   */
  const healCode = useCallback(async (runtimeError: string, failedCode: string) => {
    const userId = getUserId?.();
    const projectId = getActiveProjectId?.();
    
    if (!userId) {
      console.error('[AgentLoop] No user ID for healing');
      return;
    }
    
    abortRef.current = false;
    abortControllerRef.current = new AbortController();
    
    setState(prev => ({
      ...prev,
      step: 'healing',
      logs: [...prev.logs, '> Runtime error detected', '> Calling healing agent...'],
      isRunning: true,
      lockedProjectId: projectId || prev.lockedProjectId,
    }));
    
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const healUrl = `${supabaseUrl}/functions/v1/vibecoder-heal`;
      
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token;
      
      if (!authToken) {
        throw new Error('Not authenticated');
      }
      
      addLog('Sending to healing agent...');
      
      const response = await fetch(healUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          runtimeError,
          failedCode,
          styleProfile: state.styleProfile,
          architectPlan: state.architectPlan,
          userId,
        }),
        signal: abortControllerRef.current.signal,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Heal error: ${errorText}`);
      }
      
      if (!response.body) {
        throw new Error('No response stream');
      }
      
      // Process SSE stream from healing agent
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      
      while (true) {
        if (abortRef.current) {
          reader.cancel();
          break;
        }
        
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6);
          if (jsonStr === '[DONE]') continue;
          
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) fullContent += content;
          } catch {
            // Skip invalid JSON
          }
        }
      }
      
      // Extract code from response
      const beginIdx = fullContent.indexOf('/// BEGIN_CODE ///');
      let fixedCode = '';
      
      if (beginIdx >= 0) {
        fixedCode = fullContent.substring(beginIdx + '/// BEGIN_CODE ///'.length)
          .replace(/^```(?:tsx?|jsx?|javascript|typescript)?\s*\n?/i, '')
          .replace(/\n?```\s*$/i, '')
          .trim();
      } else {
        // Try to extract any code block
        const codeMatch = fullContent.match(/```(?:tsx?|jsx?)?\n([\s\S]+?)```/);
        fixedCode = codeMatch ? codeMatch[1].trim() : fullContent;
      }
      
      if (fixedCode && fixedCode.length > 50) {
        addLog('> Fix applied successfully');
        setState(prev => ({ ...prev, lastGeneratedCode: fixedCode }));
        onCodeGenerated?.(fixedCode, 'Applied runtime error fix.');
        setStep('done');
        setState(prev => ({ ...prev, isRunning: false }));
        onComplete?.();
      } else {
        throw new Error('Healing agent returned invalid code');
      }
      
    } catch (err) {
      if (abortRef.current) return;
      
      const message = err instanceof Error ? err.message : 'Healing failed';
      console.error('[AgentLoop] Heal error:', err);
      setState(prev => ({
        ...prev,
        step: 'error',
        error: message,
        isRunning: false,
      }));
      addLog(`! Healing failed: ${message}`);
    }
  }, [addLog, setStep, getUserId, getActiveProjectId, state.styleProfile, state.architectPlan, onCodeGenerated, onComplete]);

  /**
   * Cancel the current agent operation
   */
  const cancelAgent = useCallback(() => {
    abortRef.current = true;
    abortControllerRef.current?.abort();
    setState(createFreshState());
  }, []);

  /**
   * Reset agent to initial state
   */
  const resetAgent = useCallback(() => {
    abortRef.current = true;
    abortControllerRef.current?.abort();
    setState(createFreshState());
  }, []);

  /**
   * Unmount - wipes ALL hook memory
   */
  const unmountProject = useCallback(() => {
    console.log("🧹 [AgentLoop] Unmounting Project. Wiping hook memory.");
    abortRef.current = true;
    abortControllerRef.current?.abort();
    setState({
      ...createFreshState(),
      isRunning: false,
    });
  }, []);

  /**
   * Mount a specific project
   */
  const mountProject = useCallback((projectId: string) => {
    console.log(`🔒 [AgentLoop] Mounting hook to Project ID: ${projectId}`);
    abortRef.current = false;
    setState(prev => ({
      ...createFreshState(),
      lockedProjectId: projectId,
    }));
  }, []);

  return {
    agentState: state,
    startAgent,
    cancelAgent,
    resetAgent,
    healCode, // VibeCoder 2.1: Direct healing with runtime errors
    onStreamingStart,
    onStreamLog,
    onStreamingComplete,
    onStreamingError,
    triggerSelfCorrection,
    mountProject,
    unmountProject,
    // Expose individual pieces
    agentStep: state.step,
    agentLogs: state.logs,
    isAgentRunning: state.isRunning,
    lockedProjectId: state.lockedProjectId,
    architectPlan: state.architectPlan,
    lastGeneratedCode: state.lastGeneratedCode, // VibeCoder 2.1: Track for healing
    // Credit error handling
    agentError: state.error,
    agentErrorType: state.errorType,
    agentErrorDetails: state.errorDetails,
  };
}
