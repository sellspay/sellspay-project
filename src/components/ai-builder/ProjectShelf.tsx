import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Globe, ArrowRight, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShelfProject {
  id: string;
  name: string;
  thumbnail_url: string | null;
  last_edited_at: string;
  is_published?: boolean;
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
  const hue1 = Math.abs(hash) % 360;
  const hue2 = (hue1 + 40 + (Math.abs(hash >> 8) % 60)) % 360;
  return `linear-gradient(135deg, hsl(${hue1} 70% 20%) 0%, hsl(${hue2} 60% 12%) 100%)`;
}

const TABS: Array<{ id: string; label: string; disabled?: boolean }> = [
  { id: 'recent', label: 'Recently viewed' },
  { id: 'my', label: 'My projects' },
  { id: 'starred', label: 'Starred', disabled: true },
  { id: 'templates', label: 'Templates', disabled: true },
];

export function ProjectShelf({ projects, onSelectProject }: ProjectShelfProps) {
  const [activeTab, setActiveTab] = useState<string>('recent');

  if (projects.length === 0) return null;

  return (
    <div className="w-full mt-auto pt-4">
      <div className="bg-zinc-950/80 backdrop-blur-md rounded-2xl border border-white/[0.06] p-5 pb-6">
        {/* Tabs + Browse All */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => !tab.disabled && setActiveTab(tab.id)}
                disabled={tab.disabled}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-xs font-medium transition-all",
                  activeTab === tab.id
                    ? "bg-white/10 text-white border border-white/10"
                    : tab.disabled
                      ? "text-zinc-700 cursor-not-allowed"
                      : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors group">
            Browse all
            <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Large thumbnail cards — Lovable-style */}
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
          {projects.slice(0, 8).map((project) => (
            <button
              key={project.id}
              onClick={() => onSelectProject(project.id)}
              className="flex-shrink-0 group text-left snap-start w-[220px] transition-all duration-200 hover:-translate-y-1"
            >
              {/* Thumbnail — large card */}
              <div className="w-full aspect-[16/10] rounded-xl overflow-hidden border border-white/[0.06] group-hover:border-white/15 bg-zinc-900 relative transition-all duration-200 group-hover:shadow-lg group-hover:shadow-black/40">
                {project.thumbnail_url ? (
                  <img
                    src={project.thumbnail_url}
                    alt={project.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ background: getSeededGradient(project.id) }}
                  >
                    <Globe size={24} className="text-zinc-600" />
                  </div>
                )}

                {/* Published badge */}
                {project.is_published && (
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-[10px] font-medium bg-black/60 text-zinc-400 backdrop-blur-sm border border-white/5">
                    Published
                  </span>
                )}

                {/* Star icon (top-right, for future use) */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Star size={14} className="text-zinc-500 hover:text-amber-400 transition-colors" />
                </div>
              </div>

              {/* Project info — below card */}
              <div className="flex items-center gap-2.5 mt-3 px-0.5">
                {/* App icon */}
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/60 to-primary/30 flex items-center justify-center shrink-0 border border-white/5">
                  <span className="text-[11px] font-bold text-white/80">
                    {project.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-zinc-200 truncate group-hover:text-white transition-colors">
                    {project.name}
                  </p>
                  <p className="text-[11px] text-zinc-600 mt-0.5">
                    Viewed {formatDistanceToNow(new Date(project.last_edited_at), { addSuffix: false })} ago
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
