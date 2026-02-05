 import { useState, useRef, useEffect, useCallback } from 'react';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { ScrollArea } from '@/components/ui/scroll-area';
 import { Send, Loader2, Plus, Mic, Square, FileText, Wand2, Undo2 } from 'lucide-react';
 import { toast } from 'sonner';
 import { supabase } from '@/integrations/supabase/client';
 import sellspayLogo from '@/assets/sellspay-s-logo-new.png';
import { getPatternRegistrySummary } from './layoutPatterns';
import { getBlockRegistrySummary } from './blocks';
 
interface AIBuilderChatProps {
  profileId: string;
  layout: { sections: any[]; theme: Record<string, any>; header: Record<string, any> };
  onLayoutChange: (layout: { sections: any[]; theme: Record<string, any>; header: Record<string, any> }) => void;
  onUndo?: () => void;
  canUndo?: boolean;
  onBuildingChange?: (building: boolean) => void;
}
 
 interface ChatMessage {
   id: string;
   role: 'user' | 'assistant';
   content: string;
   timestamp: Date;
  stage?: 'planning' | 'applying' | 'rendering' | 'done';
 }
 
// Progress stages for the build process
type BuildStage = 'planning' | 'applying' | 'rendering' | 'done';

const STAGE_MESSAGES: Record<BuildStage, string> = {
  planning: 'Planning layout…',
  applying: 'Applying patch…',
  rendering: 'Rendering sections…',
  done: 'Done!',
};

// Rotating placeholder examples for the input
const PLACEHOLDER_EXAMPLES = [
  "A dark anime storefront for selling editing packs",
  "A premium SaaS-style site for my digital tools",
  "A clean creator store with bold visuals and strong CTAs",
  "A minimalist portfolio for my design work",
  "A high-energy gaming store with neon accents",
  "A professional coaching page with testimonials",
  "An elegant photography portfolio with gallery focus",
  "A bold hip-hop inspired store for beats and samples",
];

 const QUICK_ACTIONS = [
   { label: 'Premium', prompt: 'Make it look premium and luxurious with glassmorphism effects' },
   { label: 'Modern', prompt: 'Create a clean modern design with bold typography' },
   { label: 'Minimal', prompt: 'Design a minimal, elegant storefront with lots of whitespace' },
   { label: 'Bold', prompt: 'Make it bold and eye-catching with vibrant colors' },
 ];
 
