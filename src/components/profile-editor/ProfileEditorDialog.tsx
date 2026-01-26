import React, { useState, useEffect, memo, useCallback, useMemo, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { VerifiedBadge } from '@/components/ui/verified-badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  MeasuringStrategy,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  X, Plus, GripVertical, Eye, EyeOff, Trash2, Pencil,
  Link as LinkIcon, Settings, User, Download, Bookmark, Layers, Play,
  ChevronRight, Undo2, Redo2, Loader2, Check, AlertCircle, Save
} from 'lucide-react';
import { ProfileSection, SectionType, SECTION_TEMPLATES, AnimationType } from './types';
import { AddSectionPanel } from './AddSectionPanel';
import { EditSectionDialog } from './EditSectionDialog';
import { SectionPreviewContent } from './previews/SectionPreviewContent';
import { CreateCollectionInEditor } from './CreateCollectionInEditor';
import { getAnimationStyles, getAnimatedStyles } from './AnimationPicker';
import EditCollectionDialog from '@/components/profile/EditCollectionDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

import { useHistory, useHistoryKeyboard } from '@/hooks/useHistory';

interface Profile {
  id: string;
  username?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  banner_url?: string | null;
  background_url?: string | null;
  bio?: string | null;
  verified?: boolean | null;
  is_creator?: boolean | null;
  social_links?: unknown;
  show_recent_uploads?: boolean | null;
}

interface Product {
  id: string;
  name: string;
  cover_image_url: string | null;
  youtube_url: string | null;
  preview_video_url: string | null;
  price_cents: number | null;
  currency: string | null;
}

interface Collection {
  id: string;
  name: string;
  cover_image_url: string | null;
  is_visible: boolean;
  display_order: number;
  products: Product[];
  totalCount: number;
  style_options?: { animation?: AnimationType };
}

interface ProfileEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string;
  profile: Profile;
  collections: { id: string; name: string }[];
  onCollectionsChange?: () => void;
}

// Editor state for history tracking
interface EditorState {
  sections: ProfileSection[];
  collections: Collection[];
  showRecentUploads: boolean;
}

// Helper to get YouTube thumbnail
const getYouTubeThumbnail = (youtubeUrl: string | null): string | null => {
  if (!youtubeUrl) return null;
  let videoId = youtubeUrl;
  if (youtubeUrl.includes('youtube.com/watch')) {
    const url = new URL(youtubeUrl);
    videoId = url.searchParams.get('v') || youtubeUrl;
  } else if (youtubeUrl.includes('youtu.be/')) {
    videoId = youtubeUrl.split('youtu.be/')[1]?.split('?')[0] || youtubeUrl;
  } else if (youtubeUrl.includes('youtube.com/embed/')) {
    videoId = youtubeUrl.split('embed/')[1]?.split('?')[0] || youtubeUrl;
  }
  videoId = videoId.split('?')[0].split('&')[0];
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
};

