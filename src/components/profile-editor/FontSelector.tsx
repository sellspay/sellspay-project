import { useState, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, X, Loader2 } from 'lucide-react';
import type { FontOption, CustomFont } from './types';

interface FontSelectorProps {
  font?: FontOption;
  customFont?: CustomFont;
  onChange: (updates: { font?: FontOption; customFont?: CustomFont }) => void;
}

export const FONT_OPTIONS: { value: FontOption; label: string; className: string }[] = [
  { value: 'default', label: 'Default (System)', className: 'font-sans' },
  { value: 'serif', label: 'Serif (Elegant)', className: 'font-serif' },
  { value: 'mono', label: 'Monospace (Code)', className: 'font-mono' },
  { value: 'display', label: 'Display (Bold)', className: 'font-display' },
  { value: 'handwritten', label: 'Handwritten (Casual)', className: 'font-handwritten' },
  { value: 'condensed', label: 'Condensed (Compact)', className: 'font-condensed' },
  { value: 'custom', label: 'Custom Font...', className: '' },
];

export function FontSelector({ font = 'default', customFont, onChange }: FontSelectorProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFontUpload = async (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    const validExtensions = ['ttf', 'otf', 'woff', 'woff2'];
    
    if (!validExtensions.includes(extension || '')) {
      toast.error('Please upload a TTF, OTF, WOFF, or WOFF2 font file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Font file must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const fileName = `fonts/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const { error: uploadError } = await supabase.storage
        .from('product-media')
        .upload(fileName, file, { cacheControl: '31536000' });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-media')
        .getPublicUrl(fileName);

      // Extract font name from filename
      const fontName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      
      onChange({ 
        font: 'custom', 
        customFont: { name: fontName, url: publicUrl } 
      });
      toast.success('Font uploaded successfully');
    } catch (err) {
      console.error('Font upload error:', err);
      toast.error('Failed to upload font');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <Label>Font Style</Label>
        <Select
          value={font}
          onValueChange={(value: FontOption) => {
            if (value !== 'custom') {
              onChange({ font: value, customFont: undefined });
            } else {
              onChange({ font: value });
            }
          }}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <span className={option.className}>{option.label}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {font === 'custom' && (
        <div className="space-y-2">
          {customFont ? (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <div className="flex-1">
                <p className="text-sm font-medium">{customFont.name}</p>
                <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                  {customFont.url.split('/').pop()}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onChange({ font: 'custom', customFont: undefined })}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div>
              <Button
                variant="outline"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
                className="w-full"
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                {uploading ? 'Uploading...' : 'Upload Font File'}
              </Button>
              <p className="text-xs text-muted-foreground mt-1">
                Supports TTF, OTF, WOFF, WOFF2 (max 5MB)
              </p>
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            accept=".ttf,.otf,.woff,.woff2"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFontUpload(file);
              e.target.value = '';
            }}
          />
        </div>
      )}
    </div>
  );
}

// Re-export utilities
export { getFontClassName, getCustomFontStyle, useCustomFont } from './hooks/useCustomFont';
