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
    <nav className="inline-flex gap-2 p-2 rounded-2xl bg-card/50 backdrop-blur-xl border border-border/30">
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
              "relative rounded-xl transition-all duration-300 px-5 h-10 font-medium overflow-hidden",
              isActive 
                ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/25 hover:from-primary/90 hover:to-primary" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <Link to={item.path}>
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent" />
              )}
              <span className="relative flex items-center gap-2">
                <item.icon className="h-4 w-4" />
                {item.label}
              </span>
            </Link>
          </Button>
        );
      })}
    </nav>
  );
}
