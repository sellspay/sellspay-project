import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { SimpleSidebar } from './SimpleSidebar';
import { SimplePreview } from './SimplePreview';
import { SimpleChat, type ChatMessage } from './SimpleChat';
import { ChatInputBar, AI_MODELS, type AIModel } from './ChatInputBar';
import { ProfileMenu } from './ProfileMenu';
import { CanvasToolbar, type ViewMode, type DeviceMode } from './CanvasToolbar';
import { InsufficientCreditsCard, isCreditsError, parseCreditsError } from './InsufficientCreditsCard';
import { LovableHero } from './LovableHero';
import { testCodeInShadow, silentHeal } from './ShadowTester';
import { PanelRightClose, PanelRightOpen } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import sellspayLogo from '@/assets/sellspay-s-logo-new.png';

// Default starter code for new projects
const DEFAULT_CODE = `function App() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
          Welcome to Vibecoder
        </h1>
        <p className="text-zinc-400 text-lg mb-8">
          Describe your storefront vision in the chat and I'll generate the code for you.
        </p>
        <div className="flex gap-4 justify-center">
          <div className="px-4 py-2 bg-zinc-800 rounded-lg border border-zinc-700">
            <span className="text-sm text-zinc-300">✨ AI-Powered</span>
          </div>
          <div className="px-4 py-2 bg-zinc-800 rounded-lg border border-zinc-700">
            <span className="text-sm text-zinc-300">🚀 Real-time Preview</span>
          </div>
        </div>
      </div>
    </div>
  );
}`;

interface SimpleVibecoderPageProps {
  profileId: string;
}

/**
 * SimpleVibecoderPage - The main Vibecoder interface
 * 
 * Features the "Magical Doorway" onboarding experience:
 * - Shows LovableHero with aurora background when no project exists
 * - After first prompt, transitions to the canvas workspace
 * - Stable iframe-based preview (no Sandpack)
 */
