import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { SectionType, SECTION_TEMPLATES, SECTION_CATEGORIES, ProfileSection } from './types';

interface AddSectionPanelProps {
  open: boolean;
  onClose: () => void;
  onAddSection: (type: SectionType, presetId?: string) => void;
  onPreviewSection?: (previewSection: ProfileSection | null) => void;
}

// Preset preview thumbnails - these would ideally be actual images but we'll use styled divs
const PRESET_PREVIEWS: Record<string, { 
  thumbnails: { id: string; name: string; preview: React.ReactNode }[] 
}> = {
  image_with_text: {
    thumbnails: [
      { 
        id: 'style1', 
        name: 'Hero Banner',
        preview: (
          <div className="w-full aspect-video bg-gradient-to-br from-rose-100 to-orange-100 rounded-lg overflow-hidden flex flex-col">
            <div className="flex-1 bg-gradient-to-br from-rose-200/50 to-orange-200/50 flex items-center justify-center">
              <div className="text-center p-4">
                <div className="text-xs font-semibold text-rose-600 mb-1">Make It Happen</div>
                <div className="text-[8px] text-muted-foreground mb-2 max-w-[120px] mx-auto">Share your brand story with bold headlines</div>
                <div className="w-12 h-3 bg-emerald-500 rounded mx-auto" />
              </div>
            </div>
          </div>
        )
      },
      { 
        id: 'style2', 
        name: 'Image Left',
        preview: (
          <div className="w-full aspect-video bg-muted/30 rounded-lg overflow-hidden flex items-center p-3 gap-2">
            <div className="w-1/3 h-full bg-gradient-to-br from-slate-300 to-slate-400 rounded" />
            <div className="flex-1">
              <div className="text-[8px] font-semibold mb-1">Image and text</div>
              <div className="text-[6px] text-muted-foreground">Combine image and text to showcase a product, collection, or blog post.</div>
            </div>
          </div>
        )
      },
      { 
        id: 'style3', 
        name: 'Image Right',
        preview: (
          <div className="w-full aspect-video bg-muted/30 rounded-lg overflow-hidden flex items-center p-3 gap-2">
            <div className="flex-1">
              <div className="text-[8px] font-semibold mb-1">Image and text</div>
              <div className="text-[6px] text-muted-foreground">Combine image and text to showcase a product, collection, or blog post.</div>
            </div>
            <div className="w-1/3 h-full bg-gradient-to-br from-slate-300 to-slate-400 rounded" />
          </div>
        )
      },
      { 
        id: 'style4', 
        name: 'Overlay Text',
        preview: (
          <div className="w-full aspect-video bg-gradient-to-br from-slate-700 to-slate-900 rounded-lg overflow-hidden relative">
            <div className="absolute bottom-2 left-2 right-2">
              <div className="text-[8px] font-semibold text-white mb-1">Image and text</div>
              <div className="text-[6px] text-white/70">Combine image and text</div>
            </div>
          </div>
        )
      },
    ],
  },
  gallery: {
    thumbnails: [
      { 
        id: 'style1', 
        name: '3x2 Grid',
        preview: (
          <div className="w-full aspect-video bg-muted/30 rounded-lg overflow-hidden p-2">
            <div className="grid grid-cols-3 gap-1 h-full">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gradient-to-br from-slate-300 to-slate-400 rounded" />
              ))}
            </div>
          </div>
        )
      },
      { 
        id: 'style2', 
        name: '2x3 Grid',
        preview: (
          <div className="w-full aspect-video bg-muted/30 rounded-lg overflow-hidden p-2">
            <div className="grid grid-cols-3 gap-1 h-full">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gradient-to-br from-blue-200 to-blue-300 rounded" />
              ))}
            </div>
          </div>
        )
      },
      { 
        id: 'style3', 
        name: 'Masonry',
        preview: (
          <div className="w-full aspect-video bg-muted/30 rounded-lg overflow-hidden p-2">
            <div className="grid grid-cols-3 gap-1 h-full">
              <div className="bg-gradient-to-br from-green-200 to-green-300 rounded row-span-2" />
              <div className="bg-gradient-to-br from-green-300 to-green-400 rounded" />
              <div className="bg-gradient-to-br from-green-200 to-green-300 rounded" />
              <div className="bg-gradient-to-br from-green-300 to-green-400 rounded col-span-2" />
            </div>
          </div>
        )
      },
    ],
  },
  slideshow: {
    thumbnails: [
      { 
        id: 'style1', 
        name: 'Full Width',
        preview: (
          <div className="w-full aspect-video bg-gradient-to-br from-rose-100 via-orange-100 to-rose-50 rounded-lg overflow-hidden relative">
            <div className="absolute inset-0 flex items-end justify-center pb-2">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-foreground" />
                <div className="w-1.5 h-1.5 rounded-full bg-foreground/30" />
                <div className="w-1.5 h-1.5 rounded-full bg-foreground/30" />
              </div>
            </div>
            <div className="absolute top-1/2 -translate-y-1/2 left-2 right-2 flex justify-between">
              <div className="w-4 h-4 rounded-full bg-white/50" />
              <div className="w-4 h-4 rounded-full bg-white/50" />
            </div>
          </div>
        )
      },
    ],
  },
  image: {
    thumbnails: [
      { 
        id: 'style1', 
        name: 'Full Width',
        preview: (
          <div className="w-full aspect-video bg-gradient-to-br from-rose-100 via-orange-100 to-rose-50 rounded-lg overflow-hidden" />
        )
      },
      { 
        id: 'style2', 
        name: 'Centered',
        preview: (
          <div className="w-full aspect-video bg-muted/30 rounded-lg overflow-hidden flex items-center justify-center p-4">
            <div className="w-2/3 h-full bg-gradient-to-br from-slate-300 to-slate-400 rounded" />
          </div>
        )
      },
      { 
        id: 'style3', 
        name: '2 Images',
        preview: (
          <div className="w-full aspect-video bg-muted/30 rounded-lg overflow-hidden p-2 flex gap-2">
            <div className="flex-1 bg-gradient-to-br from-amber-200 to-amber-300 rounded" />
            <div className="flex-1 bg-gradient-to-br from-amber-300 to-amber-400 rounded" />
          </div>
        )
      },
      { 
        id: 'style4', 
        name: '4 Images',
        preview: (
          <div className="w-full aspect-video bg-muted/30 rounded-lg overflow-hidden p-2 grid grid-cols-2 gap-1">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gradient-to-br from-purple-200 to-purple-300 rounded" />
            ))}
          </div>
        )
      },
    ],
  },
  basic_list: {
    thumbnails: [
      { 
        id: 'style1', 
        name: '3 Column Cards',
        preview: (
          <div className="w-full aspect-video bg-muted/30 rounded-lg overflow-hidden p-2">
            <div className="text-[6px] text-center font-semibold mb-1">Make it happen</div>
            <div className="grid grid-cols-3 gap-1 h-[calc(100%-16px)]">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded p-1 flex flex-col">
                  <div className="flex-1 bg-gradient-to-br from-slate-200 to-slate-300 rounded mb-1" />
                  <div className="text-[5px] font-medium">Add a title</div>
                  <div className="text-[4px] text-muted-foreground">Description text here</div>
                </div>
              ))}
            </div>
          </div>
        )
      },
      { 
        id: 'style2', 
        name: '2 Column',
        preview: (
          <div className="w-full aspect-video bg-muted/30 rounded-lg overflow-hidden p-2">
            <div className="text-[6px] text-center font-semibold mb-1">Make it happen</div>
            <div className="grid grid-cols-2 gap-1 h-[calc(100%-16px)]">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="bg-white rounded p-1 flex flex-col">
                  <div className="flex-1 bg-gradient-to-br from-green-200 to-green-300 rounded mb-1" />
                  <div className="text-[5px] font-medium">Add a title</div>
                </div>
              ))}
            </div>
          </div>
        )
      },
      { 
        id: 'style3', 
        name: 'Horizontal List',
        preview: (
          <div className="w-full aspect-video bg-muted/30 rounded-lg overflow-hidden p-2">
            <div className="text-[6px] font-semibold mb-1">Make it happen</div>
            <div className="space-y-1">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-1">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-200 to-blue-300 rounded shrink-0" />
                  <div>
                    <div className="text-[5px] font-medium">Add a title</div>
                    <div className="text-[4px] text-muted-foreground">Description</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      },
    ],
  },
  text: {
    thumbnails: [
      { 
        id: 'style1', 
        name: 'Simple Text',
        preview: (
          <div className="w-full aspect-video bg-muted/30 rounded-lg overflow-hidden p-4 flex items-center justify-center">
            <div className="text-center">
              <div className="text-[8px] font-semibold mb-1">Your Heading</div>
              <div className="text-[6px] text-muted-foreground">Add your text content here...</div>
            </div>
          </div>
        )
      },
    ],
  },
  video: {
    thumbnails: [
      { 
        id: 'style1', 
        name: 'Embedded Video',
        preview: (
          <div className="w-full aspect-video bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <div className="w-0 h-0 border-l-[8px] border-l-white border-y-[5px] border-y-transparent ml-1" />
            </div>
          </div>
        )
      },
    ],
  },
  collection: {
    thumbnails: [
      { 
        id: 'style1', 
        name: 'Product Grid',
        preview: (
          <div className="w-full aspect-video bg-muted/30 rounded-lg overflow-hidden p-2">
            <div className="grid grid-cols-3 gap-1 h-full">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded p-1 flex flex-col">
                  <div className="flex-1 bg-gradient-to-br from-primary/20 to-primary/30 rounded mb-1" />
                  <div className="text-[5px] font-medium">Product</div>
                  <div className="text-[4px] text-primary">$19.99</div>
                </div>
              ))}
            </div>
          </div>
        )
      },
      { 
        id: 'style2', 
        name: 'Product Slider',
        preview: (
          <div className="w-full aspect-video bg-muted/30 rounded-lg overflow-hidden p-2 flex gap-1">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-1/3 shrink-0 bg-white rounded p-1 flex flex-col">
                <div className="flex-1 bg-gradient-to-br from-amber-100 to-amber-200 rounded mb-1" />
                <div className="text-[5px] font-medium">Product</div>
              </div>
            ))}
          </div>
        )
      },
    ],
  },
  testimonials: {
    thumbnails: [
      { 
        id: 'style1', 
        name: 'Cards Grid',
        preview: (
          <div className="w-full aspect-video bg-muted/30 rounded-lg overflow-hidden p-2">
            <div className="grid grid-cols-2 gap-1 h-full">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="bg-white rounded p-1.5">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 mb-1" />
                  <div className="text-[5px] italic text-muted-foreground">"Great experience!"</div>
                  <div className="text-[4px] font-medium mt-1">John D.</div>
                </div>
              ))}
            </div>
          </div>
        )
      },
    ],
  },
  faq: {
    thumbnails: [
      { 
        id: 'style1', 
        name: 'Accordion',
        preview: (
          <div className="w-full aspect-video bg-muted/30 rounded-lg overflow-hidden p-2">
            <div className="text-[6px] font-semibold mb-1">FAQ</div>
            <div className="space-y-1">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded px-2 py-1 flex items-center justify-between">
                  <div className="text-[5px]">Question {i + 1}?</div>
                  <div className="text-[6px]">+</div>
                </div>
              ))}
            </div>
          </div>
        )
      },
    ],
  },
  newsletter: {
    thumbnails: [
      { 
        id: 'style1', 
        name: 'Simple Form',
        preview: (
          <div className="w-full aspect-video bg-muted/30 rounded-lg overflow-hidden p-2 flex flex-col items-center justify-center">
            <div className="text-[7px] font-semibold mb-1">Stay Updated</div>
            <div className="flex gap-1">
              <div className="w-16 h-3 bg-white rounded border text-[5px] px-1 text-muted-foreground">Email...</div>
              <div className="w-10 h-3 bg-primary rounded text-[5px] text-white flex items-center justify-center">Subscribe</div>
            </div>
          </div>
        )
      },
    ],
  },
  contact_us: {
    thumbnails: [
      { 
        id: 'style1', 
        name: 'Contact Form',
        preview: (
          <div className="w-full aspect-video bg-muted/30 rounded-lg overflow-hidden p-2 flex flex-col items-center justify-center">
            <div className="text-[7px] font-semibold mb-1">Get In Touch</div>
            <div className="w-full max-w-[80px] space-y-1">
              <div className="w-full h-2 bg-white rounded border" />
              <div className="w-full h-4 bg-white rounded border" />
              <div className="w-full h-3 bg-primary rounded text-[5px] text-white flex items-center justify-center">Send</div>
            </div>
          </div>
        )
      },
    ],
  },
  headline: {
    thumbnails: [
      { 
        id: 'style1', 
        name: 'Large Headline',
        preview: (
          <div className="w-full aspect-video bg-muted/30 rounded-lg overflow-hidden flex items-center justify-center">
            <div className="text-[12px] font-bold">Your Headline</div>
          </div>
        )
      },
    ],
  },
  sliding_banner: {
    thumbnails: [
      { 
        id: 'style1', 
        name: 'Scrolling Text',
        preview: (
          <div className="w-full aspect-video bg-muted/30 rounded-lg overflow-hidden flex items-center justify-center">
            <div className="w-full bg-primary/20 py-1.5 overflow-hidden">
              <div className="text-[6px] font-medium whitespace-nowrap animate-pulse">
                ✨ Scrolling text banner • Updates • Announcements ✨
              </div>
            </div>
          </div>
        )
      },
      { 
        id: 'style2', 
        name: 'Highlight Banner',
        preview: (
          <div className="w-full aspect-video bg-gradient-to-r from-primary/20 to-amber-500/20 rounded-lg overflow-hidden flex items-center justify-center">
            <div className="w-full py-1.5 overflow-hidden">
              <div className="text-[6px] font-bold whitespace-nowrap text-center">
                🔥 SALE NOW ON • LIMITED TIME 🔥
              </div>
            </div>
          </div>
        )
      },
    ],
  },
  about_me: {
    thumbnails: [
      { 
        id: 'style1', 
        name: 'With Avatar',
        preview: (
          <div className="w-full aspect-video bg-muted/30 rounded-lg overflow-hidden p-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-primary/50 shrink-0" />
            <div>
              <div className="text-[7px] font-semibold">About Me</div>
              <div className="text-[5px] text-muted-foreground">Welcome to my store!</div>
            </div>
          </div>
        )
      },
    ],
  },
  divider: {
    thumbnails: [
      { 
        id: 'style1', 
        name: 'Line',
        preview: (
          <div className="w-full h-8 bg-muted/30 rounded-lg overflow-hidden flex items-center justify-center px-4">
            <div className="w-full h-px bg-border" />
          </div>
        )
      },
    ],
  },
  logo_list: {
    thumbnails: [
      { 
        id: 'style1', 
        name: 'Logo Row',
        preview: (
          <div className="w-full aspect-[3/1] bg-muted/30 rounded-lg overflow-hidden p-2 flex items-center justify-center gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="w-6 h-6 bg-slate-300 rounded" />
            ))}
          </div>
        )
      },
    ],
  },
  featured_product: {
    thumbnails: [
      { 
        id: 'style1', 
        name: 'Product Card',
        preview: (
          <div className="w-full aspect-video bg-muted/30 rounded-lg overflow-hidden p-2 flex items-center justify-center">
            <div className="w-2/3 bg-white rounded p-2">
              <div className="aspect-square bg-gradient-to-br from-primary/20 to-primary/30 rounded mb-1" />
              <div className="text-[6px] font-semibold">Featured Product</div>
              <div className="text-[5px] text-primary">$49.99</div>
            </div>
          </div>
        )
      },
    ],
  },
  footer: {
    thumbnails: [
      { 
        id: 'style1', 
        name: 'Simple Footer',
        preview: (
          <div className="w-full aspect-[3/1] bg-slate-900 rounded-lg overflow-hidden p-3 flex items-center justify-center">
            <div className="text-center">
              <div className="flex gap-2 justify-center mb-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-3 h-3 rounded-full bg-white/20" />
                ))}
              </div>
              <div className="text-[6px] text-white/60">© 2026 Store Name. All rights reserved.</div>
            </div>
          </div>
        )
      },
      { 
        id: 'style2', 
        name: 'Multi-Column',
        preview: (
          <div className="w-full aspect-video bg-slate-900 rounded-lg overflow-hidden p-3">
            <div className="grid grid-cols-3 gap-2 mb-2">
              {[...Array(3)].map((_, i) => (
                <div key={i}>
                  <div className="text-[6px] text-white font-semibold mb-1">Column {i + 1}</div>
                  <div className="space-y-0.5">
                    <div className="text-[5px] text-white/50">Link 1</div>
                    <div className="text-[5px] text-white/50">Link 2</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center text-[5px] text-white/40 border-t border-white/10 pt-2">© 2026 Store Name</div>
          </div>
        )
      },
      { 
        id: 'style3', 
        name: 'Minimal',
        preview: (
          <div className="w-full aspect-[4/1] bg-black rounded-lg overflow-hidden p-2 flex items-center justify-center">
            <div className="text-[7px] text-white/50">© 2026 Store Name</div>
          </div>
        )
      },
    ],
  },
};

