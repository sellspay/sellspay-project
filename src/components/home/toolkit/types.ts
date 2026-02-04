export type ToolType = 'sfx' | 'vocal' | 'manga' | 'video' | 'nano-banana';

export interface ToolConfig {
  id: ToolType;
  name: string;
  icon: React.ElementType;
  prompts: string[];
  accentColor: string;
  bgGradient: string;
}