export function SimpleVibecoderPage({ profileId }: SimpleVibecoderPageProps) {
  const { user, isAdmin, isOwner } = useAuth();
  const navigate = useNavigate();
  
  // Core state
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [code, setCode] = useState(DEFAULT_CODE);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [creditsError, setCreditsError] = useState<{ needed: number; available: number } | null>(null);
  const [streamingLogs, setStreamingLogs] = useState<string[]>([]);
  const [isAutoFixing, setIsAutoFixing] = useState(false); // Track auto-fix mode to suppress errors
  
  // "Magical Doorway" state - shows fullscreen prompt experience ONLY when starting a new project
  const [showDoorway, setShowDoorway] = useState(false);

  // UI state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [chatCollapsed, setChatCollapsed] = useState(false);
  const [userCredits, setUserCredits] = useState(0);
  const [activeModel, setActiveModel] = useState<AIModel>(AI_MODELS.code[0]);
  
  // Owner and admin bypass all credit checks
  const isPrivileged = isOwner || isAdmin;
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
  const [refreshKey, setRefreshKey] = useState(0);
  const [profile, setProfile] = useState<{
    avatar_url?: string | null;
    username?: string | null;
    subscription_tier?: string | null;
  } | null>(null);
  
  // Fetch user profile and credits
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('profiles')
        .select('avatar_url, username, subscription_tier')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (data) {
        setProfile(data);
      }
    };
    
    fetchProfile();
    // Note: user_credits table doesn't exist, so we skip credits fetch
    // In real implementation, this would need to be added
  }, [user]);
  
  // Restore last selected project on entry (skip doorway if projects exist)
  useEffect(() => {
    const restoreLastProject = async () => {
      if (!user) return;

      const storageKey = `vibecoder:lastProjectId:${user.id}`;
      const lastProjectId = localStorage.getItem(storageKey);

      // Prefer last selected project if it still exists
      if (lastProjectId) {
        const { data: exists } = await supabase
          .from('vibecoder_projects')
          .select('id')
          .eq('id', lastProjectId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (exists?.id) {
          setActiveProjectId(exists.id);
          setShowDoorway(false);
          return;
        }
      }

      // Otherwise load most recently updated project, if any
      const { data: latest } = await supabase
        .from('vibecoder_projects')
        .select('id')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latest?.id) {
        setActiveProjectId(latest.id);
        setShowDoorway(false);
      } else {
        // No projects yet → show doorway
        setActiveProjectId(null);
        setShowDoorway(true);
      }
    };

    restoreLastProject();
  }, [user]);

  useEffect(() => {
    const loadProject = async () => {
      if (!activeProjectId) {
        setCode(DEFAULT_CODE);
        setMessages([]);
        return;
      }
      
      // Load latest code from project_files
      const { data: fileData } = await supabase
        .from('project_files')
        .select('content')
        .eq('profile_id', profileId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (fileData?.content) {
        setCode(fileData.content);
      } else {
        setCode(DEFAULT_CODE);
      }
      
      // Load messages
      const { data: msgData } = await supabase
        .from('vibecoder_messages')
        .select('id, role, content, created_at')
        .eq('project_id', activeProjectId)
        .order('created_at', { ascending: true });
      
      if (msgData) {
        setMessages(msgData.map(m => ({
          id: m.id,
          role: m.role as 'user' | 'assistant',
          content: m.content,
          timestamp: m.created_at,
        })));
      } else {
        setMessages([]);
      }
    };
    
    loadProject();
  }, [activeProjectId, profileId]);
  
  // Start a new project flow (show doorway). Actual project is created on first prompt.
  const handleCreateProject = async () => {
    setActiveProjectId(null);
    setCode(DEFAULT_CODE);
    setMessages([]);
    setError(null);
    setCreditsError(null);
    setStreamingLogs([]);
    setShowDoorway(true);
    toast.success('Start a new project');
  };
  
  // Delete project
  const handleDeleteProject = async (projectId: string) => {
    const { error } = await supabase
      .from('vibecoder_projects')
      .delete()
      .eq('id', projectId);
    
    if (error) {
      toast.error('Failed to delete project');
      return;
    }
    
    if (activeProjectId === projectId) {
      setActiveProjectId(null);
    }
    
    toast.success('Project deleted');
  };
  
  // Handle sending a message - accepts optional prompt override for doorway flow
  const handleSendMessage = useCallback(async (options: {
    isPlanMode: boolean;
    model: AIModel;
    attachments: File[];
    styleProfile?: string;
    promptOverride?: string; // For doorway → build transition
  }) => {
    const prompt = options.promptOverride || inputValue;
    if (!prompt.trim() || isStreaming || !user) return;
    
    // Create project if none exists
    let projectId = activeProjectId;
    if (!projectId) {
      const { data, error } = await supabase
        .from('vibecoder_projects')
        .insert({
          user_id: user.id,
          name: `Storefront ${new Date().toLocaleDateString()}`,
        })
        .select('id')
        .single();
      
      if (error) {
        toast.error('Failed to create project');
        return;
      }
      
      projectId = data.id;
      setActiveProjectId(projectId);
    }
    
    // Only add user message if not coming from doorway (which already adds it)
    if (!options.promptOverride) {
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: prompt,
      };
      setMessages(prev => [...prev, userMessage]);
    }
    
    setInputValue('');
    setIsStreaming(true);
    setError(null);
    setCreditsError(null);
    setStreamingLogs([]); // Reset logs
    
    try {
      // Save user message to database
      await supabase.from('vibecoder_messages').insert({
        project_id: projectId,
        role: 'user',
        content: prompt,
      });
      
      // Call the orchestrator
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }
      
      const response = await fetch(`${supabaseUrl}/functions/v1/vibecoder-orchestrator`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          prompt: prompt,
          currentCode: code,
          styleProfile: options.styleProfile,
          userId: profileId, // Pass profileId - orchestrator maps to auth user
          projectId,
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }
      
      if (!response.body) {
        throw new Error('No response stream');
      }
      
      // Process SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let generatedCode = '';
      let summary = '';
      const collectedLogs: string[] = [];

      while (true) {
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
            const event = JSON.parse(jsonStr);

            const pushLog = (msg: string) => {
              collectedLogs.push(msg);
              setStreamingLogs(prev => [...prev, msg]);
            };

            // Handle different event types
            if (event.type === 'status') {
              const statusMsg = event.data?.message || `Step: ${event.step}`;
              pushLog(statusMsg);
            } else if (event.type === 'log') {
              const logMsg = typeof event.data === 'string' ? event.data : JSON.stringify(event.data);
              pushLog(logMsg);
            } else if (event.type === 'plan') {
              pushLog('Plan created');
            } else if (event.type === 'code') {
              generatedCode = event.data?.code || '';
              summary = event.data?.summary || 'Storefront updated.';
              pushLog('Code generated');
            } else if (event.type === 'error') {
              const errorMsg = event.data?.message || 'Generation failed';

              if (isCreditsError(errorMsg)) {
                const parsed = parseCreditsError(errorMsg);
                setCreditsError({
                  needed: parsed.creditsNeeded || 3,
                  available: parsed.creditsAvailable || 0,
                });
              } else {
                throw new Error(errorMsg);
              }
            }
          } catch (parseErr) {
            // If JSON was cut mid-chunk, put it back
            if (parseErr instanceof SyntaxError) {
              buffer = `data: ${jsonStr}\n` + buffer;
              break;
            }
            throw parseErr;
          }
        }
      }

      // ═══════════════════════════════════════════════════════════════
      // PHASE 3: SHADOW MOUNT + SILENT RETRY LOOP
      // ═══════════════════════════════════════════════════════════════
      // Test code in hidden iframe BEFORE showing to user. If it fails,
      // silently heal and retry up to 2 times. User only sees final result.
      if (generatedCode) {
        let codeToDeliver = generatedCode;
        let shadowPassed = false;
        const maxSilentRetries = 2;
        
        for (let retry = 0; retry <= maxSilentRetries; retry++) {
          collectedLogs.push(retry > 0 ? `Silent retry ${retry}...` : 'Shadow testing...');
          setStreamingLogs([...collectedLogs]);
          
          // Run shadow test
          const shadowResult = await testCodeInShadow(codeToDeliver);
          
          if (shadowResult.success) {
            collectedLogs.push('✓ Shadow test passed');
            setStreamingLogs([...collectedLogs]);
            shadowPassed = true;
            break;
          }
          
          // Shadow test failed
          console.log(`[Vibecoder] Shadow test failed (attempt ${retry + 1}):`, shadowResult.error);
          collectedLogs.push(`⚠️ Shadow error: ${shadowResult.error?.substring(0, 60)}...`);
          setStreamingLogs([...collectedLogs]);
          
          // If we have retries left, try silent heal
          if (retry < maxSilentRetries) {
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const { data: { session } } = await supabase.auth.getSession();
            
            if (session?.access_token) {
              const healedCode = await silentHeal(
                supabaseUrl,
                session.access_token,
                codeToDeliver,
                shadowResult.error || 'Unknown runtime error',
                profileId
              );
              
              if (healedCode && healedCode.length > 50) {
                codeToDeliver = healedCode;
                collectedLogs.push('🔧 Silent heal applied');
                setStreamingLogs([...collectedLogs]);
              } else {
                collectedLogs.push('⚠️ Silent heal returned empty');
                setStreamingLogs([...collectedLogs]);
                break; // Can't heal, stop retrying
              }
            }
          }
        }
        
        // Deliver whatever we have (either passed or best effort after retries)
        setCode(codeToDeliver);
        setRefreshKey(k => k + 1); // Force preview refresh

        // Save to database
        await supabase.from('project_files').upsert({
          profile_id: profileId,
          file_path: '/App.tsx',
          content: codeToDeliver,
          version: 1,
        });

        // Persist build logs inside the assistant message so they remain in chat history
        const logBlock = collectedLogs.length
          ? `\n\nBuild log:\n${collectedLogs.map(l => `- ${l}`).join('\n')}`
          : '';

        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `${summary}${logBlock}`,
        };

        setMessages(prev => [...prev, assistantMessage]);

        // Save assistant message (including logs) so refresh/project switch keeps it
        await supabase.from('vibecoder_messages').insert({
          project_id: projectId,
          role: 'assistant',
          content: assistantMessage.content,
        });

        toast.success(shadowPassed ? 'Changes applied!' : 'Applied with warnings');
      }

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Generation failed';
      setError(message);
      toast.error(message);
    } finally {
      setIsStreaming(false);
    }
  }, [inputValue, isStreaming, activeProjectId, code, profileId, user]);
  
  // Handle preview errors - only show in error state if NOT auto-fixing
  const handlePreviewError = (errorMsg: string) => {
    // During auto-fix mode, suppress error display to avoid UI spam
    if (isAutoFixing || isStreaming) {
      console.log('[Preview] Suppressing error during fix/streaming mode');
      return;
    }
    console.warn('[Preview Error]', errorMsg);
    setError(errorMsg);
  };
  
  // Handle auto-fix - AI analyzes and fixes the error with CODE INTEGRITY PROTOCOL
  const handleFixError = useCallback(async (errorMsg: string) => {
    if (!user || isStreaming) return;
    
    // Enter auto-fix mode - this suppresses error displays
    setIsAutoFixing(true);
    setError(null); // Clear the current error immediately
    
    // Build a comprehensive fix prompt with CODE INTEGRITY PROTOCOL
    const fixPrompt = `## CODE INTEGRITY PROTOCOL - FIX REQUIRED

### Error Details:
\`\`\`
${errorMsg}
\`\`\`

### Current Code (BROKEN):
\`\`\`tsx
${code}
\`\`\`

### STRICT REQUIREMENTS:
1. Return a COMPLETE, standalone App.tsx file. NO FRAGMENTS.
2. Every { must have a matching }
3. Every [ must have a matching ]
4. Every ( must have a matching )
5. All data arrays (PRODUCTS, ITEMS, etc.) MUST close with ]; BEFORE the App function
6. All hooks (useState, useEffect, useSellsPayCheckout) MUST be INSIDE the App function
7. Code MUST end with the closing brace of the App function
8. NO "/// END_CODE ///" or debug markers

Analyze the error, identify the root cause in the code above, and regenerate the COMPLETE fixed code. Keep all existing functionality intact.`;
    
    // Add a concise status line to chat (not the full error)
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: `🔧 Fixing detected error...`,
    };
    setMessages(prev => [...prev, userMessage]);
    
    // Trigger build with fix prompt
    handleSendMessage({
      isPlanMode: false,
      model: activeModel,
      attachments: [],
      promptOverride: fixPrompt,
    }).finally(() => {
      // Exit auto-fix mode when done
      setIsAutoFixing(false);
    });
  }, [user, isStreaming, activeModel, handleSendMessage, code]);
  
  // Handle sign out
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };
  
  if (!user) return null;
  
  // Handle prompt from the magical doorway - passes prompt directly to avoid state race
  const handleDoorwayStart = (prompt: string, isPlanMode?: boolean) => {
    // Exit doorway and enter workspace
    setShowDoorway(false);
    setInputValue(prompt); // Show in input for visual feedback
    
    // Add user message to chat immediately (optimistic)
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: prompt,
    };
    setMessages([userMessage]);
    
    // Trigger the build with prompt passed directly (no state dependency)
    handleSendMessage({
      isPlanMode: isPlanMode || false,
      model: activeModel,
      attachments: [],
      promptOverride: prompt, // Pass directly to avoid stale state
    });
  };
  
  // Show magical doorway only when explicitly starting a new project
  if (showDoorway && !activeProjectId) {
    return (
      <LovableHero
        userName={profile?.username || 'Creator'}
        variant="fullscreen"
        onStart={handleDoorwayStart}
      />
    );
  }
  
  // Get device mode dimensions
  const getDeviceDimensions = () => {
    switch (deviceMode) {
      case 'mobile': return 'max-w-[375px]';
      case 'tablet': return 'max-w-[768px]';
      default: return 'w-full';
    }
  };
  
  return (
    <div className="h-screen w-screen flex bg-background overflow-hidden">
      {/* Always-available chat toggle (in case the panel is off-screen) */}
      {chatCollapsed && (
        <button
          onClick={() => setChatCollapsed(false)}
          className="fixed right-3 top-1/2 -translate-y-1/2 z-50 rounded-full border border-border/60 bg-background/90 backdrop-blur px-3 py-2 text-xs font-medium text-foreground shadow-lg hover:bg-muted transition-colors"
          title="Open chat"
        >
          Open chat
        </button>
      )}

      {/* Sidebar */}
      <SimpleSidebar
        userId={user.id}
        activeProjectId={activeProjectId}
        onSelectProject={(projectId) => {
          setActiveProjectId(projectId);
          setShowDoorway(false);
          if (user) {
            localStorage.setItem(`vibecoder:lastProjectId:${user.id}`, projectId);
          }
        }}
        onCreateProject={handleCreateProject}
        onDeleteProject={handleDeleteProject}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Canvas Toolbar with tabs */}
        <CanvasToolbar
          viewMode={viewMode}
          setViewMode={setViewMode}
          deviceMode={deviceMode}
          setDeviceMode={setDeviceMode}
          onRefresh={() => setRefreshKey(k => k + 1)}
          onExit={() => navigate('/')}
          onTweak={() => toast.info('Tweak modal coming soon!')}
          onPublish={() => toast.info('Publish flow coming soon!')}
        />
        
        {/* Main workspace */}
        <div className="flex-1 flex min-h-0">
          {/* Preview/Code/Studio pane */}
          <div className="flex-1 min-w-0 p-4 bg-muted/20">
            <div className={cn(
              "h-full mx-auto rounded-2xl overflow-hidden border border-border/50 bg-background shadow-2xl transition-all duration-300",
              getDeviceDimensions()
            )}>
              {viewMode === 'preview' && (
                <SimplePreview
                  key={refreshKey}
                  code={code}
                  isLoading={isStreaming}
                  onError={handlePreviewError}
                  onFixError={handleFixError}
                />
              )}
              {viewMode === 'code' && (
                <div className="h-full overflow-auto p-4 bg-zinc-950">
                  <pre className="text-xs text-zinc-300 font-mono whitespace-pre-wrap">
                    {code}
                  </pre>
                </div>
              )}
              {viewMode === 'image' && (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="w-20 h-20 mb-6 rounded-2xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center border border-pink-500/30">
                    <span className="text-4xl">🎨</span>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Image Studio</h3>
                  <p className="text-muted-foreground text-sm max-w-xs">
                    Generate custom images for your storefront using AI models like DALL·E and Midjourney.
                  </p>
                  <span className="mt-4 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    Coming Soon
                  </span>
                </div>
              )}
              {viewMode === 'video' && (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="w-20 h-20 mb-6 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center border border-blue-500/30">
                    <span className="text-4xl">🎬</span>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Video Studio</h3>
                  <p className="text-muted-foreground text-sm max-w-xs">
                    Create AI-generated video content for product showcases and promotional materials.
                  </p>
                  <span className="mt-4 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    Coming Soon
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Chat pane - collapsible - HIGHEST Z-INDEX to prevent overlay collision */}
          {chatCollapsed ? (
            <div className="w-14 border-l border-border/50 flex flex-col items-center justify-between py-4 bg-background relative z-50">
              <button
                onClick={() => setChatCollapsed(false)}
                className="p-2.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title="Open chat"
              >
                <PanelRightOpen size={18} />
              </button>
              <div className="text-[11px] tracking-wide text-muted-foreground/70 rotate-90 whitespace-nowrap select-none">
                Chat
              </div>
              <div className="h-8" />
            </div>
          ) : (
            <div className="w-[400px] border-l border-border/50 flex flex-col min-h-0 bg-background relative z-50">
              {/* Project header in chat */}
              <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src={sellspayLogo} alt="" className="w-6 h-6" />
                  <span className="font-medium text-foreground text-sm truncate max-w-[200px]">
                    {activeProjectId ? 'Your Storefront' : 'New Project'}
                  </span>
                  <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded">
                    BETA
                  </span>
                </div>
                <button
                  onClick={() => setChatCollapsed(true)}
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  title="Collapse chat"
                >
                  <PanelRightClose size={16} />
                </button>
              </div>
              
              {/* Error display REMOVED - all errors are centralized in SimplePreview only */}
              
              {/* Credits error */}
              {creditsError && (
                <div className="p-4 border-b border-border">
                  <InsufficientCreditsCard
                    creditsNeeded={creditsError.needed}
                    creditsAvailable={creditsError.available}
                    onUpgrade={() => navigate('/pricing')}
                  />
                </div>
              )}
              
              {/* Chat */}
              <SimpleChat messages={messages} isStreaming={isStreaming} streamingLogs={streamingLogs}>
                <ChatInputBar
                  value={inputValue}
                  onChange={setInputValue}
                  onSubmit={handleSendMessage}
                  isGenerating={isStreaming}
                  onCancel={() => setIsStreaming(false)}
                  userCredits={userCredits}
                  isPrivileged={isPrivileged}
                  activeModel={activeModel}
                  onModelChange={setActiveModel}
                  onOpenBilling={() => navigate('/pricing')}
                />
              </SimpleChat>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
