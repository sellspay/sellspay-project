import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { HelpCircle, Sparkles, MessageSquare, Megaphone, ThumbsUp, Layers } from 'lucide-react';

const categories = [
  { id: 'all', label: 'All', icon: Layers },
  { id: 'help', label: 'Help', icon: HelpCircle },
  { id: 'showcase', label: 'Showcase', icon: Sparkles },
  { id: 'discussion', label: 'Discussion', icon: MessageSquare },
  { id: 'promotion', label: 'Promotion', icon: Megaphone },
  { id: 'feedback', label: 'Feedback', icon: ThumbsUp },
];

interface CategoryFilterProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

export function CategoryFilter({ activeCategory, onCategoryChange }: CategoryFilterProps) {
  return (
    <div className="inline-flex flex-wrap justify-center gap-1.5 p-1.5 rounded-xl bg-muted/30 border border-border/40">
      {categories.map((category) => {
        const isActive = activeCategory === category.id;
        const Icon = category.icon;
        
        return (
          <Button
            key={category.id}
            variant="ghost"
            size="sm"
            className={cn(
              "rounded-lg transition-all duration-200 px-3 h-9 font-medium text-sm gap-1.5",
              isActive 
                ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
            onClick={() => onCategoryChange(category.id)}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{category.label}</span>
          </Button>
        );
      })}
    </div>
  );
}
