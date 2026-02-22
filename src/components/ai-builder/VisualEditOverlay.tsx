import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Type, Palette, Box, MousePointer2, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface SelectedElement {
  tagName: string;
  text: string;
  classList: string[];
  id?: string;
  styles: {
    color: string;
    backgroundColor: string;
    fontSize: string;
    fontWeight: string;
    padding: string;
    margin: string;
    borderRadius: string;
  };
  path: string; // CSS selector path
}

interface VisualEditPanelProps {
  selectedElement: SelectedElement | null;
  onBack: () => void;
  onEditRequest: (prompt: string) => void;
  isActive: boolean;
}

function StyleRow({ label, value }: { label: string; value: string }) {
  if (!value || value === 'rgba(0, 0, 0, 0)' || value === 'transparent') return null;
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-[11px] text-zinc-500">{label}</span>
      <span className="text-[11px] text-zinc-300 font-mono">{value}</span>
    </div>
  );
}

export function VisualEditPanel({ selectedElement, onBack, onEditRequest, isActive }: VisualEditPanelProps) {
  const [editPrompt, setEditPrompt] = useState('');

  const handleQuickEdit = (action: string) => {
    if (!selectedElement) return;
    const desc = selectedElement.text
      ? `the "${selectedElement.text.slice(0, 30)}" ${selectedElement.tagName.toLowerCase()}`
      : `the ${selectedElement.tagName.toLowerCase()} element`;
    onEditRequest(`${action} ${desc}`);
  };

  if (!isActive) return null;

  return (
    <div className="h-full flex flex-col bg-[#1a1a1a]">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-zinc-500">Design /</span>
          <span className="text-sm font-semibold text-zinc-200">Visual edits</span>
        </div>

        {/* Selection state */}
        <AnimatePresence mode="wait">
          {selectedElement ? (
            <motion.div
              key="selected"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4"
            >
              {/* Element info card */}
              <div className="rounded-xl bg-zinc-900/80 border border-zinc-800/50 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Box className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium text-zinc-200">
                    &lt;{selectedElement.tagName.toLowerCase()}&gt;
                  </span>
                  {selectedElement.id && (
                    <span className="text-[10px] text-zinc-500 font-mono">#{selectedElement.id}</span>
                  )}
                </div>
                {selectedElement.text && (
                  <p className="text-xs text-zinc-400 truncate">
                    "{selectedElement.text.slice(0, 60)}{selectedElement.text.length > 60 ? '...' : ''}"
                  </p>
                )}
                {selectedElement.classList.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedElement.classList.slice(0, 6).map((cls, i) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-500 font-mono">
                        .{cls}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Computed styles */}
              <div className="rounded-xl bg-zinc-900/80 border border-zinc-800/50 p-4 space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium mb-2">Styles</p>
                <StyleRow label="Color" value={selectedElement.styles.color} />
                <StyleRow label="Background" value={selectedElement.styles.backgroundColor} />
                <StyleRow label="Font size" value={selectedElement.styles.fontSize} />
                <StyleRow label="Font weight" value={selectedElement.styles.fontWeight} />
                <StyleRow label="Padding" value={selectedElement.styles.padding} />
                <StyleRow label="Margin" value={selectedElement.styles.margin} />
                <StyleRow label="Border radius" value={selectedElement.styles.borderRadius} />
              </div>

              {/* Quick edit actions */}
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Quick edits</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleQuickEdit('Change the text color of')}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900/80 border border-zinc-800/50 hover:border-zinc-700/60 text-xs text-zinc-300 transition-colors"
                  >
                    <Palette className="w-3.5 h-3.5 text-zinc-500" />
                    Change color
                  </button>
                  <button
                    onClick={() => handleQuickEdit('Change the font size of')}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900/80 border border-zinc-800/50 hover:border-zinc-700/60 text-xs text-zinc-300 transition-colors"
                  >
                    <Type className="w-3.5 h-3.5 text-zinc-500" />
                    Font size
                  </button>
                  <button
                    onClick={() => handleQuickEdit('Change the text content of')}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900/80 border border-zinc-800/50 hover:border-zinc-700/60 text-xs text-zinc-300 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5 text-zinc-500" />
                    Edit text
                  </button>
                  <button
                    onClick={() => handleQuickEdit('Remove')}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900/80 border border-zinc-800/50 hover:border-red-500/30 text-xs text-zinc-300 hover:text-red-400 transition-colors"
                  >
                    <Box className="w-3.5 h-3.5 text-zinc-500" />
                    Remove
                  </button>
                </div>
              </div>

              {/* Custom edit prompt */}
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Custom edit</p>
                <div className="flex gap-2">
                  <input
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && editPrompt.trim()) {
                        const desc = selectedElement.text
                          ? `the "${selectedElement.text.slice(0, 30)}" ${selectedElement.tagName.toLowerCase()}`
                          : `the ${selectedElement.tagName.toLowerCase()} element`;
                        onEditRequest(`For ${desc}: ${editPrompt.trim()}`);
                        setEditPrompt('');
                      }
                    }}
                    placeholder="e.g. make it bigger, add shadow..."
                    className="flex-1 bg-zinc-900/80 border border-zinc-800/50 rounded-lg px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
                  />
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <MousePointer2 className="w-10 h-10 text-zinc-600 mb-4" />
              <h3 className="text-base font-semibold text-zinc-300">Click to select</h3>
              <p className="text-xs text-zinc-500 mt-2 max-w-[200px]">
                Click any element in the preview to inspect and edit it
              </p>
              <p className="text-[10px] text-zinc-600 font-mono mt-3">
                Hold <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400">Ctrl</kbd> for multi-select
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
