import { ThumbsUp, ThumbsDown, Undo2, Code2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { VibecoderMessage } from './hooks/useVibecoderProjects';

interface VibecoderMessageBubbleProps {
  message: VibecoderMessage;
  onRate?: (rating: -1 | 0 | 1) => void;
  onRestoreCode?: () => void;
  canRestore?: boolean;
}

export function VibecoderMessageBubble({
  message,
  onRate,
  onRestoreCode,
  canRestore = false,
}: VibecoderMessageBubbleProps) {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';
  const hasCodeSnapshot = !!message.code_snapshot;

  return (
    <div
      className={cn(
        'flex',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-[85%] px-4 py-2.5 rounded-2xl relative group',
          isUser
            ? 'bg-primary/20 border border-primary/30 text-foreground'
            : 'bg-muted/50 border border-border/50 text-muted-foreground'
        )}
      >
        {/* Message content */}
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>

        {/* Code snapshot indicator */}
        {hasCodeSnapshot && isAssistant && (
          <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border/30">
            <Code2 className="h-3 w-3 text-primary" />
            <span className="text-[10px] text-muted-foreground">
              Code snapshot saved
            </span>
          </div>
        )}

        {/* Actions for assistant messages */}
        {isAssistant && (
          <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Feedback buttons */}
            {onRate && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'h-6 w-6',
                    message.rating === 1 && 'text-primary bg-primary/10'
                  )}
                  onClick={() => onRate(message.rating === 1 ? 0 : 1)}
                  title="Good response"
                >
                  <ThumbsUp className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'h-6 w-6',
                    message.rating === -1 && 'text-destructive bg-destructive/10'
                  )}
                  onClick={() => onRate(message.rating === -1 ? 0 : -1)}
                  title="Bad response"
                >
                  <ThumbsDown className="h-3 w-3" />
                </Button>
              </>
            )}

            {/* Restore code button */}
            {canRestore && hasCodeSnapshot && onRestoreCode && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs gap-1 ml-1"
                onClick={onRestoreCode}
                title="Restore this version"
              >
                <Undo2 className="h-3 w-3" />
                Restore
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
