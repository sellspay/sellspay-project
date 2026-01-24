export interface CreatorApplicationFormData {
  fullName: string;
  country: string;
  state: string;
  languages: string[];
  socialLinks: {
    instagram: string;
    youtube: string;
    twitter: string;
    tiktok: string;
  };
  productTypes: string[];
}

export interface CreatorApplication {
  id: string;
  user_id: string;
  full_name: string;
  country: string;
  state: string;
  languages: string[];
  social_links: unknown;
  product_types: string[];
  status: string | null;
  created_at: string | null;
  updated_at?: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  profile?: {
    avatar_url: string | null;
    username: string | null;
    email: string | null;
  };
}

export const PRODUCT_TYPE_OPTIONS = [
  { value: 'digital_products', label: 'Digital Products' },
  { value: 'tutorials', label: 'Tutorials' },
  { value: 'courses', label: 'Courses' },
  { value: 'presets', label: 'Presets' },
  { value: 'templates', label: 'Templates' },
  { value: 'luts', label: 'LUTs' },
  { value: 'sound_effects', label: 'Sound Effects' },
  { value: 'music', label: 'Music' },
  { value: 'overlays', label: 'Overlays' },
  { value: 'fonts', label: 'Fonts' },
  { value: 'other', label: 'Other' },
];

export const LANGUAGE_OPTIONS = [
  'English',
  'Spanish',
  'French',
  'German',
  'Portuguese',
  'Italian',
  'Dutch',
  'Russian',
  'Japanese',
  'Korean',
  'Chinese',
  'Arabic',
  'Hindi',
  'Turkish',
  'Polish',
  'Swedish',
  'Norwegian',
  'Danish',
  'Finnish',
  'Other',
];
