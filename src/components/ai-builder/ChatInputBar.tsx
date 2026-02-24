import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { 
  Plus, Send, Image as ImageIcon, 
  History, Settings, X, Square,
  Sparkles, ChevronDown, Bot, Zap, BrainCircuit, FileText, ArrowUp,
  Paperclip, Film, Video, Coins, Mic, Lock, Palette, Moon, Sun, Leaf, Waves
} from "lucide-react";
import { STYLE_PRESETS, type StylePreset } from './stylePresets';
import { useTheme, THEME_PRESETS } from '@/lib/theme';
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
    { id: "vibecoder-pro", name: "Gemini 3 Pro", desc: "Best for complex layouts", cost: 3, icon: Sparkles, category: "code" },
    { id: "vibecoder-flash", name: "Gemini Flash", desc: "Fast, for small edits", cost: 0, icon: Zap, category: "code" },
    { id: "vibecoder-claude", name: "Claude Sonnet", desc: "Premium JSX quality", cost: 5, icon: BrainCircuit, category: "code" },
    { id: "vibecoder-gpt4", name: "GPT-4o", desc: "Strong planning + code", cost: 5, icon: Sparkles, category: "code" },
    { id: "reasoning-o1", name: "GPT-5.2", desc: "Deep reasoning mode", cost: 8, icon: BrainCircuit, category: "code" },
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
    style?: StylePreset;
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
  // Paywall callback
  onOpenBilling?: () => void;
  // Style state now managed by ThemeProvider context
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

// Waveform keyframe animation styles
const waveformStyles = `
@keyframes waveform {
  0% { transform: scaleY(0.4); }
  100% { transform: scaleY(1); }
}
`;

