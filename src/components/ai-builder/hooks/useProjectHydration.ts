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

  // DB-driven guardrail mode ref (owned by parent, populated here)
  hasDbSnapshotRef: React.MutableRefObject<boolean>;

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
  hasDbSnapshotRef,
  onResetTransientState,
  onIncrementResetKey,
  onIncrementRefreshKey,
}: UseProjectHydrationOptions) {
  // CONTENT GATE: Which project has its code/chat fully mounted into the workspace.
  const [contentProjectId, setContentProjectId] = useState<string | null>(null);

  // STRICT LOADING: Verify project exists before rendering preview
  const [isVerifyingProject, setIsVerifyingProject] = useState(false);

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

  // =============== CODE RESTORATION FROM MESSAGES ===============
  // Track the DB-fetched last_valid_files for use during restoration
  const dbLastValidFilesRef = useRef<Record<string, string> | null>(null);
  const [dbSnapshotReady, setDbSnapshotReady] = useState(false);

  // =============== SCORCHED EARTH ORCHESTRATOR ===============
  useLayoutEffect(() => {
    let isMounted = true;

    // 🔒 FIX 1: Guard against transient nulls — do NOTHING if activeProjectId is null
    if (!activeProjectId) return;

    // Skip if project ID hasn't actually changed
    if (previousProjectIdRef.current === activeProjectId) return;

    // 🔒 FIX 3: Only reset hasDbSnapshotRef on a REAL project switch (old → new, both non-null)
    if (previousProjectIdRef.current && previousProjectIdRef.current !== activeProjectId) {
      hasDbSnapshotRef.current = false;
    }

    // 🔒 FIX 2: Stamp the ref BEFORE async work to prevent re-entry
    const previousId = previousProjectIdRef.current;
    previousProjectIdRef.current = activeProjectId;

    // 🚨 CRITICAL: These MUST run SYNCHRONOUSLY
    setContentProjectId(null);
    setIsVerifyingProject(true);
    setDbSnapshotReady(false);
    loadingProjectRef.current = activeProjectId;

    // ✅ STEP 1: Run the unified cleanup gate
    cleanupProjectRuntime();
    unmountAgentProject();

    async function loadRoute() {
      // 2. DETECT PROJECT SWITCH
      const isProjectSwitch = previousId !== null && previousId !== activeProjectId;

      if (isProjectSwitch) {
        console.log(`🔄 Project switch detected: ${previousId} → ${activeProjectId}`);
        if (previousId) {
          clearProjectLocalStorage(previousId);
        }
        await nukeSandpackCache();
      }

      // 3. NO PROJECT case is handled by the null guard above — we never reach here without an ID

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
        dbLastValidFilesRef.current = null;
        setDbSnapshotReady(true);
        toast.info('Previous project was deleted. Starting fresh.');
      } else {
        // Project verified
        console.log("✅ DB Data received. Mounting.");
        mountAgentProject(activeProjectId);
        onResetTransientState();

        // 🔥 FIX 4: Populate dbLastValidFilesRef HERE — single source of truth, no duplicate fetch
        if (data.last_valid_files && typeof data.last_valid_files === 'object' &&
            Object.keys(data.last_valid_files as Record<string, string>).length > 0) {
          hasDbSnapshotRef.current = true;
          dbLastValidFilesRef.current = data.last_valid_files as Record<string, string>;
          console.log('🔒 hasDbSnapshotRef set to TRUE in layout effect (race-free)');
        } else {
          dbLastValidFilesRef.current = null;
        }
        setDbSnapshotReady(true);
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

  // 🔥 FIX 4: DUPLICATE DB FETCH EFFECT DELETED
  // The layout effect above now handles dbLastValidFilesRef + dbSnapshotReady + hasDbSnapshotRef
  // in a single pass, eliminating the race condition.

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
      // 🔥 CRITICAL: Signal that a DB snapshot exists so guardrails use EDIT mode
      hasDbSnapshotRef.current = true;
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
