import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { 
  Plus, Send, Image as ImageIcon, 
  History, Settings, X, Square,
  Sparkles, ChevronDown, Bot, Zap, BrainCircuit, FileText, ArrowUp,
  Paperclip, Film, Video, Coins, Mic
} from "lucide-react";
import { cn } from "@/lib/utils";

// Speech Recognition type declarations
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}

// --- MODEL CONFIGURATION (Single Source of Truth) ---
// Updated Fair Pricing: 8x reduction to match actual API costs
export const AI_MODELS = {
  code: [
    { id: "vibecoder-pro", name: "Vibecoder Pro", desc: "Best for complex layouts", cost: 3, icon: Sparkles, category: "code" },
    { id: "vibecoder-flash", name: "Vibecoder Flash", desc: "Fast, for small edits", cost: 0, icon: Zap, category: "code" },
  ],
  image: [
    { id: "nano-banana", name: "Nano Banana", desc: "Gemini Image Gen", cost: 10, icon: ImageIcon, category: "image" },
    { id: "flux-pro", name: "Flux 1.1 Pro", desc: "High quality images", cost: 10, icon: Sparkles, category: "image" },
    { id: "recraft-v3", name: "Recraft V3", desc: "Vector & SVG ready", cost: 10, icon: ImageIcon, category: "image" },
  ],
  video: [
    { id: "luma-ray-2", name: "Luma Ray 2", desc: "Premium video gen", cost: 50, icon: Film, category: "video" },
    { id: "kling-video", name: "Kling Video", desc: "High quality video", cost: 50, icon: Video, category: "video" },
  ],
} as const;

export type AIModel = typeof AI_MODELS.code[number] | typeof AI_MODELS.image[number] | typeof AI_MODELS.video[number];

interface ChatInputBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (options: { 
    isPlanMode: boolean; 
    model: AIModel; 
    attachments: File[];
  }) => void;
  isGenerating: boolean;
  onCancel: () => void;
  placeholder?: string;
  userCredits?: number;
  onGenerateAsset?: () => void;
  onOpenHistory?: () => void;
  onOpenSettings?: () => void;
  // Controlled model state (lifted from parent)
  activeModel?: AIModel;
  onModelChange?: (model: AIModel) => void;
}

// Portal component to render children directly on document.body
const Portal = ({ children }: { children: React.ReactNode }) => {
  if (typeof window === "undefined") return null;
  return createPortal(children, document.body);
};

function MenuItem({ 
  icon: Icon, 
  label, 
  shortcut, 
  onClick,
  disabled
}: { 
  icon: React.ElementType; 
  label: string; 
  shortcut?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full flex items-center justify-between px-3 py-2 text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors group text-left",
        disabled && "opacity-50 cursor-not-allowed"
      )}
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
  model,
  active, 
  onClick,
  canAfford
}: { 
  model: AIModel;
  active: boolean; 
  onClick: () => void;
  canAfford: boolean;
}) {
  const Icon = model.icon;
  
  return (
    <button 
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }} 
      className={cn(
        "w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors",
        active ? "bg-zinc-800" : "hover:bg-zinc-800/60",
        !canAfford && "opacity-50"
      )}
    >
      <div className="flex items-center gap-2.5">
        <div className={cn("p-1 rounded", active ? "text-violet-400" : "text-zinc-500")}>
          <Icon size={14} />
        </div>
        <div>
          <div className={cn("text-xs font-medium", active ? "text-white" : "text-zinc-300")}>
            {model.name}
          </div>
          <div className="text-[10px] text-zinc-500">{model.desc}</div>
        </div>
      </div>
      {model.cost > 0 && (
        <span className={cn(
          "text-[10px] px-1.5 py-0.5 rounded font-medium",
          canAfford 
            ? "bg-zinc-700 text-zinc-300" 
            : "bg-red-500/20 text-red-400"
        )}>
          {model.cost}c
        </span>
      )}
      {model.cost === 0 && (
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 font-medium">
          Free
        </span>
      )}
    </button>
  );
}

