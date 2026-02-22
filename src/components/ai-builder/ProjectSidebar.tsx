import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Plus,
  Folder,
  Clock,
  Trash2,
  MoreVertical,
  Pencil,
  FolderOpen,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { cn } from '@/lib/utils';
import type { VibecoderProject } from './hooks/useVibecoderProjects';

interface ProjectSidebarProps {
  projects: VibecoderProject[];
  activeProjectId: string | null;
  loading: boolean;
  onSelectProject: (projectId: string) => void;
  onCreateProject: () => void;
  onDeleteProject: (projectId: string) => void;
  onRenameProject: (projectId: string, newName: string) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function ProjectSidebar({
  projects,
  activeProjectId,
  loading,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
  onRenameProject,
  collapsed = false,
  onToggleCollapse,
}: ProjectSidebarProps) {
  const [projectToDelete, setProjectToDelete] = useState<VibecoderProject | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleDeleteClick = (project: VibecoderProject) => {
    setProjectToDelete(project);
  };

  const confirmDelete = () => {
    if (projectToDelete) {
      onDeleteProject(projectToDelete.id);
      setProjectToDelete(null);
    }
  };

  const startEditing = (project: VibecoderProject) => {
    setEditingId(project.id);
    setEditName(project.name);
  };

  const saveEdit = () => {
    if (editingId && editName.trim()) {
      onRenameProject(editingId, editName.trim());
    }
    setEditingId(null);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  // Hide sidebar entirely when no projects exist (fresh user)
  const hasProjects = projects.length > 0;

  if (collapsed) {
    return (
      <div className="w-12 bg-[#1a1a1a] flex flex-col items-center py-4 gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="h-8 w-8"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        {/* Only show New Project button if user already has projects */}
        {hasProjects && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onCreateProject}
            className="h-8 w-8 text-primary"
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
        <div className="flex-1 overflow-y-auto w-full space-y-1 px-1.5">
          {projects.slice(0, 10).map((project) => (
            <Button
              key={project.id}
              variant={activeProjectId === project.id ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => onSelectProject(project.id)}
              className="h-8 w-8"
              title={project.name}
            >
              {activeProjectId === project.id ? (
                <FolderOpen className="h-4 w-4 text-primary" />
              ) : (
                <Folder className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-64 bg-[#1a1a1a] flex flex-col h-full">
        {/* Header */}
        <div className="p-3 border-b border-border/30 flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="h-8 w-8 shrink-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {/* Only show New Project button if user already has projects */}
          {hasProjects && (
            <Button
              onClick={onCreateProject}
              className="flex-1 gap-2 bg-primary hover:bg-primary/90"
              size="sm"
            >
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          )}
        </div>

        {/* Project list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-8 px-4">
              <Folder className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No projects yet</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Create your first storefront
              </p>
            </div>
          ) : (
            projects.map((project) => (
              <div
                key={project.id}
                className={cn(
                  'group flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-colors',
                  activeProjectId === project.id
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                )}
                onClick={() => onSelectProject(project.id)}
              >
                {activeProjectId === project.id ? (
                  <FolderOpen className="h-4 w-4 shrink-0 text-primary" />
                ) : (
                  <Folder className="h-4 w-4 shrink-0" />
                )}

                <div className="flex-1 min-w-0">
                  {editingId === project.id ? (
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={saveEdit}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit();
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      className="h-6 text-sm py-0 px-1"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <>
                      <p className="text-sm font-medium truncate">{project.name}</p>
                      <p className="text-[10px] text-muted-foreground/70 flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {formatDate(project.last_edited_at)}
                      </p>
                    </>
                  )}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={() => startEditing(project)}>
                      <Pencil className="h-3.5 w-3.5 mr-2" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDeleteClick(project)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Nuclear Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!projectToDelete}
        onClose={() => setProjectToDelete(null)}
        onConfirm={confirmDelete}
        projectName={projectToDelete?.name || ""}
      />
    </>
  );
}
