import { useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AIBuilderOnboarding, useAIBuilderOnboarding } from './AIBuilderOnboarding';
import { VibecoderPreview } from './VibecoderPreview';
import { VibecoderChat } from './VibecoderChat';
import { ProjectSidebar } from './ProjectSidebar';
import { PreviewErrorBoundary } from './PreviewErrorBoundary';
import { VibecoderHeader } from './VibecoderHeader';
import { useStreamingCode } from './useStreamingCode';
import { useVibecoderProjects, type VibecoderMessage } from './hooks/useVibecoderProjects';
import { useAgentLoop } from '@/hooks/useAgentLoop';
import { useBackgroundGeneration, type GenerationJob } from '@/hooks/useBackgroundGeneration';
import { GenerationCanvas } from './GenerationCanvas';
import { ProductsPanel } from './ProductsPanel';
import { PlacementPromptModal } from './PlacementPromptModal';
import { AI_MODELS, type AIModel } from './ChatInputBar';
import type { GeneratedAsset, ViewMode } from './types/generation';
import { parseRoutesFromCode, type SitePage } from '@/utils/routeParser';
import { toast } from 'sonner';
import { nukeSandpackCache, clearProjectLocalStorage } from '@/utils/storageNuke';
import { LovableHero } from './LovableHero';

import { FixErrorToast } from './FixErrorToast';
import { checkPolicyViolation } from '@/utils/policyGuard';

interface AIBuilderCanvasProps {
  profileId: string;
}

