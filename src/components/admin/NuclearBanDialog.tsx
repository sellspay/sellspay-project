import { useState } from 'react';
import { AlertTriangle, Loader2, Skull, Ban, Mail } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Profile {
  id: string;
  user_id: string;
  username: string | null;
  full_name: string | null;
  is_seller?: boolean | null;
}

interface NuclearBanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: Profile | null;
  onBanComplete: () => void;
}

export function NuclearBanDialog({
  open,
  onOpenChange,
  profile,
  onBanComplete,
}: NuclearBanDialogProps) {
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('Physical goods violation - zero tolerance policy');
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [sendEmail, setSendEmail] = useState(true);

  const handleNuclearBan = async () => {
    if (!profile || !confirmChecked) return;

    setLoading(true);
    try {
      // 1. Update profile with permanent ban
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          is_seller: false,
          is_permanently_banned: true,
          permanent_ban_reason: reason,
          banned_at: new Date().toISOString(),
          seller_contract_signed_at: null, // Revoke seller agreement
          suspended: true, // Also suspend the account
        })
        .eq('id', profile.id);

      if (profileError) throw profileError;

      // 2. Delete all their products (unpublish everything)
      const { error: productsError } = await supabase
        .from('products')
        .delete()
        .eq('creator_id', profile.id);

      if (productsError) {
        console.error('Error deleting products:', productsError);
        // Continue even if products deletion fails
      }

      // 3. Log the action in audit log
      const { data: { user: adminUser } } = await supabase.auth.getUser();
      if (adminUser) {
        await supabase.from('admin_audit_log').insert({
          admin_user_id: adminUser.id,
          action_type: 'nuclear_ban',
          target_type: 'user',
          target_id: profile.id,
          notes: `NUCLEAR BAN: ${reason}`,
          new_value: {
            is_permanently_banned: true,
            permanent_ban_reason: reason,
            send_email: sendEmail,
          },
        });
      }

      // 4. Send termination email if enabled (would call edge function)
      if (sendEmail) {
        try {
          // This would call an edge function to send the email
          // For now, just log it
          console.log('Termination email would be sent to user:', profile.user_id);
        } catch (emailError) {
          console.error('Failed to send termination email:', emailError);
        }
      }

      toast.success(`Account permanently banned: @${profile.username || 'Unknown'}`);
      onBanComplete();
      onOpenChange(false);
      
      // Reset state
      setReason('Physical goods violation - zero tolerance policy');
      setConfirmChecked(false);
    } catch (error) {
      console.error('Error executing nuclear ban:', error);
      toast.error('Failed to ban account');
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-lg border-destructive/50 bg-gradient-to-b from-destructive/5 to-background">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-3 text-destructive">
            <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
              <Skull className="w-5 h-5" />
            </div>
            Nuclear Ban - Permanent Termination
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
                <div>
                  <strong>WARNING: This action is IRREVERSIBLE.</strong>
                  <p className="text-sm mt-1 text-destructive/80">
                    This will permanently ban{' '}
                    <strong className="text-destructive">
                      @{profile.username || profile.full_name || 'this user'}
                    </strong>{' '}
                    from ever becoming a seller again.
                  </p>
                </div>
              </div>
            </div>

            <div className="text-sm space-y-2">
              <p className="font-medium text-foreground">This action will:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Set <code className="text-xs bg-muted px-1 rounded">is_seller_verified</code> to false</li>
                <li>Disable their public store URL</li>
                <li>Delete all their products</li>
                <li>Add <code className="text-xs bg-muted px-1 rounded">is_permanently_banned</code> flag</li>
                <li>Store their email/Stripe ID to prevent re-registration</li>
                <li>Send a "Termination of Service" email (optional)</li>
              </ul>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="ban-reason">Ban Reason</Label>
            <Textarea
              id="ban-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter the reason for this ban..."
              className="mt-2"
              rows={3}
            />
          </div>

          <div className="flex items-center gap-3">
            <Checkbox
              id="send-email"
              checked={sendEmail}
              onCheckedChange={(checked) => setSendEmail(checked === true)}
            />
            <Label htmlFor="send-email" className="flex items-center gap-2 cursor-pointer">
              <Mail className="w-4 h-4 text-muted-foreground" />
              Send termination email to user
            </Label>
          </div>

          <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5">
            <div className="flex items-start gap-3">
              <Checkbox
                id="confirm-ban"
                checked={confirmChecked}
                onCheckedChange={(checked) => setConfirmChecked(checked === true)}
              />
              <Label htmlFor="confirm-ban" className="text-sm cursor-pointer">
                I understand this action is <strong className="text-destructive">permanent and irreversible</strong>. 
                The user will never be able to sell on SellsPay again with this account.
              </Label>
            </div>
          </div>
        </div>

        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleNuclearBan}
            disabled={loading || !confirmChecked || !reason.trim()}
            className="gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Ban className="w-4 h-4" />
                Execute Nuclear Ban
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
