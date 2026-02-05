 import { memo } from 'react';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
import { Check, X, RefreshCw, Eye, AlertCircle } from 'lucide-react';
 import { ChatMessage } from './types';
 import { cn } from '@/lib/utils';
 
 interface VibecoderMessageProps {
   message: ChatMessage;
   isLatest: boolean;
   onApply?: () => void;
   onDiscard?: () => void;
   onRegenerate?: () => void;
   onPreview?: () => void;
 }
 
 export const VibecoderMessage = memo(function VibecoderMessage({
   message,
   isLatest,
   onApply,
   onDiscard,
   onRegenerate,
   onPreview,
 }: VibecoderMessageProps) {
   const isUser = message.role === 'user';
   const hasOperations = message.operations && message.operations.length > 0;
   const isPending = message.status === 'pending';
   const isApplied = message.status === 'applied';
   const isDiscarded = message.status === 'discarded';
 
   return (
     <div
       className={cn(
         'flex flex-col gap-2 p-3 rounded-lg',
         isUser 
           ? 'bg-primary/10 ml-8' 
           : 'bg-muted/50 mr-4'
       )}
     >
       {/* Message header */}
       <div className="flex items-center justify-between">
         <span className="text-xs font-medium text-muted-foreground">
           {isUser ? 'You' : 'AI Builder'}
         </span>
         <span className="text-[10px] text-muted-foreground/60">
           {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
         </span>
       </div>
 
       {/* Message content */}
       <p className="text-sm text-foreground whitespace-pre-wrap">
         {message.content}
       </p>
 
       {/* Operations summary */}
       {hasOperations && (
         <div className="flex flex-wrap gap-1 mt-1">
           {message.operations!.map((op, i) => (
             <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0">
               {op.op}
             </Badge>
           ))}
         </div>
       )}
 
       {/* Status badge */}
       {isApplied && (
         <Badge variant="default" className="w-fit text-[10px] bg-primary/20 text-primary border-primary/30">
           <Check className="w-3 h-3 mr-1" />
           Applied
         </Badge>
       )}
       {isDiscarded && (
         <Badge variant="secondary" className="w-fit text-[10px] bg-muted text-muted-foreground">
           <X className="w-3 h-3 mr-1" />
           Discarded
         </Badge>
       )}
 
      {/* Show message when AI responded but with no operations */}
      {!isUser && !hasOperations && isPending && isLatest && (
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <AlertCircle className="w-3 h-3" />
            <span>No layout changes to apply</span>
          </div>
          {onRegenerate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRegenerate}
              className="h-7 text-xs text-muted-foreground ml-auto"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Try Again
            </Button>
          )}
        </div>
      )}

      {/* Action buttons for pending operations */}
      {!isUser && hasOperations && isPending && isLatest && (
         <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-border/50">
           {onPreview && (
             <Button
               variant="outline"
               size="sm"
               onClick={onPreview}
               className="h-7 text-xs"
             >
               <Eye className="w-3 h-3 mr-1" />
               Preview
             </Button>
           )}
           {onApply && (
             <Button
               variant="default"
               size="sm"
               onClick={onApply}
               className="h-7 text-xs"
             >
               <Check className="w-3 h-3 mr-1" />
               Apply
             </Button>
           )}
           {onDiscard && (
             <Button
               variant="ghost"
               size="sm"
               onClick={onDiscard}
               className="h-7 text-xs text-muted-foreground"
             >
               <X className="w-3 h-3 mr-1" />
               Discard
             </Button>
           )}
           {onRegenerate && (
             <Button
               variant="ghost"
               size="sm"
               onClick={onRegenerate}
               className="h-7 text-xs text-muted-foreground"
             >
               <RefreshCw className="w-3 h-3 mr-1" />
               Regenerate
             </Button>
           )}
         </div>
       )}
     </div>
   );
 });