import { X, Download, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { DownloadProgress } from '@/hooks/useFileDownloadProgress';

interface DownloadProgressOverlayProps {
  progress: DownloadProgress | null;
  onCancel: () => void;
  onClose: () => void;
  currentFile?: number;
  totalFiles?: number;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatSpeed(bytesPerSecond: number): string {
  return formatBytes(bytesPerSecond) + '/s';
}

function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds) || seconds <= 0) return '--';
  
  if (seconds < 60) {
    return `${Math.ceil(seconds)}s`;
  } else if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.ceil(seconds % 60);
    return `${mins}m ${secs}s`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  }
}

export function DownloadProgressOverlay({ 
  progress, 
  onCancel, 
  onClose,
  currentFile,
  totalFiles 
}: DownloadProgressOverlayProps) {
  if (!progress) return null;

  const isComplete = progress.percentage >= 100;
  const hasMultipleFiles = totalFiles && totalFiles > 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 bg-card border border-border rounded-xl shadow-2xl p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isComplete ? (
              <CheckCircle className="h-6 w-6 text-primary" />
            ) : (
              <Download className="h-6 w-6 text-primary animate-pulse" />
            )}
            <div>
              <h3 className="font-semibold text-foreground">
                {isComplete ? 'Download Complete' : 'Downloading...'}
                {hasMultipleFiles && currentFile && (
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({currentFile} of {totalFiles})
                  </span>
                )}
              </h3>
              <p className="text-sm text-muted-foreground truncate max-w-[280px]">
                {progress.filename}
              </p>
            </div>
          </div>
          {isComplete && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <Progress value={progress.percentage} className="h-3" />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{progress.percentage}%</span>
            <span>
              {formatBytes(progress.loaded)}
              {progress.total > 0 && ` / ${formatBytes(progress.total)}`}
            </span>
          </div>
        </div>

        {/* Stats */}
        {!isComplete && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground">
                Speed: <span className="text-foreground font-medium">{formatSpeed(progress.speed)}</span>
              </span>
              <span className="text-muted-foreground">
                Remaining: <span className="text-foreground font-medium">{formatTime(progress.timeRemaining)}</span>
              </span>
            </div>
          </div>
        )}

        {/* Cancel button */}
        {!isComplete && (
          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel Download
            </Button>
          </div>
        )}

        {/* Close button when complete */}
        {isComplete && (
          <div className="flex justify-end pt-2">
            <Button onClick={onClose}>
              Done
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
