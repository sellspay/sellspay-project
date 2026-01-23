import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Clock, DollarSign } from 'lucide-react';
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

  if (!editor) return null;

  const hourlyRate = (editor.editor_hourly_rate_cents || 5000) / 100;
  const totalPrice = hourlyRate * hours;
  const platformFee = totalPrice * 0.05; // 5% platform fee
  const editorPayout = totalPrice - platformFee;

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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Hire Editor</DialogTitle>
          <DialogDescription>
            Select the number of hours you want to hire this editor for.
          </DialogDescription>
        </DialogHeader>

        {/* Editor Info */}
        <div className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50">
          <Avatar className="w-14 h-14">
            <AvatarImage src={editor.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/20 text-primary text-lg">
              {(editor.full_name || editor.username)?.charAt(0).toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{editor.full_name || editor.username || 'Editor'}</p>
            <p className="text-sm text-muted-foreground">
              ${hourlyRate.toFixed(2)} / hour
            </p>
          </div>
        </div>

        {/* Hours Selection */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Number of Hours</Label>
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
                className="w-20 text-center"
                min={1}
                max={40}
              />
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="p-4 rounded-lg border space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                {hours} hour{hours > 1 ? 's' : ''} × ${hourlyRate.toFixed(2)}
              </span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Platform fee (5%)</span>
              <span>${platformFee.toFixed(2)}</span>
            </div>
            <div className="border-t pt-2 mt-2 flex items-center justify-between font-semibold">
              <span className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Total
              </span>
              <span className="text-lg">${totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleHire}
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              `Pay $${totalPrice.toFixed(2)}`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}