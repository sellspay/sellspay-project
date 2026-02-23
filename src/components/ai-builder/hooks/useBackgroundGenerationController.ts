import { useState, useCallback, useRef, useEffect } from 'react';
import { useBackgroundGeneration, type GenerationJob } from '@/hooks/useBackgroundGeneration';
import { useGhostFixer } from '@/hooks/useGhostFixer';
import { toast } from 'sonner';
import type { AIModel } from '../ChatInputBar';

interface BackgroundGenerationControllerOptions {
  activeProjectId: string | null;
  addMessage: (role: string, content: string, codeSnapshot?: string, projectId?: string) => Promise<any>;
  setCode: (code: string, skipGuards?: boolean) => void;
  setFiles: (files: Record<string, string>) => void;
  getLastValidSnapshot: () => Record<string, string> | null;
  setPendingPlan: (plan: { plan: any; originalPrompt: string } | null) => void;
  setLiveSteps: (steps: string[]) => void;
  resetAgent: () => void;
  onStreamingComplete: () => void;
  onStreamingError: (error: string) => void;
  generationLockRef: React.MutableRefObject<string | null>;
  activeJobIdRef: React.MutableRefObject<string | null>;
  pendingSummaryRef: React.MutableRefObject<string>;
}

export function useBackgroundGenerationController({
  activeProjectId,
  addMessage,
  setCode,
  setFiles,
  getLastValidSnapshot,
  setPendingPlan,
  setLiveSteps,
  resetAgent,
  onStreamingComplete,
  onStreamingError,
  generationLockRef,
  activeJobIdRef,
  pendingSummaryRef,
}: BackgroundGenerationControllerOptions) {
  // Track processed jobs to prevent duplicate message additions
  const processedJobIdsRef = useRef<Set<string>>(new Set());

  // 🔄 RETRY STATE: Track the last failed prompt so users can retry
  const [lastFailedPrompt, setLastFailedPrompt] = useState<string | null>(null);

  // 🔧 GHOST FIXER: Auto-recovery for truncated AI outputs
  const ghostFixer = useGhostFixer({
    maxRetries: 1,
    onFixAttempt: (attempt) => {
      console.log(`[GhostFixer] Generation was interrupted; retrying... (attempt ${attempt}/1)`);
      toast.info('Generation was interrupted; retrying with full regeneration...');
    },
    onFixSuccess: (mergedCode) => {
      console.log('[GhostFixer] ✅ Full regeneration successful');
      toast.success('Code regenerated successfully.', { duration: 6000 });
    },
    onFixFailure: (reason) => {
      console.error('[GhostFixer] ❌ Recovery failed:', reason);
      toast.error(reason, { duration: 8000 });
    }
  });

  const handleJobComplete = useCallback(async (job: GenerationJob) => {
    // Prevent duplicate processing
    if (processedJobIdsRef.current.has(job.id)) {
      console.log('[BackgroundGen] Job already processed, skipping:', job.id);
      return;
    }
    processedJobIdsRef.current.add(job.id);

    // Reject late events from old project IDs
    if (job.project_id !== activeProjectId) {
      console.warn(`🛑 BLOCKED: Job ${job.id} belongs to project ${job.project_id} but active is ${activeProjectId}`);
      return;
    }

    const isActiveRun = activeJobIdRef.current === job.id;
    console.log('[BackgroundGen] Job completed:', job.id, { isActiveRun, status: job.status });

    // TRUNCATION HANDLING: Restore last valid snapshot — never leave broken state
    if (job.status === 'needs_continuation') {
      console.warn('[BackgroundGen] ❌ Job truncated — restoring last valid snapshot');
      
      // ✅ RESTORE FROM LAST VALID SNAPSHOT (not message history)
      const validSnapshot = getLastValidSnapshot();
      if (validSnapshot && Object.keys(validSnapshot).length > 0) {
        console.log('[BackgroundGen] Restoring from lastValidSnapshot:', Object.keys(validSnapshot).length, 'files');
        setFiles(validSnapshot);
      }

      toast.error('Code generation was interrupted. Your project was preserved. Please retry with a simpler request.', { duration: 6000 });
      if (activeProjectId) {
        await addMessage('assistant', '⚠️ Code generation was interrupted. No changes were applied — your project was restored to its last stable state. Please simplify your request or break it into smaller parts.', undefined, activeProjectId);
      }
      if (isActiveRun) {
        setLiveSteps([]);
        pendingSummaryRef.current = '';
        generationLockRef.current = null;
        activeJobIdRef.current = null;
        resetAgent();
      }
      return;
    }

    // SAFETY: Never apply JSON (job status / accidental payload) as code
    const looksLikeJson = (text: string): boolean => {
      const trimmed = (text || '').trim();
      if (!trimmed.startsWith('{')) return false;
      try {
        const parsed = JSON.parse(trimmed);
        return parsed && typeof parsed === 'object' && (
          'jobId' in parsed || 'status' in parsed || 'success' in parsed
        );
      } catch {
        return false;
      }
    };

    // If we have code result, apply it
    if (job.code_result) {
      if (looksLikeJson(job.code_result)) {
        console.error('[BackgroundGen] Refusing to apply JSON as code_result for job:', job.id);
        toast.error('Auto-fix failed: received invalid code payload');
      } else {
        // MULTI-FILE DETECTION: If code_result is a JSON file map, route to setFiles()
        // This prevents raw JSON from being transpiled as TSX by Sandpack.
        const trimmedResult = job.code_result.trim();
        let handledAsMultiFile = false;
        if (trimmedResult.startsWith('{')) {
          try {
            const parsed = JSON.parse(trimmedResult);
            // Handle {"files": {"/App.tsx": "...", ...}} wrapper
            const fileMap = parsed?.files && typeof parsed.files === 'object' ? parsed.files : null;
            // Handle direct file map {"/App.tsx": "...", ...}
            const isDirectFileMap = !fileMap && parsed && typeof parsed === 'object' &&
              Object.keys(parsed).some(k => k.endsWith('.tsx') || k.endsWith('.ts') || k.endsWith('.css'));
            
            if (fileMap && Object.keys(fileMap).length > 0) {
              console.log('[BackgroundGen] code_result is {files:{...}} JSON — routing to setFiles():', Object.keys(fileMap).length, 'files');
              setFiles(fileMap);
              handledAsMultiFile = true;
            } else if (isDirectFileMap) {
              console.log('[BackgroundGen] code_result is direct file map — routing to setFiles():', Object.keys(parsed).length, 'files');
              setFiles(parsed);
              handledAsMultiFile = true;
            }
          } catch {
            // Not valid JSON, fall through to setCode
          }
        }
        if (!handledAsMultiFile) {
          setCode(job.code_result, true);
        }
      }
    } else {
      console.warn('[BackgroundGen] Job completed with no code_result:', job.id);
    }

    // If we have a plan result, show the plan approval card
    if (job.plan_result) {
      setPendingPlan({
        plan: job.plan_result,
        originalPrompt: job.prompt,
      });
    }

    // Add assistant message with the summary
    if (job.summary && activeProjectId) {
      addMessage('assistant', job.summary, job.code_result || undefined, activeProjectId);
    }

    // Clear "building" state for the run that created this job
    if (isActiveRun) {
      setLiveSteps([]);
      pendingSummaryRef.current = '';
      generationLockRef.current = null;
      activeJobIdRef.current = null;
      onStreamingComplete();
      resetAgent();
    }
  }, [activeProjectId, addMessage, onStreamingComplete, resetAgent, setCode, setFiles, getLastValidSnapshot, setPendingPlan, setLiveSteps, generationLockRef, activeJobIdRef, pendingSummaryRef]);

  const handleJobError = useCallback((job: GenerationJob) => {
    console.error('[BackgroundGen] Job failed:', job.error_message);
    
    let userMessage = job.error_message || 'Unknown error';
    try {
      const parsed = JSON.parse(userMessage);
      if (parsed?.message) userMessage = parsed.message;
    } catch { /* not JSON, use as-is */ }

    const isActiveRun = activeJobIdRef.current === job.id;

    // 🔄 RETRY: Capture the failed prompt so users can retry
    const isRetryableError = userMessage.includes('NO_CODE_PRODUCED') || 
      userMessage.includes('CORRUPT_JSON_OUTPUT') ||
      userMessage.includes('did not generate any code') ||
      userMessage.includes('responded conversationally');
    if (isRetryableError && job.prompt) {
      setLastFailedPrompt(job.prompt);
    }

    if (isActiveRun) {
      // ✅ RESTORE FROM LAST VALID SNAPSHOT on any failure
      const validSnapshot = getLastValidSnapshot();
      if (validSnapshot && Object.keys(validSnapshot).length > 0) {
        console.log('[BackgroundGen] Restoring from lastValidSnapshot on error:', Object.keys(validSnapshot).length, 'files');
        setFiles(validSnapshot);
      }

      if (job.status === 'needs_user_action') {
        const msg = job.summary || 'This request may be too complex. Please simplify or break it into smaller parts.';
        toast.error(msg, { duration: 8000 });
        if (activeProjectId) {
          addMessage('assistant', `⚠️ ${msg}\nNo changes were applied — your project was restored to its last stable state.`, undefined, activeProjectId);
        }
      } else {
        toast.error(userMessage, { duration: 6000 });
        if (activeProjectId) {
          const retryHint = isRetryableError ? '\n\nYou can retry this request using the button below.' : '';
          addMessage('assistant', `❌ Generation failed: ${userMessage}\nNo changes were applied — your project was restored to its last stable state.${retryHint}`, undefined, activeProjectId);
        }
      }
      setLiveSteps([]);
      generationLockRef.current = null;
      activeJobIdRef.current = null;
      onStreamingError(job.error_message || 'Generation failed');
    } else {
      console.warn('[BackgroundGen] Stale job error suppressed:', userMessage);
    }
  }, [onStreamingError, activeProjectId, addMessage, setFiles, getLastValidSnapshot, setLiveSteps, generationLockRef, activeJobIdRef]);

  const {
    currentJob,
    hasActiveJob,
    hasCompletedJob,
    isLoading: isLoadingJob,
    createJob,
    cancelJob,
    acknowledgeJob,
  } = useBackgroundGeneration({
    projectId: activeProjectId,
    onJobComplete: handleJobComplete,
    onJobError: handleJobError,
  });

  // RESUME: If a job completes while the user is away
  const processedCompletedJobRef = useRef<string | null>(null);
  
  useEffect(() => {
    if (!hasCompletedJob || !currentJob || isLoadingJob) return;
    if (processedCompletedJobRef.current === currentJob.id) return;
    if (processedJobIdsRef.current.has(currentJob.id)) {
      processedCompletedJobRef.current = currentJob.id;
      acknowledgeJob(currentJob.id);
      return;
    }
    console.log('[BackgroundGen] Found completed job on mount, routing through handler...');
    processedCompletedJobRef.current = currentJob.id;
    handleJobComplete(currentJob);
    acknowledgeJob(currentJob.id);
  }, [hasCompletedJob, currentJob, isLoadingJob, acknowledgeJob, handleJobComplete]);

  // Clear retry state when a new generation starts successfully
  const clearLastFailedPrompt = useCallback(() => {
    setLastFailedPrompt(null);
  }, []);

  return {
    currentJob,
    hasActiveJob,
    hasCompletedJob,
    isLoadingJob,
    createJob,
    cancelJob,
    acknowledgeJob,
    ghostFixer,
    lastFailedPrompt,
    clearLastFailedPrompt,
  };
}
