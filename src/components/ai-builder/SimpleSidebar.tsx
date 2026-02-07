import { useState, useEffect, useRef } from 'react';
import { Plus, FolderOpen, Loader2, Trash2, Pencil, Check, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

interface Project {
  id: string;
  name: string;
  updated_at: string;
}

interface SimpleSidebarProps {
  userId: string;
  activeProjectId: string | null;
  onSelectProject: (projectId: string) => void;
  onCreateProject: () => void;
  onDeleteProject?: (projectId: string) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

/**
 * SimpleSidebar - Project list for Vibecoder
 * 
 * Minimal sidebar with:
 * - Project list
 * - Create new project button
 * - Project selection
 * - Rename and delete
 * - Collapsible
 */
export function SimpleSidebar({ 
  userId, 
  activeProjectId, 
  onSelectProject,
  onCreateProject,
  onDeleteProject,
  collapsed = false,
  onToggleCollapse
}: SimpleSidebarProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Fetch projects on mount
  useEffect(() => {
    const fetchProjects = async () => {
      const { data, error } = await supabase
        .from('vibecoder_projects')
        .select('id, name, updated_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
      
      if (!error && data) {
        setProjects(data);
      }
      setLoading(false);
    };
    
    fetchProjects();
    
    // Subscribe to realtime changes
    const channel = supabase
      .channel('vibecoder_projects_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vibecoder_projects',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          // Refetch on any change
          fetchProjects();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);
  
  // Focus input when editing
  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);
  
  const handleDelete = async (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    setDeletingId(projectId);
    
    try {
      // First delete related messages
      await supabase
        .from('vibecoder_messages')
        .delete()
        .eq('project_id', projectId);
      
      // Then delete the project
      const { error } = await supabase
        .from('vibecoder_projects')
        .delete()
        .eq('id', projectId);
      
      if (error) {
        throw error;
      }
      
      // Update local state
      setProjects(prev => prev.filter(p => p.id !== projectId));
      
      // Notify parent
      if (onDeleteProject) {
        onDeleteProject(projectId);
      }
      
      toast.success('Project deleted');
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to delete project');
    } finally {
      setDeletingId(null);
    }
  };
  
  const startRename = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setEditingId(project.id);
    setEditName(project.name);
  };
  
  const saveRename = async (projectId: string) => {
    if (!editName.trim()) {
      setEditingId(null);
      return;
    }
    
    try {
      const { error } = await supabase
        .from('vibecoder_projects')
        .update({ name: editName.trim() })
        .eq('id', projectId);
      
      if (error) throw error;
      
      // Update local state
      setProjects(prev => prev.map(p => 
        p.id === projectId ? { ...p, name: editName.trim() } : p
      ));
      
      toast.success('Project renamed');
    } catch (err) {
      console.error('Rename error:', err);
      toast.error('Failed to rename');
    } finally {
      setEditingId(null);
    }
  };
  
  const cancelRename = () => {
    setEditingId(null);
    setEditName('');
  };
  
  // Collapsed view - show project icons
  if (collapsed) {
    return (
      <div className="w-14 h-full bg-zinc-950 border-r border-zinc-800 flex flex-col items-center py-4">
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors mb-4"
          title="Expand sidebar"
        >
          <ChevronRight size={18} />
        </button>
        
        <button
          onClick={onCreateProject}
          className="p-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition-colors mb-4"
          title="New Project"
        >
          <Plus size={18} />
        </button>
        
        {/* Project icons */}
        <div className="flex-1 flex flex-col items-center gap-1.5 overflow-y-auto py-2 w-full px-1.5">
          {projects.slice(0, 8).map((project) => (
            <button
              key={project.id}
              onClick={() => onSelectProject(project.id)}
              className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center transition-all shrink-0",
                activeProjectId === project.id
                  ? "bg-violet-600 text-white ring-2 ring-violet-400/50"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"
              )}
              title={project.name}
            >
              <FolderOpen size={16} />
            </button>
          ))}
          {projects.length > 8 && (
            <div className="text-[10px] text-zinc-500 mt-1">+{projects.length - 8}</div>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-64 h-full bg-zinc-950 border-r border-zinc-800 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 flex items-center gap-2">
        <button
          onClick={onCreateProject}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-medium text-sm transition-colors"
        >
          <Plus size={16} />
          <span>New Project</span>
        </button>
        
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            title="Collapse sidebar"
          >
            <ChevronLeft size={18} />
          </button>
        )}
      </div>
      
      {/* Project list */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 text-zinc-500 animate-spin" />
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-8 px-4">
              <FolderOpen className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-sm text-zinc-500">No projects yet</p>
              <p className="text-xs text-zinc-600 mt-1">Create your first storefront</p>
            </div>
          ) : (
            projects.map((project) => (
              <div
                key={project.id}
                onClick={() => !editingId && onSelectProject(project.id)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors group cursor-pointer",
                  activeProjectId === project.id
                    ? "bg-violet-600/20 text-white border border-violet-500/30"
                    : "hover:bg-zinc-800 text-zinc-400 hover:text-white"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <FolderOpen size={14} className="shrink-0" />
                  
                  {editingId === project.id ? (
                    <input
                      ref={inputRef}
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveRename(project.id);
                        if (e.key === 'Escape') cancelRename();
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 bg-zinc-800 border border-zinc-600 rounded px-2 py-0.5 text-sm text-white focus:outline-none focus:border-violet-500"
                    />
                  ) : (
                    <span className="text-sm truncate">{project.name}</span>
                  )}
                </div>
                
                {editingId === project.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        saveRename(project.id);
                      }}
                      className="p-1 hover:bg-green-500/20 rounded text-green-400 transition-all"
                      title="Save"
                    >
                      <Check size={12} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        cancelRename();
                      }}
                      className="p-1 hover:bg-zinc-700 rounded text-zinc-400 transition-all"
                      title="Cancel"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => startRename(e, project)}
                      className="p-1 hover:bg-zinc-700 rounded text-zinc-500 hover:text-white transition-all"
                      title="Rename project"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, project.id)}
                      disabled={deletingId === project.id}
                      className="p-1 hover:bg-red-500/20 rounded text-zinc-500 hover:text-red-400 transition-all disabled:opacity-50"
                      title="Delete project"
                    >
                      {deletingId === project.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Trash2 size={12} />
                      )}
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
      
      {/* Footer */}
      <div className="p-3 border-t border-zinc-800">
        <p className="text-[10px] text-zinc-600 text-center">
          Vibecoder v2.0 • Stable Build
        </p>
      </div>
    </div>
  );
}