// Waveform Icon for Speech-to-Text
function WaveformIcon({ isActive, className }: { isActive: boolean; className?: string }) {
  const heights = [1, 2, 3, 2.5, 3.5, 2, 1];
  
  return (
    <div className={cn("flex items-center justify-center gap-[2px] h-4", className)}>
      {heights.map((h, i) => (
        <div 
          key={i}
          className={cn(
            "w-[2px] rounded-full transition-all duration-150",
            isActive 
              ? "bg-red-400 animate-pulse" 
              : "bg-current"
          )}
          style={{ 
            height: isActive ? `${h * 4}px` : '4px',
            animationDelay: isActive ? `${i * 75}ms` : '0ms',
            animationDuration: '400ms'
          }}
        />
      ))}
    </div>
  );
}

export function ChatInputBar({ 
  value, 
  onChange, 
  onSubmit, 
  isGenerating, 
  onCancel,
  placeholder = "Describe your vision...",
  userCredits = 0,
  onGenerateAsset,
  onOpenHistory,
  onOpenSettings,
  activeModel,
  onModelChange
}: ChatInputBarProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [isPlanMode, setIsPlanMode] = useState(false);
  // Use controlled model if provided, otherwise use local state
  const [internalModel, setInternalModel] = useState<AIModel>(AI_MODELS.code[0]);
  const selectedModel = activeModel ?? internalModel;
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isListening, setIsListening] = useState(false);
  
  // Portal positioning state
  const [modelMenuCoords, setModelMenuCoords] = useState({ top: 0, left: 0 });
  const [plusMenuCoords, setPlusMenuCoords] = useState({ top: 0, left: 0 });
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);
  const modelButtonRef = useRef<HTMLButtonElement>(null);
  const plusButtonRef = useRef<HTMLButtonElement>(null);

  // Speech-to-Text Handler
  const toggleSpeechRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported in this browser');
      return;
    }

    if (isListening && speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        }
      }

      if (finalTranscript) {
        onChange(value + (value ? ' ' : '') + finalTranscript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    speechRecognitionRef.current = recognition;
    recognition.start();
  }, [isListening, value, onChange]);

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
    };
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const newHeight = Math.min(textareaRef.current.scrollHeight, 200);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [value]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachments(prev => [...prev, e.target.files![0]]);
      setShowMenu(false);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const canAfford = (model: AIModel) => model.cost === 0 || userCredits >= model.cost;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if ((!value.trim() && attachments.length === 0) || isGenerating) return;
    
    if (!canAfford(selectedModel)) {
      return;
    }

    onSubmit({ 
      isPlanMode, 
      model: selectedModel,
      attachments 
    });
    setAttachments([]);
  };

  const handleModelSelect = (model: AIModel) => {
    // Notify parent if controlled, otherwise update internal state
    if (onModelChange) {
      onModelChange(model);
    } else {
      setInternalModel(model);
    }
    setShowModelMenu(false);
  };

  // Toggle model menu with position calculation
  const toggleModelMenu = () => {
    if (!showModelMenu && modelButtonRef.current) {
      const rect = modelButtonRef.current.getBoundingClientRect();
      setModelMenuCoords({
        left: rect.left,
        top: rect.top,
      });
    }
    setShowModelMenu(!showModelMenu);
    setShowMenu(false);
  };

  // Toggle plus menu with position calculation
  const togglePlusMenu = () => {
    if (!showMenu && plusButtonRef.current) {
      const rect = plusButtonRef.current.getBoundingClientRect();
      setPlusMenuCoords({
        left: rect.left,
        top: rect.top,
      });
    }
    setShowMenu(!showMenu);
    setShowModelMenu(false);
  };

  return (
    <div className="flex-shrink-0 p-4 bg-background relative">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*,.pdf,.doc,.docx"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Portal-based Model Menu */}
      {showModelMenu && (
        <Portal>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-[9998]" 
            onClick={() => setShowModelMenu(false)} 
          />
          {/* Menu */}
          <div 
            className="fixed z-[9999] w-64 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl shadow-black/60 overflow-hidden ring-1 ring-white/5 animate-in fade-in-0 zoom-in-95 duration-150"
            style={{ 
              left: modelMenuCoords.left,
              bottom: typeof window !== 'undefined' ? window.innerHeight - modelMenuCoords.top + 8 : 0,
            }}
          >
            <div className="p-2 max-h-[400px] overflow-y-auto">
              {/* Coding Models */}
              <div className="px-2 py-1.5 mb-1">
                <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">
                  Coding
                </span>
              </div>
              {AI_MODELS.code.map(model => (
                <ModelOption 
                  key={model.id}
                  model={model}
                  active={selectedModel.id === model.id}
                  onClick={() => handleModelSelect(model)}
                  canAfford={canAfford(model)}
                />
              ))}
              
              {/* Image Models */}
              <div className="px-2 py-1.5 mt-3 mb-1">
                <span className="text-[10px] uppercase tracking-widest text-amber-400/70 font-semibold">
                  Image Generation
                </span>
              </div>
              {AI_MODELS.image.map(model => (
                <ModelOption 
                  key={model.id}
                  model={model}
                  active={selectedModel.id === model.id}
                  onClick={() => handleModelSelect(model)}
                  canAfford={canAfford(model)}
                />
              ))}
              
              {/* Video Models */}
              <div className="px-2 py-1.5 mt-3 mb-1">
                <span className="text-[10px] uppercase tracking-widest text-pink-400/70 font-semibold">
                  Video Generation
                </span>
              </div>
              {AI_MODELS.video.map(model => (
                <ModelOption 
                  key={model.id}
                  model={model}
                  active={selectedModel.id === model.id}
                  onClick={() => handleModelSelect(model)}
                  canAfford={canAfford(model)}
                />
              ))}
            </div>
          </div>
        </Portal>
      )}

      {/* Portal-based Plus Menu */}
      {showMenu && (
        <Portal>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-[9998]" 
            onClick={() => setShowMenu(false)} 
          />
          {/* Menu */}
          <div 
            className="fixed z-[9999] w-56 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl shadow-black/60 ring-1 ring-white/5 p-1.5 animate-in fade-in-0 zoom-in-95 duration-150"
            style={{ 
              left: plusMenuCoords.left,
              bottom: typeof window !== 'undefined' ? window.innerHeight - plusMenuCoords.top + 8 : 0,
            }}
          >
            <div className="px-2 py-1.5 mb-1">
              <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-medium">
                Attachments
              </span>
            </div>
            <MenuItem 
              icon={ImageIcon} 
              label="Upload Image" 
              shortcut="⌘I"
              onClick={() => {
                fileInputRef.current?.click();
                setShowMenu(false);
              }}
            />
            <MenuItem 
              icon={Paperclip} 
              label="Upload File" 
              shortcut="⌘U"
              onClick={() => {
                fileInputRef.current?.click();
                setShowMenu(false);
              }}
            />
            <MenuItem 
              icon={Sparkles} 
              label="Generate Asset" 
              onClick={() => {
                handleModelSelect(AI_MODELS.image[0]);
                setShowMenu(false);
                onGenerateAsset?.();
              }}
            />
            
            <div className="h-px bg-zinc-800 my-1.5" />
            
            <MenuItem 
              icon={History} 
              label="History" 
              shortcut="⌘H"
              onClick={() => {
                setShowMenu(false);
                onOpenHistory?.();
              }}
            />
            <MenuItem 
              icon={Settings} 
              label="Settings"
              onClick={() => {
                setShowMenu(false);
                onOpenSettings?.();
              }}
            />
          </div>
        </Portal>
      )}

      {/* The floating input container */}
      <div className={cn(
        "relative bg-zinc-900/80 backdrop-blur-xl border rounded-2xl shadow-2xl shadow-black/20 transition-all duration-300",
        isPlanMode 
          ? "border-blue-500/30 ring-1 ring-blue-500/20" 
          : "border-zinc-800 focus-within:ring-1 focus-within:ring-violet-500/50 focus-within:border-violet-500/50"
      )}>
        
        {/* TOP BAR: MODEL SELECTOR & CREDITS */}
        <div className="flex items-center justify-between px-3 pt-2.5 pb-0">
          <button 
            ref={modelButtonRef}
            onClick={toggleModelMenu}
            className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400 hover:text-zinc-200 transition-colors px-2 py-1 rounded-md hover:bg-zinc-700/50"
          >
            <selectedModel.icon size={12} className={cn(
              selectedModel.category === 'video' ? "text-pink-400" :
              selectedModel.category === 'image' ? "text-amber-400" :
              isPlanMode ? "text-blue-400" : "text-violet-400"
            )} />
            <span>{selectedModel.name}</span>
            {selectedModel.cost > 0 && (
              <span className="text-[10px] text-zinc-500">({selectedModel.cost}c)</span>
            )}
            <ChevronDown size={10} className={cn("transition-transform", showModelMenu && "rotate-180")} />
          </button>

          {/* Credits Display */}
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
            <Coins size={11} className="text-amber-400" />
            <span className={cn(
              userCredits < 100 && "text-red-400"
            )}>
              {userCredits.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex items-end gap-2 p-2">
          
          {/* Plus menu button */}
          <button
            ref={plusButtonRef}
            type="button"
            onClick={togglePlusMenu}
            className={cn(
              "p-2 rounded-xl transition-all",
              showMenu 
                ? "bg-zinc-700 text-white" 
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50"
            )}
          >
            <Plus size={18} className={cn("transition-transform", showMenu && "rotate-45")} />
          </button>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              selectedModel.category === 'image' 
                ? "Describe the image to generate..."
                : selectedModel.category === 'video'
                  ? "Describe the video to generate..."
                  : isPlanMode 
                    ? "Describe the features to plan..." 
                    : placeholder
            }
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
            
            {/* SPEECH-TO-TEXT MICROPHONE BUTTON */}
            <button
              type="button"
              onClick={toggleSpeechRecognition}
              className={cn(
                "p-2 rounded-xl transition-all",
                isListening 
                  ? "bg-red-500/20 text-red-400 shadow-lg shadow-red-900/20 ring-2 ring-red-500/30" 
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700/50"
              )}
              title={isListening ? "Stop listening" : "Voice input (Speech-to-Text)"}
            >
              {isListening ? (
                <WaveformIcon isActive={true} />
              ) : (
                <Mic size={16} />
              )}
            </button>

            {/* THE PLAN TOGGLE BUTTON (only show for code models) */}
            {selectedModel.category === 'code' && (
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
            )}

            {/* Send/Stop button */}
            <button
              type="button"
              onClick={isGenerating ? onCancel : handleSubmit}
              disabled={(!value.trim() && attachments.length === 0) && !isGenerating}
              className={cn(
                "p-2 rounded-xl shrink-0 transition-all",
                isGenerating
                  ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                  : (value.trim() || attachments.length > 0)
                    ? !canAfford(selectedModel)
                      ? "bg-red-500/20 text-red-400"
                      : selectedModel.category === 'video'
                        ? "bg-pink-600 text-white hover:bg-pink-500 shadow-lg shadow-pink-900/20"
                        : selectedModel.category === 'image'
                          ? "bg-amber-600 text-white hover:bg-amber-500 shadow-lg shadow-amber-900/20"
                          : isPlanMode
                            ? "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-900/20"
                            : "bg-violet-600 text-white hover:bg-violet-500 shadow-lg shadow-violet-900/20"
                    : "bg-zinc-700/50 text-zinc-500 cursor-not-allowed"
              )}
              title={!canAfford(selectedModel) ? `Insufficient credits. Need ${selectedModel.cost}` : undefined}
            >
              {isGenerating ? (
                <Square size={16} className="fill-current" />
              ) : (
                <ArrowUp size={16} strokeWidth={2.5} />
              )}
            </button>
          </div>
        </div>

        {/* Attachment Previews */}
        {attachments.length > 0 && (
          <div className="px-3 pb-3 flex gap-2 overflow-x-auto">
            {attachments.map((file, i) => (
              <div key={i} className="relative group shrink-0">
                <div className="w-16 h-16 bg-zinc-800 rounded-lg border border-zinc-700 flex items-center justify-center overflow-hidden">
                  {file.type.startsWith('image') ? (
                    <img 
                      src={URL.createObjectURL(file)} 
                      alt={file.name}
                      className="w-full h-full object-cover" 
                    />
                  ) : file.type.startsWith('video') ? (
                    <Video size={20} className="text-pink-400" />
                  ) : (
                    <Paperclip size={20} className="text-zinc-400" />
                  )}
                </div>
                <button 
                  onClick={() => removeAttachment(i)}
                  className="absolute -top-2 -right-2 bg-zinc-900 text-zinc-400 hover:text-red-400 rounded-full p-0.5 border border-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={12} />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5 rounded-b-lg">
                  <p className="text-[8px] text-zinc-300 truncate">{file.name}</p>
                </div>
              </div>
            ))}
          </div>
        )}
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
