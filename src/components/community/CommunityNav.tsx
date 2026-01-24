import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MessageSquare, Users, Star, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/community', label: 'Threads', icon: MessageSquare, exact: true },
  { path: '/community/discord', label: 'Discord', icon: Users },
  { path: '/community/spotlight', label: 'Spotlight', icon: Star },
  { path: '/faq', label: 'FAQ', icon: HelpCircle },
];

export function CommunityNav() {
  const location = useLocation();

  return (
    <nav className="flex flex-wrap gap-2">
      {navItems.map((item) => {
        const isActive = item.exact 
          ? location.pathname === item.path
          : location.pathname.startsWith(item.path);
        
        return (
          <Button
            key={item.path}
            variant={isActive ? 'default' : 'ghost'}
            size="sm"
            asChild
            className={cn(
              "rounded-full",
              isActive && "shadow-md"
            )}
          >
            <Link to={item.path}>
              <item.icon className="h-4 w-4 mr-2" />
              {item.label}
            </Link>
          </Button>
        );
      })}
    </nav>
  );
}
