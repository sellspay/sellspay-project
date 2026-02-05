 import { useState, useRef, useEffect } from 'react';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { ScrollArea } from '@/components/ui/scroll-area';
 import { Sparkles, Send, Loader2, Trash2, ImageIcon, Check } from 'lucide-react';
 import { useVibecoderChat } from './hooks/useVibecoderChat';
 import { useVibecoderOperations } from './hooks/useVibecoderOperations';
 import { useBrandProfile } from './hooks/useBrandProfile';
 import { useGeneratedAssets } from './hooks/useGeneratedAssets';
 import { useVibecoderCredits } from './hooks/useVibecoderCredits';
 import { VibecoderMessage } from './VibecoderMessage';
 import { QuickActionChips } from './QuickActionChips';
 import { ProfileSection } from '../types';
 import { toast } from 'sonner';
 
 interface VibecoderChatProps {
   profileId: string;
   sections: ProfileSection[];
   setSections: React.Dispatch<React.SetStateAction<ProfileSection[]>>;
   pushHistory: (state: { sections: ProfileSection[] }) => void;
   onShowAssetTray?: () => void;
   onThemeUpdate?: (path: string, value: unknown) => void;
   onHeaderUpdate?: (patch: Record<string, unknown>) => void;
 }
 
 export function VibecoderChat({
   profileId,
   sections,
   setSections,
   pushHistory,
   onShowAssetTray,
   onThemeUpdate,
   onHeaderUpdate,
 }: VibecoderChatProps) {
   const [input, setInput] = useState('');
   const scrollRef = useRef<HTMLDivElement>(null);
   const inputRef = useRef<HTMLInputElement>(null);
   const [isApplying, setIsApplying] = useState(false);
   const appliedOpsRef = useRef<Set<string>>(new Set());
 
   const { brandProfile } = useBrandProfile(profileId);
   const { generateAsset, generating } = useGeneratedAssets(profileId);
   const { credits } = useVibecoderCredits(profileId);
 
   const {
     messages,
     isLoading,
     pendingOps,
     pendingAssetRequests,
     sendMessage,
     applyPendingOps,
     regenerate,
     clearChat,
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
       const opsKey = JSON.stringify(pendingOps.map(op => op.op));
       if (appliedOpsRef.current.has(opsKey)) return;
       
       appliedOpsRef.current.add(opsKey);
       setIsApplying(true);
       
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
       }
     }
   }, [pendingOps, applyOperations, applyPendingOps, isApplying]);
 
   // AUTO-GENERATE: When AI requests assets, generate them automatically
   useEffect(() => {
     if (pendingAssetRequests && pendingAssetRequests.length > 0 && !generating) {
       const processAssets = async () => {
         for (const request of pendingAssetRequests) {
           const assetType = request.kind === 'image' 
             ? (request.spec?.aspect === '21:9' ? 'banner' : 'thumbnail') 
             : 'thumbnail';
           
           try {
             await generateAsset(assetType as 'banner' | 'thumbnail' | 'background' | 'promo', request.spec?.purpose || 'Generate image', request.spec);
             toast.success(`Generated ${assetType}!`);
           } catch (error) {
             console.error('Failed to generate asset:', error);
           }
         }
         onShowAssetTray?.();
       };
       processAssets();
     }
   }, [pendingAssetRequests, generateAsset, generating, onShowAssetTray]);
 
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
 
   const isEmpty = messages.length === 0;
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
               <ul className="text-sm text-muted-foreground text-left space-y-1">
                 <li>• "Add a hero section with my brand colors"</li>
                 <li>• "Create a testimonials section"</li>
                 <li>• "Make my storefront look more premium"</li>
                 <li>• "Generate a banner for my store"</li>
               </ul>
             </div>
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
                 onRegenerate={message.status === 'pending' && message.role === 'assistant' ? regenerate : undefined}
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