import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { SimpleSidebar } from './SimpleSidebar';
import { SimplePreview } from './SimplePreview';
import { SimpleChat, type ChatMessage } from './SimpleChat';
import { ChatInputBar, AI_MODELS, type AIModel } from './ChatInputBar';
import { ProfileMenu } from './ProfileMenu';
import { InsufficientCreditsCard, isCreditsError, parseCreditsError } from './InsufficientCreditsCard';
import { ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
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
 * Completely rebuilt with stability in mind:
 * - No Sandpack (uses iframe srcdoc instead)
 * - No complex state machines
 * - No scorched earth reset logic
 * - Simple, predictable data flow
 */
export function SimpleVibecoderPage({ profileId }: SimpleVibecoderPageProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Core state
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [code, setCode] = useState(DEFAULT_CODE);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [creditsError, setCreditsError] = useState<{ needed: number; available: number } | null>(null);
  
  // UI state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userCredits, setUserCredits] = useState(0);
  const [isPrivileged, setIsPrivileged] = useState(false);
  const [activeModel, setActiveModel] = useState<AIModel>(AI_MODELS.code[0]);
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
        // Check if privileged (admin/owner or premium tier)
        const isPremium = ['pro', 'enterprise', 'creator_pro', 'agency'].includes(data.subscription_tier || '');
        setIsPrivileged(isPremium);
      }
    };
    
    fetchProfile();
    // Note: user_credits table doesn't exist, so we skip credits fetch
    // In real implementation, this would need to be added
  }, [user]);
  
  // Load project data when active project changes
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
  
  // Create new project
  const handleCreateProject = async () => {
    if (!user) return;
    
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
    
    setActiveProjectId(data.id);
    toast.success('New project created');
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
  
  // Handle sending a message
  const handleSendMessage = useCallback(async (options: {
    isPlanMode: boolean;
    model: AIModel;
    attachments: File[];
    styleProfile?: string;
  }) => {
    if (!inputValue.trim() || isStreaming || !user) return;
    
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
    
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: inputValue,
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsStreaming(true);
    setError(null);
    setCreditsError(null);
    
    try {
      // Save user message to database
      await supabase.from('vibecoder_messages').insert({
        project_id: projectId,
        role: 'user',
        content: inputValue,
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
          prompt: inputValue,
          currentCode: code,
          styleProfile: options.styleProfile,
          userId: user.id,
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
            
            if (event.type === 'code') {
              generatedCode = event.data?.code || '';
              summary = event.data?.summary || 'Storefront updated.';
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
            buffer = `data: ${jsonStr}\n` + buffer;
            break;
          }
        }
      }
      
      // Apply the generated code
      if (generatedCode) {
        setCode(generatedCode);
        
        // Save to database
        await supabase.from('project_files').upsert({
          profile_id: profileId,
          file_path: '/App.tsx',
          content: generatedCode,
          version: 1,
        });
        
        // Add assistant message
        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: summary,
        };
        
        setMessages(prev => [...prev, assistantMessage]);
        
        // Save assistant message
        await supabase.from('vibecoder_messages').insert({
          project_id: projectId,
          role: 'assistant',
          content: summary,
        });
        
        toast.success('Changes applied!');
      }
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Generation failed';
      setError(message);
      toast.error(message);
    } finally {
      setIsStreaming(false);
    }
  }, [inputValue, isStreaming, activeProjectId, code, profileId, user]);
  
  // Handle preview errors
  const handlePreviewError = (errorMsg: string) => {
    console.warn('[Preview Error]', errorMsg);
    // Could trigger auto-heal here in the future
  };
  
  // Handle sign out
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };
  
  if (!user) return null;
  
  return (
    <div className="h-screen w-screen flex bg-zinc-950 overflow-hidden">
      {/* Sidebar */}
      <div className={cn(
        "transition-all duration-300 ease-in-out",
        sidebarCollapsed ? "w-0" : "w-64"
      )}>
        {!sidebarCollapsed && (
          <SimpleSidebar
            userId={user.id}
            activeProjectId={activeProjectId}
            onSelectProject={setActiveProjectId}
            onCreateProject={handleCreateProject}
            onDeleteProject={handleDeleteProject}
          />
        )}
      </div>
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 border-b border-zinc-800 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3">
            {/* Sidebar toggle */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
            >
              {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
            
            {/* Logo */}
            <div className="flex items-center gap-2">
              <img src={sellspayLogo} alt="Vibecoder" className="w-7 h-7" />
              <span className="font-semibold text-white">Vibecoder</span>
              <span className="px-1.5 py-0.5 bg-violet-500/20 text-violet-400 text-[10px] font-bold rounded">
                BETA
              </span>
            </div>
          </div>
          
          {/* Profile menu */}
          <ProfileMenu
            avatarUrl={profile?.avatar_url}
            username={profile?.username}
            userCredits={userCredits}
            subscriptionTier={profile?.subscription_tier}
            onSignOut={handleSignOut}
          />
        </header>
        
        {/* Main workspace */}
        <div className="flex-1 flex min-h-0">
          {/* Preview pane */}
          <div className="flex-1 min-w-0">
            <SimplePreview
              code={code}
              isLoading={isStreaming}
              onError={handlePreviewError}
            />
          </div>
          
          {/* Chat pane */}
          <div className="w-[400px] border-l border-zinc-800 flex flex-col min-h-0">
            {/* Error display */}
            {error && !creditsError && (
              <div className="p-3 bg-red-950/50 border-b border-red-900/50 flex items-start gap-2">
                <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}
            
            {/* Credits error */}
            {creditsError && (
              <div className="p-4 border-b border-zinc-800">
                <InsufficientCreditsCard
                  creditsNeeded={creditsError.needed}
                  creditsAvailable={creditsError.available}
                  onUpgrade={() => navigate('/pricing')}
                />
              </div>
            )}
            
            {/* Chat */}
            <SimpleChat messages={messages} isStreaming={isStreaming}>
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
        </div>
      </div>
    </div>
  );
}
