import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { nukeSandpackCache, clearProjectLocalStorage } from '@/utils/storageNuke';
import { hasCompleteSentinel } from '../useStreamingCode';
import type { ProjectFiles } from '../VibecoderPreview';

export interface VibecoderProject {
  id: string;
  user_id: string;
  name: string;
  thumbnail_url: string | null;
  created_at: string;
  last_edited_at: string;
}

export interface VibecoderMessage {
  id: string;
  project_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string | null;
  code_snapshot: string | null;
  /** Multi-file snapshot (jsonb). Takes precedence over code_snapshot when present. */
  files_snapshot: Record<string, string> | null;
  rating: number;
  created_at: string;
  meta_data?: {
    type?: 'policy_violation' | string;
    category?: string;
    /** Persisted streaming phase data so analysis/plan/building is visible in history */
    streamPhase?: {
      analysisText?: string;
      planItems?: string[];
      summaryText?: string;
      confidenceScore?: number;
      confidenceReason?: string;
      elapsedSeconds?: number;
    };
  };
}

function isSameMessage(a: VibecoderMessage, b: VibecoderMessage) {
  return (
    a.role === b.role &&
    (a.content ?? '').trim() === (b.content ?? '').trim() &&
    (a.code_snapshot ?? '').trim() === (b.code_snapshot ?? '').trim()
  );
}

/**
 * UI-level dedupe to protect against accidental double-appends.
 * We only collapse *consecutive* duplicates so we don’t destroy legitimate repeated content.
 */
function dedupeConsecutiveMessages(items: VibecoderMessage[]) {
  const out: VibecoderMessage[] = [];
  for (const m of items) {
    const last = out[out.length - 1];
    if (last && isSameMessage(last, m)) continue;
    out.push(m);
  }
  return out;
}

