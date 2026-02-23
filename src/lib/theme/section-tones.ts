/**
 * Section Tone System
 * Per-section semantic design shifts — hero ≠ features ≠ pricing ≠ footer.
 */

export type SectionTone = 'default' | 'elevated' | 'inverted' | 'accented';

export type SectionRole = 'hero' | 'features' | 'pricing' | 'cta' | 'footer' | 'testimonials' | 'faq' | 'content';

/** Default section → tone mapping */
export const SECTION_TONE_MAP: Record<SectionRole, SectionTone> = {
  hero: 'inverted',
  features: 'default',
  pricing: 'elevated',
  cta: 'accented',
  footer: 'elevated',
  testimonials: 'elevated',
  faq: 'default',
  content: 'default',
};

/** Get the CSS class for a section tone */
export function getSectionToneClass(tone: SectionTone): string {
  return `section-${tone}`;
}

/** Auto-assign tone based on section role */
export function toneForSection(role: SectionRole): SectionTone {
  return SECTION_TONE_MAP[role];
}
