export type ToolType = 'sfx' | 'vocal' | 'manga' | 'video';

export interface ToolConfig {
  id: ToolType;
  name: string;
  icon: React.ElementType;
  prompts: string[];
  accentColor: string;
  bgGradient: string;
}
