import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import Step1PersonalInfo from './Step1PersonalInfo';
import Step2Rates from './Step2Rates';
import Step3Services from './Step3Services';
import Step4StripeSetup from './Step4StripeSetup';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, AlertTriangle, Clock } from 'lucide-react';

interface EditorApplicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface ApplicationFormData {
  displayName: string;
  aboutMe: string;
  country: string;
  city: string;
  hourlyRate: number;
  startingBudget: number | null;
  websiteLink: string;
  linkedinLink: string;
  languages: string[];
  services: string[];
}

const initialFormData: ApplicationFormData = {
  displayName: '',
  aboutMe: '',
  country: '',
  city: '',
  hourlyRate: 50,
  startingBudget: null,
  websiteLink: '',
  linkedinLink: '',
  languages: [],
  services: [],
};

const TOTAL_STEPS = 4;

// Calculate days remaining before rejected user can reapply
const getDaysUntilReapply = (reviewedAt: string): number => {
  const reviewedDate = new Date(reviewedAt);
  const cooldownEnd = new Date(reviewedDate.getTime() + 14 * 24 * 60 * 60 * 1000);
  const now = new Date();
  const daysRemaining = Math.ceil((cooldownEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, daysRemaining);
};

export default function EditorApplicationDialog({ open, onOpenChange }: EditorApplicationDialogProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<ApplicationFormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [stripeConnected, setStripeConnected] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [applicationStatus, setApplicationStatus] = useState<{
    status: 'none' | 'pending' | 'approved' | 'rejected';
    daysUntilReapply?: number;
  }>({ status: 'none' });

  // Check application status on open
  useEffect(() => {
    const checkApplicationStatus = async () => {
      if (!user || !open) return;
      
      setCheckingStatus(true);
      try {
        // Get profile id
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, avatar_url, full_name')
          .eq('user_id', user.id)
          .single();

        if (!profile) {
          setApplicationStatus({ status: 'none' });
          return;
        }

        setAvatarUrl(profile.avatar_url);
        if (profile.full_name && !formData.displayName) {
          setFormData(prev => ({ ...prev, displayName: profile.full_name || '' }));
        }

        // Check for existing application
        const { data: existingApp } = await supabase
          .from('editor_applications')
          .select('id, status, reviewed_at')
          .eq('user_id', profile.id)
          .maybeSingle();

        if (existingApp) {
          if (existingApp.status === 'pending') {
            setApplicationStatus({ status: 'pending' });
          } else if (existingApp.status === 'approved') {
            setApplicationStatus({ status: 'approved' });
          } else if (existingApp.status === 'rejected' && existingApp.reviewed_at) {
            const daysRemaining = getDaysUntilReapply(existingApp.reviewed_at);
            if (daysRemaining > 0) {
              setApplicationStatus({ status: 'rejected', daysUntilReapply: daysRemaining });
            } else {
              // Cooldown expired, they can apply again
              setApplicationStatus({ status: 'none' });
            }
          }
        } else {
          setApplicationStatus({ status: 'none' });
        }
      } catch (error) {
        console.error('Error checking application status:', error);
        setApplicationStatus({ status: 'none' });
      } finally {
        setCheckingStatus(false);
      }
    };

    checkApplicationStatus();
  }, [user, open]);

  const updateFormData = (updates: Partial<ApplicationFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const canProceedStep1 = formData.displayName && formData.aboutMe && formData.country && formData.city;
  const canProceedStep2 = formData.hourlyRate > 0 && formData.languages.length > 0;
  const canProceedStep3 = formData.services.length > 0;
  const canSubmit = stripeConnected;

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please sign in to apply');
      return;
    }

    setSubmitting(true);
    try {
      // Get profile id
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        throw new Error('Profile not found');
      }

      // Check if user already has a pending application
      const { data: existingApp } = await supabase
        .from('editor_applications')
        .select('id, status')
        .eq('user_id', profile.id)
        .maybeSingle();

      if (existingApp) {
        if (existingApp.status === 'pending') {
          toast.error('You already have a pending application');
          return;
        }
        if (existingApp.status === 'approved') {
          toast.error('You are already an approved professional');
          return;
        }
      }

      // Submit application
      const { error } = await supabase
        .from('editor_applications')
        .insert({
          user_id: profile.id,
          display_name: formData.displayName,
          about_me: formData.aboutMe,
          country: formData.country,
          city: formData.city,
          hourly_rate_cents: Math.round(formData.hourlyRate * 100),
          starting_budget_cents: formData.startingBudget ? Math.round(formData.startingBudget * 100) : null,
          social_links: {
            website: formData.websiteLink || null,
            linkedin: formData.linkedinLink || null,
          },
          languages: formData.languages,
          services: formData.services,
        });

      if (error) throw error;

      // Get username for notification message
      const { data: profileData } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', profile.id)
        .maybeSingle();

      // Send admin notification
      const { createAdminNotification } = await import('@/lib/notifications');
      await createAdminNotification({
        type: 'editor_application',
        message: `New professional application from @${profileData?.username || 'Unknown'}`,
        applicantId: profile.id,
        applicationType: 'editor',
        redirectUrl: '/admin',
      });

      toast.success('Application submitted successfully!');
      onOpenChange(false);
      setStep(1);
      setFormData(initialFormData);
    } catch (error: any) {
      console.error('Error submitting application:', error);
      toast.error(error.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setStep(1);
    setFormData(initialFormData);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Apply as a Professional</DialogTitle>
        </DialogHeader>

        {/* Loading State */}
        {checkingStatus && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Already Pending */}
        {!checkingStatus && applicationStatus.status === 'pending' && (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Application Pending</h3>
              <p className="text-muted-foreground mt-2">
                Your application is currently under review. We'll notify you once a decision has been made.
              </p>
            </div>
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
          </div>
        )}

        {/* Already Approved */}
        {!checkingStatus && applicationStatus.status === 'approved' && (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Already a Professional</h3>
              <p className="text-muted-foreground mt-2">
                You're already an approved professional! Visit your profile to manage your settings.
              </p>
            </div>
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
          </div>
        )}

        {/* Rejected with Cooldown */}
        {!checkingStatus && applicationStatus.status === 'rejected' && applicationStatus.daysUntilReapply && (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Application Rejected</h3>
              <p className="text-muted-foreground mt-2">
                Your previous application was not approved.
              </p>
              <div className="mt-4 p-4 rounded-lg bg-destructive/10 border border-destructive/20 inline-block">
                <p className="text-destructive font-medium">
                  Try again in {applicationStatus.daysUntilReapply} day{applicationStatus.daysUntilReapply !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
          </div>
        )}

        {/* Application Form */}
        {!checkingStatus && applicationStatus.status === 'none' && (
          <>
            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Step {step} of {TOTAL_STEPS}</span>
                <span>
                  {step === 1 ? 'Personal Info' : step === 2 ? 'Rates & Languages' : step === 3 ? 'Services' : 'Payment Setup'}
                </span>
              </div>
              <Progress value={(step / TOTAL_STEPS) * 100} className="h-2" />
            </div>

            {/* Steps */}
            {step === 1 && (
              <Step1PersonalInfo
                formData={formData}
                updateFormData={updateFormData}
                avatarUrl={avatarUrl}
              />
            )}
            {step === 2 && (
              <Step2Rates
                formData={formData}
                updateFormData={updateFormData}
              />
            )}
            {step === 3 && (
              <Step3Services
                formData={formData}
                updateFormData={updateFormData}
              />
            )}
            {step === 4 && (
              <Step4StripeSetup
                stripeConnected={stripeConnected}
                onStripeStatusChange={setStripeConnected}
              />
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => step > 1 ? setStep(step - 1) : handleClose()}
              >
                {step === 1 ? 'Cancel' : 'Back'}
              </Button>
              
              {step < TOTAL_STEPS ? (
                <Button
                  onClick={() => setStep(step + 1)}
                  disabled={
                    step === 1 ? !canProceedStep1 : 
                    step === 2 ? !canProceedStep2 : 
                    !canProceedStep3
                  }
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!canSubmit || submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Application'
                  )}
                </Button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}