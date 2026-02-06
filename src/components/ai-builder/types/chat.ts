// =====================================================
// AI BUILDER CHAT TYPES
// =====================================================

export interface BuildStep {
  id: string;
  type: 'plan' | 'create_file' | 'update_code' | 'install_package' | 'analyze' | 'finish';
  status: 'pending' | 'running' | 'completed';
  label: string; // e.g., "Creating Hero.tsx"
  details?: string; // The specific code or diff (hidden in accordion)
  fileName?: string; // For file-related steps
}

// Live build state for real-time transparency during streaming
export interface LiveBuildState {
  logs: string[];
  startedAt: Date;
}

export interface EnhancedMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string; // The main explanation text
  code_snapshot?: string;
  steps?: BuildStep[]; // The technical breakdown
  timestamp: string;
  rating?: -1 | 0 | 1;
}

// Parser to extract steps from raw AI stream
export function parseStreamForSteps(rawText: string): { content: string; steps: BuildStep[] } {
  const steps: BuildStep[] = [];
  let cleanContent = rawText;

  // Regex to extract <STEP> tags
  // Format: <STEP title='Creating Nav' type='create_file'>code here</STEP>
  const stepMatches = rawText.matchAll(/<STEP\s+title='([^']*)'(?:\s+type='([^']*)')?>([\s\S]*?)<\/STEP>/g);
  
  for (const match of stepMatches) {
    const [fullMatch, title, type, details] = match;
    steps.push({
      id: crypto.randomUUID(),
      type: (type as BuildStep['type']) || 'update_code',
      status: 'completed',
      label: title,
      details: details?.trim() || undefined,
    });
    // Remove the technical tag from the main display text
    cleanContent = cleanContent.replace(fullMatch, "");
  }
  
  // Clean up any extra whitespace
  cleanContent = cleanContent.replace(/\n{3,}/g, '\n\n').trim();
  
  return { content: cleanContent, steps };
}

// Generate default steps for code generation (when no explicit steps in stream)
export function generateDefaultSteps(hasCode: boolean, content: string): BuildStep[] {
  if (!hasCode) return [];
  
  const steps: BuildStep[] = [
    {
      id: crypto.randomUUID(),
      type: 'analyze',
      status: 'completed',
      label: 'Analyzed your request',
    },
    {
      id: crypto.randomUUID(),
      type: 'plan',
      status: 'completed',
      label: 'Created design plan',
    },
  ];

  // Infer what was created based on content
  if (content.toLowerCase().includes('hero') || content.toLowerCase().includes('header')) {
    steps.push({
      id: crypto.randomUUID(),
      type: 'create_file',
      status: 'completed',
      label: 'Generated Hero section',
      fileName: 'Hero.tsx',
    });
  }
  
  if (content.toLowerCase().includes('layout') || content.toLowerCase().includes('storefront')) {
    steps.push({
      id: crypto.randomUUID(),
      type: 'update_code',
      status: 'completed',
      label: 'Updated page layout',
      fileName: 'App.tsx',
    });
  }

  steps.push({
    id: crypto.randomUUID(),
    type: 'finish',
    status: 'completed',
    label: 'Applied changes to preview',
  });

  return steps;
}
