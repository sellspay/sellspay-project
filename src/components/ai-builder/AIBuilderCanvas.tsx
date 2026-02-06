import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AIBuilderOnboarding, useAIBuilderOnboarding } from './AIBuilderOnboarding';
import { VibecoderPreview } from './VibecoderPreview';
import { VibecoderChat } from './VibecoderChat';
import { ProjectSidebar } from './ProjectSidebar';
import { PreviewErrorBoundary } from './PreviewErrorBoundary';
import { VibecoderHeader } from './VibecoderHeader';
import { useStreamingCode } from './useStreamingCode';
import { useVibecoderProjects } from './hooks/useVibecoderProjects';
import { toast } from 'sonner';

interface AIBuilderCanvasProps {
  profileId: string;
}

export function AIBuilderCanvas({ profileId }: AIBuilderCanvasProps) {
  const navigate = useNavigate();
  const [isPublished, setIsPublished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const { needsOnboarding, completeOnboarding } = useAIBuilderOnboarding(profileId);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Reset key to force component re-mount on project deletion
  const [resetKey, setResetKey] = useState(0);
  
  // View mode state (Preview vs Code)
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');
  
  // Hard refresh state for fixing white screen of death
  const [refreshKey, setRefreshKey] = useState(0);
  
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
  
  // Live steps state for real-time transparency
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
    },
    onComplete: async (finalCode) => {
      // Clear live steps and save to project_files on completion
      setLiveSteps([]);
      await saveVibecoderCode(finalCode);
      
      // Add assistant message with code snapshot
      await addMessage('assistant', 'Generated your storefront design.', finalCode);
    },
    onChatResponse: async (text) => {
      // AI responded with a chat message instead of code
      setLiveSteps([]);
      setChatResponse(text);
      await addMessage('assistant', text);
    },
    onError: (err) => {
      setLiveSteps([]);
      toast.error(err.message);
    }
  });

  // Show onboarding on first visit
  useEffect(() => {
    if (!loading && needsOnboarding) {
      setShowOnboarding(true);
    }
  }, [loading, needsOnboarding]);

  // Load existing vibecoder code
  useEffect(() => {
    const loadData = async () => {
      const [layoutResp, filesResp, profileResp] = await Promise.all([
        supabase
          .from('ai_storefront_layouts')
          .select('*')
          .eq('profile_id', profileId)
          .maybeSingle(),
        supabase
          .from('project_files')
          .select('content')
          .eq('profile_id', profileId)
          .eq('file_path', '/App.tsx')
          .maybeSingle(),
        supabase
          .from('profiles')
          .select('username')
          .eq('id', profileId)
          .maybeSingle(),
      ]);

      if (layoutResp.data) {
        setIsPublished(layoutResp.data.is_published);
      }

      // Load saved vibecoder code if exists
      if (filesResp.data?.content) {
        setCode(filesResp.data.content);
      }

      // Set username for View Live link
      if (profileResp.data?.username) {
        setUsername(profileResp.data.username);
      }

      setLoading(false);
    };

    loadData();
  }, [profileId, setCode]);

  // Load code from last message when switching projects
  useEffect(() => {
    if (messages.length > 0) {
      const lastSnapshot = getLastCodeSnapshot();
      if (lastSnapshot) {
        setCode(lastSnapshot);
      }
    }
  }, [activeProjectId, messages, getLastCodeSnapshot, setCode]);

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

  // Send message handler (with auto-create)
  const handleSendMessage = async (prompt: string) => {
    // Auto-create project if we don't have one yet
    const projectId = await ensureProject();
    if (!projectId) {
      toast.error('Failed to start project');
      return;
    }

    // Add user message to history
    await addMessage('user', prompt);
    
    // Stream the code generation
    streamCode(prompt, code !== DEFAULT_CODE ? code : undefined);
  };

  // Handle new project creation
  const handleCreateProject = async () => {
    const project = await createProject('New Storefront');
    if (project) {
      resetCode();
      toast.success('New project created');
    }
  };

  // Handle project deletion (uses the "Total Deletion" RPC)
  const handleDeleteProject = async (projectId: string) => {
    const isActiveProject = activeProjectId === projectId;
    const success = await deleteProject(projectId);
    
    if (success) {
      // If we deleted the active project, force a complete reset
      if (isActiveProject) {
        resetCode();
        setChatResponse(null);
        // Increment resetKey to force React to destroy and re-mount components
        setResetKey(prev => prev + 1);
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
    // Send the error report to the AI for automatic repair
    handleSendMessage(errorMsg);
  }, []);

  if (loading || projectsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
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

  return (
    <div className="h-screen w-full bg-zinc-950 flex flex-col overflow-hidden">
      {/* Unified Header with Controls */}
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
      />

      {/* Main content - split view */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Project sidebar */}
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

        {/* Preview panel - PURE CANVAS (no toolbar) */}
        <div 
          className="flex-1 min-w-0 border-r border-zinc-800 bg-black overflow-hidden relative flex flex-col"
          style={{ isolation: 'isolate', contain: 'strict' }}
        >
          {/* Preview/Code Content - Full height now */}
          <div className={`flex-1 min-h-0 ${deviceMode === 'mobile' ? 'flex items-center justify-center bg-zinc-900' : ''}`}>
            <div 
              className={`h-full ${deviceMode === 'mobile' ? 'w-[375px] border-x border-zinc-700 shadow-2xl' : 'w-full'}`}
            >
              <PreviewErrorBoundary 
                onAutoFix={handleAutoFix} 
                onReset={resetCode}
              >
                <VibecoderPreview 
                  key={`preview-${activeProjectId}-${resetKey}-${refreshKey}`}
                  code={code} 
                  isStreaming={isStreaming}
                  viewMode={viewMode}
                  onError={(error) => {
                    console.warn('[VibecoderPreview] Sandpack error detected:', error);
                  }}
                />
              </PreviewErrorBoundary>
            </div>
          </div>
          
          {/* Overlay while dragging */}
          {isDragging && <div className="absolute inset-0 z-50 bg-transparent cursor-ew-resize" />}
        </div>

        {/* Chat panel */}
        <div 
          style={{ width: sidebarWidth }} 
          className="shrink-0 flex flex-col bg-background overflow-hidden relative"
        >
          {/* THE DRAG HANDLE */}
          <div
            onMouseDown={startResizing}
            className={`absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize z-50 transition-colors ${
              isDragging ? 'bg-violet-500' : 'bg-transparent hover:bg-violet-500/50'
            }`}
          />
          
          <VibecoderChat
            key={`chat-${activeProjectId}-${resetKey}`}
            onSendMessage={handleSendMessage}
            isStreaming={isStreaming}
            onCancel={cancelStream}
            onReset={resetCode}
            onUndo={handleUndo}
            hasCode={code !== DEFAULT_CODE}
            canUndo={canUndo}
            messages={messages}
            onRateMessage={rateMessage}
            onRestoreToVersion={handleRestoreCode}
            projectName={activeProject?.name}
            liveSteps={liveSteps}
          />
        </div>
      </div>
    </div>
  );
}
