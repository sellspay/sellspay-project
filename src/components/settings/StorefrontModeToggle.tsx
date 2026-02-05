import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Sparkles, LayoutGrid, CheckCircle, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface StorefrontModeToggleProps {
  profileId: string;
  username: string | null;
  currentMode: 'free' | 'ai';
  hasAIStorefront: boolean;
  onModeChange: (newMode: 'free' | 'ai') => void;
}

export function StorefrontModeToggle({
  profileId,
  username,
  currentMode,
  hasAIStorefront,
  onModeChange,
}: StorefrontModeToggleProps) {
  const navigate = useNavigate();
  const [switching, setSwitching] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingMode, setPendingMode] = useState<'free' | 'ai' | null>(null);

  const handleModeSwitch = async (newMode: 'free' | 'ai') => {
    // If switching to classic from AI, show confirmation
    if (currentMode === 'ai' && newMode === 'free') {
      setPendingMode(newMode);
      setShowConfirmDialog(true);
      return;
    }

    // If switching to AI but no AI storefront exists, redirect to builder
    if (newMode === 'ai' && !hasAIStorefront) {
      navigate('/ai-builder');
      return;
    }

    await executeSwitch(newMode);
  };

  const executeSwitch = async (newMode: 'free' | 'ai') => {
    setSwitching(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ active_storefront_mode: newMode })
        .eq('id', profileId);

      if (error) throw error;

      onModeChange(newMode);
      toast.success(
        newMode === 'ai' 
          ? 'Switched to AI Storefront! Your profile now shows your Vibecoder design.' 
          : 'Switched to Classic Profile! Your AI design is safely saved.'
      );
    } catch (error) {
      console.error('Error switching storefront mode:', error);
      toast.error('Failed to switch storefront mode.');
    } finally {
      setSwitching(false);
      setShowConfirmDialog(false);
      setPendingMode(null);
    }
  };

  const handleConfirmSwitch = () => {
    if (pendingMode) {
      executeSwitch(pendingMode);
    }
  };

  return (
    <>
      <Card className="bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutGrid className="w-5 h-5" />
            Storefront Mode
          </CardTitle>
          <CardDescription>
            Choose how your public profile appears. Switching modes will NOT delete your designs—both are saved safely.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mode Buttons */}
          <div className="grid grid-cols-2 gap-4">
            {/* Classic Mode */}
            <button
              onClick={() => handleModeSwitch('free')}
              disabled={switching || currentMode === 'free'}
              className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                currentMode === 'free'
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50 hover:bg-muted/50'
              }`}
            >
              {currentMode === 'free' && (
                <Badge className="absolute top-2 right-2 bg-primary/20 text-primary border-primary/30">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Active
                </Badge>
              )}
              <LayoutGrid className="w-8 h-8 mb-3 text-primary" />
              <h3 className="font-semibold mb-1">Classic Profile</h3>
              <p className="text-sm text-muted-foreground">
                Instagram-style layout with sections you manually configure.
              </p>
            </button>

            {/* AI/Vibecoder Mode */}
            <button
              onClick={() => handleModeSwitch('ai')}
              disabled={switching || currentMode === 'ai'}
              className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                currentMode === 'ai'
                  ? 'border-violet-500 bg-violet-500/10'
                  : 'border-border hover:border-violet-500/50 hover:bg-muted/50'
              }`}
            >
              {currentMode === 'ai' && (
                <Badge className="absolute top-2 right-2 bg-violet-500/20 text-violet-400 border-violet-500/30">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Active
                </Badge>
              )}
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-8 h-8 text-violet-400" />
              </div>
              <h3 className="font-semibold mb-1">AI Storefront</h3>
              <p className="text-sm text-muted-foreground">
                Custom React storefront generated by Vibecoder AI.
              </p>
              {!hasAIStorefront && (
                <p className="text-xs text-amber-500 mt-2">
                  No AI storefront created yet
                </p>
              )}
            </button>
          </div>

          {/* Status Info */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="text-sm text-muted-foreground">
              {currentMode === 'ai' ? (
                <>Your profile shows your <span className="text-violet-400 font-medium">AI Storefront</span></>
              ) : (
                <>Your profile shows your <span className="text-primary font-medium">Classic Layout</span></>
              )}
            </div>
            {username && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(`/@${username}`, '_blank')}
                className="gap-1.5"
              >
                <ExternalLink className="w-4 h-4" />
                View Profile
              </Button>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 pt-2">
            {currentMode === 'ai' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/ai-builder')}
                className="gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                Edit AI Storefront
              </Button>
            )}
            {currentMode === 'free' && hasAIStorefront && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/ai-builder')}
                className="gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                Edit AI Storefront
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Switch to Classic Profile?</AlertDialogTitle>
            <AlertDialogDescription>
              Your AI storefront will be safely saved. You can switch back to it anytime without losing your design.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={switching}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSwitch} disabled={switching}>
              {switching ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Switching...
                </>
              ) : (
                'Switch to Classic'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default StorefrontModeToggle;
