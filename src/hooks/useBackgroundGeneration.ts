import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface GenerationJob {
  id: string;
  project_id: string;
  user_id: string;
  prompt: string;
  ai_prompt: string | null;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
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

  // Subscribe to realtime updates for this project's jobs
  useEffect(() => {
    if (!projectId) {
      setIsLoading(false);
      return;
    }

    // Check for existing pending/running job on mount
    const checkExistingJob = async () => {
      try {
        const { data: jobs, error } = await supabase
          .from('ai_generation_jobs')
          .select('*')
          .eq('project_id', projectId)
          .in('status', ['pending', 'running'])
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) {
          console.error('[BackgroundGen] Error fetching jobs:', error);
          setIsLoading(false);
          return;
        }

        if (jobs && jobs.length > 0) {
          const job = jobs[0] as GenerationJob;
          console.log('[BackgroundGen] Found existing job:', job.id, job.status);
          setCurrentJob(job);
          onJobUpdate?.(job);
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
            onJobUpdate?.(job);

            if (job.status === 'completed') {
              onJobComplete?.(job);
            } else if (job.status === 'failed') {
              onJobError?.(job);
            }
          }
        }
      )
      .subscribe();

    subscriptionRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [projectId, onJobUpdate, onJobComplete, onJobError]);

  // Create a new generation job
  const createJob = useCallback(async (
    prompt: string,
    aiPrompt?: string,
    modelId?: string,
    isPlanMode?: boolean
  ): Promise<GenerationJob | null> => {
    if (!projectId) {
      toast.error('No project selected');
      return null;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to continue');
        return null;
      }

      const { data: job, error } = await supabase
        .from('ai_generation_jobs')
        .insert({
          project_id: projectId,
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

  // Check if there's an active (pending/running) job
  const hasActiveJob = currentJob?.status === 'pending' || currentJob?.status === 'running';

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
