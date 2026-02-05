import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import {
  GripVertical,
  Eye,
  EyeOff,
  Trash2,
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
import { ProfileSection, SectionType, SECTION_TEMPLATES } from './types';

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

interface SectionListProps {
  sections: ProfileSection[];
  onEdit: (section: ProfileSection) => void;
  onDelete: (sectionId: string) => void;
  onToggleVisibility: (sectionId: string) => void;
  activeSectionId?: string;
  loading: boolean;
}

export function SectionList({
  sections,
  onEdit,
  onDelete,
  onToggleVisibility,
  activeSectionId,
  loading,
}: SectionListProps) {
  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <p className="text-sm">No sections yet</p>
        <p className="text-xs mt-1">Click "Add" to add your first section</p>
      </div>
    );
  }

  return (
    <div className="p-2 space-y-1">
      {sections.map((section) => (
        <SortableItem
          key={section.id}
          section={section}
          isActive={section.id === activeSectionId}
          onEdit={() => onEdit(section)}
          onDelete={() => onDelete(section.id)}
          onToggleVisibility={() => onToggleVisibility(section.id)}
        />
      ))}
    </div>
  );
}

interface SortableItemProps {
  section: ProfileSection;
  isActive: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggleVisibility: () => void;
}

function SortableItem({
  section,
  isActive,
  onEdit,
  onDelete,
  onToggleVisibility,
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const template = SECTION_TEMPLATES.find((t) => t.type === section.section_type);
  const IconComponent = template ? ICON_MAP[template.icon] || Type : Type;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        flex items-center gap-2 p-3 rounded-lg border transition-colors cursor-pointer
        ${isDragging ? 'opacity-50' : ''}
        ${isActive 
          ? 'bg-primary/10 border-primary/30' 
          : 'bg-card border-border hover:border-primary/30'
        }
        ${!section.is_visible ? 'opacity-60' : ''}
      `}
      // AI-first: prevent opening the manual edit dialog from the list.
      onClick={(e) => {
        e.preventDefault();
      }}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {/* Icon */}
      <div className={`p-1.5 rounded ${section.section_type === 'image_with_text' ? 'bg-rose-500/20 text-rose-400' : 'bg-muted text-muted-foreground'}`}>
        <IconComponent className="w-4 h-4" />
      </div>

      {/* Label */}
      <span className="flex-1 text-sm font-medium text-foreground truncate">
        {template?.name || section.section_type}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onToggleVisibility}
        >
          {section.is_visible ? (
            <Eye className="w-3.5 h-3.5 text-muted-foreground" />
          ) : (
            <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
