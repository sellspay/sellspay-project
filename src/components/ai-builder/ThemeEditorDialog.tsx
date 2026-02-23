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

/**
 * Convert HSL string "H S% L%" to hex "#RRGGBB"
 */
function hslToHex(hslStr: string): string {
  // If already hex, return as-is
  if (hslStr.startsWith('#')) return hslStr;
  
  const parts = hslStr.match(/[\d.]+/g);
  if (!parts || parts.length < 3) return '#000000';
  
  const h = parseFloat(parts[0]) / 360;
  const s = parseFloat(parts[1]) / 100;
  const l = parseFloat(parts[2]) / 100;

  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  const toHex = (c: number) => {
    const hex = Math.round(c * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Convert hex "#RRGGBB" to HSL string "H S% L%"
 */
function hexToHSL(hex: string): string {
  // If already HSL format, return as-is
  if (!hex.startsWith('#')) return hex;

  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  // Convert HSL to hex for the color picker display
  const hexValue = hslToHex(value);
  const [inputValue, setInputValue] = useState(hexValue);

  useEffect(() => {
    setInputValue(hslToHex(value));
  }, [value]);

  const handleHexChange = (hex: string) => {
    setInputValue(hex);
    if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
      // Convert hex to HSL before passing up
      onChange(hexToHSL(hex));
    }
  };

  return (
    <div className="flex items-center gap-3 py-2 px-1">
      <label className="relative w-5 h-5 shrink-0">
        <input
          type="color"
          value={hexValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            onChange(hexToHSL(e.target.value));
          }}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
        />
        <div
          className="w-5 h-5 rounded-full border border-white/20 cursor-pointer"
          style={{ backgroundColor: hexValue }}
        />
      </label>
      <span className="text-sm text-zinc-300 flex-1">{label}</span>
      <input
        type="text"
        value={inputValue}
        onChange={(e) => handleHexChange(e.target.value)}
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
                  value={editColors[c.key] || '0 0% 0%'}
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
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -20, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed left-0 top-0 z-[100] w-[340px] h-full bg-[#0a0a0a] border-r border-zinc-800 flex flex-col"
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
              <div key={i} className="w-3.5 h-3.5 rounded-full border border-white/10" style={{ backgroundColor: `hsl(${c || '0 0% 0%'})` }} />
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
  );
}
