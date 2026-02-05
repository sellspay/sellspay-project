 import { useState, useRef, useEffect } from 'react';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Send, Loader2, Trash2, ImageIcon, Check, ChevronUp, Undo2 } from 'lucide-react';
 import { Wand2 } from 'lucide-react';
 import { useVibecoderChat } from './hooks/useVibecoderChat';
 import { useVibecoderOperations } from './hooks/useVibecoderOperations';
 import { useBrandProfile } from './hooks/useBrandProfile';
 import { useGeneratedAssets } from './hooks/useGeneratedAssets';
 import { useVibecoderCredits } from './hooks/useVibecoderCredits';
 import { VibecoderMessage } from './VibecoderMessage';
 import { QuickActionChips } from './QuickActionChips';
 import { ProfileSection } from '../types';
 import { toast } from 'sonner';
 import { supabase } from '@/integrations/supabase/client';
 
 interface VibecoderChatProps {
   profileId: string;
   sections: ProfileSection[];
   setSections: React.Dispatch<React.SetStateAction<ProfileSection[]>>;
   pushHistory: (state: { sections: ProfileSection[] }) => void;
   onShowAssetTray?: () => void;
   onThemeUpdate?: (path: string, value: unknown) => void;
   onHeaderUpdate?: (patch: Record<string, unknown>) => void;
  onUndo?: () => void;
  canUndo?: boolean;
 }
 
 export function VibecoderChat({
   profileId,
   sections,
   setSections,
   pushHistory,
   onShowAssetTray,
   onThemeUpdate,
   onHeaderUpdate,
  onUndo,
  canUndo,
 }: VibecoderChatProps) {
   const [input, setInput] = useState('');
   const scrollRef = useRef<HTMLDivElement>(null);
   const inputRef = useRef<HTMLInputElement>(null);
   const [isApplying, setIsApplying] = useState(false);
  const [applyingMessageId, setApplyingMessageId] = useState<string | null>(null);
   const appliedOpsRef = useRef<Set<string>>(new Set());
    const processedAssetReqsRef = useRef<Set<string>>(new Set());
 
   const { brandProfile } = useBrandProfile(profileId);
   const { generateAsset, generating } = useGeneratedAssets(profileId);
   const { credits } = useVibecoderCredits(profileId);
 
   const {
     messages,
     isLoading,
      isLoadingHistory,
      hasMoreHistory,
     pendingOps,
     pendingAssetRequests,
     sendMessage,
     applyPendingOps,
     regenerate,
     clearChat,
      clearPendingAssetRequests,
      loadMoreHistory,
   } = useVibecoderChat({ profileId, sections, brandProfile });
 
   const { applyOperations } = useVibecoderOperations({
     sections,
     setSections,
     pushHistory,
     onThemeUpdate,
     onHeaderUpdate,
   });
 
   // AUTO-APPLY: When AI returns operations, apply them automatically
   useEffect(() => {
     if (pendingOps && pendingOps.length > 0 && !isApplying) {
      const opsKey = JSON.stringify(pendingOps);
       if (appliedOpsRef.current.has(opsKey)) return;
       
       appliedOpsRef.current.add(opsKey);
       setIsApplying(true);
      
      // Track which message we're applying
      const latestAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant');
      if (latestAssistantMessage) {
        setApplyingMessageId(latestAssistantMessage.id);
      }
       
       try {
         applyOperations(pendingOps);
         applyPendingOps();
         toast.success('Changes applied!', { icon: <Check className="w-4 h-4" /> });
       } catch (error) {
         console.error('Failed to apply operations:', error);
          const errorMessage = error instanceof Error ? error.message : 'Failed to apply changes';
          toast.error(errorMessage);
          // Remove from applied set so user can retry
          appliedOpsRef.current.delete(opsKey);
       } finally {
         setIsApplying(false);
        setApplyingMessageId(null);
       }
     }
  }, [pendingOps, applyOperations, applyPendingOps, isApplying, messages]);
 
   // AUTO-GENERATE: When AI requests assets, generate them automatically
   useEffect(() => {
     if (pendingAssetRequests && pendingAssetRequests.length > 0 && !generating) {
        const reqKey = JSON.stringify(pendingAssetRequests);
        if (processedAssetReqsRef.current.has(reqKey)) return;
        processedAssetReqsRef.current.add(reqKey);

       const processAssets = async () => {
          try {
            for (const request of pendingAssetRequests) {
              const assetType = request.kind === 'image'
                ? (request.spec?.aspect === '21:9' ? 'banner' : 'thumbnail')
                : 'thumbnail';

              await generateAsset(
                assetType as 'banner' | 'thumbnail' | 'background' | 'promo',
                request.spec?.purpose || 'Generate image',
                request.spec
              );
              toast.success(`Generated ${assetType}!`);
            }
            onShowAssetTray?.();
          } catch (error) {
            console.error('Failed to generate asset:', error);
          } finally {
            // Critical: clear requests so we don't loop forever on re-render/reopen.
            clearPendingAssetRequests();
          }
       };
       processAssets();
     }
    }, [pendingAssetRequests, generateAsset, generating, onShowAssetTray, clearPendingAssetRequests]);
 
   // Scroll to bottom on new messages
   useEffect(() => {
     if (scrollRef.current) {
       scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
     }
   }, [messages]);
 
   const handleSubmit = (e: React.FormEvent) => {
     e.preventDefault();
     if (input.trim() && !isLoading) {
       sendMessage(input.trim());
       setInput('');
     }
   };
 
   const handleQuickAction = (prompt: string) => {
     sendMessage(prompt);
   };

  // Fresh build - create complete storefront from scratch
  const handleFreshBuild = () => {
    const freshBuildPrompt = `Build me a complete, premium storefront from scratch. Create a full professional layout with: 
1. A striking hero headline section with dramatic typography and text shadow
2. An about me section with glassmorphism styling (showBackground: true, containerBackgroundColor with transparency, borderStyle: solid)
3. Social proof testimonials section with premium dark styling
4. A call-to-action image_with_text section

IMPORTANT: Use these style_options on EVERY section:
- colorScheme: "dark" or "black"
- showBackground: true
- containerBackgroundColor: "rgba(255,255,255,0.05)"
- borderStyle: "solid"
- borderColor: "rgba(255,255,255,0.1)"
- animation: "fade-in" or "slide-up"

For headlines use: font: "serif", fontWeight: "bold", textShadow: "soft"

Make it look like a high-end luxury creator's store.`;
    sendMessage(freshBuildPrompt);
  };
 
    const isEmpty = messages.length === 0 && !isLoadingHistory;
   const isWorking = isLoading || isApplying || generating;
 
   return (
     <div className="flex flex-col h-full bg-background">
       {/* Header */}
       <div className="flex items-center justify-between p-4 border-b border-border">
         <div className="flex items-center gap-2">
           <Sparkles className="w-5 h-5 text-primary" />
           <h2 className="font-semibold text-foreground">AI Builder</h2>
           {isWorking && (
             <span className="text-xs text-primary animate-pulse flex items-center gap-1">
               <Loader2 className="w-3 h-3 animate-spin" />
               {isLoading ? 'Thinking...' : isApplying ? 'Applying...' : 'Generating...'}
             </span>
           )}
         </div>
         <div className="flex items-center gap-1">
          {canUndo && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onUndo?.();
                toast.success('Reverted changes');
              }}
              className="text-muted-foreground hover:text-foreground gap-1"
              title="Undo last AI change"
            >
              <Undo2 className="w-4 h-4" />
              <span className="text-xs">Undo</span>
            </Button>
          )}
           {onShowAssetTray && (
             <Button
               variant="ghost"
               size="sm"
               onClick={onShowAssetTray}
               className="text-muted-foreground hover:text-foreground"
             >
               <ImageIcon className="w-4 h-4" />
             </Button>
           )}
           {messages.length > 0 && (
             <Button
               variant="ghost"
               size="sm"
               onClick={() => {
                 clearChat();
                 appliedOpsRef.current.clear();
                  processedAssetReqsRef.current.clear();
               }}
               className="text-muted-foreground hover:text-foreground"
             >
               <Trash2 className="w-4 h-4" />
             </Button>
           )}
         </div>
       </div>
 
       {/* Chat area */}
       <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {/* Load more history button */}
          {hasMoreHistory && (
            <div className="flex justify-center mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={loadMoreHistory}
                disabled={isLoadingHistory}
                className="text-muted-foreground hover:text-foreground"
              >
                {isLoadingHistory ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                ) : (
                  <ChevronUp className="w-4 h-4 mr-1" />
                )}
                View older messages
              </Button>
            </div>
          )}

          {/* Loading history indicator */}
          {isLoadingHistory && messages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}

         {isEmpty ? (
           <div className="flex flex-col items-center justify-center h-full text-center space-y-6 py-8">
             <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
               <Sparkles className="w-8 h-8 text-primary" />
             </div>
             <div className="space-y-2 max-w-xs">
               <h3 className="font-semibold text-foreground">AI Builder</h3>
               <p className="text-sm text-muted-foreground">
                 Describe what you want and I'll create it automatically:
               </p>
             </div>
            
            {/* Primary CTA - Build from scratch */}
            <Button
              onClick={handleFreshBuild}
              disabled={isWorking}
              className="gap-2"
              size="lg"
            >
              <Wand2 className="w-4 h-4" />
              Build My Store
            </Button>
            
             <div className="w-full">
               <p className="text-xs text-muted-foreground mb-3">Quick actions:</p>
               <QuickActionChips onAction={handleQuickAction} disabled={isWorking} />
             </div>
           </div>
         ) : (
           <div className="space-y-3">
             {messages.map((message, index) => (
               <VibecoderMessage
                 key={message.id}
                 message={message}
                 isLatest={index === messages.length - 1}
                  isApplying={applyingMessageId === message.id}
                 onRegenerate={message.status === 'pending' && message.role === 'assistant' ? regenerate : undefined}
                 onUndo={onUndo}
                 canUndo={canUndo && message.status === 'applied'}
                 onFeedback={async (messageId, feedback) => {
                   // Update the ai_runs table with user feedback
                   try {
                     await supabase
                       .from('storefront_ai_conversations')
                       .update({ 
                         // Store feedback in the operations column as JSON
                         operations: { feedback, feedbackAt: new Date().toISOString() }
                       })
                       .eq('id', messageId);
                   } catch (error) {
                     console.error('Failed to save feedback:', error);
                   }
                 }}
               />
             ))}
             {isWorking && (
               <div className="flex items-center gap-2 text-primary p-3 bg-primary/5 rounded-lg mr-4 border border-primary/20">
                 <Loader2 className="w-4 h-4 animate-spin" />
                 <span className="text-sm">
                   {isLoading ? 'Understanding your request...' : isApplying ? 'Applying changes to your storefront...' : 'Generating assets...'}
                 </span>
               </div>
             )}
           </div>
         )}
       </ScrollArea>
 
       {/* Quick actions when chat has messages */}
       {!isEmpty && !isWorking && (
         <div className="px-4 py-2 border-t border-border/50">
           <QuickActionChips onAction={handleQuickAction} disabled={isWorking} />
         </div>
       )}
 
       {/* Input */}
       <form onSubmit={handleSubmit} className="p-4 border-t border-border">
         <div className="flex gap-2">
           <Input
             ref={inputRef}
             value={input}
             onChange={(e) => setInput(e.target.value)}
             placeholder="Describe what you want to create..."
             disabled={isWorking}
             className="flex-1"
           />
           <Button type="submit" disabled={!input.trim() || isWorking} size="icon">
             {isWorking ? (
               <Loader2 className="w-4 h-4 animate-spin" />
             ) : (
               <Send className="w-4 h-4" />
             )}
           </Button>
         </div>
         <p className="text-[10px] text-muted-foreground mt-2 text-center">
           Changes apply automatically • {credits} credits
         </p>
       </form>
     </div>
   );
 }