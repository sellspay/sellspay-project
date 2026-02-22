import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Globe, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShelfProject {
  id: string;
  name: string;
  thumbnail_url: string | null;
  last_edited_at: string;
}

interface ProjectShelfProps {
  projects: ShelfProject[];
  onSelectProject: (id: string) => void;
}

// Generate a unique gradient from project ID
function getSeededGradient(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  }
  const gradients = [
    'from-orange-500/30 via-rose-500/20 to-purple-500/30',
    'from-blue-500/30 via-cyan-500/20 to-teal-500/30',
    'from-violet-500/30 via-fuchsia-500/20 to-pink-500/30',
    'from-emerald-500/30 via-green-500/20 to-lime-500/30',
    'from-amber-500/30 via-orange-500/20 to-red-500/30',
    'from-sky-500/30 via-indigo-500/20 to-violet-500/30',
    'from-rose-500/30 via-pink-500/20 to-fuchsia-500/30',
    'from-teal-500/30 via-emerald-500/20 to-cyan-500/30',
  ];
  return gradients[Math.abs(hash) % gradients.length];
}

const TABS: Array<{ id: string; label: string; disabled?: boolean }> = [
  { id: 'recent', label: 'Recent' },
  { id: 'my', label: 'My Projects' },
  { id: 'starred', label: 'Starred', disabled: true },
];

export function ProjectShelf({ projects, onSelectProject }: ProjectShelfProps) {
  const [activeTab, setActiveTab] = useState<string>('recent');

  if (projects.length === 0) return null;

  return (
    <div className="w-full mt-auto pt-6">
      <div className="bg-black/40 backdrop-blur-sm rounded-2xl border border-white/5 p-5">
        {/* Tabs + Browse All */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => !tab.disabled && setActiveTab(tab.id)}
                disabled={tab.disabled}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  activeTab === tab.id
                    ? "bg-white/10 text-white"
                    : tab.disabled
                      ? "text-zinc-700 cursor-not-allowed"
                      : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-1 text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors">
            Browse all <ArrowRight size={12} />
          </button>
        </div>

        {/* Card row — fixed-height horizontal strip */}
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide snap-x snap-mandatory">
          {projects.slice(0, 8).map((project) => (
            <button
              key={project.id}
              onClick={() => onSelectProject(project.id)}
              className="flex-shrink-0 group text-left snap-start flex items-center gap-3 bg-zinc-900/60 hover:bg-zinc-800/60 border border-white/5 hover:border-white/10 rounded-xl p-2.5 pr-5 transition-all hover:shadow-lg hover:shadow-orange-500/5 min-w-[220px]"
            >
              {/* Thumbnail */}
              <div className="w-16 h-12 rounded-lg overflow-hidden border border-white/10 bg-zinc-900 shrink-0">
                {project.thumbnail_url ? (
                  <img
                    src={project.thumbnail_url}
                    alt={project.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className={cn(
                    "w-full h-full bg-gradient-to-br flex items-center justify-center",
                    getSeededGradient(project.id)
                  )}>
                    <Globe size={12} className="text-zinc-500" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-zinc-300 truncate group-hover:text-white transition-colors">
                  {project.name}
                </p>
                <p className="text-[11px] text-zinc-600 mt-0.5">
                  {formatDistanceToNow(new Date(project.last_edited_at), { addSuffix: true })}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
