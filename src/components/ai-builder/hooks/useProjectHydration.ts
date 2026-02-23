import { useState, useCallback, useRef, useLayoutEffect, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { nukeSandpackCache, clearProjectLocalStorage } from '@/utils/storageNuke';
import { toast } from 'sonner';

interface UseProjectHydrationOptions {
  activeProjectId: string | null;
  messagesLoading: boolean;
  isStreaming: boolean;

  // Code management
  getLastCodeSnapshot: () => string | null;
  getLastFilesSnapshot: () => Record<string, string> | null;
  setCode: (code: string, skipGuards?: boolean) => void;
  setFiles: (files: Record<string, string>) => void;
  resetCode: () => void;

  // Stream/agent management
  cancelStream: () => void;
  cancelAgent: () => void;
  forceResetStreaming: () => void;
  mountAgentProject: (id: string) => void;
  unmountAgentProject: () => void;
  resetAgent: () => void;

  // Creative studio
  clearAssets: () => void;

  // Refs from parent
  generationLockRef: React.MutableRefObject<string | null>;
  activeJobIdRef: React.MutableRefObject<string | null>;
  pendingSummaryRef: React.MutableRefObject<string>;

  // Parent state reset callbacks
  onResetTransientState: () => void;
  onIncrementResetKey: () => void;
  onIncrementRefreshKey: () => void;
}

/**
 * Manages project switching orchestration and code restoration from message history.
 * Extracted from AIBuilderCanvas to isolate the hook tree and stabilize render order.
 * 
 * Owns:
 * - Scorched earth orchestrator (project switch cleanup)
 * - Code restoration from messages (single-file + multi-file)
 * - Content gate (contentProjectId)
 * - Project verification state (isVerifyingProject)
 */
export function useProjectHydration({
  activeProjectId,
  messagesLoading,
  isStreaming,
  getLastCodeSnapshot,
  getLastFilesSnapshot,
  setCode,
  setFiles,
  resetCode,
  cancelStream,
  cancelAgent,
  forceResetStreaming,
  mountAgentProject,
  unmountAgentProject,
  resetAgent,
  clearAssets,
  generationLockRef,
  activeJobIdRef,
  pendingSummaryRef,
  onResetTransientState,
  onIncrementResetKey,
  onIncrementRefreshKey,
}: UseProjectHydrationOptions) {
  // CONTENT GATE: Which project has its code/chat fully mounted into the workspace.
  const [contentProjectId, setContentProjectId] = useState<string | null>(null);

  // STRICT LOADING: Verify project exists before rendering preview
  const [isVerifyingProject, setIsVerifyingProject] = useState(false);

  // NOTE: isWaitingForPreviewMount removed — preview is now purely files-driven.
  // Preview renders whenever files exist. No handshake needed.

  // Expose abortController ref for cleanup
  const abortControllerRef = useRef<AbortController | null>(null);

  const previousProjectIdRef = useRef<string | null>(null);

  // Tracks which project is currently being loaded by the orchestrator
  const loadingProjectRef = useRef<string | null>(null);

  // Tracks which project has had code restored
  const hasRestoredCodeRef = useRef<string | null>(null);

  // Memoize stable references to avoid re-runs
  const getLastCodeSnapshotRef = useRef(getLastCodeSnapshot);
  getLastCodeSnapshotRef.current = getLastCodeSnapshot;

  // ✅ STEP 1: Unified cleanup gate — runs on every project switch and unmount.
  const cleanupProjectRuntime = useCallback(() => {
    // 1. Abort any active SSE stream
    try { abortControllerRef.current?.abort(); } catch {}

    // 2. Cancel streaming + agent state
    cancelStream();
    cancelAgent();
    forceResetStreaming();

    // 3. Release generation lock
    generationLockRef.current = null;
    activeJobIdRef.current = null;

    // 4. Reset transient UI state (delegated to parent)
    onResetTransientState();
    pendingSummaryRef.current = '';
  }, [cancelStream, cancelAgent, forceResetStreaming, generationLockRef, activeJobIdRef, pendingSummaryRef, onResetTransientState]);

  // =============== SCORCHED EARTH ORCHESTRATOR ===============
  useLayoutEffect(() => {
    let isMounted = true;

    // Skip if project ID hasn't actually changed
    if (previousProjectIdRef.current === activeProjectId && previousProjectIdRef.current !== null) {
      return;
    }

    // 🚨 CRITICAL: These MUST run SYNCHRONOUSLY
    setContentProjectId(null);
    setIsVerifyingProject(true);
    loadingProjectRef.current = activeProjectId;

    // ✅ STEP 1: Run the unified cleanup gate
    cleanupProjectRuntime();
    unmountAgentProject();

    async function loadRoute() {
      // 2. DETECT PROJECT SWITCH
      const isProjectSwitch = previousProjectIdRef.current !== null &&
                               previousProjectIdRef.current !== activeProjectId;

      if (isProjectSwitch) {
        console.log(`🔄 Project switch detected: ${previousProjectIdRef.current} → ${activeProjectId}`);
        if (previousProjectIdRef.current) {
          clearProjectLocalStorage(previousProjectIdRef.current);
        }
        await nukeSandpackCache();
      }

      previousProjectIdRef.current = activeProjectId;

      // 3. NO PROJECT: Show Hero screen with blank slate
      if (!activeProjectId) {
        setContentProjectId(null);
        resetCode();
        onIncrementResetKey();
        onIncrementRefreshKey();
        onResetTransientState();
        resetAgent();
        clearAssets();
        setIsVerifyingProject(false);
        return;
      }

      setIsVerifyingProject(true);
      console.log(`🚀 Loading fresh context for: ${activeProjectId}`);

      // 4. FETCH SOURCE OF TRUTH FROM DB (including last_valid_files for stable snapshot)
      const { data, error } = await supabase
        .from('vibecoder_projects')
        .select('id, last_valid_files')
        .eq('id', activeProjectId)
        .maybeSingle();

      if (!isMounted) return;

      if (error || !data) {
        // === ZOMBIE DETECTED! ===
        console.warn('[ProjectHydration] Zombie project detected. Performing scorched earth reset.');
        await nukeSandpackCache();
        resetCode();
        onIncrementResetKey();
        onIncrementRefreshKey();
        onResetTransientState();
        resetAgent();
        clearAssets();
        toast.info('Previous project was deleted. Starting fresh.');
      } else {
        // Project verified
        console.log("✅ DB Data received. Mounting.");
        mountAgentProject(activeProjectId);
        onResetTransientState();
      }

      setIsVerifyingProject(false);
      loadingProjectRef.current = null;
    }

    loadRoute();

    return () => {
      isMounted = false;
      unmountAgentProject();
    };
  // CRITICAL: Only depend on activeProjectId
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProjectId]);

  // =============== CODE RESTORATION FROM MESSAGES ===============
  // Track the DB-fetched last_valid_files for use during restoration
  const dbLastValidFilesRef = useRef<Record<string, string> | null>(null);
  const [dbSnapshotReady, setDbSnapshotReady] = useState(false);

  // Fetch stable snapshot from DB when project is verified
  useEffect(() => {
    if (!activeProjectId) {
      dbLastValidFilesRef.current = null;
      setDbSnapshotReady(true); // No project = ready (nothing to fetch)
      return;
    }
    if (isVerifyingProject) {
      setDbSnapshotReady(false);
      return;
    }
    
    let cancelled = false;
    setDbSnapshotReady(false);
    
    const fetchStableSnapshot = async () => {
      const { data } = await supabase
        .from('vibecoder_projects')
        .select('last_valid_files')
        .eq('id', activeProjectId)
        .maybeSingle();
      if (cancelled) return;
      if (data?.last_valid_files && typeof data.last_valid_files === 'object') {
        dbLastValidFilesRef.current = data.last_valid_files as Record<string, string>;
      } else {
        dbLastValidFilesRef.current = null;
      }
      setDbSnapshotReady(true);
    };
    fetchStableSnapshot();
    
    return () => { cancelled = true; };
  }, [activeProjectId, isVerifyingProject]);

  useEffect(() => {
    if (loadingProjectRef.current === activeProjectId) return;
    if (isVerifyingProject) return;
    if (!dbSnapshotReady) return; // Wait for DB snapshot query to complete
    if (messagesLoading) return;
    if (!activeProjectId) return;
    if (hasRestoredCodeRef.current === activeProjectId) return;
    if (isStreaming) return;

    // ✅ PRIORITY 1: Restore from DB-persisted stable snapshot (survives refresh)
    const dbSnapshot = dbLastValidFilesRef.current;
    if (dbSnapshot && Object.keys(dbSnapshot).length > 0) {
      console.log('📦 Restoring from DB last_valid_files for project:', activeProjectId, `(${Object.keys(dbSnapshot).length} files)`);
      setFiles(dbSnapshot);
      hasRestoredCodeRef.current = activeProjectId;
    console.log('🚪 Opening content gate for project:', activeProjectId);
      setContentProjectId(activeProjectId);
      onIncrementRefreshKey();
      return;
    }

    // ✅ PRIORITY 2: Fall back to message history
    // Restore multi-file projects first, fall back to single-file
    const lastFilesSnapshot = getLastFilesSnapshot();
    if (lastFilesSnapshot && Object.keys(lastFilesSnapshot).length > 0) {
      console.log('📦 Restoring multi-file project from message history for project:', activeProjectId, `(${Object.keys(lastFilesSnapshot).length} files)`);
      setFiles(lastFilesSnapshot);
    } else {
      const lastSnapshot = getLastCodeSnapshot();
      if (lastSnapshot) {
        console.log('📦 Restoring single-file code from message history for project:', activeProjectId);
        setCode(lastSnapshot, true);
      }
    }
    const hasContent = !!(lastFilesSnapshot && Object.keys(lastFilesSnapshot).length > 0) || !!getLastCodeSnapshot();
    hasRestoredCodeRef.current = activeProjectId;

    // CONTENT GATE: Now it's safe to render
    console.log('🚪 Opening content gate for project:', activeProjectId);
    setContentProjectId(activeProjectId);

    // Trigger refresh if content was restored
    if (hasContent) {
      onIncrementRefreshKey();
    }
  }, [activeProjectId, messagesLoading, isVerifyingProject, dbSnapshotReady, getLastCodeSnapshot, getLastFilesSnapshot, setCode, setFiles, isStreaming, onIncrementRefreshKey]);

  // Reset restoration tracker when project changes
  useEffect(() => {
    hasRestoredCodeRef.current = null;
  }, [activeProjectId]);

  return {
    contentProjectId,
    isVerifyingProject,
    cleanupProjectRuntime,
  };
}
