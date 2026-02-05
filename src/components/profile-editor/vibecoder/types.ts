 // =====================================================
 // AI STOREFRONT VIBECODER TYPES
 // =====================================================
 
 import { ProfileSection, SectionType } from '../types';
 
 // === PATCH OPERATIONS ===
 
 export interface AddSectionOp {
   op: 'addSection';
   after: string | null; // section ID or null for top
   section: Partial<ProfileSection>;
 }
 
 export interface RemoveSectionOp {
   op: 'removeSection';
   sectionId: string;
 }
 
 export interface MoveSectionOp {
   op: 'moveSection';
   sectionId: string;
   after: string | null;
 }
 
 export interface UpdateSectionOp {
   op: 'updateSection';
   sectionId: string;
   patch: Record<string, unknown>;
 }
 
 export interface UpdateThemeOp {
   op: 'updateTheme';
   path: string;
   value: unknown;
 }
 
 export interface UpdateHeaderContentOp {
   op: 'updateHeaderContent';
   patch: {
     bannerAssetId?: string | null;
     avatarAssetId?: string | null;
     displayName?: string;
     bio?: string;
     links?: { label: string; url: string }[];
   };
 }
 
 export interface AssignAssetToSlotOp {
   op: 'assignAssetToSlot';
   slot: 'header.banner' | 'header.avatar' | 'section.image' | 'section.bg' | 'product.thumbnail';
   assetId: string;
   targetId: string;
 }
 
 export type VibecoderOp =
   | AddSectionOp
   | RemoveSectionOp
   | MoveSectionOp
   | UpdateSectionOp
   | UpdateThemeOp
   | UpdateHeaderContentOp
   | AssignAssetToSlotOp;
 
 // === ASSET REQUESTS ===
 
 export interface AssetRequest {
   kind: 'image' | 'icon_set' | 'video_loop';
   count: number; // 1-8
   spec: {
     purpose: string;
     style: string;
     palette?: string[];
     aspect?: string;
     negative?: string;
   };
 }
 
 // === AI RESPONSE ===
 
 export interface VibecoderResponse {
   message: string;
   ops: VibecoderOp[];
   asset_requests?: AssetRequest[];
   preview_notes?: string[];
 }
 
 // === CHAT MESSAGES ===
 
 export interface ChatMessage {
   id: string;
   role: 'user' | 'assistant';
   content: string;
   operations?: VibecoderOp[];
   asset_requests?: AssetRequest[];
   timestamp: Date;
   status?: 'pending' | 'applied' | 'discarded';
 }
 
 // === BRAND PROFILE ===
 
 export interface BrandProfile {
   id: string;
   profileId: string;
   colorPalette: string[];
   vibeTags: string[];
   fontPreference: string;
   referenceImages: string[];
 }
 
 // === GENERATED ASSET ===
 
 export interface GeneratedAsset {
   id: string;
   profileId: string;
   url: string;
   type: 'banner' | 'thumbnail' | 'background' | 'promo';
   prompt: string;
   spec?: AssetRequest['spec'];
   status: 'draft' | 'applied' | 'discarded';
   createdAt: Date;
 }
 
 // === VALIDATION ===
 
 export interface ValidationResult {
   valid: boolean;
   errors: string[];
 }
 
 // === QUICK ACTIONS ===
 
 export const QUICK_ACTIONS = [
   { id: 'premium', label: 'Make it look premium', prompt: 'Make my storefront look more premium and minimal with better spacing and typography.' },
   { id: 'bio', label: 'Rewrite my bio', prompt: 'Rewrite my bio to sound more professional and engaging.' },
   { id: 'hero', label: 'Add a hero section', prompt: 'Add a visually striking hero section at the top of my storefront.' },
   { id: 'bento', label: 'Add a bento grid', prompt: 'Add a modern bento grid layout to showcase my best products.' },
   { id: 'spacing', label: 'Improve spacing', prompt: 'Improve the spacing and visual rhythm of my storefront sections.' },
   { id: 'banner', label: 'Generate a banner', prompt: 'Generate a professional banner image that matches my brand style.' },
   { id: 'thumbnails', label: 'Generate matching thumbnails', prompt: 'Generate matching thumbnails for my products that have a cohesive style.' },
 ] as const;
 
 // === SUPPORTED SECTION TYPES FOR AI ===
 
 export const SUPPORTED_SECTION_TYPES: SectionType[] = [
   'text',
   'image',
   'image_with_text',
   'gallery',
   'video',
   'collection',
   'about_me',
   'headline',
   'sliding_banner',
   'divider',
   'testimonials',
   'faq',
   'newsletter',
   'slideshow',
   'basic_list',
   'featured_product',
   'logo_list',
   'contact_us',
   'footer',
   'card_slideshow',
   'banner_slideshow',
 ];
 
 // === CREDIT COSTS ===
 
 export const CREDIT_COSTS = {
   text_layout: 0, // Free
   banner_image: 3,
   thumbnail: 1,
   icon_set: 4,
   video_loop: 15,
 } as const;