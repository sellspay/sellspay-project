import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { HelpCircle, Sparkles, MessageSquare, Megaphone, ThumbsUp, Layers } from 'lucide-react';

const categories = [
  { id: 'all', label: 'All', icon: Layers, gradient: 'from-primary to-accent' },
  { id: 'help', label: 'Help', icon: HelpCircle, gradient: 'from-emerald-500 to-teal-600' },
  { id: 'showcase', label: 'Showcase', icon: Sparkles, gradient: 'from-violet-500 to-purple-600' },
  { id: 'discussion', label: 'Discussion', icon: MessageSquare, gradient: 'from-sky-500 to-blue-600' },
  { id: 'promotion', label: 'Promotion', icon: Megaphone, gradient: 'from-amber-500 to-orange-600' },
  { id: 'feedback', label: 'Feedback', icon: ThumbsUp, gradient: 'from-rose-500 to-pink-600' },
];

interface CategoryFilterProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

export function CategoryFilter({ activeCategory, onCategoryChange }: CategoryFilterProps) {
  return (
    <div className="inline-flex flex-wrap justify-center gap-2 p-2 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/30">
      {categories.map((category) => {
        const isActive = activeCategory === category.id;
        const Icon = category.icon;
        
        return (
          <Button
            key={category.id}
            variant="ghost"
            size="sm"
            className={cn(
              "relative rounded-xl transition-all duration-300 px-4 h-10 font-medium",
              isActive 
                ? "bg-gradient-to-r text-white shadow-lg hover:opacity-90" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
            style={isActive ? {
              backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))`,
            } : undefined}
            onClick={() => onCategoryChange(category.id)}
          >
            {isActive && (
              <div 
                className={cn(
                  "absolute inset-0 rounded-xl bg-gradient-to-r opacity-100",
                  category.gradient
                )}
              />
            )}
            <span className="relative flex items-center gap-1.5">
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{category.label}</span>
            </span>
          </Button>
        );
      })}
    </div>
  );
}
