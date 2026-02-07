// Generated Asset type for Creative Studio
export interface GeneratedAsset {
  id: string;
  type: 'image' | 'video';
  url: string;
  prompt: string;
  modelId: string;
  createdAt: Date;
}

// Extended view mode for the AI Builder - 5 first-class tabs
export type ViewMode = 'preview' | 'code' | 'image' | 'video' | 'products';
