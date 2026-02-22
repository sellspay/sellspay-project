import { useState, useMemo } from 'react';
import { 
  FileText, FolderOpen, Folder, ChevronRight, ChevronDown,
  LayoutDashboard, Component, FileCode2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { parseVirtualFiles, type VirtualFile } from '@/utils/codeFileParser';

interface CodeFileExplorerProps {
  code: string;
  activeFileId: string | null;
  onFileSelect: (file: VirtualFile) => void;
}

// Group files by folder
interface FolderGroup {
  name: string;
  icon: React.ElementType;
  files: VirtualFile[];
}

export function CodeFileExplorer({ code, activeFileId, onFileSelect }: CodeFileExplorerProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['/', '/pages', '/components']));
  
  const virtualFiles = useMemo(() => parseVirtualFiles(code), [code]);

  const folders = useMemo<FolderGroup[]>(() => {
    const groups: Record<string, VirtualFile[]> = {};
    
    for (const file of virtualFiles) {
      const folder = file.type === 'page' ? '/pages' 
        : file.type === 'component' ? '/components' 
        : '/';
      if (!groups[folder]) groups[folder] = [];
      groups[folder].push(file);
    }

    const result: FolderGroup[] = [];
    
    if (groups['/']) {
      result.push({ name: '/', icon: FileCode2, files: groups['/'] });
    }
    if (groups['/pages']) {
      result.push({ name: 'pages', icon: LayoutDashboard, files: groups['/pages'] });
    }
    if (groups['/components']) {
      result.push({ name: 'components', icon: Component, files: groups['/components'] });
    }

    return result;
  }, [virtualFiles]);

  const toggleFolder = (name: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  if (virtualFiles.length <= 1) {
    // Only one file (App.tsx), show minimal view
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
            <span className="truncate">App.tsx</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-48 shrink-0 bg-zinc-950 border-r border-zinc-800 overflow-y-auto">
      {/* Header */}
      <div className="px-3 py-2 border-b border-zinc-800">
        <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">
          Files ({virtualFiles.length})
        </span>
      </div>

      {/* File Tree */}
      <div className="p-1.5 space-y-0.5">
        {folders.map((folder) => {
          const isRoot = folder.name === '/';
          const isExpanded = expandedFolders.has(folder.name);
          const FolderIcon = isExpanded ? FolderOpen : Folder;

          return (
            <div key={folder.name}>
              {/* Folder header (skip for root) */}
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

              {/* Files */}
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
                            file.type === 'page' && "text-blue-400/70",
                            file.type === 'component' && "text-emerald-400/70",
                            file.type === 'app' && "text-violet-400/70"
                          )} 
                        />
                        <span className="truncate">{file.name}</span>
                        <span className="ml-auto text-zinc-700 text-[10px]">
                          L{file.startLine + 1}
                        </span>
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