export function useVibecoderProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<VibecoderProject[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(() => {
    // Initialize from URL on mount
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('project');
  });
  const [messages, setMessages] = useState<VibecoderMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);

  // Load all projects for user
  useEffect(() => {
    if (!user) return;

    const loadProjects = async () => {
      const { data, error } = await supabase
        .from('vibecoder_projects')
        .select('*')
        .eq('user_id', user.id)
        .order('last_edited_at', { ascending: false });

      if (error) {
        console.error('Failed to load projects:', error);
      } else {
        setProjects(data as VibecoderProject[]);

        // Read project ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        const urlProjectId = urlParams.get('project');

        // If URL has a valid project ID that exists in user's projects, use it
        if (urlProjectId && data.some(p => p.id === urlProjectId)) {
          if (activeProjectId !== urlProjectId) {
            setActiveProjectId(urlProjectId);
          }
        }
        // Otherwise, do NOT auto-select — let the user land on the doorway screen
        // where they can pick a recent project or start fresh.
      }
      setLoading(false);
    };

    loadProjects();
  }, [user]);

  // Track previous project to detect actual changes
  const prevProjectIdRef = useRef<string | null>(null);

  // RACE CONDITION GUARD: When a project is freshly created via heroOnStart,
  // the loadMessages effect fires but the DB insert hasn't completed yet.
  // This causes setMessages([]) which wipes the optimistic message.
  // Skip the first load for freshly created projects.
  const skipNextLoadRef = useRef<string | null>(null);

  // Load messages when active project changes
  useEffect(() => {
    // GUARD: Don't load messages until user is authenticated.
    // Without a session, RLS returns 0 rows, making history appear empty.
    if (!user) return;

    // Only clear messages if we're switching to a DIFFERENT project
    // This prevents flicker when the same project is re-mounted
    const isProjectSwitch = prevProjectIdRef.current !== null &&
      prevProjectIdRef.current !== activeProjectId;

    if (isProjectSwitch) {
      // CRITICAL: Clear messages only on actual project switch to prevent cross-project bleed
      setMessages([]);
    }

    prevProjectIdRef.current = activeProjectId;

    if (!activeProjectId) {
      return;
    }

    // If this project was just created and we should skip the initial load
    if (skipNextLoadRef.current === activeProjectId) {
      skipNextLoadRef.current = null;
      setMessagesLoading(false);
      return;
    }

    const loadMessages = async () => {
      setMessagesLoading(true);
      const { data, error } = await supabase
        .from('vibecoder_messages')
        .select('*')
        .eq('project_id', activeProjectId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Failed to load messages:', error);
      } else {
        // MERGE GUARD: If there are already optimistic messages in state
        // (e.g. from heroOnStart), don't wipe them with an empty DB result.
        setMessages(prev => {
          const hasOptimistic = prev.some(m => m.id.startsWith('optimistic-'));
          if (hasOptimistic && (data || []).length === 0) {
            // DB is empty but we have optimistic messages — keep them
            return prev;
          }
          const next = dedupeConsecutiveMessages(data as VibecoderMessage[]);
          // If we have optimistic messages that aren't in DB yet, merge them
          if (hasOptimistic) {
            const dbIds = new Set(next.map(m => m.id));
            const optimisticToKeep = prev.filter(m => m.id.startsWith('optimistic-') && !dbIds.has(m.id));
            return dedupeConsecutiveMessages([...next, ...optimisticToKeep]);
          }
          return next;
        });
      }
      setMessagesLoading(false);
    };

    loadMessages();
  }, [activeProjectId, user]);

  // Create new project (can be called explicitly or auto-created on first prompt)
  // skipInitialLoad: when true, skips the message-loading useEffect for this project
  // (used by heroOnStart to prevent race condition with optimistic messages)
  const createProject = useCallback(async (name?: string, skipInitialLoad?: boolean) => {
    if (!user) return null;

    // Generate a timestamp-based name if not provided
    const projectName = name || `Store ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const { data, error } = await supabase
      .from('vibecoder_projects')
      .insert({
        user_id: user.id,
        name: projectName,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create project:', error);
      return null;
    }

    const newProject = data as VibecoderProject;
    
    // If skipInitialLoad, mark this project so loadMessages skips the first run
    if (skipInitialLoad) {
      skipNextLoadRef.current = newProject.id;
    }
    
    setProjects(prev => [newProject, ...prev]);
    setActiveProjectId(newProject.id);
    setMessages([]); // Clear messages for new project

    // Update URL without reloading so they can refresh and stay here
    const url = new URL(window.location.href);
    url.searchParams.set('project', newProject.id);
    window.history.replaceState(null, '', url.toString());

    return newProject;
  }, [user]);

  // Auto-create project if needed (called when user sends first message with no active project)
  // Accepts an optional name derived from the first prompt for smart project naming
  // skipInitialLoad: forwarded to createProject to prevent race with optimistic messages
  const ensureProject = useCallback(async (promptBasedName?: string, skipInitialLoad?: boolean): Promise<string | null> => {
    if (activeProjectId) return activeProjectId;

    const newProject = await createProject(promptBasedName, skipInitialLoad);
    return newProject?.id ?? null;
  }, [activeProjectId, createProject]);

  // Delete project using the "Total Deletion" RPC
  // This also clears the live store if this project was active
  // SCORCHED EARTH: Also clears all browser caches to prevent zombie projects
  const deleteProject = useCallback(async (projectId: string): Promise<boolean> => {
    try {
      // 1. Delete from database via RPC
      const { error } = await supabase.rpc('delete_project_fully', {
        p_project_id: projectId
      });

      if (error) {
        console.error('Failed to delete project:', error);
        return false;
      }

      // 2. SCORCHED EARTH: Clear all browser caches for this project
      clearProjectLocalStorage(projectId);
      await nukeSandpackCache();

      // 3. Update local state
      setProjects(prev => prev.filter(p => p.id !== projectId));

      // 4. If deleted project was active, select another or clear
      if (activeProjectId === projectId) {
        const remaining = projects.filter(p => p.id !== projectId);
        setActiveProjectId(remaining.length > 0 ? remaining[0].id : null);
        setMessages([]); // Clear messages since project is gone

        // 5. Clear URL parameter if it referenced the deleted project
        const url = new URL(window.location.href);
        if (url.searchParams.get('project') === projectId) {
          url.searchParams.delete('project');
          window.history.replaceState(null, '', url.toString());
        }
      }

      return true;
    } catch (err) {
      console.error('Failed to delete project:', err);
      return false;
    }
  }, [activeProjectId, projects]);

  // Rename project
  const renameProject = useCallback(async (projectId: string, newName: string) => {
    const { error } = await supabase
      .from('vibecoder_projects')
      .update({ name: newName })
      .eq('id', projectId);

    if (error) {
      console.error('Failed to rename project:', error);
      return false;
    }

    setProjects(prev => prev.map(p =>
      p.id === projectId ? { ...p, name: newName } : p
    ));
    return true;
  }, []);

  // INSERT DEBOUNCE: Prevent rapid-fire duplicate inserts from the frontend
  const lastInsertRef = useRef<{ hash: string; timestamp: number }>({ hash: '', timestamp: 0 });

  // Add message (auto-saves to DB)
  // RACE CONDITION GUARD: Optional forProjectId allows explicit targeting
  // to prevent writes to wrong project if user switched mid-generation
  // OPTIMISTIC UPDATE: Always update local state for better UX
  const addMessage = useCallback(async (
    role: 'user' | 'assistant' | 'system',
    content: string | null,
    codeSnapshot?: string | null,
    forProjectId?: string,
    filesSnapshot?: ProjectFiles | null,
    metaData?: VibecoderMessage['meta_data'],
  ) => {
    const targetProjectId = forProjectId || activeProjectId;
    if (!targetProjectId) return null;

    // DEBOUNCE GUARD: Skip if same content was just inserted within 3 seconds
    const insertHash = `${targetProjectId}:${role}:${(content ?? '').trim().slice(0, 200)}:${codeSnapshot ? 'code' : 'nocode'}`;
    const now = Date.now();
    if (lastInsertRef.current.hash === insertHash && now - lastInsertRef.current.timestamp < 3000) {
      console.log('[addMessage] Debounce: skipping duplicate insert');
      return null;
    }
    lastInsertRef.current = { hash: insertHash, timestamp: now };

    // Soft guard: if we’re about to append an identical message consecutively, skip the optimistic append.
    // (DB insert still happens; this is only to prevent the UI from exploding.)
    setMessages(prev => {
      const last = prev[prev.length - 1];
      if (last && last.project_id === targetProjectId && last.role === role) {
        const lastComparable: VibecoderMessage = {
          ...last,
          content: last.content ?? '',
          code_snapshot: last.code_snapshot ?? null,
        };
        const nextComparable: VibecoderMessage = {
          id: 'tmp',
          project_id: targetProjectId,
          role,
          content,
          code_snapshot: codeSnapshot ?? null,
          files_snapshot: filesSnapshot ?? null,
          rating: 0,
          created_at: new Date().toISOString(),
        };
        if (isSameMessage(lastComparable, nextComparable)) {
          return prev;
        }
      }
      const optimisticMessage: VibecoderMessage = {
        id: `optimistic-${Date.now()}`,
        project_id: targetProjectId,
        role,
        content,
        code_snapshot: codeSnapshot ?? null,
        files_snapshot: filesSnapshot ?? null,
        rating: 0,
        created_at: new Date().toISOString(),
        meta_data: metaData,
      };
      return [...prev, optimisticMessage];
    });

    const { data, error } = await supabase
      .from('vibecoder_messages')
      .insert({
        project_id: targetProjectId,
        role,
        content,
        code_snapshot: codeSnapshot ?? null,
        files_snapshot: filesSnapshot ?? null,
        meta_data: metaData ?? null,
      } as any)
      .select();

    if (error || !data || data.length === 0) {
      if (error) {
        console.error('Failed to add message:', error);
      } else {
        console.warn('[addMessage] Insert returned no rows (RLS may have blocked SELECT). Message likely saved.');
      }
      // Remove optimistic message on hard error only
      if (error) {
        setMessages(prev => prev.filter(m => !m.id.startsWith('optimistic-')));
      }
      return null;
    }

    const newMessage = data[0] as VibecoderMessage;

    // Replace the *last* optimistic message matching role/content/code_snapshot with the real one.
    // This is more robust when multiple optimistic messages exist.
    setMessages(prev => {
      const idx = [...prev].reverse().findIndex(m => {
        if (!m.id.startsWith('optimistic-')) return false;
        return m.project_id === targetProjectId && m.role === role &&
          (m.content ?? '').trim() === (content ?? '').trim() &&
          (m.code_snapshot ?? '').trim() === (codeSnapshot ?? '').trim();
      });
      if (idx === -1) return prev;
      const realIndex = prev.length - 1 - idx;
      const next = prev.slice();
      next[realIndex] = newMessage;
      return dedupeConsecutiveMessages(next);
    });

    return newMessage;
  }, [activeProjectId]);

  // Rate message (thumbs up/down)
  const rateMessage = useCallback(async (messageId: string, rating: -1 | 0 | 1) => {
    // Optimistic update
    setMessages(prev => prev.map(m =>
      m.id === messageId ? { ...m, rating } : m
    ));

    const { error } = await supabase
      .from('vibecoder_messages')
      .update({ rating })
      .eq('id', messageId);

    if (error) {
      console.error('Failed to rate message:', error);
      // Revert on error
      setMessages(prev => prev.map(m =>
        m.id === messageId ? { ...m, rating: 0 } : m
      ));
      return false;
    }

    return true;
  }, []);

  // Get last code snapshot (for undo) - checks files_snapshot first, falls back to code_snapshot
  const getLastCodeSnapshot = useCallback(() => {
    const withCode = messages.filter(m => m.code_snapshot || m.files_snapshot);
    if (withCode.length === 0) return null;
    const last = withCode[withCode.length - 1];
    // If files_snapshot exists, extract App.tsx from it
    if (last.files_snapshot && typeof last.files_snapshot === 'object') {
      const files = last.files_snapshot as Record<string, string>;
      return files['/App.tsx'] || files['App.tsx'] || last.code_snapshot;
    }
    return last.code_snapshot;
  }, [messages]);

  /** Get the last files snapshot (multi-file map). Returns null for legacy single-file projects. */
  const getLastFilesSnapshot = useCallback((): ProjectFiles | null => {
    const withFiles = messages.filter(m => m.files_snapshot && typeof m.files_snapshot === 'object' && Object.keys(m.files_snapshot).length > 0);
    if (withFiles.length === 0) return null;
    return withFiles[withFiles.length - 1].files_snapshot as ProjectFiles;
  }, [messages]);

  // Get previous code snapshot (for undo)
  const getPreviousCodeSnapshot = useCallback(() => {
    const withCode = messages.filter(m => m.code_snapshot || m.files_snapshot);
    if (withCode.length < 2) return null;
    const prev = withCode[withCode.length - 2];
    if (prev.files_snapshot && typeof prev.files_snapshot === 'object') {
      const files = prev.files_snapshot as Record<string, string>;
      return files['/App.tsx'] || files['App.tsx'] || prev.code_snapshot;
    }
    return prev.code_snapshot;
  }, [messages]);

  // Restore to a specific message version (time travel)
  // Deletes all messages after this point and returns the code snapshot
  const restoreToVersion = useCallback(async (messageId: string): Promise<string | null> => {
    if (!activeProjectId) return null;

    try {
      // Call the RPC to delete future messages and get the code snapshot
      const { data: restoredCode, error } = await supabase.rpc('restore_project_version', {
        p_project_id: activeProjectId,
        p_message_id: messageId,
      });

      if (error) {
        console.error('Restore RPC error:', error);
        throw new Error(error.message || 'Failed to restore version');
      }

      // Re-fetch messages from DB to ensure perfect sync
      const { data: freshMessages, error: fetchError } = await supabase
        .from('vibecoder_messages')
        .select('*')
        .eq('project_id', activeProjectId)
        .order('created_at', { ascending: true });

      if (fetchError) {
        console.error('Failed to re-fetch messages:', fetchError);
      } else {
        setMessages(dedupeConsecutiveMessages(freshMessages as VibecoderMessage[]));
      }

      return restoredCode;
    } catch (error) {
      console.error('Failed to restore version:', error);
      throw error;
    }
  }, [activeProjectId]);

  // Refresh messages from DB (for sync after mutations)
  const refreshMessages = useCallback(async () => {
    if (!activeProjectId) return;

    const { data, error } = await supabase
      .from('vibecoder_messages')
      .select('*')
      .eq('project_id', activeProjectId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMessages(dedupeConsecutiveMessages(data as VibecoderMessage[]));
    }
  }, [activeProjectId]);

  // UNDO LAST CHANGE: Quick undo that reverts to the previous code snapshot
  // Only works if there are at least 2 messages with code snapshots (current + previous)
  const undoLastChange = useCallback(async (): Promise<string | null> => {
    // Find all assistant messages with code snapshots that passed linter (have sentinel)
    const withValidCode = messages.filter(m => 
      m.role === 'assistant' && 
      m.code_snapshot && 
      hasCompleteSentinel(m.code_snapshot)
    );
    
    // Need at least 2 valid snapshots to undo (current + previous)
    if (withValidCode.length < 2) {
      console.log('[undoLastChange] Cannot undo - need at least 2 valid code snapshots');
      return null;
    }
    
    // Get the second-to-last message (the previous version)
    const previousMessage = withValidCode[withValidCode.length - 2];
    
    console.log('[undoLastChange] Reverting to message:', previousMessage.id);
    return await restoreToVersion(previousMessage.id);
  }, [messages, restoreToVersion]);

  // GET LAST SAFE VERSION: Returns the most recent code that passed linter checks
  // Used to ensure we only restore to "healthy" code versions
  const getLastSafeVersion = useCallback((): { messageId: string; code: string } | null => {
    const withValidCode = messages.filter(m => 
      m.role === 'assistant' && 
      m.code_snapshot && 
      hasCompleteSentinel(m.code_snapshot)
    );
    
    if (withValidCode.length === 0) return null;
    
    const last = withValidCode[withValidCode.length - 1];
    return { messageId: last.id, code: last.code_snapshot! };
  }, [messages]);

  // CAN UNDO: Check if undo is possible (at least 2 code snapshots)
  // Note: We no longer require the sentinel because recovered/patched code
  // may not have it, and users still need to be able to revert.
  const canUndo = useCallback((): boolean => {
    const withValidCode = messages.filter(m => 
      m.role === 'assistant' && 
      m.code_snapshot && 
      m.code_snapshot.trim().length > 50
    );
    return withValidCode.length >= 2;
  }, [messages]);

  // Select project - also syncs URL so refresh lands on the same project
  const selectProject = useCallback((projectId: string) => {
    setActiveProjectId(projectId);

    // Sync URL query param for refresh consistency
    const url = new URL(window.location.href);
    url.searchParams.set('project', projectId);
    window.history.replaceState(null, '', url.toString());
  }, []);

  // Clear active project - used for "Fresh Start" flow
  const clearActiveProject = useCallback(() => {
    setActiveProjectId(null);
    setMessages([]);

    // Clear URL parameter
    const url = new URL(window.location.href);
    url.searchParams.delete('project');
    window.history.replaceState(null, '', url.toString());
  }, []);

  return {
    projects,
    activeProjectId,
    activeProject: projects.find(p => p.id === activeProjectId) ?? null,
    messages,
    loading,
    messagesLoading,
    createProject,
    ensureProject,
    deleteProject,
    renameProject,
    selectProject,
    clearActiveProject,
    addMessage,
    rateMessage,
    getLastCodeSnapshot,
    getLastFilesSnapshot,
    getPreviousCodeSnapshot,
    restoreToVersion,
    refreshMessages,
    // New undo functionality
    undoLastChange,
    getLastSafeVersion,
    canUndo,
  };
}
