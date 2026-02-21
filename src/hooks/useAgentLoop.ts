import { useState, useCallback, useRef } from 'react';
import type { AgentStep } from '@/components/ai-builder/AgentProgress';
import type { StreamPhase } from '@/components/ai-builder/StreamingPhaseCard';

interface AgentState {
  step: AgentStep;
  logs: string[];
  isRunning: boolean;
  error?: string;
  lockedProjectId: string | null;
  generationStartTime: number | null;
  // NEW: Phase-based streaming state
  streamPhase: StreamPhase;
  analysisText: string;
  planItems: string[];
  completedPlanItems: number;
  summaryText: string;
}

interface UseAgentLoopOptions {
  onStreamCode: (prompt: string, existingCode?: string, jobId?: string) => void;
  onComplete?: () => void;
  getActiveProjectId?: () => string | null;
}

const INITIAL_STATE: AgentState = {
  step: 'idle',
  logs: [],
  isRunning: false,
  lockedProjectId: null,
  generationStartTime: null,
  streamPhase: 'idle',
  analysisText: '',
  planItems: [],
  completedPlanItems: 0,
  summaryText: '',
};

function createFreshState(): AgentState {
  return { ...INITIAL_STATE };
}

/**
 * Agent orchestration hook - NOW driven by real SSE phase events.
 * No more fake delays. Every phase transition comes from actual AI output.
 */
