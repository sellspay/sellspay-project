import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, ArrowRight, Send } from 'lucide-react';

import Step1PersonalInfo from './Step1PersonalInfo';
import Step2ProductTypes from './Step2ProductTypes';
import Step3TwoFactor from './Step3TwoFactor';
import Step4Review from './Step4Review';
import { CreatorApplicationFormData } from './types';

interface CreatorApplicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplicationSubmitted?: () => void;
}

export default function CreatorApplicationDialog({
  open,
  onOpenChange,
  onApplicationSubmitted,
}: CreatorApplicationDialogProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [existingApplication, setExistingApplication] = useState<{ status: string; reviewed_at: string | null } | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [dataFetched, setDataFetched] = useState(false);

  const [formData, setFormData] = useState<CreatorApplicationFormData>({
    fullName: '',
    country: '',
    state: '',
    languages: [],
    socialLinks: {
      instagram: '',
      youtube: '',
      twitter: '',
      tiktok: '',
    },
    productTypes: [],
  });

  // Fetch user data and check for existing application - only once when dialog opens
  useEffect(() => {
    const fetchData = async () => {
      if (!user || !open || dataFetched) return;

      setLoading(true);
      try {
        // Get user email
        const { data: authData } = await supabase.auth.getUser();
        if (authData.user?.email) {
          setUserEmail(authData.user.email);
        }

        // Get profile data
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, mfa_enabled, id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profile) {
          setFormData(prev => ({
            ...prev,
            fullName: profile.full_name || '',
          }));
          setMfaEnabled(profile.mfa_enabled || false);

          // Check for existing application
          const { data: application } = await supabase
            .from('creator_applications')
            .select('status, reviewed_at')
            .eq('user_id', profile.id)
            .maybeSingle();

          if (application) {
            setExistingApplication(application);
          }
        }
        setDataFetched(true);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, open, dataFetched]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setStep(1);
      setTermsAccepted(false);
      setOtpSent(false);
      setDataFetched(false);
    }
  }, [open]);

  const updateFormData = (updates: Partial<CreatorApplicationFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        const { fullName, country, state, languages, socialLinks } = formData;
        const hasSocial = !!(socialLinks.instagram || socialLinks.youtube || socialLinks.twitter || socialLinks.tiktok);
        return fullName && country && state && languages.length > 0 && hasSocial;
      case 2:
        return formData.productTypes.length > 0;
      case 3:
        return mfaEnabled;
      case 4:
        return termsAccepted;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user || !canProceed()) return;

    setSubmitting(true);
    try {
      // Get profile ID
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      // Insert application
      const { error } = await supabase
        .from('creator_applications')
        .insert({
          user_id: profile.id,
          full_name: formData.fullName,
          country: formData.country,
          state: formData.state,
          languages: formData.languages,
          social_links: formData.socialLinks,
          product_types: formData.productTypes,
          status: 'pending',
        });

      if (error) throw error;

      toast.success('Verification application submitted! We\'ll review it soon.');
      onOpenChange(false);
      onApplicationSubmitted?.();
    } catch (error: any) {
      console.error('Error submitting application:', error);
      toast.error(error.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  // Check for rejection cooldown
  const getRejectionCooldown = () => {
    if (!existingApplication || existingApplication.status !== 'rejected' || !existingApplication.reviewed_at) {
      return 0;
    }
    const reviewedDate = new Date(existingApplication.reviewed_at);
    const cooldownEnd = new Date(reviewedDate.getTime() + 14 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const daysRemaining = Math.ceil((cooldownEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, daysRemaining);
  };

  const rejectionCooldown = getRejectionCooldown();

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Show pending status
  if (existingApplication?.status === 'pending') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Application Pending</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Your verification request is under review</h3>
            <p className="text-sm text-muted-foreground">
              We're reviewing your application for verification. You'll be notified once a decision is made.
            </p>
          </div>
          <div className="flex justify-center">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Show rejection cooldown
  if (existingApplication?.status === 'rejected' && rejectionCooldown > 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Application Cooldown</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-destructive">{rejectionCooldown}</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Try again in {rejectionCooldown} days</h3>
            <p className="text-sm text-muted-foreground">
              Your previous application was not approved. You can submit a new application after the cooldown period.
            </p>
          </div>
          <div className="flex justify-center">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Get Verified</DialogTitle>
        </DialogHeader>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Step {step} of 4</span>
            <span>{Math.round((step / 4) * 100)}%</span>
          </div>
          <Progress value={(step / 4) * 100} />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span className={step >= 1 ? 'text-primary' : ''}>Info</span>
            <span className={step >= 2 ? 'text-primary' : ''}>Products</span>
            <span className={step >= 3 ? 'text-primary' : ''}>2FA</span>
            <span className={step >= 4 ? 'text-primary' : ''}>Review</span>
          </div>
        </div>

        {/* Step Content */}
        <div className="min-h-[300px]">
          {step === 1 && (
            <Step1PersonalInfo formData={formData} updateFormData={updateFormData} />
          )}
          {step === 2 && (
            <Step2ProductTypes formData={formData} updateFormData={updateFormData} />
          )}
          {step === 3 && (
            <Step3TwoFactor
              userEmail={userEmail}
              mfaEnabled={mfaEnabled}
              onMfaEnabled={() => setMfaEnabled(true)}
              otpSent={otpSent}
              onOtpSent={() => setOtpSent(true)}
            />
          )}
          {step === 4 && (
            <Step4Review
              formData={formData}
              termsAccepted={termsAccepted}
              onTermsChange={setTermsAccepted}
            />
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 1}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {step < 4 ? (
            <Button onClick={handleNext} disabled={!canProceed()}>
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!canProceed() || submitting}>
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Application
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
