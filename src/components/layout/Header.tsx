import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
  CreditCard, Wallet, Loader2, Package, Sparkles,
  Wand2, Music, FileVideo, Film, Headphones, ArrowRight
} from 'lucide-react';
import { useState } from 'react';
import { useCredits } from '@/hooks/useCredits';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { TopUpDialog } from '@/components/credits/TopUpDialog';
import EditorChatIcon from '@/components/chat/EditorChatIcon';
import sellspayLogo from '@/assets/sellspay-s-logo-new.png';
import { cn } from '@/lib/utils';

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
  { name: 'Music Splitter', path: '/tools?tool=music-splitter', description: 'Separate vocals & stems' },
  { name: 'Voice Isolator', path: '/tools?tool=voice-isolator', description: 'Extract voice from audio' },
  { name: 'SFX Generator', path: '/tools?tool=sfx-generator', description: 'AI-powered sound effects' },
  { name: 'Audio Converter', path: '/tools?tool=audio-converter', description: 'Convert audio formats' },
  { name: 'Waveform Generator', path: '/tools?tool=waveform-generator', description: 'Create audio waveforms' },
];

// Community dropdown items
const communityItems = [
  { name: 'Updates', path: '/community/updates', description: 'Platform news & updates' },
  { name: 'Spotlight', path: '/community/spotlight', description: 'Featured creators' },
  { name: 'Discord', path: '/community/discord', description: 'Join our community' },
];

// Premium nav link styles
const navLinkStyles = cn(
  "relative px-4 py-2 text-sm font-medium text-foreground/70",
  "rounded-lg transition-all duration-300",
  "hover:text-foreground",
  "before:absolute before:inset-0 before:rounded-lg before:opacity-0",
  "before:bg-gradient-to-b before:from-white/10 before:to-transparent",
  "before:transition-opacity before:duration-300",
  "hover:before:opacity-100",
  "after:absolute after:inset-[1px] after:rounded-[7px] after:opacity-0",
  "after:shadow-[inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-1px_0_rgba(0,0,0,0.2)]",
  "hover:after:opacity-100 after:transition-opacity after:duration-300"
);

const activeNavLinkStyles = cn(
  navLinkStyles,
  "text-foreground bg-white/5",
  "shadow-[inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-1px_0_rgba(0,0,0,0.3),0_1px_3px_rgba(0,0,0,0.2)]"
);

