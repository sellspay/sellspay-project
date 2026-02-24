import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useThumbnailCapture } from './hooks/useThumbnailCapture';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAIBuilderOnboarding } from './AIBuilderOnboarding';
import { VibecoderPreview } from './VibecoderPreview';
import { VibecoderChat } from './VibecoderChat';
import { ProjectSidebar } from './ProjectSidebar';
import { PreviewErrorBoundary } from './PreviewErrorBoundary';
import { VibecoderHeader } from './VibecoderHeader';
import { useStreamingCode } from './useStreamingCode';
import { useVibecoderProjects, type VibecoderMessage } from './hooks/useVibecoderProjects';
import { useAgentLoop } from '@/hooks/useAgentLoop';
import type { GenerationJob } from '@/hooks/useBackgroundGeneration';
import { useDataAvailabilityCheck } from './hooks/useDataAvailabilityCheck';
import { GenerationCanvas } from './GenerationCanvas';
import { ProductsPanel } from './ProductsPanel';
import { SubscriptionsPanel } from './SubscriptionsPanel';
import { DesignPanel } from './DesignPanel';
import { PlacementPromptModal } from './PlacementPromptModal';
import { ChatInputBar } from './ChatInputBar';
import { AI_MODELS, type AIModel } from './ChatInputBar';
import type { GeneratedAsset, ViewMode } from './types/generation';
import { parseRoutesFromCode, type SitePage } from '@/utils/routeParser';
import { toast } from 'sonner';
import { nukeSandpackCache, clearProjectLocalStorage } from '@/utils/storageNuke';
import { LovableHero } from './LovableHero';
import { useSubscription } from '@/hooks/useSubscription';
import { useUserCredits } from '@/hooks/useUserCredits';

import { FixErrorToast } from './FixErrorToast';
import { GenerationOverlay } from './GenerationOverlay';
import { checkPolicyViolation } from '@/utils/policyGuard';
import { useBackgroundGenerationController } from './hooks/useBackgroundGenerationController';
import { useCreativeStudio } from './hooks/useCreativeStudio';
import { useProjectHydration } from './hooks/useProjectHydration';

interface AIBuilderCanvasProps {
  profileId: string;
  hasPremiumAccess?: boolean;
}

