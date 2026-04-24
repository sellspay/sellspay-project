import { useState, useCallback, useRef, useEffect } from 'react';
import { useBackgroundGeneration, type GenerationJob } from '@/hooks/useBackgroundGeneration';
import { useGhostFixer } from '@/hooks/useGhostFixer';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { AIModel } from '../ChatInputBar';
import { validateAllFiles, validatePathIsolation } from '../transpileValidator';

interface BackgroundGenerationControllerOptions {
  activeProjectId: string | null;
  addMessage: (role: string, content: string, codeSnapshot?: string, projectId?: string) => Promise<any>;
  setFiles: (files: Record<string, string>) => void;
  setPendingPlan: (plan: { plan: any; originalPrompt: string } | null) => void;
  setLiveSteps: (steps: string[]) => void;
  resetAgent: () => void;
  onStreamingComplete: () => void;
  onStreamingError: (error: string) => void;
  generationLockRef: React.MutableRefObject<string | null>;
  activeJobIdRef: React.MutableRefObject<string | null>;
  pendingSummaryRef: React.MutableRefObject<string>;
  hasDbSnapshotRef: React.MutableRefObject<boolean>;
}

export function useBackgroundGenerationController({
  activeProjectId,
  addMessage,
  setFiles,
  setPendingPlan,
  setLiveSteps,
  resetAgent,
  onStreamingComplete,
  onStreamingError,
  generationLockRef,
  activeJobIdRef,
  pendingSummaryRef,
  hasDbSnapshotRef,
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

    // ─── Abort helper: clean up generation state without mutating sandbox ───
    // Optional: show the AI's summary in chat and enable retry button
    // CRITICAL: Also issues a credit refund when the frontend blocks a valid backend job
    const abortGeneration = async (opts?: { showSummary?: boolean; enableRetry?: boolean; errorDetail?: string; refundReason?: string }) => {
      // 💰 AUTO-REFUND: If the backend charged credits but frontend rejected the output,
      // call the refund endpoint so users don't lose money
      if (opts?.refundReason && job.id) {
        try {
          console.log(`[ZERO-TRUST] Requesting credit refund for job ${job.id}: ${opts.refundReason}`);
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData?.session?.access_token) {
            const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
            const resp = await fetch(
              `https://${projectId}.supabase.co/functions/v1/refund-credits`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${sessionData.session.access_token}`,
                },
                body: JSON.stringify({ jobId: job.id, reason: opts.refundReason }),
              }
            );
            const result = await resp.json();
            if (result.success) {
              console.log(`[ZERO-TRUST] ✅ Refunded ${result.refunded} credits`);
              toast.info(`${result.refunded} credits refunded — validation blocked this build.`);
            } else {
              console.warn('[ZERO-TRUST] Refund call failed:', result.error);
            }
          }
        } catch (refundErr) {
          console.error('[ZERO-TRUST] Refund request exception:', refundErr);
        }
      }
      if (isActiveRun) {
        // Show AI summary + error context in chat so the user sees a reply
        if (opts?.showSummary && activeProjectId) {
          const summaryText = job.summary || '';
          const errorInfo = opts.errorDetail 
            ? `\n\n⚠️ **Build blocked:** ${opts.errorDetail}` 
            : '';
          const retryHint = opts.enableRetry 
            ? '\n\nNo changes were applied — your project is safe. Use the retry button below to try again.' 
            : '\nNo changes were applied — your project remains in its last stable state.';
          const fullMessage = summaryText 
            ? `${summaryText}${errorInfo}${retryHint}` 
            : `❌ Generation failed.${errorInfo}${retryHint}`;
          await addMessage('assistant', fullMessage, undefined, activeProjectId);
        }
        // Enable retry button
        if (opts?.enableRetry && job.prompt) {
          setLastFailedPrompt(job.prompt);
        }
        setLiveSteps([]);
        pendingSummaryRef.current = '';
        generationLockRef.current = null;
        activeJobIdRef.current = null;
        resetAgent();
      }
    };

    // TRUNCATION HANDLING: No sandbox mutation — just abort cleanly
    if (job.status === 'needs_continuation') {
      console.warn('[BackgroundGen] ❌ Job truncated — aborting without sandbox mutation');
      toast.error('Code generation was interrupted. Your project was preserved. Please retry with a simpler request.', { duration: 6000 });
      if (activeProjectId) {
        await addMessage('assistant', '⚠️ Code generation was interrupted. No changes were applied — your project remains in its last stable state. Please simplify your request or break it into smaller parts.', undefined, activeProjectId);
      }
      if (job.prompt) setLastFailedPrompt(job.prompt);
      await abortGeneration();
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

    // ═══════════════════════════════════════════════════════
    // ZERO-TRUST COMMIT GATE: Pure validation + atomic commit
    // Failure = abort only (no sandbox mutation, no snapshot restore)
    // Success = setFiles → persist to DB → flip snapshot ref
    // ═══════════════════════════════════════════════════════
    if (job.code_result) {
      const trimmedResult = job.code_result.trim();
      
      // LAYER 1: Must be a non-empty string that starts with {
      if (!trimmedResult.startsWith('{')) {
        console.error('[ZERO-TRUST] code_result is not JSON. Refusing to commit:', job.id);
        toast.error('Generation produced invalid output. Please retry.');
        await abortGeneration({ showSummary: true, enableRetry: true, errorDetail: 'The AI returned non-code output that could not be committed.', refundReason: 'not_json' });
        return;
      }
      
      // LAYER 2: Must parse as JSON
      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(trimmedResult);
      } catch {
        console.error('[ZERO-TRUST] code_result JSON parse failed. Refusing to commit:', job.id);
        toast.error('Generation produced corrupt output. Please retry.');
        await abortGeneration({ showSummary: true, enableRetry: true, errorDetail: 'The AI produced corrupt JSON output.', refundReason: 'json_parse_failed' });
        return;
      }
      
      // LAYER 3: Must be a valid file map
      // Accepts: {files:{...}}, {files:[{path,content}]}, or direct {"/App.tsx": "..."}
      const fileMap: Record<string, string> | null = (() => {
        if (parsed.files && typeof parsed.files === 'object') {
          // Array format: [{path, content}, ...]
          if (Array.isArray(parsed.files)) {
            const map: Record<string, string> = {};
            for (const entry of parsed.files as Array<{path?: string; content?: string}>) {
              if (entry && typeof entry.path === 'string' && typeof entry.content === 'string') {
                map[entry.path] = entry.content;
              }
            }
            return Object.keys(map).length > 0 ? map : null;
          }
          // Object format: {"/path.tsx": "content", ...}
          return parsed.files as Record<string, string>;
        }
        const keys = Object.keys(parsed);
        if (keys.length > 0 && keys.some(k => k.endsWith('.tsx') || k.endsWith('.ts') || k.endsWith('.css'))) {
          return parsed as unknown as Record<string, string>;
        }
        return null;
      })();
      
      if (!fileMap || Object.keys(fileMap).length === 0) {
        console.error('[ZERO-TRUST] code_result is not a valid file map. Refusing to commit:', job.id);
        toast.error('Generation produced invalid file structure. Please retry.');
        await abortGeneration({ showSummary: true, enableRetry: true, errorDetail: 'The AI returned an invalid file structure.', refundReason: 'invalid_file_map' });
        return;
      }
      
      // LAYER 4: All values must be strings (no object injection)
      const allStrings = Object.entries(fileMap).every(([, v]) => typeof v === 'string');
      if (!allStrings) {
        console.error('[ZERO-TRUST] File map contains non-string values. Refusing to commit:', job.id);
        toast.error('Generation produced invalid file contents. Please retry.');
        await abortGeneration({ showSummary: true, enableRetry: true, errorDetail: 'File contents contained invalid data.', refundReason: 'non_string_values' });
        return;
      }
      
      // LAYER 4.5: Path normalization — ensure all paths start with /
      // Prevents duplicate keys (e.g. "storefront/Hero.tsx" vs "/storefront/Hero.tsx")
      const normalizedFileMap: Record<string, string> = {};
      for (const [path, content] of Object.entries(fileMap)) {
        const normalizedPath = path.startsWith('/') ? path : `/${path}`;
        normalizedFileMap[normalizedPath] = content;
      }
      // Replace fileMap reference for all subsequent layers
      const validatedFileMap = normalizedFileMap;
      console.log(`[ZERO-TRUST] Path normalization: ${Object.keys(fileMap).length} → ${Object.keys(validatedFileMap).length} files`);

      // LAYER 4.6: Empty file maps are never a successful build.
      // Treat them as failures so users get a retry path instead of a false success state.
      if (Object.keys(validatedFileMap).length === 0 && !job.plan_result) {
        console.error('[ZERO-TRUST] Empty file map. Refusing to commit:', job.id);
        toast.error('Generation finished without producing any files. Please retry.');
        await abortGeneration({
          showSummary: true,
          enableRetry: true,
          errorDetail: 'The AI finished without returning any files to apply.',
          refundReason: 'empty_file_map',
        });
        return;
      }

      // LAYER 5: No conversational text in code files
      const forbiddenStarts = ['Alright', 'Got it!', 'Sure!', "Here's", "Let's", '=== ANALYSIS', '=== PLAN', '=== SUMMARY'];
      let hasConversational = false;
      for (const [path, content] of Object.entries(validatedFileMap)) {
        if ((path.endsWith('.tsx') || path.endsWith('.ts')) && typeof content === 'string') {
          const trimmedContent = content.trim();
          const isConversational = forbiddenStarts.some(s => trimmedContent.startsWith(s));
          const hasCodeIndicators = /export|import|function|const|return|<\w+/.test(trimmedContent);
          if (isConversational || !hasCodeIndicators) {
            console.error(`[ZERO-TRUST] File ${path} contains conversational text. Refusing to commit.`);
            toast.error('Generation produced non-code output. Please retry.');
            hasConversational = true;
            break;
          }
        }
      }
      if (hasConversational) {
        await abortGeneration({ showSummary: true, enableRetry: true, errorDetail: 'The AI produced conversational text instead of code.', refundReason: 'conversational_text' });
        return;
      }
      
      // LAYER 6: Transpile validation — reject if any file has syntax errors
      const transpileResult = validateAllFiles(validatedFileMap);
      if (!transpileResult.valid) {
        const errorSummary = transpileResult.errors.map(e => `${e.file}: ${e.error}`).join(' | ');
        console.error('[ZERO-TRUST] Transpile validation failed. Refusing to commit:', errorSummary);
        toast.error('Generation produced code with syntax errors. Please retry.');
        await abortGeneration({ showSummary: true, enableRetry: true, errorDetail: `Syntax errors detected: ${errorSummary}`, refundReason: 'syntax_errors' });
        return;
      }

      // LAYER 7: Path Isolation Guard — reject if files target restricted folders
      // Legacy mode: allow old paths if existing project has files outside /storefront/
      const existingPaths = Object.keys(validatedFileMap);
      const hasLegacyPaths = existingPaths.some(
        p => !p.startsWith('/storefront/') && p !== '/App.tsx'
          && !p.startsWith('/core/') && !p.startsWith('/checkout/')
          && !p.startsWith('/auth/') && !p.startsWith('/payments/')
          && !p.startsWith('/settings/') && !p.startsWith('/admin/')
      );
      const pathResult = validatePathIsolation(validatedFileMap, hasLegacyPaths);
      if (!pathResult.valid) {
        const errorSummary = pathResult.errors.map(e => `${e.file}: ${e.error}`).join(' | ');
        console.error('[ZERO-TRUST] Path isolation failed. Refusing to commit:', errorSummary);
        toast.error('Generation attempted to modify restricted files. Please retry.');
        await abortGeneration({ showSummary: true, enableRetry: true, errorDetail: 'The AI attempted to modify restricted files.', refundReason: 'path_isolation' });
        return;
      }

      // ✅ ALL 7 LAYERS PASSED — atomic commit sequence
      console.log('[ZERO-TRUST] All layers passed (including path isolation). Committing', Object.keys(validatedFileMap).length, 'files for job:', job.id);

      // DELTA MERGE: If the model returned only changed files (no /App.tsx),
      // merge with existing DB snapshot to preserve unchanged files.
      let mergedFileMap = validatedFileMap;
      if (activeProjectId && !validatedFileMap['/App.tsx']) {
        try {
          const { data: projectData } = await supabase
            .from('vibecoder_projects')
            .select('last_valid_files')
            .eq('id', activeProjectId)
            .maybeSingle();
          
          if (projectData?.last_valid_files && typeof projectData.last_valid_files === 'object') {
            const existingFiles = projectData.last_valid_files as Record<string, string>;
            // Normalize existing file paths too before merging
            const normalizedExisting: Record<string, string> = {};
            for (const [p, c] of Object.entries(existingFiles)) {
              if (typeof c === 'string') {
                normalizedExisting[p.startsWith('/') ? p : `/${p}`] = c;
              }
            }
            mergedFileMap = { ...normalizedExisting, ...validatedFileMap };
            console.log(`[ZERO-TRUST] Delta merge: ${Object.keys(validatedFileMap).length} changed + ${Object.keys(normalizedExisting).length} existing → ${Object.keys(mergedFileMap).length} total`);
          }
        } catch (mergeErr) {
          console.warn('[ZERO-TRUST] Delta merge fetch failed, using raw fileMap:', mergeErr);
        }
      }

      // ATOMIC COMMIT: DB first, then sandbox, then ref
      // If DB fails, no UI mutation occurs — prevents refresh inconsistency
      if (activeProjectId) {
        try {
          const { error } = await supabase
            .from('vibecoder_projects')
            .update({ last_valid_files: mergedFileMap as any })
            .eq('id', activeProjectId);
          if (error) {
            console.error('[ZERO-TRUST] DB persistence failed. Aborting commit:', error.message);
            toast.error('Failed to persist changes. Please retry.');
            await abortGeneration({ enableRetry: true });
            return;
          }
        } catch (e) {
          console.error('[ZERO-TRUST] DB persistence exception. Aborting commit:', e);
            toast.error('Failed to persist changes. Please retry.');
            await abortGeneration({ enableRetry: true });
            return;
        }
      }

      // DB succeeded — safe to mutate sandbox
      setFiles(mergedFileMap);
      hasDbSnapshotRef.current = true;
      console.log('[ZERO-TRUST] ✅ Commit + persistence successful');
    } else if (!job.plan_result) {
      console.error('[BackgroundGen] Job completed without validated code_result. Treating as failed:', job.id);
      toast.error('Build finished without validated files. Please retry.');
      await abortGeneration({
        showSummary: true,
        enableRetry: true,
        errorDetail: 'The backend marked the run complete, but no validated files were produced.',
        refundReason: 'missing_validated_code_result',
      });
      return;
    } else {
      console.warn('[BackgroundGen] Plan job completed with no code_result:', job.id);
    }

    // If we have a plan result, show the plan approval card
    if (job.plan_result) {
      setPendingPlan({
        plan: job.plan_result,
        originalPrompt: job.prompt,
      });
    }

    // Add assistant message with a rich summary of what changed
    if (activeProjectId) {
      const fileCount = (typeof job.files_changed_count === 'number')
        ? job.files_changed_count
        : (job.code_result ? (() => {
            try {
              const parsed = JSON.parse(job.code_result);
              const files = parsed?.files;
              if (Array.isArray(files)) return files.length;
              if (files && typeof files === 'object') return Object.keys(files).length;
              return 0;
            } catch { return 0; }
          })() : 0);

      const header = fileCount > 0
        ? `✅ **Changes applied** — updated ${fileCount} file${fileCount === 1 ? '' : 's'}`
        : `⚠️ **Build completed but no files were modified**`;
      const body = job.summary?.trim() || 'No detailed summary was provided by the model.';
      const zeroChangeNote = fileCount === 0
        ? '\n\n*Your request may have been understood as a no-op. Try rephrasing more specifically.*'
        : '';
      const fullMessage = `${header}\n\n${body}${zeroChangeNote}`;
      addMessage('assistant', fullMessage, job.code_result || undefined, activeProjectId);
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
  }, [activeProjectId, addMessage, onStreamingComplete, resetAgent, setFiles, setPendingPlan, setLiveSteps, generationLockRef, activeJobIdRef, pendingSummaryRef]);

  const handleJobError = useCallback((job: GenerationJob) => {
    console.error('[BackgroundGen] Job failed:', job.error_message);

    let userMessage = job.error_message || 'Unknown error';
    let errorType = '';
    try {
      const parsed = JSON.parse(userMessage);
      if (parsed?.type) errorType = parsed.type;
      if (parsed?.message) userMessage = parsed.message;
    } catch { /* not JSON, use as-is */ }

    const isActiveRun = activeJobIdRef.current === job.id;

    const extractFailureDetail = (message: string) => {
      const compileMatch = message.match(/Code has syntax errors:\s*(.+)$/i);
      if (compileMatch?.[1]) return compileMatch[1].trim();
      return message.trim();
    };

    const failureDetail = extractFailureDetail(userMessage);

    // 🔄 RETRY: Preserve the failed prompt for any failed generation that can safely be retried.
    // We do this unconditionally for failed/continuation errors because some malformed-output
    // paths lose the explicit classifier even though retrying the same prompt is valid.
    const combinedCheck = `${errorType} ${userMessage}`;
    const isRetryableError = combinedCheck.includes('NO_CODE_PRODUCED') ||
      combinedCheck.includes('CORRUPT_JSON_OUTPUT') ||
      combinedCheck.includes('did not generate any code') ||
      combinedCheck.includes('responded conversationally') ||
      combinedCheck.includes('COMPILE_FAILURE') ||
      combinedCheck.includes('EDGE_TIMEOUT') ||
      combinedCheck.includes('CODE_TOO_SHORT') ||
      combinedCheck.includes('MODEL_EMPTY_RESPONSE') ||
      combinedCheck.includes('MODEL_TRUNCATED') ||
      combinedCheck.includes('MISSING_EXPORT_DEFAULT') ||
      job.status === 'failed' ||
      job.status === 'needs_continuation';

    if (job.prompt && job.status !== 'needs_user_action') {
      setLastFailedPrompt(job.prompt);
    }

    const buildFailureMessage = () => {
      if (job.status === 'needs_user_action') {
        return job.summary || 'This request may be too complex. Please simplify or break it into smaller parts.';
      }

      let friendlyReason = userMessage;
      let detailLine = '';

      if (combinedCheck.includes('COMPILE_FAILURE') || combinedCheck.includes('Unclosed JSX') || combinedCheck.includes('Unexpected closing JSX tag')) {
        friendlyReason = 'The AI generated invalid JSX and the safety validator rejected the build.';
        detailLine = failureDetail ? `\n\n**Validator details:** ${failureDetail}` : '';
      } else if (combinedCheck.includes('EDGE_TIMEOUT')) {
        friendlyReason = 'The generation took too long and timed out. Try a smaller change or retry.';
      } else if (combinedCheck.includes('CORRUPT_JSON_OUTPUT') || combinedCheck.includes('NO_CODE_PRODUCED')) {
        friendlyReason = 'The AI returned malformed output. Retrying with the same prompt usually works.';
      } else if (combinedCheck.includes('MODEL_TRUNCATED')) {
        friendlyReason = 'The response was cut off mid-generation. Try breaking the request into smaller steps.';
      } else if (combinedCheck.includes('worker stopped responding')) {
        friendlyReason = 'The generation worker stopped responding. This usually means the request was too complex or the server was overloaded. Click retry.';
      }

      const stageLabel = job.failure_stage
        ? ` *(stage: ${job.failure_stage})*`
        : '';
      const retryHint = isRetryableError ? '\n\n👉 Use the **Retry Build** button below to try again.' : '';

      return `❌ **Generation failed**${stageLabel}\n\n${friendlyReason}${detailLine}\n\n*No changes were applied — your project is in its last stable state.*${retryHint}`;
    };

    const chatMessage = buildFailureMessage();
    const toastMessage = job.status === 'needs_user_action'
      ? (job.summary || 'This request may be too complex. Please simplify or break it into smaller parts.')
      : combinedCheck.includes('COMPILE_FAILURE') || combinedCheck.includes('Unclosed JSX') || combinedCheck.includes('Unexpected closing JSX tag')
      ? `Build rejected during ${job.failure_stage || 'validation'}: ${failureDetail}`
      : userMessage;

    if (isActiveRun) {
      // No sandbox mutation on error — last committed state is still intact
      toast.error(toastMessage, { duration: 8000 });
      if (activeProjectId) {
        addMessage('assistant', chatMessage, undefined, activeProjectId);
      }
      setLiveSteps([]);
      generationLockRef.current = null;
      activeJobIdRef.current = null;
      onStreamingError(job.error_message || 'Generation failed');
    } else {
      // Stale or out-of-band failure (e.g. user tabbed back after job already failed).
      // We MUST still reset the streaming UI so it doesn't hang on "Building..." forever.
      console.warn('[BackgroundGen] Out-of-band job failure — resetting UI state:', userMessage);
      setLiveSteps([]);
      generationLockRef.current = null;
      activeJobIdRef.current = null;
      onStreamingError(job.error_message || 'Generation failed');
      toast.error(`Previous generation failed: ${toastMessage.slice(0, 180)}`, { duration: 7000 });
    }
  }, [onStreamingError, activeProjectId, addMessage, setLiveSteps, generationLockRef, activeJobIdRef]);

  const {
    currentJob,
    hasActiveJob,
    hasCompletedJob,
    hasFailedJob,
    isLoading: isLoadingJob,
    createJob,
    cancelJob,
    acknowledgeJob,
  } = useBackgroundGeneration({
    projectId: activeProjectId,
    onJobUpdate: (job) => {
      // 🔴 LIVE MILESTONES: Mirror the worker's progress_logs into the chat
      // thought stream so the user sees real-time stage updates ("Analyzing…",
      // "Generating code…", "Validating…", "Repairing syntax…", etc.) instead
      // of a frozen "Working..." indicator while the edge function runs.
      if (job.status === 'running' || job.status === 'pending' || job.status === 'validating' || job.status === 'repairing') {
        if (Array.isArray(job.progress_logs) && job.progress_logs.length > 0) {
          setLiveSteps(job.progress_logs);
        }
      }
    },
    onJobComplete: handleJobComplete,
    onJobError: handleJobError,
  });

  useEffect(() => {
    if (!hasFailedJob || !currentJob?.prompt || lastFailedPrompt) return;
    setLastFailedPrompt(currentJob.prompt);
  }, [currentJob, hasFailedJob, lastFailedPrompt]);

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

  // RESUME: If a job FAILED while the user was away — reset stuck "Building..." UI
  const processedFailedJobRef = useRef<string | null>(null);
  
  useEffect(() => {
    if (!hasFailedJob || !currentJob || isLoadingJob) return;
    if (processedFailedJobRef.current === currentJob.id) return;
    if (processedJobIdsRef.current.has(currentJob.id)) {
      processedFailedJobRef.current = currentJob.id;
      acknowledgeJob(currentJob.id);
      return;
    }
    console.log('[BackgroundGen] Found failed job on mount, routing through error handler...');
    processedFailedJobRef.current = currentJob.id;
    handleJobError(currentJob);
    acknowledgeJob(currentJob.id);
  }, [hasFailedJob, currentJob, isLoadingJob, acknowledgeJob, handleJobError]);

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
