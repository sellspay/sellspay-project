import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Globe, ArrowRight, Star, Layout } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShelfProject {
  id: string;
  name: string;
  thumbnail_url: string | null;
  last_edited_at: string;
  is_published?: boolean;
  is_starred?: boolean;
}

interface ProjectShelfProps {
  projects: ShelfProject[];
  onSelectProject: (id: string) => void;
  onToggleStar?: (id: string) => void;
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

// Built-in templates
const TEMPLATES = [
  { id: 'tpl-saas', name: 'SaaS Dashboard', description: 'Analytics dashboard with charts, stats, and activity feed', prompt: 'Build a premium dark-mode SaaS analytics dashboard...' },
  { id: 'tpl-portfolio', name: 'Portfolio Site', description: 'Minimalist portfolio with project showcase and about section', prompt: '' },
  { id: 'tpl-ecommerce', name: 'E-Commerce Store', description: 'Product landing page with hero, collection, and reviews', prompt: '' },
  { id: 'tpl-landing', name: 'Landing Page', description: 'Modern startup landing page with CTA and features grid', prompt: '' },
  { id: 'tpl-blog', name: 'Blog / Magazine', description: 'Editorial blog layout with featured posts and categories', prompt: '' },
  { id: 'tpl-linktree', name: 'Link in Bio', description: 'Personal link tree with social links and bio', prompt: '' },
];

type TabId = 'recent' | 'my' | 'starred' | 'templates';

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'recent', label: 'Recently viewed' },
  { id: 'my', label: 'My projects' },
  { id: 'starred', label: 'Starred' },
  { id: 'templates', label: 'Templates' },
];

export function ProjectShelf({ projects, onSelectProject, onToggleStar }: ProjectShelfProps) {
  const [activeTab, setActiveTab] = useState<TabId>('recent');

  const getFilteredProjects = (): ShelfProject[] => {
    switch (activeTab) {
      case 'recent':
        return projects.slice(0, 8);
      case 'my':
        return projects;
      case 'starred':
        return projects.filter(p => p.is_starred);
      default:
        return [];
    }
  };

  const filteredProjects = getFilteredProjects();
  const showTemplates = activeTab === 'templates';

  if (projects.length === 0 && activeTab !== 'templates') return null;

  return (
    <div className="w-full mt-auto pt-4">
      <div className="bg-zinc-950/80 backdrop-blur-md rounded-2xl border border-white/[0.08] p-6">
        {/* Tabs + Browse All */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-medium transition-all",
                  activeTab === tab.id
                    ? "bg-white/10 text-white border border-white/10"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                )}
              >
                {tab.label}
                {tab.id === 'starred' && (
                  <span className="ml-1 text-[10px] text-zinc-600">
                    {projects.filter(p => p.is_starred).length || ''}
                  </span>
                )}
              </button>
            ))}
          </div>
          {!showTemplates && (
            <button className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors group">
              Browse all
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}
        </div>

        {/* Templates View */}
        {showTemplates && (
          <div className="flex gap-5 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
            {TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => onSelectProject(template.id)}
                className="flex-shrink-0 group text-left snap-start w-[320px] transition-all duration-200 hover:-translate-y-1"
              >
                <div
                  className="w-full aspect-[16/10] rounded-xl overflow-hidden border border-white/[0.08] group-hover:border-white/20 bg-zinc-900 relative transition-all duration-200 group-hover:shadow-lg group-hover:shadow-black/50 flex items-center justify-center"
                  style={{ background: getSeededGradient(template.id) }}
                >
                  <Layout size={28} className="text-zinc-500 group-hover:text-zinc-400 transition-colors" />
                  <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded text-[10px] font-medium bg-black/60 text-zinc-400 backdrop-blur-sm border border-white/5">
                    Template
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-3 px-0.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500/40 to-rose-500/30 flex items-center justify-center shrink-0 border border-white/5">
                    <Layout size={14} className="text-white/70" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-200 truncate group-hover:text-white transition-colors">
                      {template.name}
                    </p>
                    <p className="text-[11px] text-zinc-600 mt-0.5 truncate">
                      {template.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Projects View */}
        {!showTemplates && filteredProjects.length > 0 && (
          <div className="flex gap-5 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
            {filteredProjects.map((project) => (
              <button
                key={project.id}
                onClick={() => onSelectProject(project.id)}
                className="flex-shrink-0 group text-left snap-start w-[320px] transition-all duration-200 hover:-translate-y-1"
              >
                {/* Thumbnail */}
                <div className="w-full aspect-[16/10] rounded-xl overflow-hidden border border-white/[0.08] group-hover:border-white/20 bg-zinc-900 relative transition-all duration-200 group-hover:shadow-lg group-hover:shadow-black/50">
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
                      <Globe size={28} className="text-zinc-600" />
                    </div>
                  )}

                  {/* Published badge */}
                  {project.is_published && (
                    <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded text-[10px] font-medium bg-black/60 text-zinc-400 backdrop-blur-sm border border-white/5">
                      Published
                    </span>
                  )}

                  {/* Star icon */}
                  <div
                    className={cn(
                      "absolute top-2.5 right-2.5 transition-opacity",
                      project.is_starred ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleStar?.(project.id);
                    }}
                  >
                    <Star
                      size={16}
                      className={cn(
                        "transition-colors cursor-pointer",
                        project.is_starred
                          ? "text-amber-400 fill-amber-400"
                          : "text-zinc-500 hover:text-amber-400"
                      )}
                    />
                  </div>
                </div>

                {/* Project info */}
                <div className="flex items-center gap-3 mt-3 px-0.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/60 to-primary/30 flex items-center justify-center shrink-0 border border-white/5">
                    <span className="text-xs font-bold text-white/80">
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
        )}

        {/* Empty states */}
        {!showTemplates && filteredProjects.length === 0 && (
          <div className="text-center py-8">
            <p className="text-zinc-600 text-sm">
              {activeTab === 'starred'
                ? "No starred projects yet. Click the ★ on any project to save it here."
                : "No projects found."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
