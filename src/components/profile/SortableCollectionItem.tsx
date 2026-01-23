import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CollectionRow from './CollectionRow';

interface Product {
  id: string;
  name: string;
  cover_image_url: string | null;
  youtube_url: string | null;
  preview_video_url: string | null;
  price_cents: number | null;
  currency: string | null;
  pricing_type?: string | null;
  created_at?: string | null;
  likeCount?: number;
  commentCount?: number;
}

interface Collection {
  id: string;
  name: string;
  cover_image_url: string | null;
  is_visible?: boolean;
  products: Product[];
  totalCount: number;
}

interface SortableCollectionItemProps {
  collection: Collection;
  isEditing: boolean;
  onToggleVisibility: (id: string, isVisible: boolean) => void;
}

export default function SortableCollectionItem({ 
  collection, 
  isEditing, 
  onToggleVisibility 
}: SortableCollectionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: collection.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isVisible = collection.is_visible !== false;

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`relative ${!isVisible && isEditing ? 'opacity-50' : ''}`}
    >
      {isEditing && (
        <div className="absolute -left-14 top-3 flex items-center gap-1 z-10">
          {/* Drag handle */}
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1.5 hover:bg-muted rounded"
          >
            <GripVertical className="w-5 h-5 text-muted-foreground" />
          </div>
          
          {/* Visibility toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onToggleVisibility(collection.id, !isVisible)}
          >
            {isVisible ? (
              <Eye className="w-4 h-4 text-muted-foreground" />
            ) : (
              <EyeOff className="w-4 h-4 text-destructive" />
            )}
          </Button>
        </div>
      )}
      
      <CollectionRow
        id={collection.id}
        name={collection.name}
        coverImage={collection.cover_image_url}
        products={collection.products}
        totalCount={collection.totalCount}
      />
    </div>
  );
}
