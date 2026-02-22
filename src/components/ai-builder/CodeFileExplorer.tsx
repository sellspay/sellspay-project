import { useState, useMemo } from 'react';
import { 
  FileText, FolderOpen, Folder, ChevronRight, ChevronDown,
  LayoutDashboard, Component, FileCode2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { parseVirtualFiles, type VirtualFile } from '@/utils/codeFileParser';

export type { VirtualFile };

interface CodeFileExplorerProps {
  /** Monolithic code string (legacy single-file mode) */
  code?: string;
  /** Multi-file map from AI generation */
  projectFiles?: Record<string, string>;
  activeFileId: string | null;
  onFileSelect: (file: VirtualFile) => void;
}

// Group files by folder
interface FolderGroup {
  name: string;
  icon: React.ElementType;
  files: VirtualFile[];
}

export function CodeFileExplorer({ code, projectFiles, activeFileId, onFileSelect }: CodeFileExplorerProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['/', '/pages', '/components', '/sections']));
  
  const virtualFiles = useMemo<VirtualFile[]>(() => {
    // Multi-file mode: build VirtualFile entries from the real file map
    if (projectFiles && Object.keys(projectFiles).length > 0) {
      return Object.entries(projectFiles)
        .filter(([path]) => !path.includes('/hooks/') && !path.includes('capture.ts'))
        .map(([path, content]) => {
          const normalizedPath = path.startsWith('/') ? path : `/${path}`;
          const name = normalizedPath.split('/').pop() || normalizedPath;
          const nameLower = name.toLowerCase().replace(/\.tsx?$/, '');
          
          // Determine type based on path
          let type: VirtualFile['type'] = 'component';
          if (nameLower === 'app' || normalizedPath === '/App.tsx') type = 'app';
          else if (normalizedPath.includes('/pages/') || normalizedPath.includes('/sections/')) type = 'page';
          else if (normalizedPath.includes('/components/')) type = 'component';
          else if (normalizedPath.endsWith('.css') || normalizedPath.endsWith('.ts') && !normalizedPath.endsWith('.tsx')) type = 'style';
          
          return {
            id: normalizedPath,
            name,
            path: normalizedPath,
            type,
            startLine: 0,
            endLine: content.split('\n').length - 1,
            code: content,
          };
        });
    }
    
    // Legacy: parse from monolithic code
    if (code) return parseVirtualFiles(code);
    return [];
  }, [code, projectFiles]);

  const folders = useMemo<FolderGroup[]>(() => {
    const groups: Record<string, VirtualFile[]> = {};
    
    for (const file of virtualFiles) {
      // For multi-file, use actual directory
      if (projectFiles) {
        const parts = file.path.split('/').filter(Boolean);
        const folder = parts.length > 1 ? '/' + parts.slice(0, -1).join('/') : '/';
        const folderKey = folder === '/' ? '/' : folder;
        if (!groups[folderKey]) groups[folderKey] = [];
        groups[folderKey].push(file);
      } else {
        const folder = file.type === 'page' ? '/pages' 
          : file.type === 'component' ? '/components' 
          : '/';
        if (!groups[folder]) groups[folder] = [];
        groups[folder].push(file);
      }
    }

    const iconMap: Record<string, React.ElementType> = {
      '/': FileCode2,
      '/pages': LayoutDashboard,
      '/sections': LayoutDashboard,
      '/components': Component,
    };

    return Object.entries(groups)
      .sort(([a], [b]) => {
        // Root first, then alphabetical
        if (a === '/') return -1;
        if (b === '/') return 1;
        return a.localeCompare(b);
      })
      .map(([name, files]) => ({
        name: name === '/' ? '/' : name.replace(/^\//, ''),
        icon: iconMap[name] || Component,
        files,
      }));
  }, [virtualFiles, projectFiles]);

  const toggleFolder = (name: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  if (virtualFiles.length <= 1) {
    return (
      <div className="w-48 shrink-0 bg-zinc-950 border-r border-zinc-800 overflow-y-auto">
        <div className="px-3 py-2 border-b border-zinc-800">
          <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">
            Files
          </span>
        </div>
        <div className="p-1.5">
          <button
            onClick={() => virtualFiles[0] && onFileSelect(virtualFiles[0])}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-violet-300 bg-violet-500/10"
          >
            <FileText size={14} className="text-violet-400 shrink-0" />
            <span className="truncate">{virtualFiles[0]?.name || 'App.tsx'}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-48 shrink-0 bg-zinc-950 border-r border-zinc-800 overflow-y-auto">
      <div className="px-3 py-2 border-b border-zinc-800">
        <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">
          Files ({virtualFiles.length})
        </span>
      </div>

      <div className="p-1.5 space-y-0.5">
        {folders.map((folder) => {
          const isRoot = folder.name === '/';
          const isExpanded = expandedFolders.has(folder.name) || expandedFolders.has('/' + folder.name);
          const FolderIcon = isExpanded ? FolderOpen : Folder;

          return (
            <div key={folder.name}>
              {!isRoot && (
                <button
                  onClick={() => toggleFolder(folder.name)}
                  className="w-full flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown size={12} className="text-zinc-600" />
                  ) : (
                    <ChevronRight size={12} className="text-zinc-600" />
                  )}
                  <FolderIcon size={14} className="text-amber-500/70" />
                  <span className="font-medium">{folder.name}</span>
                  <span className="ml-auto text-zinc-600 text-[10px]">{folder.files.length}</span>
                </button>
              )}

              {(isRoot || isExpanded) && (
                <div className={cn(!isRoot && "ml-3 border-l border-zinc-800/50 pl-1.5")}>
                  {folder.files.map((file) => {
                    const isActive = activeFileId === file.id;
                    return (
                      <button
                        key={file.id}
                        onClick={() => onFileSelect(file)}
                        className={cn(
                          "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-colors group",
                          isActive
                            ? "text-violet-300 bg-violet-500/10"
                            : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                        )}
                      >
                        <FileText 
                          size={14} 
                          className={cn(
                            "shrink-0",
                            isActive ? "text-violet-400" : "text-zinc-600 group-hover:text-zinc-400",
                            file.type === 'page' && !isActive && "text-blue-400/70",
                            file.type === 'component' && !isActive && "text-emerald-400/70",
                            file.type === 'app' && !isActive && "text-violet-400/70"
                          )} 
                        />
                        <span className="truncate">{file.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
