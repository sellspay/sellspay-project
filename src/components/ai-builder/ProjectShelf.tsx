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
  { id: 'tpl-saas', name: 'SaaS Dashboard', description: 'Analytics dashboard with charts, stats, and activity feed', prompt: 'Build a premium dark-mode SaaS analytics dashboard with: a top stats bar showing MRR, active users, churn rate, and growth percentage with animated counters; a main area chart for revenue trends with gradient fills; a sidebar with quick actions. Use zinc-900 background, subtle purple/blue accent gradients, rounded-2xl cards with soft shadows, and smooth fade-in animations.' },
  { id: 'tpl-portfolio', name: 'Portfolio Site', description: 'Minimalist portfolio with project showcase and about section', prompt: 'Create a stunning minimalist portfolio for a senior product designer with: an animated hero section with a large serif headline; a curated project showcase grid with hover zoom effects; an about section with a bio and floating skill tags; a contact section with social links. Use off-white cream background with deep charcoal text, elegant serif/sans-serif font pairing, generous whitespace, and smooth scroll-triggered animations.' },
  { id: 'tpl-ecommerce', name: 'E-Commerce Store', description: 'Product landing page with hero, collection, and reviews', prompt: 'Design a luxury watch e-commerce landing page with: a cinematic full-bleed hero with parallax effect and bold headline; a featured collection row with horizontal scroll and product cards; a craftsmanship section with split layout; customer reviews with star ratings. Use deep black background with warm gold accents, sophisticated serif typography, and subtle grain texture overlay.' },
  { id: 'tpl-landing', name: 'Landing Page', description: 'Modern startup landing page with CTA and features grid', prompt: 'Build a modern startup landing page with: a bold hero section with gradient text headline and email signup CTA; a features grid with icons and descriptions; a testimonials section with avatars; a pricing table with 3 tiers; a FAQ accordion; and a footer with social links. Use a dark theme with vibrant gradient accents, clean sans-serif typography, and smooth entrance animations.' },
  { id: 'tpl-blog', name: 'Blog / Magazine', description: 'Editorial blog layout with featured posts and categories', prompt: 'Create an editorial blog homepage with: a large featured post hero with image overlay and category badge; a 3-column grid of recent posts with thumbnails and excerpts; a sidebar with categories, popular posts, and newsletter signup; clean typography with serif headings and sans-serif body. Use a warm cream/white palette with subtle borders and reading-optimized spacing.' },
  { id: 'tpl-linktree', name: 'Link in Bio', description: 'Personal link tree with social links and bio', prompt: 'Create a stylish link-in-bio page with: a profile avatar and name at the top; a bio section; a vertical stack of link cards with icons, labels, and hover animations; social media icons at the bottom. Use a dark gradient background, glassmorphism link cards, and smooth hover scale effects. Make it mobile-first and visually striking.' },
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

  // Filter projects based on active tab
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
      <div className="bg-zinc-950/80 backdrop-blur-md rounded-2xl border border-white/[0.06] p-5 pb-6">
        {/* Tabs + Browse All */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-xs font-medium transition-all",
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
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
            {TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => onSelectProject(template.id)}
                className="flex-shrink-0 group text-left snap-start w-[220px] transition-all duration-200 hover:-translate-y-1"
              >
                <div className="w-full aspect-[16/10] rounded-xl overflow-hidden border border-white/[0.06] group-hover:border-white/15 bg-zinc-900 relative transition-all duration-200 group-hover:shadow-lg group-hover:shadow-black/40 flex items-center justify-center"
                  style={{ background: getSeededGradient(template.id) }}
                >
                  <Layout size={24} className="text-zinc-500 group-hover:text-zinc-400 transition-colors" />
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-[10px] font-medium bg-black/60 text-zinc-400 backdrop-blur-sm border border-white/5">
                    Template
                  </span>
                </div>
                <div className="flex items-center gap-2.5 mt-3 px-0.5">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500/40 to-rose-500/30 flex items-center justify-center shrink-0 border border-white/5">
                    <Layout size={12} className="text-white/70" />
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
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
            {filteredProjects.map((project) => (
              <button
                key={project.id}
                onClick={() => onSelectProject(project.id)}
                className="flex-shrink-0 group text-left snap-start w-[220px] transition-all duration-200 hover:-translate-y-1"
              >
                {/* Thumbnail */}
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

                  {/* Star icon */}
                  <div 
                    className={cn(
                      "absolute top-2 right-2 transition-opacity",
                      project.is_starred ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleStar?.(project.id);
                    }}
                  >
                    <Star 
                      size={14} 
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
                <div className="flex items-center gap-2.5 mt-3 px-0.5">
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
