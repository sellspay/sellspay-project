import React, { useState, memo } from 'react';
import { SECTION_TEMPLATES, SECTION_CATEGORIES, SectionType, SectionTemplate } from './types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';

interface StylePresetsPanelProps {
  onSelectPreset: (type: SectionType, presetId: string) => void;
  onClose: () => void;
}

export const StylePresetsPanel = memo(({ onSelectPreset, onClose }: StylePresetsPanelProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('content');
  const [selectedType, setSelectedType] = useState<SectionTemplate | null>(null);

  const getIcon = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName] || LucideIcons.Box;
    return Icon;
  };

  const templatesInCategory = SECTION_TEMPLATES.filter(
    (t) => t.category === selectedCategory
  );

  const handleSelectType = (template: SectionTemplate) => {
    setSelectedType(template);
  };

  const handleSelectPreset = (presetId: string) => {
    if (selectedType) {
      onSelectPreset(selectedType.type, presetId);
    }
  };

  const handleBack = () => {
    setSelectedType(null);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          {selectedType ? (
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          ) : null}
          <span className="font-semibold">
            {selectedType ? `${selectedType.name} Styles` : 'Add Section'}
          </span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {!selectedType ? (
        <div className="flex flex-1 overflow-hidden">
          {/* Category Sidebar */}
          <div className="w-32 border-r bg-muted/30">
            <ScrollArea className="h-full">
              <div className="p-2 space-y-1">
                {SECTION_CATEGORIES.map((category) => {
                  const CategoryIcon = getIcon(category.icon);
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={cn(
                        'w-full flex flex-col items-center gap-1 p-3 rounded-lg text-xs transition-colors',
                        selectedCategory === category.id
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <CategoryIcon className="h-5 w-5" />
                      <span>{category.name}</span>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Section Types Grid */}
          <ScrollArea className="flex-1">
            <div className="p-4">
              <div className="grid grid-cols-2 gap-3">
                {templatesInCategory.map((template) => {
                  const TemplateIcon = getIcon(template.icon);
                  return (
                    <button
                      key={template.type}
                      onClick={() => handleSelectType(template)}
                      className="flex flex-col items-center p-4 rounded-lg border bg-card hover:bg-accent hover:border-primary transition-colors text-center"
                    >
                      <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mb-3">
                        <TemplateIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <span className="font-medium text-sm">{template.name}</span>
                      <span className="text-xs text-muted-foreground mt-1">
                        {template.presets.length} styles
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </ScrollArea>
        </div>
      ) : (
        /* Preset Selection View */
        <ScrollArea className="flex-1">
          <div className="p-4">
            <p className="text-sm text-muted-foreground mb-4">
              {selectedType.description}
            </p>
            <div className="space-y-3">
              {selectedType.presets.map((preset, index) => (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset.id)}
                  className="w-full relative rounded-lg border overflow-hidden hover:border-primary transition-colors group"
                >
                  {/* Preset Preview */}
                  <div
                    className={cn(
                      'aspect-[16/9] flex items-center justify-center p-4',
                      preset.styleOptions.colorScheme === 'dark' && 'bg-zinc-800 text-white',
                      preset.styleOptions.colorScheme === 'black' && 'bg-black text-white',
                      preset.styleOptions.colorScheme === 'light' && 'bg-zinc-100 text-zinc-900',
                      preset.styleOptions.colorScheme === 'highlight' && 'bg-primary/10 text-foreground',
                      (!preset.styleOptions.colorScheme || preset.styleOptions.colorScheme === 'white') && 'bg-white text-zinc-900'
                    )}
                  >
                    <PresetPreviewContent type={selectedType.type} preset={preset} />
                  </div>
                  
                  {/* Style number badge */}
                  <Badge
                    variant="secondary"
                    className="absolute top-2 left-2"
                  >
                    {index + 1}
                  </Badge>
                  
                  {/* Preset name */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                    <span className="text-white text-sm font-medium">{preset.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </ScrollArea>
      )}
    </div>
  );
});

StylePresetsPanel.displayName = 'StylePresetsPanel';

// Simple preview content for preset cards
const PresetPreviewContent = memo(({ type, preset }: { type: SectionType; preset: any }) => {
  switch (type) {
    case 'text':
      return (
        <div className={`text-${preset.styleOptions.alignment || 'left'} w-full`}>
          <div className="h-3 w-24 bg-current opacity-80 rounded mb-2" />
          <div className="h-2 w-full bg-current opacity-40 rounded mb-1" />
          <div className="h-2 w-3/4 bg-current opacity-40 rounded" />
        </div>
      );
    case 'headline':
      return (
        <div className="h-6 w-48 bg-current opacity-80 rounded" />
      );
    case 'image':
      return (
        <div className="aspect-video w-full max-w-[120px] bg-current opacity-20 rounded" />
      );
    case 'image_with_text':
      return (
        <div className="flex gap-3 w-full">
          <div className="w-1/2 aspect-square bg-current opacity-20 rounded" />
          <div className="w-1/2 space-y-1">
            <div className="h-2 w-16 bg-current opacity-80 rounded" />
            <div className="h-1.5 w-full bg-current opacity-40 rounded" />
            <div className="h-1.5 w-3/4 bg-current opacity-40 rounded" />
          </div>
        </div>
      );
    case 'newsletter':
      return (
        <div className="text-center w-full">
          <div className="h-3 w-24 bg-current opacity-80 rounded mx-auto mb-2" />
          <div className="h-2 w-32 bg-current opacity-40 rounded mx-auto mb-3" />
          <div className="flex gap-2 justify-center">
            <div className="h-6 w-24 bg-current opacity-20 rounded" />
            <div className="h-6 w-16 bg-primary rounded" />
          </div>
        </div>
      );
    case 'testimonials':
      return (
        <div className="flex gap-2 w-full">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-1 p-2 rounded bg-current opacity-10">
              <div className="h-1 w-full bg-current opacity-40 rounded mb-2" />
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-current opacity-40" />
                <div className="h-1 w-8 bg-current opacity-40 rounded" />
              </div>
            </div>
          ))}
        </div>
      );
    case 'faq':
      return (
        <div className="space-y-2 w-full max-w-[150px]">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2 p-1 rounded bg-current opacity-10">
              <div className="h-1.5 flex-1 bg-current opacity-40 rounded" />
              <div className="w-3 h-3 text-current opacity-40">+</div>
            </div>
          ))}
        </div>
      );
    default:
      return (
        <div className="h-8 w-32 bg-current opacity-20 rounded flex items-center justify-center">
          <span className="text-xs opacity-60 capitalize">{type}</span>
        </div>
      );
  }
});

PresetPreviewContent.displayName = 'PresetPreviewContent';
