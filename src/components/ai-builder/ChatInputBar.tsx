import React, { useState, useRef, useEffect } from "react";
import { 
  Plus, Send, Image as ImageIcon, 
  History, Settings, X, Square,
  Sparkles, ChevronDown, Bot, Zap, BrainCircuit, FileText, ArrowUp
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e?: React.FormEvent, isPlanMode?: boolean, model?: string) => void;
  isGenerating: boolean;
  onCancel: () => void;
  placeholder?: string;
}

function MenuItem({ 
  icon: Icon, 
  label, 
  shortcut, 
  onClick 
}: { 
  icon: React.ElementType; 
  label: string; 
  shortcut?: string;
  onClick?: () => void;
}) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center justify-between px-3 py-2 text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors group text-left"
    >
      <div className="flex items-center gap-2.5">
        <Icon size={14} className="group-hover:text-violet-400 transition-colors" />
        <span>{label}</span>
      </div>
      {shortcut && <span className="text-xs text-zinc-600 font-mono">{shortcut}</span>}
    </button>
  );
}

function ModelOption({ 
  name, 
  desc, 
  icon: Icon, 
  active, 
  onClick 
}: { 
  name: string; 
  desc: string; 
  icon: React.ElementType; 
  active: boolean; 
  onClick: () => void;
}) {
  return (
    <button 
      onClick={onClick} 
      className={cn(
        "w-full flex items-start gap-3 px-3 py-2 rounded-lg text-left transition-colors",
        active ? "bg-zinc-800" : "hover:bg-zinc-800"
      )}
    >
      <div className={cn("mt-0.5", active ? "text-violet-400" : "text-zinc-500")}>
        <Icon size={16} />
      </div>
      <div>
        <div className={cn("text-xs font-medium", active ? "text-white" : "text-zinc-300")}>
          {name}
        </div>
        <div className="text-[10px] text-zinc-500">{desc}</div>
      </div>
    </button>
  );
}

