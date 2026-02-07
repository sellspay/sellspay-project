// AI Builder exports - Rebuilt 2026-02-07 (Stable Architecture)

// Main page component
export { SimpleVibecoderPage } from './SimpleVibecoderPage';

// Core components
export { SimplePreview } from './SimplePreview';
export { SimpleChat, type ChatMessage } from './SimpleChat';
export { SimpleSidebar } from './SimpleSidebar';

// Shared components (kept from old architecture)
export { ChatInputBar, AI_MODELS, type AIModel } from './ChatInputBar';
export { ProfileMenu } from './ProfileMenu';
export { PremiumGate } from './PremiumGate';
export { InsufficientCreditsCard, isCreditsError, parseCreditsError } from './InsufficientCreditsCard';

// Onboarding
export { AIBuilderOnboarding, useAIBuilderOnboarding } from './AIBuilderOnboarding';
export { AIBuilderLockedButton, AIBuilderInlineUpsell, AIBuilderBannerUpsell } from './AIBuilderUpsell';

// Layout patterns (for future use)
export { LAYOUT_PATTERNS, getPatternRegistrySummary } from './layoutPatterns';

// Style Profiles
export { 
  STYLE_PROFILES, 
  getStyleProfile, 
  getDefaultStyleProfile,
  injectStyleProfile,
  type StyleProfile 
} from '@/lib/vibecoder-style-profiles';

// Context Pruning Utilities
export {
  analyzePromptIntent,
  extractRelevantContext,
  createCodeSummary,
  formatProductsForContext,
  type ProductSummary,
} from '@/lib/vibecoder-context-pruning';
