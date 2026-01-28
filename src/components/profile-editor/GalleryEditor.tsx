import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, X, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
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
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ProfileSection } from './types';

interface GalleryImage {
  url: string;
  altText?: string;
  id?: string;
}

interface SortableGalleryImageProps {
  id: string;
  index: number;
  image: GalleryImage | null;
  sectionId: string;
  onReplace: (index: number) => void;
  onRemove: (index: number) => void;
  onUpload: (index: number) => void;
}

function SortableGalleryImage({ 
  id, 
  index, 
  image, 
  sectionId, 
  onReplace, 
  onRemove, 
  onUpload 
}: SortableGalleryImageProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !image?.url });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  if (image?.url) {
    return (
      <div 
        ref={setNodeRef} 
        style={style} 
        className={cn(
          "relative group",
          isDragging && "ring-2 ring-primary rounded-lg"
        )}
      >
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="absolute top-1 left-1 z-10 p-1 bg-black/50 rounded cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical className="h-4 w-4 text-white" />
        </div>
        
        <img
          src={image.url}
          alt={image.altText || ''}
          className="w-full aspect-square object-cover rounded-lg"
        />
        <div className="absolute bottom-1 left-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="secondary"
            size="sm"
            className="flex-1 text-xs h-7"
            onClick={() => onReplace(index)}
          >
            Replace
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="text-xs h-7"
            onClick={() => onRemove(index)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
        <input
          id={`gallery-upload-${sectionId}-${index}`}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              onUpload(index);
            }
          }}
        />
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style} className="space-y-1">
      <div
        className="aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => onUpload(index)}
      >
        <Upload className="h-5 w-5 mb-1 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{index + 1}</span>
      </div>
      <input
        id={`gallery-upload-${sectionId}-${index}`}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            onUpload(index);
          }
        }}
      />
    </div>
  );
}

interface GalleryEditorProps {
  section: ProfileSection;
  onUpload: (file: File, onSuccess: (url: string) => void) => void;
  updateContent: (updates: Record<string, any>) => void;
}

export function GalleryEditor({ section, onUpload, updateContent }: GalleryEditorProps) {
  const galleryImages: (GalleryImage | null)[] = (section.content as any).images || [];
  const galleryPreset = section.style_options?.preset || 'style1';
  
  // Fix: Masonry (style3) = 4, 3x2 (style1) = 6, 2x3 (style2) = 6
  const galleryImageCount = galleryPreset === 'style3' ? 4 : 6;
  const galleryColumns = galleryPreset === 'style2' ? 2 : (galleryPreset === 'style3' ? 2 : 3);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Create stable IDs for sortable items
  const imageSlots = useMemo(() => {
    return Array.from({ length: galleryImageCount }, (_, index) => {
      const img = galleryImages[index];
      return {
        id: img?.id || `slot-${index}`,
        index,
        image: img || null,
      };
    });
  }, [galleryImages, galleryImageCount]);

  const sortableIds = useMemo(() => 
    imageSlots.filter(slot => slot.image?.url).map(slot => slot.id),
    [imageSlots]
  );

  const handleGalleryImageUpload = (file: File, index: number) => {
    onUpload(file, (url) => {
      const newImages = [...galleryImages];
      newImages[index] = { url, altText: '', id: `img-${Date.now()}` };
      updateContent({ images: newImages });
    });
  };

  const handleGalleryImageRemove = (index: number) => {
    const newImages = [...galleryImages];
    newImages[index] = null;
    updateContent({ images: newImages.filter(Boolean) });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const filledImages = galleryImages.filter((img): img is GalleryImage => !!img?.url);
      const oldIndex = filledImages.findIndex(img => img.id === active.id);
      const newIndex = filledImages.findIndex(img => img.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedImages = arrayMove(filledImages, oldIndex, newIndex);
        updateContent({ images: reorderedImages });
      }
    }
  };

  const handleUploadClick = (index: number) => {
    document.getElementById(`gallery-upload-${section.id}-${index}`)?.click();
  };

  const handleFileChange = (index: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleGalleryImageUpload(file, index);
  };

  // Separate filled and empty slots
  const filledImages = galleryImages.filter((img): img is GalleryImage => !!img?.url);
  const emptySlotCount = galleryImageCount - filledImages.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Gallery Images ({filledImages.length}/{galleryImageCount})</Label>
        {filledImages.length > 1 && (
          <span className="text-xs text-muted-foreground">Drag to reorder</span>
        )}
      </div>
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={sortableIds} strategy={rectSortingStrategy}>
          <div className={cn("grid gap-2", galleryColumns === 2 ? "grid-cols-2" : "grid-cols-3")}>
            {/* Render filled images first (sortable) */}
            {filledImages.map((img, displayIndex) => (
              <SortableGalleryImage
                key={img.id || `filled-${displayIndex}`}
                id={img.id || `filled-${displayIndex}`}
                index={displayIndex}
                image={img}
                sectionId={section.id}
                onReplace={() => handleUploadClick(displayIndex)}
                onRemove={() => handleGalleryImageRemove(
                  galleryImages.findIndex(gi => gi?.id === img.id)
                )}
                onUpload={() => handleUploadClick(displayIndex)}
              />
            ))}
            
            {/* Render empty slots */}
            {Array.from({ length: emptySlotCount }, (_, i) => {
              const slotIndex = filledImages.length + i;
              return (
                <div key={`empty-${slotIndex}`} className="space-y-1">
                  <div
                    className="aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleUploadClick(slotIndex)}
                  >
                    <Upload className="h-5 w-5 mb-1 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{slotIndex + 1}</span>
                  </div>
                  <input
                    id={`gallery-upload-${section.id}-${slotIndex}`}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange(slotIndex)}
                  />
                </div>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
      
      {/* Hidden file inputs for filled images */}
      {filledImages.map((_, index) => (
        <input
          key={`file-input-${index}`}
          id={`gallery-upload-${section.id}-${index}`}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange(index)}
        />
      ))}
    </div>
  );
}
