import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

/**
 * VibeCoder Builder Agent (v3.0 - Atomic File Generator)
 * 
 * Role: Lead Frontend Engineer & Tailwind Master
 * Model: google/gemini-3-flash-preview (fast code generation)
 * 
 * KEY CHANGE: Now generates ONE FILE AT A TIME.
 * The Orchestrator calls this multiple times for multi-file builds.
 */

// ═══════════════════════════════════════════════════════════════
// DESIGN TOKEN RECIPES
// ═══════════════════════════════════════════════════════════════
const DESIGN_TOKENS: Record<string, string> = {
  'luxury-minimal': `
### LUXURY MINIMAL DESIGN TOKENS
- Background: bg-zinc-950 or bg-black
- Text Primary: text-zinc-100, Text Secondary: text-zinc-500
- Accent: text-amber-400, border-amber-500/30
- Typography: font-serif tracking-tight, generous spacing py-24`,

  'cyberpunk-neon': `
### CYBERPUNK NEON DESIGN TOKENS
- Background: bg-black, Primary Neon: text-cyan-400
- Glassmorphism: bg-black/40 backdrop-blur-xl border border-cyan-500/30
- Glow: shadow-[0_0_30px_rgba(6,182,212,0.5)]`,

  'streetwear-dark': `
### STREETWEAR DARK DESIGN TOKENS
- Background: bg-zinc-950, Text: text-white font-black
- Accent: text-red-500 or text-orange-500
- Cards: bg-zinc-900 border-2 border-zinc-800 rounded-none`,

  'kawaii-pop': `
### KAWAII POP DESIGN TOKENS
- Background: bg-gradient-to-br from-pink-100 to-purple-100
- Primary: text-pink-500, Cards: rounded-3xl shadow-xl
- Liberal use of emojis 🌸 ✨`,
};

// ═══════════════════════════════════════════════════════════════
// FILE-SPECIFIC TEMPLATES
// ═══════════════════════════════════════════════════════════════
const FILE_TEMPLATES: Record<string, string> = {
  'data/products.ts': `
### DATA FILE TEMPLATE (data/products.ts)
Export a typed array of products. Max 6 items. No React imports.

\`\`\`typescript
export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  description?: string;
}

export const PRODUCTS: Product[] = [
  {
    id: "prod_1",
    name: "Product Name",
    price: 29.99,
    image: "https://images.unsplash.com/photo-XXXXX?w=800",
  },
  // ... max 6 items
];
\`\`\``,

  'components/Hero.tsx': `
### HERO COMPONENT TEMPLATE (components/Hero.tsx)
Standalone hero component. Imports React hooks directly.

\`\`\`tsx
import React from 'react';
import { motion } from 'framer-motion';

interface HeroProps {
  title: string;
  subtitle?: string;
  onCTAClick?: () => void;
}

export function Hero({ title, subtitle, onCTAClick }: HeroProps) {
  return (
    <section className="min-h-screen flex items-center justify-center bg-zinc-950">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-6xl font-bold text-white">{title}</h1>
        {subtitle && <p className="text-zinc-400 mt-4">{subtitle}</p>}
        <button onClick={onCTAClick} className="mt-8 px-8 py-4 bg-white text-black rounded-lg">
          Shop Now
        </button>
      </motion.div>
    </section>
  );
}
\`\`\``,

  'components/ProductGrid.tsx': `
### PRODUCT GRID TEMPLATE (components/ProductGrid.tsx)
Imports Product type from data file. Uses useSellsPayCheckout.

\`\`\`tsx
import React from 'react';
import { motion } from 'framer-motion';
import type { Product } from '../data/products';

interface ProductGridProps {
  products: Product[];
  onBuy: (id: string) => void;
}

export function ProductGrid({ products, onBuy }: ProductGridProps) {
  return (
    <section className="py-20 px-6 bg-zinc-950">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {products.map((product) => (
          <motion.div 
            key={product.id}
            whileHover={{ scale: 1.02 }}
            className="bg-zinc-900 rounded-xl overflow-hidden"
          >
            <img src={product.image} alt={product.name} className="w-full h-48 object-cover" />
            <div className="p-6">
              <h3 className="text-xl font-bold text-white">{product.name}</h3>
              <p className="text-zinc-400">\${product.price}</p>
              <button 
                onClick={() => onBuy(product.id)}
                className="mt-4 w-full py-3 bg-white text-black rounded-lg"
              >
                Buy Now
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
\`\`\``,

  'App.tsx': `
### APP.TSX TEMPLATE (App.tsx)
Main orchestrator. Imports components and data. Max 40 lines.

\`\`\`tsx
import React from 'react';
import { useSellsPayCheckout } from './hooks/useSellsPayCheckout';
import { PRODUCTS } from './data/products';
import { Hero } from './components/Hero';
import { ProductGrid } from './components/ProductGrid';

export default function App() {
  const { buyProduct } = useSellsPayCheckout();

  const handleBuy = (productId: string) => {
    buyProduct(productId);
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <Hero 
        title="Creator Store" 
        subtitle="Premium digital products"
        onCTAClick={() => document.getElementById('products')?.scrollIntoView()}
      />
      <div id="products">
        <ProductGrid products={PRODUCTS} onBuy={handleBuy} />
      </div>
    </div>
  );
}
\`\`\``,
};

