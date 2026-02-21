import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ApplicationFormData } from './EditorApplicationDialog';
import CountryCitySelect from './CountryCitySelect';

interface Step1Props {
  formData: ApplicationFormData;
  updateFormData: (updates: Partial<ApplicationFormData>) => void;
  avatarUrl: string | null;
}

export default function Step1PersonalInfo({ formData, updateFormData, avatarUrl }: Step1Props) {
  return (
    <div className="space-y-6 py-4">
      {/* Avatar Preview */}
      <div className="flex items-center gap-4">
        <Avatar className="w-20 h-20">
          <AvatarImage src={avatarUrl || undefined} />
          <AvatarFallback className="text-2xl bg-primary/20 text-primary">
            {formData.displayName?.charAt(0).toUpperCase() || '?'}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm text-muted-foreground">
            Your current profile picture will be used
          </p>
          <p className="text-xs text-muted-foreground">
            You can update it in your profile settings
          </p>
        </div>
      </div>

      {/* Display Name */}
      <div className="space-y-2">
        <Label htmlFor="displayName">Display Name *</Label>
        <Input
          id="displayName"
          placeholder="Your professional name"
          value={formData.displayName}
          onChange={(e) => updateFormData({ displayName: e.target.value })}
        />
      </div>

      {/* About Me */}
      <div className="space-y-2">
        <Label htmlFor="aboutMe">About Me *</Label>
        <Textarea
          id="aboutMe"
          placeholder="Tell potential clients about yourself, your experience, and what makes you stand out as a professional..."
          value={formData.aboutMe}
          onChange={(e) => updateFormData({ aboutMe: e.target.value })}
          rows={5}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground">
          {formData.aboutMe.length} / 500 characters (min 20)
        </p>
      </div>

      {/* Country & City */}
      <CountryCitySelect
        country={formData.country}
        city={formData.city}
        onCountryChange={(country) => updateFormData({ country, city: '' })}
        onCityChange={(city) => updateFormData({ city })}
      />
    </div>
  );
}