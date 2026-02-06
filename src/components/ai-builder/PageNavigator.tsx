import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, FileText, Check, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SitePage } from "@/utils/routeParser";

// Re-export the type for convenience
export type { SitePage };

interface PageNavigatorProps {
  activePage: string;
  pages: SitePage[];
  onNavigate: (path: string) => void;
  onRefresh?: () => void;
}

export function PageNavigator({ activePage, pages, onNavigate, onRefresh }: PageNavigatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Find current page based on activePage prop
  const currentPage = pages.find(p => p.path === activePage) || pages[0] || { label: "Home", path: "/" };

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePageSelect = (page: SitePage) => {
    setIsOpen(false);
    onNavigate(page.path);
  };

  return (
    <div ref={menuRef} className="relative">
      {/* TRIGGER BUTTON */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-l-lg border-y border-l transition-all text-xs font-medium",
            isOpen 
              ? "bg-zinc-800 border-zinc-700 text-white" 
              : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
          )}
        >
          {/* Green "Live" indicator dot */}
          <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_6px_2px_rgba(34,197,94,0.3)]" />
          
          <span className="font-mono">
            {currentPage.label}
          </span>
          <ChevronDown 
            size={12} 
            className={cn("transition-transform", isOpen && "rotate-180")} 
          />
        </button>

        {/* Refresh Button */}
        <button 
          onClick={onRefresh}
          className="p-1.5 rounded-r-lg border border-zinc-800 bg-zinc-900 text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all active:rotate-180"
          title="Force Refresh Preview"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>

      {/* DROPDOWN MENU */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl shadow-black/60 overflow-hidden ring-1 ring-white/5 z-50 animate-in fade-in-0 zoom-in-95 duration-150">
          
          {/* Header */}
          <div className="px-3 py-2 border-b border-zinc-800">
            <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">
              Detected Pages
            </span>
          </div>

          {/* Page List */}
          <div className="p-1.5">
            {pages.map((page) => {
              const isActive = activePage === page.path;
              return (
                <button
                  key={page.id}
                  onClick={() => handlePageSelect(page)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors group",
                    isActive 
                      ? "bg-violet-500/10 text-violet-300" 
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <FileText size={14} className={cn(
                      isActive ? "text-violet-400" : "text-zinc-500 group-hover:text-zinc-300"
                    )} />
                    <span>{page.label}</span>
                  </div>
                  
                  {/* Checkmark for active state */}
                  {isActive && <Check size={14} className="text-violet-400" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
