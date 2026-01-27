import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { Check, X, Loader2, AtSign } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';

export function UsernameSetupDialog() {
  const { user, profile, refreshProfile } = useAuth();
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const debouncedUsername = useDebounce(username, 500);

  // Show dialog if user is logged in but has no username
  useEffect(() => {
    if (user && profile && !profile.username) {
      setOpen(true);
    }
  }, [user, profile]);

  // Check username availability
  useEffect(() => {
    const checkUsername = async () => {
      if (!debouncedUsername || debouncedUsername.length < 3) {
        setIsAvailable(null);
        return;
      }

      // Validate format: alphanumeric, underscores, 3-30 chars
      const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
      if (!usernameRegex.test(debouncedUsername)) {
        setIsAvailable(false);
        return;
      }

      setIsChecking(true);
      try {
        const { data, error } = await supabase.rpc('is_username_available_v2', {
          p_username: debouncedUsername
        });
        
        if (error) throw error;
        setIsAvailable(data === true);
      } catch (err) {
        console.error('Error checking username:', err);
        setIsAvailable(null);
      } finally {
        setIsChecking(false);
      }
    };

    checkUsername();
  }, [debouncedUsername]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAvailable || !profile) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ username: username.toLowerCase() })
        .eq('id', profile.id);

      if (error) throw error;

      await refreshProfile();
      toast.success('Username set successfully!');
      setOpen(false);
    } catch (err: any) {
      console.error('Error setting username:', err);
      toast.error(err.message || 'Failed to set username');
    } finally {
      setIsSaving(false);
    }
  };

  const getInputStatus = () => {
    if (!username || username.length < 3) return null;
    if (isChecking) return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
    if (isAvailable === true) return <Check className="h-4 w-4 text-emerald-500" />;
    if (isAvailable === false) return <X className="h-4 w-4 text-destructive" />;
    return null;
  };

  const getHelperText = () => {
    if (!username) return 'Choose a unique username for your profile';
    if (username.length < 3) return 'Username must be at least 3 characters';
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return 'Only letters, numbers, and underscores allowed';
    if (username.length > 30) return 'Username must be 30 characters or less';
    if (isChecking) return 'Checking availability...';
    if (isAvailable === true) return 'Username is available!';
    if (isAvailable === false) return 'Username is already taken';
    return '';
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AtSign className="h-5 w-5 text-primary" />
            Choose your username
          </DialogTitle>
          <DialogDescription>
            Pick a unique username for your profile. This is how others will find you.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="yourname"
                className="pl-8 pr-10"
                maxLength={30}
                autoFocus
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {getInputStatus()}
              </div>
            </div>
            <p className={`text-xs ${isAvailable === false ? 'text-destructive' : isAvailable === true ? 'text-emerald-500' : 'text-muted-foreground'}`}>
              {getHelperText()}
            </p>
          </div>

          <Button
            type="submit" 
            className="w-full"
            disabled={!isAvailable || isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Setting up...
              </>
            ) : (
              'Continue'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