// Sortable collection item for editor - mirrors CollectionRow display
const SortableCollectionCard = memo(({
  collection,
  sortableId,
  onEdit,
  onDelete,
  onToggleVisibility,
  onAnimationChange,
}: {
  collection: Collection;
  sortableId: string;
  onEdit: () => void;
  onDelete: () => void;
  onToggleVisibility: () => void;
  onAnimationChange?: (animation: AnimationType) => void;
}) => {
  const contentRef = React.useRef<HTMLDivElement>(null);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sortableId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? undefined : transition,
  };

  const currentAnimation = collection.style_options?.animation || 'none';

  const handlePreviewAnimation = () => {
    if (currentAnimation === 'none' || !contentRef.current) return;
    
    // Reset to initial animation state
    const initialStyles = getAnimationStyles(currentAnimation as AnimationType);
    Object.assign(contentRef.current.style, initialStyles);
    
    // Trigger reflow to restart animation
    void contentRef.current.offsetWidth;
    
    // Apply animated state after brief delay
    requestAnimationFrame(() => {
      if (contentRef.current) {
        const animatedStyles = getAnimatedStyles(currentAnimation as AnimationType);
        Object.assign(contentRef.current.style, animatedStyles);
      }
    });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative group bg-card/50 backdrop-blur-sm border border-border rounded-lg overflow-hidden p-4',
        isDragging && 'opacity-60 z-50 scale-[1.02]',
        !collection.is_visible && 'opacity-40'
      )}
    >
      {/* Animation indicator badge */}
      {currentAnimation !== 'none' && (
        <div className="absolute top-2 left-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
          <Badge variant="secondary" className="text-xs gap-1">
            ✨ {currentAnimation}
          </Badge>
        </div>
      )}
      
      {/* Content wrapper for animation preview */}
      <div ref={contentRef} className="transition-all duration-[600ms] ease-out">
        {/* Collection Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {collection.cover_image_url ? (
              <img
                src={collection.cover_image_url}
                alt={collection.name}
                className="w-12 h-12 rounded-lg object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                <Layers className="w-6 h-6 text-muted-foreground" />
              </div>
            )}
            <div className="text-left">
              <div className="flex items-center gap-1">
                <h3 className="text-lg font-semibold text-foreground">{collection.name}</h3>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" />
                {collection.totalCount} {collection.totalCount === 1 ? 'post' : 'posts'}
              </p>
            </div>
          </div>

          {/* Editor Controls */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <div
              className="p-2 rounded-lg bg-muted/50 cursor-grab hover:bg-muted transition-colors touch-none select-none"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="w-4 h-4 text-muted-foreground" />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onEdit}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleVisibility}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              {collection.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Products Grid */}
        {collection.products.length > 0 ? (
          <div className="grid grid-cols-3 gap-4">
            {collection.products.slice(0, 3).map((product) => {
              const thumbnail = product.cover_image_url || getYouTubeThumbnail(product.youtube_url);
              return (
                <div key={product.id} className="group/card">
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-muted border border-border">
                    {thumbnail ? (
                      <img src={thumbnail} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                        <Layers className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    {(product.preview_video_url || product.youtube_url) && (
                      <div className="absolute top-2 left-2 bg-background/80 rounded-full p-1.5">
                        <Play className="w-3 h-3 text-foreground" fill="currentColor" />
                      </div>
                    )}
                  </div>
                  <div className="mt-2">
                    <h4 className="font-medium text-foreground text-sm line-clamp-2">{product.name}</h4>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-8 text-center">
            <Layers className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No products in this collection</p>
            <Button variant="ghost" size="sm" onClick={onEdit} className="mt-2 text-primary">
              Add Products
            </Button>
          </div>
        )}

        {collection.totalCount > 3 && (
          <p className="text-xs text-muted-foreground mt-3 text-center">
            +{collection.totalCount - 3} more products
          </p>
        )}
      </div>

      {!collection.is_visible && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-lg pointer-events-none">
          <div className="flex items-center gap-2 text-muted-foreground">
            <EyeOff className="w-5 h-5" />
            <span className="font-medium">Hidden</span>
          </div>
        </div>
      )}
    </div>
  );
});

SortableCollectionCard.displayName = 'SortableCollectionCard';

// Sortable section item
const SortableSectionCard = memo(({
  section,
  sortableId,
  onEdit,
  onDelete,
  onToggleVisibility,
  onAnimationChange,
}: {
  section: ProfileSection;
  sortableId: string;
  onEdit: () => void;
  onDelete: () => void;
  onToggleVisibility: () => void;
  onAnimationChange?: (animation: AnimationType) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sortableId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? undefined : transition,
  };

  const currentAnimation = section.style_options?.animation || 'none';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative group bg-card/50 backdrop-blur-sm border border-border rounded-lg overflow-hidden',
        isDragging && 'opacity-60 z-50 shadow-lg scale-[1.01]',
        !section.is_visible && 'opacity-50'
      )}
    >
      {/* Animation indicator - show selected animation on hover */}
      {currentAnimation !== 'none' && (
        <div className="absolute top-2 left-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
          <Badge variant="secondary" className="text-xs gap-1">
            ✨ {currentAnimation}
          </Badge>
        </div>
      )}
      
      <div className="p-4 min-h-[80px]">
        <SectionPreviewContent section={section} />
      </div>

      <div className="absolute inset-0 z-20 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none group-hover:pointer-events-auto">
        <div
          className="p-2 rounded-lg bg-white/10 cursor-grab hover:bg-white/20 transition-colors touch-none select-none"
          onClick={(e) => e.stopPropagation()}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-5 h-5 text-white" />
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="bg-white/10 hover:bg-white/20 text-white border-0"
        >
          <Pencil className="w-4 h-4 mr-1" />
          Edit
        </Button>

        <Button
          variant="secondary"
          size="icon"
          onClick={(e) => { e.stopPropagation(); onToggleVisibility(); }}
          className="bg-white/10 hover:bg-white/20 text-white border-0"
        >
          {section.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </Button>

        <Button
          variant="secondary"
          size="icon"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="bg-destructive/20 hover:bg-destructive/40 text-destructive border-0"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
});

SortableSectionCard.displayName = 'SortableSectionCard';

export function ProfileEditorDialog({
  open,
  onOpenChange,
  profileId,
  profile,
  collections: initialCollections,
  onCollectionsChange,
}: ProfileEditorDialogProps) {
  // Core state
  const [sections, setSections] = useState<ProfileSection[]>([]);
  const [editorCollections, setEditorCollections] = useState<Collection[]>([]);
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [showRecentUploads, setShowRecentUploads] = useState(profile.show_recent_uploads !== false);
  const [loading, setLoading] = useState(true);
  
  // UI state - completely ephemeral, reset on close
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [editingSection, setEditingSection] = useState<ProfileSection | null>(null);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [deleteCollectionId, setDeleteCollectionId] = useState<string | null>(null);
  const [deleteSectionId, setDeleteSectionId] = useState<string | null>(null);
  const [previewSection, setPreviewSection] = useState<ProfileSection | null>(null);
  const [showCreateCollection, setShowCreateCollection] = useState(false);

  // Track if data has been fetched to enable autosave
  const [dataReady, setDataReady] = useState(false);

  // History management
  const {
    current: historyState,
    push: pushHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    reset: resetHistory,
  } = useHistory<EditorState>({ sections: [], collections: [], showRecentUploads: true });

  // Manual save state
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const saveAllChanges = useCallback(async () => {
    setSaveStatus('saving');
    try {
      // Save sections
      for (const section of sections) {
        const { error } = await supabase
          .from('profile_sections')
          .update({
            display_order: section.display_order,
            content: JSON.parse(JSON.stringify(section.content)),
            style_options: JSON.parse(JSON.stringify(section.style_options || {})),
            is_visible: section.is_visible,
          })
          .eq('id', section.id);
        if (error) throw error;
      }

      // Save collections order, visibility, and style_options
      for (const collection of editorCollections) {
        const { error } = await supabase
          .from('collections')
          .update({
            display_order: collection.display_order,
            is_visible: collection.is_visible,
            style_options: JSON.parse(JSON.stringify(collection.style_options || {})),
          })
          .eq('id', collection.id);
        if (error) throw error;
      }

      // Save recent uploads visibility
      await supabase
        .from('profiles')
        .update({ show_recent_uploads: showRecentUploads })
        .eq('id', profileId);

      setSaveStatus('saved');
      toast.success('Changes saved');
      onCollectionsChange?.();
      
      // Reset to idle after 2s
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Error saving changes:', error);
      setSaveStatus('error');
      toast.error('Failed to save changes');
    }
  }, [sections, editorCollections, showRecentUploads, profileId, onCollectionsChange]);

  // Enable keyboard shortcuts for undo/redo/save
  useHistoryKeyboard(undo, redo, canUndo, canRedo, open, saveAllChanges);

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const measuringConfig = useMemo(() => ({
    droppable: { strategy: MeasuringStrategy.Always },
  }), []);

  // Unified layout items
  type LayoutItem =
    | { kind: 'collection'; sortableId: string; id: string; display_order: number; data: Collection }
    | { kind: 'section'; sortableId: string; id: string; display_order: number; data: ProfileSection };

  const layoutItems = useMemo<LayoutItem[]>(() => {
    const collections: LayoutItem[] = editorCollections.map((c) => ({
      kind: 'collection',
      sortableId: `collection:${c.id}`,
      id: c.id,
      display_order: c.display_order ?? 0,
      data: c,
    }));

    const secs: LayoutItem[] = sections.map((s) => ({
      kind: 'section',
      sortableId: `section:${s.id}`,
      id: s.id,
      display_order: s.display_order ?? 0,
      data: s,
    }));

    return [...collections, ...secs].sort((a, b) => {
      if (a.display_order !== b.display_order) return a.display_order - b.display_order;
      return a.sortableId.localeCompare(b.sortableId);
    });
  }, [editorCollections, sections]);

  const layoutIds = useMemo(() => layoutItems.map((i) => i.sortableId), [layoutItems]);

  // Data fetching functions
  const fetchSections = async () => {
    try {
      const { data, error } = await supabase
        .from('profile_sections')
        .select('*')
        .eq('profile_id', profileId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return (data || []) as unknown as ProfileSection[];
    } catch (error) {
      console.error('Error fetching sections:', error);
      return [];
    }
  };

  const fetchCollections = async () => {
    try {
      const { data: collectionsData, error } = await supabase
        .from('collections')
        .select('id, name, cover_image_url, is_visible, display_order, style_options')
        .eq('creator_id', profileId)
        .order('display_order', { ascending: true });

      if (error) throw error;

      if (collectionsData && collectionsData.length > 0) {
        const collectionsWithProducts = await Promise.all(
          collectionsData.map(async (collection) => {
            const { data: items, count } = await supabase
              .from('collection_items')
              .select('product_id', { count: 'exact' })
              .eq('collection_id', collection.id)
              .order('display_order', { ascending: true })
              .limit(4);

            if (!items || items.length === 0) {
              return { 
                ...collection, 
                is_visible: collection.is_visible ?? true,
                display_order: collection.display_order ?? 0,
                style_options: (collection as any).style_options || {},
                products: [], 
                totalCount: 0 
              };
            }

            const productIds = items.map((item) => item.product_id);
            const { data: productsData } = await supabase
              .from('products')
              .select('id, name, cover_image_url, youtube_url, preview_video_url, price_cents, currency')
              .in('id', productIds)
              .eq('status', 'published');

            return {
              ...collection,
              is_visible: collection.is_visible ?? true,
              display_order: collection.display_order ?? 0,
              style_options: (collection as any).style_options || {},
              products: productsData || [],
              totalCount: count || 0,
            };
          })
        );
        return collectionsWithProducts;
      }
      return [];
    } catch (error) {
      console.error('Error fetching collections:', error);
      return [];
    }
  };

  const fetchRecentProducts = async () => {
    try {
      const { data } = await supabase
        .from('products')
        .select('id, name, cover_image_url, youtube_url, preview_video_url, price_cents, currency')
        .eq('creator_id', profileId)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(6);

      return data || [];
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    setDataReady(false);
    try {
      // Fetch profile's show_recent_uploads from the database directly
      const fetchShowRecentUploads = async (): Promise<boolean> => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('show_recent_uploads')
            .eq('id', profileId)
            .single();
          
          if (error || !data) {
            // Fallback to prop value or default true
            return profile.show_recent_uploads !== false;
          }
          return data.show_recent_uploads !== false;
        } catch {
          return profile.show_recent_uploads !== false;
        }
      };

      const [sectionsData, collectionsData, productsData, showRecentFromDB] = await Promise.all([
        fetchSections(),
        fetchCollections(),
        fetchRecentProducts(),
        fetchShowRecentUploads(),
      ]);

      setSections(sectionsData);
      setEditorCollections(collectionsData);
      setRecentProducts(productsData);
      setShowRecentUploads(showRecentFromDB);

      // Reset history to initial state using fetched database value
      const initialState = {
        sections: sectionsData,
        collections: collectionsData,
        showRecentUploads: showRecentFromDB,
      };
      resetHistory(initialState);
      setDataReady(true);
    } finally {
      setLoading(false);
    }
  };

  // Effect to fetch data and reset all UI state when dialog opens/closes
  useEffect(() => {
    if (open && profileId) {
      // Reset ALL UI state on open
      setPreviewSection(null);
      setEditingSection(null);
      setEditingCollection(null);
      setShowAddPanel(false);
      setDeleteCollectionId(null);
      setDeleteSectionId(null);
      setShowCreateCollection(false);
      
      // Always fetch fresh data when dialog opens to ensure visibility state is accurate
      fetchAllData();
    } else if (!open) {
      // Reset everything on close
      setPreviewSection(null);
      setEditingSection(null);
      setEditingCollection(null);
      setShowAddPanel(false);
      setDataReady(false);
    }
  }, [open, profileId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setPreviewSection(null);
      setEditingSection(null);
      setEditingCollection(null);
    };
  }, []);

  // Handle layout drag end
  const handleLayoutDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = layoutItems.findIndex((i) => i.sortableId === String(active.id));
    const newIndex = layoutItems.findIndex((i) => i.sortableId === String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;

    const moved = arrayMove(layoutItems, oldIndex, newIndex);

    const nextCollectionsById = new Map(editorCollections.map((c) => [c.id, { ...c }]));
    const nextSectionsById = new Map(sections.map((s) => [s.id, { ...s }]));

    moved.forEach((item, idx) => {
      if (item.kind === 'collection') {
        const c = nextCollectionsById.get(item.id);
        if (c) c.display_order = idx;
      } else {
        const s = nextSectionsById.get(item.id);
        if (s) s.display_order = idx;
      }
    });

    const newCollections = Array.from(nextCollectionsById.values()).sort(
      (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)
    );
    const newSections = Array.from(nextSectionsById.values()).sort(
      (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)
    );

    setEditorCollections(newCollections);
    setSections(newSections);
    pushHistory({ sections: newSections, collections: newCollections, showRecentUploads });
  }, [layoutItems, editorCollections, sections, showRecentUploads, pushHistory]);

  const toggleCollectionVisibility = useCallback((collectionId: string) => {
    setEditorCollections(prev => {
      const updated = prev.map((c) => c.id === collectionId ? { ...c, is_visible: !c.is_visible } : c);
      pushHistory({ sections, collections: updated, showRecentUploads });
      return updated;
    });
  }, [sections, showRecentUploads, pushHistory]);

  const toggleSectionVisibility = useCallback((sectionId: string) => {
    setSections(prev => {
      const updated = prev.map((s) => s.id === sectionId ? { ...s, is_visible: !s.is_visible } : s);
      pushHistory({ sections: updated, collections: editorCollections, showRecentUploads });
      return updated;
    });
  }, [editorCollections, showRecentUploads, pushHistory]);

  const updateSectionAnimation = useCallback((sectionId: string, animation: AnimationType) => {
    setSections(prev => {
      const updated = prev.map((s) => 
        s.id === sectionId 
          ? { ...s, style_options: { ...s.style_options, animation } }
          : s
      );
      pushHistory({ sections: updated, collections: editorCollections, showRecentUploads });
      return updated;
    });
  }, [editorCollections, showRecentUploads, pushHistory]);

  const updateCollectionAnimation = useCallback((collectionId: string, animation: AnimationType) => {
    setEditorCollections(prev => {
      const updated = prev.map((c) => 
        c.id === collectionId 
          ? { ...c, style_options: { ...c.style_options, animation } }
          : c
      );
      pushHistory({ sections, collections: updated, showRecentUploads });
      return updated;
    });
  }, [sections, showRecentUploads, pushHistory]);

  const toggleRecentUploadsVisibility = useCallback(() => {
    setShowRecentUploads(prev => {
      const newValue = !prev;
      pushHistory({ sections, collections: editorCollections, showRecentUploads: newValue });
      return newValue;
    });
  }, [sections, editorCollections, pushHistory]);

  const handleDeleteCollection = async (collectionId: string) => {
    try {
      await supabase.from('collection_items').delete().eq('collection_id', collectionId);
      const { error } = await supabase.from('collections').delete().eq('id', collectionId);
      if (error) throw error;

      setEditorCollections(prev => prev.filter((c) => c.id !== collectionId));
      setDeleteCollectionId(null);
      toast.success('Collection deleted');
      onCollectionsChange?.();
    } catch (error) {
      console.error('Error deleting collection:', error);
      toast.error('Failed to delete collection');
    }
  };

  const addSection = async (type: SectionType, presetId?: string) => {
    setPreviewSection(null);
    
    const template = SECTION_TEMPLATES.find((t) => t.type === type);
    if (!template) return;

    const preset = presetId ? template.presets.find(p => p.id === presetId) : template.presets[0];
    const content = {
      ...JSON.parse(JSON.stringify(template.defaultContent)),
      ...(preset?.contentOverrides || {}),
    };
    const styleOptions = {
      ...(preset?.styleOptions || {}),
      preset: presetId || preset?.id || 'style1',
    };

    const sectionToInsert = {
      profile_id: profileId,
      section_type: type as string,
      display_order: sections.length,
      content: content as Record<string, unknown>,
      style_options: styleOptions as Record<string, unknown>,
      is_visible: true,
    };

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await supabase
        .from('profile_sections')
        .insert([sectionToInsert] as any)
        .select()
        .single();

      if (error) throw error;

      const createdSection = data as unknown as ProfileSection;
      setSections(prev => [...prev, createdSection]);
      setShowAddPanel(false);
      toast.success(`${template.name} section added`);
    } catch (error) {
      console.error('Error adding section:', error);
      toast.error('Failed to add section');
    }
  };

  const updateSection = useCallback((updatedSection: ProfileSection) => {
    setSections(prev => {
      const updated = prev.map((s) => (s.id === updatedSection.id ? updatedSection : s));
      pushHistory({ sections: updated, collections: editorCollections, showRecentUploads });
      return updated;
    });
    setEditingSection(updatedSection);
  }, [editorCollections, showRecentUploads, pushHistory]);

  const deleteSection = async (sectionId: string) => {
    try {
      const { error } = await supabase.from('profile_sections').delete().eq('id', sectionId);
      if (error) throw error;
      setSections(prev => prev.filter((s) => s.id !== sectionId));
      setEditingSection(null);
      toast.success('Section deleted');
    } catch (error) {
      console.error('Error deleting section:', error);
      toast.error('Failed to delete section');
    }
  };

  // Apply undo/redo state
  useEffect(() => {
    if (historyState && dataReady) {
      setSections(historyState.sections);
      setEditorCollections(historyState.collections);
      setShowRecentUploads(historyState.showRecentUploads);
    }
  }, [historyState, dataReady]);

  const handleClose = () => {
    // Clear all state before closing
    setPreviewSection(null);
    setEditingSection(null);
    setEditingCollection(null);
    setShowAddPanel(false);
    onOpenChange(false);
  };

  const socialLinks = profile.social_links && typeof profile.social_links === 'object' 
    ? profile.social_links as Record<string, string> 
    : {};

  const hasContent = recentProducts.length > 0 || editorCollections.length > 0 || sections.length > 0;

  return (
    <TooltipProvider>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-[100vw] w-[100vw] h-[100vh] max-h-[100vh] p-0 gap-0 rounded-none border-0 [&>button]:hidden overflow-hidden">
          <VisuallyHidden.Root>
            <DialogTitle>Profile Editor</DialogTitle>
            <DialogDescription>Customize your profile layout and sections</DialogDescription>
          </VisuallyHidden.Root>
          
          {/* Fixed background */}
          <div 
            className="absolute inset-0 z-0"
            style={{
              backgroundImage: profile.background_url ? `url(${profile.background_url})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundColor: profile.background_url ? undefined : 'hsl(var(--background))',
            }}
          />

          {/* Header toolbar */}
          <div className="relative z-10 flex items-center justify-between px-6 py-3 border-b border-border bg-background/95 backdrop-blur-sm">
            <h2 className="text-lg font-semibold">Profile Editor</h2>
            
            <div className="flex items-center gap-3">
              {/* Save status indicator */}
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                {saveStatus === 'saving' && (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Saving...
                  </>
                )}
                {saveStatus === 'saved' && (
                  <span className="text-primary flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Saved
                  </span>
                )}
                {saveStatus === 'error' && (
                  <span className="text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Save failed
                  </span>
                )}
                {saveStatus === 'idle' && 'Ready to save'}
              </span>

              {/* Undo/Redo buttons */}
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={undo} 
                      disabled={!canUndo}
                      className="h-8 w-8"
                    >
                      <Undo2 className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Undo (⌘Z)</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={redo} 
                      disabled={!canRedo}
                      className="h-8 w-8"
                    >
                      <Redo2 className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Redo (⌘⇧Z)</TooltipContent>
                </Tooltip>
              </div>

              {/* Manual Save button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={saveAllChanges}
                    disabled={saveStatus === 'saving'}
                    className="gap-2"
                  >
                    {saveStatus === 'saving' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Save
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Save changes now (⌘S)</TooltipContent>
              </Tooltip>

              {/* Close button */}
              <Button variant="ghost" size="icon" onClick={handleClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Main content area */}
          <div className="relative z-10 flex-1 h-[calc(100vh-57px)] flex items-start justify-center overflow-hidden">
            <ScrollArea className="h-full w-full">
              <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Profile Card */}
                <div className="bg-card/90 backdrop-blur-md rounded-2xl border border-border/50 overflow-hidden">
                  {/* Banner */}
                  <div className="relative h-40 bg-gradient-to-b from-primary/20 to-background overflow-hidden">
                    {profile.banner_url && (
                      <img src={profile.banner_url} alt="Banner" className="w-full h-full object-cover" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  </div>

                  {/* Profile content */}
                  <div className="px-6 pb-6">
                    {/* Avatar & Actions */}
                    <div className="flex justify-between items-end -mt-16">
                      <Avatar className="w-32 h-32 border-4 border-card shadow-xl">
                        <AvatarImage src={profile.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/20 text-primary text-3xl">
                          {(profile.full_name || profile.username || 'U').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex gap-2 pb-2">
                        <Button variant="outline" size="sm" disabled>
                          <LinkIcon className="w-4 h-4 mr-2" />
                          Copy link
                        </Button>
                        <Button variant="outline" size="icon" disabled>
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Info Section */}
                    <div className="mt-4">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h1 className="text-xl font-bold">@{profile.username || 'user'}</h1>
                        {profile.verified && <VerifiedBadge size="md" />}
                        {profile.is_creator && (
                          <Badge variant="outline" className="text-muted-foreground border-muted-foreground/30">
                            Owner
                          </Badge>
                        )}
                      </div>
                      {profile.full_name && <p className="text-muted-foreground mb-2">{profile.full_name}</p>}
                      {profile.bio && <p className="text-foreground whitespace-pre-line mb-3 max-w-lg">{profile.bio}</p>}
                    </div>

                    {/* Tabs */}
                    <div className="mt-6 flex justify-center border-t border-border">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="flex items-center gap-2 px-8 py-3 border-t-2 border-foreground text-foreground">
                            <User className="w-5 h-5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>Collections</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="flex items-center gap-2 px-8 py-3 border-t-2 border-transparent text-muted-foreground">
                            <Download className="w-5 h-5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>Downloads</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="flex items-center gap-2 px-8 py-3 border-t-2 border-transparent text-muted-foreground">
                            <Bookmark className="w-5 h-5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>Saved</TooltipContent>
                      </Tooltip>
                    </div>

                    {/* Content Area */}
                    <div className="mt-6 space-y-6">
                      {/* Header with actions */}
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Your Store Layout
                        </h3>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowCreateCollection(true)}
                            className="gap-2"
                          >
                            <Layers className="w-4 h-4" />
                            New Collection
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAddPanel(true)}
                            className="gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            Add Section
                          </Button>
                        </div>
                      </div>

                      {loading ? (
                        <div className="text-center py-12 text-muted-foreground">
                          Loading your store layout...
                        </div>
                      ) : !hasContent ? (
                        <div className="text-center py-16 border-2 border-dashed border-muted-foreground/25 rounded-lg bg-background/50">
                          <p className="text-muted-foreground mb-4">
                            No content yet. Start building your store!
                          </p>
                          <div className="flex gap-2 justify-center">
                            <Button onClick={() => setShowCreateCollection(true)} variant="outline">
                              <Layers className="w-4 h-4 mr-2" />
                              Create Collection
                            </Button>
                            <Button onClick={() => setShowAddPanel(true)} className="bg-primary hover:bg-primary/90">
                              <Plus className="w-4 h-4 mr-2" />
                              Add Section
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {/* Recent Uploads */}
                          {recentProducts.length > 0 && (
                            <div className={cn(
                              'relative group p-4 rounded-lg border transition-all',
                              showRecentUploads 
                                ? 'border-border bg-card/50' 
                                : 'border-dashed border-muted-foreground/25 bg-muted/20 opacity-50'
                            )}>
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium text-sm">Recent Uploads</h4>
                                  <Badge variant="secondary" className="text-xs">Auto-generated</Badge>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={toggleRecentUploadsVisibility}
                                  className="h-8 w-8"
                                >
                                  {showRecentUploads ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                </Button>
                              </div>
                              <div className="flex gap-2 overflow-x-auto pb-1">
                                {recentProducts.slice(0, 6).map((product) => {
                                  const thumbnail = product.cover_image_url || getYouTubeThumbnail(product.youtube_url);
                                  return (
                                    <div key={product.id} className="relative w-24 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                                      {thumbnail ? (
                                        <img src={thumbnail} alt={product.name} className="w-full h-full object-cover" />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                          <Play className="w-4 h-4 text-muted-foreground" />
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleLayoutDragEnd}
                            measuring={measuringConfig}
                          >
                            <SortableContext items={layoutIds} strategy={verticalListSortingStrategy}>
                              <div className="space-y-6">
                                {layoutItems.map((item) =>
                                  item.kind === 'collection' ? (
                                    <SortableCollectionCard
                                      key={item.sortableId}
                                      sortableId={item.sortableId}
                                      collection={item.data}
                                      onEdit={() => setEditingCollection(item.data)}
                                      onDelete={() => setDeleteCollectionId(item.data.id)}
                                      onToggleVisibility={() => toggleCollectionVisibility(item.data.id)}
                                      onAnimationChange={(anim) => updateCollectionAnimation(item.data.id, anim)}
                                    />
                                  ) : (
                                    <SortableSectionCard
                                      key={item.sortableId}
                                      sortableId={item.sortableId}
                                      section={item.data}
                                      onEdit={() => setEditingSection(item.data)}
                                      onDelete={() => setDeleteSectionId(item.data.id)}
                                      onToggleVisibility={() => toggleSectionVisibility(item.data.id)}
                                      onAnimationChange={(anim) => updateSectionAnimation(item.data.id, anim)}
                                    />
                                  )
                                )}
                              </div>
                            </SortableContext>
                          </DndContext>

                          {/* Preview Section - only when add panel is open */}
                          {showAddPanel && previewSection && (
                            <div className="relative bg-card/50 backdrop-blur-sm border-2 border-dashed border-primary rounded-lg overflow-hidden">
                              <div className="absolute top-2 left-2 z-10">
                                <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded font-medium">
                                  Preview
                                </span>
                              </div>
                              <div className="p-4 pt-10 min-h-[80px]">
                                <SectionPreviewContent section={previewSection} />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Section Panel */}
      <AddSectionPanel
        open={showAddPanel}
        onClose={() => {
          setPreviewSection(null);
          setShowAddPanel(false);
        }}
        onAddSection={(type, presetId) => {
          setPreviewSection(null);
          addSection(type, presetId);
        }}
        onPreviewSection={setPreviewSection}
      />

      {/* Edit Section Dialog */}
      <EditSectionDialog
        section={editingSection}
        collections={initialCollections}
        products={recentProducts.map(p => ({ id: p.id, name: p.name }))}
        onUpdate={updateSection}
        onDelete={deleteSection}
        onClose={() => setEditingSection(null)}
        onCreateCollection={() => setShowCreateCollection(true)}
      />

      {/* Edit Collection Dialog */}
      <EditCollectionDialog
        open={!!editingCollection}
        onOpenChange={(open) => !open && setEditingCollection(null)}
        collection={editingCollection}
        onUpdated={() => {
          fetchCollections().then(data => setEditorCollections(data));
          onCollectionsChange?.();
          setEditingCollection(null);
        }}
      />

      {/* Delete Collection Confirmation */}
      <AlertDialog open={!!deleteCollectionId} onOpenChange={(open) => !open && setDeleteCollectionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Collection?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this collection. The products inside will not be deleted, 
              only the collection grouping.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteCollectionId && handleDeleteCollection(deleteCollectionId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Section Confirmation */}
      <AlertDialog open={!!deleteSectionId} onOpenChange={(open) => !open && setDeleteSectionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete section?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this section from your profile layout.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!deleteSectionId) return;
                const id = deleteSectionId;
                setDeleteSectionId(null);
                void deleteSection(id);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Collection Dialog */}
      {showCreateCollection && (
        <CreateCollectionInEditor
          open={showCreateCollection}
          onOpenChange={setShowCreateCollection}
          profileId={profileId}
          onCreated={() => {
            setShowCreateCollection(false);
            fetchCollections().then(data => setEditorCollections(data));
            onCollectionsChange?.();
          }}
        />
      )}
    </TooltipProvider>
  );
}
