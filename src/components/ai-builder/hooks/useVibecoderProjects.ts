import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

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
  rating: number;
  created_at: string;
}

export function useVibecoderProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<VibecoderProject[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
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
        
        // Auto-select most recent project if none selected
        if (data && data.length > 0 && !activeProjectId) {
          setActiveProjectId(data[0].id);
        }
      }
      setLoading(false);
    };

    loadProjects();
  }, [user, activeProjectId]);

  // Load messages when active project changes
  useEffect(() => {
    if (!activeProjectId) {
      setMessages([]);
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
        setMessages(data as VibecoderMessage[]);
      }
      setMessagesLoading(false);
    };

    loadMessages();
  }, [activeProjectId]);

  // Create new project (can be called explicitly or auto-created on first prompt)
  const createProject = useCallback(async (name?: string) => {
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
  const ensureProject = useCallback(async (): Promise<string | null> => {
    if (activeProjectId) return activeProjectId;
    
    const newProject = await createProject();
    return newProject?.id ?? null;
  }, [activeProjectId, createProject]);

  // Delete project using the "Total Deletion" RPC
  // This also clears the live store if this project was active
  const deleteProject = useCallback(async (projectId: string) => {
    const { error } = await supabase.rpc('delete_project_fully', {
      p_project_id: projectId
    });

    if (error) {
      console.error('Failed to delete project:', error);
      return false;
    }

    setProjects(prev => prev.filter(p => p.id !== projectId));
    
    // If deleted project was active, select another or clear
    if (activeProjectId === projectId) {
      const remaining = projects.filter(p => p.id !== projectId);
      setActiveProjectId(remaining.length > 0 ? remaining[0].id : null);
      setMessages([]); // Clear messages since project is gone
    }
    return true;
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

  // Add message (auto-saves to DB)
  const addMessage = useCallback(async (
    role: 'user' | 'assistant' | 'system',
    content: string | null,
    codeSnapshot?: string | null
  ) => {
    if (!activeProjectId) return null;

    const { data, error } = await supabase
      .from('vibecoder_messages')
      .insert({
        project_id: activeProjectId,
        role,
        content,
        code_snapshot: codeSnapshot ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to add message:', error);
      return null;
    }

    const newMessage = data as VibecoderMessage;
    setMessages(prev => [...prev, newMessage]);
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

  // Get last code snapshot (for undo)
  const getLastCodeSnapshot = useCallback(() => {
    const withCode = messages.filter(m => m.code_snapshot);
    return withCode.length > 0 ? withCode[withCode.length - 1].code_snapshot : null;
  }, [messages]);

  // Get previous code snapshot (for undo)
  const getPreviousCodeSnapshot = useCallback(() => {
    const withCode = messages.filter(m => m.code_snapshot);
    return withCode.length > 1 ? withCode[withCode.length - 2].code_snapshot : null;
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
        setMessages(freshMessages as VibecoderMessage[]);
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
      setMessages(data as VibecoderMessage[]);
    }
  }, [activeProjectId]);

  // Select project
  const selectProject = useCallback((projectId: string) => {
    setActiveProjectId(projectId);
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
    addMessage,
    rateMessage,
    getLastCodeSnapshot,
    getPreviousCodeSnapshot,
    restoreToVersion,
    refreshMessages,
  };
}
