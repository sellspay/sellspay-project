import { useState, useEffect, memo } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { VerifiedBadge } from '@/components/ui/verified-badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
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
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X, Plus, Save, Undo, GripVertical, Eye, EyeOff, Trash2, Pencil } from 'lucide-react';
import { ProfileSection, SectionType, SECTION_TEMPLATES } from './types';
import { AddSectionDialog } from './AddSectionDialog';
import { EditSectionDialog } from './EditSectionDialog';
import { SectionPreviewContent } from './previews/SectionPreviewContent';
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
}

interface ProfileEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string;
  profile: Profile;
  collections: { id: string; name: string }[];
}

// Sortable section item for the canvas
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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative group bg-card/50 backdrop-blur-sm border border-border rounded-lg overflow-hidden transition-all',
        isDragging && 'opacity-50 z-50 shadow-xl',
        !section.is_visible && 'opacity-50'
      )}
    >
      {/* Section content preview */}
      <div className="p-4 min-h-[80px]">
        <SectionPreviewContent section={section} />
      </div>

      {/* Hover controls */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        {/* Drag handle */}
        <div
          className="p-2 rounded-lg bg-white/10 cursor-grab hover:bg-white/20 transition-colors"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-5 h-5 text-white" />
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={onEdit}
          className="bg-white/10 hover:bg-white/20 text-white border-0"
        >
          <Pencil className="w-4 h-4 mr-1" />
          Edit
        </Button>

        <Button
          variant="secondary"
          size="icon"
          onClick={onToggleVisibility}
          className="bg-white/10 hover:bg-white/20 text-white border-0"
        >
          {section.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </Button>

        <Button
          variant="secondary"
          size="icon"
          onClick={onDelete}
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
  collections,
}: ProfileEditorDialogProps) {
  const [sections, setSections] = useState<ProfileSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingSection, setEditingSection] = useState<ProfileSection | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch sections on open
  useEffect(() => {
    if (open && profileId) {
      fetchSections();
    }
  }, [open, profileId]);

  const fetchSections = async () => {
    setLoading(true);
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
      toast.error('Failed to load sections');
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex((s) => s.id === active.id);
      const newIndex = sections.findIndex((s) => s.id === over.id);
      const newSections = arrayMove(sections, oldIndex, newIndex).map((s, idx) => ({
        ...s,
        display_order: idx,
      }));
      setSections(newSections);
      setHasChanges(true);
    }
  };

  const addSection = async (type: SectionType) => {
    const template = SECTION_TEMPLATES.find((t) => t.type === type);
    if (!template) return;

    const sectionToInsert = {
      profile_id: profileId,
      section_type: type,
      display_order: sections.length,
      content: JSON.parse(JSON.stringify(template.defaultContent)),
      is_visible: true,
    };

    try {
      const { data, error } = await supabase
        .from('profile_sections')
        .insert([sectionToInsert])
        .select()
        .single();

      if (error) throw error;

      const createdSection = data as unknown as ProfileSection;
      setSections([...sections, createdSection]);
      setEditingSection(createdSection);
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

  const toggleVisibility = (sectionId: string) => {
    const section = sections.find((s) => s.id === sectionId);
    if (!section) return;

    const updated = { ...section, is_visible: !section.is_visible };
    setSections(sections.map((s) => (s.id === sectionId ? updated : s)));
    setHasChanges(true);
  };

  const saveAllChanges = async () => {
    setSaving(true);
    try {
      for (const section of sections) {
        const { error } = await supabase
          .from('profile_sections')
          .update({
            display_order: section.display_order,
            content: JSON.parse(JSON.stringify(section.content)),
            is_visible: section.is_visible,
          })
          .eq('id', section.id);

        if (error) throw error;
      }

      setHasChanges(false);
      toast.success('All changes saved');
    } catch (error) {
      console.error('Error saving sections:', error);
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
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-[100vw] w-[100vw] h-[100vh] max-h-[100vh] p-0 gap-0 rounded-none border-0 [&>button]:hidden">
          {/* Header toolbar */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-card/95 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold text-foreground">Profile Editor</h2>
              {hasChanges && (
                <span className="text-sm text-primary">(unsaved changes)</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fetchSections()}
                disabled={loading}
              >
                <Undo className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={saveAllChanges}
                disabled={saving || !hasChanges}
              >
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button variant="ghost" size="icon" onClick={handleClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Main canvas area */}
          <ScrollArea className="flex-1 h-[calc(100vh-57px)]">
            <div 
              className="min-h-full"
              style={{
                backgroundImage: profile.background_url ? `url(${profile.background_url})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed',
                backgroundColor: profile.background_url ? undefined : 'hsl(var(--background))',
              }}
            >
              {/* Fixed Profile Header (read-only preview) */}
              <div className="relative">
                {/* Banner */}
                <div className="relative h-48 bg-gradient-to-b from-primary/20 to-background overflow-hidden">
                  {profile.banner_url && (
                    <img
                      src={profile.banner_url}
                      alt="Banner"
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  
                  {/* Edit hint */}
                  <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded">
                    Edit in Settings
                  </div>
                </div>

                {/* Profile info */}
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
              </div>

              {/* Sections canvas - the card container */}
              <div className="px-6 pb-6">
                <div className="max-w-4xl mx-auto bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 p-6">
                  {/* Add section button (top) */}
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      Your Sections
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddDialog(true)}
                      className="gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Section
                    </Button>
                  </div>

                  {/* Sections grid/list */}
                  {loading ? (
                    <div className="text-center py-12 text-muted-foreground">
                      Loading sections...
                    </div>
                  ) : sections.length === 0 ? (
                    <div className="text-center py-16 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                      <p className="text-muted-foreground mb-4">
                        No sections yet. Start building your profile!
                      </p>
                      <Button onClick={() => setShowAddDialog(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Your First Section
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
                        <div className="space-y-4">
                          {sections.map((section) => (
                            <SortableSectionCard
                              key={section.id}
                              section={section}
                              onEdit={() => setEditingSection(section)}
                              onDelete={() => {
                                if (window.confirm('Delete this section?')) {
                                  deleteSection(section.id);
                                }
                              }}
                              onToggleVisibility={() => toggleVisibility(section.id)}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Add Section Dialog (popup) */}
      <AddSectionDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onAddSection={addSection}
      />

      {/* Edit Section Dialog (popup) */}
      <EditSectionDialog
        section={editingSection}
        collections={collections}
        onUpdate={updateSection}
        onDelete={deleteSection}
        onClose={() => setEditingSection(null)}
      />
    </>
  );
}
