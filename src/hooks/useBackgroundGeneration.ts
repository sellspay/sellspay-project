import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface GenerationJob {
  id: string;
  project_id: string;
  user_id: string;
  prompt: string;
  ai_prompt: string | null;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'needs_continuation' | 'needs_user_action' | 'validating' | 'repairing';
  code_result: string | null;
  summary: string | null;
  plan_result: any | null;
  error_message: string | null;
  model_id: string | null;
  is_plan_mode: boolean;
  progress_logs: string[];
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  // Reliability tracking (added v2)
  last_heartbeat_at?: string | null;
  failure_stage?: string | null;
  files_changed_count?: number | null;
}

interface UseBackgroundGenerationOptions {
  projectId: string | null;
  onJobUpdate?: (job: GenerationJob) => void;
  onJobComplete?: (job: GenerationJob) => void;
  onJobError?: (job: GenerationJob) => void;
}

/**
 * Hook to manage background-persistent AI generation jobs.
 * Jobs continue even if user navigates away from the page.
 */
export function useBackgroundGeneration({
  projectId,
  onJobUpdate,
  onJobComplete,
  onJobError,
}: UseBackgroundGenerationOptions) {
  const [currentJob, setCurrentJob] = useState<GenerationJob | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const subscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  
  // Track which jobs we've already processed to prevent duplicates
  const processedJobsRef = useRef<Set<string>>(new Set());
  
  // Store callback refs to avoid subscription re-creation
  const onJobUpdateRef = useRef(onJobUpdate);
  const onJobCompleteRef = useRef(onJobComplete);
  const onJobErrorRef = useRef(onJobError);
  
  // Update refs when callbacks change
  useEffect(() => {
    onJobUpdateRef.current = onJobUpdate;
    onJobCompleteRef.current = onJobComplete;
    onJobErrorRef.current = onJobError;
  }, [onJobUpdate, onJobComplete, onJobError]);

  // Stale job timeout ref
  const staleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Heartbeat-based stale detection: worker writes last_heartbeat_at every ~15s.
  // If we haven't seen one in 60s, the worker is presumed dead.
  const HEARTBEAT_STALE_MS = 60_000;
  // Hard wall-clock ceiling as a backstop (in case heartbeats are also stuck).
  const HARD_TIMEOUT_MS = 300_000; // 5 minutes — safety net only
  // How often the client polls for heartbeat freshness while a job is active.
  const HEARTBEAT_POLL_INTERVAL_MS = 20_000;

  // Subscribe to realtime updates for this project's jobs
  useEffect(() => {
    if (!projectId) {
      setIsLoading(false);
      return;
    }

    // Clear processed jobs when project changes
    processedJobsRef.current.clear();

    // Check for existing job on mount — include recent terminal states so we can clear stuck UI
    const checkExistingJob = async () => {
      try {
        // First: any active job still in the pipeline
        const { data: activeJobs, error } = await supabase
          .from('ai_generation_jobs')
          .select('*')
          .eq('project_id', projectId)
          .in('status', ['pending', 'running', 'validating', 'repairing'])
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) {
          console.error('[BackgroundGen] Error fetching jobs:', error);
          setIsLoading(false);
          return;
        }

        if (activeJobs && activeJobs.length > 0) {
          const job = activeJobs[0] as GenerationJob;
          console.log('[BackgroundGen] Found existing active job:', job.id, job.status);

          // Heartbeat-based staleness check on mount.
          const heartbeatTs = job.last_heartbeat_at ? new Date(job.last_heartbeat_at).getTime() : null;
          const heartbeatAge = heartbeatTs ? Date.now() - heartbeatTs : Infinity;
          const jobAge = Date.now() - new Date(job.created_at).getTime();
          const isHeartbeatStale = heartbeatAge > HEARTBEAT_STALE_MS;
          const isHardTimeout = jobAge > HARD_TIMEOUT_MS;
          if (isHeartbeatStale && (jobAge > HEARTBEAT_STALE_MS || isHardTimeout)) {
            console.warn('[BackgroundGen] Found stale job on mount (heartbeat age:', heartbeatAge, 'ms), force-failing:', job.id);
            await supabase
              .from('ai_generation_jobs')
              .update({ status: 'failed', error_message: 'Generation worker stopped responding', failure_stage: 'generation', completed_at: new Date().toISOString() })
              .eq('id', job.id)
              .eq('status', job.status);
            const failedJob = { ...job, status: 'failed' as const, error_message: 'Generation worker stopped responding', failure_stage: 'generation' };
            setCurrentJob(failedJob);
            onJobErrorRef.current?.(failedJob);
          } else {
            setCurrentJob(job);
            onJobUpdateRef.current?.(job);
          }
          setIsLoading(false);
          return;
        }

        // Second: any RECENT terminal job (last 5 minutes) so the UI can clear stuck "Building..." state
        const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        const { data: recentJobs } = await supabase
          .from('ai_generation_jobs')
          .select('*')
          .eq('project_id', projectId)
          .in('status', ['completed', 'failed', 'needs_user_action'])
          .gte('completed_at', fiveMinAgo)
          .order('completed_at', { ascending: false })
          .limit(1);

        if (recentJobs && recentJobs.length > 0) {
          const job = recentJobs[0] as GenerationJob;
          console.log('[BackgroundGen] Found recent terminal job on mount:', job.id, job.status);
          setCurrentJob(job);
          // Fire the appropriate callback so the UI gets unstuck
          if (job.status === 'completed') {
            onJobUpdateRef.current?.(job);
          } else {
            onJobErrorRef.current?.(job);
          }
        }
      } catch (e) {
        console.error('[BackgroundGen] Error:', e);
      } finally {
        setIsLoading(false);
      }
    };

    checkExistingJob();

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`ai_jobs_${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ai_generation_jobs',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          console.log('[BackgroundGen] Realtime update:', payload.eventType, payload.new);
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const job = payload.new as GenerationJob;
            setCurrentJob(job);
            onJobUpdateRef.current?.(job);

            // Reset stale poll timer on every update (heartbeat or status change)
            if (staleTimerRef.current) clearTimeout(staleTimerRef.current);

            // For active jobs, schedule a heartbeat-freshness poll.
            // Instead of one wall-clock timer, we poll every HEARTBEAT_POLL_INTERVAL_MS and
            // only force-fail if the worker's last_heartbeat_at is older than HEARTBEAT_STALE_MS.
            if (job.status === 'pending' || job.status === 'running' || job.status === 'validating' || job.status === 'repairing') {
              const scheduleHeartbeatPoll = () => {
                staleTimerRef.current = setTimeout(async () => {
                  const { data } = await supabase
                    .from('ai_generation_jobs')
                    .select('*')
                    .eq('id', job.id)
                    .single();
                  if (!data) return;
                  const freshJob = data as GenerationJob;

                  // Job already terminal — let the realtime/dedup path handle it
                  if (freshJob.status === 'completed') {
                    const jobKey = `${freshJob.id}_${freshJob.status}`;
                    if (!processedJobsRef.current.has(jobKey)) {
                      processedJobsRef.current.add(jobKey);
                      setCurrentJob(freshJob);
                      onJobCompleteRef.current?.(freshJob);
                    }
                    return;
                  }
                  if (freshJob.status === 'failed' || freshJob.status === 'needs_user_action' || freshJob.status === 'needs_continuation') {
                    setCurrentJob(freshJob);
                    onJobErrorRef.current?.(freshJob);
                    return;
                  }

                  // Still running — check heartbeat freshness
                  const heartbeatTs = freshJob.last_heartbeat_at ? new Date(freshJob.last_heartbeat_at).getTime() : null;
                  const heartbeatAge = heartbeatTs ? Date.now() - heartbeatTs : Infinity;
                  const jobAge = Date.now() - new Date(freshJob.created_at).getTime();

                  if (heartbeatAge > HEARTBEAT_STALE_MS || jobAge > HARD_TIMEOUT_MS) {
                    console.warn('[BackgroundGen] Worker heartbeat stale (age:', heartbeatAge, 'ms). Attempting resume:', job.id);
                    // Try to resume via the resume edge function before giving up.
                    try {
                      const { data: resumeData, error: resumeErr } = await supabase.functions.invoke('vibecoder-resume', {
                        body: { jobId: job.id },
                      });
                      if (resumeErr) throw resumeErr;
                      if (resumeData?.resumed) {
                        console.log('[BackgroundGen] Resume kicked off (attempt', resumeData.attempt, '/', resumeData.maxAttempts, ')');
                        // Keep polling — worker will update heartbeat shortly
                        scheduleHeartbeatPoll();
                        return;
                      }
                      // Resume declined (max retries) — fall through to failure
                      console.error('[BackgroundGen] Resume declined:', resumeData?.reason);
                    } catch (e) {
                      console.error('[BackgroundGen] Resume call failed:', e);
                    }
                    // Final force-fail (resume exhausted or failed to invoke)
                    await supabase
                      .from('ai_generation_jobs')
                      .update({ status: 'failed', error_message: 'Generation worker stopped responding', failure_stage: 'generation', completed_at: new Date().toISOString() })
                      .eq('id', job.id)
                      .in('status', ['pending', 'running', 'validating', 'repairing']);
                    const failedJob = { ...freshJob, status: 'failed' as const, error_message: 'Generation worker stopped responding', failure_stage: 'generation' };
                    setCurrentJob(failedJob);
                    onJobErrorRef.current?.(failedJob);
                  } else {
                    // Worker still alive — keep polling
                    scheduleHeartbeatPoll();
                  }
                }, HEARTBEAT_POLL_INTERVAL_MS);
              };
              scheduleHeartbeatPoll();
            }

            // Only fire completion/error callbacks ONCE per job
            const jobKey = `${job.id}_${job.status}`;
            if (!processedJobsRef.current.has(jobKey)) {
              if (job.status === 'completed') {
                processedJobsRef.current.add(jobKey);
                onJobCompleteRef.current?.(job);
              } else if (job.status === 'needs_continuation') {
                // Truncated output — treat as failure, do NOT commit partial code
                processedJobsRef.current.add(jobKey);
                onJobErrorRef.current?.({
                  ...job,
                  error_message: job.error_message || JSON.stringify({
                    type: 'MODEL_TRUNCATED',
                    message: 'Generation was cut off mid-response. Try a smaller request or click Retry.',
                  }),
                  failure_stage: job.failure_stage || 'generation',
                });
              } else if (job.status === 'needs_user_action') {
                // Intent check failed — user needs to simplify/clarify
                processedJobsRef.current.add(jobKey);
                onJobErrorRef.current?.(job);
              } else if (job.status === 'failed') {
                processedJobsRef.current.add(jobKey);
                onJobErrorRef.current?.(job);
              }
            }
          }
        }
      )
      .subscribe();

    subscriptionRef.current = channel;

    return () => {
      channel.unsubscribe();
      if (staleTimerRef.current) clearTimeout(staleTimerRef.current);
    };
  }, [projectId]); // Only re-subscribe when projectId changes

  // Create a new generation job
  const createJob = useCallback(async (
    prompt: string,
    aiPrompt?: string,
    modelId?: string,
    isPlanMode?: boolean,
    explicitProjectId?: string
  ): Promise<GenerationJob | null> => {
    const resolvedProjectId = explicitProjectId || projectId;
    if (!resolvedProjectId) {
      toast.error('No project selected');
      return null;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Guest hitting generate — redirect to login instead of silent toast-fail
        toast.info('Sign in to start building');
        const redirectTarget = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `/login?redirect=${redirectTarget}`;
        return null;
      }

      const { data: job, error } = await supabase
        .from('ai_generation_jobs')
        .insert({
          project_id: resolvedProjectId,
          user_id: user.id,
          prompt,
          ai_prompt: aiPrompt || prompt,
          model_id: modelId || 'vibecoder-pro',
          is_plan_mode: isPlanMode || false,
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        console.error('[BackgroundGen] Failed to create job:', error);
        toast.error('Failed to start generation');
        return null;
      }

      console.log('[BackgroundGen] Created job:', job.id);
      setCurrentJob(job as GenerationJob);
      return job as GenerationJob;
    } catch (e) {
      console.error('[BackgroundGen] Error creating job:', e);
      toast.error('Failed to start generation');
      return null;
    }
  }, [projectId]);

  // Cancel an existing job
  const cancelJob = useCallback(async (jobId?: string) => {
    const targetId = jobId || currentJob?.id;
    if (!targetId) return;

    try {
      const { error } = await supabase
        .from('ai_generation_jobs')
        .update({ status: 'cancelled', completed_at: new Date().toISOString() })
        .eq('id', targetId);

      if (error) {
        console.error('[BackgroundGen] Failed to cancel job:', error);
        toast.error('Failed to cancel generation');
        return;
      }

      setCurrentJob(null);
      toast.info('Generation cancelled');
    } catch (e) {
      console.error('[BackgroundGen] Error cancelling job:', e);
    }
  }, [currentJob]);

  // Mark job as acknowledged/cleared (user has seen the result)
  const acknowledgeJob = useCallback(async (jobId?: string) => {
    const targetId = jobId || currentJob?.id;
    if (!targetId) return;

    // Just clear local state - the job stays in DB for history
    setCurrentJob(null);
  }, [currentJob]);

  // Check if there's an active job anywhere in the generation pipeline
  const hasActiveJob = currentJob?.status === 'pending' || currentJob?.status === 'running' || currentJob?.status === 'validating' || currentJob?.status === 'repairing';

  // Check if there's a completed job waiting to be acknowledged
  const hasCompletedJob = currentJob?.status === 'completed';
  const hasFailedJob = currentJob?.status === 'failed';

  return {
    currentJob,
    hasActiveJob,
    hasCompletedJob,
    hasFailedJob,
    isLoading,
    createJob,
    cancelJob,
    acknowledgeJob,
  };
}
