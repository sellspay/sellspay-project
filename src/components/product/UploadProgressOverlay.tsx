import { Check, Upload, Loader2, FileCheck, Rocket, PartyPopper, Zap } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { UploadProgress, formatBytes, formatTime } from '@/hooks/useFileUploadProgress';

interface UploadProgressOverlayProps {
  isVisible: boolean;
  progress: UploadProgress;
  isEdit?: boolean;
}

export default function UploadProgressOverlay({ isVisible, progress, isEdit = false }: UploadProgressOverlayProps) {
  if (!isVisible) return null;

  const getPhaseInfo = () => {
    switch (progress.phase) {
      case 'uploading':
        return {
          icon: <Upload className="w-8 h-8 text-white" />,
          emoji: '🚀',
          label: progress.totalFiles > 1 
            ? `Uploading file ${progress.currentFileIndex + 1} of ${progress.totalFiles}` 
            : 'Uploading...',
          sublabel: progress.currentFileName,
        };
      case 'processing':
        return {
          icon: <Loader2 className="w-8 h-8 text-white animate-spin" />,
          emoji: '⚙️',
          label: 'Processing...',
          sublabel: isEdit ? 'Updating your product' : 'Creating your product',
        };
      case 'done':
        return {
          icon: <PartyPopper className="w-8 h-8 text-white" />,
          emoji: '🎉',
          label: isEdit ? 'Product Updated!' : 'Product Published!',
          sublabel: 'Redirecting...',
        };
      default:
        return {
          icon: <FileCheck className="w-8 h-8 text-white" />,
          emoji: '📦',
          label: 'Preparing...',
          sublabel: 'Getting ready to upload',
        };
    }
  };

  const phaseInfo = getPhaseInfo();
  const isDone = progress.phase === 'done';
  const isUploading = progress.phase === 'uploading';

  // Determine if using fast TUS upload (files > 50MB)
  const isLargeFile = progress.totalBytes > 50 * 1024 * 1024;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-background/90 backdrop-blur-md" />

      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: '0.5s' }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-md w-full">
        {/* Animated icon */}
        <div className="relative mb-6">
          <div
            className={`w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center ${
              isDone ? '' : 'animate-pulse'
            }`}
          >
            <span className="text-4xl">{phaseInfo.emoji}</span>
          </div>
          {!isDone && (
            <div
              className="absolute inset-0 w-24 h-24 border-2 border-primary/30 border-t-primary rounded-full animate-spin"
              style={{ animationDuration: '1.5s' }}
            />
          )}
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          {phaseInfo.label}
        </h2>

        {/* Sublabel */}
        <p className="text-muted-foreground mb-4 h-6 truncate max-w-full" title={phaseInfo.sublabel}>
          {phaseInfo.sublabel}
        </p>

        {/* Upload mode badge */}
        {isUploading && isLargeFile && (
          <div className="flex items-center gap-1.5 mb-4 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
            <Zap className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">Resumable Upload</span>
          </div>
        )}

        {/* Progress bar */}
        <div className="w-full mb-4">
          <Progress value={progress.percentage} className="h-3" />
        </div>

        {/* Real-time stats */}
        {isUploading && (
          <div className="w-full space-y-3 text-sm">
            {/* Speed and time - large display */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-foreground">
                    {progress.speed > 0 ? `${formatBytes(progress.speed)}/s` : 'Starting...'}
                  </p>
                  <p className="text-xs text-muted-foreground">Upload speed</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-foreground">
                  {progress.estimatedRemaining > 0 && progress.speed > 0
                    ? formatTime(progress.estimatedRemaining)
                    : 'Calculating...'}
                </p>
                <p className="text-xs text-muted-foreground">Time remaining</p>
              </div>
            </div>

            {/* Bytes uploaded - progress text */}
            <div className="flex justify-center">
              <span className="text-muted-foreground font-mono text-xs">
                {formatBytes(progress.uploadedBytes)} / {formatBytes(progress.totalBytes)}
              </span>
            </div>
          </div>
        )}

        {/* Percentage */}
        <p className="text-2xl font-bold font-mono text-foreground mt-4">
          {Math.round(progress.percentage)}%
        </p>

        {/* Phase indicators */}
        <div className="flex items-center justify-center gap-3 mt-6">
          {['uploading', 'processing', 'done'].map((phase, i) => {
            const phases = ['uploading', 'processing', 'done'];
            const currentIndex = phases.indexOf(progress.phase);
            const isCompleted = i < currentIndex;
            const isCurrent = phases[i] === progress.phase;

            return (
              <div
                key={phase}
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm transition-all duration-300 ${
                  isCompleted
                    ? 'bg-primary text-primary-foreground scale-90'
                    : isCurrent
                    ? 'bg-gradient-to-r from-primary to-accent text-white scale-110 shadow-lg'
                    : 'bg-muted text-muted-foreground scale-75'
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : <span className="text-xs">{i + 1}</span>}
              </div>
            );
          })}
        </div>

        {/* Tip for large files */}
        {isUploading && progress.totalBytes > 500 * 1024 * 1024 && (
          <p className="text-xs text-muted-foreground mt-4 max-w-xs">
            💡 Large file detected. Upload will resume automatically if interrupted.
          </p>
        )}
      </div>
    </div>
  );
}
