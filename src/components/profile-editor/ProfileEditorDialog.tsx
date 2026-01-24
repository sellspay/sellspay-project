import { useState, useEffect, memo, useCallback, useMemo } from 'react';
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
  X, Plus, Save, Undo, GripVertical, Eye, EyeOff, Trash2, Pencil,
  Link as LinkIcon, Settings, User, Download, Bookmark, Layers, Play,
  ChevronRight
} from 'lucide-react';
import { ProfileSection, SectionType, SECTION_TEMPLATES } from './types';
import { AddSectionPanel } from './AddSectionPanel';
import { EditSectionDialog } from './EditSectionDialog';
import { SectionPreviewContent } from './previews/SectionPreviewContent';
import { CreateCollectionInEditor } from './CreateCollectionInEditor';
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
}

interface ProfileEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string;
  profile: Profile;
  collections: { id: string; name: string }[];
  onCollectionsChange?: () => void;
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
  onEdit,
  onDelete,
  onToggleVisibility,
}: {
  collection: Collection;
  onEdit: () => void;
  onDelete: () => void;
  onToggleVisibility: () => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: collection.id });

  // Simplified style without transition during drag for better performance
  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? undefined : transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative group',
        isDragging && 'opacity-60 z-50 scale-[1.02]',
        !collection.is_visible && 'opacity-40'
      )}
    >
      {/* Collection Header - exactly like CollectionRow */}
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

        {/* Editor Controls - visible on hover */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <div
            className="p-2 rounded-lg bg-muted/50 cursor-grab hover:bg-muted transition-colors"
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

      {/* Products Grid - 3 per row like CollectionRow */}
      {collection.products.length > 0 ? (
        <div className="grid grid-cols-3 gap-4">
          {collection.products.slice(0, 3).map((product) => {
            const thumbnail = product.cover_image_url || getYouTubeThumbnail(product.youtube_url);
            return (
              <div
                key={product.id}
                className="group/card"
              >
                <div className="relative aspect-video rounded-lg overflow-hidden bg-muted border border-border">
                  {thumbnail ? (
                    <img
                      src={thumbnail}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                      <Layers className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  {/* Play indicator for videos */}
                  {(product.preview_video_url || product.youtube_url) && (
                    <div className="absolute top-2 left-2 bg-background/80 rounded-full p-1.5">
                      <Play className="w-3 h-3 text-foreground" fill="currentColor" />
                    </div>
                  )}
                </div>
                <div className="mt-2">
                  <h4 className="font-medium text-foreground text-sm line-clamp-2">
                    {product.name}
                  </h4>
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

      {/* Show more indicator */}
      {collection.totalCount > 3 && (
        <p className="text-xs text-muted-foreground mt-3 text-center">
          +{collection.totalCount - 3} more products
        </p>
      )}

      {/* Visibility overlay when hidden */}
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
  onEdit,
  onDelete,
  onToggleVisibility,
}: {
  section: ProfileSection;
  onEdit: () => void;
  onDelete: () => void;
  onToggleVisibility: () => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  // Simplified style without transition during drag for better performance
  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? undefined : transition,
  };

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
      <div className="p-4 min-h-[80px]">
        <SectionPreviewContent section={section} />
      </div>

      {/* Hover controls */}
      <div className="absolute inset-0 z-20 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none group-hover:pointer-events-auto">
        <div
          className="p-2 rounded-lg bg-white/10 cursor-grab hover:bg-white/20 transition-colors"
          onClick={(e) => e.stopPropagation()}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-5 h-5 text-white" />
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="bg-white/10 hover:bg-white/20 text-white border-0"
        >
          <Pencil className="w-4 h-4 mr-1" />
          Edit
        </Button>

        <Button
          variant="secondary"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisibility();
          }}
          className="bg-white/10 hover:bg-white/20 text-white border-0"
        >
          {section.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </Button>

        <Button
          variant="secondary"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
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
  const [sections, setSections] = useState<ProfileSection[]>([]);
  const [editorCollections, setEditorCollections] = useState<Collection[]>([]);
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [showRecentUploads, setShowRecentUploads] = useState(profile.show_recent_uploads !== false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [editingSection, setEditingSection] = useState<ProfileSection | null>(null);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [deleteCollectionId, setDeleteCollectionId] = useState<string | null>(null);
  const [deleteSectionId, setDeleteSectionId] = useState<string | null>(null);
  const [previewSection, setPreviewSection] = useState<ProfileSection | null>(null);
  const [showCreateCollection, setShowCreateCollection] = useState(false);

  // Optimized sensors with higher distance threshold to reduce accidental drags
  const sensors = useSensors(
    useSensor(PointerSensor, { 
      activationConstraint: { 
        distance: 10,
        tolerance: 5,
      } 
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Optimized measuring configuration to reduce layout recalculations
  const measuringConfig = useMemo(() => ({
    droppable: {
      strategy: MeasuringStrategy.Always,
    },
  }), []);

  useEffect(() => {
    if (open && profileId) {
      fetchAllData();
    }
  }, [open, profileId]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchSections(),
        fetchCollections(),
        fetchRecentProducts(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSections = async () => {
    try {
      const { data, error } = await supabase
        .from('profile_sections')
        .select('*')
        .eq('profile_id', profileId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setSections((data || []) as unknown as ProfileSection[]);
    } catch (error) {
      console.error('Error fetching sections:', error);
    }
  };

  const fetchCollections = async () => {
    try {
      const { data: collectionsData, error } = await supabase
        .from('collections')
        .select('id, name, cover_image_url, is_visible, display_order')
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
              products: productsData || [],
              totalCount: count || 0,
            };
          })
        );

        setEditorCollections(collectionsWithProducts);
      } else {
        setEditorCollections([]);
      }
    } catch (error) {
      console.error('Error fetching collections:', error);
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

      setRecentProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleCollectionDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setEditorCollections(prev => {
        const oldIndex = prev.findIndex((c) => c.id === active.id);
        const newIndex = prev.findIndex((c) => c.id === over.id);
        const newCollections = arrayMove(prev, oldIndex, newIndex).map((c, idx) => ({
          ...c,
          display_order: idx,
        }));
        return newCollections;
      });
      setHasChanges(true);
    }
  }, []);

  const handleSectionDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSections(prev => {
        const oldIndex = prev.findIndex((s) => s.id === active.id);
        const newIndex = prev.findIndex((s) => s.id === over.id);
        const newSections = arrayMove(prev, oldIndex, newIndex).map((s, idx) => ({
          ...s,
          display_order: idx,
        }));
        return newSections;
      });
      setHasChanges(true);
    }
  }, []);

  const toggleCollectionVisibility = useCallback((collectionId: string) => {
    setEditorCollections(prev => prev.map((c) => 
      c.id === collectionId ? { ...c, is_visible: !c.is_visible } : c
    ));
    setHasChanges(true);
  }, []);

  const toggleSectionVisibility = useCallback((sectionId: string) => {
    setSections(prev => prev.map((s) => 
      s.id === sectionId ? { ...s, is_visible: !s.is_visible } : s
    ));
    setHasChanges(true);
  }, []);

  const handleDeleteCollection = async (collectionId: string) => {
    try {
      // Delete collection items first
      await supabase
        .from('collection_items')
        .delete()
        .eq('collection_id', collectionId);

      // Then delete the collection
      const { error } = await supabase
        .from('collections')
        .delete()
        .eq('id', collectionId);

      if (error) throw error;

      setEditorCollections(editorCollections.filter((c) => c.id !== collectionId));
      setDeleteCollectionId(null);
      toast.success('Collection deleted');
      onCollectionsChange?.();
    } catch (error) {
      console.error('Error deleting collection:', error);
      toast.error('Failed to delete collection');
    }
  };

  const toggleRecentUploadsVisibility = async () => {
    const newVisibility = !showRecentUploads;
    setShowRecentUploads(newVisibility);
    setHasChanges(true);
  };

  const addSection = async (type: SectionType, presetId?: string) => {
    const template = SECTION_TEMPLATES.find((t) => t.type === type);
    if (!template) return;

    // Find the preset and merge content overrides
    const preset = presetId ? template.presets.find(p => p.id === presetId) : template.presets[0];
    const content = {
      ...JSON.parse(JSON.stringify(template.defaultContent)),
      ...(preset?.contentOverrides || {}),
    };
    const styleOptions = {
      ...(preset?.styleOptions || {}),
      // Ensure preset is always persisted so previews can render accurately
      preset: presetId || preset?.id || (preset ? preset.id : 'style1'),
    };

    const sectionToInsert: {
      profile_id: string;
      section_type: string;
      display_order: number;
      content: Record<string, unknown>;
      style_options: Record<string, unknown>;
      is_visible: boolean;
    } = {
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

  const updateSection = (updatedSection: ProfileSection) => {
    setSections(sections.map((s) => (s.id === updatedSection.id ? updatedSection : s)));
    setEditingSection(updatedSection);
    setHasChanges(true);
  };

  const deleteSection = async (sectionId: string) => {
    try {
      const { error } = await supabase.from('profile_sections').delete().eq('id', sectionId);
      if (error) throw error;
      setSections(sections.filter((s) => s.id !== sectionId));
      setEditingSection(null);
      toast.success('Section deleted');
    } catch (error) {
      console.error('Error deleting section:', error);
      toast.error('Failed to delete section');
    }
  };


  const saveAllChanges = async () => {
    setSaving(true);
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

      // Save collections order and visibility
      for (const collection of editorCollections) {
        const { error } = await supabase
          .from('collections')
          .update({
            display_order: collection.display_order,
            is_visible: collection.is_visible,
          })
          .eq('id', collection.id);
        if (error) throw error;
      }

      // Save recent uploads visibility
      await supabase
        .from('profiles')
        .update({ show_recent_uploads: showRecentUploads })
        .eq('id', profileId);

      setHasChanges(false);
      toast.success('All changes saved');
      onCollectionsChange?.();
    } catch (error) {
      console.error('Error saving changes:', error);
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      const confirm = window.confirm('You have unsaved changes. Are you sure you want to close?');
      if (!confirm) return;
    }
    onOpenChange(false);
    setEditingSection(null);
    setEditingCollection(null);
  };

  const socialLinks = profile.social_links && typeof profile.social_links === 'object' 
    ? profile.social_links as Record<string, string> 
    : {};

  const hasContent = recentProducts.length > 0 || editorCollections.length > 0 || sections.length > 0;

  // Memoized IDs for SortableContext to prevent unnecessary re-renders
  const collectionIds = useMemo(() => editorCollections.map((c) => c.id), [editorCollections]);
  const sectionIds = useMemo(() => sections.map((s) => s.id), [sections]);

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
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => fetchAllData()} disabled={loading}>
                <Undo className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button variant="default" size="sm" onClick={saveAllChanges} disabled={saving || !hasChanges}>
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
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
                          {/* Recent Uploads - toggleable */}
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
                                  {showRecentUploads ? (
                                    <Eye className="w-4 h-4" />
                                  ) : (
                                    <EyeOff className="w-4 h-4" />
                                  )}
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

                          {/* Collections - displayed like profile page */}
                          {editorCollections.length > 0 && (
                            <DndContext
                              sensors={sensors}
                              collisionDetection={closestCenter}
                              onDragEnd={handleCollectionDragEnd}
                              measuring={measuringConfig}
                            >
                              <SortableContext
                                items={collectionIds}
                                strategy={verticalListSortingStrategy}
                              >
                                <div className="space-y-10">
                                  {editorCollections.map((collection) => (
                                    <SortableCollectionCard
                                      key={collection.id}
                                      collection={collection}
                                      onEdit={() => setEditingCollection(collection)}
                                      onDelete={() => setDeleteCollectionId(collection.id)}
                                      onToggleVisibility={() => toggleCollectionVisibility(collection.id)}
                                    />
                                  ))}
                                </div>
                              </SortableContext>
                            </DndContext>
                          )}

                          {/* Custom Sections */}
                          {sections.length > 0 && (
                            <DndContext
                              sensors={sensors}
                              collisionDetection={closestCenter}
                              onDragEnd={handleSectionDragEnd}
                              measuring={measuringConfig}
                            >
                              <SortableContext
                                items={sectionIds}
                                strategy={verticalListSortingStrategy}
                              >
                                <div className="space-y-4">
                                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Custom Sections
                                  </h4>
                                  {sections.map((section) => (
                                    <SortableSectionCard
                                      key={section.id}
                                      section={section}
                                      onEdit={() => setEditingSection(section)}
                                      onDelete={() => setDeleteSectionId(section.id)}
                                      onToggleVisibility={() => toggleSectionVisibility(section.id)}
                                    />
                                  ))}
                                </div>
                              </SortableContext>
                            </DndContext>
                          )}

                          {/* Preview Section */}
                          {previewSection && (
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
          setShowAddPanel(false);
          setPreviewSection(null);
        }}
        onAddSection={addSection}
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
          fetchCollections();
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
            fetchCollections();
            onCollectionsChange?.();
          }}
        />
      )}
    </TooltipProvider>
  );
}
