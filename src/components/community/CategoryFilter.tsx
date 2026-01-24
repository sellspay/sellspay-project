import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { HelpCircle, Sparkles, MessageSquare, Megaphone, ThumbsUp } from 'lucide-react';

const categories = [
  { id: 'all', label: 'All', icon: null },
  { id: 'help', label: 'Help & Advice', icon: HelpCircle },
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
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => (
        <Button
          key={category.id}
          variant={activeCategory === category.id ? 'default' : 'outline'}
          size="sm"
          className={cn(
            "rounded-full transition-all",
            activeCategory === category.id && "shadow-md"
          )}
          onClick={() => onCategoryChange(category.id)}
        >
          {category.icon && <category.icon className="h-4 w-4 mr-1.5" />}
          {category.label}
        </Button>
      ))}
    </div>
  );
}
