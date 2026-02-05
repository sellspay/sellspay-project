 import { memo } from 'react';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
import { Check, X, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
 import { ChatMessage } from './types';
 import { cn } from '@/lib/utils';
 
 interface VibecoderMessageProps {
   message: ChatMessage;
   isLatest: boolean;
  isApplying?: boolean;
   onRegenerate?: () => void;
 }
 
 export const VibecoderMessage = memo(function VibecoderMessage({
   message,
   isLatest,
  isApplying = false,
   onRegenerate,
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
        <Badge variant="default" className="w-fit text-[10px] bg-green-500/20 text-green-600 border-green-500/30">
           <Check className="w-3 h-3 mr-1" />
          Applied automatically
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
            <span>No changes generated</span>
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

      {/* Show pending with operations - will auto-apply */}
      {!isUser && hasOperations && isPending && isLatest && !isApplying && (
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50">
          <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border-primary/20">
            {message.operations?.length} change{message.operations?.length !== 1 ? 's' : ''} ready
          </Badge>
        </div>
       )}

      {/* Currently applying indicator */}
      {!isUser && hasOperations && isApplying && (
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50">
          <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border-primary/20 animate-pulse">
            <Loader2 className="w-3 h-3 animate-spin mr-1" />
            Applying {message.operations?.length} change{message.operations?.length !== 1 ? 's' : ''}...
          </Badge>
        </div>
       )}
     </div>
   );
 });