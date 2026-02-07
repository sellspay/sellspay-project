export { AIBuilderCanvas } from './AIBuilderCanvas';
export { PremiumGate } from './PremiumGate';
export { AIBuilderOnboarding, useAIBuilderOnboarding } from './AIBuilderOnboarding';
export { AIBuilderLockedButton, AIBuilderInlineUpsell, AIBuilderBannerUpsell } from './AIBuilderUpsell';
export { LAYOUT_PATTERNS, getPatternRegistrySummary } from './layoutPatterns';

// Vibecoder (Generative Runtime) exports
export { VibecoderPreview } from './VibecoderPreview';
export { VibecoderChat } from './VibecoderChat';
export { CanvasToolbar } from './CanvasToolbar';
export { useStreamingCode } from './useStreamingCode';
export { useOrchestratorStream } from './useOrchestratorStream';
export { ProjectSidebar } from './ProjectSidebar';
export { VibecoderMessageBubble } from './VibecoderMessageBubble';
export { useVibecoderProjects } from './hooks/useVibecoderProjects';

// Agent UI exports (VibeCoder 2.0)
export { AgentProgress } from './AgentProgress';
export type { AgentStep } from './AgentProgress';
export { LiveThought } from './LiveThought';
export { DeleteConfirmationModal } from './DeleteConfirmationModal';

// Creative Studio exports
export { GenerationCanvas } from './GenerationCanvas';
export { PlacementPromptModal } from './PlacementPromptModal';
export type { GeneratedAsset, ViewMode } from './types/generation';

// Chat UI components
export { ChatInputBar } from './ChatInputBar';
export { PlanApprovalCard } from './PlanApprovalCard';
export { ProfileMenu } from './ProfileMenu';
export { PageNavigator } from './PageNavigator';

// Style Profiles (VibeCoder 2.0)
export { 
  STYLE_PROFILES, 
  getStyleProfile, 
  getDefaultStyleProfile,
  injectStyleProfile,
  type StyleProfile 
} from '@/lib/vibecoder-style-profiles';

// Context Pruning Utilities (VibeCoder 2.0)
export {
  analyzePromptIntent,
  extractRelevantContext,
  createCodeSummary,
  formatProductsForContext,
  type ProductSummary,
} from '@/lib/vibecoder-context-pruning';