export function AddSectionPanel({ open, onClose, onAddSection, onPreviewSection }: AddSectionPanelProps) {
  const [selectedType, setSelectedType] = useState<SectionType>('image_with_text');
  const [hoveredPreset, setHoveredPreset] = useState<string | null>(null);

  const selectedTemplate = SECTION_TEMPLATES.find(t => t.type === selectedType);
  const presets = PRESET_PREVIEWS[selectedType]?.thumbnails || [];

  const handleSelectPreset = (presetId: string) => {
    // Clear preview before adding
    onPreviewSection?.(null);
    onAddSection(selectedType, presetId);
  };

  const handleTypeSelect = (type: SectionType) => {
    setSelectedType(type);
    setHoveredPreset(null);
    onPreviewSection?.(null);
  };

  const handlePresetHover = (presetId: string | null) => {
    setHoveredPreset(presetId);
    
    if (presetId && onPreviewSection) {
      const template = SECTION_TEMPLATES.find(t => t.type === selectedType);
      if (template) {
       let content;
       if (selectedType === 'footer') {
         if (presetId === 'style3') {
           content = { text: '© 2026 Your Store. All rights reserved.', showSocialLinks: false, columns: [], socialLinks: [] };
         } else if (presetId === 'style1') {
           content = { text: '© 2026 Your Store. All rights reserved.', showSocialLinks: true, columns: [], socialLinks: [] };
         } else {
           content = { text: '© 2026 Your Store. All rights reserved.', showSocialLinks: true, columns: [{ id: '1', title: 'Quick Links', links: [{ id: '1', label: 'Home', url: '/' }] }], socialLinks: [] };
         }
       } else {
         content = JSON.parse(JSON.stringify(template.defaultContent));
       }
        // Create a preview section
        const previewSection: ProfileSection = {
          id: 'preview-temp',
          profile_id: 'preview',
          section_type: selectedType,
          display_order: 999,
         content: content,
         style_options: { ...template.presets.find(p => p.id === presetId)?.styleOptions, preset: presetId },
          is_visible: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        onPreviewSection(previewSection);
      }
    } else {
      onPreviewSection?.(null);
    }
  };

  const handleClose = () => {
    onPreviewSection?.(null);
    setHoveredPreset(null);
    onClose();
  };

  // Group templates by category
  const groupedTemplates = SECTION_CATEGORIES.map(cat => ({
    ...cat,
    templates: SECTION_TEMPLATES.filter(t => t.category === cat.id),
  })).filter(g => g.templates.length > 0);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-4xl w-[95vw] h-[80vh] max-h-[80vh] p-0 gap-0 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="text-xl font-bold">Add New Section</h2>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar - Section Types */}
          <div className="w-56 border-r border-border bg-muted/30 shrink-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-3 space-y-4">
                {groupedTemplates.map((group) => (
                  <div key={group.id}>
                    <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 px-2">
                      {group.name}
                    </h4>
                    <div className="space-y-0.5">
                      {group.templates.map((template) => (
                        <button
                          key={template.type}
                          type="button"
                          onClick={() => handleTypeSelect(template.type)}
                          className={cn(
                            "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer",
                            selectedType === template.type
                              ? "bg-primary text-primary-foreground font-medium"
                              : "hover:bg-muted text-foreground"
                          )}
                        >
                          {template.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Right Panel - Preset Previews */}
          <div className="flex-1 bg-muted/10 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-6">
                {selectedTemplate && (
                  <>
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold mb-1">{selectedTemplate.name}</h3>
                      <p className="text-sm text-muted-foreground">{selectedTemplate.description}</p>
                    </div>

                    {presets.length > 0 ? (
                      <div className="grid grid-cols-2 gap-4">
                        {presets.map((preset, index) => (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => handleSelectPreset(preset.id)}
                            onMouseEnter={() => handlePresetHover(preset.id)}
                            onMouseLeave={() => handlePresetHover(null)}
                            className={cn(
                              "group relative bg-card rounded-xl border hover:shadow-lg transition-all overflow-hidden cursor-pointer text-left",
                              hoveredPreset === preset.id 
                                ? "border-primary ring-2 ring-primary/20" 
                                : "border-border hover:border-primary/50"
                            )}
                          >
                            {/* Preview number badge */}
                            <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-muted-foreground/80 text-white text-[10px] font-medium flex items-center justify-center z-10">
                              {index + 1}
                            </div>

                            {/* Preview indicator */}
                            {hoveredPreset === preset.id && (
                              <Badge 
                                variant="secondary" 
                                className="absolute top-2 left-2 z-10 bg-primary text-primary-foreground text-[10px]"
                              >
                                Preview
                              </Badge>
                            )}

                            {/* Preview content */}
                            <div className="p-3">
                              {preset.preview}
                            </div>

                            {/* Preset name */}
                            <div className="px-3 pb-2 text-xs font-medium text-muted-foreground">
                              {preset.name}
                            </div>

                            {/* Hover overlay */}
                            <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                              <div className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium">
                                Add This Layout
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground mb-4">Click to add this section</p>
                        <Button type="button" onClick={() => handleSelectPreset('style1')}>
                          Add {selectedTemplate.name}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