export function useAgentLoop({ onStreamCode, onComplete, getActiveProjectId }: UseAgentLoopOptions) {
  const [state, setState] = useState<AgentState>(INITIAL_STATE);
  const abortRef = useRef(false);
  const streamStartedRef = useRef(false);
  const hardLockRef = useRef<string | null>(null);

  const addLog = useCallback((msg: string) => {
    const currentProjectId = getActiveProjectId?.();
    if (hardLockRef.current && hardLockRef.current !== currentProjectId) {
      return;
    }
    setState(prev => ({ ...prev, logs: [...prev.logs, msg] }));
  }, [getActiveProjectId]);

  const setStep = useCallback((step: AgentStep) => {
    setState(prev => ({ ...prev, step }));
  }, []);

  /**
   * Starts the agent loop - immediately shows "Analyzing" and triggers code generation.
   * All subsequent phase transitions come from real SSE events.
   */
  const startAgent = useCallback(async (prompt: string, existingCode?: string, projectId?: string, jobId?: string) => {
    abortRef.current = false;
    streamStartedRef.current = false;
    
    const lockedId = projectId || getActiveProjectId?.() || null;
    
    setState({ 
      step: 'writing',
      logs: ['> Starting generation...'], 
      isRunning: true,
      lockedProjectId: lockedId,
      generationStartTime: Date.now(),
      // Start in analyzing phase immediately
      streamPhase: 'analyzing',
      analysisText: '',
      planItems: [],
      completedPlanItems: 0,
      summaryText: '',
    });

    try {
      addLog(`Received prompt: "${prompt.slice(0, 50)}${prompt.length > 50 ? '...' : ''}"`);
      
      // Trigger actual streaming immediately - no fake delays
      streamStartedRef.current = true;
      onStreamCode(prompt, existingCode, jobId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Agent crashed';
      setState(prev => ({
        ...prev,
        step: 'error',
        error: message,
        isRunning: false,
        streamPhase: 'idle',
      }));
      addLog(`! Error: ${message}`);
    }
  }, [addLog, onStreamCode, getActiveProjectId]);

  // ═══════════════════════════════════════════════════════════
  // NEW: Phase-based callbacks from structured SSE events
  // ═══════════════════════════════════════════════════════════

  /** Called when SSE emits a phase change event */
  const onPhaseChange = useCallback((phase: string) => {
    const phaseMap: Record<string, StreamPhase> = {
      analyzing: 'analyzing',
      planning: 'planning',
      building: 'building',
      validating: 'building',    // show as building until validated
      repairing: 'building',     // show as building during repair
      complete: 'complete',
    };
    const streamPhase = phaseMap[phase] || 'analyzing';
    
    setState(prev => ({ ...prev, streamPhase }));
    
    // Map to legacy agent steps for backward compat
    if (phase === 'building') setStep('writing');
    if (phase === 'complete') {
      setStep('done');
      setState(prev => ({ ...prev, isRunning: false, lockedProjectId: null }));
      onComplete?.();
    }
    
    addLog(`> Phase: ${phase}`);
  }, [setStep, addLog, onComplete]);

  /** Called when SSE emits analysis text */
  const onAnalysis = useCallback((text: string) => {
    setState(prev => ({ ...prev, analysisText: text }));
  }, []);

  /** Called when SSE emits plan items */
  const onPlanItems = useCallback((items: string[]) => {
    setState(prev => ({ ...prev, planItems: items }));
  }, []);

  /** Called when SSE emits summary text */
  const onStreamSummary = useCallback((text: string) => {
    setState(prev => ({ ...prev, summaryText: text }));
  }, []);

  // ═══════════════════════════════════════════════════════════
  // Existing callbacks (kept for backward compat)
  // ═══════════════════════════════════════════════════════════

  const onStreamingStart = useCallback(() => {
    if (state.step === 'writing') {
      addLog('Code generation in progress...');
    }
  }, [state.step, addLog]);

  const onStreamLog = useCallback((logMessage: string) => {
    addLog(logMessage);
  }, [addLog]);

  const onStreamingComplete = useCallback(async () => {
    if (abortRef.current) return;
    
    const currentProjectId = getActiveProjectId?.();
    if (state.lockedProjectId && currentProjectId !== state.lockedProjectId) {
      console.warn(`🛑 Agent completion blocked: was for ${state.lockedProjectId} but now viewing ${currentProjectId}`);
      setState(INITIAL_STATE);
      return;
    }
    
    // If we already got a 'complete' phase event, skip legacy steps
    if (state.streamPhase === 'complete') {
      return;
    }
    
    // Legacy fallback: mark as done
    setStep('done');
    addLog('> Build successful.');
    setState(prev => ({ 
      ...prev, 
      isRunning: false, 
      lockedProjectId: null,
      streamPhase: 'complete',
    }));
    onComplete?.();
  }, [setStep, addLog, onComplete, getActiveProjectId, state.lockedProjectId, state.streamPhase]);

  const onStreamingError = useCallback((error: string) => {
    setState(prev => ({
      ...prev,
      step: 'error',
      error,
      isRunning: false,
      streamPhase: 'idle',
    }));
    addLog(`! Error: ${error}`);
  }, [addLog]);

  const triggerSelfCorrection = useCallback(async (errorMsg: string) => {
    setStep('verifying');
    addLog(`! Runtime error detected: ${errorMsg.slice(0, 100)}`);
    addLog('> Triggering self-correction...');
  }, [setStep, addLog]);

  const cancelAgent = useCallback(() => {
    abortRef.current = true;
    setState(createFreshState());
  }, []);

  const resetAgent = useCallback(() => {
    abortRef.current = true;
    setState(createFreshState());
  }, []);

  const unmountProject = useCallback(() => {
    console.log("🧹 [AgentLoop] Unmounting Project. Wiping hook memory.");
    abortRef.current = true;
    streamStartedRef.current = false;
    setState({ ...createFreshState(), isRunning: false });
  }, []);

  const mountProject = useCallback((projectId: string) => {
    console.log(`🔒 [AgentLoop] Mounting hook to Project ID: ${projectId}`);
    abortRef.current = false;
    streamStartedRef.current = false;
    setState(prev => ({ ...createFreshState(), lockedProjectId: projectId }));
  }, []);

  return {
    agentState: state,
    startAgent,
    cancelAgent,
    resetAgent,
    onStreamingStart,
    onStreamLog,
    onStreamingComplete,
    onStreamingError,
    triggerSelfCorrection,
    // Scorched Earth pattern
    mountProject,
    unmountProject,
    // NEW: Phase-based callbacks
    onPhaseChange,
    onAnalysis,
    onPlanItems,
    onStreamSummary,
    // Expose individual pieces
    agentStep: state.step,
    agentLogs: state.logs,
    isAgentRunning: state.isRunning,
    lockedProjectId: state.lockedProjectId,
    // NEW: Phase streaming data
    streamPhase: state.streamPhase,
    analysisText: state.analysisText,
    planItems: state.planItems,
    completedPlanItems: state.completedPlanItems,
    summaryText: state.summaryText,
  };
}