const BUILDER_SYSTEM_PROMPT = `You are the SellsPay Implementation Engineer.
You generate ONE FILE AT A TIME for a modular storefront.

## ═══════════════════════════════════════════════════════════════
## 🚨 ATOMIC FILE PROTOCOL (v3.0)
## ═══════════════════════════════════════════════════════════════

You are generating a SINGLE FILE from a multi-file build.
The file path and purpose will be provided in the request.

### STRICT RULES
1. **ONE FILE ONLY**: Output ONLY the requested file, nothing else
2. **80 LINE LIMIT**: Your output must be ≤80 lines (data files ≤30)
3. **COMPLETE CODE**: No fragments, no placeholders, no "// ..."
4. **CORRECT IMPORTS**: Each file imports what it needs

### FILE TYPE RULES

**data/*.ts files:**
- Export typed arrays/objects
- NO React imports
- Max 30 lines
- Use Unsplash images only

**components/*.tsx files:**
- Export a named function component
- Import React, motion, icons as needed
- Props interface at top
- Max 80 lines

**App.tsx:**
- Import useSellsPayCheckout from './hooks/useSellsPayCheckout'
- Import data from './data/*'
- Import components from './components/*'
- Max 40 lines
- MUST be export default function App()

### IMAGE PROTOCOL
ONLY use Unsplash: https://images.unsplash.com/photo-XXXXX?auto=format&fit=crop&w=800&q=80

### OUTPUT FORMAT
1. Start with the marker: \`/// BEGIN_FILE ///\`
2. Output ONLY the code (no markdown fences around the actual code)
3. End with: \`/// END_FILE ///\`

Example:
\`\`\`
/// BEGIN_FILE ///
import React from 'react';

export function Hero() {
  return <section>...</section>;
}
/// END_FILE ///
\`\`\`

### FORBIDDEN
- Markdown code fences inside the file content
- Fragment placeholders (// ...)
- Hooks outside component functions
- Direct payment logic (use useSellsPayCheckout)
- Files over 80 lines`;

interface BuilderRequest {
  prompt: string;
  architectPlan?: Record<string, unknown>;
  targetFile: {
    path: string;
    description: string;
    lineEstimate: number;
  };
  otherFiles?: Record<string, string>; // Already generated files for context
  styleProfile?: string;
  healingContext?: {
    errorType: string;
    errorMessage: string;
    failedCode: string;
    fixSuggestion?: string;
  };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      prompt, 
      architectPlan,
      targetFile,
      otherFiles,
      styleProfile,
      healingContext 
    } = await req.json() as BuilderRequest;

    if (!prompt || !targetFile) {
      return new Response(
        JSON.stringify({ error: "Missing prompt or targetFile" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build the system prompt with file-specific template
    let systemPrompt = BUILDER_SYSTEM_PROMPT;
    
    // Add file-specific template if available
    const fileKey = targetFile.path.includes('/') 
      ? targetFile.path 
      : targetFile.path;
    
    for (const [pattern, template] of Object.entries(FILE_TEMPLATES)) {
      if (targetFile.path.includes(pattern.replace('components/', '').replace('data/', '')) || 
          targetFile.path === pattern) {
        systemPrompt += `\n\n${template}`;
        break;
      }
    }
    
    // Inject design tokens
    if (styleProfile && DESIGN_TOKENS[styleProfile]) {
      systemPrompt += `\n\n${DESIGN_TOKENS[styleProfile]}`;
    } else if (architectPlan?.vibeAnalysis) {
      const style = String((architectPlan.vibeAnalysis as any)?.visualStyle || '').toLowerCase();
      for (const [key, tokens] of Object.entries(DESIGN_TOKENS)) {
        if (style.includes(key.split('-')[0])) {
          systemPrompt += `\n\n${tokens}`;
          break;
        }
      }
    }

    // Build user message
    let userMessage = `## Original User Request\n${prompt}\n`;
    
    userMessage += `\n## TARGET FILE TO GENERATE\n`;
    userMessage += `**Path:** ${targetFile.path}\n`;
    userMessage += `**Description:** ${targetFile.description}\n`;
    userMessage += `**Line Limit:** ${targetFile.lineEstimate} lines\n`;
    
    if (architectPlan?.vibeAnalysis) {
      userMessage += `\n## Design Direction\n`;
      userMessage += `Style: ${(architectPlan.vibeAnalysis as any)?.visualStyle || 'Custom'}\n`;
    }
    
    // Provide context of other files that have been generated
    if (otherFiles && Object.keys(otherFiles).length > 0) {
      userMessage += `\n## Already Generated Files (for import reference)\n`;
      for (const [path, content] of Object.entries(otherFiles)) {
        // Show just exports for context
        const exports = content.match(/export\s+(const|function|interface|type)\s+(\w+)/g) || [];
        if (exports.length > 0) {
          userMessage += `**${path}:** exports ${exports.join(', ')}\n`;
        }
      }
    }
    
    if (healingContext) {
      userMessage += `\n## 🚨 FIX REQUIRED\n`;
      userMessage += `**Error:** ${healingContext.errorMessage}\n`;
      userMessage += `**Fix:** ${healingContext.fixSuggestion || 'Fix the error and regenerate'}\n`;
      userMessage += `**Failed Code:**\n\`\`\`tsx\n${healingContext.failedCode}\n\`\`\`\n`;
    }

    userMessage += `\n## Instructions\n`;
    userMessage += `Generate ONLY the file "${targetFile.path}". `;
    userMessage += `Keep it under ${targetFile.lineEstimate} lines. `;
    userMessage += `Output complete, working code with /// BEGIN_FILE /// and /// END_FILE /// markers.`;

    const response = await fetch(LOVABLE_AI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: healingContext ? 0.2 : 0.4,
        max_tokens: 4000, // Smaller since we're generating one file
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Builder AI error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    // Stream the response back
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (error) {
    console.error("Builder agent error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
