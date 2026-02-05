 import { useState, useRef, useEffect } from 'react';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { ScrollArea } from '@/components/ui/scroll-area';
 import { Sparkles, Send, Loader2, Trash2, ImageIcon } from 'lucide-react';
 import { useVibecoderChat } from './hooks/useVibecoderChat';
 import { useVibecoderOperations } from './hooks/useVibecoderOperations';
 import { useBrandProfile } from './hooks/useBrandProfile';
 import { useGeneratedAssets } from './hooks/useGeneratedAssets';
 import { useVibecoderCredits } from './hooks/useVibecoderCredits';
 import { VibecoderMessage } from './VibecoderMessage';
 import { QuickActionChips } from './QuickActionChips';
 import { CostWarningDialog } from './CostWarningDialog';
 import { OperationPreview } from './OperationPreview';
 import { ProfileSection } from '../types';
 import { CREDIT_COSTS, AssetRequest } from './types';
 import { toast } from 'sonner';
 
 interface VibecoderChatProps {
   profileId: string;
   sections: ProfileSection[];
   setSections: React.Dispatch<React.SetStateAction<ProfileSection[]>>;
   pushHistory: (state: { sections: ProfileSection[] }) => void;
   onShowAssetTray?: () => void;
 }
 
 export function VibecoderChat({
   profileId,
   sections,
   setSections,
   pushHistory,
   onShowAssetTray,
 }: VibecoderChatProps) {
   const [input, setInput] = useState('');
   const scrollRef = useRef<HTMLDivElement>(null);
   const inputRef = useRef<HTMLInputElement>(null);
   const [showCostWarning, setShowCostWarning] = useState(false);
   const [pendingAssetRequest, setPendingAssetRequest] = useState<{ type: string; prompt: string; spec?: AssetRequest['spec'] } | null>(null);
   const [showOperationPreview, setShowOperationPreview] = useState(false);
 
   const { brandProfile } = useBrandProfile(profileId);
   const { generateAsset, generating } = useGeneratedAssets(profileId);
   const { credits, checkCredits } = useVibecoderCredits(profileId);
 
   const {
     messages,
     isLoading,
     pendingOps,
     pendingAssetRequests,
     sendMessage,
     applyPendingOps,
     discardPendingOps,
     regenerate,
     clearChat,
   } = useVibecoderChat({ profileId, sections, brandProfile });
 
   const { applyOperations, previewOperations } = useVibecoderOperations({
     sections,
     setSections,
     pushHistory,
   });

   // Process asset requests from AI
   useEffect(() => {
     if (pendingAssetRequests && pendingAssetRequests.length > 0) {
       // Show the first asset request as a cost warning
       const firstRequest = pendingAssetRequests[0];
       const assetType = firstRequest.kind === 'image' ? (firstRequest.spec?.aspect === '21:9' ? 'banner' : 'thumbnail') : 'thumbnail';
       setPendingAssetRequest({
         type: assetType,
         prompt: firstRequest.spec?.purpose || 'Generate brand-aligned image',
         spec: firstRequest.spec,
       });
       
       // Calculate cost
       const costType = assetType === 'banner' ? 'banner_image' : 'thumbnail';
       const { cost, balance } = checkCredits(costType, firstRequest.count || 1);
       
       if (cost > 0) {
         setShowCostWarning(true);
       } else {
         // Free, generate immediately
         handleGenerateAsset(assetType, firstRequest.spec?.purpose || 'Generate image', firstRequest.spec);
       }
     }
   }, [pendingAssetRequests]);

   const handleGenerateAsset = async (type: string, prompt: string, spec?: AssetRequest['spec']) => {
     try {
       await generateAsset(type as any, prompt, spec);
       toast.success('Asset generated! Check the asset tray.');
       onShowAssetTray?.();
     } catch (error) {
       toast.error('Failed to generate asset');
       console.error(error);
     }
     setPendingAssetRequest(null);
   };

   const handleConfirmGeneration = () => {
     if (pendingAssetRequest) {
       handleGenerateAsset(pendingAssetRequest.type, pendingAssetRequest.prompt, pendingAssetRequest.spec);
     }
     setShowCostWarning(false);
   };
 
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
 
   const handleApply = () => {
     const ops = applyPendingOps();
     if (ops && ops.length > 0) {
       try {
         applyOperations(ops);
         toast.success('Changes applied successfully');
       } catch (error) {
         toast.error('Failed to apply changes');
         console.error(error);
       }
     }
   };
 
   const handlePreview = () => {
     if (pendingOps) {
        setShowOperationPreview(true);
     }
   };

   const handleApplyFromPreview = () => {
     if (pendingOps) {
       try {
         applyOperations(pendingOps);
         applyPendingOps();
         toast.success('Changes applied successfully');
       } catch (error) {
         toast.error('Failed to apply changes');
         console.error(error);
       }
     }
     setShowOperationPreview(false);
   };
 
   const isEmpty = messages.length === 0;
 
   return (
    <>
      <div className="flex flex-col h-full bg-background">
       {/* Header */}
       <div className="flex items-center justify-between p-4 border-b border-border">
         <div className="flex items-center gap-2">
           <Sparkles className="w-5 h-5 text-primary" />
           <h2 className="font-semibold text-foreground">AI Builder</h2>
            {generating && (
              <span className="text-xs text-muted-foreground animate-pulse">Generating...</span>
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
                onClick={clearChat}
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
                 I can help you:
               </p>
               <ul className="text-sm text-muted-foreground text-left space-y-1">
                 <li>• Redesign your storefront layout</li>
                 <li>• Rewrite copy to sound more premium</li>
                 <li>• Generate matching banners and thumbnails</li>
                 <li>• Add new sections like hero, FAQ, testimonials</li>
               </ul>
             </div>
             <div className="w-full">
               <p className="text-xs text-muted-foreground mb-3">Quick actions:</p>
               <QuickActionChips onAction={handleQuickAction} disabled={isLoading} />
             </div>
           </div>
         ) : (
           <div className="space-y-3">
             {messages.map((message, index) => (
               <VibecoderMessage
                 key={message.id}
                 message={message}
                 isLatest={index === messages.length - 1}
                 onApply={message.status === 'pending' && pendingOps ? handleApply : undefined}
                 onDiscard={message.status === 'pending' && pendingOps ? discardPendingOps : undefined}
                 onRegenerate={message.status === 'pending' ? regenerate : undefined}
                 onPreview={message.status === 'pending' && pendingOps ? handlePreview : undefined}
               />
             ))}
             {isLoading && (
               <div className="flex items-center gap-2 text-muted-foreground p-3 bg-muted/50 rounded-lg mr-4">
                 <Loader2 className="w-4 h-4 animate-spin" />
                 <span className="text-sm">Thinking...</span>
               </div>
             )}
           </div>
         )}
       </ScrollArea>
 
       {/* Quick actions when chat has messages */}
       {!isEmpty && !isLoading && (
         <div className="px-4 py-2 border-t border-border/50">
           <QuickActionChips onAction={handleQuickAction} disabled={isLoading} />
         </div>
       )}
 
       {/* Input */}
       <form onSubmit={handleSubmit} className="p-4 border-t border-border">
         <div className="flex gap-2">
           <Input
             ref={inputRef}
             value={input}
             onChange={(e) => setInput(e.target.value)}
             placeholder="Describe what you want to change..."
             disabled={isLoading}
             className="flex-1"
           />
           <Button type="submit" disabled={!input.trim() || isLoading} size="icon">
             {isLoading ? (
               <Loader2 className="w-4 h-4 animate-spin" />
             ) : (
               <Send className="w-4 h-4" />
             )}
           </Button>
         </div>
       </form>
      </div>

       {/* Cost Warning Dialog */}
       <CostWarningDialog
        open={showCostWarning}
        onOpenChange={setShowCostWarning}
        cost={pendingAssetRequest ? CREDIT_COSTS[pendingAssetRequest.type === 'banner' ? 'banner_image' : 'thumbnail'] : 0}
        balance={credits}
        actionDescription={`Generate a ${pendingAssetRequest?.type || 'image'} for your storefront`}
        onConfirm={handleConfirmGeneration}
      />

      {/* Operation Preview Dialog */}
       {pendingOps && (
        <OperationPreview
          open={showOperationPreview}
          onOpenChange={setShowOperationPreview}
          operations={pendingOps}
          onApply={handleApplyFromPreview}
          onCancel={() => setShowOperationPreview(false)}
        />
      )}
    </>
  );
}