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
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Menu, X, User, Settings, LogOut, ShieldCheck, Plus, LayoutDashboard, 
  CreditCard, Wallet, Loader2, ChevronDown, Package, Users, Sparkles,
  Wand2, Music, FileVideo, Mic, Film, Headphones, ArrowRight
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
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-xl border-b border-border/30 shadow-lg shadow-black/10">
      {/* Premium top highlight line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      
      <div className="mx-auto w-full px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left side: Logo + Main Nav */}
          <div className="flex items-center gap-8">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0 group">
              <img 
                src={sellspayLogo} 
                alt="SellsPay" 
                className="h-9 w-auto transition-transform duration-300 group-hover:scale-105"
              />
              <span className="hidden sm:inline text-lg font-bold tracking-tight text-foreground">
                SellsPay
              </span>
            </Link>

            {/* Desktop Navigation with Dropdowns */}
            <NavigationMenu className="hidden lg:flex">
              <NavigationMenuList className="gap-1">
                {/* Store - Click to navigate, hover for dropdown */}
                <NavigationMenuItem>
                  <Link 
                    to="/products"
                    className="inline-flex h-10 items-center justify-center px-4 text-sm font-medium text-foreground/70 hover:text-foreground transition-all duration-200 rounded-lg hover:bg-white/5"
                  >
                    Store
                  </Link>
                  <NavigationMenuContent>
                    <div className="w-[400px] p-4 bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl shadow-black/30">
                      <div className="grid gap-1">
                        {productCategories.map((item) => {
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.path}
                              to={item.path}
                              className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition-all duration-200 group"
                            >
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                <Icon className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
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
                      "inline-flex h-10 items-center justify-center px-4 text-sm font-medium transition-all duration-200 rounded-lg",
                      isActive('/creators') ? 'text-foreground bg-white/5' : 'text-foreground/70 hover:text-foreground hover:bg-white/5'
                    )}
                  >
                    Creators
                  </Link>
                </NavigationMenuItem>

                {/* Tools - Click to navigate, hover for dropdown */}
                <NavigationMenuItem>
                  <Link 
                    to="/tools"
                    className="inline-flex h-10 items-center justify-center px-4 text-sm font-medium text-foreground/70 hover:text-foreground transition-all duration-200 rounded-lg hover:bg-white/5"
                  >
                    Tools
                  </Link>
                  <NavigationMenuContent>
                    <div className="w-[320px] p-4 bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl shadow-black/30">
                      <div className="grid gap-1">
                        {toolsItems.map((item) => (
                          <Link
                            key={item.path}
                            to={item.path}
                            className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-all duration-200 group"
                          >
                            <div>
                              <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                                {item.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {item.description}
                              </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Community Dropdown */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="h-10 px-4 text-sm font-medium text-foreground/70 hover:text-foreground bg-transparent hover:bg-white/5 data-[state=open]:bg-white/5 rounded-lg transition-all duration-200">
                    Community
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-[280px] p-4 bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl shadow-black/30">
                      <div className="grid gap-1">
                        {communityItems.map((item) => (
                          <Link
                            key={item.path}
                            to={item.path}
                            className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-all duration-200 group"
                          >
                            <div>
                              <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                                {item.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {item.description}
                              </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Divider */}
                <div className="h-5 w-px bg-border/50 mx-2" />

                {/* Hire Editors - Standout */}
                <NavigationMenuItem>
                  <Link 
                    to="/hire-editors" 
                    className="inline-flex h-10 items-center justify-center px-4 text-sm font-semibold text-primary hover:text-primary/80 transition-all duration-200 rounded-lg hover:bg-primary/10"
                  >
                    Hire Editors
                    <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
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
              className="hidden lg:inline-flex h-10 items-center justify-center px-4 text-sm font-medium text-foreground/70 hover:text-foreground transition-all duration-200 rounded-lg hover:bg-white/5"
            >
              Pricing
            </Link>

            {/* Credit Wallet - Only show when logged in */}
            {user && (
              <button
                onClick={() => setTopUpDialogOpen(true)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 transition-all duration-200 border border-primary/20"
              >
                {creditsLoading ? (
                  <Loader2 className="h-4 w-4 text-primary animate-spin" />
                ) : (
                  <>
                    <Wallet className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">
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
                  <Button variant="ghost" className="relative h-9 w-9 p-0">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={avatarUrl || undefined} />
                      <AvatarFallback className="bg-primary/20 text-primary text-sm">
                        {(username || user.email)?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-card border-border">
                  <div className="flex items-center gap-2 p-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={avatarUrl || undefined} />
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {(username || user.email)?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{fullName || username || 'User'}</span>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                  </div>
                  
                  {/* Mobile wallet display */}
                  <div className="sm:hidden px-2 pb-2">
                    <button
                      onClick={() => setTopUpDialogOpen(true)}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-muted hover:bg-muted/80 transition-colors border border-border/50"
                    >
                      {creditsLoading ? (
                        <Loader2 className="h-4 w-4 text-primary animate-spin" />
                      ) : (
                        <>
                          <Wallet className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">
                            {creditBalance} Credits
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                  
                  <DropdownMenuSeparator />
                  {(isCreator || isSeller) && (
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard" className="flex items-center gap-2">
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {(isCreator || isSeller) && (
                    <DropdownMenuItem asChild>
                      <Link to="/create-product" className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Create Product
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {(isCreator || isSeller || isAdmin) && (
                    <DropdownMenuItem asChild>
                      <Link to="/subscription-plans" className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Subscription Plans
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4" />
                        Admin
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()} className="text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-3">
                <Link 
                  to="/login" 
                  className="hidden sm:inline-flex h-10 items-center justify-center px-4 text-sm font-medium text-foreground/70 hover:text-foreground transition-all duration-200 rounded-lg hover:bg-white/5"
                >
                  Sign In
                </Link>
                <Button 
                  asChild 
                  className="h-10 px-5 text-sm font-semibold rounded-lg"
                >
                  <Link to="/signup">Start Free Now</Link>
                </Button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-9 w-9 rounded-lg"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-border/30 animate-fade-in">
            <nav className="flex flex-col gap-1">
              {/* Store Section */}
              <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Store
              </div>
              {productCategories.slice(0, 4).map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2.5 text-sm font-medium text-foreground hover:bg-white/5 transition-all duration-200 rounded-lg mx-2"
                >
                  {item.name}
                </Link>
              ))}
              
              <div className="h-px bg-border/30 my-2 mx-4" />
              
              {/* Other Links */}
              <Link
                to="/creators"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2.5 text-sm font-medium text-foreground hover:bg-white/5 transition-all duration-200 rounded-lg mx-2"
              >
                Creators
              </Link>
              <Link
                to="/tools"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2.5 text-sm font-medium text-foreground hover:bg-white/5 transition-all duration-200 rounded-lg mx-2"
              >
                Tools
              </Link>
              <Link
                to="/community"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2.5 text-sm font-medium text-foreground hover:bg-white/5 transition-all duration-200 rounded-lg mx-2"
              >
                Community
              </Link>
              <Link
                to="/pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2.5 text-sm font-medium text-foreground hover:bg-white/5 transition-all duration-200 rounded-lg mx-2"
              >
                Pricing
              </Link>
              
              <div className="h-px bg-border/30 my-2 mx-4" />
              
              <Link
                to="/hire-editors"
                onClick={() => setMobileMenuOpen(false)}
                className="mx-4 py-2.5 text-sm font-semibold text-center text-primary border border-primary/50 rounded-lg hover:bg-primary/10 transition-all duration-200"
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
