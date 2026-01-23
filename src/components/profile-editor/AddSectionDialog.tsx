import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
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

interface AddSectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddSection: (type: SectionType) => void;
}

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

export function AddSectionDialog({ open, onOpenChange, onAddSection }: AddSectionDialogProps) {
  const handleSelect = (type: SectionType) => {
    onAddSection(type);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Section</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
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
                      onClick={() => handleSelect(type)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted hover:border-primary/30 transition-colors text-left"
                    >
                      <div
                        className={`p-2 rounded-lg ${
                          type === 'image_with_text'
                            ? 'bg-rose-500/20 text-rose-400'
                            : type === 'gallery'
                            ? 'bg-purple-500/20 text-purple-400'
                            : type === 'video'
                            ? 'bg-blue-500/20 text-blue-400'
                            : type === 'collection'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{template.name}</p>
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
      </DialogContent>
    </Dialog>
  );
}
