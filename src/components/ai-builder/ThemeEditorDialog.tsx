import { useState, useCallback, useEffect } from "react";
import { X, ChevronDown, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { type StylePreset } from "./stylePresets";
import { cn } from "@/lib/utils";

interface ColorGroup {
  label: string;
  colors: { key: string; label: string; value: string }[];
}

function buildColorGroups(colors: StylePreset['colors']): ColorGroup[] {
  return [
    {
      label: 'Primary',
      colors: [
        { key: 'primary', label: 'Primary', value: colors.primary },
        { key: 'text', label: 'Primary Text', value: colors.text },
      ],
    },
    {
      label: 'Accent',
      colors: [
        { key: 'accent', label: 'Accent', value: colors.accent },
      ],
    },
    {
      label: 'Base',
      colors: [
        { key: 'background', label: 'Background', value: colors.background },
        { key: 'surface', label: 'Surface', value: colors.surface },
      ],
    },
    {
      label: 'Muted',
      colors: [
        { key: 'muted', label: 'Muted', value: colors.muted },
      ],
    },
  ];
}

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

function CollapsibleGroup({ label, colors, onColorChange, defaultOpen = false }: {
  label: string;
  colors: { key: string; label: string; value: string }[];
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
                <ColorRow key={c.key} label={c.label} value={c.value} onChange={(val) => onColorChange(c.key, val)} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ThemeDots({ colors }: { colors: StylePreset['colors'] }) {
  const dots = [colors.primary, colors.accent, colors.background, colors.surface, colors.text];
  return (
    <div className="flex items-center gap-1">
      {dots.map((c, i) => (
        <div key={i} className="w-3.5 h-3.5 rounded-full border border-white/10" style={{ backgroundColor: c || '#333' }} />
      ))}
    </div>
  );
}

interface ThemeEditorDialogProps {
  open: boolean;
  onClose: () => void;
  style: StylePreset;
  onApply: (style: StylePreset) => void;
  onLivePreview?: (colors: StylePreset['colors']) => void;
}

export function ThemeEditorDialog({ open, onClose, style, onApply, onLivePreview }: ThemeEditorDialogProps) {
  const [editColors, setEditColors] = useState<StylePreset['colors']>({ ...style.colors });
  const [activeTab, setActiveTab] = useState<'colors' | 'typography' | 'effects'>('colors');

  useEffect(() => {
    setEditColors({ ...style.colors });
  }, [style]);

  const handleColorChange = useCallback((key: string, value: string) => {
    setEditColors(prev => {
      const updated = { ...prev, [key]: value };
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

  const colorGroups = buildColorGroups(editColors);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex">
      {/* Semi-transparent backdrop — clicking it discards */}
      <div className="absolute inset-0 bg-black/60" onClick={handleDiscard} />

      {/* Left panel — editor controls */}
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -20, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="relative z-10 w-[340px] h-full bg-[#141414] border-r border-zinc-800 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">Manage themes</h3>
            <p className="text-[11px] text-zinc-500 mt-0.5">Customize the look and feel of your app</p>
          </div>
          <button onClick={handleDiscard} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Theme selector row */}
        <div className="px-5 pt-4 pb-2">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900">
            <span className="text-sm text-zinc-200 flex-1">{style.name}</span>
            <ThemeDots colors={editColors} />
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
          {activeTab === 'colors' && colorGroups.map((group, i) => (
            <CollapsibleGroup
              key={group.label}
              label={group.label}
              colors={group.colors}
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

        {/* Footer actions */}
        <div className="flex items-center justify-between gap-2 px-5 py-3 border-t border-zinc-800">
          <button
            onClick={handleDiscard}
            className="px-3 py-1.5 text-xs font-medium text-zinc-400 border border-zinc-700 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            Discard changes
          </button>
          <button
            onClick={handleSave}
            className="px-3 py-1.5 text-xs font-medium text-zinc-100 border border-zinc-600 rounded-lg bg-zinc-700 hover:bg-zinc-600 transition-colors"
          >
            Save as new theme
          </button>
        </div>
      </motion.div>

      {/* Right side — preview remains visible through the semi-transparent backdrop */}
    </div>
  );
}