export function AIBuilderCanvas({ profileId }: AIBuilderCanvasProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isPublished, setIsPublished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  const [userCredits, setUserCredits] = useState(0);
  const [subscriptionTier, setSubscriptionTier] = useState<string | null>(null);
  const { needsOnboarding, completeOnboarding } = useAIBuilderOnboarding(profileId);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  

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
  
  // Generation state for Creative Studio (Image & Video tabs)
  const [currentImageAsset, setCurrentImageAsset] = useState<GeneratedAsset | null>(null);
  const [currentVideoAsset, setCurrentVideoAsset] = useState<GeneratedAsset | null>(null);
  const [isImageGenerating, setIsImageGenerating] = useState(false);
  const [isVideoGenerating, setIsVideoGenerating] = useState(false);
  const [showPlacementModal, setShowPlacementModal] = useState(false);
  const [lastAssetPrompt, setLastAssetPrompt] = useState<string>('');
  const [lastAssetModel, setLastAssetModel] = useState<AIModel | null>(null);
  
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
  const [isDragging, setIsDragging] = useState(false);
  
  // Drag handlers for resizable sidebar
  const startResizing = useCallback(() => {
    setIsDragging(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsDragging(false);
  }, []);

  const resize = useCallback(
    (mouseMoveEvent: MouseEvent) => {
      if (isDragging) {
        // Calculate new width from the right edge of screen
        const newWidth = window.innerWidth - mouseMoveEvent.clientX;
        // Constraints: Min 300px, Max 800px
        if (newWidth > 300 && newWidth < 800) {
          setSidebarWidth(newWidth);
        }
      }
    },
    [isDragging]
  );

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);
  
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
    getPreviousCodeSnapshot,
    restoreToVersion,
  } = useVibecoderProjects();
  
  // Chat response state for intent router
  const [chatResponse, setChatResponse] = useState<string | null>(null);
  
  // Live steps state for real-time transparency (legacy fallback)
  const [liveSteps, setLiveSteps] = useState<string[]>([]);

  // Preview error state (Sandpack compile/runtime)
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [showFixToast, setShowFixToast] = useState(false);
  const lastPreviewErrorRef = useRef<string | null>(null);
  
  // 📋 PLAN MODE STATE
  const [isPlanMode, setIsPlanMode] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<{ plan: import('./useStreamingCode').PlanData; originalPrompt: string } | null>(null);
  // Streaming code state
  const { 
    code, 
    isStreaming, 
    streamCode, 
    cancelStream, 
    resetCode,
    setCode,
    forceResetStreaming,
    DEFAULT_CODE 
  } = useStreamingCode({
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

      // 🛑 DOUBLE-CHECK: Verify lock before saving (belt + suspenders)
      if (generationLockRef.current && generationLockRef.current !== activeProjectId) {
        console.warn('🛑 Discarded code: Project mismatch on completion');
        generationLockRef.current = null;
        pendingSummaryRef.current = '';
        resetAgent();
        return;
      }

      // Use the REAL AI summary, or fallback if empty
      const capturedSummary = pendingSummaryRef.current;
      console.log('[Vibecoder] 💬 Final summary for message:', capturedSummary?.substring(0, 150) || '(empty - using fallback)');
      
      const aiResponse = capturedSummary || 'Updated the storefront based on your request.';
      pendingSummaryRef.current = ''; // Reset for next generation

      // Add assistant message with code snapshot (project-scoped)
      // Pass the locked project ID explicitly for safety
      await addMessage('assistant', aiResponse, finalCode, generationLockRef.current || undefined);

      // Release the lock
      generationLockRef.current = null;

      // Notify agent loop that streaming is complete
      onStreamingComplete();
    },
    onChatResponse: async (text) => {
      // AI responded with a chat message instead of code
      setLiveSteps([]);
      setChatResponse(text);
      await addMessage('assistant', text, undefined, generationLockRef.current || undefined);
      generationLockRef.current = null; // Release lock
      // Reset agent on chat response (no code generated)
      resetAgent();
    },
    onPlanResponse: async (plan, originalPrompt) => {
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
      toast.error(err.message);
      onStreamingError(err.message);
    }
  });

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
  } = useAgentLoop({
    onStreamCode: streamCode,
    onComplete: () => {
      console.log('[AgentLoop] Complete');
    },
    getActiveProjectId: () => activeProjectId,
  });

  // 🔄 BACKGROUND GENERATION: Jobs that persist even if user leaves
  const handleJobComplete = useCallback((job: GenerationJob) => {
    console.log('[BackgroundGen] Job completed:', job.id);
    
    // If we have code result, apply it
    if (job.code_result) {
      setCode(job.code_result);
      // Note: Removed toast - feedback shown in chat only
    }
    
    // If we have a plan result, show the plan approval card
    if (job.plan_result) {
      setPendingPlan({
        plan: job.plan_result,
        originalPrompt: job.prompt
      });
    }
    
    // Add assistant message with the summary
    if (job.summary && activeProjectId) {
      addMessage('assistant', job.summary, job.code_result || undefined, activeProjectId);
    }
  }, [setCode, activeProjectId, addMessage]);

  const handleJobError = useCallback((job: GenerationJob) => {
    console.error('[BackgroundGen] Job failed:', job.error_message);
    toast.error(`Generation failed: ${job.error_message || 'Unknown error'}`);
  }, []);

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

  // Dynamically detected pages from generated code
  const detectedPages = useMemo<SitePage[]>(() => {
    return parseRoutesFromCode(code);
  }, [code]);

  // Show onboarding on first visit
  useEffect(() => {
    if (!loading && needsOnboarding) {
      setShowOnboarding(true);
    }
  }, [loading, needsOnboarding]);

  // 🔄 RESUME: Check for completed jobs when returning to the page
  useEffect(() => {
    if (hasCompletedJob && currentJob && !isLoadingJob) {
      console.log('[BackgroundGen] Found completed job on mount, applying results...');
      
      // Apply the completed job's results
      if (currentJob.code_result) {
        setCode(currentJob.code_result);
        // Note: Removed toast - feedback shown in chat only
      }
      
      if (currentJob.plan_result) {
        setPendingPlan({
          plan: currentJob.plan_result,
          originalPrompt: currentJob.prompt
        });
      }
      
      if (currentJob.summary && activeProjectId) {
        addMessage('assistant', currentJob.summary, currentJob.code_result || undefined, activeProjectId);
      }
      
      // Acknowledge the job so we don't re-apply on next mount
      acknowledgeJob(currentJob.id);
    }
  }, [hasCompletedJob, currentJob, isLoadingJob, setCode, activeProjectId, addMessage, acknowledgeJob]);

  // Note: Removed toast notification for active jobs - all feedback shown in chat only

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
      const [layoutResp, profileResp, walletResp] = await Promise.all([
        supabase
          .from('ai_storefront_layouts')
          .select('*')
          .eq('profile_id', profileId)
          .maybeSingle(),
        supabase
          .from('profiles')
          .select('username, avatar_url, subscription_tier')
          .eq('id', profileId)
          .maybeSingle(),
        supabase
          .from('user_wallets')
          .select('balance')
          .eq('user_id', profileId)
          .maybeSingle(),
      ]);

      if (layoutResp.data) {
        setIsPublished(layoutResp.data.is_published);
      }

      // Set profile data for header
      if (profileResp.data) {
        setUsername(profileResp.data.username);
        setUserAvatarUrl(profileResp.data.avatar_url);
        setSubscriptionTier(profileResp.data.subscription_tier);
      }

      // Set user credits
      if (walletResp.data) {
        setUserCredits(walletResp.data.balance ?? 0);
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
    unmountAgentProject();
    cancelStream();
    cancelAgent();
    forceResetStreaming();
    generationLockRef.current = null;

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
    
    const lastSnapshot = getLastCodeSnapshot();
    if (lastSnapshot) {
      console.log('📦 Restoring code from message history for project:', activeProjectId);
      setCode(lastSnapshot);
    }
    // Mark as restored (even if no snapshot - prevents re-running)
    hasRestoredCodeRef.current = activeProjectId;
    
    // CONTENT GATE: Now it's safe to render - correct code/messages are mounted
    console.log('🚪 Opening content gate for project:', activeProjectId);
    setContentProjectId(activeProjectId);
    
    // 🤝 PREVIEW HANDSHAKE: Start waiting for Sandpack to signal it's ready
    // This keeps the loader visible until the iframe is actually painted
    setIsWaitingForPreviewMount(true);
  }, [activeProjectId, messagesLoading, isVerifyingProject, getLastCodeSnapshot, setCode, isStreaming]);

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
      setCode(previousSnapshot);
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
        setCode(restoredCode);
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

      toast.warning(violation.message, {
        duration: 8000,
        icon: '🛡️',
      });

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

    // Add user message to history (CLEAN prompt only - no system instructions visible)
    await addMessage('user', cleanPrompt, undefined, projectId);

    // 🔄 CREATE BACKGROUND JOB: This ensures generation persists even if user leaves
    // The job will be picked up by the edge function and results saved to database
    const job = await createJob(cleanPrompt, promptForAI, activeModel?.id, isPlanMode);
    
    if (job) {
      console.log('[BackgroundGen] Created job:', job.id, 'for project:', projectId);
      
      // Start the agent loop with the AI prompt AND the job ID
      // The edge function will write results to the job record
      startAgent(promptForAI, code !== DEFAULT_CODE ? code : undefined, projectId, job.id);
    } else {
      // Fallback: Start without job (streaming only, won't persist if user leaves)
      console.warn('[BackgroundGen] Failed to create job, using streaming-only mode');
      startAgent(promptForAI, code !== DEFAULT_CODE ? code : undefined, projectId);
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

  // Show onboarding modal for first-time users
  if (showOnboarding) {
    return (
      <AIBuilderOnboarding
        profileId={profileId}
        onConfirm={() => {
          completeOnboarding();
          setShowOnboarding(false);
        }}
        onCancel={() => navigate(-1)}
      />
    );
  }

  const isEmpty = code === DEFAULT_CODE;
  const canUndo = messages.filter(m => m.code_snapshot).length > 1;
  const hasActiveProject = Boolean(activeProjectId);

  const heroOnStart = async (prompt: string, isPlanMode?: boolean) => {
    // 1. Extract smart project name from first 5 words
    const projectName = prompt.split(/\s+/).slice(0, 5).join(' ');

    // 2. Create the project (this also navigates via URL update)
    const newProjectId = await ensureProject(projectName);
    if (!newProjectId) {
      toast.error('Failed to create project');
      return;
    }

    // 3. Prepare the prompt (inject plan mode instruction if needed)
    let finalPrompt = prompt;
    if (isPlanMode) {
      finalPrompt = `[ARCHITECT_MODE_ACTIVE]\nUser Request: ${prompt}\n\nINSTRUCTION: Do NOT generate code. Create a detailed implementation plan. Output JSON: { "type": "plan", "title": "...", "summary": "...", "steps": ["step 1", "step 2"] }`;
    }

    // 4. IMPORTANT: Save the FIRST user message to DB so history persists
    await addMessage('user', prompt);

    // 5. Navigate to the project URL with initialPrompt in state
    // The useEffect above will pick this up and start the agent
    navigate(`/ai-builder?project=${newProjectId}`, {
      state: { initialPrompt: finalPrompt },
      replace: true,
    });
  };

  // === DOORWAY: If no active project, show the magical prompt-first screen ===
  // - Fresh users: full-screen doorway (no sidebar)
  // - Existing users clicking "New project": doorway inside the editor frame
  if (!activeProjectId) {
    if (projects.length === 0) {
      return (
        <LovableHero
          onStart={heroOnStart}
          userName={username ?? 'Creator'}
          variant="fullscreen"
        />
      );
    }

    return (
      <div className="h-screen w-full bg-background flex overflow-hidden p-2">
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

        <div className="flex-1 flex flex-col min-h-0 rounded-2xl border border-border overflow-hidden bg-background">
          <VibecoderHeader
            projectName={undefined}
            viewMode={viewMode}
            setViewMode={setViewMode}
            deviceMode={deviceMode}
            setDeviceMode={setDeviceMode}
            onRefresh={handleRefresh}
            onPublish={handlePublish}
            isPublished={isPublished}
            isPublishing={publishing}
            isEmpty={true}
            username={username}
            currentPath={previewPath}
            onNavigate={setPreviewPath}
            pages={detectedPages}
            onRegenerate={(tweak) => {
              handleSendMessage(`Refine the current design: ${tweak}`);
            }}
            isGenerating={isStreaming}
            avatarUrl={userAvatarUrl}
            userCredits={userCredits}
            subscriptionTier={subscriptionTier}
            onSignOut={handleSignOut}
          />

          <div className="flex-1 min-h-0">
            <LovableHero
              onStart={heroOnStart}
              userName={username ?? 'Creator'}
              variant="embedded"
              onBack={() => {
                // Return to the most recently edited project (first in list)
                if (projects[0]) selectProject(projects[0].id);
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // === EXISTING USER: Show the full editor interface ===
  return (
    <div className="h-screen w-full bg-background flex overflow-hidden p-2">
      {/* Project sidebar - outside main container */}
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

      {/* MAIN SEAMLESS CONTAINER */}
      <div className="flex-1 flex flex-col min-h-0 rounded-2xl border border-border overflow-hidden bg-background">
        {/* Integrated Header */}
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
          isEmpty={isEmpty}
          username={username}
          currentPath={previewPath}
          onNavigate={setPreviewPath}
          pages={detectedPages}
          onRegenerate={(tweak) => {
            // Send tweak as a new message to refine the current design
            handleSendMessage(`Refine the current design: ${tweak}`);
          }}
          isGenerating={isStreaming}
          avatarUrl={userAvatarUrl}
          userCredits={userCredits}
          subscriptionTier={subscriptionTier}
          onSignOut={handleSignOut}
        />

        {/* Split View Content - Chat + Preview always visible */}
        <div className="flex-1 flex min-h-0 overflow-hidden relative">

          {/* LEFT PANEL: Preview/Studio (seamless) */}
          <div
            className="flex-1 min-w-0 overflow-hidden relative flex flex-col bg-zinc-950"
            style={{ isolation: 'isolate', contain: 'strict' }}
          >
            {/* Soft edge shadow to separate preview from chat without boxing */}
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 z-20 bg-gradient-to-l from-background/70 to-transparent" />

            {viewMode === 'products' ? (
              /* Products Panel: Show creator's products */
              <ProductsPanel profileId={profileId} />
            ) : (viewMode === 'image' || viewMode === 'video') ? (
              /* Creative Studio: Image/Video generation */
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
              /* Live Preview: Sandpack iframe - CRITICAL: bg-zinc-950 ensures no white flash */
              <div className={`flex-1 min-h-0 relative bg-zinc-950 ${deviceMode === 'mobile' ? 'flex items-center justify-center' : ''}`}>
                <div
                  className={`h-full ${deviceMode === 'mobile' ? 'w-[375px] border-x border-zinc-800 shadow-2xl bg-zinc-950' : 'w-full'} relative`}
                >

                  <PreviewErrorBoundary
                    onAutoFix={handleAutoFix}
                    onReset={() => {
                      setIsAwaitingPreviewReady(false);
                      resetCode();
                    }}
                  >
                    <VibecoderPreview
                      key={`preview-${activeProjectId ?? 'fresh'}-${resetKey}-${refreshKey}`}
                      code={code}
                      isStreaming={isStreaming}
                      showLoadingOverlay={false}
                      onReady={() => {
                        // 🤝 HANDSHAKE COMPLETE: Sandpack is ready, release the transition lock
                        setIsWaitingForPreviewMount(false);
                        setIsAwaitingPreviewReady(false);
                        // If the bundle becomes healthy again, clear the toast.
                        setPreviewError(null);
                        setShowFixToast(false);
                        lastPreviewErrorRef.current = null;
                      }}
                      onError={handlePreviewError}
                      viewMode={viewMode}
                    />
                  </PreviewErrorBoundary>

                  {/* Only show error toast when NOT streaming - errors during streaming are expected */}
                  {showFixToast && previewError && !isStreaming && (
                    <FixErrorToast
                      error={previewError}
                      onDismiss={() => setShowFixToast(false)}
                      onFix={() => {
                        const report = `CRITICAL_ERROR_REPORT: The preview has the following build error: "${previewError}". Analyze the latest code you generated, identify the cause (syntax error, missing import, undefined variable, etc.), and fix it immediately. Do NOT ask questions.`;
                        handleAutoFix(report);
                        setShowFixToast(false);
                      }}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Overlay while dragging */}
            {isDragging && <div className="absolute inset-0 z-50 bg-transparent cursor-ew-resize" />}
          </div>

          {/* SUBTLE SEPARATOR LINE */}
          <div className="w-px shrink-0 bg-border/40" />

          {/* RIGHT PANEL: Chat (seamless) */}
          <div
            style={{ width: sidebarWidth }}
            className="shrink-0 flex flex-col bg-muted/50 overflow-hidden relative"
          >
            {/* Refined drag handle - subtle until interaction */}
            <div
              onMouseDown={startResizing}
              className={`absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize z-50 transition-all ${
                isDragging
                  ? 'bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.35)]'
                  : 'bg-transparent hover:bg-border'
              }`}
            />

            <div className="flex-1 min-h-0 overflow-hidden" style={{ isolation: 'isolate' }}>
              <VibecoderChat
                key={`chat-${activeProjectId ?? 'fresh'}-${resetKey}`}
                onSendMessage={handleSendMessage}
                onGenerateAsset={handleGenerateAsset}
                isStreaming={isStreaming || isAgentRunning}
                onCancel={() => {
                  cancelStream();
                  cancelAgent();
                }}
                messages={messages}
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
                isPlanMode={isPlanMode}
                onPlanModeChange={setIsPlanMode}
                pendingPlan={pendingPlan}
                onApprovePlan={handleApprovePlan}
                onRejectPlan={handleRejectPlan}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Placement Prompt Modal */}
      <PlacementPromptModal
        isOpen={showPlacementModal}
        onClose={() => setShowPlacementModal(false)}
        onSubmit={handleApplyAssetToCanvas}
        asset={currentAsset}
      />
    </div>
  );
}
