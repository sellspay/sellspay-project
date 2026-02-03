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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Menu, X, User, Settings, LogOut, ShieldCheck, Plus, LayoutDashboard, CreditCard, Wallet, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useCredits } from '@/hooks/useCredits';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { TopUpDialog } from '@/components/credits/TopUpDialog';
import EditorChatIcon from '@/components/chat/EditorChatIcon';
import sellspayLogo from '@/assets/sellspay-nav-logo.png';

const navItems = [
  { name: 'Store', path: '/products' },
  { name: 'Creators', path: '/creators' },
  { name: 'Tools', path: '/tools' },
  { name: 'Pricing', path: '/pricing' },
  { name: 'Community', path: '/community' },
];

export default function Header() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [topUpDialogOpen, setTopUpDialogOpen] = useState(false);
  
  const { creditBalance, isLoading: creditsLoading, subscription } = useCredits();
  
  // Get subscription tier from subscription data
  const subscriptionTier = subscription ? 
    subscription.credits === 60 ? 'starter' :
    subscription.credits === 150 ? 'pro' :
    subscription.credits === 300 ? 'enterprise' : null
  : null;

  // Derive values from centralized profile state
  const isCreator = profile?.is_creator || false;
  const isSeller = profile?.is_seller || false;
  const avatarUrl = profile?.avatar_url || null;
  const username = profile?.username || null;
  const fullName = profile?.full_name || null;

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="flex h-14 sm:h-16 items-center justify-between gap-2">
          {/* Logo */}
          <Link to="/" className="flex items-center shrink-0 group">
            <img 
              src={sellspayLogo} 
               alt="SellsPay" 
              className="h-10 sm:h-11 lg:h-12 w-auto group-hover:opacity-80 transition-opacity"
            />
             <span className="ml-2 hidden sm:inline text-sm font-semibold tracking-tight text-foreground">
               SellsPay
             </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                  isActive(item.path)
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                }`}
              >
                {item.name}
              </Link>
            ))}

            {/* Hire Editors Button - Standout with animated gradient */}
            <Button 
              asChild 
              size="sm"
              className="ml-2 rounded-full text-white text-xs font-medium relative overflow-hidden bg-gradient-to-r from-violet-500 via-fuchsia-500 to-violet-500 bg-[length:200%_100%] animate-[gradient-wave_2s_ease-in-out_infinite]"
            >
              <Link to="/hire-editors">Hire Editors</Link>
            </Button>
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Credit Wallet - Only show when logged in */}
            {user && (
              <button
                onClick={() => setTopUpDialogOpen(true)}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-secondary/80 hover:bg-secondary transition-colors border border-border/50"
              >
                {creditsLoading ? (
                  <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary animate-spin" />
                ) : (
                  <>
                    <Wallet className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                    <span className="text-xs sm:text-sm font-medium">
                      {creditBalance}
                    </span>
                  </>
                )}
              </button>
            )}

            {/* Editor Chat Icon - Only show when user has active booking chat */}
            {user && <EditorChatIcon />}

            {/* Notification Bell - Only show when logged in */}
            {user && <NotificationBell />}
            
            {user ? (
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 sm:h-9 sm:w-9 rounded-full p-0">
                    <Avatar className="h-8 w-8 sm:h-9 sm:w-9">
                      <AvatarImage src={avatarUrl || undefined} />
                      <AvatarFallback className="bg-primary/20 text-primary text-xs sm:text-sm">
                        {(username || user.email)?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
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
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-secondary/80 hover:bg-secondary transition-colors border border-border/50"
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
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Button variant="ghost" asChild size="sm" className="text-xs sm:text-sm px-2 sm:px-3">
                  <Link to="/login">Sign In</Link>
                </Button>
                <Button 
                  asChild 
                  size="sm"
                  className="rounded-full text-white text-xs sm:text-sm font-medium relative overflow-hidden bg-gradient-to-r from-violet-500 via-fuchsia-500 to-violet-500 bg-[length:200%_100%] animate-[gradient-wave_2s_ease-in-out_infinite] hover:shadow-lg hover:shadow-primary/30 transition-shadow px-3 sm:px-4"
                >
                  <Link to="/signup">Join free</Link>
                </Button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-8 w-8 sm:h-9 sm:w-9"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-4 w-4 sm:h-5 sm:w-5" /> : <Menu className="h-4 w-4 sm:h-5 sm:w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-border/40">
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive(item.path)
                      ? 'bg-secondary text-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              <Link
                to="/hire-editors"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-1.5 text-xs font-medium text-white rounded-lg bg-gradient-to-r from-violet-500 via-fuchsia-500 to-violet-500 bg-[length:200%_100%] animate-gradient-wave"
              >
                Hire Editors
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