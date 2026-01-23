import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ApplicationFormData } from './EditorApplicationDialog';

interface Step2Props {
  formData: ApplicationFormData;
  updateFormData: (updates: Partial<ApplicationFormData>) => void;
}

const LANGUAGES = [
  'English',
  'Spanish',
  'German',
  'French',
  'Italian',
  'Portuguese',
  'Arabic',
  'Hebrew',
  'Chinese',
  'Japanese',
  'Korean',
  'Russian',
  'Hindi',
  'Dutch',
  'Polish',
  'Turkish',
  'Vietnamese',
  'Thai',
  'Indonesian',
  'Swedish',
];

export default function Step2Rates({ formData, updateFormData }: Step2Props) {
  const toggleLanguage = (language: string) => {
    const current = formData.languages;
    if (current.includes(language)) {
      updateFormData({ languages: current.filter(l => l !== language) });
    } else {
      updateFormData({ languages: [...current, language] });
    }
  };

  return (
    <div className="space-y-6 py-4">
      {/* Hourly Rate */}
      <div className="space-y-2">
        <Label htmlFor="hourlyRate">Hourly Rate (USD) *</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
          <Input
            id="hourlyRate"
            type="number"
            min="1"
            step="1"
            placeholder="50"
            value={formData.hourlyRate || ''}
            onChange={(e) => updateFormData({ hourlyRate: parseInt(e.target.value) || 0 })}
            className="pl-8"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          This is what clients will pay per hour for your services
        </p>
      </div>

      {/* Starting Budget */}
      <div className="space-y-2">
        <Label htmlFor="startingBudget">Starting Budget (USD) - Optional</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
          <Input
            id="startingBudget"
            type="number"
            min="0"
            step="1"
            placeholder="100"
            value={formData.startingBudget || ''}
            onChange={(e) => updateFormData({ startingBudget: parseInt(e.target.value) || null })}
            className="pl-8"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Minimum budget for a project (optional)
        </p>
      </div>

      {/* Social Links */}
      <div className="space-y-4">
        <h3 className="font-medium">Social Links (Optional)</h3>
        
        <div className="space-y-2">
          <Label htmlFor="websiteLink">Portfolio / Website</Label>
          <Input
            id="websiteLink"
            type="url"
            placeholder="https://yourportfolio.com"
            value={formData.websiteLink}
            onChange={(e) => updateFormData({ websiteLink: e.target.value })}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="linkedinLink">LinkedIn Profile</Label>
          <Input
            id="linkedinLink"
            type="url"
            placeholder="https://linkedin.com/in/yourprofile"
            value={formData.linkedinLink}
            onChange={(e) => updateFormData({ linkedinLink: e.target.value })}
          />
        </div>
      </div>

      {/* Languages */}
      <div className="space-y-3">
        <Label>Languages You Speak *</Label>
        <p className="text-xs text-muted-foreground">
          Select all languages you can communicate in with clients
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {LANGUAGES.map((language) => (
            <div
              key={language}
              className="flex items-center space-x-2"
            >
              <Checkbox
                id={`lang-${language}`}
                checked={formData.languages.includes(language)}
                onCheckedChange={() => toggleLanguage(language)}
              />
              <label
                htmlFor={`lang-${language}`}
                className="text-sm cursor-pointer"
              >
                {language}
              </label>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {formData.languages.length} language(s) selected
        </p>
      </div>
    </div>
  );
}