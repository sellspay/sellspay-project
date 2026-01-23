import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
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
} from '@dnd-kit/sortable';
import {
  X,
  Plus,
  Eye,
  Save,
  Undo,
} from 'lucide-react';
import { ProfileSection, SectionType, SECTION_TEMPLATES } from './types';
import { EditorSidebar } from './EditorSidebar';
import { SectionList } from './SectionList';
import { AddSectionPanel } from './AddSectionPanel';
import { SectionEditor } from './SectionEditor';
import { SectionPreview } from './SectionPreview';

interface ProfileEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string;
  collections: { id: string; name: string }[];
}

export function ProfileEditorDialog({
  open,
  onOpenChange,
  profileId,
  collections,
}: ProfileEditorDialogProps) {
  const [sections, setSections] = useState<ProfileSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeView, setActiveView] = useState<'list' | 'add' | 'edit'>('list');
  const [editingSection, setEditingSection] = useState<ProfileSection | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
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
        .order('display_order', { ascending: true }) as { data: ProfileSection[] | null; error: Error | null };

      if (error) throw error;
      setSections((data || []) as ProfileSection[]);
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

    const newSection = {
      profile_id: profileId,
      section_type: type,
      display_order: sections.length,
      content: JSON.parse(JSON.stringify(template.defaultContent)),
      is_visible: true,
    };

    try {
      const { data, error } = await supabase
        .from('profile_sections')
        .insert([newSection])
        .select()
        .single() as { data: ProfileSection | null; error: Error | null };

      if (error) throw error;

      setSections([...sections, data as ProfileSection]);
      setEditingSection(data as ProfileSection);
      setActiveView('edit');
      toast.success(`${template.name} section added`);
    } catch (error) {
      console.error('Error adding section:', error);
      toast.error('Failed to add section');
    }
  };

  const updateSection = async (updatedSection: ProfileSection) => {
    setSections(sections.map((s) => (s.id === updatedSection.id ? updatedSection : s)));
    setHasChanges(true);
  };

  const deleteSection = async (sectionId: string) => {
    try {
      const { error } = await supabase
        .from('profile_sections')
        .delete()
        .eq('id', sectionId);

      if (error) throw error;

      setSections(sections.filter((s) => s.id !== sectionId));
      if (editingSection?.id === sectionId) {
        setEditingSection(null);
        setActiveView('list');
      }
      toast.success('Section deleted');
    } catch (error) {
      console.error('Error deleting section:', error);
      toast.error('Failed to delete section');
    }
  };

  const toggleVisibility = async (sectionId: string) => {
    const section = sections.find((s) => s.id === sectionId);
    if (!section) return;

    const updated = { ...section, is_visible: !section.is_visible };
    setSections(sections.map((s) => (s.id === sectionId ? updated : s)));
    setHasChanges(true);
  };

  const saveAllChanges = async () => {
    setSaving(true);
    try {
      // Update all sections
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
    setActiveView('list');
    setEditingSection(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[100vw] w-[100vw] h-[100vh] max-h-[100vh] p-0 gap-0 rounded-none border-0">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-foreground">Profile Editor</h2>
            {hasChanges && (
              <span className="text-sm text-muted-foreground">(unsaved changes)</span>
            )}
          </div>
          <div className="flex items-center gap-3">
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
              Save Changes
            </Button>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden h-[calc(100vh-73px)]">
          {/* Left Sidebar */}
          <div className="w-80 border-r border-border bg-card flex flex-col">
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Sections</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveView('add')}
                  className="text-primary"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1">
              {activeView === 'add' ? (
                <AddSectionPanel
                  onAddSection={addSection}
                  onBack={() => setActiveView('list')}
                />
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
                    <SectionList
                      sections={sections}
                      onEdit={(section) => {
                        setEditingSection(section);
                        setActiveView('edit');
                      }}
                      onDelete={deleteSection}
                      onToggleVisibility={toggleVisibility}
                      activeSectionId={editingSection?.id}
                      loading={loading}
                    />
                  </SortableContext>
                </DndContext>
              )}
            </ScrollArea>
          </div>

          {/* Right Panel - Editor or Preview */}
          <div className="flex-1 flex flex-col bg-background overflow-hidden">
            {activeView === 'edit' && editingSection ? (
              <SectionEditor
                section={editingSection}
                collections={collections}
                onUpdate={(updated) => {
                  updateSection(updated);
                  setEditingSection(updated);
                }}
                onClose={() => {
                  setEditingSection(null);
                  setActiveView('list');
                }}
              />
            ) : (
              <div className="flex-1 overflow-auto p-6">
                <div className="max-w-4xl mx-auto">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-medium text-foreground">Preview</h3>
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      Full Preview
                    </Button>
                  </div>
                  <div className="space-y-6">
                    {sections.length === 0 ? (
                      <div className="text-center py-16 text-muted-foreground">
                        <p className="mb-4">No sections yet</p>
                        <Button onClick={() => setActiveView('add')}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Your First Section
                        </Button>
                      </div>
                    ) : (
                      sections
                        .filter((s) => s.is_visible)
                        .map((section) => (
                          <SectionPreview
                            key={section.id}
                            section={section}
                            onClick={() => {
                              setEditingSection(section);
                              setActiveView('edit');
                            }}
                          />
                        ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
