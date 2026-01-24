import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { CreatorApplicationFormData, PRODUCT_TYPE_OPTIONS } from './types';
import { Check, MapPin, Languages, Link as LinkIcon, Package } from 'lucide-react';

interface Step4Props {
  formData: CreatorApplicationFormData;
  termsAccepted: boolean;
  onTermsChange: (accepted: boolean) => void;
}

export default function Step4Review({ formData, termsAccepted, onTermsChange }: Step4Props) {
  const getProductTypeLabel = (value: string) => {
    return PRODUCT_TYPE_OPTIONS.find(opt => opt.value === value)?.label || value;
  };

  const socialLinks = Object.entries(formData.socialLinks).filter(([_, value]) => value);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Review Your Application</h3>
        <p className="text-sm text-muted-foreground">
          Please review your information before submitting.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="space-y-4">
        {/* Personal Info */}
        <div className="p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Check className="w-4 h-4 text-primary" />
            </div>
            <h4 className="font-medium">Personal Information</h4>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-muted-foreground w-20">Name:</span>
              <span className="font-medium">{formData.fullName}</span>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
              <span>{formData.state}, {formData.country}</span>
            </div>
            <div className="flex items-start gap-2">
              <Languages className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div className="flex flex-wrap gap-1">
                {formData.languages.map((lang) => (
                  <Badge key={lang} variant="secondary" className="text-xs">
                    {lang}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <LinkIcon className="w-4 h-4 text-primary" />
            </div>
            <h4 className="font-medium">Social Links</h4>
          </div>
          <div className="space-y-2 text-sm">
            {socialLinks.map(([platform, url]) => (
              <div key={platform} className="flex items-center gap-2">
                <span className="text-muted-foreground capitalize w-20">{platform}:</span>
                <a 
                  href={url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline truncate max-w-[250px]"
                >
                  {url}
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Product Types */}
        <div className="p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Package className="w-4 h-4 text-primary" />
            </div>
            <h4 className="font-medium">Products to Sell</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.productTypes.map((type) => (
              <Badge key={type} variant="outline">
                {getProductTypeLabel(type)}
              </Badge>
            ))}
          </div>
        </div>

        {/* 2FA Status */}
        <div className="p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
              <Check className="w-4 h-4 text-green-500" />
            </div>
            <div>
              <h4 className="font-medium">Two-Factor Authentication</h4>
              <p className="text-sm text-green-500">Enabled</p>
            </div>
          </div>
        </div>
      </div>

      {/* Terms Checkbox */}
      <div className="p-4 rounded-lg border bg-secondary/20">
        <div className="flex items-start gap-3">
          <Checkbox
            id="terms"
            checked={termsAccepted}
            onCheckedChange={(checked) => onTermsChange(checked === true)}
            className="mt-0.5"
          />
          <div className="flex-1">
            <Label htmlFor="terms" className="text-sm cursor-pointer">
              I confirm that all information provided is accurate and I agree to the{' '}
              <a href="/terms" target="_blank" className="text-primary hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" target="_blank" className="text-primary hover:underline">
                Creator Guidelines
              </a>.
            </Label>
          </div>
        </div>
      </div>
    </div>
  );
}
