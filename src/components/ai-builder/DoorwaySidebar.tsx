import React from 'react';
import { Home, FolderOpen, Layout, Plus, CreditCard, Menu, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useIsMobile } from '@/hooks/use-mobile';
import sellspayLogo from '@/assets/sellspay-s-logo-new.png';

interface DoorwaySidebarProject {
  id: string;
  name: string;
  last_edited_at: string;
}

interface DoorwaySidebarProps {
  projects: DoorwaySidebarProject[];
  onSelectProject: (id: string) => void;
  onNewProject: () => void;
  credits?: number;
}

function SidebarContent({ projects, onSelectProject, onNewProject, credits }: DoorwaySidebarProps) {
  return (
    <div className="h-full flex flex-col bg-zinc-950 text-zinc-300">
      {/* Logo */}
      <div className="px-5 pt-6 pb-4 flex items-center gap-2.5">
        <img src={sellspayLogo} alt="Logo" className="w-7 h-7 rounded-lg" />
        <span className="text-base font-semibold text-white tracking-tight">VibeCoder</span>
      </div>

      {/* Nav */}
      <nav className="px-3 space-y-0.5 mt-2">
        <NavItem icon={Home} label="Home" active />
        <NavItem icon={FolderOpen} label="My Projects" />
        <NavItem icon={Layout} label="Templates" badge="Soon" />
      </nav>

      {/* Divider */}
      <div className="mx-4 my-4 h-px bg-white/5" />

      {/* Recent Projects */}
      <div className="flex-1 overflow-y-auto px-3">
        <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-widest px-2 mb-2">Recent</p>
        <div className="space-y-0.5">
          {projects.slice(0, 5).map((p) => (
            <button
              key={p.id}
              onClick={() => onSelectProject(p.id)}
              className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-left hover:bg-white/5 transition-colors group"
            >
              <FolderOpen size={14} className="text-zinc-600 group-hover:text-zinc-400 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-zinc-400 group-hover:text-white truncate transition-colors">{p.name}</p>
                <p className="text-[10px] text-zinc-700">{formatDistanceToNow(new Date(p.last_edited_at), { addSuffix: true })}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom */}
      <div className="px-4 pb-5 pt-3 space-y-3 border-t border-white/5">
        {credits !== undefined && (
          <div className="flex items-center gap-2 px-2 py-1.5">
            <CreditCard size={14} className="text-zinc-600" />
            <span className="text-xs text-zinc-500">{credits} credits</span>
          </div>
        )}
        <button
          onClick={onNewProject}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 text-white text-sm font-medium hover:from-orange-400 hover:to-rose-400 transition-all shadow-lg shadow-orange-500/10"
        >
          <Plus size={16} />
          New Project
        </button>
      </div>
    </div>
  );
}

function NavItem({ icon: Icon, label, active, badge }: { icon: React.ElementType; label: string; active?: boolean; badge?: string }) {
  return (
    <button
      className={cn(
        "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
        active
          ? "bg-white/5 text-white"
          : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]"
      )}
    >
      <Icon size={16} />
      <span className="flex-1 text-left">{label}</span>
      {badge && (
        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-500 font-medium">{badge}</span>
      )}
    </button>
  );
}

export function DoorwaySidebar(props: DoorwaySidebarProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <button className="absolute top-6 right-6 z-20 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white transition-all backdrop-blur-sm">
            <Menu size={18} />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-[280px] bg-zinc-950 border-zinc-800">
          <VisuallyHidden>
            <SheetTitle>Navigation</SheetTitle>
          </VisuallyHidden>
          <SidebarContent {...props} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className="w-[260px] shrink-0 border-r border-white/5 h-full">
      <SidebarContent {...props} />
    </div>
  );
}
