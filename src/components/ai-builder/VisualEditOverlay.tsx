import { useState, useEffect } from 'react';
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
  path: string;
}

interface VisualEditPanelProps {
  selectedElement: SelectedElement | null;
  onBack: () => void;
  onEditRequest: (prompt: string) => void;
  isActive: boolean;
}

function EditableStyleRow({ label, value, onApply }: { label: string; value: string; onApply: (newVal: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState(value);

  useEffect(() => { setInputVal(value); }, [value]);

  if (!value || value === 'rgba(0, 0, 0, 0)' || value === 'transparent') return null;

  const handleSubmit = () => {
    setEditing(false);
    if (inputVal !== value) {
      onApply(inputVal);
    }
  };

  return (
    <div className="flex items-center justify-between py-1.5 group">
      <span className="text-[11px] text-zinc-500">{label}</span>
      {editing ? (
        <input
          autoFocus
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onBlur={handleSubmit}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); if (e.key === 'Escape') { setEditing(false); setInputVal(value); } }}
          className="w-28 text-right text-[11px] text-zinc-200 font-mono bg-zinc-800 border border-zinc-600 rounded px-1.5 py-0.5 outline-none focus:border-blue-500"
        />
      ) : (
        <button
          onClick={() => setEditing(true)}
          className={cn(
            "text-[11px] text-zinc-300 font-mono px-1.5 py-0.5 rounded transition-colors",
            "hover:bg-zinc-800 hover:text-blue-400 cursor-text"
          )}
        >
          {value}
        </button>
      )}
    </div>
  );
}

export function VisualEditPanel({ selectedElement, onBack, onEditRequest, isActive }: VisualEditPanelProps) {
  const [editPrompt, setEditPrompt] = useState('');

  const getDesc = () => {
    if (!selectedElement) return '';
    return selectedElement.text
      ? `the "${selectedElement.text.slice(0, 30)}" ${selectedElement.tagName.toLowerCase()}`
      : `the ${selectedElement.tagName.toLowerCase()} element`;
  };

  const handleQuickEdit = (action: string) => {
    if (!selectedElement) return;
    onEditRequest(`${action} ${getDesc()}`);
  };

  const handleStyleEdit = (prop: string, newVal: string) => {
    if (!selectedElement) return;
    onEditRequest(`Change the ${prop} of ${getDesc()} to ${newVal}`);
  };

  if (!isActive) return null;

  return (
    <div className="h-full flex flex-col bg-[#1a1a1a] overflow-y-auto custom-scrollbar">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-zinc-500">Design /</span>
          <span className="text-sm font-semibold text-zinc-200">Visual edits</span>
        </div>

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
                  <Box className="w-4 h-4 text-orange-400" />
                  <span className="text-sm font-medium text-zinc-200">
                    &lt;{selectedElement.tagName.toLowerCase()}&gt;
                  </span>
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

              {/* Editable computed styles */}
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium mb-2">Styles</p>
                <EditableStyleRow label="Color" value={selectedElement.styles.color} onApply={(v) => handleStyleEdit('color', v)} />
                <EditableStyleRow label="Font size" value={selectedElement.styles.fontSize} onApply={(v) => handleStyleEdit('font-size', v)} />
                <EditableStyleRow label="Font weight" value={selectedElement.styles.fontWeight} onApply={(v) => handleStyleEdit('font-weight', v)} />
                <EditableStyleRow label="Padding" value={selectedElement.styles.padding} onApply={(v) => handleStyleEdit('padding', v)} />
                <EditableStyleRow label="Margin" value={selectedElement.styles.margin} onApply={(v) => handleStyleEdit('margin', v)} />
                <EditableStyleRow label="Border radius" value={selectedElement.styles.borderRadius} onApply={(v) => handleStyleEdit('border-radius', v)} />
              </div>

              {/* Quick edit actions */}
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Quick edits</p>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => handleQuickEdit('Change the text color of')} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900/80 border border-zinc-800/50 hover:border-zinc-700/60 text-xs text-zinc-300 transition-colors">
                    <Palette className="w-3.5 h-3.5 text-zinc-500" />
                    Change color
                  </button>
                  <button onClick={() => handleQuickEdit('Change the font size of')} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900/80 border border-zinc-800/50 hover:border-zinc-700/60 text-xs text-zinc-300 transition-colors">
                    <Type className="w-3.5 h-3.5 text-zinc-500" />
                    Font size
                  </button>
                  <button onClick={() => handleQuickEdit('Change the text content of')} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900/80 border border-zinc-800/50 hover:border-zinc-700/60 text-xs text-zinc-300 transition-colors">
                    <Pencil className="w-3.5 h-3.5 text-zinc-500" />
                    Edit text
                  </button>
                  <button onClick={() => handleQuickEdit('Remove')} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900/80 border border-zinc-800/50 hover:border-red-500/30 text-xs text-zinc-300 hover:text-red-400 transition-colors">
                    <Box className="w-3.5 h-3.5 text-zinc-500" />
                    Remove
                  </button>
                </div>
              </div>

              {/* Custom edit prompt */}
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Custom edit</p>
                <input
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && editPrompt.trim()) {
                      onEditRequest(`For ${getDesc()}: ${editPrompt.trim()}`);
                      setEditPrompt('');
                    }
                  }}
                  placeholder="e.g. make it bigger, add shadow..."
                  className="w-full bg-zinc-900/80 border border-zinc-800/50 rounded-lg px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
                />
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
