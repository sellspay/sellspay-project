import React from 'react';
import { Home, FolderOpen, Layout, Menu } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useIsMobile } from '@/hooks/use-mobile';
import sellspayLogo from '@/assets/sellspay-s-logo-new.png';
import { ProfileMenu } from './ProfileMenu';

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
  avatarUrl?: string | null;
  username?: string | null;
  subscriptionTier?: string | null;
  onSignOut?: () => void;
}

function SidebarContent({ projects, onSelectProject, onNewProject, credits, avatarUrl, username, subscriptionTier, onSignOut }: DoorwaySidebarProps) {
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

      {/* Bottom: Profile Section */}
      <div className="px-3 pb-5 pt-3 border-t border-white/5">
        {onSignOut ? (
          <div className="flex items-center gap-2.5">
            <ProfileMenu
              avatarUrl={avatarUrl}
              username={username}
              userCredits={credits ?? 0}
              subscriptionTier={subscriptionTier}
              onSignOut={onSignOut}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-zinc-300 truncate font-medium">{username || 'Creator'}</p>
              <p className="text-[11px] text-zinc-600">{(credits ?? 0).toLocaleString()} credits</p>
            </div>
          </div>
        ) : credits !== undefined ? (
          <div className="flex items-center gap-2 px-2 py-1.5">
            <span className="text-xs text-zinc-500">{credits} credits</span>
          </div>
        ) : null}
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
