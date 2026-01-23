import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Type,
  Image,
  LayoutList,
  LayoutGrid,
  Play,
  Layers,
  User,
  Heading,
  Minus,
} from 'lucide-react';
import { SectionType, SECTION_TEMPLATES } from './types';

const ICON_MAP: Record<string, React.ElementType> = {
  Type,
  Image,
  LayoutList,
  LayoutGrid,
  Play,
  Layers,
  User,
  Heading,
  Minus,
};

interface AddSectionPanelProps {
  onAddSection: (type: SectionType) => void;
  onBack: () => void;
}

export function AddSectionPanel({ onAddSection, onBack }: AddSectionPanelProps) {
  const categories = [
    {
      name: 'Content',
      types: ['text', 'headline', 'about_me'] as SectionType[],
    },
    {
      name: 'Media',
      types: ['image', 'image_with_text', 'gallery', 'video'] as SectionType[],
    },
    {
      name: 'Products',
      types: ['collection'] as SectionType[],
    },
    {
      name: 'Layout',
      types: ['divider'] as SectionType[],
    },
  ];

  return (
    <div className="p-4">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to sections
      </button>

      <h3 className="text-lg font-semibold mb-4">Add New Section</h3>

      <div className="space-y-6">
        {categories.map((category) => (
          <div key={category.name}>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              {category.name}
            </h4>
            <div className="space-y-1">
              {category.types.map((type) => {
                const template = SECTION_TEMPLATES.find((t) => t.type === type);
                if (!template) return null;
                
                const IconComponent = ICON_MAP[template.icon] || Type;

                return (
                  <button
                    key={type}
                    onClick={() => onAddSection(type)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted hover:border-primary/30 transition-colors text-left"
                  >
                    <div className={`p-2 rounded-lg ${
                      type === 'image_with_text' ? 'bg-rose-500/20 text-rose-400' :
                      type === 'gallery' ? 'bg-purple-500/20 text-purple-400' :
                      type === 'video' ? 'bg-blue-500/20 text-blue-400' :
                      type === 'collection' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {template.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {template.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
