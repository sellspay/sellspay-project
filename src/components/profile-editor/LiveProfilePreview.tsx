import React, { memo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VerifiedBadge } from '@/components/ui/verified-badge';
import { Plus, GripVertical } from 'lucide-react';
import { ProfileSection, SectionStyleOptions } from './types';
import { SectionPreviewContent } from './previews/SectionPreviewContent';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';

interface Profile {
  id: string;
  username?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  banner_url?: string | null;
  background_url?: string | null;
  bio?: string | null;
  verified?: boolean | null;
  social_links?: Record<string, string> | null;
}

interface LiveProfilePreviewProps {
  profile: Profile;
  sections: ProfileSection[];
  selectedSectionId: string | null;
  onSelectSection: (id: string) => void;
  onReorderSections: (sections: ProfileSection[]) => void;
  onAddSectionAt: (index: number) => void;
}

// Sortable section wrapper component
const SortableSectionItem = memo(({ 
  section, 
  isSelected, 
  onSelect,
  onAddAbove,
  onAddBelow,
  isFirst,
  isLast,
}: { 
  section: ProfileSection;
  isSelected: boolean;
  onSelect: () => void;
  onAddAbove: () => void;
  onAddBelow: () => void;
  isFirst: boolean;
  isLast: boolean;
}) => {
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

  const getStyleClasses = (styleOptions: SectionStyleOptions) => {
    const classes: string[] = [];
    
    switch (styleOptions.colorScheme) {
      case 'dark':
        classes.push('bg-zinc-900 text-white');
        break;
      case 'black':
        classes.push('bg-black text-white');
        break;
      case 'light':
        classes.push('bg-zinc-100 text-zinc-900');
        break;
      case 'highlight':
        classes.push('bg-primary/10 text-foreground');
        break;
      default:
        classes.push('bg-white text-zinc-900');
    }
    
    switch (styleOptions.sectionHeight) {
      case 'small':
        classes.push('py-6');
        break;
      case 'large':
        classes.push('py-16');
        break;
      default:
        classes.push('py-10');
    }
    
    return classes.join(' ');
  };

  const backgroundStyle: React.CSSProperties = {};
  if (section.style_options?.backgroundImage) {
    backgroundStyle.backgroundImage = `url(${section.style_options.backgroundImage})`;
    backgroundStyle.backgroundSize = 'cover';
    backgroundStyle.backgroundPosition = 'center';
  }

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      {/* Add section button above */}
      {isFirst && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="outline"
            size="sm"
            className="h-6 px-2 text-xs bg-background shadow-md"
            onClick={(e) => {
              e.stopPropagation();
              onAddAbove();
            }}
          >
            <Plus className="h-3 w-3 mr-1" />
            Add section
          </Button>
        </div>
      )}
      
      <div
        className={cn(
          'relative cursor-pointer transition-all duration-200',
          getStyleClasses(section.style_options || {}),
          section.style_options?.backgroundWidth === 'full' ? 'w-full' : 'max-w-4xl mx-auto',
          isSelected && 'ring-2 ring-primary ring-offset-2',
          isDragging && 'opacity-50 z-50',
          !section.is_visible && 'opacity-40'
        )}
        style={backgroundStyle}
        onClick={onSelect}
      >
        {/* Background overlay */}
        {section.style_options?.backgroundImage && section.style_options?.backgroundOverlay && (
          <div 
            className="absolute inset-0 bg-black pointer-events-none"
            style={{ opacity: section.style_options.backgroundOverlay / 100 }}
          />
        )}
        
        {/* Drag handle - visible on hover */}
        <div
          className={cn(
            'absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded cursor-grab opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 shadow-sm z-10',
            isDragging && 'cursor-grabbing'
          )}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        
        {/* Section content */}
        <div className={cn(
          'relative z-0 px-6',
          section.style_options?.backgroundWidth !== 'full' && 'max-w-4xl mx-auto'
        )}>
          <SectionPreviewContent section={section} />
        </div>
        
        {/* Selection indicator */}
        {isSelected && (
          <div className="absolute top-2 right-2 z-10">
            <Badge variant="default" className="text-xs">Editing</Badge>
          </div>
        )}
      </div>
      
      {/* Add section button below */}
      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="outline"
          size="sm"
          className="h-6 px-2 text-xs bg-background shadow-md"
          onClick={(e) => {
            e.stopPropagation();
            onAddBelow();
          }}
        >
          <Plus className="h-3 w-3 mr-1" />
          Add section
        </Button>
      </div>
    </div>
  );
});

