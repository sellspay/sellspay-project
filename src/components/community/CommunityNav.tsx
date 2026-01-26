import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MessageSquare, Users, Star, HelpCircle, Megaphone } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/community', label: 'Threads', icon: MessageSquare, exact: true },
  { path: '/community/updates', label: 'Updates', icon: Megaphone },
  { path: '/community/discord', label: 'Discord', icon: Users },
  { path: '/community/spotlight', label: 'Spotlight', icon: Star },
  { path: '/faq', label: 'FAQ', icon: HelpCircle },
];

export function CommunityNav() {
  const location = useLocation();

  return (
    <nav className="w-full max-w-full overflow-x-auto scrollbar-thin pb-2 sm:pb-0 sm:overflow-visible">
      <div className="inline-flex gap-1 sm:gap-2 p-1.5 sm:p-2 rounded-xl sm:rounded-2xl bg-card/50 backdrop-blur-xl border border-border/30 min-w-max">
        {navItems.map((item) => {
          const isActive = item.exact 
            ? location.pathname === item.path
            : location.pathname.startsWith(item.path);
          
          return (
            <Button
              key={item.path}
              variant="ghost"
              size="sm"
              asChild
              className={cn(
                "relative rounded-lg sm:rounded-xl transition-all duration-300 px-3 sm:px-5 h-9 sm:h-10 font-medium overflow-hidden text-xs sm:text-sm whitespace-nowrap",
                isActive 
                  ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/25 hover:from-primary/90 hover:to-primary" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Link to={item.path}>
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent" />
                )}
                <span className="relative flex items-center gap-1.5 sm:gap-2">
                  <item.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>{item.label}</span>
                </span>
              </Link>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