export function AIBuilderCanvas({ profileId, hasPremiumAccess = false }: AIBuilderCanvasProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isPublished, setIsPublished] = useState(false);
  const [hasUnpublishedChanges, setHasUnpublishedChanges] = useState(false);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  const { plan: subscriptionTier } = useSubscription();
  const { credits: userCredits, refetch: refetchCredits } = useUserCredits();
  const { needsOnboarding, completeOnboarding } = useAIBuilderOnboarding(profileId);
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Thumbnail capture: debounce timer ref
  const captureTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  

  // Once the app is "booted", never show the full-screen loading screen again.
  // This prevents random re-appearance during background refetches (messages/projects).
  const [hasBooted, setHasBooted] = useState(false);

  // Reset key to force component re-mount on project deletion
  const [resetKey, setResetKey] = useState(0);

  // Prevent Sandpack's brief bundling/error flash after streaming completes
  const [isAwaitingPreviewReady, setIsAwaitingPreviewReady] = useState(false);

  // View mode state (Preview vs Code vs Image vs Video)
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');
  
  // LIFTED STATE: Active model from ChatInputBar
  const [activeModel, setActiveModel] = useState<AIModel>(AI_MODELS.code[0]);
  
  // THEME STATE: Now managed by ThemeProvider — see src/lib/theme/theme-context.tsx
  // Legacy activeStyle kept as a derived value for components that still need StylePreset format
  const [designInput, setDesignInput] = useState('');
  const [visualEditMode, setVisualEditMode] = useState(false);
  const [selectedElement, setSelectedElement] = useState<import('./VisualEditOverlay').SelectedElement | null>(null);

  // Auto-disable visual edit mode when leaving design view
  useEffect(() => {
    if (viewMode !== 'design') {
      setVisualEditMode(false);
      setSelectedElement(null);
    }
  }, [viewMode]);
  
  // Listen for element selection from iframe (visual edit mode)
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'VIBECODER_ELEMENT_SELECTED') {
        setSelectedElement(event.data.element);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  // Creative Studio state - most logic extracted to useCreativeStudio (declared after handleSendMessage)
  const [showPlacementModal, setShowPlacementModal] = useState(false);
  // Premium upgrade modal state
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  // Hard refresh state for fixing white screen of death
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Page navigation state for storefront preview
  const [previewPath, setPreviewPath] = useState("/");
  
  // Per-project guard to prevent double-firing agent on mount with location state
  // Stores the project ID for which we've already triggered the initial prompt
  const startedInitialForProjectRef = useRef<string | null>(null);
  
  // 🚧 DEFERRED HERO PROMPT: When heroOnStart creates a new project, the prompt is
  // stored here and dispatched by a useEffect once the project is fully hydrated.
  const deferredHeroPromptRef = useRef<{ prompt: string; aiPrompt?: string } | null>(null);
  
  // 🔒 GENERATION LOCK: Captures the project ID when generation starts
  // Prevents race condition where AI writes to wrong project if user switches mid-generation
  const generationLockRef = useRef<string | null>(null);

  // 🧾 JOB BACKING: When set, this generation is persisted via ai_generation_jobs.
  // In that case, we must NOT also append assistant messages from streaming callbacks,
  // otherwise we’ll duplicate responses.
  const activeJobIdRef = useRef<string | null>(null);
  
  // 📝 PENDING SUMMARY: Captures the AI's natural language response during streaming
  const pendingSummaryRef = useRef<string>('');
  
  // Handle model change with auto-tab switching
  const handleModelChange = useCallback((model: AIModel) => {
    setActiveModel(model);
    
    // Auto-switch to the appropriate tab when selecting a model
    if (model.category === 'image') setViewMode('image');
    else if (model.category === 'video') setViewMode('video');
    // For code models, switch to preview if currently on image/video tab
    else if (viewMode === 'image' || viewMode === 'video') setViewMode('preview');
  }, [viewMode]);
  
  // Resizable sidebar state
  const [sidebarWidth, setSidebarWidth] = useState(400);
  const [chatCollapsed, setChatCollapsed] = useState(false);
  const isDraggingRef = useRef(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const handleDotRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  
  // Drag handlers — use refs + direct DOM for zero-lag resize
  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'ew-resize';
    // Disable CSS transition during drag — this is the key perf fix
    if (sidebarRef.current) sidebarRef.current.style.transition = 'none';
    // Show overlay to prevent iframe stealing events
    if (overlayRef.current) overlayRef.current.style.display = 'block';
    // Visual feedback on handle
    if (handleRef.current) {
      handleRef.current.classList.add('bg-blue-500/60');
      handleRef.current.classList.remove('bg-transparent');
    }
    if (handleDotRef.current) handleDotRef.current.classList.add('bg-blue-400');
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth > 300 && newWidth < 800) {
        if (sidebarRef.current) sidebarRef.current.style.width = `${newWidth}px`;
        // Store for React state sync on mouseup
        (isDraggingRef as any)._lastWidth = newWidth;
      }
    };
    const onMouseUp = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      // Re-enable CSS transition for collapse/expand animations
      if (sidebarRef.current) sidebarRef.current.style.transition = '';
      if (overlayRef.current) overlayRef.current.style.display = 'none';
      if (handleRef.current) {
        handleRef.current.classList.remove('bg-blue-500/60');
        handleRef.current.classList.add('bg-transparent');
      }
      if (handleDotRef.current) handleDotRef.current.classList.remove('bg-blue-400');
      const lastWidth = (isDraggingRef as any)._lastWidth;
      if (lastWidth) setSidebarWidth(lastWidth);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);
  
  // Project management
  const {
    projects,
    activeProjectId,
    activeProject,
    messages,
    loading: projectsLoading,
    messagesLoading,
    createProject,
    ensureProject,
    deleteProject,
    renameProject,
    selectProject,
    clearActiveProject,
    addMessage,
    rateMessage,
    getLastCodeSnapshot,
    getLastFilesSnapshot,
    getPreviousCodeSnapshot,
    restoreToVersion,
    canUndo,
    undoLastChange,
    toggleStar,
  } = useVibecoderProjects();
  
  // Theme persistence is now handled by ThemeProvider — no manual localStorage here

  // Chat response state for intent router
  const [chatResponse, setChatResponse] = useState<string | null>(null);
  
  // Live steps state for real-time transparency (legacy fallback)
  const [liveSteps, setLiveSteps] = useState<string[]>([]);

  // Preview error state (Sandpack compile/runtime)
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [consoleErrors, setConsoleErrors] = useState<string[]>([]);
  const [showFixToast, setShowFixToast] = useState(false);
  const lastPreviewErrorRef = useRef<string | null>(null);
  
  // 📋 PLAN MODE STATE
  const [isPlanMode, setIsPlanMode] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<{ plan: import('./useStreamingCode').PlanData; originalPrompt: string } | null>(null);
  
  // 📊 DATA AVAILABILITY CHECK: Detects missing subscriptions/products after generation
  const { checkDataAvailability } = useDataAvailabilityCheck(profileId);
  // Track the last user prompt for data availability checking
  const lastUserPromptRef = useRef<string>('');
  
  // 🔧 GHOST FIXER + BACKGROUND GENERATION: Extracted to useBackgroundGenerationController
  // (declared after useAgentLoop provides onStreamingComplete/onStreamingError — see below)
  
  // Ref to hold setCode function for Ghost Fixer callback
  const setCodeRef = useRef<((code: string) => void) | null>(null);

  // DB-driven guardrail mode: populated by useProjectHydration, consumed by useStreamingCode
  const hasDbSnapshotRef = useRef(false);
  
  // Ref to bridge phase callbacks (useAgentLoop declared after useStreamingCode)
  const phaseCallbacksRef = useRef<{
    onPhaseChange?: (phase: string) => void;
    onAnalysis?: (text: string) => void;
    onPlanItems?: (items: string[]) => void;
    onStreamSummary?: (text: string) => void;
    onConfidence?: (score: number, reason: string) => void;
    onCodeProgress?: (bytes: number, elapsed: number) => void;
    onSuggestions?: (suggestions: Array<{ label: string; prompt: string }>) => void;
    onQuestions?: (questions: Array<{ id: string; label: string; type: 'single' | 'multi'; options: Array<{ value: string; label: string }> }>, enhancedPromptSeed?: string) => void;
  }>({});

  // Ref to capture latest phase data for persisting in messages
  const latestPhaseDataRef = useRef<{
    analysisText?: string;
    planItems?: string[];
    summaryText?: string;
    confidenceScore?: number;
    confidenceReason?: string;
    elapsedSeconds?: number;
  }>({});

  const { 
    code, 
    files,
    isStreaming, 
    streamCode, 
    cancelStream, 
    resetCode,
    setCode,
    setFiles,
    forceResetStreaming,
    getLastValidSnapshot,
    DEFAULT_CODE 
  } = useStreamingCode({
    activeProjectId,
    hasDbSnapshotRef,
    onPhaseChange: (phase) => {
      // Reset phase data at the start of a new generation
      if (phase === 'analyzing') {
        latestPhaseDataRef.current = {};
      }
      phaseCallbacksRef.current.onPhaseChange?.(phase);
    },
    onAnalysis: (text) => {
      phaseCallbacksRef.current.onAnalysis?.(text);
      latestPhaseDataRef.current.analysisText = text;
    },
    onPlanItems: (items) => {
      phaseCallbacksRef.current.onPlanItems?.(items);
      latestPhaseDataRef.current.planItems = items;
    },
    onStreamSummary: (text) => {
      phaseCallbacksRef.current.onStreamSummary?.(text);
      latestPhaseDataRef.current.summaryText = text;
    },
    onConfidence: (score, reason) => {
      phaseCallbacksRef.current.onConfidence?.(score, reason);
      latestPhaseDataRef.current.confidenceScore = score;
      latestPhaseDataRef.current.confidenceReason = reason;
    },
    onCodeProgress: (bytes, elapsed) => phaseCallbacksRef.current.onCodeProgress?.(bytes, elapsed),
    onSuggestions: (suggestions) => phaseCallbacksRef.current.onSuggestions?.(suggestions),
    onQuestions: (questions, seed) => phaseCallbacksRef.current.onQuestions?.(questions, seed),
    // 🛑 RACE CONDITION GUARD: Check if generation should be discarded
    shouldAbort: () => {
      if (generationLockRef.current && generationLockRef.current !== activeProjectId) {
        console.warn(`🛑 BLOCKED: Generation for ${generationLockRef.current} but viewing ${activeProjectId}`);
        return true;
      }
      return false;
    },
    // 📦 PRODUCTS CONTEXT: Fetch real products for AI to use
    getProductsContext: async () => {
      const { data: products } = await supabase
        .from('products')
        .select('id, name, price_cents, pricing_type, product_type, cover_image_url')
        .eq('creator_id', profileId)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(20);

      if (!products || products.length === 0) return [];

      return products.map(p => ({
        id: p.id,
        name: p.name,
        price: p.pricing_type === 'free' || !p.price_cents 
          ? 'Free' 
          : `$${(p.price_cents / 100).toFixed(2)}`,
        type: p.product_type,
        image: p.cover_image_url,
      }));
    },
    // 💬 CONVERSATION HISTORY: Pass recent messages for pronoun resolution
    getConversationHistory: () => {
      // Get last 6 messages (3 exchanges) for context
      return messages.slice(-6).map(m => ({
        role: m.role,
        content: m.content
      }));
    },
    onLogUpdate: (logs) => {
      // Update live steps in real-time as they stream in
      setLiveSteps(logs);
      // Also forward to agent loop for logging
      logs.forEach(log => onStreamLog(log));
    },
    onSummary: (summary: string) => {
      // Capture the AI's natural language response during streaming
      console.log('[Vibecoder] 📝 AI Summary received:', summary?.substring(0, 100));
      pendingSummaryRef.current = summary;
    },
    onComplete: async (finalCode) => {
      // Clear live steps
      setLiveSteps([]);

      // If this run is backed by a background job, do NOT append assistant messages here.
      // The realtime job completion handler will add the final summary + code snapshot.
      if (activeJobIdRef.current) {
        console.log('[Vibecoder] Job-backed run: skipping streaming onComplete message append');
        pendingSummaryRef.current = '';
        return;
      }

      // 🛑 DOUBLE-CHECK: Verify lock before saving (belt + suspenders)
      if (generationLockRef.current && generationLockRef.current !== activeProjectId) {
        console.warn('🛑 Discarded code: Project mismatch on completion');
        generationLockRef.current = null;
        pendingSummaryRef.current = '';
        resetAgent();
        return;
      }

      // Use the REAL AI summary, or fallback if empty
      let capturedSummary = pendingSummaryRef.current;
      console.log('[Vibecoder] 💬 Final summary for message:', capturedSummary?.substring(0, 150) || '(empty - using fallback)');
      
      // 📊 DATA AVAILABILITY CHECK: Append guidance if user needs to set up data
      if (lastUserPromptRef.current) {
        try {
          const dataGuidance = await checkDataAvailability(lastUserPromptRef.current);
          if (dataGuidance) {
            capturedSummary = (capturedSummary || '') + dataGuidance;
            console.log('[Vibecoder] Added data availability guidance to response');
          }
        } catch (e) {
          console.warn('[Vibecoder] Data availability check failed:', e);
        }
      }
      
      const aiResponse = capturedSummary || 'Updated the storefront based on your request.';
      pendingSummaryRef.current = ''; // Reset for next generation

      // Add assistant message with code snapshot + files snapshot (project-scoped)
      // Pass the locked project ID explicitly for safety
      // Capture current files state for multi-file persistence
      const currentFiles = Object.keys(files).length > 0 ? files : undefined;
      // Persist streaming phase data (analysis/plan/building) in the message for chat history
      const phaseMetaData = latestPhaseDataRef.current;
      const hasPhaseData = phaseMetaData.analysisText || (phaseMetaData.planItems && phaseMetaData.planItems.length > 0);
      await addMessage(
        'assistant', aiResponse, finalCode,
        generationLockRef.current || undefined, currentFiles,
        hasPhaseData ? { streamPhase: { ...phaseMetaData } } : undefined,
      );

      // Update last_success_at on the project
      const successProjectId = generationLockRef.current || activeProjectId;
      if (successProjectId) {
        supabase
          .from('vibecoder_projects')
          .update({ last_success_at: new Date().toISOString() })
          .eq('id', successProjectId)
          .then(({ error }) => {
            if (error) console.warn('[Vibecoder] Failed to update last_success_at:', error);
          });
      }

      // Release the lock
      generationLockRef.current = null;

      // 📸 Trigger thumbnail capture after successful generation
      if (captureTimerRef.current) clearTimeout(captureTimerRef.current);
      captureTimerRef.current = setTimeout(() => { requestCapture(); }, 3000);

      // Notify agent loop that streaming is complete
      onStreamingComplete();
    },
    onChatResponse: async (text) => {
      // If this run is job-backed, the job completion handler will add the final summary.
      if (activeJobIdRef.current) {
        console.log('[Vibecoder] Job-backed run: skipping streaming onChatResponse append');
        setLiveSteps([]);
        setChatResponse(text);
        return;
      }

      // AI responded with a chat message instead of code
      setLiveSteps([]);
      setChatResponse(text);
      await addMessage('assistant', text, undefined, generationLockRef.current || undefined);
      generationLockRef.current = null; // Release lock
      // Reset agent on chat response (no code generated)
      resetAgent();
    },
    onPlanResponse: async (plan, originalPrompt) => {
      // If this run is job-backed, the job completion handler will surface the plan.
      if (activeJobIdRef.current) {
        console.log('[Vibecoder] Job-backed run: skipping streaming onPlanResponse append');
        setLiveSteps([]);
        setPendingPlan({ plan, originalPrompt });
        setIsPlanMode(false);
        return;
      }

      // AI returned a plan for user approval
      setLiveSteps([]);
      setPendingPlan({ plan, originalPrompt });
      // Add a message to show the plan was generated
      await addMessage('assistant', `I've created a plan for: "${plan.title}". Please review and approve it to proceed.`, undefined, generationLockRef.current || undefined);
      generationLockRef.current = null; // Release lock
      // Turn off plan mode now that we have a plan
      setIsPlanMode(false);
      resetAgent();
    },
    onError: (err) => {
      setLiveSteps([]);
      generationLockRef.current = null; // Release lock on error
      
      // Handle credit-specific errors with actionable UI
      if (err.message.includes('INSUFFICIENT_CREDITS')) {
        toast.error('Not enough credits for this generation.', {
          action: {
            label: 'Top Up',
            onClick: () => window.open('/billing', '_blank'),
          },
        });
        refetchCredits(); // Sync display with actual balance
      } else {
        toast.error(err.message);
      }
      onStreamingError(err.message);
    },
    // 🔧 GHOST FIXER TRIGGER: Called when truncation is detected (missing sentinel)
    onTruncationDetected: async (truncatedCode, originalPrompt) => {
      console.log('[AIBuilderCanvas] ⚠️ Truncation detected - triggering Ghost Fixer');
      console.log('[AIBuilderCanvas] Truncated code length:', truncatedCode.length);
      
      // Trigger the Ghost Fixer to continue from where the AI left off
      const recoveredCode = await ghostFixer.triggerContinuation(truncatedCode, originalPrompt);
      
      if (recoveredCode && setCodeRef.current) {
        console.log('[AIBuilderCanvas] ✅ Applying recovered code from Ghost Fixer');
        setCodeRef.current(recoveredCode);
      }
    }
  });

  // Track unpublished changes: any code change after initial load marks dirty
  const publishedCodeRef = useRef<string | null>(null);
  useEffect(() => {
    if (!loading && code && code !== DEFAULT_CODE) {
      // On first meaningful code load, capture the baseline
      if (publishedCodeRef.current === null) {
        publishedCodeRef.current = code;
        return;
      }
      // If code differs from what was last published/loaded, mark as changed
      if (code !== publishedCodeRef.current) {
        setHasUnpublishedChanges(true);
      }
    }
  }, [code, loading, DEFAULT_CODE]);

  // Reset baseline when publishing
  useEffect(() => {
    if (isPublished && !hasUnpublishedChanges) {
      publishedCodeRef.current = code;
    }
  }, [isPublished, hasUnpublishedChanges]);

  useEffect(() => {
    setCodeRef.current = setCode;
  }, [setCode]);

  // Safety: if Sandpack never reports "ready" (rare), don't keep the overlay forever.
  useEffect(() => {
    if (!isAwaitingPreviewReady) return;
    if (isStreaming) return;

    const timeout = window.setTimeout(() => {
      setIsAwaitingPreviewReady(false);
    }, 8000);

    return () => window.clearTimeout(timeout);
  }, [isAwaitingPreviewReady, isStreaming]);



  // Agent loop for premium multi-step experience
  const {
    agentStep,
    agentLogs,
    isAgentRunning,
    startAgent,
    cancelAgent,
    resetAgent,
    onStreamLog,
    onStreamingComplete,
    onStreamingError,
    triggerSelfCorrection,
    lockedProjectId,
    mountProject: mountAgentProject,
    unmountProject: unmountAgentProject,
    // Phase streaming
    onPhaseChange,
    onAnalysis,
    onPlanItems,
    onStreamSummary,
    onConfidence,
    onCodeProgress,
    // 2-Stage Analyzer
    onSuggestions,
    onQuestions,
    clearQuestions,
    backendSuggestions,
    pendingQuestions,
    enhancedPromptSeed,
    streamPhase,
    analysisText,
    planItems,
    completedPlanItems,
    summaryText,
    confidenceScore,
    confidenceReason,
    codeProgressBytes,
    codeProgressElapsed,
  } = useAgentLoop({
    onStreamCode: streamCode,
    onComplete: () => {
      console.log('[AgentLoop] Complete');
      // Refetch credits after generation completes (backend already deducted)
      refetchCredits();
    },
    getActiveProjectId: () => activeProjectId,
  });

  // Wire phase callbacks ref now that useAgentLoop is initialized
  phaseCallbacksRef.current = { onPhaseChange, onAnalysis, onPlanItems, onStreamSummary, onConfidence, onCodeProgress, onSuggestions, onQuestions };

  // NOTE: latestPhaseDataRef is updated imperatively inside phase callbacks above
  // (onAnalysis, onPlanItems, onStreamSummary, onConfidence)
  // so it retains data even after useAgentLoop resets its state.

  // 📸 THUMBNAIL CAPTURE: Upload hero screenshot after successful generation
  const { requestCapture } = useThumbnailCapture({
    projectId: activeProjectId,
    enabled: Boolean(activeProjectId),
  });

  // 🔄 BACKGROUND GENERATION: Extracted to useBackgroundGenerationController
  const {
    currentJob,
    hasActiveJob,
    hasCompletedJob,
    isLoadingJob,
    createJob,
    cancelJob,
    acknowledgeJob,
    ghostFixer,
    lastFailedPrompt,
    clearLastFailedPrompt,
  } = useBackgroundGenerationController({
    activeProjectId,
    addMessage,
    setFiles,
    setPendingPlan,
    setLiveSteps,
    resetAgent,
    onStreamingComplete,
    onStreamingError,
    generationLockRef,
    activeJobIdRef,
    pendingSummaryRef,
    hasDbSnapshotRef,
  });

  // Dynamically detected pages from generated code (checks all files in multi-file mode)
  const detectedPages = useMemo<SitePage[]>(() => {
    if (Object.keys(files).length > 0) {
      const allCode = Object.values(files).join('\n');
      return parseRoutesFromCode(allCode);
    }
    return parseRoutesFromCode(code);
  }, [code, files]);

  // Auto-complete onboarding silently (skip dialog)
  useEffect(() => {
    if (!loading && needsOnboarding) {
      completeOnboarding();
    }
  }, [loading, needsOnboarding]);

  // AUTO-START: Pick up initial prompt from navigation state (passed from Hero)
  useEffect(() => {
    const initialPrompt = (location.state as { initialPrompt?: string })?.initialPrompt;

    // Check if we just arrived with a prompt to auto-start
    // Guard: Only fire once per project - prevents double-trigger on re-renders
    if (activeProjectId && initialPrompt && startedInitialForProjectRef.current !== activeProjectId && !projectsLoading) {
      console.log('🚀 Picking up initial prompt from navigation:', initialPrompt);

      // Mark this project as having started its initial prompt
      startedInitialForProjectRef.current = activeProjectId;

      // 🔒 LOCK: Set generation lock to this project
      generationLockRef.current = activeProjectId;

      // Any new generation should cover Sandpack until bundling finishes
      setIsAwaitingPreviewReady(true);

      // ⚡ OPTIMISTIC UI: Show user's prompt immediately (don't wait for DB)
      // This fixes "ghost state" where the AI starts working but the chat looks empty
      addMessage('user', initialPrompt, undefined, activeProjectId);

      // Trigger the agent immediately (with project ID lock)
      startAgent(initialPrompt, undefined, activeProjectId);

      // Clear the state so it doesn't re-fire on refresh
      window.history.replaceState({}, document.title);
    }
  }, [activeProjectId, location.state, projectsLoading, startAgent, addMessage]);

  // Load basic data needed for the AI Builder shell (header, credits, publish state)
  // IMPORTANT: We intentionally do NOT load '/App.tsx' from the global project_files slot here.
  // Code should be derived from the active project (messages/code snapshots). Otherwise, deleted
  // projects can "reappear" on refresh due to leftover profile-scoped cached code.
  useEffect(() => {
    const loadData = async () => {
      const [layoutResp, profileResp] = await Promise.all([
        supabase
          .from('ai_storefront_layouts')
          .select('*')
          .eq('profile_id', profileId)
          .maybeSingle(),
        supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', profileId)
          .maybeSingle(),
      ]);

      if (layoutResp.data) {
        setIsPublished(layoutResp.data.is_published);
      }

      // Set profile data for header
      if (profileResp.data) {
        setUsername(profileResp.data.username);
        setUserAvatarUrl(profileResp.data.avatar_url);
      }

      setLoading(false);
    };

    loadData();
  }, [profileId]);

  // Sign out handler
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  // =============== PROJECT HYDRATION: Extracted to useProjectHydration ===============
  // Stable callback to reset transient UI state during project switches
  const resetTransientState = useCallback(() => {
    setChatResponse(null);
    setLiveSteps([]);
    setPreviewError(null);
    setConsoleErrors([]);
    setShowFixToast(false);
    setViewMode('preview');
    setPreviewPath('/');
  }, []);

  // Ref-based bridge for clearAssets (declared later in useCreativeStudio)
  const clearAssetsRef = useRef<() => void>(() => {});
  const clearAssetsStable = useCallback(() => clearAssetsRef.current(), []);

  const {
    contentProjectId,
    isVerifyingProject,
    cleanupProjectRuntime,
  } = useProjectHydration({
    activeProjectId,
    messagesLoading,
    isStreaming,
    getLastCodeSnapshot,
    getLastFilesSnapshot,
    setCode,
    setFiles,
    resetCode,
    cancelStream,
    cancelAgent,
    forceResetStreaming,
    mountAgentProject: mountAgentProject,
    unmountAgentProject: unmountAgentProject,
    resetAgent,
    clearAssets: clearAssetsStable,
    generationLockRef,
    activeJobIdRef,
    pendingSummaryRef,
    hasDbSnapshotRef,
    onResetTransientState: resetTransientState,
    onIncrementResetKey: useCallback(() => setResetKey(prev => prev + 1), []),
    onIncrementRefreshKey: useCallback(() => setRefreshKey(prev => prev + 1), []),
  });

  // NOTE: isWaitingForPreviewMount removed — preview is now purely files-driven.

  // Publishing explicitly writes the current code to a dedicated published file.
  const savePublishedVibecoderCode = async (codeContent: string) => {
    try {
      const nowIso = new Date().toISOString();

      // New canonical published path
      await supabase
        .from('project_files')
        .upsert({
          profile_id: profileId,
          file_path: '/App.published.tsx',
          content: codeContent,
          updated_at: nowIso,
        }, {
          onConflict: 'profile_id,file_path',
        });

      // Back-compat: keep legacy path updated on publish only
      await supabase
        .from('project_files')
        .upsert({
          profile_id: profileId,
          file_path: '/App.tsx',
          content: codeContent,
          updated_at: nowIso,
        }, {
          onConflict: 'profile_id,file_path',
        });
    } catch (err) {
      console.error('Failed to save published vibecoder code:', err);
    }
  };

  // Undo (restore previous code snapshot)
  const handleUndo = useCallback(() => {
    const previousSnapshot = getPreviousCodeSnapshot();
    if (previousSnapshot) {
      setCode(previousSnapshot, true);
      toast.success('Reverted to previous version');
    }
  }, [getPreviousCodeSnapshot, setCode]);

  // Hard refresh to fix white screen of death
  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  // Restore specific code version (time travel with DB sync)
  const handleRestoreCode = useCallback(async (messageId: string) => {
    if (!confirm('Are you sure? This will delete all messages after this point.')) return;

    try {
      const restoredCode = await restoreToVersion(messageId);

      if (restoredCode) {
        setCode(restoredCode, true);
        toast.success('Restored to previous version');
      } else {
        toast.error('No code snapshot found for this version');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to restore';
      toast.error(message);
    }
  }, [restoreToVersion, setCode]);

  // Publish the AI layout
  const handlePublish = async () => {
    setPublishing(true);
    try {
      // 1) Persist the currently-open code as the published storefront
      // (critical: prevents drafts/new projects from overwriting what’s live)
      await savePublishedVibecoderCode(code);

      // 2) Mark layout as published
      await supabase
        .from('ai_storefront_layouts')
        .upsert({
          profile_id: profileId,
          is_published: true,
          vibecoder_mode: true,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'profile_id' });

      // 3) Set profile to use AI mode AND link the active project
      await supabase
        .from('profiles')
        .update({ 
          active_storefront_mode: 'ai',
          active_project_id: activeProjectId,
        })
        .eq('id', profileId);

      setIsPublished(true);
      setHasUnpublishedChanges(false);
      toast.success('Store published! Your AI layout is now live.');
    } catch (error) {
      toast.error('Failed to publish');
    } finally {
      setPublishing(false);
    }
  };

  // Send message handler (with auto-create) - NOW USES AGENT LOOP
  // Implements the "Chat-to-Create" flow: first message creates project automatically
  // displayMessage: Clean user prompt shown in chat
  // aiPrompt: Backend-only prompt with system instructions (optional - defaults to displayMessage)
  const handleSendMessage = async (displayMessage: string, aiPrompt?: string) => {
    // 🚧 PROJECT READY GATE: Block generation during project switch / hydration
    // This prevents the race condition where job creation fires before the new project
    // is fully stabilized in the database, causing insert failures and ghost streams.
    if (activeProjectId && (isVerifyingProject || contentProjectId !== activeProjectId)) {
      console.warn('[handleSendMessage] 🛑 BLOCKED: Project not ready. isVerifying:', isVerifyingProject, 'contentProjectId:', contentProjectId, 'activeProjectId:', activeProjectId);
      toast.error('Project is still loading. Please wait a moment and try again.');
      return;
    }

    // 🔒 PREMIUM GATE: Non-premium users can explore but not generate
    if (!hasPremiumAccess) {
      setShowUpgradeModal(true);
      return; // ⛔ HARD STOP - show upgrade modal instead
    }

    // 💰 CREDIT CHECK: Verify sufficient credits before generation
    const modelId = activeModel?.id || 'vibecoder-pro';
    const CREDIT_COSTS: Record<string, number> = {
      'vibecoder-pro': 3,
      'vibecoder-flash': 0,
      'vibecoder-turbo': 2,
    };
    const generationCost = CREDIT_COSTS[modelId] ?? 3;
    
    if (generationCost > 0 && userCredits < generationCost) {
      toast.error(`Insufficient credits. You need ${generationCost} credits but have ${userCredits}. Please top up to continue.`, {
        action: {
          label: 'Top Up',
          onClick: () => window.open('/billing', '_blank'),
        },
      });
      return;
    }
    
    // Use the clean display message for policy checks and storage
    const cleanPrompt = displayMessage;
    // Use the AI prompt for actual generation (may include system instructions)
    const promptForAI = aiPrompt || displayMessage;

    // 🛡️ POLICY GUARD: Check for forbidden requests BEFORE any processing
    const violation = checkPolicyViolation(cleanPrompt);
    if (violation) {
      console.warn(`🛑 Policy Violation: ${violation.id}`);
      console.warn('[PolicyGuard] Blocked prompt (first 300 chars):', (cleanPrompt || '').slice(0, 300));

      // If we have an active project, persist the user message + assistant response
      // so the UI shows a clear explanation (instead of "nothing happened").
      if (activeProjectId) {
        await addMessage('user', cleanPrompt, undefined, activeProjectId);
        await addMessage('assistant', violation.message, undefined, activeProjectId);
      }

      // No toast - the chat message is sufficient feedback

      return; // ⛔ HARD STOP - do NOT call AI
    }

    const isFreshStart = !activeProjectId;

    // Cover Sandpack until bundling finishes (prevents brief error flash after generation)
    setIsAwaitingPreviewReady(true);

    // Generate a smart project name from the first prompt
    // Extract first 4-5 meaningful words as the project name
    let projectName: string | undefined;
    if (isFreshStart) {
      const words = cleanPrompt
        .replace(/[^\w\s]/g, '') // Remove punctuation
        .split(/\s+/)
        .filter((w) => w.length > 2) // Skip tiny words
        .slice(0, 5);
      projectName = words.length > 0 ? words.join(' ') : undefined;
    }

    // Auto-create project if we don't have one yet (with smart name)
    const projectId = await ensureProject(projectName);
    if (!projectId) {
      toast.error('Failed to start project');
      return;
    }

    // 🔒 LOCK: Capture which project this generation belongs to BEFORE starting
    generationLockRef.current = projectId;
    
    // 📊 Store the user's prompt for data availability checking later
    lastUserPromptRef.current = cleanPrompt;

    // Add user message to history (CLEAN prompt only - no system instructions visible)
    await addMessage('user', cleanPrompt, undefined, projectId);

    // 🛡️ AUTO-FIX SAFETY: If this is an auto-fix request, don't feed the AI the currently-broken code.
    // Use the last known-good snapshot instead.
    const isAutoFixRequest = cleanPrompt.startsWith('CRITICAL_ERROR_REPORT:');
    const lastGoodSnapshot = isAutoFixRequest ? getLastCodeSnapshot() : null;
    const existingCodeForAgent = lastGoodSnapshot || (code !== DEFAULT_CODE ? code : undefined);

    // 📁 MULTI-FILE CONTEXT: Send the full project file map so the AI sees all components.
    // This prevents "I don't see that element" errors when code is split across files.
    const hasMultipleFiles = Object.keys(files).length > 1;
    const projectFilesForAgent = hasMultipleFiles ? files : undefined;

    // Clear any previous retry state
    clearLastFailedPrompt();

    // 🔄 CREATE BACKGROUND JOB: This ensures generation persists even if user leaves
    // The job will be picked up by the edge function and results saved to database
    const job = await createJob(cleanPrompt, promptForAI, activeModel?.id, isPlanMode);

    // Track whether this run is job-backed (used to prevent duplicate message appends)
    activeJobIdRef.current = job?.id ?? null;
    
    if (job) {
      console.log('[BackgroundGen] Created job:', job.id, 'for project:', projectId);
      
      // Start the agent loop with the AI prompt AND the job ID
      // The backend will write results to the job record
      startAgent(promptForAI, existingCodeForAgent, projectId, job.id, projectFilesForAgent);
    } else {
      // 🚨 HARD ABORT: Job creation failed — do NOT fall back to streaming-only mode.
      // Streaming-only bypasses DB persistence, SUMMARY authority, validation gates,
      // and snapshot persistence. It creates undefined behavior in the hardened pipeline.
      console.error('[BackgroundGen] ❌ Job creation failed. Aborting generation — no streaming-only fallback.');
      generationLockRef.current = null;
      activeJobIdRef.current = null;
      setIsAwaitingPreviewReady(false);
      toast.error('Failed to start generation. Please try again.', { duration: 5000 });
      if (projectId) {
        await addMessage('assistant', '❌ Generation could not start — the backend job failed to create. Please try again.', undefined, projectId);
      }
    }
  };

  // Handle new project creation - FRESH START PROTOCOL
  // 1. Clear all caches FIRST
  // 2. Reset local state to blank template
  // 3. Clear the active project (go to Hero screen)
  // 4. Let the user type a new prompt on the Hero which creates the new project
  const handleCreateProject = async () => {
    // 1. Nuclear cache clear to prevent any stale code from persisting
    await nukeSandpackCache();
    
    // 2. Unmount agent state
    unmountAgentProject();
    
    // 3. Reset ALL local state to blank slate
    resetCode();                    // Code → DEFAULT_CODE
    resetAgent();                   // Agent state → idle
    setChatResponse(null);          // Pending response → null
    setLiveSteps([]);               // Progress steps → empty
    setViewMode('preview');         // View → preview (not code/image/video)
    clearAssets();                  // Clear any generated assets
    
    // 4. Force increment reset key to remount components
    setResetKey(prev => prev + 1);
    setRefreshKey(prev => prev + 1);
    
    // 5. Clear active project (this also clears messages and URL) → shows Hero screen
    clearActiveProject();
    
    toast.success('Starting fresh - describe your vision!');
  };

  // Handle project deletion (uses the "Total Deletion" RPC + Scorched Earth cache clear)
  const handleDeleteProject = async (projectIdToDelete: string) => {
    const isActiveProject = activeProjectId === projectIdToDelete;
    const remainingAfterDelete = projects.filter(p => p.id !== projectIdToDelete);

    const success = await deleteProject(projectIdToDelete);

    if (success) {
      // SCORCHED EARTH: Nuke all caches for the deleted project
      clearProjectLocalStorage(projectIdToDelete);
      await nukeSandpackCache();
      
      // If that was the LAST project, also wipe the profile-scoped code slot.
      // Otherwise a hard refresh can reload old code from project_files and look like a "zombie".
      if (remainingAfterDelete.length === 0) {
        try {
          await supabase
            .from('project_files')
            .delete()
            .eq('profile_id', profileId)
            .eq('file_path', '/App.tsx');
        } catch (err) {
          // Non-fatal; the UI reset below still prevents rendering in the canvas.
          console.warn('[AIBuilderCanvas] Failed to clear project_files /App.tsx after last-project delete', err);
        }
      }

      // If we deleted the active project, force a COMPLETE nuclear reset
      if (isActiveProject) {
        // Unmount agent first
        unmountAgentProject();
        
        // Reset code to blank slate
        resetCode();

        // Clear chat response state
        setChatResponse(null);

        // Clear agent/streaming state
        setLiveSteps([]);
        resetAgent();

        // Reset view mode to default
        setViewMode('preview');
        setPreviewPath('/');

        // Clear any generated assets
        clearAssets();

        // Increment resetKey to force React to DESTROY and re-mount all preview/chat components
        // This ensures no stale state survives in child components
        setResetKey(prev => prev + 1);
        setRefreshKey(prev => prev + 1);
      }
      toast.success('Project deleted');
    } else {
      toast.error('Failed to delete project');
    }
  };

  // Handle project rename
  const handleRenameProject = async (projectId: string, newName: string) => {
    const success = await renameProject(projectId, newName);
    if (!success) {
      toast.error('Failed to rename project');
    }
  };

  // Handle auto-fix from error boundary (self-healing AI)
  const handleAutoFix = useCallback((errorMsg: string) => {
    // Notify agent of the error for UI feedback
    triggerSelfCorrection(errorMsg);
    // Send the error report to the AI for automatic repair
    handleSendMessage(errorMsg);
  }, [triggerSelfCorrection, handleSendMessage]);

  // When Sandpack reports an error, show one-click fix toast (NO chat injection)
  // 🛡️ GUARD: Suppress error reporting while streaming to prevent flashing/spam
  const handlePreviewError = useCallback((errorMsg: string) => {
    // CRITICAL: Only show error UI when streaming is complete
    // During streaming, code is intentionally incomplete and errors are expected
    if (isStreaming) return;
    
    setPreviewError(errorMsg);
    setShowFixToast(true);
    // Trigger self-correction state in agent for UI feedback
    triggerSelfCorrection(errorMsg);
    // DO NOT add error messages to chat - keep chat clean!
  }, [isStreaming, triggerSelfCorrection]);

  // 🔍 CONSOLE ERROR CAPTURE: Runtime errors from inside Sandpack iframe
  const handleConsoleErrors = useCallback((errors: string[]) => {
    if (isStreaming) return;
    setConsoleErrors(errors);
    // If there's no build error but console errors exist, show the fix toast
    if (!previewError && errors.length > 0) {
      setShowFixToast(true);
    }
  }, [isStreaming, previewError]);
  
  // 📋 PLAN APPROVAL: Execute the approved plan
  const handleApprovePlan = useCallback(async (originalPrompt: string) => {
    if (!activeProjectId) return;
    
    // Clear the pending plan
    setPendingPlan(null);
    
    // Cover Sandpack until bundling finishes
    setIsAwaitingPreviewReady(true);
    
    // 🔒 LOCK: Capture which project this generation belongs to
    generationLockRef.current = activeProjectId;
    
    // Add a message to indicate we're executing the plan
    await addMessage('user', `Execute the approved plan`, undefined, activeProjectId);
    
    // Start the agent with the original prompt (without ARCHITECT_MODE)
    startAgent(originalPrompt, code !== DEFAULT_CODE ? code : undefined, activeProjectId);
  }, [activeProjectId, addMessage, startAgent, code, DEFAULT_CODE]);
  
  // 📋 PLAN REJECTION: Cancel the plan and allow user to refine
  const handleRejectPlan = useCallback(() => {
    setPendingPlan(null);
    toast.info('Plan cancelled. You can refine your request and try again.');
  }, []);

  // ===== CREATIVE STUDIO: Extracted to useCreativeStudio =====
  const {
    currentAsset,
    isCurrentlyGenerating,
    handleGenerateAsset,
    handleRetryAsset,
    handleApplyAssetToCanvas,
    handleAssetFeedback,
    clearAssets,
  } = useCreativeStudio({
    viewMode,
    setViewMode,
    handleSendMessage,
    setShowPlacementModal,
  });

  // Wire clearAssets ref bridge (declared before useProjectHydration, populated here)
  clearAssetsRef.current = clearAssets;

  // Mark boot complete when data is ready (no loading screen needed)
  const isDataLoading = loading || projectsLoading || isVerifyingProject || messagesLoading;
  
  useEffect(() => {
    if (!hasBooted && !isDataLoading) {
      setHasBooted(true);
    }
  }, [hasBooted, isDataLoading]);

  // 🚧 DEFERRED HERO PROMPT DISPATCHER
  // When heroOnStart creates a new project, the prompt is stored in deferredHeroPromptRef.
  // This effect fires it once the project is fully hydrated (contentProjectId matches).
  useEffect(() => {
    const deferred = deferredHeroPromptRef.current;
    if (!deferred) return;
    if (!activeProjectId || isVerifyingProject || contentProjectId !== activeProjectId) return;
    
    // Project is ready — dispatch the deferred prompt
    console.log('[heroOnStart] 🚀 Project stabilized, dispatching deferred prompt');
    deferredHeroPromptRef.current = null; // Clear before calling to prevent re-entry
    handleSendMessage(deferred.prompt, deferred.aiPrompt);
  }, [activeProjectId, isVerifyingProject, contentProjectId, handleSendMessage]);

  // 🛑 THE GATEKEEPER 🛑
  // Prevent "flash of old content" when switching projects.
  // Core rule: NEVER render the workspace with files/messages that belong to a different project.
  // Preview is now purely files-driven — no isWaitingForPreviewMount needed.
  const isProjectTransitioning = Boolean(
    activeProjectId && (
      contentProjectId !== activeProjectId ||
      isVerifyingProject ||
      messagesLoading ||
      (lockedProjectId && lockedProjectId !== activeProjectId)
    )
  );


  // NOTE: isProjectTransitioning is now handled INSIDE the content area below,
  // NOT here. This ensures the sidebar stays visible during project switches.


  const isEmpty = code === DEFAULT_CODE;
  // canUndo is now a function from useVibecoderProjects (includes sentinel safety check)
  const hasActiveProject = Boolean(activeProjectId);

    const heroOnStart = async (prompt: string, isPlanMode?: boolean) => {
    // 1. Extract smart project name from first 5 words
    const projectName = prompt.split(/\s+/).slice(0, 5).join(' ');

    // 2. Create the project first (this sets activeProjectId + updates URL)
    const newProjectId = await ensureProject(projectName, true);
    if (!newProjectId) {
      toast.error('Failed to create project');
      return;
    }

    // 3. Mark this project so the useEffect auto-start guard doesn't double-fire
    startedInitialForProjectRef.current = newProjectId;

    // 4. 🚧 DEFER the prompt until the project is fully hydrated.
    // React will re-render with the new activeProjectId, triggering hydration.
    // The useEffect above will dispatch handleSendMessage once contentProjectId matches.
    const aiPrompt = isPlanMode
      ? `[ARCHITECT_MODE_ACTIVE]\nUser Request: ${prompt}\n\nINSTRUCTION: Do NOT generate code. Create a detailed implementation plan. Output JSON: { "type": "plan", "title": "...", "summary": "...", "steps": ["step 1", "step 2"] }`
      : undefined;
    
    deferredHeroPromptRef.current = { prompt, aiPrompt };
    console.log('[heroOnStart] Project created, deferring prompt until hydration completes:', newProjectId);
  };

  // === DOORWAY: If no active project, ALWAYS show the magical prompt-first screen ===
  // - Fresh users (no projects): full-screen doorway
  // - Returning users (has projects): full-screen doorway with recent projects carousel
  if (!activeProjectId) {
    return (
      <LovableHero
        onStart={heroOnStart}
        userName={username ?? 'Creator'}
        variant="fullscreen"
        recentProjects={projects}
        onSelectProject={selectProject}
        onToggleStar={toggleStar}
        userCredits={userCredits}
        avatarUrl={userAvatarUrl}
        subscriptionTier={subscriptionTier}
        onSignOut={handleSignOut}
      />
    );
  }

  // === EXISTING USER: Show the full editor interface ===
  return (
    <div className="studio-layout h-screen w-screen overflow-hidden bg-[#1a1a1a] flex scrollbar-hide">
      {/* ═══ PROJECT SIDEBAR ═══ */}
      <div className="shrink-0 h-full">
        <ProjectSidebar
          projects={projects}
          activeProjectId={activeProjectId}
          loading={projectsLoading}
          onSelectProject={selectProject}
          onCreateProject={handleCreateProject}
          onDeleteProject={handleDeleteProject}
          onRenameProject={handleRenameProject}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* ═══ CENTER: Header + Canvas ═══ */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Header Toolbar — sits on background */}
        <div className="shrink-0">
          <VibecoderHeader
            projectName={activeProject?.name}
            viewMode={viewMode}
            setViewMode={setViewMode}
            deviceMode={deviceMode}
            setDeviceMode={setDeviceMode}
            onRefresh={handleRefresh}
            onPublish={handlePublish}
            isPublished={isPublished}
            isPublishing={publishing}
            hasUnpublishedChanges={hasUnpublishedChanges}
            isEmpty={isEmpty}
            username={username}
            currentPath={previewPath}
            onNavigate={setPreviewPath}
            pages={detectedPages}
            avatarUrl={userAvatarUrl}
            userCredits={userCredits}
            subscriptionTier={subscriptionTier}
            onSignOut={handleSignOut}
            chatCollapsed={chatCollapsed}
            onToggleChatCollapse={() => setChatCollapsed(!chatCollapsed)}
          />
        </div>

        {/* Canvas / Preview Area — elevated rounded card */}
        <div className="flex-1 min-h-0 relative overflow-hidden rounded-xl m-2 mt-0 bg-[#1a1a1a] flex flex-col">
          {/* Transition Overlay */}
          {isProjectTransitioning && (
            <div className="absolute inset-0 z-[100] bg-[#0a0a0a] flex items-center justify-center rounded-2xl">
              <div className="flex flex-col items-center gap-3">
                <div className="w-6 h-6 border-2 border-zinc-600 border-t-zinc-400 rounded-full animate-spin" />
                <span className="text-sm text-zinc-500">Loading project…</span>
              </div>
            </div>
          )}

            {viewMode === 'products' ? (
              <ProductsPanel profileId={profileId} />
            ) : viewMode === 'subscriptions' ? (
              <SubscriptionsPanel profileId={profileId} />
            ) : (viewMode === 'image' || viewMode === 'video') ? (
              <GenerationCanvas
                mode={viewMode}
                asset={currentAsset}
                isLoading={isCurrentlyGenerating}
                onRetry={handleRetryAsset}
                onUseInCanvas={() => setShowPlacementModal(true)}
                onFeedback={handleAssetFeedback}
                activeModel={activeModel}
              />
            ) : (
              <div className={`flex-1 min-h-0 h-full relative bg-[#1a1a1a] border border-zinc-600/60 rounded-lg ${deviceMode === 'mobile' ? 'flex items-center justify-center' : ''}`}>
                {deviceMode === 'mobile' ? (
                  /* Phone device frame */
                  <div className="relative flex flex-col" style={{ height: 'calc(100% - 32px)', maxHeight: '900px' }}>
                    <div className="relative h-full w-[390px] rounded-[3rem] border-[4px] border-zinc-600 bg-black shadow-2xl shadow-black/60 overflow-hidden flex flex-col scrollbar-hide">
                      {/* Screen */}
                      <div className="flex-1 overflow-hidden rounded-[calc(3rem-4px)] relative scrollbar-hide">
                        <PreviewErrorBoundary
                          onAutoFix={handleAutoFix}
                          onReset={() => { setIsAwaitingPreviewReady(false); resetCode(); }}
                        >
                          <VibecoderPreview
                            key={`preview-${activeProjectId ?? 'fresh'}-${resetKey}-${refreshKey}`}
                            code={code}
                            files={Object.keys(files).length > 0 ? files : undefined}
                            isStreaming={isStreaming}
                            showLoadingOverlay={false}
                          onReady={() => {
                              setIsAwaitingPreviewReady(false);
                              setPreviewError(null);
                              setConsoleErrors([]);
                              setShowFixToast(false);
                              lastPreviewErrorRef.current = null;
                              if (!isStreaming && code !== DEFAULT_CODE) {
                                if (captureTimerRef.current) clearTimeout(captureTimerRef.current);
                                captureTimerRef.current = setTimeout(() => { requestCapture(); }, 2000);
                              }
                            }}
                            onError={handlePreviewError}
                            onConsoleErrors={handleConsoleErrors}
                            viewMode={viewMode}
                            activePage={previewPath}
                            visualEditMode={visualEditMode}
                          />
                        </PreviewErrorBoundary>
                        <GenerationOverlay visible={isStreaming && isEmpty} phase={streamPhase || 'analyzing'} analysisText={analysisText} />
                        {showFixToast && (previewError || consoleErrors.length > 0) && !isStreaming && (
                          <FixErrorToast
                            error={previewError || consoleErrors[0] || 'Runtime error detected'}
                            onDismiss={() => { setShowFixToast(false); setConsoleErrors([]); }}
                            onFix={() => {
                              const parts: string[] = [];
                              if (previewError) parts.push(`Build error: "${previewError}"`);
                              if (consoleErrors.length > 0) parts.push(`Console errors (${consoleErrors.length}): ${consoleErrors.slice(0, 5).map(e => `"${e}"`).join('; ')}`);
                              const report = `CRITICAL_ERROR_REPORT: The preview has the following errors. ${parts.join('. ')}. Analyze the latest code you generated, identify the cause (syntax error, missing import, undefined variable, runtime TypeError, etc.), and fix it immediately. Do NOT ask questions.`;
                              handleAutoFix(report);
                              setShowFixToast(false);
                              setConsoleErrors([]);
                            }}
                          />
                        )}
                      </div>
                      {/* Home indicator bar */}
                      <div className="h-[20px] bg-black flex items-center justify-center">
                        <div className="w-[134px] h-[5px] rounded-full bg-zinc-700" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full w-full relative overflow-hidden">
                    <PreviewErrorBoundary
                      onAutoFix={handleAutoFix}
                      onReset={() => { setIsAwaitingPreviewReady(false); resetCode(); }}
                    >
                      <VibecoderPreview
                        key={`preview-${activeProjectId ?? 'fresh'}-${resetKey}-${refreshKey}`}
                        code={code}
                        files={Object.keys(files).length > 0 ? files : undefined}
                        isStreaming={isStreaming}
                        showLoadingOverlay={false}
                        onReady={() => {
                          setIsAwaitingPreviewReady(false);
                          setPreviewError(null);
                          setConsoleErrors([]);
                          setShowFixToast(false);
                          lastPreviewErrorRef.current = null;
                          if (!isStreaming && code !== DEFAULT_CODE) {
                            if (captureTimerRef.current) clearTimeout(captureTimerRef.current);
                            captureTimerRef.current = setTimeout(() => { requestCapture(); }, 2000);
                          }
                        }}
                        onError={handlePreviewError}
                        onConsoleErrors={handleConsoleErrors}
                        viewMode={viewMode}
                        activePage={previewPath}
                        visualEditMode={visualEditMode}
                      />
                    </PreviewErrorBoundary>
                    <GenerationOverlay visible={isStreaming && isEmpty} phase={streamPhase || 'analyzing'} analysisText={analysisText} />
                    {showFixToast && (previewError || consoleErrors.length > 0) && !isStreaming && (
                      <FixErrorToast
                        error={previewError || consoleErrors[0] || 'Runtime error detected'}
                        onDismiss={() => { setShowFixToast(false); setConsoleErrors([]); }}
                        onFix={() => {
                          const parts: string[] = [];
                          if (previewError) parts.push(`Build error: "${previewError}"`);
                          if (consoleErrors.length > 0) parts.push(`Console errors (${consoleErrors.length}): ${consoleErrors.slice(0, 5).map(e => `"${e}"`).join('; ')}`);
                          const report = `CRITICAL_ERROR_REPORT: The preview has the following errors. ${parts.join('. ')}. Analyze the latest code you generated, identify the cause (syntax error, missing import, undefined variable, runtime TypeError, etc.), and fix it immediately. Do NOT ask questions.`;
                          handleAutoFix(report);
                          setShowFixToast(false);
                          setConsoleErrors([]);
                        }}
                      />
                    )}
                  </div>
                )}
              </div>
            )}

            <div ref={overlayRef} className="absolute inset-0 z-50 bg-transparent cursor-ew-resize" style={{ display: 'none' }} />
        </div>
      </div>

      {/* ═══ DRAG HANDLE — always between canvas and chat ═══ */}
      {!chatCollapsed && (
        <div
          ref={handleRef}
          onMouseDown={startResizing}
          className="shrink-0 w-1.5 cursor-ew-resize z-50 flex items-center justify-center group bg-transparent hover:bg-blue-500/30"
        >
          <div ref={handleDotRef} className="w-0.5 h-10 rounded-full bg-zinc-600 group-hover:bg-blue-400" />
        </div>
      )}

      {/* ═══ CHAT SIDEBAR — sits on background, chat input is its own card ═══ */}
      <div
        ref={sidebarRef}
        className="shrink-0 h-full flex flex-col overflow-hidden transition-all duration-300 ease-in-out scrollbar-hide"
        style={{
          width: chatCollapsed ? 0 : sidebarWidth,
        }}
      >
        <div className="flex-1 min-h-0 overflow-hidden relative flex flex-col" style={{ isolation: 'isolate' }}>
          {viewMode === 'design' ? (
            <>
              {/* Design panel fills the sidebar, chat input stays at bottom */}
              <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                <DesignPanel
                  onVisualEditModeChange={setVisualEditMode}
                  selectedElement={selectedElement}
                  onEditRequest={(prompt) => {
                    handleSendMessage(prompt);
                  }}
                />
              </div>
              {/* Keep chat input bar pinned at bottom */}
              <div className="shrink-0 bg-[#1a1a1a]">
                <ChatInputBar
                  value={designInput}
                  onChange={setDesignInput}
                  onSubmit={(options) => {
                    if (!designInput.trim()) return;
                    handleSendMessage(designInput.trim());
                    setDesignInput('');
                  }}
                  isGenerating={isStreaming || isAgentRunning}
                  onCancel={async () => {
                    cancelStream();
                    cancelAgent();
                    cancelJob();
                    forceResetStreaming();
                  }}
                  placeholder="Ask about design changes..."
                />
              </div>
            </>
          ) : (
            <VibecoderChat
              key={`chat-${activeProjectId ?? 'fresh'}-${resetKey}`}
              onSendMessage={handleSendMessage}
              onGenerateAsset={handleGenerateAsset}
              isStreaming={isStreaming || isAgentRunning}
              onCancel={async () => {
                cancelStream();
                cancelAgent();
                cancelJob();
                forceResetStreaming();
                generationLockRef.current = null;
                activeJobIdRef.current = null;
                setLiveSteps([]);
                if (activeProjectId) {
                  await addMessage('assistant', '🛑 Request cancelled. Your previous work is preserved — you can continue from where you left off.', undefined, activeProjectId);
                }
              }}
              messages={messages}
              messagesLoading={messagesLoading}
              onRateMessage={rateMessage}
              onRestoreToVersion={handleRestoreCode}
              projectName={activeProject?.name ?? 'New Project'}
              liveSteps={liveSteps}
              agentStep={agentStep}
              agentLogs={agentLogs}
              isAgentMode={isAgentRunning}
              activeModel={activeModel}
              onOpenBilling={() => window.open('/pricing', '_blank')}
              onModelChange={handleModelChange}
              // Theme state now managed by ThemeProvider — no props needed
              pendingPlan={pendingPlan}
              onApprovePlan={handleApprovePlan}
              onRejectPlan={handleRejectPlan}
              canUndo={canUndo()}
              streamPhaseData={{
                phase: streamPhase,
                analysisText,
                planItems,
                completedPlanItems,
                summaryText,
                confidenceScore: confidenceScore ?? undefined,
                confidenceReason,
                codeProgressBytes,
                codeProgressElapsed,
              }}
              backendSuggestions={backendSuggestions}
              pendingQuestions={pendingQuestions}
              enhancedPromptSeed={enhancedPromptSeed}
              onSubmitClarification={(answers, seed) => {
                clearQuestions();
                const answerSummary = Object.entries(answers)
                  .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
                  .join('; ');
                const enrichedPrompt = seed 
                  ? `${seed}\n\nUser preferences: ${answerSummary}`
                  : `Based on these preferences: ${answerSummary}`;
                handleSendMessage(enrichedPrompt);
              }}
              onSkipClarification={() => {
                clearQuestions();
              }}
              isCollapsed={chatCollapsed}
              onToggleCollapse={() => setChatCollapsed(!chatCollapsed)}
              userCredits={userCredits}
              lastFailedPrompt={lastFailedPrompt}
              onRetryLastFailed={() => {
                if (lastFailedPrompt) {
                  clearLastFailedPrompt();
                  handleSendMessage(lastFailedPrompt);
                }
              }}
            />
          )}
        </div>
      </div>

      {/* Chat expand toggle removed — now lives in header */}
      

      <PlacementPromptModal
        isOpen={showPlacementModal}
        onClose={() => setShowPlacementModal(false)}
        onSubmit={handleApplyAssetToCanvas}
        asset={currentAsset}
      />

      {/* Premium Upgrade Modal (z-40) */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0c0c0f] border border-white/[0.08] rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl shadow-black/60">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-primary/30">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z" />
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-bold text-center text-white mb-2">Upgrade to Premium</h2>
            <p className="text-zinc-400 text-center mb-6">
              The AI Builder is a premium feature that lets you design your entire storefront with AI — starting from a blank canvas with no limits.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  setShowUpgradeModal(false);
                  navigate('/pricing');
                }}
                className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                View Plans
              </button>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="w-full py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-xl transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
