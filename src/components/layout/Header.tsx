import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Menu, X, User, Settings, LogOut, ShieldCheck, Plus, LayoutDashboard, 
  CreditCard, Loader2, Package, Sparkles, Store, Crown,
  Wand2, Music, FileVideo, Film, Headphones, ArrowRight, Zap,
  ShoppingCart, Home, Users, Mic, MessageSquare, DollarSign, Search, HelpCircle
} from 'lucide-react';
import { useState } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { CreditFuelGauge } from '@/components/subscription/CreditFuelGauge';
import EditorChatIcon from '@/components/chat/EditorChatIcon';
import sellspayLogo from '@/assets/sellspay-s-logo-new.png';
import { cn } from '@/lib/utils';
import { LowCreditWarning, LOW_CREDIT_THRESHOLD } from '@/components/ai-builder/LowCreditWarning';
import { CreditTopUpDialog } from '@/components/ai-builder/CreditTopUpDialog';

// Product categories for dropdown
const productCategories = [
  { name: 'All Products', path: '/products', icon: Package, description: 'Browse all assets' },
  { name: 'LUTs', path: '/products?type=lut', icon: Wand2, description: 'Color grading presets' },
  { name: 'Presets', path: '/products?type=preset', icon: Sparkles, description: 'Editing presets' },
  { name: 'SFX', path: '/products?type=sfx', icon: Music, description: 'Sound effects' },
  { name: 'Templates', path: '/products?type=template', icon: FileVideo, description: 'Project templates' },
  { name: 'Overlays', path: '/products?type=overlay', icon: Film, description: 'Video overlays' },
  { name: 'Tutorials', path: '/products?type=tutorial', icon: Headphones, description: 'Learn from pros' },
];

// Tools dropdown items
const toolsItems = [
  { name: 'Music Splitter', path: '/studio/music-splitter', description: 'Separate vocals & stems' },
  { name: 'Voice Isolator', path: '/studio/voice-isolator', description: 'Extract voice from audio' },
  { name: 'SFX Generator', path: '/studio/sfx-generator', description: 'AI-powered sound effects' },
  { name: 'Audio Converter', path: '/studio/audio-converter', description: 'Convert audio formats' },
  { name: 'Waveform Generator', path: '/studio/waveform-generator', description: 'Create audio waveforms' },
];

// Community dropdown items
const communityItems = [
  { name: 'Updates', path: '/community/updates', description: 'Platform news & updates' },
  { name: 'Spotlight', path: '/community/spotlight', description: 'Featured creators' },
  { name: 'Discord', path: '/community/discord', description: 'Join our community' },
];

// Premium nav link styles
const navLinkStyles = cn(
  "relative px-4 py-2 text-sm font-light tracking-wide text-foreground/60",
  "rounded-lg transition-all duration-300",
  "hover:text-foreground",
  "font-[system-ui,'Segoe_UI',Roboto,Helvetica,Arial,sans-serif]"
);

const activeNavLinkStyles = cn(
  navLinkStyles,
  "text-foreground"
);

