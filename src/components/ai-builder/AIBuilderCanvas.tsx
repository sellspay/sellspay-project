import { useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect } from 'react';
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
import { useBackgroundGeneration, type GenerationJob } from '@/hooks/useBackgroundGeneration';
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
import { useGhostFixer } from '@/hooks/useGhostFixer';

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

  // STRICT LOADING: Verify project exists before rendering preview
  const [isVerifyingProject, setIsVerifyingProject] = useState(false);

  // CONTENT GATE: Which project has its code/chat fully mounted into the workspace.
  // This prevents a 1-frame "flash" where the URL/activeProjectId changes but the old
  // code/messages are still in React state.
  const [contentProjectId, setContentProjectId] = useState<string | null>(null);
  // Prevent Sandpack's brief bundling/error flash after streaming completes
  const [isAwaitingPreviewReady, setIsAwaitingPreviewReady] = useState(false);
  
  // 🤝 PREVIEW HANDSHAKE: Tracks if we're waiting for Sandpack to signal "ready" after project switch
  // This keeps the loading screen visible until the preview is actually rendered, preventing blank frames
  const [isWaitingForPreviewMount, setIsWaitingForPreviewMount] = useState(false);

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

  // Generation state for Creative Studio (Image & Video tabs)
  const [currentImageAsset, setCurrentImageAsset] = useState<GeneratedAsset | null>(null);
  const [currentVideoAsset, setCurrentVideoAsset] = useState<GeneratedAsset | null>(null);
  const [isImageGenerating, setIsImageGenerating] = useState(false);
  const [isVideoGenerating, setIsVideoGenerating] = useState(false);
  const [showPlacementModal, setShowPlacementModal] = useState(false);
  const [lastAssetPrompt, setLastAssetPrompt] = useState<string>('');
  const [lastAssetModel, setLastAssetModel] = useState<AIModel | null>(null);
  
  // Premium upgrade modal state
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  // Hard refresh state for fixing white screen of death
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Page navigation state for storefront preview
  const [previewPath, setPreviewPath] = useState("/");
  
  // Per-project guard to prevent double-firing agent on mount with location state
  // Stores the project ID for which we've already triggered the initial prompt
  const startedInitialForProjectRef = useRef<string | null>(null);
  
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
  
  // 🔧 GHOST FIXER: Auto-recovery for truncated AI outputs
  // This hook detects missing completion sentinels and triggers continuation
  const ghostFixer = useGhostFixer({
    maxRetries: 1,
    onFixAttempt: (attempt) => {
      console.log(`[GhostFixer] Generation was interrupted; retrying... (attempt ${attempt}/1)`);
      toast.info('Generation was interrupted; retrying with full regeneration...');
    },
    onFixSuccess: (mergedCode) => {
      console.log('[GhostFixer] ✅ Full regeneration successful');
      toast.success('Code regenerated successfully.', { duration: 6000 });
    },
    onFixFailure: (reason) => {
      console.error('[GhostFixer] ❌ Recovery failed:', reason);
      toast.error(reason, { duration: 8000 });
    }
  });
  
  // Ref to hold setCode function for Ghost Fixer callback
  const setCodeRef = useRef<((code: string) => void) | null>(null);
  
  // Ref to bridge phase callbacks (useAgentLoop declared after useStreamingCode)
  const phaseCallbacksRef = useRef<{
    onPhaseChange?: (phase: string) => void;
    onAnalysis?: (text: string) => void;
    onPlanItems?: (items: string[]) => void;
    onStreamSummary?: (text: string) => void;
    onConfidence?: (score: number, reason: string) => void;
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
    DEFAULT_CODE 
  } = useStreamingCode({
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

  // Safety: if isWaitingForPreviewMount never clears (Sandpack doesn't remount), force-clear it.
  // This prevents the "black screen" bug where Sandpack updates files
  // without triggering onReady (no key change = no remount).
  // Reduced to 1.5s — 3s felt like a hang. Sandpack typically mounts in <500ms.
  useEffect(() => {
    if (!isWaitingForPreviewMount) return;
    if (isStreaming) return;

    const timeout = window.setTimeout(() => {
      console.log('⏰ Safety: Force-clearing isWaitingForPreviewMount after timeout');
      setIsWaitingForPreviewMount(false);
    }, 1500);

    return () => window.clearTimeout(timeout);
  }, [isWaitingForPreviewMount, isStreaming]);

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
  phaseCallbacksRef.current = { onPhaseChange, onAnalysis, onPlanItems, onStreamSummary, onConfidence, onSuggestions, onQuestions };

  // NOTE: latestPhaseDataRef is updated imperatively inside phase callbacks above
  // (onAnalysis, onPlanItems, onStreamSummary, onConfidence)
  // so it retains data even after useAgentLoop resets its state.

  // 📸 THUMBNAIL CAPTURE: Upload hero screenshot after successful generation
  const { requestCapture } = useThumbnailCapture({
    projectId: activeProjectId,
    enabled: Boolean(activeProjectId),
  });

  // 🔄 BACKGROUND GENERATION: Jobs that persist even if user leaves
  // Track processed jobs to prevent duplicate message additions
  const processedJobIdsRef = useRef<Set<string>>(new Set());
  
  const handleJobComplete = useCallback(async (job: GenerationJob) => {
    // Prevent duplicate processing
    if (processedJobIdsRef.current.has(job.id)) {
      console.log('[BackgroundGen] Job already processed, skipping:', job.id);
      return;
    }
    processedJobIdsRef.current.add(job.id);

    // ✅ STEP 1: Reject late events from old project IDs
    if (job.project_id !== activeProjectId) {
      console.warn(`🛑 BLOCKED: Job ${job.id} belongs to project ${job.project_id} but active is ${activeProjectId}`);
      return;
    }

    const isActiveRun = activeJobIdRef.current === job.id;

    console.log('[BackgroundGen] Job completed:', job.id, { isActiveRun, status: job.status });

    // ═══════════════════════════════════════════════════════════════
    // TRUNCATION HANDLING: Hard fail — no silent patching
    // ═══════════════════════════════════════════════════════════════
    if (job.status === 'needs_continuation') {
      console.warn('[BackgroundGen] ❌ Job truncated — no auto-recovery');
      
      toast.error('Code generation was interrupted. Please retry with a simpler request.', { duration: 6000 });
      if (activeProjectId) {
        await addMessage('assistant', '⚠️ Code generation was interrupted. Please simplify your request or break it into smaller parts.', undefined, activeProjectId);
      }

      // Clear state — no Ghost Fixer, no silent retry
      if (isActiveRun) {
        setLiveSteps([]);
        pendingSummaryRef.current = '';
        generationLockRef.current = null;
        activeJobIdRef.current = null;
        resetAgent();
      }
      return;
    }

    // 🛡️ SAFETY: Never apply JSON (job status / accidental payload) as code
    const looksLikeJson = (text: string): boolean => {
      const trimmed = (text || '').trim();
      if (!trimmed.startsWith('{')) return false;
      try {
        const parsed = JSON.parse(trimmed);
        return parsed && typeof parsed === 'object' && (
          'jobId' in parsed || 'status' in parsed || 'success' in parsed
        );
      } catch {
        return false;
      }
    };

    // If we have code result, apply it (only if it looks like TSX/JS)
    if (job.code_result) {
      if (looksLikeJson(job.code_result)) {
        console.error('[BackgroundGen] Refusing to apply JSON as code_result for job:', job.id);
        toast.error('Auto-fix failed: received invalid code payload');
      } else {
        setCode(job.code_result, true);
      }
    } else {
      console.warn('[BackgroundGen] Job completed with no code_result:', job.id);
    }

    // If we have a plan result, show the plan approval card
    if (job.plan_result) {
      setPendingPlan({
        plan: job.plan_result,
        originalPrompt: job.prompt,
      });
    }

    // Add assistant message with the summary (this is the canonical source for job-backed runs)
    if (job.summary && activeProjectId) {
      addMessage('assistant', job.summary, job.code_result || undefined, activeProjectId);
    }

    // ✅ IMPORTANT: Clear "building" state for the run that created this job
    if (isActiveRun) {
      setLiveSteps([]);
      pendingSummaryRef.current = '';
      generationLockRef.current = null;
      activeJobIdRef.current = null;
      onStreamingComplete();
      resetAgent();
    }
  }, [activeProjectId, addMessage, onStreamingComplete, resetAgent, setCode, ghostFixer]);

  const handleJobError = useCallback((job: GenerationJob) => {
    console.error('[BackgroundGen] Job failed:', job.error_message);
    
    // Parse structured error if available
    let userMessage = job.error_message || 'Unknown error';
    try {
      const parsed = JSON.parse(userMessage);
      if (parsed?.message) userMessage = parsed.message;
    } catch { /* not JSON, use as-is */ }

    const isActiveRun = activeJobIdRef.current === job.id;

    // Only show toasts for jobs the user actively initiated (not stale jobs found on mount)
    if (isActiveRun) {
      if (job.status === 'needs_user_action') {
        const msg = job.summary || 'This request may be too complex. Please simplify or break it into smaller parts.';
        toast.error(msg, { duration: 8000 });
        if (activeProjectId) {
          addMessage('assistant', `⚠️ ${msg}`, undefined, activeProjectId);
        }
      } else {
        toast.error(userMessage, { duration: 6000 });
      }
      setLiveSteps([]);
      generationLockRef.current = null;
      activeJobIdRef.current = null;
      onStreamingError(job.error_message || 'Generation failed');
    } else {
      // Stale job from previous session — log but don't toast
      console.warn('[BackgroundGen] Stale job error suppressed:', userMessage);
    }
  }, [onStreamingError, activeProjectId, addMessage]);

  const {
    currentJob,
    hasActiveJob,
    hasCompletedJob,
    isLoading: isLoadingJob,
    createJob,
    cancelJob,
    acknowledgeJob,
  } = useBackgroundGeneration({
    projectId: activeProjectId,
    onJobComplete: handleJobComplete,
    onJobError: handleJobError,
  });

  // Dynamically detected pages from generated code (checks all files in multi-file mode)
  const detectedPages = useMemo<SitePage[]>(() => {
    // In multi-file mode, concatenate all file contents for parsing
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

  // 🔄 RESUME: If a job completes while the user is away and we miss the realtime event,
  // we may still rehydrate `currentJob` as completed in rare cases.
  // IMPORTANT: Never append messages here directly (that caused duplication).
  // Always route through the deduped job handlers.
  const processedCompletedJobRef = useRef<string | null>(null);
  
  useEffect(() => {
    if (!hasCompletedJob || !currentJob || isLoadingJob) return;

    // Only process once per job ID
    if (processedCompletedJobRef.current === currentJob.id) return;

    // If we've already handled this job via realtime completion, skip.
    if (processedJobIdsRef.current.has(currentJob.id)) {
      processedCompletedJobRef.current = currentJob.id;
      acknowledgeJob(currentJob.id);
      return;
    }

    console.log('[BackgroundGen] Found completed job on mount, routing through handler...');
    processedCompletedJobRef.current = currentJob.id;

    // Reuse the deduped completion handler (sets code, pending plan, and appends ONE assistant msg)
    handleJobComplete(currentJob);

    // Clear local "currentJob" pointer so we don't re-run
    acknowledgeJob(currentJob.id);
  }, [hasCompletedJob, currentJob, isLoadingJob, acknowledgeJob, handleJobComplete]);

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

  // =============== SCORCHED EARTH ORCHESTRATOR ===============
  // We use useLayoutEffect to ensure this runs synchronously before paint.
  // This prevents any flash of stale content when switching projects.
  // 
  // CRITICAL: This effect ONLY runs when activeProjectId changes, NOT on every message update.
  // Having `messages` in the dependency array caused a catastrophic bug where every new message
  // would trigger unmount/remount, aborting in-flight AI generations.
  const previousProjectIdRef = useRef<string | null>(null);
  
  // Tracks which project is currently being loaded by the orchestrator
  // The restoration effect checks this to avoid opening the gate prematurely
  const loadingProjectRef = useRef<string | null>(null);
  
  // Memoize stable references to avoid re-runs
  const getLastCodeSnapshotRef = useRef(getLastCodeSnapshot);
  getLastCodeSnapshotRef.current = getLastCodeSnapshot;

  // ✅ STEP 1: Unified cleanup gate — runs on every project switch and unmount.
  // Aborts active stream, unsubscribes realtime, resets UI state, and
  // installs a "stale project ID" ref so late callbacks are rejected.
  const cleanupProjectRuntime = useCallback(() => {
    // 1. Abort any active SSE stream
    try { abortControllerRef.current?.abort(); } catch {}

    // 2. Cancel streaming + agent state
    cancelStream();
    cancelAgent();
    forceResetStreaming();

    // 3. Release generation lock
    generationLockRef.current = null;
    activeJobIdRef.current = null;

    // 4. Reset transient UI state
    setChatResponse(null);
    setLiveSteps([]);
    setPreviewError(null);
    setConsoleErrors([]);
    setShowFixToast(false);
    pendingSummaryRef.current = '';
  }, [cancelStream, cancelAgent, forceResetStreaming]);

  // Expose abortController ref for cleanup (useStreamingCode stores it internally;
  // we keep a parallel ref here for the cleanup gate)
  const abortControllerRef = useRef<AbortController | null>(null);
  
  useLayoutEffect(() => {
    let isMounted = true;
    
    // Skip if project ID hasn't actually changed (prevents re-runs from other deps)
    if (previousProjectIdRef.current === activeProjectId && previousProjectIdRef.current !== null) {
      return;
    }
    
    // 🚨 CRITICAL: These MUST run SYNCHRONOUSLY (not inside async function)
    // Otherwise React will render with stale contentProjectId before the gate closes
    setContentProjectId(null); // Close the gate IMMEDIATELY
    setIsVerifyingProject(true); // Block restoration effect from running too early
    loadingProjectRef.current = activeProjectId; // Mark which project is being loaded

    // ✅ STEP 1: Run the unified cleanup gate
    cleanupProjectRuntime();
    unmountAgentProject();

    async function loadRoute() {
      // 2. DETECT PROJECT SWITCH: If switching to a different project, nuke the cache
      const isProjectSwitch = previousProjectIdRef.current !== null && 
                               previousProjectIdRef.current !== activeProjectId;
      
      if (isProjectSwitch) {
        console.log(`🔄 Project switch detected: ${previousProjectIdRef.current} → ${activeProjectId}`);
        // Clear storage for the OLD project
        if (previousProjectIdRef.current) {
          clearProjectLocalStorage(previousProjectIdRef.current);
        }
        // Nuclear option: Clear Sandpack IndexedDB
        await nukeSandpackCache();
      }
      
      // Update the ref for next comparison
      previousProjectIdRef.current = activeProjectId;

      // 3. NO PROJECT: Show Hero screen with blank slate
      if (!activeProjectId) {
        // Mark content as unmounted
        setContentProjectId(null);

        // Reset code + force Sandpack remount
        resetCode();
        setResetKey(prev => prev + 1);
        setRefreshKey(prev => prev + 1);

        // Clear transient state
        setChatResponse(null);
        setLiveSteps([]);
        resetAgent();
        setViewMode('preview');
        setPreviewPath('/');
        setCurrentImageAsset(null);
        setCurrentVideoAsset(null);

        setIsVerifyingProject(false);
        return;
      }

      setIsVerifyingProject(true);

      console.log(`🚀 Loading fresh context for: ${activeProjectId}`);

      // 4. FETCH SOURCE OF TRUTH FROM DB
      const { data, error } = await supabase
        .from('vibecoder_projects')
        .select('id')
        .eq('id', activeProjectId)
        .maybeSingle();

      if (!isMounted) return;

      if (error || !data) {
        // === ZOMBIE DETECTED! ===
        console.warn('[AIBuilderCanvas] Zombie project detected. Performing scorched earth reset.');

        // Nuke all caches
        await nukeSandpackCache();

        // Reset code to blank slate
        resetCode();

        // Force React to destroy and remount preview/chat components
        setResetKey(prev => prev + 1);
        setRefreshKey(prev => prev + 1);

        // Clear all transient state
        setChatResponse(null);
        setLiveSteps([]);
        resetAgent();
        setViewMode('preview');
        setPreviewPath('/');
        setCurrentImageAsset(null);
        setCurrentVideoAsset(null);

        toast.info('Previous project was deleted. Starting fresh.');
      } else {
        // Project verified - prepare for code loading.
        console.log("✅ DB Data received. Mounting.");
        
        // Mount the agent with this project ID (sets the lock)
        mountAgentProject(activeProjectId);
        
        // DO NOT load code here! Messages haven't loaded yet.
        // The separate "restoration effect" will handle code once messagesLoading=false.
        // For now, reset to blank to avoid showing stale code from previous project.
        resetCode();
        
        // SAFETY: After loading, ensure we're not stuck in a generating state
        // This catches edge cases where the previous generation didn't clean up
        setLiveSteps([]);
        setChatResponse(null);

        // NOTE: contentProjectId is NOT set here anymore.
        // It will be set by the restoration effect once messages are loaded and code is mounted.
      }

      setIsVerifyingProject(false);
      loadingProjectRef.current = null; // Clear loading lock - restoration effect can now run
    }

    loadRoute();

    // Cleanup function runs when URL changes or component unmounts
    return () => {
      isMounted = false;
      unmountAgentProject(); // Final safety wipe on exit
    };
  // CRITICAL: Only depend on activeProjectId - NOT messages or other frequently changing values
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProjectId]);

  // =============== CODE RESTORATION FROM MESSAGES ===============
  // This effect runs AFTER messages load from the database.
  // It restores the last code snapshot once messages are available.
  // Separated from the main orchestrator to avoid the infinite loop bug.
  // ALSO sets contentProjectId to "open the gate" once correct content is mounted.
  const hasRestoredCodeRef = useRef<string | null>(null);
  
  useEffect(() => {
    // Skip if orchestrator is still loading this project (ref-based check for race condition)
    if (loadingProjectRef.current === activeProjectId) return;
    
    // Skip if orchestrator is still verifying the project exists
    if (isVerifyingProject) return;
    
    // Skip if messages are still loading
    if (messagesLoading) return;
    
    // Skip if no active project
    if (!activeProjectId) return;
    
    // Skip if we already restored code for this project
    if (hasRestoredCodeRef.current === activeProjectId) return;
    
    // Skip if we're in the middle of a generation (don't overwrite streaming code)
    if (isStreaming) return;
    
    // Restore multi-file projects first, fall back to single-file
    const lastFilesSnapshot = getLastFilesSnapshot();
    if (lastFilesSnapshot && Object.keys(lastFilesSnapshot).length > 0) {
      console.log('📦 Restoring multi-file project from message history for project:', activeProjectId, `(${Object.keys(lastFilesSnapshot).length} files)`);
      setFiles(lastFilesSnapshot);
    } else {
      const lastSnapshot = getLastCodeSnapshot();
      if (lastSnapshot) {
        console.log('📦 Restoring single-file code from message history for project:', activeProjectId);
        setCode(lastSnapshot, true);
      }
    }
    const hasContent = !!(lastFilesSnapshot && Object.keys(lastFilesSnapshot).length > 0) || !!getLastCodeSnapshot();
    // Mark as restored (even if no snapshot - prevents re-running)
    hasRestoredCodeRef.current = activeProjectId;
    
    // CONTENT GATE: Now it's safe to render - correct code/messages are mounted
    console.log('🚪 Opening content gate for project:', activeProjectId);
    setContentProjectId(activeProjectId);
    
    // 🤝 PREVIEW HANDSHAKE: Only wait for Sandpack if we actually set code.
    // If there's no code to restore, don't gate on preview mount — just show immediately.
    if (hasContent) {
      setIsWaitingForPreviewMount(true);
      // Force Sandpack remount so onReady fires reliably
      setRefreshKey(prev => prev + 1);
    } else {
      setIsWaitingForPreviewMount(false);
    }
  }, [activeProjectId, messagesLoading, isVerifyingProject, getLastCodeSnapshot, getLastFilesSnapshot, setCode, setFiles, isStreaming]);

  // Reset restoration tracker when project changes
  useEffect(() => {
    hasRestoredCodeRef.current = null;
  }, [activeProjectId]);


  // NOTE: Draft code is NOT persisted to the public/live slot.
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

    // 🔄 CREATE BACKGROUND JOB: This ensures generation persists even if user leaves
    // The job will be picked up by the edge function and results saved to database
    const job = await createJob(cleanPrompt, promptForAI, activeModel?.id, isPlanMode);

    // Track whether this run is job-backed (used to prevent duplicate message appends)
    activeJobIdRef.current = job?.id ?? null;
    
    if (job) {
      console.log('[BackgroundGen] Created job:', job.id, 'for project:', projectId);
      
      // Start the agent loop with the AI prompt AND the job ID
      // The backend will write results to the job record
      startAgent(promptForAI, existingCodeForAgent, projectId, job.id);
    } else {
      // Fallback: Start without job (streaming only, won't persist if user leaves)
      console.warn('[BackgroundGen] Failed to create job, using streaming-only mode');
      startAgent(promptForAI, existingCodeForAgent, projectId);
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
    setCurrentImageAsset(null);     // Clear any generated assets
    setCurrentVideoAsset(null);
    
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
        setCurrentImageAsset(null);
        setCurrentVideoAsset(null);

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

  // ===== CREATIVE STUDIO: Asset Generation Handlers =====
  
  // Generate asset from image/video model
  const handleGenerateAsset = useCallback(async (model: AIModel, prompt: string) => {
    const isVideoModel = model.category === 'video';
    
    // Switch to the appropriate view immediately
    setViewMode(isVideoModel ? 'video' : 'image');
    
    // Set loading state for the appropriate type
    if (isVideoModel) {
      setIsVideoGenerating(true);
      setCurrentVideoAsset(null);
    } else {
      setIsImageGenerating(true);
      setCurrentImageAsset(null);
    }
    
    setLastAssetPrompt(prompt);
    setLastAssetModel(model);

    try {
      // Call the backend to generate the asset
      const { data, error } = await supabase.functions.invoke('storefront-generate-asset', {
        body: { 
          prompt, 
          modelId: model.id,
          type: isVideoModel ? 'video' : 'image',
        },
      });

      if (error) throw error;

      // Create the asset object
      const newAsset: GeneratedAsset = {
        id: crypto.randomUUID(),
        type: isVideoModel ? 'video' : 'image',
        url: data.url || data.imageUrl,
        prompt,
        modelId: model.id,
        createdAt: new Date(),
      };

      // Set the generated asset to the appropriate state
      if (isVideoModel) {
        setCurrentVideoAsset(newAsset);
      } else {
        setCurrentImageAsset(newAsset);
      }
    } catch (error) {
      console.error('Asset generation failed:', error);
      toast.error('Failed to generate asset. Please try again.');
    } finally {
      if (isVideoModel) {
        setIsVideoGenerating(false);
      } else {
        setIsImageGenerating(false);
      }
    }
  }, []);

  // Retry asset generation with same prompt
  const handleRetryAsset = useCallback(() => {
    if (lastAssetModel && lastAssetPrompt) {
      handleGenerateAsset(lastAssetModel, lastAssetPrompt);
    }
  }, [lastAssetModel, lastAssetPrompt, handleGenerateAsset]);

  // Get the current active asset based on view mode
  const currentAsset = viewMode === 'video' ? currentVideoAsset : currentImageAsset;
  const isCurrentlyGenerating = viewMode === 'video' ? isVideoGenerating : isImageGenerating;

  // Apply generated asset to canvas via code injection
  const handleApplyAssetToCanvas = useCallback((instructions: string) => {
    const assetToApply = viewMode === 'video' ? currentVideoAsset : currentImageAsset;
    if (!assetToApply) return;

    setShowPlacementModal(false);
    setViewMode('preview');

    // Construct a specialized prompt for the AI to inject the asset
    const injectionPrompt = `
[ASSET_INJECTION_REQUEST]
Asset Type: ${assetToApply.type}
Asset URL: ${assetToApply.url}
User Instructions: ${instructions}

TASK: Modify the existing storefront code to place this ${assetToApply.type} asset as specified by the user. 
- Use an <img> tag for images or <video> tag for videos
- Apply appropriate styling (object-fit, width, height) based on the placement
- Ensure the asset is responsive and fits the design
`;

    // Send to the code generator
    handleSendMessage(injectionPrompt);
    
    // Clear the appropriate asset
    if (viewMode === 'video') {
      setCurrentVideoAsset(null);
    } else {
      setCurrentImageAsset(null);
    }
  }, [viewMode, currentVideoAsset, currentImageAsset, handleSendMessage]);

  // Asset feedback handler
  const handleAssetFeedback = useCallback((rating: 'positive' | 'negative') => {
    const activeAsset = viewMode === 'video' ? currentVideoAsset : currentImageAsset;
    // TODO: Log feedback for model improvement
    console.log('Asset feedback:', rating, activeAsset?.id);
    toast.success(rating === 'positive' ? 'Thanks for the feedback!' : 'Noted! Try regenerating.');
  }, [viewMode, currentVideoAsset, currentImageAsset]);


  // Mark boot complete when data is ready (no loading screen needed)
  const isDataLoading = loading || projectsLoading || isVerifyingProject || messagesLoading;
  
  useEffect(() => {
    if (!hasBooted && !isDataLoading) {
      setHasBooted(true);
    }
  }, [hasBooted, isDataLoading]);

  // 🛑 THE GATEKEEPER 🛑
  // Prevent "flash of old content" when switching projects.
  // Core rule: NEVER render the workspace with files/messages that belong to a different project.
  // We gate on `contentProjectId` (the project whose content is actually mounted) instead of
  // only async flags, so we also cover the 1-frame gap right after the URL/activeProjectId flips.
  // 
  // CRITICAL: The PRIMARY check is contentProjectId !== activeProjectId.
  // This is the ONLY reliable way to know if the correct content is mounted.
  // 🤝 HANDSHAKE: Also wait for Sandpack to signal it's ready (isWaitingForPreviewMount)
  const isProjectTransitioning = Boolean(
    activeProjectId && (
      contentProjectId !== activeProjectId ||
      isVerifyingProject ||
      messagesLoading ||
      isWaitingForPreviewMount || // Wait for Sandpack's onReady signal
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

    // 2. Create the project (this sets activeProjectId + updates URL)
    // skipInitialLoad=true prevents the message-loading effect from wiping our optimistic message
    const newProjectId = await ensureProject(projectName, true);
    if (!newProjectId) {
      toast.error('Failed to create project');
      return;
    }

    // 3. Prepare the prompt (inject plan mode instruction if needed)
    let finalPrompt = prompt;
    if (isPlanMode) {
      finalPrompt = `[ARCHITECT_MODE_ACTIVE]\nUser Request: ${prompt}\n\nINSTRUCTION: Do NOT generate code. Create a detailed implementation plan. Output JSON: { "type": "plan", "title": "...", "summary": "...", "steps": ["step 1", "step 2"] }`;
    }

    // 4. Mark this project so the useEffect auto-start guard doesn't double-fire
    startedInitialForProjectRef.current = newProjectId;

    // 5. 🔒 LOCK: Set generation lock to this project
    generationLockRef.current = newProjectId;

    // 6. Cover Sandpack until bundling finishes
    setIsAwaitingPreviewReady(true);

    // 7. Save the user message to DB — CRITICAL: pass newProjectId explicitly
    //    because activeProjectId in the closure is still stale (React batching)
    await addMessage('user', prompt, undefined, newProjectId);

    // 8. 🔄 CREATE BACKGROUND JOB: Ensures generation persists even if user leaves
    //    This was missing before — heroOnStart skipped job creation, so if the stream
    //    failed there was nothing to recover from and the request just vanished.
    const job = await createJob(prompt, finalPrompt, activeModel?.id, isPlanMode, newProjectId);

    // Track whether this run is job-backed
    activeJobIdRef.current = job?.id ?? null;

    // 9. Start the agent with job ID for persistence
    if (job) {
      console.log('[heroOnStart] Created job:', job.id, 'for project:', newProjectId);
      startAgent(finalPrompt, undefined, newProjectId, job.id);
    } else {
      // Fallback: Start without job (streaming only, won't persist if user leaves)
      console.warn('[heroOnStart] Failed to create job, using streaming-only mode');
      startAgent(finalPrompt, undefined, newProjectId);
    }
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
                              setIsWaitingForPreviewMount(false);
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
                          setIsWaitingForPreviewMount(false);
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
