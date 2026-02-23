import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { AIModel } from '../ChatInputBar';
import type { GeneratedAsset, ViewMode } from '../types/generation';

interface UseCreativeStudioOptions {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  handleSendMessage: (message: string) => void;
  setShowPlacementModal: (show: boolean) => void;
}

export function useCreativeStudio({
  viewMode,
  setViewMode,
  handleSendMessage,
  setShowPlacementModal,
}: UseCreativeStudioOptions) {
  const [currentImageAsset, setCurrentImageAsset] = useState<GeneratedAsset | null>(null);
  const [currentVideoAsset, setCurrentVideoAsset] = useState<GeneratedAsset | null>(null);
  const [isImageGenerating, setIsImageGenerating] = useState(false);
  const [isVideoGenerating, setIsVideoGenerating] = useState(false);
  const [lastAssetPrompt, setLastAssetPrompt] = useState<string>('');
  const [lastAssetModel, setLastAssetModel] = useState<AIModel | null>(null);

  const handleGenerateAsset = useCallback(async (model: AIModel, prompt: string) => {
    const isVideoModel = model.category === 'video';
    
    setViewMode(isVideoModel ? 'video' : 'image');
    
    if (isVideoModel) {
      setIsVideoGenerating(true);
      setCurrentVideoAsset(null);
    } else {
      setIsImageGenerating(true);
      setCurrentImageAsset(null);
    }
    
    setLastAssetPrompt(prompt);
    setLastAssetModel(model);

    try {
      const { data, error } = await supabase.functions.invoke('storefront-generate-asset', {
        body: { 
          prompt, 
          modelId: model.id,
          type: isVideoModel ? 'video' : 'image',
        },
      });

      if (error) throw error;

      const newAsset: GeneratedAsset = {
        id: crypto.randomUUID(),
        type: isVideoModel ? 'video' : 'image',
        url: data.url || data.imageUrl,
        prompt,
        modelId: model.id,
        createdAt: new Date(),
      };

      if (isVideoModel) {
        setCurrentVideoAsset(newAsset);
      } else {
        setCurrentImageAsset(newAsset);
      }
    } catch (error) {
      console.error('Asset generation failed:', error);
      toast.error('Failed to generate asset. Please try again.');
    } finally {
      if (isVideoModel) {
        setIsVideoGenerating(false);
      } else {
        setIsImageGenerating(false);
      }
    }
  }, [setViewMode]);

  const handleRetryAsset = useCallback(() => {
    if (lastAssetModel && lastAssetPrompt) {
      handleGenerateAsset(lastAssetModel, lastAssetPrompt);
    }
  }, [lastAssetModel, lastAssetPrompt, handleGenerateAsset]);

  const currentAsset = viewMode === 'video' ? currentVideoAsset : currentImageAsset;
  const isCurrentlyGenerating = viewMode === 'video' ? isVideoGenerating : isImageGenerating;

  const handleApplyAssetToCanvas = useCallback((instructions: string) => {
    const assetToApply = viewMode === 'video' ? currentVideoAsset : currentImageAsset;
    if (!assetToApply) return;

    setShowPlacementModal(false);
    setViewMode('preview');

    const injectionPrompt = `
[ASSET_INJECTION_REQUEST]
Asset Type: ${assetToApply.type}
Asset URL: ${assetToApply.url}
User Instructions: ${instructions}

TASK: Modify the existing storefront code to place this ${assetToApply.type} asset as specified by the user. 
- Use an <img> tag for images or <video> tag for videos
- Apply appropriate styling (object-fit, width, height) based on the placement
- Ensure the asset is responsive and fits the design
`;

    handleSendMessage(injectionPrompt);
    
    if (viewMode === 'video') {
      setCurrentVideoAsset(null);
    } else {
      setCurrentImageAsset(null);
    }
  }, [viewMode, currentVideoAsset, currentImageAsset, handleSendMessage, setShowPlacementModal, setViewMode]);

  const handleAssetFeedback = useCallback((rating: 'positive' | 'negative') => {
    const activeAsset = viewMode === 'video' ? currentVideoAsset : currentImageAsset;
    console.log('Asset feedback:', rating, activeAsset?.id);
    toast.success(rating === 'positive' ? 'Thanks for the feedback!' : 'Noted! Try regenerating.');
  }, [viewMode, currentVideoAsset, currentImageAsset]);

  // Used by project reset/delete to clear assets
  const clearAssets = useCallback(() => {
    setCurrentImageAsset(null);
    setCurrentVideoAsset(null);
  }, []);

  return {
    currentImageAsset,
    currentVideoAsset,
    isImageGenerating,
    isVideoGenerating,
    currentAsset,
    isCurrentlyGenerating,
    handleGenerateAsset,
    handleRetryAsset,
    handleApplyAssetToCanvas,
    handleAssetFeedback,
    clearAssets,
  };
}
