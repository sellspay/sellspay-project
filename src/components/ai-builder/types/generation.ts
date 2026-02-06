// Generated Asset type for Creative Studio
export interface GeneratedAsset {
  id: string;
  type: 'image' | 'video';
  url: string;
  prompt: string;
  modelId: string;
  createdAt: Date;
}

// Extended view mode for the AI Builder
export type ViewMode = 'preview' | 'code' | 'generation';
