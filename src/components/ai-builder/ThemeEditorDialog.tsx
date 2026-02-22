import { useState, useCallback, useEffect } from "react";
import { X, ChevronDown, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { type StylePreset, type StyleColors } from "./stylePresets";
import { cn } from "@/lib/utils";

interface ColorGroup {
  label: string;
  colors: { key: keyof StyleColors; label: string }[];
}

const COLOR_GROUPS: ColorGroup[] = [
  {
    label: 'Primary',
    colors: [
      { key: 'primary', label: 'Primary' },
      { key: 'primary-foreground', label: 'Primary text' },
    ],
  },
  {
    label: 'Secondary',
    colors: [
      { key: 'secondary', label: 'Secondary' },
      { key: 'secondary-foreground', label: 'Secondary text' },
    ],
  },
  {
    label: 'Accent',
    colors: [
      { key: 'accent', label: 'Accent' },
      { key: 'accent-foreground', label: 'Accent text' },
    ],
  },
  {
    label: 'Base',
    colors: [
      { key: 'background', label: 'Background' },
      { key: 'foreground', label: 'Text' },
    ],
  },
  {
    label: 'Card',
    colors: [
      { key: 'card', label: 'Card' },
      { key: 'card-foreground', label: 'Card text' },
    ],
  },
  {
    label: 'Popover',
    colors: [
      { key: 'popover', label: 'Popover' },
      { key: 'popover-foreground', label: 'Popover text' },
    ],
  },
  {
    label: 'Muted',
    colors: [
      { key: 'muted', label: 'Muted' },
      { key: 'muted-foreground', label: 'Muted text' },
    ],
  },
  {
    label: 'Destructive',
    colors: [
      { key: 'destructive', label: 'Destructive' },
      { key: 'destructive-foreground', label: 'Destructive text' },
    ],
  },
  {
    label: 'Border & Input',
    colors: [
      { key: 'border', label: 'Border' },
      { key: 'input', label: 'Input' },
      { key: 'ring', label: 'Focus ring' },
    ],
  },
  {
    label: 'Chart',
    colors: [
      { key: 'chart-1', label: 'Chart 1' },
      { key: 'chart-2', label: 'Chart 2' },
      { key: 'chart-3', label: 'Chart 3' },
      { key: 'chart-4', label: 'Chart 4' },
      { key: 'chart-5', label: 'Chart 5' },
    ],
  },
];

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleInputChange = (newVal: string) => {
    setInputValue(newVal);
    if (/^#[0-9a-fA-F]{6}$/.test(newVal)) {
      onChange(newVal);
    }
  };

  return (
    <div className="flex items-center gap-3 py-2 px-1">
      <label className="relative w-5 h-5 shrink-0">
        <input
          type="color"
          value={value}
          onChange={(e) => {
            setInputValue(e.target.value);
            onChange(e.target.value);
          }}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
        />
        <div
          className="w-5 h-5 rounded-full border border-white/20 cursor-pointer"
          style={{ backgroundColor: value }}
        />
      </label>
      <span className="text-sm text-zinc-300 flex-1">{label}</span>
      <input
        type="text"
        value={inputValue}
        onChange={(e) => handleInputChange(e.target.value)}
        className="w-20 text-right text-xs text-zinc-400 bg-transparent border-none outline-none font-mono"
      />
    </div>
  );
}

function CollapsibleGroup({ label, colors, editColors, onColorChange, defaultOpen = false }: {
  label: string;
  colors: ColorGroup['colors'];
  editColors: StyleColors;
  onColorChange: (key: string, value: string) => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-zinc-800 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-800/40 transition-colors"
      >
        <span className="text-sm font-medium text-zinc-200">{label}</span>
        {open ? <ChevronDown className="w-4 h-4 text-zinc-500" /> : <ChevronRight className="w-4 h-4 text-zinc-500" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 space-y-1">
              {colors.map((c) => (
                <ColorRow
                  key={c.key}
                  label={c.label}
                  value={editColors[c.key] || '#000000'}
                  onChange={(val) => onColorChange(c.key, val)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface ThemeEditorDialogProps {
  open: boolean;
  onClose: () => void;
  style: StylePreset;
  onApply: (style: StylePreset) => void;
  onLivePreview?: (colors: StyleColors) => void;
}

export function ThemeEditorDialog({ open, onClose, style, onApply, onLivePreview }: ThemeEditorDialogProps) {
  const [editColors, setEditColors] = useState<StyleColors>({ ...style.colors });
  const [activeTab, setActiveTab] = useState<'colors' | 'typography' | 'effects'>('colors');

  useEffect(() => {
    setEditColors({ ...style.colors });
  }, [style]);

  const handleColorChange = useCallback((key: string, value: string) => {
    setEditColors(prev => {
      const updated = { ...prev, [key]: value } as StyleColors;
      onLivePreview?.(updated);
      return updated;
    });
  }, [onLivePreview]);

  const handleDiscard = () => {
    setEditColors({ ...style.colors });
    onLivePreview?.(style.colors);
    onClose();
  };

  const handleSave = () => {
    onApply({ ...style, colors: editColors });
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex pointer-events-none">
      {/* Backdrop - only captures clicks, allows scroll through */}
      <div className="absolute inset-0 bg-black/20 pointer-events-auto" onClick={handleDiscard} style={{ cursor: 'default' }} />

      {/* Left panel */}
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -20, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="relative z-10 w-[340px] h-full bg-[#0a0a0a] border-r border-zinc-800 flex flex-col pointer-events-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">Manage themes</h3>
            <p className="text-[11px] text-zinc-500 mt-0.5">Customize the look and feel</p>
          </div>
          <button onClick={handleDiscard} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Theme name row */}
        <div className="px-5 pt-4 pb-2">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-900/60">
            <span className="text-sm text-zinc-200 flex-1">{style.name}</span>
            <div className="flex items-center gap-1">
              {[editColors.primary, editColors.accent, editColors.background, editColors.foreground].map((c, i) => (
                <div key={i} className="w-3.5 h-3.5 rounded-full border border-white/10" style={{ backgroundColor: c || '#333' }} />
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-5 pt-2 pb-1">
          <div className="flex gap-1 bg-zinc-900 rounded-lg p-1">
            {(['colors', 'typography', 'effects'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "flex-1 text-xs py-1.5 rounded-md transition-colors capitalize",
                  activeTab === tab ? "bg-zinc-700 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-3 space-y-2">
          {activeTab === 'colors' && COLOR_GROUPS.map((group, i) => (
            <CollapsibleGroup
              key={group.label}
              label={group.label}
              colors={group.colors}
              editColors={editColors}
              onColorChange={handleColorChange}
              defaultOpen={i === 0}
            />
          ))}
          {activeTab === 'typography' && (
            <div className="py-8 text-center text-xs text-zinc-500">Typography settings coming soon</div>
          )}
          {activeTab === 'effects' && (
            <div className="py-8 text-center text-xs text-zinc-500">Effects settings coming soon</div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 px-5 py-3 border-t border-zinc-800">
          <button
            onClick={handleDiscard}
            className="px-3 py-1.5 text-xs font-medium text-zinc-400 border border-zinc-700 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            Discard
          </button>
          <button
            onClick={handleSave}
            className="px-3 py-1.5 text-xs font-medium text-zinc-100 border border-zinc-600 rounded-lg bg-zinc-700 hover:bg-zinc-600 transition-colors"
          >
            Save changes
          </button>
        </div>
      </motion.div>
    </div>
  );
}