export function AIBuilderChat({ profileId, layout, onLayoutChange, onUndo, canUndo, onBuildingChange }: AIBuilderChatProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [buildStage, setBuildStage] = useState<BuildStage | null>(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  // Load chat history from database
  useEffect(() => {
    const loadHistory = async () => {
      const { data } = await supabase
        .from('storefront_ai_conversations')
        .select('id, role, content, created_at')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: true });

      if (data && data.length > 0) {
        setMessages(data.map(msg => ({
          id: msg.id,
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          timestamp: new Date(msg.created_at),
        })));
      }
      setHistoryLoaded(true);
    };

    loadHistory();
  }, [profileId]);

  // Rotate placeholder examples
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex(prev => (prev + 1) % PLACEHOLDER_EXAMPLES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);
 
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    setIsLoading(true);
    onBuildingChange?.(true);
    setBuildStage('planning');

    // Add user message
    const userMessageId = crypto.randomUUID();
    const userMessage: ChatMessage = {
      id: userMessageId,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    // Persist user message to database
    await supabase.from('storefront_ai_conversations').insert({
      id: userMessageId,
      profile_id: profileId,
      role: 'user',
      content: text,
    });

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error('Not authenticated');

      // Fetch user's products and collections for AI context
      const [productsResp, collectionsResp] = await Promise.all([
        supabase
          .from('products')
          .select('id, name, price_cents, tags, status')
          .eq('creator_id', profileId)
          .eq('status', 'published')
          .limit(10),
        supabase
          .from('collections')
          .select('id, name')
          .eq('creator_id', profileId)
          .limit(5),
      ]);

      // Build context for AI - include products and collections
      const context = {
        sections: layout.sections,
        mode: 'ai_builder' as const,
        products: productsResp.data || [],
        collections: collectionsResp.data || [],
      };

      setBuildStage('applying');

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/storefront-vibecoder`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          message: text,
          context,
          profileId,
          userId: sessionData.session?.user?.id,
        }),
      });

      if (!resp.ok) {
        const payload = await resp.json().catch(() => ({}));
        throw new Error(payload?.error || 'AI request failed');
      }

      const result = await resp.json();

      setBuildStage('rendering');

      // Add assistant message
      const assistantMessageId = crypto.randomUUID();
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: result.message || 'Changes applied!',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Persist assistant message to database
      await supabase.from('storefront_ai_conversations').insert({
        id: assistantMessageId,
        profile_id: profileId,
        role: 'assistant',
        content: result.message || 'Changes applied!',
        operations: result.ops || null,
      });

      // Apply operations to layout
      if (result.ops && result.ops.length > 0) {
        const newLayout = applyOpsToLayout(layout, result.ops);
        onLayoutChange(newLayout);
        toast.success(`${result.ops.filter((o: any) => o.op === 'addSection').length} sections created!`);
      }

      setBuildStage('done');
      onBuildingChange?.(false);
      setTimeout(() => setBuildStage(null), 1500);

    } catch (err) {
      console.error('AI Builder error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
      toast.error(errorMessage);
      
      const errorChatMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `I encountered an error: ${errorMessage}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorChatMessage]);
      setBuildStage(null);
      onBuildingChange?.(false);
    } finally {
      setIsLoading(false);
    }
  }, [profileId, layout, onLayoutChange, isLoading, onBuildingChange]);
 
   const handleSubmit = (e: React.FormEvent) => {
     e.preventDefault();
     if (input.trim()) {
       sendMessage(input.trim());
       setInput('');
     }
   };
 
   const handleFreshBuild = () => {
     sendMessage(`Build me a complete, premium storefront from scratch. Create a full professional layout with:
 1. A striking hero headline section with dramatic typography
 2. An about me section with glassmorphism styling
 3. Social proof testimonials section
 4. A call-to-action section
 
 Make it look like a high-end luxury creator's store with dark theme and premium effects.`);
   };
 
   const isEmpty = messages.length === 0;
 
    return (
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header - fixed at top */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-border/30">
          <div className="flex items-center gap-2">
            <img src={sellspayLogo} alt="" className="w-6 h-6 object-contain" />
            <span className="font-medium">AI Assistant</span>
          </div>
          {canUndo && (
            <Button variant="ghost" size="sm" onClick={onUndo} className="gap-1.5 text-muted-foreground">
              <Undo2 className="w-4 h-4" />
              Undo
            </Button>
          )}
        </div>
  
        {/* Chat area - scrollable middle section */}
        <div className="flex-1 overflow-y-auto min-h-0 px-6 py-4" ref={scrollRef}>
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-8 py-12">
              {/* Logo */}
              <div className="relative">
                <div className="absolute inset-0 blur-3xl bg-primary/20 rounded-full scale-[2]" />
                <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-background via-muted/50 to-background border border-border/40 flex items-center justify-center shadow-xl">
                  <img src={sellspayLogo} alt="" className="w-12 h-12 object-contain" />
                </div>
              </div>
  
              <div className="space-y-3 max-w-sm">
                 <h3 className="text-xl font-semibold">What do you want to build?</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                   Describe your idea. The AI will design the entire storefront for you.
                </p>
              </div>
  
              {/* Build My Store CTA */}
              <Button
                onClick={handleFreshBuild}
                disabled={isLoading}
                className="gap-2 h-12 px-8 text-base font-medium shadow-lg shadow-primary/25"
                size="lg"
              >
                <Wand2 className="w-4 h-4" />
                Build My Store
              </Button>
  
              {/* Quick actions */}
              <div className="w-full pt-4">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 mb-3 font-medium">Quick Actions</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {QUICK_ACTIONS.map((action) => (
                    <Button
                      key={action.label}
                      variant="outline"
                      size="sm"
                      onClick={() => sendMessage(action.prompt)}
                      disabled={isLoading}
                      className="text-xs h-8 px-4 bg-muted/50 hover:bg-muted border-border/50"
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/60 text-foreground'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
               <div className="flex flex-col gap-2 p-4 bg-primary/5 rounded-xl border border-primary/10">
                 <div className="flex items-center gap-3 text-primary">
                   <Loader2 className="w-4 h-4 animate-spin" />
                   <span className="text-sm font-medium">
                     {buildStage ? STAGE_MESSAGES[buildStage] : 'Creating your vision...'}
                   </span>
                 </div>
                 {/* Progress dots */}
                 <div className="flex gap-1.5 ml-7">
                   {(['planning', 'applying', 'rendering'] as BuildStage[]).map((stage, i) => (
                     <div
                       key={stage}
                       className={`w-2 h-2 rounded-full transition-all ${
                         buildStage === stage
                           ? 'bg-primary scale-110'
                           : buildStage && ['planning', 'applying', 'rendering'].indexOf(buildStage) > i
                           ? 'bg-primary/60'
                           : 'bg-muted-foreground/20'
                       }`}
                     />
                   ))}
                 </div>
                </div>
              )}
            </div>
          )}
        </div>
  
        {/* Quick actions when chat has messages - fixed */}
        {!isEmpty && !isLoading && (
          <div className="flex-shrink-0 px-6 py-3 border-t border-border/20">
            <div className="flex flex-wrap gap-2">
              {QUICK_ACTIONS.map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  size="sm"
                  onClick={() => sendMessage(action.prompt)}
                  disabled={isLoading}
                  className="text-xs h-7 px-3 bg-muted/30"
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        )}
  
        {/* Input - fixed at bottom */}
        <form onSubmit={handleSubmit} className="flex-shrink-0 p-4 border-t border-border/30 bg-background">
          <div className="flex gap-2 items-center">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0 text-muted-foreground hover:text-foreground"
            >
              <Plus className="w-5 h-5" />
            </Button>
  
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
               placeholder={PLACEHOLDER_EXAMPLES[placeholderIndex]}
              disabled={isLoading}
               className="flex-1 h-10 bg-muted/30 border-border/40 transition-all"
            />
  
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => toast.info('Plan mode coming soon')}
              className="h-10 px-3 text-muted-foreground gap-1.5 shrink-0"
            >
              <FileText className="w-4 h-4" />
              <span className="text-xs">Plan</span>
            </Button>
  
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => toast.info('Voice input coming soon')}
              className="h-10 w-10 shrink-0 text-muted-foreground"
            >
              <Mic className="w-4 h-4" />
            </Button>
  
            <Button
              type="submit"
              disabled={!input.trim() || isLoading}
              size="icon"
              className="h-10 w-10 shrink-0"
            >
              {isLoading ? (
                <Square className="w-4 h-4 fill-current" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </form>
      </div>
    );
 }
 
 // Apply AI operations to layout
 function applyOpsToLayout(
   layout: { sections: any[]; theme: Record<string, any>; header: Record<string, any> },
   ops: any[]
 ): { sections: any[]; theme: Record<string, any>; header: Record<string, any> } {
   let newSections = [...layout.sections];
   let newTheme = { ...layout.theme };
   let newHeader = { ...layout.header };
 
   for (const op of ops) {
     switch (op.op) {
       case 'clearAllSections':
         newSections = [];
         break;
 
       case 'addSection':
         if (op.section) {
           const newSection = {
             id: crypto.randomUUID(),
             ...op.section,
             display_order: newSections.length,
             is_visible: true,
           };
           newSections.push(newSection);
         }
         break;
 
       case 'removeSection':
         if (op.sectionId) {
           newSections = newSections.filter(s => s.id !== op.sectionId);
         }
         break;
 
       case 'updateSection':
         if (op.sectionId && op.patch) {
           newSections = newSections.map(s =>
             s.id === op.sectionId ? { ...s, ...op.patch } : s
           );
         }
         break;
 
       case 'updateTheme':
         if (op.patch) {
           newTheme = { ...newTheme, ...op.patch };
         }
         break;
 
       case 'updateHeaderContent':
         if (op.patch) {
           newHeader = { ...newHeader, ...op.patch };
         }
         break;
     }
   }
 
   return { sections: newSections, theme: newTheme, header: newHeader };
 }