SortableSectionItem.displayName = 'SortableSectionItem';

export const LiveProfilePreview = memo(({
  profile,
  sections,
  selectedSectionId,
  onSelectSection,
  onReorderSections,
  onAddSectionAt,
}: LiveProfilePreviewProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex((s) => s.id === active.id);
      const newIndex = sections.findIndex((s) => s.id === over.id);
      
      const reorderedSections = arrayMove(sections, oldIndex, newIndex).map(
        (section, index) => ({
          ...section,
          display_order: index,
        })
      );
      
      onReorderSections(reorderedSections);
    }
  };

  const backgroundStyle: React.CSSProperties = {};
  if (profile.background_url) {
    backgroundStyle.backgroundImage = `url(${profile.background_url})`;
    backgroundStyle.backgroundSize = 'cover';
    backgroundStyle.backgroundPosition = 'center';
    backgroundStyle.backgroundAttachment = 'fixed';
  }

  return (
    <div 
      className="min-h-full bg-background"
      style={backgroundStyle}
    >
      {/* Fixed Header Section (Read-only) */}
      <div className="relative">
        {/* Non-editable overlay indicator */}
        <div className="absolute inset-0 pointer-events-none z-10">
          <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
            Edit in Settings
          </div>
        </div>
        
        {/* Banner */}
        <div className="relative h-48 bg-gradient-to-b from-zinc-800 to-zinc-900 overflow-hidden">
          {profile.banner_url && (
            <img
              src={profile.banner_url}
              alt="Banner"
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
        
        {/* Profile Info */}
        <div className="relative px-6 pb-6 -mt-16">
          <div className="flex items-end gap-4">
            <Avatar className="h-28 w-28 border-4 border-background shadow-lg">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                {profile.full_name?.charAt(0) || profile.username?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 pb-2">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground">
                  {profile.full_name || profile.username || 'Creator'}
                </h1>
                {profile.verified && <VerifiedBadge size="md" />}
              </div>
              {profile.username && (
                <p className="text-muted-foreground">@{profile.username}</p>
              )}
            </div>
          </div>
          
          {profile.bio && (
            <p className="mt-4 text-muted-foreground max-w-2xl">{profile.bio}</p>
          )}
        </div>
        
        {/* Tabs placeholder */}
        <div className="border-b px-6">
          <div className="flex gap-6">
            <button className="pb-3 text-sm font-medium border-b-2 border-primary text-primary">
              Home
            </button>
            <button className="pb-3 text-sm font-medium text-muted-foreground hover:text-foreground">
              Products
            </button>
            <button className="pb-3 text-sm font-medium text-muted-foreground hover:text-foreground">
              Collections
            </button>
          </div>
        </div>
      </div>
      
      {/* Editable Sections Area */}
      <div className="py-6 space-y-6">
        {sections.length === 0 ? (
          <div className="text-center py-16 mx-6 border-2 border-dashed border-muted-foreground/25 rounded-lg">
            <p className="text-muted-foreground mb-4">No sections yet</p>
            <Button
              variant="outline"
              onClick={() => onAddSectionAt(0)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add your first section
            </Button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sections.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              {sections.map((section, index) => (
                <SortableSectionItem
                  key={section.id}
                  section={section}
                  isSelected={selectedSectionId === section.id}
                  onSelect={() => onSelectSection(section.id)}
                  onAddAbove={() => onAddSectionAt(index)}
                  onAddBelow={() => onAddSectionAt(index + 1)}
                  isFirst={index === 0}
                  isLast={index === sections.length - 1}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
});

LiveProfilePreview.displayName = 'LiveProfilePreview';
