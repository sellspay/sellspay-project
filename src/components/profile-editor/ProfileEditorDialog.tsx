import { useState, useEffect, memo } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
import { 
  X, Plus, Save, Undo, GripVertical, Eye, EyeOff, Trash2, Pencil,
  Link as LinkIcon, Settings, User, Download, Bookmark
} from 'lucide-react';
import { ProfileSection, SectionType, SECTION_TEMPLATES } from './types';
import { AddSectionPanel } from './AddSectionPanel';
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
  is_creator?: boolean | null;
  social_links?: unknown;
}

interface ProfileEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string;
  profile: Profile;
  collections: { id: string; name: string }[];
}

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
      <div className="p-4 min-h-[80px]">
        <SectionPreviewContent section={section} />
      </div>

      {/* Hover controls */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
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
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [editingSection, setEditingSection] = useState<ProfileSection | null>(null);
  const [productCount, setProductCount] = useState(0);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (open && profileId) {
      fetchSections();
      fetchProductCount();
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

  const fetchProductCount = async () => {
    const { count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('creator_id', profileId)
      .eq('status', 'published');
    setProductCount(count || 0);
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

  const addSection = async (type: SectionType, _presetId?: string) => {
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
      setSections(prev => [...prev, createdSection]);
      // Close add panel and open edit dialog for the new section
      setShowAddPanel(false);
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

  // Parse social links
  const socialLinks = profile.social_links && typeof profile.social_links === 'object' 
    ? profile.social_links as Record<string, string> 
    : {};

  return (
    <TooltipProvider>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-[100vw] w-[100vw] h-[100vh] max-h-[100vh] p-0 gap-0 rounded-none border-0 [&>button]:hidden overflow-hidden">
          {/* Fixed background that fills entire viewport */}
          <div 
            className="absolute inset-0 z-0"
            style={{
              backgroundImage: profile.background_url ? `url(${profile.background_url})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundColor: profile.background_url ? undefined : 'hsl(var(--background))',
            }}
          />

          {/* Header toolbar - fixed at top */}
          <div className="relative z-10 flex items-center justify-between px-6 py-3 border-b border-border bg-background/95 backdrop-blur-sm">
            <h2 className="text-lg font-semibold">Profile Editor</h2>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => fetchSections()} disabled={loading}>
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

          {/* Main content area - the card scrolls, background stays fixed */}
          <div className="relative z-10 flex-1 h-[calc(100vh-57px)] flex items-start justify-center overflow-hidden">
            {/* Scrollable container for the profile card only */}
            <ScrollArea className="h-full w-full">
              <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Profile Card */}
                <div className="bg-card/90 backdrop-blur-md rounded-2xl border border-border/50 overflow-hidden">
                  {/* Banner */}
                  <div className="relative h-40 bg-gradient-to-b from-primary/20 to-background overflow-hidden">
                    {profile.banner_url && (
                      <img
                        src={profile.banner_url}
                        alt="Banner"
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  </div>

                  {/* Profile content */}
                  <div className="px-6 pb-6">
                    {/* Avatar & Actions row */}
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
                      {/* Username with badges */}
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h1 className="text-xl font-bold">@{profile.username || 'user'}</h1>
                        {profile.verified && <VerifiedBadge size="md" />}
                        {profile.is_creator && (
                          <Badge variant="outline" className="text-muted-foreground border-muted-foreground/30">
                            Owner
                          </Badge>
                        )}
                      </div>

                      {/* Display name */}
                      {profile.full_name && (
                        <p className="text-muted-foreground mb-2">{profile.full_name}</p>
                      )}

                      {/* Bio */}
                      {profile.bio && (
                        <p className="text-foreground whitespace-pre-line mb-3 max-w-lg">{profile.bio}</p>
                      )}

                      {/* Social Links */}
                      {Object.keys(socialLinks).length > 0 && (
                        <div className="flex items-center gap-3 mb-3">
                          {socialLinks.instagram && (
                            <div className="text-muted-foreground">
                              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                              </svg>
                            </div>
                          )}
                          {socialLinks.youtube && (
                            <div className="text-muted-foreground">
                              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                              </svg>
                            </div>
                          )}
                          {socialLinks.twitter && (
                            <div className="text-muted-foreground">
                              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                              </svg>
                            </div>
                          )}
                          {socialLinks.tiktok && (
                            <div className="text-muted-foreground">
                              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                              </svg>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Stats row */}
                      <div className="flex items-center gap-4 text-sm">
                        <span>
                          <strong>{productCount}</strong>{' '}
                          <span className="text-muted-foreground">products</span>
                        </span>
                        <span>
                          <strong>0</strong>{' '}
                          <span className="text-muted-foreground">followers</span>
                        </span>
                        <span>
                          <strong>0</strong>{' '}
                          <span className="text-muted-foreground">following</span>
                        </span>
                      </div>
                    </div>

                    {/* Tabs - Instagram style */}
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

                    {/* YOUR SECTIONS area */}
                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Your Sections
                        </h3>
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

                      {/* Sections list */}
                      {loading ? (
                        <div className="text-center py-12 text-muted-foreground">
                          Loading sections...
                        </div>
                      ) : sections.length === 0 ? (
                        <div className="text-center py-16 border-2 border-dashed border-muted-foreground/25 rounded-lg bg-background/50">
                          <p className="text-muted-foreground mb-4">
                            No sections yet. Start building your profile!
                          </p>
                          <Button 
                            onClick={() => setShowAddPanel(true)}
                            className="bg-primary hover:bg-primary/90"
                          >
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
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Section Panel - Full screen overlay - rendered outside Dialog for z-index */}
      {open && (
        <AddSectionPanel
          open={showAddPanel}
          onClose={() => setShowAddPanel(false)}
          onAddSection={addSection}
        />
      )}

      {/* Edit Section Dialog */}
      <EditSectionDialog
        section={editingSection}
        collections={collections}
        onUpdate={updateSection}
        onDelete={deleteSection}
        onClose={() => setEditingSection(null)}
      />
    </TooltipProvider>
  );
}
