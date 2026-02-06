import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AIBuilderOnboarding, useAIBuilderOnboarding } from './AIBuilderOnboarding';
import { VibecoderPreview } from './VibecoderPreview';
import { VibecoderChat } from './VibecoderChat';
import { ProjectSidebar } from './ProjectSidebar';
import { PreviewErrorBoundary } from './PreviewErrorBoundary';
import { VibecoderHeader } from './VibecoderHeader';
import { useStreamingCode } from './useStreamingCode';
import { useVibecoderProjects } from './hooks/useVibecoderProjects';
import { useAgentLoop } from '@/hooks/useAgentLoop';
import { GenerationCanvas } from './GenerationCanvas';
import { PlacementPromptModal } from './PlacementPromptModal';
import { AI_MODELS, type AIModel } from './ChatInputBar';
import type { GeneratedAsset, ViewMode } from './types/generation';
import { parseRoutesFromCode, type SitePage } from '@/utils/routeParser';
import { toast } from 'sonner';
import { clearProjectCache } from './utils/projectCache';
import { LovableHero } from './LovableHero';
import { PremiumLoadingScreen } from './PremiumLoadingScreen';

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
  
  // Minimum loading time state - ensures smooth loading animation
  const [minLoadingComplete, setMinLoadingComplete] = useState(false);
  
  // Reset key to force component re-mount on project deletion
  const [resetKey, setResetKey] = useState(0);
  
  // STRICT LOADING: Verify project exists before rendering preview
  const [isVerifyingProject, setIsVerifyingProject] = useState(false);
  
  // Canvas ready state - waits for Sandpack to finish initial bundle
  const [isCanvasReady, setIsCanvasReady] = useState(false);
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
  
  // Flag to prevent double-firing agent on mount with location state
  const hasStartedInitialRef = useRef(false);
  
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
  
  // Streaming code state
  const { 
    code, 
    isStreaming, 
    streamCode, 
    cancelStream, 
    resetCode,
    setCode,
    DEFAULT_CODE 
  } = useStreamingCode({
    onLogUpdate: (logs) => {
      // Update live steps in real-time as they stream in
      setLiveSteps(logs);
      // Also forward to agent loop for logging
      logs.forEach(log => onStreamLog(log));
    },
    onComplete: async (finalCode) => {
      // Clear live steps and save to project_files on completion
      setLiveSteps([]);
      await saveVibecoderCode(finalCode);
      
      // Add assistant message with code snapshot
      await addMessage('assistant', 'Generated your storefront design.', finalCode);
      
      // Notify agent loop that streaming is complete
      onStreamingComplete();
    },
    onChatResponse: async (text) => {
      // AI responded with a chat message instead of code
      setLiveSteps([]);
      setChatResponse(text);
      await addMessage('assistant', text);
      // Reset agent on chat response (no code generated)
      resetAgent();
    },
    onError: (err) => {
      setLiveSteps([]);
      toast.error(err.message);
      onStreamingError(err.message);
    }
  });

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
  } = useAgentLoop({
    onStreamCode: streamCode,
    onComplete: () => {
      console.log('[AgentLoop] Complete');
    },
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

  // AUTO-START: Pick up initial prompt from navigation state (passed from Hero)
  useEffect(() => {
    const initialPrompt = (location.state as { initialPrompt?: string })?.initialPrompt;
    
    // Check if we just arrived with a prompt to auto-start
    if (activeProjectId && initialPrompt && !hasStartedInitialRef.current && !projectsLoading) {
      console.log('🚀 Picking up initial prompt from navigation:', initialPrompt);
      
      hasStartedInitialRef.current = true;
      
      // Trigger the agent immediately
      startAgent(initialPrompt, undefined);
      
      // Clear the state so it doesn't re-fire on refresh
      window.history.replaceState({}, document.title);
    }
  }, [activeProjectId, location.state, projectsLoading, startAgent]);

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

  // SCORCHED EARTH: Verify project exists on switch & force reset if zombie detected
  useEffect(() => {
    // Reset canvas ready state when project changes to re-trigger Sandpack ready detection
    setIsCanvasReady(false);

    async function verifyAndLoadProject() {
      // No project selected - force a true blank slate (prevents zombie UI from sticking around)
      if (!activeProjectId) {
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

      // Check if project actually exists in DB
      const { data, error } = await supabase
        .from('vibecoder_projects')
        .select('id')
        .eq('id', activeProjectId)
        .maybeSingle();

      if (error || !data) {
        // === ZOMBIE DETECTED! ===
        console.warn('[AIBuilderCanvas] Zombie project detected. Performing scorched earth reset.');

        // 1. Wipe all cached data for this project
        await clearProjectCache(activeProjectId);

        // 2. Reset code to blank slate
        resetCode();

        // 3. Force React to destroy and remount preview/chat components
        setResetKey(prev => prev + 1);
        setRefreshKey(prev => prev + 1);

        // 4. Clear all transient state
        setChatResponse(null);
        setLiveSteps([]);
        resetAgent();
        setViewMode('preview');
        setPreviewPath('/');
        setCurrentImageAsset(null);
        setCurrentVideoAsset(null);

        toast.info('Previous project was deleted. Starting fresh.');
      } else {
        // Project verified - load code.
        // Primary source of truth: last assistant code_snapshot in message history.
        // Fallback: profile-scoped /App.tsx persisted in project_files.
        const lastSnapshot = getLastCodeSnapshot();
        if (lastSnapshot) {
          setCode(lastSnapshot);
        } else {
          const { data: fileRow, error: fileErr } = await supabase
            .from('project_files')
            .select('content')
            .eq('profile_id', profileId)
            .eq('file_path', '/App.tsx')
            .maybeSingle();

          if (!fileErr && fileRow?.content) {
            setCode(fileRow.content);
          }
        }
      }

      setIsVerifyingProject(false);
    }

    verifyAndLoadProject();
  }, [activeProjectId, messages, getLastCodeSnapshot, profileId, setCode, resetCode, resetAgent]);

  // Save vibecoder code to project_files
  const saveVibecoderCode = async (codeContent: string) => {
    try {
      await supabase
        .from('project_files')
        .upsert({
          profile_id: profileId,
          file_path: '/App.tsx',
          content: codeContent,
          updated_at: new Date().toISOString(),
        }, { 
          onConflict: 'profile_id,file_path',
        });
    } catch (err) {
      console.error('Failed to save vibecoder code:', err);
    }
  };

  // Undo (restore previous code snapshot)
  const handleUndo = useCallback(() => {
    const previousSnapshot = getPreviousCodeSnapshot();
    if (previousSnapshot) {
      setCode(previousSnapshot);
      saveVibecoderCode(previousSnapshot);
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
        await saveVibecoderCode(restoredCode);
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
      // Update layout to published
      await supabase
        .from('ai_storefront_layouts')
        .upsert({
          profile_id: profileId,
          is_published: true,
          vibecoder_mode: true,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'profile_id' });

      // Set profile to use AI mode AND link the active project
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
  const handleSendMessage = async (prompt: string) => {
    const isFreshStart = !activeProjectId;
    
    // Generate a smart project name from the first prompt
    // Extract first 4-5 meaningful words as the project name
    let projectName: string | undefined;
    if (isFreshStart) {
      const words = prompt
        .replace(/[^\w\s]/g, '') // Remove punctuation
        .split(/\s+/)
        .filter(w => w.length > 2) // Skip tiny words
        .slice(0, 5);
      projectName = words.length > 0 ? words.join(' ') : undefined;
    }
    
    // Auto-create project if we don't have one yet (with smart name)
    const projectId = await ensureProject(projectName);
    if (!projectId) {
      toast.error('Failed to start project');
      return;
    }

    // Add user message to history
    await addMessage('user', prompt);
    
    // Start the agent loop (which internally calls streamCode)
    startAgent(prompt, code !== DEFAULT_CODE ? code : undefined);
  };

  // Handle new project creation
  const handleCreateProject = async () => {
    const project = await createProject('New Storefront');
    if (project) {
      resetCode();
      toast.success('New project created');
    }
  };

  // Handle project deletion (uses the "Total Deletion" RPC + Scorched Earth cache clear)
  const handleDeleteProject = async (projectIdToDelete: string) => {
    const isActiveProject = activeProjectId === projectIdToDelete;
    const remainingAfterDelete = projects.filter(p => p.id !== projectIdToDelete);

    const success = await deleteProject(projectIdToDelete);

    if (success) {
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
        // 1. Reset code to blank slate
        resetCode();

        // 2. Clear chat response state
        setChatResponse(null);

        // 3. Clear agent/streaming state
        setLiveSteps([]);
        resetAgent();

        // 4. Reset view mode to default
        setViewMode('preview');
        setPreviewPath('/');

        // 5. Clear any generated assets
        setCurrentImageAsset(null);
        setCurrentVideoAsset(null);

        // 6. Increment resetKey to force React to DESTROY and re-mount all preview/chat components
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
  }, [triggerSelfCorrection]);

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


  // Show premium loading screen until BOTH conditions are met:
  // 1. Data is loaded (projects, messages, verification)
  // 2. Minimum loading animation has completed (4 seconds for smooth UX)
  const isDataLoading = loading || projectsLoading || isVerifyingProject || messagesLoading;
  const shouldShowLoading = isDataLoading || !minLoadingComplete;
  
  if (shouldShowLoading) {
    return (
      <PremiumLoadingScreen 
        onComplete={() => setMinLoadingComplete(true)}
      />
    );
  }

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

  // === FRESH USER: Show full-screen hero with no panels ===
  // The hero is the ONLY thing on screen until they type their first prompt
  if (projects.length === 0) {
    return (
      <LovableHero
        onStart={async (prompt, isPlanMode) => {
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
            replace: true, // Replace current URL so back button works correctly
          });
        }}
        userName={username ?? 'Creator'}
      />
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
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* LEFT PANEL: Always show Sandpack preview (default code when no project) */}
          <div
            className="flex-1 min-w-0 bg-background overflow-hidden relative flex flex-col"
            style={{ isolation: 'isolate', contain: 'strict' }}
          >
            {(viewMode === 'image' || viewMode === 'video') ? (
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
              /* Live Preview: Sandpack iframe - always rendered with DEFAULT_CODE when no project */
              <div className={`flex-1 min-h-0 relative ${deviceMode === 'mobile' ? 'flex items-center justify-center bg-muted' : ''}`}>
                <div
                  className={`h-full ${deviceMode === 'mobile' ? 'w-[375px] border-x border-border shadow-2xl' : 'w-full'}`}
                >
                  <PreviewErrorBoundary
                    onAutoFix={handleAutoFix}
                    onReset={resetCode}
                  >
                    <VibecoderPreview
                      key={`preview-${activeProjectId ?? 'fresh'}-${resetKey}-${refreshKey}`}
                      code={code}
                      isStreaming={isStreaming}
                      viewMode={viewMode}
                      onReady={() => setIsCanvasReady(true)}
                      onError={(error) => {
                        console.warn('[VibecoderPreview] Sandpack error detected:', error);
                      }}
                    />
                  </PreviewErrorBoundary>
                </div>
                
                {/* Canvas loading overlay - shows until Sandpack is ready */}
                {!isCanvasReady && (
                  <div className="absolute inset-0 z-30 bg-background flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm text-muted-foreground">Loading canvas...</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Overlay while dragging */}
            {isDragging && <div className="absolute inset-0 z-50 bg-transparent cursor-ew-resize" />}
          </div>

          {/* RIGHT PANEL: Chat - ALWAYS VISIBLE */}
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
            />
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
