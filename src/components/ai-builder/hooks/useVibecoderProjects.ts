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

  // Create new project
  const createProject = useCallback(async (name: string = 'Untitled Project') => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('vibecoder_projects')
      .insert({
        user_id: user.id,
        name,
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
    return newProject;
  }, [user]);

  // Delete project
  const deleteProject = useCallback(async (projectId: string) => {
    const { error } = await supabase
      .from('vibecoder_projects')
      .delete()
      .eq('id', projectId);

    if (error) {
      console.error('Failed to delete project:', error);
      return false;
    }

    setProjects(prev => prev.filter(p => p.id !== projectId));
    
    // If deleted project was active, select another
    if (activeProjectId === projectId) {
      const remaining = projects.filter(p => p.id !== projectId);
      setActiveProjectId(remaining.length > 0 ? remaining[0].id : null);
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
    deleteProject,
    renameProject,
    selectProject,
    addMessage,
    rateMessage,
    getLastCodeSnapshot,
    getPreviousCodeSnapshot,
  };
}