// Waveform Icon for Speech-to-Text - Matches reference design
function WaveformIcon({ isActive, className }: { isActive: boolean; className?: string }) {
  // Heights match reference: short-medium-tall-medium-short pattern
  const barHeights = [4, 8, 12, 8, 4];
  
  return (
    <>
      <style>{waveformStyles}</style>
      <div className={cn("flex items-center justify-center gap-[2px] h-4 w-5", className)}>
        {barHeights.map((h, i) => (
          <div 
            key={i}
            className={cn(
              "w-[2px] rounded-full transition-colors duration-200",
              isActive 
                ? "bg-red-400" 
                : "bg-current"
            )}
            style={{ 
              height: `${h}px`,
              animation: isActive 
                ? `waveform 0.5s ease-in-out ${i * 0.1}s infinite alternate` 
                : 'none',
            }}
          />
        ))}
      </div>
    </>
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
  onModelChange,
  onOpenBilling,
}: ChatInputBarProps) {
  const { presetId, applyPreset } = useTheme();
  const [showMenu, setShowMenu] = useState(false);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  
  // Use controlled model if provided, otherwise use local state
  const [internalModel, setInternalModel] = useState<AIModel>(AI_MODELS.code[0]);
  const selectedModel = activeModel ?? internalModel;
  
  // Style from ThemeProvider context
  const selectedStyle = STYLE_PRESETS.find(s => s.id === presetId) ?? STYLE_PRESETS[0];
  
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState(""); // Live speech text (popup only)
  const [showCreditsDialog, setShowCreditsDialog] = useState(false);
  
  // Portal positioning state
  const [modelMenuCoords, setModelMenuCoords] = useState({ top: 0, left: 0 });
  const [plusMenuCoords, setPlusMenuCoords] = useState({ top: 0, left: 0 });
  const [styleMenuCoords, setStyleMenuCoords] = useState({ top: 0, left: 0 });
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);
  const modelButtonRef = useRef<HTMLButtonElement>(null);
  const plusButtonRef = useRef<HTMLButtonElement>(null);
  const styleButtonRef = useRef<HTMLButtonElement>(null);

  // Ref to remember text before speech started (for appending)
  const promptBeforeSpeechRef = useRef("");
  // Ref to track latest transcript for onend handler (closure issue)
  const transcriptRef = useRef("");
  // Detect "ends immediately" (common when Web Speech is blocked in embedded iframes)
  const speechDidStartRef = useRef(false);
  // Track whether the browser granted raw mic access (getUserMedia) so we can message accurately
  const micPreflightOkRef = useRef(false);

  // Speech-to-Text Handler with REAL-TIME live typing in the input
  const toggleSpeechRecognition = useCallback(async () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      const { toast } = await import('sonner');
      toast.error('Speech recognition is not supported in your browser. Please try Chrome, Edge, or Safari.');
      return;
    }

    // If already listening, stop
    if (isListening && speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
      return;
    }

    micPreflightOkRef.current = false;

    // Preflight mic permission (forces the browser permission prompt)
    try {
      if (navigator?.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micPreflightOkRef.current = true;
        // Immediately release the mic - we only needed the permission
        stream.getTracks().forEach(t => t.stop());
      }
    } catch (e) {
      const { toast } = await import('sonner');
      toast.error('Microphone permission is blocked. Please allow mic access in your browser settings.');
      return;
    }

    // Save current text BEFORE we start listening (so we append to it)
    promptBeforeSpeechRef.current = value;

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      speechDidStartRef.current = false;

      const startGuard = window.setTimeout(async () => {
        if (!speechDidStartRef.current) {
          // If onstart never fires, the Web Speech API is blocked (commonly by iframe Permissions-Policy)
          try { recognition.stop(); } catch { /* ignore */ }
          const { toast } = await import('sonner');

          // Simple, non-intrusive message - no forced actions, no API key required
          toast.info(
            'Voice input unavailable in preview (browser security). Works in published app.',
            { duration: 4000 }
          );

          setIsListening(false);
        }
      }, 800);

      recognition.onstart = () => {
        window.clearTimeout(startGuard);
        speechDidStartRef.current = true;
        console.log('[Speech] Recognition started');
        setIsListening(true);
        setTranscript('');
        transcriptRef.current = '';
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = 0; i < event.results.length; i++) {
          const transcriptText = event.results[i][0].transcript;
          if (event.results[i].isFinal) finalTranscript += transcriptText;
          else interimTranscript += transcriptText;
        }

        const liveText = finalTranscript + interimTranscript;
        setTranscript(liveText);
        transcriptRef.current = liveText;

        const baseText = promptBeforeSpeechRef.current;
        const spacing = baseText ? ' ' : '';
        onChange(baseText + spacing + liveText);
      };

      recognition.onerror = async (event: SpeechRecognitionErrorEvent) => {
        window.clearTimeout(startGuard);
        console.error('[Speech] Error:', event.error, event.message);
        setIsListening(false);

        const { toast } = await import('sonner');
        if (event.error === 'not-allowed') {
          toast.error('Microphone access denied. Please allow microphone permission in your browser.');
        } else if (event.error === 'no-speech') {
          toast.info('No speech detected. Try speaking closer to your microphone.');
        } else {
          toast.error(`Speech recognition error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        window.clearTimeout(startGuard);
        console.log('[Speech] Recognition ended');
        setIsListening(false);
        setTranscript('');
        transcriptRef.current = '';
      };

      speechRecognitionRef.current = recognition;
      console.log('[Speech] Starting recognition...');
      recognition.start();
    } catch (err) {
      console.error('[Speech] Failed to start:', err);
      const { toast } = await import('sonner');
      toast.error('Failed to start speech recognition. Please try again.');
      setIsListening(false);
    }
  }, [isListening, value, onChange]);

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
    };
  }, []);

  // Auto-resize textarea with strict 6-line (160px) limit
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to auto to measure true scrollHeight
      textarea.style.height = 'auto';
      
      const MAX_HEIGHT = 160; // ~6 lines
      const newHeight = Math.min(textarea.scrollHeight, MAX_HEIGHT);
      textarea.style.height = `${newHeight}px`;
      
      // Enable scroll ONLY when hitting the limit
      textarea.style.overflowY = textarea.scrollHeight > MAX_HEIGHT ? 'auto' : 'hidden';
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
    
    // Intercept: If they can't afford it, show credits dialog first
    if (!canAfford(selectedModel)) {
      setShowCreditsDialog(true);
      return;
    }

    onSubmit({ 
      isPlanMode: false, // Plan mode is now internal only
      model: selectedModel,
      attachments,
      style: selectedModel.category === 'code' ? selectedStyle : undefined,
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
    setShowStyleMenu(false);
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
    setShowStyleMenu(false);
  };
  
  // Toggle style menu with position calculation
  const toggleStyleMenu = () => {
    if (!showStyleMenu && styleButtonRef.current) {
      const rect = styleButtonRef.current.getBoundingClientRect();
      setStyleMenuCoords({
        left: rect.left,
        top: rect.top,
      });
    }
    setShowStyleMenu(!showStyleMenu);
    setShowMenu(false);
    setShowModelMenu(false);
  };
  
  // Handle style selection
  const handleStyleSelect = (style: StylePreset) => {
    const themePreset = THEME_PRESETS.find(p => p.id === style.id);
    if (themePreset) {
      applyPreset(themePreset);
    }
    setShowStyleMenu(false);
  };
  
  // Get icon component for style
  const getStyleIcon = (iconName: StylePreset['icon']) => {
    switch (iconName) {
      case 'moon': return Moon;
      case 'zap': return Zap;
      case 'sun': return Sun;
      case 'leaf': return Leaf;
      case 'waves': return Waves;
      case 'sparkles': return Sparkles;
      default: return Palette;
    }
  };

  return (
    <div className="flex-shrink-0 px-4 py-3 bg-[#1a1a1a] relative">
      
      {/* SPEECH INDICATOR (Floats ABOVE input) */}
      {isListening && (
        <div className="absolute bottom-full left-4 right-4 mb-2 z-20 animate-in slide-in-from-bottom-2 fade-in duration-200">
          <div className="bg-zinc-800/95 border border-red-500/30 p-3 rounded-xl shadow-xl flex items-center gap-3 backdrop-blur-md">
            <div className="p-1.5 bg-red-500/20 rounded-full animate-pulse shrink-0">
              <Mic size={16} className="text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-red-400 font-medium mb-0.5">
                🎙️ Listening - speak now...
              </p>
              <p className="text-sm text-white/80 truncate">
                {transcript || <span className="text-zinc-500 italic">Waiting for speech...</span>}
              </p>
            </div>
            <button 
              onClick={toggleSpeechRecognition} 
              className="p-1.5 hover:bg-zinc-700 rounded-full text-zinc-400 hover:text-white transition-colors shrink-0"
              title="Stop recording"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
      
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
          <div 
            className="fixed inset-0 z-[9998]" 
            onClick={() => setShowModelMenu(false)} 
          />
          <div 
            className="fixed z-[9999] w-56 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150"
            style={{ 
              left: modelMenuCoords.left,
              bottom: typeof window !== 'undefined' ? window.innerHeight - modelMenuCoords.top + 8 : 0,
            }}
          >
            <div className="p-1.5 max-h-[300px] overflow-y-auto">
              <div className="px-2 py-1">
                <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Coding</span>
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
              
              <div className="px-2 py-1 mt-2">
                <span className="text-[10px] uppercase tracking-wider text-amber-400/70 font-medium">Image</span>
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
              
              <div className="px-2 py-1 mt-2">
                <span className="text-[10px] uppercase tracking-wider text-pink-400/70 font-medium">Video</span>
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
          <div 
            className="fixed inset-0 z-[9998]" 
            onClick={() => setShowMenu(false)} 
          />
          <div 
            className="fixed z-[9999] w-48 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl p-1 animate-in fade-in-0 zoom-in-95 duration-150"
            style={{ 
              left: plusMenuCoords.left,
              bottom: typeof window !== 'undefined' ? window.innerHeight - plusMenuCoords.top + 8 : 0,
            }}
          >
            <MenuItem 
              icon={ImageIcon} 
              label="Upload Image" 
              onClick={() => {
                fileInputRef.current?.click();
                setShowMenu(false);
              }}
            />
            <MenuItem 
              icon={Paperclip} 
              label="Upload File" 
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
            <div className="h-px bg-zinc-700 my-1" />
            <MenuItem 
              icon={History} 
              label="History" 
              onClick={() => {
                setShowMenu(false);
                onOpenHistory?.();
              }}
            />
          </div>
        </Portal>
      )}




      {/* COMPACT INPUT BAR - Matching reference image */}
      <div className="bg-zinc-800/90 backdrop-blur-sm border border-orange-500/30 rounded-2xl overflow-hidden shadow-[0_0_20px_rgba(249,115,22,0.15)] hover:shadow-[0_0_30px_rgba(249,115,22,0.25)] transition-shadow duration-300">
        {/* Attachment Previews - INSIDE the input box, above the textarea */}
        {attachments.length > 0 && (
          <div className="flex gap-2 px-3 pt-2 overflow-x-auto">
            {attachments.map((file, i) => (
              <div key={i} className="relative group shrink-0">
                <div className="w-10 h-10 bg-zinc-900 rounded-lg border border-zinc-700 flex items-center justify-center overflow-hidden">
                  {file.type.startsWith('image') ? (
                    <img 
                      src={URL.createObjectURL(file)} 
                      alt={file.name}
                      className="w-full h-full object-cover" 
                    />
                  ) : file.type.startsWith('video') ? (
                    <Video size={14} className="text-pink-400" />
                  ) : (
                    <Paperclip size={14} className="text-zinc-400" />
                  )}
                </div>
                <button 
                  onClick={() => removeAttachment(i)}
                  className="absolute -top-1 -right-1 bg-zinc-900 text-zinc-400 hover:text-red-400 rounded-full p-0.5 border border-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}
        
        {/* Single-line input row */}
        <div className="flex items-center gap-1 px-3 py-2.5">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={(e) => {
              // Handle pasted images from clipboard
              const items = e.clipboardData?.items;
              if (items) {
                for (let i = 0; i < items.length; i++) {
                  if (items[i].type.startsWith('image/')) {
                    const file = items[i].getAsFile();
                    if (file) {
                      e.preventDefault();
                      setAttachments(prev => [...prev, file]);
                    }
                  }
                }
              }
              // Text paste is handled natively by the textarea
            }}
            placeholder={placeholder}
            disabled={isGenerating}
            rows={1}
            className={cn(
              "flex-1 bg-transparent border-none text-sm text-white resize-none outline-none",
              "min-h-[24px] max-h-[100px] py-0.5 leading-relaxed",
              "placeholder:text-zinc-500 focus:ring-0",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          />
        </div>
        
        {/* Bottom toolbar */}
        <div className="flex items-center justify-between px-2 pb-2">
          {/* Left side: Plus + Visual edits chip */}
          <div className="flex items-center gap-1">
            <button 
              ref={plusButtonRef}
              type="button" 
              onClick={togglePlusMenu}
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                showMenu 
                  ? "text-white bg-zinc-700" 
                  : "text-zinc-400 hover:text-white hover:bg-zinc-700"
              )}
            >
              <Plus size={16} />
            </button>
            
            {/* Model selector chip */}
            <button
              ref={modelButtonRef}
              type="button"
              onClick={toggleModelMenu}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-lg transition-colors"
            >
              <Bot size={12} className="text-violet-400" />
              <span>Model</span>
              <ChevronDown size={10} className="opacity-50" />
            </button>
          </div>
          
          {/* Right side: Waveform/Mic, Stop/Send */}
          <div className="flex items-center gap-1">
            
            {/* Mic/Waveform button */}
            <button 
              type="button" 
              onClick={toggleSpeechRecognition}
              className={cn(
                "p-1 transition-colors rounded-md",
                isListening 
                  ? "text-red-400 bg-red-500/10" 
                  : "text-zinc-500 hover:text-white hover:bg-zinc-700/50"
              )}
            >
              <WaveformIcon isActive={isListening} />
            </button>
            
            {/* Stop / Send button - Circular with orange gradient */}
            <button 
              type="button"
              onClick={isGenerating ? onCancel : handleSubmit}
              disabled={(!value.trim() && attachments.length === 0) && !isGenerating}
              className={cn(
                "w-8 h-8 flex items-center justify-center rounded-full transition-all",
                isGenerating
                  ? "bg-zinc-700 text-white"
                  : (value.trim() || attachments.length > 0)
                    ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-105"
                    : "bg-zinc-700 text-zinc-500 cursor-not-allowed"
              )}
            >
              {isGenerating ? (
                <Square size={14} className="fill-current" />
              ) : (
                <Send size={14} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Insufficient Credits Dialog */}
      {showCreditsDialog && (
        <Portal>
          <div 
            className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" 
            onClick={() => setShowCreditsDialog(false)} 
          />
          <div className="fixed z-[9999] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm animate-in zoom-in-95 fade-in duration-200">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 mx-4">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <Coins className="w-6 h-6 text-amber-500" />
                </div>
              </div>
              <h3 className="text-base font-semibold text-white text-center mb-2">
                Not Enough Credits
              </h3>
              <p className="text-sm text-zinc-400 text-center mb-4">
                You need {selectedModel.cost}c to use {selectedModel.name}.
              </p>
              <div className="flex items-center justify-between px-3 py-2 bg-zinc-800/50 rounded-lg mb-4">
                <span className="text-xs text-zinc-400">Balance</span>
                <span className="text-sm font-semibold text-white">{userCredits}c</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCreditsDialog(false)}
                  className="flex-1 px-3 py-2 text-sm text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowCreditsDialog(false);
                    onOpenBilling?.();
                  }}
                  className="flex-1 px-3 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors"
                >
                  Upgrade
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
