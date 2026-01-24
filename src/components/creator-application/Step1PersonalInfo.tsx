import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import CountryCitySelect from '@/components/editor-application/CountryCitySelect';
import { CreatorApplicationFormData, LANGUAGE_OPTIONS } from './types';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ChevronDown, Check } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface Step1Props {
  formData: CreatorApplicationFormData;
  updateFormData: (updates: Partial<CreatorApplicationFormData>) => void;
}

export default function Step1PersonalInfo({ formData, updateFormData }: Step1Props) {
  const [languageOpen, setLanguageOpen] = useState(false);

  const toggleLanguage = (language: string) => {
    const current = formData.languages;
    if (current.includes(language)) {
      updateFormData({ languages: current.filter(l => l !== language) });
    } else {
      updateFormData({ languages: [...current, language] });
    }
  };

  const hasSocialLink = () => {
    const { instagram, youtube, twitter, tiktok } = formData.socialLinks;
    return !!(instagram || youtube || twitter || tiktok);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Personal Information</h3>
        <p className="text-sm text-muted-foreground">
          Tell us about yourself so we can verify your identity.
        </p>
      </div>

      {/* Full Name */}
      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name *</Label>
        <Input
          id="fullName"
          value={formData.fullName}
          onChange={(e) => updateFormData({ fullName: e.target.value })}
          placeholder="Enter your full name"
        />
      </div>

      {/* Country and State */}
      <CountryCitySelect
        country={formData.country}
        city={formData.state}
        onCountryChange={(country) => updateFormData({ country, state: '' })}
        onCityChange={(state) => updateFormData({ state })}
      />

      {/* Languages */}
      <div className="space-y-2">
        <Label>Languages *</Label>
        <Popover open={languageOpen} onOpenChange={setLanguageOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className="w-full justify-between font-normal h-auto min-h-10"
            >
              {formData.languages.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {formData.languages.map((lang) => (
                    <Badge key={lang} variant="secondary" className="text-xs">
                      {lang}
                    </Badge>
                  ))}
                </div>
              ) : (
                <span className="text-muted-foreground">Select languages...</span>
              )}
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <ScrollArea className="h-60">
              <div className="p-1">
                {LANGUAGE_OPTIONS.map((language) => (
                  <div
                    key={language}
                    className={cn(
                      'flex items-center gap-2 px-2 py-1.5 cursor-pointer rounded-sm text-sm hover:bg-accent',
                      formData.languages.includes(language) && 'bg-accent'
                    )}
                    onClick={() => toggleLanguage(language)}
                  >
                    {formData.languages.includes(language) && <Check className="h-4 w-4" />}
                    <span className={cn(!formData.languages.includes(language) && 'ml-6')}>
                      {language}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>
        {formData.languages.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {formData.languages.map((lang) => (
              <Badge key={lang} variant="outline" className="gap-1">
                {lang}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-destructive"
                  onClick={() => toggleLanguage(lang)}
                />
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Social Links */}
      <div className="space-y-3">
        <div>
          <Label>Social Links *</Label>
          <p className="text-xs text-muted-foreground mt-1">
            At least one social link is required for verification.
          </p>
        </div>
        
        <div className="grid gap-3">
          <div className="flex items-center gap-2">
            <div className="w-24 text-sm text-muted-foreground">Instagram</div>
            <Input
              value={formData.socialLinks.instagram}
              onChange={(e) => updateFormData({
                socialLinks: { ...formData.socialLinks, instagram: e.target.value }
              })}
              placeholder="https://instagram.com/username"
              className="flex-1"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <div className="w-24 text-sm text-muted-foreground">YouTube</div>
            <Input
              value={formData.socialLinks.youtube}
              onChange={(e) => updateFormData({
                socialLinks: { ...formData.socialLinks, youtube: e.target.value }
              })}
              placeholder="https://youtube.com/@channel"
              className="flex-1"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <div className="w-24 text-sm text-muted-foreground">Twitter/X</div>
            <Input
              value={formData.socialLinks.twitter}
              onChange={(e) => updateFormData({
                socialLinks: { ...formData.socialLinks, twitter: e.target.value }
              })}
              placeholder="https://twitter.com/username"
              className="flex-1"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <div className="w-24 text-sm text-muted-foreground">TikTok</div>
            <Input
              value={formData.socialLinks.tiktok}
              onChange={(e) => updateFormData({
                socialLinks: { ...formData.socialLinks, tiktok: e.target.value }
              })}
              placeholder="https://tiktok.com/@username"
              className="flex-1"
            />
          </div>
        </div>

        {!hasSocialLink() && (
          <p className="text-xs text-destructive">
            Please add at least one social link
          </p>
        )}
      </div>
    </div>
  );
}
