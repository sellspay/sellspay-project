import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Clock, DollarSign, Users, Sparkles, MessageCircle, Shield, Zap, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EditorProfile {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  editor_hourly_rate_cents: number | null;
}

interface HireEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editor: EditorProfile | null;
}

export default function HireEditorModal({ open, onOpenChange, editor }: HireEditorModalProps) {
  const { user } = useAuth();
  const [hours, setHours] = useState(1);
  const [loading, setLoading] = useState(false);
  const [queueLength, setQueueLength] = useState(0);

  useEffect(() => {
    if (open && editor) {
      fetchQueueStatus();
    }
  }, [open, editor?.id]);

  const fetchQueueStatus = async () => {
    if (!editor) return;

    // Count active/queued bookings for this editor
    const { count } = await supabase
      .from('editor_bookings')
      .select('*', { count: 'exact', head: true })
      .eq('editor_id', editor.id)
      .in('status', ['in_progress', 'queued']);

    setQueueLength(count || 0);
  };

  if (!editor) return null;

  const hourlyRate = (editor.editor_hourly_rate_cents || 5000) / 100;
  const totalPrice = hourlyRate * hours;
  const platformFee = totalPrice * 0.05; // 5% platform fee

  const handleHire = async () => {
    if (!user) {
      toast.error('Please sign in to hire an editor');
      return;
    }

    setLoading(true);
    try {
      // Get buyer profile
      const { data: buyerProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!buyerProfile) {
        throw new Error('Profile not found');
      }

      // Call edge function to create checkout session
      const { data, error } = await supabase.functions.invoke('create-editor-booking', {
        body: {
          editorId: editor.id,
          buyerId: buyerProfile.id,
          hours: hours,
          hourlyRateCents: editor.editor_hourly_rate_cents || 5000,
        }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
        onOpenChange(false);
      }
    } catch (error: any) {
      console.error('Error creating booking:', error);
      toast.error(error.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-gradient-to-b from-background via-background to-background/95 border-primary/20">
        {/* Premium Header */}
        <div className="relative">
          <div className="absolute inset-0 h-24 bg-gradient-to-r from-violet-500/20 via-fuchsia-500/20 to-violet-500/20" />
          <div className="absolute top-0 left-1/4 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
          
          <DialogHeader className="relative p-6 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <DialogTitle className="text-xl">Hire Editor</DialogTitle>
            </div>
            <DialogDescription>
              Book hours with this editor for your project.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 pb-6 space-y-5">
          {/* Editor Info */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-secondary/80 to-secondary/40 border border-border/50">
            <Avatar className="w-14 h-14 ring-2 ring-primary/30 shadow-lg">
              <AvatarImage src={editor.avatar_url || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 text-primary text-lg">
                {(editor.full_name || editor.username)?.charAt(0).toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-semibold text-foreground">{editor.full_name || editor.username || 'Editor'}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5" />
                ${hourlyRate.toFixed(2)} / hour
              </p>
            </div>
          </div>

          {/* Queue Status */}
          {queueLength > 0 && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <Users className="h-5 w-5 text-amber-500" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                  Editor is currently busy
                </p>
                <p className="text-xs text-muted-foreground">
                  {queueLength} booking{queueLength > 1 ? 's' : ''} in queue • You'll be position {queueLength + 1}
                </p>
              </div>
            </div>
          )}

          {/* What's Included - Premium Benefits */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 via-fuchsia-500/5 to-violet-500/5 border border-primary/20 space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <h4 className="font-semibold text-sm">What's Included</h4>
            </div>
            
            <div className="space-y-2.5">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 p-1 rounded-full bg-primary/10">
                  <MessageCircle className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Private 1-on-1 Chat</p>
                  <p className="text-xs text-muted-foreground">
                    Exclusive direct messaging with your editor, stays open for 7 days after project completion
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="mt-0.5 p-1 rounded-full bg-primary/10">
                  <Shield className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Priority Support</p>
                  <p className="text-xs text-muted-foreground">
                    Get expedited assistance from our team throughout your project
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="mt-0.5 p-1 rounded-full bg-primary/10">
                  <Zap className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Secure Payment</p>
                  <p className="text-xs text-muted-foreground">
                    Protected transaction with instant editor notification upon payment
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div className="p-4 rounded-xl bg-secondary/50 border border-border/50 space-y-3">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              How It Works
            </h4>
            <ol className="space-y-2 text-xs text-muted-foreground">
              <li className="flex gap-2">
                <span className="font-bold text-primary">1.</span>
                <span>Complete payment securely via Stripe</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-primary">2.</span>
                <span>{queueLength > 0 ? "You'll be added to the queue and notified when it's your turn" : "Your editor is immediately notified and your chat opens"}</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-primary">3.</span>
                <span>Collaborate directly through your private chat</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-primary">4.</span>
                <span>Chat remains active for 7 days after completion for revisions</span>
              </li>
            </ol>
          </div>

          {/* Hours Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Number of Hours</Label>
            <div className="flex items-center gap-4">
              <Slider
                value={[hours]}
                onValueChange={([value]) => setHours(value)}
                min={1}
                max={40}
                step={1}
                className="flex-1"
              />
              <Input
                type="number"
                value={hours}
                onChange={(e) => setHours(Math.max(1, Math.min(40, parseInt(e.target.value) || 1)))}
                className="w-20 text-center bg-secondary/50 border-border/50"
                min={1}
                max={40}
              />
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="p-4 rounded-xl bg-card/50 border border-border/50 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                {hours} hour{hours > 1 ? 's' : ''} × ${hourlyRate.toFixed(2)}
              </span>
              <span className="font-medium">${totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Platform fee (5%)</span>
              <span>${platformFee.toFixed(2)}</span>
            </div>
            <div className="border-t border-border/50 pt-3 flex items-center justify-between">
              <span className="font-semibold flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" />
                Total
              </span>
              <span className="text-xl font-bold bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
                ${totalPrice.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleHire}
              disabled={loading}
              className="flex-1 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white shadow-lg shadow-primary/25"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {queueLength > 0 ? 'Join Queue' : 'Pay'} ${totalPrice.toFixed(2)}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}