export function ChatInputBar({ 
  value, 
  onChange, 
  onSubmit, 
  isGenerating, 
  onCancel,
  placeholder = "Describe your vision..." 
}: ChatInputBarProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [isPlanMode, setIsPlanMode] = useState(false);
  const [selectedModel, setSelectedModel] = useState("Vibecoder Pro");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const newHeight = Math.min(textareaRef.current.scrollHeight, 200);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isGenerating) {
        onSubmit(undefined, isPlanMode, selectedModel);
      }
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (value.trim() && !isGenerating) {
      onSubmit(undefined, isPlanMode, selectedModel);
    }
  };

  return (
    <div className="flex-shrink-0 p-4 bg-background relative">
      {/* Click outside to close menus */}
      {(showMenu || showModelMenu) && (
        <div 
          className="fixed inset-0 z-40 bg-transparent" 
          onClick={() => {
            setShowMenu(false);
            setShowModelMenu(false);
          }} 
        />
      )}

      {/* The floating input container */}
      <div className={cn(
        "relative bg-zinc-900/80 backdrop-blur-xl border rounded-2xl shadow-2xl shadow-black/20 transition-all duration-300",
        isPlanMode 
          ? "border-blue-500/30 ring-1 ring-blue-500/20" 
          : "border-zinc-800 focus-within:ring-1 focus-within:ring-violet-500/50 focus-within:border-violet-500/50"
      )}>
        
        {/* TOP BAR: MODEL SELECTOR */}
        <div className="flex items-center px-3 pt-2.5 pb-0">
          <div className="relative">
            <button 
              onClick={() => setShowModelMenu(!showModelMenu)}
              className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400 hover:text-zinc-200 transition-colors px-2 py-1 rounded-md hover:bg-zinc-700/50"
            >
              <Bot size={12} className={isPlanMode ? "text-blue-400" : "text-violet-400"} />
              <span>{selectedModel}</span>
              <ChevronDown size={10} className={cn("transition-transform", showModelMenu && "rotate-180")} />
            </button>

            {/* MODEL DROPDOWN */}
            {showModelMenu && (
              <div className="absolute top-8 left-0 w-52 bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/50 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50 animate-in fade-in-0 zoom-in-95 duration-150">
                <div className="p-1.5">
                  <ModelOption 
                    name="Vibecoder Pro" 
                    desc="Best for complex layouts" 
                    icon={Sparkles} 
                    active={selectedModel === "Vibecoder Pro"}
                    onClick={() => { setSelectedModel("Vibecoder Pro"); setShowModelMenu(false); }}
                  />
                  <ModelOption 
                    name="Vibecoder Flash" 
                    desc="Fast, for small edits" 
                    icon={Zap} 
                    active={selectedModel === "Vibecoder Flash"}
                    onClick={() => { setSelectedModel("Vibecoder Flash"); setShowModelMenu(false); }}
                  />
                  <ModelOption 
                    name="Reasoning o1" 
                    desc="Deep thought architecture" 
                    icon={BrainCircuit} 
                    active={selectedModel === "Reasoning o1"}
                    onClick={() => { setSelectedModel("Reasoning o1"); setShowModelMenu(false); }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-end gap-2 p-2">
          
          {/* Plus menu button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className={cn(
                "p-2 rounded-xl transition-all",
                showMenu 
                  ? "bg-zinc-700 text-white" 
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50"
              )}
            >
              <Plus size={18} className={cn("transition-transform", showMenu && "rotate-45")} />
            </button>

            {/* Popup menu */}
            {showMenu && (
              <div className="absolute bottom-full left-0 mb-2 z-50 w-56 bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/50 rounded-xl shadow-2xl shadow-black/50 p-1.5 animate-in fade-in-0 zoom-in-95 duration-150">
                <div className="px-2 py-1.5 mb-1">
                  <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-medium">
                    Attachments
                  </span>
                </div>
                <MenuItem icon={ImageIcon} label="Upload Image" shortcut="⌘I" />
                <MenuItem icon={Sparkles} label="Generate Asset" />
                
                <div className="h-px bg-zinc-800 my-1.5" />
                
                <MenuItem icon={History} label="History" shortcut="⌘H" />
                <MenuItem icon={Settings} label="Settings" />
              </div>
            )}
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isPlanMode ? "Describe the features to plan..." : placeholder}
            disabled={isGenerating}
            rows={1}
            className={cn(
              "flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-500",
              "resize-none outline-none py-2 px-1",
              "min-h-[36px] max-h-[200px]",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          />

          <div className="flex items-center gap-2 pb-0.5">
            
            {/* THE PLAN TOGGLE BUTTON */}
            <button
              type="button"
              onClick={() => setIsPlanMode(!isPlanMode)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all select-none",
                isPlanMode 
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" 
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700/30"
              )}
              title="Plan Mode: Creates a blueprint before coding"
            >
              <FileText size={13} />
              <span>Plan</span>
            </button>

            {/* Send/Stop button */}
            <button
              type="button"
              onClick={isGenerating ? onCancel : handleSubmit}
              disabled={!value.trim() && !isGenerating}
              className={cn(
                "p-2 rounded-xl shrink-0 transition-all",
                isGenerating
                  ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                  : value.trim()
                    ? isPlanMode
                      ? "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-900/20"
                      : "bg-violet-600 text-white hover:bg-violet-500 shadow-lg shadow-violet-900/20"
                    : "bg-zinc-700/50 text-zinc-500 cursor-not-allowed"
              )}
            >
              {isGenerating ? (
                <Square size={16} className="fill-current" />
              ) : (
                <ArrowUp size={16} strokeWidth={2.5} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Footer disclaimer */}
      <div className="text-center mt-3">
        <p className="text-[10px] text-zinc-600">
          Vibecoder can make mistakes. Review generated code.
        </p>
      </div>
    </div>
  );
}
