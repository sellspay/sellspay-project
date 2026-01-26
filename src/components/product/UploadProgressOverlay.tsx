import { Check, Upload, Loader2, FileCheck, Rocket, PartyPopper } from 'lucide-react';
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
          emoji: '📤',
          label: progress.totalFiles > 1 
            ? `Uploading file ${progress.currentFileIndex + 1} of ${progress.totalFiles}` 
            : 'Uploading file...',
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
        <p className="text-muted-foreground mb-6 h-6 truncate max-w-full" title={phaseInfo.sublabel}>
          {phaseInfo.sublabel}
        </p>

        {/* Progress bar */}
        <div className="w-full mb-4">
          <Progress value={progress.percentage} className="h-2" />
        </div>

        {/* Real-time stats */}
        {isUploading && (
          <div className="w-full space-y-2 text-sm">
            {/* Speed and time */}
            <div className="flex justify-between text-muted-foreground">
              <span>
                {progress.speed > 0 ? `${formatBytes(progress.speed)}/s` : 'Starting...'}
              </span>
              <span>
                {progress.estimatedRemaining > 0 && progress.speed > 0
                  ? `~${formatTime(progress.estimatedRemaining)} remaining`
                  : 'Calculating...'}
              </span>
            </div>

            {/* Bytes uploaded */}
            <div className="flex justify-center text-muted-foreground">
              <span>
                {formatBytes(progress.uploadedBytes)} / {formatBytes(progress.totalBytes)}
              </span>
            </div>
          </div>
        )}

        {/* Percentage */}
        <p className="text-sm font-mono text-muted-foreground mt-4">
          {Math.round(progress.percentage)}% complete
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
      </div>
    </div>
  );
}
