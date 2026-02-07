import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useProjectScopedState } from '@/hooks/useProjectScopedState';
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
  const [streamingCode, setStreamingCode] = useState<string>(''); // Real-time code updates during generation
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
  const [chatWidth, setChatWidth] = useState(400); // Default width in px
  const [isResizing, setIsResizing] = useState(false);
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

  // ═══════════════════════════════════════════════════════════════════════════
  // PROJECT ISOLATION: Reset all transient state when switching projects
  // This prevents "ghost project" overlaps where error states bleed across tabs
  // ═══════════════════════════════════════════════════════════════════════════
  const resetProjectState = useCallback(() => {
    console.log('[SimpleVibecoderPage] Resetting project state for isolation');
    setCode(DEFAULT_CODE);
    setStreamingCode('');
    setMessages([]);
    setError(null);
    setCreditsError(null);
    setStreamingLogs([]);
    setIsAutoFixing(false);
    setIsStreaming(false);
    setRefreshKey(k => k + 1); // Force preview refresh
  }, []);

  // Hook for project-scoped state management
  const { purgeProject } = useProjectScopedState({
    projectId: activeProjectId,
    userId: user?.id || null,
    onProjectChange: resetProjectState,
  });
  
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
      
      // Load latest code from project_files SCOPED TO THIS PROJECT
      const { data: fileData } = await supabase
        .from('project_files')
        .select('content')
        .eq('project_id', activeProjectId)
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
  
  // Delete project - also purges all browser caches for that project
  const handleDeleteProject = async (projectId: string) => {
    const { error } = await supabase
      .from('vibecoder_projects')
      .delete()
      .eq('id', projectId);
    
    if (error) {
      toast.error('Failed to delete project');
      return;
    }
    
    // CRITICAL: Purge all browser caches for this project to prevent ghost data
    purgeProject(projectId);
    
    if (activeProjectId === projectId) {
      setActiveProjectId(null);
      resetProjectState();
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
    projectIdOverride?: string; // For doorway: avoid race with setActiveProjectId
  }) => {
    // Use promptOverride if provided, otherwise use inputValue
    const prompt = options.promptOverride || inputValue;
    if (!prompt.trim() || isStreaming || !user) {
      console.log('[handleSendMessage] Early return:', { prompt: prompt.trim(), isStreaming, user: !!user });
      return;
    }

    // Create project if none exists
    let projectId = options.projectIdOverride || activeProjectId;
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
    setStreamingCode(''); // Reset streaming code
    
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
            } else if (event.type === 'code_chunk') {
              // Real-time code streaming - update as chunks arrive
              const chunk = event.data?.chunk || '';
              generatedCode += chunk;
              setStreamingCode(generatedCode); // Update UI in real-time
            } else if (event.type === 'code') {
              // Final complete code
              generatedCode = event.data?.code || generatedCode;
              setStreamingCode(generatedCode);
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
      // PHASE 3: SHADOW MOUNT + SILENT RETRY LOOP (Zero-Guessing Architecture)
      // ═══════════════════════════════════════════════════════════════
      // Test code in hidden iframe BEFORE showing to user. If it fails,
      // silently heal and retry up to 3 times. User only sees final result.
      if (generatedCode) {
        let codeToDeliver = generatedCode;
        let shadowPassed = false;
        const maxSilentRetries = 3; // Increased from 2 for better recovery
        
        for (let retry = 0; retry <= maxSilentRetries; retry++) {
          const logMsg = retry === 0 
            ? 'Shadow testing...' 
            : `Auto-healing attempt ${retry}/${maxSilentRetries}...`;
          collectedLogs.push(logMsg);
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
          const errorPreview = shadowResult.error?.substring(0, 80) || 'Unknown error';
          console.log(`[Vibecoder] Shadow test failed (attempt ${retry + 1}):`, shadowResult.error);
          collectedLogs.push(`⚠️ ${errorPreview}...`);
          setStreamingLogs([...collectedLogs]);
          
          // If we have retries left, try silent heal
          if (retry < maxSilentRetries) {
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const { data: { session } } = await supabase.auth.getSession();
            
            if (session?.access_token) {
              // Build comprehensive error context for the heal agent
              const errorContext = `${shadowResult.error}${shadowResult.stack ? `\n\nStack: ${shadowResult.stack.substring(0, 500)}` : ''}`;
              
              collectedLogs.push('🔧 Applying surgical fix...');
              setStreamingLogs([...collectedLogs]);
              
              const healedCode = await silentHeal(
                supabaseUrl,
                session.access_token,
                codeToDeliver,
                errorContext,
                profileId
              );
              
              if (healedCode && healedCode.length > 100) {
                codeToDeliver = healedCode;
                collectedLogs.push('✓ Fix applied, re-testing...');
                setStreamingLogs([...collectedLogs]);
              } else {
                collectedLogs.push('⚠️ Heal returned insufficient code');
                setStreamingLogs([...collectedLogs]);
                // Don't break - try again, the AI might do better
              }
            } else {
              collectedLogs.push('⚠️ No auth session for healing');
              setStreamingLogs([...collectedLogs]);
              break;
            }
          }
        }
        
        // Apply code and save - even if shadow failed, we still save to history
        // but with a clear failure message
        if (shadowPassed) {
          // ═══════════════════════════════════════════════════════════════
          // ATOMIC STATUS SYNC: Update both DB and UI in one operation
          // This prevents "ghost fix button" from appearing after project switch
          // by ensuring the is_broken flag is set BEFORE the UI updates
          // ═══════════════════════════════════════════════════════════════
          await Promise.all([
            // Save code to project_files
            supabase.from('project_files').upsert(
              {
                project_id: projectId,
                profile_id: profileId,
                file_path: '/App.tsx',
                content: codeToDeliver,
                version: 1,
              },
              { onConflict: 'project_id,file_path' }
            ),
            // Mark project as NOT broken (success state)
            supabase.from('vibecoder_projects').update({
              is_broken: false,
              last_success_at: new Date().toISOString(),
            }).eq('id', projectId),
          ]);
          
          // NOW safe to update UI (after DB confirms)
          setCode(codeToDeliver);
          setError(null); // Clear any stale errors
          setRefreshKey(k => k + 1); // Force preview refresh
          
          collectedLogs.push('✓ Code saved successfully');
          setStreamingLogs([...collectedLogs]);
        } else {
          // Mark project as broken so Fix button persists across refreshes
          await supabase.from('vibecoder_projects').update({
            is_broken: true,
          }).eq('id', projectId);
          
          collectedLogs.push('✗ Max retries reached - code not applied');
          setStreamingLogs([...collectedLogs]);
        }

        // Persist build logs inside the assistant message so they remain in chat history
        const logBlock = collectedLogs.length
          ? `\n\n**Build log:**\n${collectedLogs.map(l => `- ${l}`).join('\n')}`
          : '';

        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: shadowPassed
            ? `${summary}${logBlock}`
            : `**Build failed** — The generated code had runtime errors that couldn't be auto-fixed. Try simplifying your request or being more specific about what you want.${logBlock}`,
        };

        setMessages(prev => [...prev, assistantMessage]);

        // Save assistant message (including logs) so refresh/project switch keeps it
        await supabase.from('vibecoder_messages').insert({
          project_id: projectId,
          role: 'assistant',
          content: assistantMessage.content,
        });

        if (shadowPassed) {
          toast.success('Changes applied!');
        } else {
          toast.error('Build failed — try a simpler request');
        }
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
  
  // Handle prompt from the magical doorway - bypasses useCallback closure issues
  const handleDoorwayStart = async (prompt: string, isPlanMode?: boolean) => {
    if (!user) return;

    try {
      // Create the project FIRST
      const { data, error } = await supabase
        .from('vibecoder_projects')
        .insert({
          user_id: user.id,
          name: `Storefront ${new Date().toLocaleDateString()}`,
        })
        .select('id')
        .single();

      if (error || !data?.id) {
        toast.error('Failed to create project');
        return;
      }

      const newProjectId = data.id;
      
      // Exit doorway FIRST so the canvas is visible
      setShowDoorway(false);
      setActiveProjectId(newProjectId);

      // Add user message to chat immediately (optimistic)
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: prompt,
      };
      setMessages([userMessage]);
      
      // Start streaming state
      setIsStreaming(true);
      setError(null);
      setCreditsError(null);
      setStreamingLogs([]);
      setStreamingCode('');

      // Save user message to database
      await supabase.from('vibecoder_messages').insert({
        project_id: newProjectId,
        role: 'user',
        content: prompt,
      });

      // Call the orchestrator DIRECTLY (bypass handleSendMessage to avoid closure issues)
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
          currentCode: DEFAULT_CODE,
          styleProfile: undefined,
          userId: profileId,
          projectId: newProjectId,
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }
      
      if (!response.body) {
        throw new Error('No response stream');
      }
      
      // Process SSE stream (same logic as handleSendMessage)
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

            if (event.type === 'status') {
              pushLog(event.data?.message || `Step: ${event.step}`);
            } else if (event.type === 'log') {
              pushLog(typeof event.data === 'string' ? event.data : JSON.stringify(event.data));
            } else if (event.type === 'plan') {
              pushLog('Plan created');
            } else if (event.type === 'code_chunk') {
              const chunk = event.data?.chunk || '';
              generatedCode += chunk;
              setStreamingCode(generatedCode);
            } else if (event.type === 'code') {
              generatedCode = event.data?.code || generatedCode;
              setStreamingCode(generatedCode);
              summary = event.data?.summary || 'Storefront updated.';
              pushLog('Code generated');
            } else if (event.type === 'error') {
              const errorMsg = event.data?.message || 'Generation failed';
              if (isCreditsError(errorMsg)) {
                const parsed = parseCreditsError(errorMsg);
                setCreditsError({ needed: parsed.creditsNeeded || 3, available: parsed.creditsAvailable || 0 });
              } else {
                throw new Error(errorMsg);
              }
            }
          } catch (parseErr) {
            if (parseErr instanceof SyntaxError) {
              buffer = `data: ${jsonStr}\n` + buffer;
              break;
            }
            throw parseErr;
          }
        }
      }

      // If we got code, use it
      if (generatedCode) {
        setCode(generatedCode);
        setStreamingCode('');

        // Save to database
        await Promise.all([
          supabase.from('project_files').upsert({
            project_id: newProjectId,
            profile_id: profileId,
            file_path: '/App.tsx',
            content: generatedCode,
            version: 1,
          }, { onConflict: 'project_id,file_path' }),
          supabase.from('vibecoder_messages').insert({
            project_id: newProjectId,
            role: 'assistant',
            content: summary,
            code_snapshot: generatedCode,
          }),
          supabase.from('vibecoder_projects').update({
            is_broken: false,
            last_success_at: new Date().toISOString(),
          }).eq('id', newProjectId),
        ]);

        // Add assistant message
        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: summary,
        };
        setMessages(prev => [...prev, assistantMessage]);
      }

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start project';
      setError(message);
      toast.error(message);
    } finally {
      setIsStreaming(false);
    }
  };
  
  // Show Magical Doorway when explicitly starting a new project
  // (single rendering path to avoid “prompt sent but build never starts” bugs)
  if (showDoorway) {
    return (
      <LovableHero
        userName={profile?.username || user?.email?.split('@')[0] || 'Creator'}
        variant="fullscreen"
        onStart={handleDoorwayStart}
        onBack={() => {
          // If user already has a project selected, just close the doorway.
          // Otherwise, go back home.
          if (activeProjectId) {
            setShowDoorway(false);
          } else {
            navigate('/');
          }
        }}
      />
    );
  }

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
          onResetState={async () => {
            // Manual state refresh - escape hatch for stuck UI
            if (activeProjectId) {
              toast.info('Refreshing project state...');
              purgeProject(activeProjectId);
              resetProjectState();
              
              // Refetch fresh code from database
              const { data } = await supabase
                .from('project_files')
                .select('content')
                .eq('project_id', activeProjectId)
                .eq('file_path', '/App.tsx')
                .maybeSingle();
              
              if (data?.content) {
                setCode(data.content);
              }
              
              setRefreshKey(k => k + 1);
              toast.success('Project state refreshed!');
            } else {
              toast.warning('No active project to refresh');
            }
          }}
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
                  projectId={activeProjectId}
                />
              )}
              {viewMode === 'code' && (
                <div className="h-full overflow-auto p-4 bg-zinc-950 relative">
                  {/* Show streaming code during generation, otherwise show final code */}
                  <pre className="text-xs text-zinc-300 font-mono whitespace-pre-wrap">
                    {isStreaming && streamingCode ? streamingCode : code}
                  </pre>
                  {/* Streaming indicator */}
                  {isStreaming && (
                    <div className="sticky bottom-0 left-0 right-0 py-2 px-3 bg-gradient-to-t from-zinc-950 via-zinc-950/95 to-transparent">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs text-green-400 font-mono">
                          {streamingCode.length > 0 
                            ? `Writing code... ${streamingCode.split('\n').length} lines`
                            : 'Generating...'}
                        </span>
                      </div>
                    </div>
                  )}
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
          
          {/* Chat pane - collapsible + RESIZABLE - HIGHEST Z-INDEX to prevent overlay collision */}
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
            <div 
              className="border-l border-border/50 flex flex-col min-h-0 bg-background relative z-50"
              style={{ width: chatWidth, minWidth: 360, maxWidth: '45vw' }}
            >
              {/* Resize handle - left edge */}
              <div
                className={cn(
                  "absolute left-0 top-0 bottom-0 w-1 cursor-col-resize z-50 transition-colors",
                  isResizing ? "bg-primary" : "bg-transparent hover:bg-primary/50"
                )}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setIsResizing(true);
                  const startX = e.clientX;
                  const startWidth = chatWidth;
                  
                  const handleMouseMove = (moveEvent: MouseEvent) => {
                    // Dragging left increases width (inverse of mouse movement)
                    const delta = startX - moveEvent.clientX;
                    const newWidth = Math.min(
                      Math.max(startWidth + delta, 360), // min 360px
                      window.innerWidth * 0.45 // max 45vw
                    );
                    setChatWidth(newWidth);
                  };
                  
                  const handleMouseUp = () => {
                    setIsResizing(false);
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                  };
                  
                  document.addEventListener('mousemove', handleMouseMove);
                  document.addEventListener('mouseup', handleMouseUp);
                }}
              />
              
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
