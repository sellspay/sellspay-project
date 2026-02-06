/**
 * VibeCoder Context Pruning Utilities
 * 
 * These utilities analyze user prompts and existing code to extract
 * only the RELEVANT portions for the AI. This dramatically reduces
 * context window usage and improves AI "IQ" by removing noise.
 */

/**
 * Keywords that indicate the user wants to modify specific sections
 */
const SECTION_KEYWORDS: Record<string, string[]> = {
  hero: ['hero', 'banner', 'header', 'headline', 'title', 'above the fold', 'landing'],
  products: ['product', 'products', 'grid', 'card', 'cards', 'listing', 'shop', 'store', 'items'],
  footer: ['footer', 'bottom', 'contact', 'social', 'links', 'copyright'],
  navigation: ['nav', 'navigation', 'menu', 'tabs', 'links', 'header'],
  about: ['about', 'bio', 'story', 'who', 'creator', 'artist'],
  testimonials: ['testimonial', 'review', 'reviews', 'feedback', 'quotes'],
  pricing: ['pricing', 'price', 'plans', 'subscription', 'tier'],
  gallery: ['gallery', 'portfolio', 'showcase', 'work', 'projects'],
  cta: ['cta', 'call to action', 'button', 'buy', 'purchase', 'checkout'],
};

/**
 * Keywords that indicate global changes (need full context)
 */
const GLOBAL_KEYWORDS = [
  'entire', 'whole', 'all', 'everything', 'complete', 'full',
  'rebuild', 'redesign', 'redo', 'from scratch', 'new',
  'theme', 'color scheme', 'style', 'vibe', 'aesthetic',
];

/**
 * Analyze a prompt to determine what sections are relevant
 */
export function analyzePromptIntent(prompt: string): {
  isGlobalChange: boolean;
  relevantSections: string[];
  confidence: number;
} {
  const lowerPrompt = prompt.toLowerCase();
  
  // Check for global change indicators
  const isGlobalChange = GLOBAL_KEYWORDS.some(keyword => 
    lowerPrompt.includes(keyword)
  );
  
  if (isGlobalChange) {
    return {
      isGlobalChange: true,
      relevantSections: [],
      confidence: 0.9,
    };
  }
  
  // Find which sections are mentioned
  const relevantSections: string[] = [];
  let matchCount = 0;
  
  for (const [section, keywords] of Object.entries(SECTION_KEYWORDS)) {
    const hasMatch = keywords.some(keyword => lowerPrompt.includes(keyword));
    if (hasMatch) {
      relevantSections.push(section);
      matchCount++;
    }
  }
  
  // If no specific sections found, assume it's a general change
  if (relevantSections.length === 0) {
    return {
      isGlobalChange: true,
      relevantSections: [],
      confidence: 0.5,
    };
  }
  
  return {
    isGlobalChange: false,
    relevantSections,
    confidence: Math.min(0.95, 0.6 + (matchCount * 0.1)),
  };
}

/**
 * Extract relevant code sections based on intent analysis
 */
export function extractRelevantContext(
  fullCode: string,
  relevantSections: string[]
): string {
  if (relevantSections.length === 0) {
    return fullCode;
  }
  
  const lines = fullCode.split('\n');
  const relevantLines: string[] = [];
  
  // Always include imports
  let inImports = true;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (inImports && (line.startsWith('import ') || line.trim() === '')) {
      relevantLines.push(line);
    } else {
      inImports = false;
      break;
    }
  }
  
  // Find and extract relevant sections
  // This is a simplified heuristic - looks for comments or component patterns
  let inRelevantSection = false;
  let braceCount = 0;
  let sectionBuffer: string[] = [];
  
  for (let i = relevantLines.length; i < lines.length; i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();
    
    // Check if entering a relevant section
    const startsRelevantSection = relevantSections.some(section => {
      const sectionPatterns = [
        `{/* ${section}`,
        `// ${section}`,
        `<${section}`,
        `const ${section}`,
        `function ${section}`,
      ];
      return sectionPatterns.some(pattern => 
        lowerLine.includes(pattern.toLowerCase())
      );
    });
    
    if (startsRelevantSection && !inRelevantSection) {
      inRelevantSection = true;
      braceCount = 0;
      sectionBuffer = [];
    }
    
    if (inRelevantSection) {
      sectionBuffer.push(line);
      
      // Count braces to find section end
      braceCount += (line.match(/{/g) || []).length;
      braceCount -= (line.match(/}/g) || []).length;
      
      // Section ends when braces balance and we see a closing tag or new section
      if (braceCount <= 0 && sectionBuffer.length > 2) {
        relevantLines.push(...sectionBuffer);
        relevantLines.push('');
        relevantLines.push('// ... other sections ...');
        relevantLines.push('');
        inRelevantSection = false;
        sectionBuffer = [];
      }
    }
  }
  
  // If we didn't find specific sections, include the return statement structure
  if (relevantLines.length < 20) {
    // Fall back to including more context
    return fullCode;
  }
  
  // Always include the export statement
  const exportMatch = fullCode.match(/export default function \w+\(\)/);
  if (exportMatch && !relevantLines.some(l => l.includes('export default'))) {
    relevantLines.push(exportMatch[0] + ' {');
    relevantLines.push('  // ... component logic ...');
  }
  
  return relevantLines.join('\n');
}

/**
 * Create a code summary for the Architect agent
 * (Much more condensed than full code)
 */
export function createCodeSummary(fullCode: string): string {
  const lines = fullCode.split('\n');
  const summary: string[] = [];
  
  // Count sections
  const sectionCounts: Record<string, number> = {};
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    for (const section of Object.keys(SECTION_KEYWORDS)) {
      if (lowerLine.includes(section) || lowerLine.includes(`{/* ${section}`)) {
        sectionCounts[section] = (sectionCounts[section] || 0) + 1;
      }
    }
  }
  
  summary.push(`Lines: ${lines.length}`);
  summary.push(`Sections detected: ${Object.keys(sectionCounts).join(', ') || 'unknown'}`);
  
  // Extract color classes used
  const colorMatches = fullCode.match(/(?:bg|text|border)-(?:zinc|violet|blue|red|green|pink|cyan|amber|orange|purple)-\d{2,3}/g);
  if (colorMatches) {
    const uniqueColors = [...new Set(colorMatches)].slice(0, 10);
    summary.push(`Colors: ${uniqueColors.join(', ')}`);
  }
  
  // Check for key patterns
  if (fullCode.includes('useSellsPayCheckout')) {
    summary.push('✓ SellsPay checkout integrated');
  }
  
  if (fullCode.includes('framer-motion') || fullCode.includes('motion.')) {
    summary.push('✓ Framer Motion animations');
  }
  
  if (fullCode.includes('useState')) {
    const stateCount = (fullCode.match(/useState/g) || []).length;
    summary.push(`State hooks: ${stateCount}`);
  }
  
  return summary.join('\n');
}

/**
 * Prepare product data for AI context
 * (Condensed format to save tokens)
 */
export interface ProductSummary {
  id: string;
  name: string;
  price: string;
  tags?: string[];
}

export function formatProductsForContext(products: ProductSummary[]): string {
  if (products.length === 0) return '';
  
  const formatted = products.slice(0, 10).map(p => 
    `- ${p.name} ($${p.price})${p.tags?.length ? ` [${p.tags.join(', ')}]` : ''}`
  );
  
  if (products.length > 10) {
    formatted.push(`... and ${products.length - 10} more products`);
  }
  
  return formatted.join('\n');
}
