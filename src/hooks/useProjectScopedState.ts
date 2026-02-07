import { useEffect, useRef, useCallback } from 'react';
import { clearProjectLocalStorage, nukeSandpackCache } from '@/utils/storageNuke';
import { supabase } from '@/integrations/supabase/client';

/**
 * useProjectScopedState
 *
 * Ensures complete state isolation between projects by:
 * 1. Detecting project_id changes and triggering cleanup
 * 2. Providing project-scoped localStorage keys
 * 3. Purging all related cache on project switch
 * 4. Fetching fresh data from database on demand
 */
interface UseProjectScopedStateProps {
  projectId: string | null;
  userId: string | null;
  onProjectChange?: () => void; // Callback to reset component state
}

interface ProjectData {
  code: string | null;
  isBroken: boolean;
  lastSuccessAt: string | null;
}

export function useProjectScopedState({
  projectId,
  userId,
  onProjectChange,
}: UseProjectScopedStateProps) {
  const prevProjectIdRef = useRef<string | null>(null);
  const isInitialMount = useRef(true);
  const suppressNextProjectChangeResetRef = useRef(false);

  // Allow callers (e.g., Magical Doorway) to switch projectId without wiping freshly-set streaming state.
  const suppressNextProjectChangeReset = useCallback(() => {
    suppressNextProjectChangeResetRef.current = true;
  }, []);

  // Detect project changes and trigger cleanup
  useEffect(() => {
    // Skip initial mount to avoid unnecessary cleanup
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevProjectIdRef.current = projectId;
      return;
    }

    // If project changed, perform cleanup
    if (projectId !== prevProjectIdRef.current) {
      const prevId = prevProjectIdRef.current;

      console.log(`[ProjectScope] Project changed: ${prevId} → ${projectId}`);

      // If the caller asked us to suppress the reset, do so exactly once.
      // This is critical for flows that intentionally set state immediately after switching projects.
      if (suppressNextProjectChangeResetRef.current) {
        suppressNextProjectChangeResetRef.current = false;
        prevProjectIdRef.current = projectId;
        return;
      }

      // 1. Clear localStorage for the previous project
      if (prevId) {
        clearProjectLocalStorage(prevId);
      }

      // 2. Trigger parent's state reset callback
      if (onProjectChange) {
        onProjectChange();
      }

      // 3. Update ref to new project
      prevProjectIdRef.current = projectId;
    }
  }, [projectId, onProjectChange]);

  // Generate project-scoped storage key
  const getScopedKey = useCallback(
    (key: string): string => {
      if (!projectId) return `vibecoder:${key}:global`;
      return `vibecoder:${key}:${projectId}`;
    },
    [projectId],
  );

  // Get value from project-scoped storage
  const getProjectData = useCallback(
    <T,>(key: string, defaultValue: T): T => {
      try {
        const scopedKey = getScopedKey(key);
        const stored = localStorage.getItem(scopedKey);
        if (stored) {
          return JSON.parse(stored) as T;
        }
      } catch (e) {
        console.warn(`[ProjectScope] Failed to read ${key}:`, e);
      }
      return defaultValue;
    },
    [getScopedKey],
  );

  // Set value in project-scoped storage
  const setProjectData = useCallback(
    <T,>(key: string, value: T): void => {
      try {
        const scopedKey = getScopedKey(key);
        localStorage.setItem(scopedKey, JSON.stringify(value));
      } catch (e) {
        console.warn(`[ProjectScope] Failed to write ${key}:`, e);
      }
    },
    [getScopedKey],
  );

  // Clear all data for current project
  const clearCurrentProjectData = useCallback(() => {
    if (projectId) {
      clearProjectLocalStorage(projectId);
    }
  }, [projectId]);

  // Nuclear option: clear ALL project caches (useful when deleting projects)
  const nukeAllCaches = useCallback(async () => {
    await nukeSandpackCache();
  }, []);

  // Purge specific project's data (used when deleting)
  const purgeProject = useCallback((targetProjectId: string) => {
    clearProjectLocalStorage(targetProjectId);
    console.log(`[ProjectScope] Purged project: ${targetProjectId}`);
  }, []);

  // Fetch fresh project data from database (escape hatch for stuck UI)
  const refreshFromDatabase = useCallback(async (): Promise<ProjectData | null> => {
    if (!projectId) {
      console.warn('[ProjectScope] Cannot refresh: no active project');
      return null;
    }

    try {
      // Fetch code and project status in parallel
      const [filesResult, projectResult] = await Promise.all([
        supabase
          .from('project_files')
          .select('content')
          .eq('project_id', projectId)
          .eq('file_path', '/App.tsx')
          .maybeSingle(),
        supabase
          .from('vibecoder_projects')
          .select('is_broken, last_success_at')
          .eq('id', projectId)
          .maybeSingle(),
      ]);

      const code = filesResult.data?.content || null;
      const isBroken = projectResult.data?.is_broken ?? false;
      const lastSuccessAt = projectResult.data?.last_success_at || null;

      console.log(`[ProjectScope] Refreshed from DB: isBroken=${isBroken}, hasCode=${!!code}`);

      return { code, isBroken, lastSuccessAt };
    } catch (err) {
      console.error('[ProjectScope] Failed to refresh from database:', err);
      return null;
    }
  }, [projectId]);

  return {
    getScopedKey,
    getProjectData,
    setProjectData,
    clearCurrentProjectData,
    nukeAllCaches,
    purgeProject,
    refreshFromDatabase,
    suppressNextProjectChangeReset,
    currentProjectId: projectId,
  };
}

