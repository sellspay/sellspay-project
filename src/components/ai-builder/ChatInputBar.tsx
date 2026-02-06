import React, { useState, useRef, useEffect } from "react";
import { 
  Plus, Send, Image as ImageIcon, 
  History, Settings, X, Square,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e?: React.FormEvent) => void;
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

export function ChatInputBar({ 
  value, 
  onChange, 
  onSubmit, 
  isGenerating, 
  onCancel,
  placeholder = "Describe your vision..." 
}: ChatInputBarProps) {
  const [showMenu, setShowMenu] = useState(false);
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
        onSubmit();
      }
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (value.trim() && !isGenerating) {
      onSubmit();
    }
  };

  return (
    <div className="flex-shrink-0 p-4 bg-background relative">
      {/* Click outside to close menu */}
      {showMenu && (
        <div 
          className="fixed inset-0 z-40 bg-transparent" 
          onClick={() => setShowMenu(false)} 
        />
      )}

      {/* The floating input container */}
      <div className="relative bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl shadow-black/20">
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
            placeholder={placeholder}
            disabled={isGenerating}
            rows={1}
            className={cn(
              "flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-500",
              "resize-none outline-none py-2 px-1",
              "min-h-[36px] max-h-[200px]",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          />

          {/* Visual indicator */}
          <div className="pb-2 hidden sm:flex items-center gap-1.5 text-[10px] font-medium text-zinc-500 uppercase tracking-wider select-none">
            <span className="text-zinc-600">Plan</span>
            <div className="w-px h-3 bg-zinc-700" />
            <span className="text-violet-400">Visual</span>
          </div>

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
                  ? "bg-violet-600 text-white hover:bg-violet-500 shadow-lg shadow-violet-900/20"
                  : "bg-zinc-700/50 text-zinc-500 cursor-not-allowed"
            )}
          >
            {isGenerating ? (
              <Square size={16} className="fill-current" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>
      </div>

      {/* Footer disclaimer */}
      <div className="text-center mt-3">
        <p className="text-[10px] text-zinc-600">
          Vibecoder can make mistakes. Check generated code.
        </p>
      </div>
    </div>
  );
}
