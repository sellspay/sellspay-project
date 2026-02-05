import { useMemo } from 'react';
import { AiRenderer, convertLegacySectionsToBlocks } from './blocks';
import type { AILayout, AITheme } from './blocks';
import { Loader2 } from 'lucide-react';
 
interface AIBuilderPreviewProps {
  layout: {
    sections: any[];
    theme: Record<string, any>;
    header: Record<string, any>;
  };
  isEmpty: boolean;
  isBuilding?: boolean;
}
 
export function AIBuilderPreview({ layout, isEmpty, isBuilding }: AIBuilderPreviewProps) {
  // Convert legacy format to new AILayout format
  const aiLayout: AILayout = useMemo(() => {
    // If theme already has proper structure, use it; otherwise default
    const theme: AITheme = {
      mode: layout.theme?.mode || 'dark',
      accent: layout.theme?.accent || '262 83% 58%',
      radius: layout.theme?.radius ?? 16,
      spacing: layout.theme?.spacing || 'balanced',
      font: layout.theme?.font || 'inter',
    };

    // Convert sections to blocks
    const blocks = convertLegacySectionsToBlocks(layout.sections);

    return { theme, blocks };
  }, [layout]);
 
  // Check if there are actual blocks to render
  const hasBlocks = aiLayout.blocks.length > 0;
 
  // Show building state when AI is working (before blocks exist)
  if (isBuilding && !hasBlocks) {
    return <BuildingState />;
  }

  // Only show empty state when truly empty (no sections AND isEmpty flag)
  if (isEmpty && !hasBlocks) {
    return <EmptyCanvasState />;
  }

  return (
    <div className="h-full overflow-y-auto isolate">
      <AiRenderer layout={aiLayout} />
    </div>
  );
}

function BuildingState() {
  return (
    <div className="h-full flex items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <div className="relative">
          <div className="absolute inset-0 blur-3xl bg-primary/20 rounded-full scale-150" />
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-foreground">Building your storefront...</h3>
          <p className="text-sm text-muted-foreground">This usually takes a few seconds</p>
        </div>
      </div>
    </div>
  );
}

function EmptyCanvasState() {
  return (
    <div className="h-full flex items-center justify-center bg-background">
      <div className="text-center space-y-6 max-w-md px-8">
        {/* Decorative canvas */}
        <div className="relative mx-auto w-32 h-32">
          <div className="absolute inset-0 border-2 border-dashed border-border/50 rounded-3xl" />
          <div className="absolute inset-4 border border-dashed border-border/30 rounded-2xl" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center">
              <svg className="w-6 h-6 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground/60">
            Describe your vision in the chat to get started.
          </p>
        </div>
      </div>
    </div>
  );
}