export default function Header() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [topUpDialogOpen, setTopUpDialogOpen] = useState(false);
  
  const { creditBalance, isLoading: creditsLoading, subscription } = useCredits();
  
  const subscriptionTier = subscription ? 
    subscription.credits === 60 ? 'starter' :
    subscription.credits === 150 ? 'pro' :
    subscription.credits === 300 ? 'enterprise' : null
  : null;

  const isCreator = profile?.is_creator || false;
  const isSeller = profile?.is_seller || false;
  const avatarUrl = profile?.avatar_url || null;
  const username = profile?.username || null;
  const fullName = profile?.full_name || null;

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path.split('?')[0]);

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full",
      // Solid background with subtle transparency
      "bg-background/98 backdrop-blur-md",
      // Clean border
      "border-b border-border/50",
      // Subtle shadow
      "shadow-lg shadow-black/20"
    )}>
      {/* Top accent line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      
      <div className="mx-auto w-full px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left side: Logo + Main Nav */}
          <div className="flex items-center gap-8">
            {/* Logo */}
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
                    Store
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
                    to="/tools"
                    className={cn(
                      "inline-flex h-10 items-center justify-center",
                      isActive('/tools') ? activeNavLinkStyles : navLinkStyles
                    )}
                  >
                    Tools
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
                    "h-10 px-4 text-sm font-medium bg-transparent rounded-lg",
                    "text-foreground/70 hover:text-foreground",
                    "data-[state=open]:text-foreground data-[state=open]:bg-white/5",
                    "transition-all duration-300",
                    "hover:bg-gradient-to-b hover:from-white/10 hover:to-transparent",
                    "data-[state=open]:shadow-[inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-1px_0_rgba(0,0,0,0.3)]"
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

                {/* Hire Editors - Premium Standout */}
                <NavigationMenuItem>
                  <Link 
                    to="/hire-editors" 
                    className={cn(
                      "inline-flex h-10 items-center justify-center px-5 text-sm font-semibold",
                      "text-primary rounded-xl transition-all duration-300",
                      "bg-gradient-to-b from-primary/20 to-primary/10",
                      "shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_2px_8px_rgba(0,0,0,0.2)]",
                      "border border-primary/30",
                      "hover:from-primary/30 hover:to-primary/15",
                      "hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_4px_12px_rgba(0,0,0,0.3)]",
                      "hover:border-primary/40"
                    )}
                  >
                    Hire Editors
                    <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Pricing Link - Desktop only */}
            <Link 
              to="/pricing" 
              className={cn(
                "hidden lg:inline-flex h-10 items-center justify-center",
                isActive('/pricing') ? activeNavLinkStyles : navLinkStyles
              )}
            >
              Pricing
            </Link>

            {/* Credit Wallet - Premium 3D style */}
            {user && (
              <button
                onClick={() => setTopUpDialogOpen(true)}
                className={cn(
                  "hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl",
                  "bg-gradient-to-b from-primary/20 to-primary/10",
                  "border border-primary/30",
                  "shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_2px_8px_rgba(0,0,0,0.2)]",
                  "transition-all duration-300",
                  "hover:from-primary/30 hover:to-primary/15",
                  "hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_4px_12px_rgba(0,0,0,0.3)]"
                )}
              >
                {creditsLoading ? (
                  <Loader2 className="h-4 w-4 text-primary animate-spin" />
                ) : (
                  <>
                    <Wallet className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold text-foreground">
                      {creditBalance}
                    </span>
                  </>
                )}
              </button>
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
                  className={cn(
                    "w-60 p-2",
                    "bg-card border border-border",
                    "shadow-xl shadow-black/30",
                    "rounded-xl"
                  )}
                >
                  <div className={cn(
                    "flex items-center gap-3 p-3 mb-2 rounded-lg",
                    "bg-muted/50"
                  )}>
                    <Avatar className="h-11 w-11 ring-2 ring-primary/20 shadow-lg">
                      <AvatarImage src={avatarUrl || undefined} className="rounded-full" />
                      <AvatarFallback className="bg-primary/20 text-primary font-semibold rounded-full">
                        {(username || user.email)?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-foreground">{fullName || username || 'User'}</span>
                      <span className="text-xs text-muted-foreground truncate max-w-[140px]">{user.email}</span>
                    </div>
                  </div>
                  
                  {/* Mobile wallet display */}
                  <div className="sm:hidden px-2 pb-2">
                    <button
                      onClick={() => setTopUpDialogOpen(true)}
                      className={cn(
                        "w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg",
                        "bg-primary/15 hover:bg-primary/25",
                        "transition-colors duration-200"
                      )}
                    >
                      {creditsLoading ? (
                        <Loader2 className="h-4 w-4 text-primary animate-spin" />
                      ) : (
                        <>
                          <Wallet className="h-4 w-4 text-primary" />
                          <span className="text-sm font-semibold text-foreground">
                            {creditBalance} Credits
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                  
                  <DropdownMenuSeparator className="bg-border my-1" />
                  
                  {(isCreator || isSeller) && (
                    <DropdownMenuItem asChild className={cn(
                      "rounded-lg px-3 py-2.5 cursor-pointer",
                      "hover:bg-muted",
                      "focus:bg-muted"
                    )}>
                      <Link to="/dashboard" className="flex items-center gap-3">
                        <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {(isCreator || isSeller) && (
                    <DropdownMenuItem asChild className={cn(
                      "rounded-lg px-3 py-2.5 cursor-pointer",
                      "hover:bg-muted",
                      "focus:bg-muted"
                    )}>
                      <Link to="/create-product" className="flex items-center gap-3">
                        <Plus className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Create Product</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {(isCreator || isSeller || isAdmin) && (
                    <DropdownMenuItem asChild className={cn(
                      "rounded-lg px-3 py-2.5 cursor-pointer",
                      "hover:bg-muted",
                      "focus:bg-muted"
                    )}>
                      <Link to="/subscription-plans" className="flex items-center gap-3">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Subscription Plans</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild className={cn(
                    "rounded-lg px-3 py-2.5 cursor-pointer",
                    "hover:bg-muted",
                    "focus:bg-muted"
                  )}>
                    <Link to="/profile" className="flex items-center gap-3">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className={cn(
                    "rounded-lg px-3 py-2.5 cursor-pointer",
                    "hover:bg-muted",
                    "focus:bg-muted"
                  )}>
                    <Link to="/settings" className="flex items-center gap-3">
                      <Settings className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild className={cn(
                      "rounded-lg px-3 py-2.5 cursor-pointer",
                      "hover:bg-muted",
                      "focus:bg-muted"
                    )}>
                      <Link to="/admin" className="flex items-center gap-3">
                        <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Admin</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-border my-1" />
                  <DropdownMenuItem
                    onClick={() => signOut()} 
                    className={cn(
                      "rounded-lg px-3 py-2.5 cursor-pointer text-destructive",
                      "hover:bg-destructive/10"
                    )}
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    <span className="font-medium">Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-3">
                <Link 
                  to="/login" 
                  className={cn(
                    "hidden sm:inline-flex h-10 items-center justify-center",
                    navLinkStyles
                  )}
                >
                  Sign In
                </Link>
                <Button 
                  asChild 
                  className="h-10 px-6 text-sm font-semibold rounded-xl"
                >
                  <Link to="/signup">Start Free Now</Link>
                </Button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "lg:hidden h-10 w-10 rounded-xl",
                "bg-gradient-to-b from-white/10 to-transparent",
                "shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_2px_8px_rgba(0,0,0,0.2)]",
                "border border-white/10",
                "hover:from-white/15 hover:to-white/5"
              )}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className={cn(
            "lg:hidden py-5 animate-fade-in",
            "border-t border-white/10"
          )}>
            <nav className="flex flex-col gap-2">
              {/* Store Section */}
              <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Store
              </div>
              {productCategories.slice(0, 4).map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "mx-3 px-4 py-3 text-sm font-medium text-foreground rounded-xl",
                    "hover:bg-gradient-to-r hover:from-white/[0.08] hover:to-transparent",
                    "transition-all duration-300"
                  )}
                >
                  {item.name}
                </Link>
              ))}
              
              <div className="h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent my-2 mx-6" />
              
              {/* Other Links */}
              <Link
                to="/creators"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "mx-3 px-4 py-3 text-sm font-medium text-foreground rounded-xl",
                  "hover:bg-gradient-to-r hover:from-white/[0.08] hover:to-transparent",
                  "transition-all duration-300"
                )}
              >
                Creators
              </Link>
              <Link
                to="/tools"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "mx-3 px-4 py-3 text-sm font-medium text-foreground rounded-xl",
                  "hover:bg-gradient-to-r hover:from-white/[0.08] hover:to-transparent",
                  "transition-all duration-300"
                )}
              >
                Tools
              </Link>
              <Link
                to="/community"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "mx-3 px-4 py-3 text-sm font-medium text-foreground rounded-xl",
                  "hover:bg-gradient-to-r hover:from-white/[0.08] hover:to-transparent",
                  "transition-all duration-300"
                )}
              >
                Community
              </Link>
              <Link
                to="/pricing"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "mx-3 px-4 py-3 text-sm font-medium text-foreground rounded-xl",
                  "hover:bg-gradient-to-r hover:from-white/[0.08] hover:to-transparent",
                  "transition-all duration-300"
                )}
              >
                Pricing
              </Link>
              
              <div className="h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent my-2 mx-6" />
              
              <Link
                to="/hire-editors"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "mx-3 py-3 text-sm font-semibold text-center text-primary rounded-xl",
                  "bg-gradient-to-b from-primary/20 to-primary/10",
                  "border border-primary/30",
                  "shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]",
                  "transition-all duration-300",
                  "hover:from-primary/30 hover:to-primary/15"
                )}
              >
                Hire Editors →
              </Link>
            </nav>
          </div>
        )}
      </div>
      
      {/* Top Up Dialog */}
      <TopUpDialog
        open={topUpDialogOpen}
        onOpenChange={setTopUpDialogOpen}
        currentBalance={creditBalance}
        subscriptionTier={subscriptionTier}
      />
    </header>
  );
}
