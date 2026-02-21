import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { 
  User, Settings, LogOut, ChevronRight, Zap, LayoutDashboard, Plus, HelpCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CreditTopUpDialog } from "./CreditTopUpDialog";

interface ProfileMenuProps {
  avatarUrl?: string | null;
  username?: string | null;
  userCredits: number;
  subscriptionTier?: string | null;
  onSignOut: () => void;
}

function MenuItem({ 
  icon: Icon, 
  label, 
  onClick,
  isDanger 
}: { 
  icon: React.ElementType; 
  label: string; 
  onClick?: () => void;
  isDanger?: boolean;
}) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between px-3 py-2.5 text-sm transition-colors rounded-lg group text-left",
        isDanger 
          ? "text-red-400 hover:bg-red-500/10" 
          : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
      )}
    >
      <div className="flex items-center gap-2.5">
        <Icon size={15} className={cn(
          "transition-colors",
          isDanger ? "text-red-400" : "group-hover:text-violet-400"
        )} />
        <span>{label}</span>
      </div>
      {!isDanger && <ChevronRight size={14} className="text-zinc-600 group-hover:text-zinc-400" />}
    </button>
  );
}

export function ProfileMenu({ 
  avatarUrl, 
  username = "Creator", 
  userCredits = 0,
  subscriptionTier,
  onSignOut 
}: ProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [menuCoords, setMenuCoords] = useState({ top: 0, right: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current && 
        !menuRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Calculate position when opening
  const handleToggle = () => {
    if (!isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setMenuCoords({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
    setIsOpen(!isOpen);
  };

  const handleNavigate = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };


  const handleSignOut = () => {
    setIsOpen(false);
    onSignOut();
  };

  // Get initials for avatar fallback
  const initials = username ? username.slice(0, 2).toUpperCase() : 'CR';

  // Get tier badge styling
  const tierBadge = subscriptionTier === 'agency' 
    ? { label: 'Agency', className: 'bg-amber-500/20 text-amber-400 border-amber-500/30' }
    : subscriptionTier === 'creator'
      ? { label: 'Creator', className: 'bg-violet-500/20 text-violet-400 border-violet-500/30' }
      : { label: 'Free', className: 'bg-zinc-700 text-zinc-400 border-zinc-600' };

  return (
    <div className="relative">
      {/* TRIGGER: Avatar Button */}
      <button
        ref={triggerRef}
        onClick={handleToggle}
        className={cn(
          "w-9 h-9 rounded-full border overflow-hidden transition-all focus:outline-none",
          isOpen 
            ? "ring-2 ring-violet-500/50 border-violet-500/50" 
            : "border-zinc-700 hover:ring-2 hover:ring-zinc-600"
        )}
      >
        {avatarUrl ? (
          <img 
            src={avatarUrl} 
            alt={username || 'Profile'} 
            className="w-full h-full object-cover" 
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">{initials}</span>
          </div>
        )}
      </button>

      {/* DROPDOWN MENU - Rendered via Portal */}
      {isOpen && createPortal(
        <div 
          ref={menuRef}
          className="fixed z-[9999] w-72 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl shadow-black/60 ring-1 ring-white/5 animate-in fade-in-0 zoom-in-95 duration-150 overflow-hidden"
          style={{ 
            top: menuCoords.top,
            right: menuCoords.right,
          }}
        >
          {/* Header: User Info */}
          <div className="p-4 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full overflow-hidden border border-zinc-700 shrink-0">
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt={username || 'Profile'} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center">
                    <span className="text-white text-sm font-bold">{initials}</span>
                  </div>
                )}
              </div>
              
              {/* Name & Tier */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {username || 'Creator'}
                </p>
                <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded border font-medium inline-block mt-1",
                  tierBadge.className
                )}>
                  {tierBadge.label}
                </span>
              </div>
            </div>
          </div>

          {/* Credit Wallet Section - clicks to /billing */}
          <button
            onClick={() => handleNavigate('/billing')}
            className="w-full px-4 py-3 border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors text-left"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Credits</span>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-white tabular-nums">
                  {userCredits.toLocaleString()}
                </span>
                <span className="text-xs text-zinc-500">left</span>
                <ChevronRight size={14} className="text-zinc-600" />
              </div>
            </div>
            <p className="text-xs text-zinc-500 flex items-center gap-1.5 mt-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
              {subscriptionTier && subscriptionTier !== 'browser'
                ? "Using subscription credits"
                : "Using free credits"}
            </p>
          </button>

          {/* Navigation Links */}
          <div className="p-2">
            <MenuItem 
              icon={LayoutDashboard} 
              label="Dashboard" 
              onClick={() => handleNavigate('/dashboard')}
            />
            <MenuItem 
              icon={Plus} 
              label="Create Product" 
              onClick={() => handleNavigate('/create-product')}
            />
            <MenuItem 
              icon={User} 
              label="My Profile" 
              onClick={() => handleNavigate('/profile')}
            />
            <MenuItem 
              icon={Settings} 
              label="Settings" 
              onClick={() => handleNavigate('/settings')}
            />
          </div>

          {/* AI Builder */}
          <div className="p-2 border-t border-zinc-800">
            <button
              onClick={() => handleNavigate('/ai-builder')}
              className="w-full px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors rounded-lg text-left"
            >
              AI Builder
            </button>
          </div>

          {/* Help Center & Sign Out */}
          <div className="p-2 border-t border-zinc-800">
            <MenuItem 
              icon={HelpCircle} 
              label="Help Center" 
              onClick={() => handleNavigate('/faq')}
            />
            <MenuItem 
              icon={LogOut} 
              label="Sign Out" 
              isDanger
              onClick={handleSignOut}
            />
          </div>
        </div>,
        document.body
      )}

      {/* Credit Top Up Dialog */}
      <CreditTopUpDialog
        open={topUpOpen}
        onOpenChange={setTopUpOpen}
        currentBalance={userCredits}
      />
    </div>
  );
}
