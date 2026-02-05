 import { memo, useState } from 'react';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { Check, X, RefreshCw, AlertCircle, Loader2, Undo2, ThumbsUp, ThumbsDown, Copy, MoreHorizontal, Clock, Zap } from 'lucide-react';
 import { ChatMessage } from './types';
 import { cn } from '@/lib/utils';
 import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
 } from '@/components/ui/dropdown-menu';
 import { toast } from 'sonner';
 
 interface VibecoderMessageProps {
   message: ChatMessage;
   isLatest: boolean;
  isApplying?: boolean;
   onRegenerate?: () => void;
   onUndo?: () => void;
   canUndo?: boolean;
   onFeedback?: (messageId: string, feedback: 'liked' | 'disliked') => void;
 }
 
 export const VibecoderMessage = memo(function VibecoderMessage({
   message,
   isLatest,
  isApplying = false,
   onRegenerate,
   onUndo,
   canUndo,
   onFeedback,
 }: VibecoderMessageProps) {
   const isUser = message.role === 'user';
   const hasOperations = message.operations && message.operations.length > 0;
   const isPending = message.status === 'pending';
   const isApplied = message.status === 'applied';
   const isDiscarded = message.status === 'discarded';
 
   const [localFeedback, setLocalFeedback] = useState<'liked' | 'disliked' | null>(message.feedback || null);
 
   const handleFeedback = (feedback: 'liked' | 'disliked') => {
     const newFeedback = localFeedback === feedback ? null : feedback;
     setLocalFeedback(newFeedback);
     if (newFeedback) {
       onFeedback?.(message.id, newFeedback);
       toast.success(newFeedback === 'liked' ? 'Thanks for the feedback!' : 'We\'ll improve based on your feedback');
     }
   };
 
   const handleCopy = () => {
     navigator.clipboard.writeText(message.content);
     toast.success('Copied to clipboard');
   };
 
   // Format latency for display
   const formatLatency = (ms?: number) => {
     if (!ms) return null;
     if (ms < 1000) return `${ms}ms`;
     const seconds = Math.floor(ms / 1000);
     const remainingMs = ms % 1000;
     if (seconds < 60) return `${seconds}s`;
     const minutes = Math.floor(seconds / 60);
     const remainingSecs = seconds % 60;
     return `${minutes}m ${remainingSecs}s`;
   };
 
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
 
       {/* Lovable-style Feedback Toolbar - only for AI messages that were applied */}
       {!isUser && isApplied && (
         <div className="flex items-center gap-0.5 mt-2 pt-2 border-t border-border/50">
           {/* Undo */}
           {canUndo && (
             <Button
               variant="ghost"
               size="sm"
               onClick={onUndo}
               className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
               title="Undo this change"
             >
               <Undo2 className="w-3.5 h-3.5" />
             </Button>
           )}
 
           {/* Like */}
           <Button
             variant="ghost"
             size="sm"
             onClick={() => handleFeedback('liked')}
             className={cn(
               "h-7 w-7 p-0",
               localFeedback === 'liked' 
                ? "text-primary hover:text-primary/80" 
                 : "text-muted-foreground hover:text-foreground"
             )}
             title="Good response"
           >
             <ThumbsUp className={cn("w-3.5 h-3.5", localFeedback === 'liked' && "fill-current")} />
           </Button>
 
           {/* Dislike */}
           <Button
             variant="ghost"
             size="sm"
             onClick={() => handleFeedback('disliked')}
             className={cn(
               "h-7 w-7 p-0",
               localFeedback === 'disliked' 
                ? "text-destructive hover:text-destructive/80" 
                 : "text-muted-foreground hover:text-foreground"
             )}
             title="Bad response"
           >
             <ThumbsDown className={cn("w-3.5 h-3.5", localFeedback === 'disliked' && "fill-current")} />
           </Button>
 
           {/* Copy */}
           <Button
             variant="ghost"
             size="sm"
             onClick={handleCopy}
             className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
             title="Copy message"
           >
             <Copy className="w-3.5 h-3.5" />
           </Button>
 
           {/* More menu with metadata */}
           <DropdownMenu>
             <DropdownMenuTrigger asChild>
               <Button
                 variant="ghost"
                 size="sm"
                 className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
               >
                 <MoreHorizontal className="w-3.5 h-3.5" />
               </Button>
             </DropdownMenuTrigger>
             <DropdownMenuContent align="start" className="min-w-[180px]">
               <DropdownMenuItem onClick={handleCopy} className="gap-2">
                 <Copy className="w-3.5 h-3.5" />
                 Copy message
               </DropdownMenuItem>
               <DropdownMenuSeparator />
               {message.latencyMs && (
                 <div className="px-2 py-1.5 text-xs text-muted-foreground flex items-center justify-between">
                   <span className="flex items-center gap-1.5">
                     <Clock className="w-3 h-3" />
                     Worked for
                   </span>
                  <span className="font-medium">{formatLatency(message.latencyMs)}</span>
                 </div>
               )}
               {message.creditsUsed !== undefined && (
                 <div className="px-2 py-1.5 text-xs text-muted-foreground flex items-center justify-between">
                   <span className="flex items-center gap-1.5">
                     <Zap className="w-3 h-3" />
                     Credits used
                   </span>
                  <span className="font-medium">{message.creditsUsed.toFixed(2)}</span>
                 </div>
               )}
               {!message.latencyMs && message.creditsUsed === undefined && (
                 <div className="px-2 py-1.5 text-xs text-muted-foreground">
                   No additional info
                 </div>
               )}
             </DropdownMenuContent>
           </DropdownMenu>
         </div>
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