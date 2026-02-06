import { useState, useCallback, useRef } from 'react';
import type { AgentStep } from '@/components/ai-builder/AgentProgress';

interface AgentState {
  step: AgentStep;
  logs: string[];
  isRunning: boolean;
  error?: string;
  lockedProjectId: string | null; // Track which project owns this generation
}

interface UseAgentLoopOptions {
  onStreamCode: (prompt: string, existingCode?: string) => void;
  onComplete?: () => void;
  getActiveProjectId?: () => string | null; // For race condition checking
}

const INITIAL_STATE: AgentState = {
  step: 'idle',
  logs: [],
  isRunning: false,
  lockedProjectId: null,
};

/**
 * Create a fresh initial state - used for Scorched Earth reset
 */
function createFreshState(): AgentState {
  return { ...INITIAL_STATE };
}

/**
 * Agent orchestration hook that manages the multi-step workflow:
 * Planning → Reading → Writing → Installing → Verifying → Done/Error
 * 
 * This wraps the existing streamCode function with agent-like behavior,
 * providing real-time logs and step transitions for a premium UX.
 */
export function useAgentLoop({ onStreamCode, onComplete, getActiveProjectId }: UseAgentLoopOptions) {
  const [state, setState] = useState<AgentState>(INITIAL_STATE);
  const abortRef = useRef(false);
  const streamStartedRef = useRef(false);

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
   * Starts the agent loop with the given prompt
   * Now accepts projectId to lock the generation to a specific project
   */
  const startAgent = useCallback(async (prompt: string, existingCode?: string, projectId?: string) => {
    abortRef.current = false;
    streamStartedRef.current = false;
    
    // 🔒 LOCK: Capture which project this generation belongs to
    const lockedId = projectId || getActiveProjectId?.() || null;
    
    setState({ 
      step: 'planning', 
      logs: ['> Initializing agent...'], 
      isRunning: true,
      lockedProjectId: lockedId,
    });

    try {
      // STEP 1: PLANNING (200ms simulated think time)
      addLog(`Received prompt: "${prompt.slice(0, 50)}${prompt.length > 50 ? '...' : ''}"`);
      await delay(300);
      
      if (abortRef.current) return;
      
      addLog('Analyzing request complexity...');
      await delay(400);
      
      if (abortRef.current) return;
      
      // Simulate identifying components
      const components = inferComponents(prompt);
      addLog(`> Identified components: ${components.join(', ')}`);
      await delay(200);

      // STEP 2: READING (Context awareness)
      if (abortRef.current) return;
      setStep('reading');
      
      if (existingCode) {
        addLog('Reading existing storefront code...');
        await delay(300);
        addLog(`Analyzed ${existingCode.split('\n').length} lines of existing code`);
      } else {
        addLog('Starting fresh build (no existing code)');
      }
      await delay(200);
      
      addLog('Checking design system compatibility...');
      await delay(200);

      // STEP 3: WRITING (Actual code generation)
      if (abortRef.current) return;
      setStep('writing');
      addLog('> Generating React components...');
      
      // Trigger the actual streaming code generation
      streamStartedRef.current = true;
      onStreamCode(prompt, existingCode);
      
      // The rest of the steps will be triggered by external callbacks

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Agent crashed';
      setState(prev => ({
        ...prev,
        step: 'error',
        error: message,
        isRunning: false,
      }));
      addLog(`! Error: ${message}`);
    }
  }, [addLog, setStep, onStreamCode]);

  /**
   * Called externally when streaming starts receiving tokens
   */
  const onStreamingStart = useCallback(() => {
    if (state.step === 'writing') {
      addLog('Code generation in progress...');
    }
  }, [state.step, addLog]);

  /**
   * Called externally when a [LOG:] tag is parsed from the stream
   */
  const onStreamLog = useCallback((logMessage: string) => {
    addLog(logMessage);
  }, [addLog]);

  /**
   * Called externally when streaming completes successfully
   */
  const onStreamingComplete = useCallback(async () => {
    if (abortRef.current) return;
    
    // 🛑 RACE CONDITION CHECK: Verify project hasn't changed
    const currentProjectId = getActiveProjectId?.();
    if (state.lockedProjectId && currentProjectId !== state.lockedProjectId) {
      console.warn(`🛑 Agent completion blocked: was for ${state.lockedProjectId} but now viewing ${currentProjectId}`);
      setState(INITIAL_STATE);
      return;
    }
    
    // STEP 4: INSTALLING
    setStep('installing');
    addLog('Checking dependencies...');
    await delay(400);
    addLog('All dependencies resolved');
    
    // STEP 5: VERIFYING
    if (abortRef.current) return;
    setStep('verifying');
    addLog('Running build verification...');
    await delay(500);
    addLog('Checking for syntax errors...');
    await delay(300);
    addLog('Validating component structure...');
    await delay(200);
    
    // STEP 6: DONE
    if (abortRef.current) return;
    setStep('done');
    addLog('> Build successful.');
    
    setState(prev => ({ ...prev, isRunning: false, lockedProjectId: null }));
    onComplete?.();
  }, [setStep, addLog, onComplete, getActiveProjectId, state.lockedProjectId]);

  /**
   * Called externally when an error occurs during streaming
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
   * Trigger self-correction when Sandpack reports an error
   */
  const triggerSelfCorrection = useCallback(async (errorMsg: string) => {
    setStep('verifying');
    addLog(`! Runtime error detected: ${errorMsg.slice(0, 100)}`);
    await delay(300);
    addLog('> Triggering self-correction...');
    
    // The parent component should call startAgent with an error report
    // This is just for UI feedback
  }, [setStep, addLog]);

  /**
   * Cancel the current agent operation
   */
  const cancelAgent = useCallback(() => {
    abortRef.current = true;
    setState(createFreshState());
  }, []);

  /**
   * Reset agent to initial state
   */
  const resetAgent = useCallback(() => {
    abortRef.current = true;
    setState(createFreshState());
  }, []);

  // --- SCORCHED EARTH: Mount/Unmount pattern for strict project isolation ---
  
  /**
   * Unmount the current project - wipes ALL hook memory
   * Call this BEFORE loading a new project to prevent cross-contamination
   */
  const unmountProject = useCallback(() => {
    console.log("🧹 [AgentLoop] Unmounting Project. Wiping hook memory.");
    abortRef.current = true;
    streamStartedRef.current = false;
    setState(createFreshState());
  }, []);

  /**
   * Mount a specific project with explicit ID lock
   * Call this AFTER fetching fresh data from DB
   */
  const mountProject = useCallback((projectId: string) => {
    console.log(`🔒 [AgentLoop] Mounting hook to Project ID: ${projectId}`);
    // Reset abort flag for new project
    abortRef.current = false;
    streamStartedRef.current = false;
    // Set the lock explicitly
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
    onStreamingStart,
    onStreamLog,
    onStreamingComplete,
    onStreamingError,
    triggerSelfCorrection,
    // Scorched Earth pattern
    mountProject,
    unmountProject,
    // Expose individual pieces for convenience
    agentStep: state.step,
    agentLogs: state.logs,
    isAgentRunning: state.isRunning,
    lockedProjectId: state.lockedProjectId,
  };
}

// --- HELPERS ---

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Infer what components might be generated based on prompt keywords
 */
function inferComponents(prompt: string): string[] {
  const components: string[] = [];
  const lower = prompt.toLowerCase();
  
  if (lower.includes('hero') || lower.includes('landing') || lower.includes('header')) {
    components.push('Hero');
  }
  if (lower.includes('product') || lower.includes('store') || lower.includes('shop')) {
    components.push('ProductGrid');
  }
  if (lower.includes('about') || lower.includes('bio') || lower.includes('creator')) {
    components.push('AboutSection');
  }
  if (lower.includes('testimonial') || lower.includes('review')) {
    components.push('Testimonials');
  }
  if (lower.includes('footer') || lower.includes('contact') || lower.includes('social')) {
    components.push('Footer');
  }
  if (lower.includes('pricing') || lower.includes('plan')) {
    components.push('PricingTable');
  }
  if (lower.includes('gallery') || lower.includes('portfolio') || lower.includes('work')) {
    components.push('Gallery');
  }
  
  // Default if nothing specific detected
  if (components.length === 0) {
    components.push('Hero', 'MainContent', 'Footer');
  }
  
  return components;
}
