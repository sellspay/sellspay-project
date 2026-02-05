import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Eye, Undo2, Loader2, Code2, Blocks, Sparkles, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AIBuilderChat } from './AIBuilderChat';
import { AIBuilderPreview } from './AIBuilderPreview';
import { AIBuilderOnboarding, useAIBuilderOnboarding } from './AIBuilderOnboarding';
import { VibecoderPreview } from './VibecoderPreview';
import { VibecoderChat } from './VibecoderChat';
import { useStreamingCode } from './useStreamingCode';
import { toast } from 'sonner';
import sellspayLogo from '@/assets/sellspay-s-logo-new.png';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface AIBuilderCanvasProps {
  profileId: string;
}

interface AILayout {
  sections: any[];
  theme: Record<string, any>;
  header: Record<string, any>;
}

type BuilderMode = 'blocks' | 'vibecoder';

export function AIBuilderCanvas({ profileId }: AIBuilderCanvasProps) {
  const navigate = useNavigate();
  const [layout, setLayout] = useState<AILayout>({ sections: [], theme: {}, header: {} });
  const [isPublished, setIsPublished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [history, setHistory] = useState<AILayout[]>([]);
  const [isBuilding, setIsBuilding] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const { needsOnboarding, completeOnboarding } = useAIBuilderOnboarding(profileId);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // Mode toggle: blocks (existing) or vibecoder (new generative)
  const [mode, setMode] = useState<BuilderMode>('blocks');
  
  // Streaming code state for Vibecoder mode
  const { 
    code, 
    isStreaming, 
    streamCode, 
    cancelStream, 
    resetCode,
    DEFAULT_CODE 
  } = useStreamingCode({
    onComplete: async (finalCode) => {
      // Save to project_files on completion
      await saveVibecoderCode(finalCode);
    },
    onError: (err) => {
      toast.error(err.message);
    }
  });

  // Show onboarding on first visit
  useEffect(() => {
    if (!loading && needsOnboarding) {
      setShowOnboarding(true);
    }
  }, [loading, needsOnboarding]);

  // Load existing AI layout and vibecoder code
  useEffect(() => {
    const loadLayout = async () => {
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
        const parsed = layoutResp.data.layout_json as unknown as AILayout;
        setLayout(parsed);
        setIsPublished(layoutResp.data.is_published);
        
        // Check if vibecoder mode was active
        if (layoutResp.data.vibecoder_mode) {
          setMode('vibecoder');
        }
      }

      // Load saved vibecoder code if exists
      if (filesResp.data?.content) {
        // Set the saved code via streaming hook
        // Note: The hook starts with DEFAULT_CODE, so we need to update it
      }

      // Set username for View Live link
      if (profileResp.data?.username) {
        setUsername(profileResp.data.username);
      }

      setLoading(false);
    };

    loadLayout();
  }, [profileId]);

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

  // Save layout changes (for blocks mode)
  const saveLayout = useCallback(async (newLayout: AILayout) => {
    setLayout(newLayout);
    
    await supabase
      .from('ai_storefront_layouts')
      .upsert({
        profile_id: profileId,
        layout_json: newLayout as any,
        vibecoder_mode: mode === 'vibecoder',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'profile_id' });
  }, [profileId, mode]);

  // Push to history for undo
  const pushHistory = useCallback((state: AILayout) => {
    setHistory(prev => [...prev.slice(-19), state]);
  }, []);

  // Undo last change
  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    saveLayout(previous);
    toast.success('Reverted changes');
  }, [history, saveLayout]);

  // Publish the AI layout
  const handlePublish = async () => {
    setPublishing(true);
    try {
      // Update layout to published
      await supabase
        .from('ai_storefront_layouts')
        .update({ 
          is_published: true,
          vibecoder_mode: mode === 'vibecoder',
        })
        .eq('profile_id', profileId);

      // Set profile to use AI mode
      await supabase
        .from('profiles')
        .update({ active_storefront_mode: 'ai' })
        .eq('id', profileId);

      setIsPublished(true);
      toast.success('Store published! Your AI layout is now live.');
    } catch (error) {
      toast.error('Failed to publish');
    } finally {
      setPublishing(false);
    }
  };

  // Toggle mode handler
  const handleModeChange = async (newMode: BuilderMode) => {
    setMode(newMode);
    
    // Update database with mode preference
    await supabase
      .from('ai_storefront_layouts')
      .upsert({
        profile_id: profileId,
        vibecoder_mode: newMode === 'vibecoder',
        layout_json: layout as any,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'profile_id' });
  };

  // Vibecoder send message handler
  const handleVibecoderMessage = (prompt: string) => {
    streamCode(prompt, code !== DEFAULT_CODE ? code : undefined);
  };

  if (loading) {
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

  const isEmpty = mode === 'blocks' 
    ? layout.sections.length === 0 
    : code === DEFAULT_CODE;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-border/30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/profile')}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Exit
          </Button>
          <div className="flex items-center gap-2">
            <img src={sellspayLogo} alt="SellsPay" className="w-6 h-6 object-contain" />
            <span className="font-semibold">AI Builder</span>
            {isPublished && (
              <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded-full border border-primary/30">
                Live
              </span>
            )}
          </div>
        </div>

        {/* Mode Toggle */}
        <TooltipProvider>
          <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg border border-border/30">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={mode === 'blocks' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => handleModeChange('blocks')}
                  className="gap-1.5 h-8"
                >
                  <Blocks className="w-4 h-4" />
                  Blocks
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Structured block builder (fast, reliable)</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={mode === 'vibecoder' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => handleModeChange('vibecoder')}
                  className="gap-1.5 h-8"
                >
                  <Code2 className="w-4 h-4" />
                  Vibecoder
                  <Sparkles className="w-3 h-3 text-violet-400" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Generative code (unlimited creativity)</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>

        <div className="flex items-center gap-2">
          {mode === 'blocks' && history.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleUndo}
              className="gap-1.5 text-muted-foreground"
            >
              <Undo2 className="w-4 h-4" />
              Undo
            </Button>
          )}
          {isPublished && username && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`/@${username}`, '_blank')}
              className="gap-1.5"
            >
              <ExternalLink className="w-4 h-4" />
              View Live
            </Button>
          )}
          <Button
            size="sm"
            onClick={handlePublish}
            disabled={isEmpty || publishing}
            className="gap-2"
          >
            {publishing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
            {isPublished ? 'Update' : 'Publish'}
          </Button>
        </div>
      </header>

      {/* Main content - split view */}
      <div className="flex-1 flex min-h-0">
        {/* Preview panel */}
        <div 
          className="flex-1 border-r border-border/30 bg-muted/20 overflow-hidden relative"
          style={{ isolation: 'isolate', contain: 'strict' }}
        >
          {mode === 'blocks' ? (
            <AIBuilderPreview layout={layout} isEmpty={isEmpty} isBuilding={isBuilding} />
          ) : (
            <VibecoderPreview code={code} isStreaming={isStreaming} />
          )}
        </div>

        {/* Chat panel */}
        <div className="w-[480px] shrink-0 flex flex-col bg-background overflow-hidden">
          {mode === 'blocks' ? (
            <AIBuilderChat
              profileId={profileId}
              layout={layout}
              onLayoutChange={(newLayout) => {
                pushHistory(layout);
                saveLayout(newLayout);
              }}
              onUndo={handleUndo}
              canUndo={history.length > 0}
              onBuildingChange={setIsBuilding}
            />
          ) : (
            <VibecoderChat
              onSendMessage={handleVibecoderMessage}
              isStreaming={isStreaming}
              onCancel={cancelStream}
              onReset={resetCode}
              hasCode={code !== DEFAULT_CODE}
            />
          )}
        </div>
      </div>
    </div>
  );
}
