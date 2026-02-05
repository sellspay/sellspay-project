 import { useState, useRef, useEffect } from 'react';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { ScrollArea } from '@/components/ui/scroll-area';
 import { Sparkles, Send, Loader2, Trash2 } from 'lucide-react';
 import { useVibecoderChat } from './hooks/useVibecoderChat';
 import { useVibecoderOperations } from './hooks/useVibecoderOperations';
 import { useBrandProfile } from './hooks/useBrandProfile';
 import { VibecoderMessage } from './VibecoderMessage';
 import { QuickActionChips } from './QuickActionChips';
 import { ProfileSection } from '../types';
 import { toast } from 'sonner';
 
 interface VibecoderChatProps {
   profileId: string;
   sections: ProfileSection[];
   setSections: React.Dispatch<React.SetStateAction<ProfileSection[]>>;
   pushHistory: (state: { sections: ProfileSection[] }) => void;
 }
 
 export function VibecoderChat({
   profileId,
   sections,
   setSections,
   pushHistory,
 }: VibecoderChatProps) {
   const [input, setInput] = useState('');
   const scrollRef = useRef<HTMLDivElement>(null);
   const inputRef = useRef<HTMLInputElement>(null);
 
   const { brandProfile } = useBrandProfile(profileId);
 
   const {
     messages,
     isLoading,
     pendingOps,
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
       const previewSections = previewOperations(pendingOps);
       console.log('Preview sections:', previewSections);
       toast.info('Preview shown in editor');
     }
   };
 
   const isEmpty = messages.length === 0;
 
   return (
     <div className="flex flex-col h-full bg-background">
       {/* Header */}
       <div className="flex items-center justify-between p-4 border-b border-border">
         <div className="flex items-center gap-2">
           <Sparkles className="w-5 h-5 text-primary" />
           <h2 className="font-semibold text-foreground">AI Builder</h2>
         </div>
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
   );
 }