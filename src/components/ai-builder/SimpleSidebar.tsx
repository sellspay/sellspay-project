import { useState, useEffect } from 'react';
import { Plus, FolderOpen, Loader2, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

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
}

/**
 * SimpleSidebar - Project list for Vibecoder
 * 
 * Minimal sidebar with:
 * - Project list
 * - Create new project button
 * - Project selection
 */
export function SimpleSidebar({ 
  userId, 
  activeProjectId, 
  onSelectProject,
  onCreateProject,
  onDeleteProject
}: SimpleSidebarProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  
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
  
  const handleDelete = async (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    if (onDeleteProject) {
      onDeleteProject(projectId);
    }
  };
  
  return (
    <div className="w-64 h-full bg-zinc-950 border-r border-zinc-800 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800">
        <button
          onClick={onCreateProject}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-medium text-sm transition-colors"
        >
          <Plus size={16} />
          <span>New Project</span>
        </button>
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
              <button
                key={project.id}
                onClick={() => onSelectProject(project.id)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors group",
                  activeProjectId === project.id
                    ? "bg-violet-600/20 text-white border border-violet-500/30"
                    : "hover:bg-zinc-800 text-zinc-400 hover:text-white"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <FolderOpen size={14} className="shrink-0" />
                  <span className="text-sm truncate">{project.name}</span>
                </div>
                
                {onDeleteProject && (
                  <button
                    onClick={(e) => handleDelete(e, project.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded text-zinc-500 hover:text-red-400 transition-all"
                    title="Delete project"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </button>
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
