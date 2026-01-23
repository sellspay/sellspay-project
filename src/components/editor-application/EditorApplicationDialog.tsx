import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import Step1PersonalInfo from './Step1PersonalInfo';
import Step2Rates from './Step2Rates';
import Step3Services from './Step3Services';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

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

export default function EditorApplicationDialog({ open, onOpenChange }: EditorApplicationDialogProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<ApplicationFormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Fetch avatar on open
  useState(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('avatar_url, full_name')
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setAvatarUrl(data.avatar_url);
            if (data.full_name && !formData.displayName) {
              setFormData(prev => ({ ...prev, displayName: data.full_name || '' }));
            }
          }
        });
    }
  });

  const updateFormData = (updates: Partial<ApplicationFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const canProceedStep1 = formData.displayName && formData.aboutMe && formData.country && formData.city;
  const canProceedStep2 = formData.hourlyRate > 0 && formData.languages.length > 0;
  const canSubmit = formData.services.length > 0;

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
          toast.error('You are already an approved editor');
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
          <DialogTitle className="text-2xl">Apply as an Editor</DialogTitle>
        </DialogHeader>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Step {step} of 3</span>
            <span>{step === 1 ? 'Personal Info' : step === 2 ? 'Rates & Languages' : 'Services'}</span>
          </div>
          <Progress value={(step / 3) * 100} className="h-2" />
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

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => step > 1 ? setStep(step - 1) : handleClose()}
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </Button>
          
          {step < 3 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={step === 1 ? !canProceedStep1 : !canProceedStep2}
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
      </DialogContent>
    </Dialog>
  );
}