export default function Header() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const { credits, loading: creditsLoading, plan } = useSubscription();

  const isCreator = profile?.is_creator || false;
  const isSeller = profile?.is_seller || false;
  const avatarUrl = profile?.avatar_url || null;
  const username = profile?.username || null;
  const fullName = profile?.full_name || null;

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path.split('?')[0]);

  return (
    <header className={cn(
      "fixed top-0 z-50 w-full",
      // Transparent glassmorphic background
      "bg-background/60 backdrop-blur-xl",
      // Clean border
      "border-b border-white/10",
      // Subtle shadow
      "shadow-lg shadow-black/10"
    )}>
      {/* Top accent line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      
      <div className="mx-auto w-full px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Mobile: Hamburger on far left */}
          <div className="lg:hidden flex items-center">
            <button
              className="p-2 text-foreground/70 hover:text-foreground transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {/* Left side: Logo + Main Nav (desktop) */}
          <div className="hidden lg:flex items-center gap-8">
            {/* Logo - desktop */}
            <Link to="/" className="flex items-center shrink-0 group">
              <img 
                src={sellspayLogo} 
                alt="SellsPay" 
                className="h-9 w-auto transition-transform duration-300 group-hover:scale-105"
              />
            </Link>

            {/* Desktop Navigation with Premium Dropdowns */}
            <NavigationMenu className="hidden lg:flex">
              <NavigationMenuList className="gap-1">
                {/* Store - Click to navigate, hover for dropdown */}
                <NavigationMenuItem>
                  <Link 
                    to="/products"
                    className={cn(
                      "inline-flex h-10 items-center justify-center",
                      isActive('/products') ? activeNavLinkStyles : navLinkStyles
                    )}
                  >
                    Marketplace
                  </Link>
                  <NavigationMenuContent>
                    <div className={cn(
                      "w-[420px] p-5",
                      // Solid card styling
                      "bg-card border border-border",
                      "shadow-xl shadow-black/30",
                      "rounded-xl"
                    )}>
                      
                      <div className="grid gap-1">
                        {productCategories.map((item) => {
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.path}
                              to={item.path}
                              className={cn(
                                "flex items-center gap-4 p-3 rounded-lg transition-all duration-200 group",
                                "hover:bg-muted"
                              )}
                            >
                              <div className={cn(
                                "flex h-10 w-10 items-center justify-center rounded-lg",
                                "bg-primary/15",
                                "transition-colors duration-200",
                                "group-hover:bg-primary/25"
                              )}>
                                <Icon className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                                  {item.name}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {item.description}
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Creators - Simple Link */}
                <NavigationMenuItem>
                  <Link 
                    to="/creators" 
                    className={cn(
                      "inline-flex h-10 items-center justify-center",
                      isActive('/creators') ? activeNavLinkStyles : navLinkStyles
                    )}
                  >
                    Creators
                  </Link>
                </NavigationMenuItem>

                {/* Tools - Click to navigate, hover for dropdown */}
                <NavigationMenuItem>
                  <Link 
                    to="/studio"
                    className={cn(
                      "inline-flex h-10 items-center justify-center",
                      isActive('/studio') ? activeNavLinkStyles : navLinkStyles
                    )}
                  >
                    AI Studio
                  </Link>
                  <NavigationMenuContent>
                    <div className={cn(
                      "w-[320px] p-4",
                      "bg-card border border-border",
                      "shadow-xl shadow-black/30",
                      "rounded-xl"
                    )}>
                      <div className="grid gap-1">
                        {toolsItems.map((item) => (
                          <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                              "flex items-center justify-between p-3 rounded-lg transition-all duration-200 group",
                              "hover:bg-muted"
                            )}
                          >
                            <div>
                              <div className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                                {item.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {item.description}
                              </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Community Dropdown */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className={cn(
                    "h-10 px-4 text-sm font-light tracking-wide bg-transparent rounded-lg",
                    "text-foreground/60 hover:text-foreground",
                    "data-[state=open]:text-foreground",
                    "transition-all duration-300",
                    "font-[system-ui,'Segoe_UI',Roboto,Helvetica,Arial,sans-serif]"
                  )}>
                    Community
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className={cn(
                      "w-[280px] p-4",
                      "bg-card border border-border",
                      "shadow-xl shadow-black/30",
                      "rounded-xl"
                    )}>
                      <div className="grid gap-1">
                        {communityItems.map((item) => (
                          <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                              "flex items-center justify-between p-3 rounded-lg transition-all duration-200 group",
                              "hover:bg-muted"
                            )}
                          >
                            <div>
                              <div className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                                {item.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {item.description}
                              </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Divider with 3D effect */}
                <div className={cn(
                  "h-6 w-[1px] mx-3",
                  "bg-gradient-to-b from-transparent via-white/20 to-transparent",
                  "shadow-[1px_0_0_rgba(0,0,0,0.3)]"
                )} />

                {/* Hire Editors - Only for signed-in users */}
                {user && (
                <NavigationMenuItem>
                  <Link 
                    to="/hire-editors" 
                    className={cn(
                      "inline-flex h-9 items-center justify-center px-4 text-xs font-medium tracking-wide",
                      "text-foreground rounded-full transition-all duration-300",
                      "border border-border hover:border-foreground/30",
                      "hover:bg-white/5"
                    )}
                  >
                    Hire Editors
                  </Link>
                </NavigationMenuItem>
                )}
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Mobile: Centered Logo */}
          <div className="lg:hidden absolute left-1/2 -translate-x-1/2">
            <Link to="/" className="flex items-center">
              <img src={sellspayLogo} alt="SellsPay" className="h-8 w-auto" />
            </Link>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Pricing Link - Desktop only, guests only */}
            {!user && (
              <Link 
                to="/pricing" 
                className={cn(
                  "hidden lg:inline-flex h-10 items-center justify-center",
                  isActive('/pricing') ? activeNavLinkStyles : navLinkStyles
                )}
              >
                Pricing
              </Link>
            )}

            {/* Cart Button - Desktop only, logged in only */}
            {user && (
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="hidden lg:inline-flex h-10 w-10 rounded-xl text-foreground/70 hover:text-foreground hover:bg-white/5"
              >
                <Link to="/cart">
                  <ShoppingCart className="h-5 w-5" />
                </Link>
              </Button>
            )}
            {/* Editor Chat Icon */}
            {user && <EditorChatIcon />}

            {/* Notification Bell */}
            {user && <NotificationBell />}
            
            {user ? (
              <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className={cn(
                      "relative h-10 w-10 p-0 rounded-full",
                      "transition-all duration-300",
                      "hover:ring-2 hover:ring-primary/30 hover:ring-offset-2 hover:ring-offset-background"
                    )}
                  >
                    <Avatar className={cn(
                      "h-10 w-10 rounded-full",
                      "ring-2 ring-white/10",
                      "transition-all duration-300"
                    )}>
                      <AvatarImage src={avatarUrl || undefined} className="rounded-full" />
                      <AvatarFallback className="bg-primary/20 text-primary text-sm font-semibold rounded-full">
                        {(username || user.email)?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  className="w-72 p-0 bg-[#0F1115] border-border/50 rounded-2xl overflow-hidden shadow-2xl shadow-black/60"
                >
                  {/* User identity + tier badge */}
                  <div className="px-4 py-3 border-b border-border/30">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg overflow-hidden border border-border shrink-0 bg-primary/20 flex items-center justify-center">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-bold text-primary">
                            {(username || "U").slice(0, 1).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-foreground truncate">{username || fullName || "User"}</span>
                      {(() => {
                        const tier = plan;
                        if (tier === 'agency') return <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">Agency</span>;
                        if (tier === 'creator') return <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">Pro</span>;
                        if (tier === 'basic') return <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Basic</span>;
                        return <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">Free</span>;
                      })()}
                    </div>
                  </div>

                  {/* Credit wallet with progress bar */}
                  <div className="px-4 py-3 border-b border-border/30 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">Credits</span>
                      <button
                        onClick={() => navigate("/billing")}
                        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <span className="font-bold text-foreground tabular-nums">
                          {creditsLoading ? "…" : credits.toLocaleString()}
                        </span>
                        <span className="text-muted-foreground">left</span>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </div>
                    {!creditsLoading && (
                      <>
                        <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-500"
                            style={{ width: `${Math.min(100, (credits / Math.max(credits, 100)) * 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                          {plan && plan !== 'browser'
                            ? "Using subscription credits"
                            : "Using free credits"}
                        </p>
                      </>
                    )}
                  </div>


                  {/* Nav links */}
                  <div className="py-1.5">
                    {(isCreator || isSeller) && (
                      <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-colors">
                        <LayoutDashboard className="h-4 w-4" />
                        <span>Dashboard</span>
                      </button>
                    )}
                    {(isCreator || isSeller) && (
                      <button onClick={() => navigate("/create-product")} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-colors">
                        <Plus className="h-4 w-4" />
                        <span>Create Product</span>
                      </button>
                    )}
                    <button onClick={() => navigate("/profile")} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-colors">
                      <User className="h-4 w-4" />
                      <span>My Profile</span>
                    </button>
                    <button onClick={() => navigate("/settings")} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-colors">
                      <Settings className="h-4 w-4" />
                      <span>Settings</span>
                    </button>
                  </div>

                  {/* AI Builder & Seller */}
                  <div className="border-t border-border/30 py-1.5">
                    <button onClick={() => navigate("/ai-builder")} className="w-full px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors rounded-md text-left">
                      AI Builder
                    </button>
                    {!isSeller && (
                      <button onClick={() => navigate("/onboarding/seller-agreement")} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-colors">
                        <Store className="h-4 w-4" />
                        <span>Become a Seller</span>
                      </button>
                    )}
                    {isAdmin && (
                      <button onClick={() => navigate("/admin")} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-colors">
                        <ShieldCheck className="h-4 w-4" />
                        <span>Admin</span>
                      </button>
                    )}
                  </div>

                  {/* Help Center & Sign out */}
                  <div className="border-t border-border/30 py-1.5">
                    <button
                      onClick={() => navigate("/faq")}
                      className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-colors"
                    >
                      <HelpCircle className="h-4 w-4" />
                      <span>Help Center</span>
                    </button>
                    <button
                      onClick={() => signOut()}
                      className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden lg:flex items-center gap-3">
                <Link 
                  to="/login" 
                  className={cn(
                    "inline-flex h-10 items-center justify-center",
                    navLinkStyles
                  )}
                >
                  Sign In
                </Link>
                <Button 
                  asChild 
                  className="h-10 px-6 text-sm font-semibold rounded-full"
                >
                  <Link to="/signup">Start Free Now</Link>
                </Button>
              </div>
            )}

            {/* Mobile: Search + Cart (right side) */}
            <Link to="/products?search=true" className="lg:hidden p-2 text-foreground/70 hover:text-foreground transition-colors">
              <Search className="h-5 w-5" />
            </Link>
            {user && (
              <Link to="/cart" className="lg:hidden p-2 text-foreground/70 hover:text-foreground transition-colors">
                <ShoppingCart className="h-5 w-5" />
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className={cn(
            "lg:hidden py-4 animate-fade-in",
            "border-t border-white/10"
          )}>
            <nav className="flex flex-col gap-1 px-2">
              {[
                { to: '/products', icon: Package, label: 'Marketplace' },
                { to: '/creators', icon: Users, label: 'Creators' },
                { to: '/studio', icon: Wand2, label: 'AI Studio' },
                { to: '/community', icon: MessageSquare, label: 'Community' },
                { to: '/hire-editors', icon: Mic, label: 'Hire Editors' },
                ...(!user ? [{ to: '/pricing', icon: DollarSign, label: 'Pricing' }] : []),
              ].map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                    isActive(item.to)
                      ? "bg-primary/10 text-primary"
                      : "text-foreground/70 hover:bg-white/5 hover:text-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              ))}

              {/* Mobile Credit Display */}
              {user && (
                <>
                  <div className="h-px bg-border my-2 mx-4" />
                  <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Zap size={14} className="text-primary" />
                      <span className="text-sm font-bold text-foreground tabular-nums">
                        {creditsLoading ? '...' : credits.toLocaleString()}
                      </span>
                      <span className="text-xs text-muted-foreground">credits</span>
                    </div>
                    <button
                      onClick={() => { setMobileMenuOpen(false); setTopUpOpen(true); }}
                      className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                      Get More
                    </button>
                  </div>
                </>
              )}

              {!user && (
                <>
                  <div className="h-px bg-border my-2 mx-4" />
                  <div className="flex gap-2 px-4">
                    <Button variant="outline" asChild className="flex-1 rounded-xl">
                      <Link to="/login" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
                    </Button>
                    <Button asChild className="flex-1 rounded-xl">
                      <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>Sign Up</Link>
                    </Button>
                  </div>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
      
      {/* Credit Top Up Dialog */}
      <CreditTopUpDialog
        open={topUpOpen}
        onOpenChange={setTopUpOpen}
        currentBalance={credits}
      />
    </header>
  );
}
