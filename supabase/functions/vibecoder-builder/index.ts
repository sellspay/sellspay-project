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
// PREMIUM DESIGN TOKEN RECIPES (v3.1 - High-End Mandatory)
// ═══════════════════════════════════════════════════════════════
const DESIGN_TOKENS: Record<string, string> = {
  'luxury-minimal': `
### 💎 LUXURY MINIMAL DESIGN TOKENS (PREMIUM TIER)
**MANDATORY ELEMENTS:**
- Background: bg-gradient-to-b from-zinc-950 via-black to-zinc-950
- Hero: min-h-screen with bg-[radial-gradient(ellipse_at_top,rgba(251,191,36,0.1),transparent_50%)]
- Typography: text-7xl md:text-9xl font-serif tracking-tighter leading-none
- Text Shimmer: bg-clip-text text-transparent bg-gradient-to-r from-amber-200 via-white to-amber-200
- Glassmorphism: bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl
- Shadows: shadow-[0_20px_60px_-15px_rgba(251,191,36,0.3)]
- Animations: framer-motion staggerChildren={0.1}, whileInView with viewport once
- Hover States: group-hover:scale-105 transition-all duration-500 ease-out
- Spacing: py-32 px-6, section gaps of gap-24
- Product Cards: aspect-[3/4] with overflow-hidden, image scale on hover`,

  'cyberpunk-neon': `
### ⚡ CYBERPUNK NEON DESIGN TOKENS (PREMIUM TIER)
**MANDATORY ELEMENTS:**
- Background: bg-black with CSS grid overlay (repeating-linear-gradient)
- Hero Glow: absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-transparent to-fuchsia-500/20 blur-3xl
- Typography: font-mono uppercase tracking-[0.3em] text-5xl md:text-7xl
- Neon Text: text-cyan-400 drop-shadow-[0_0_20px_rgba(6,182,212,0.8)]
- Glassmorphism: bg-cyan-950/30 backdrop-blur-xl border border-cyan-500/40 rounded-xl
- Animated Borders: animate-pulse border-cyan-400 or gradient border with bg-gradient-to-r
- Scanline Effect: before:absolute before:inset-0 before:bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.3)_2px,rgba(0,0,0,0.3)_4px)]
- Glow Shadows: shadow-[0_0_40px_rgba(6,182,212,0.5),inset_0_0_20px_rgba(6,182,212,0.1)]
- Animations: motion variants with glitch effects, pulsing elements`,

  'streetwear-dark': `
### 🔥 STREETWEAR DARK DESIGN TOKENS (PREMIUM TIER)
**MANDATORY ELEMENTS:**
- Background: bg-zinc-950 with subtle noise texture overlay
- Hero: Asymmetric layout with overlapping elements, broken grid
- Typography: text-8xl md:text-[12rem] font-black uppercase tracking-tighter -rotate-2
- Accent Slashes: bg-red-500 h-1 w-32 or diagonal stripes
- Cards: bg-zinc-900 border-l-4 border-red-500 hover:translate-x-2 transition-transform
- Raw Aesthetic: Mix of serif and heavy sans, intentional visual tension
- Hover: Dramatic scale (hover:scale-110) with fast duration-200
- Editorial Layout: Overlapping z-index layers, negative margins
- Product Display: Full-bleed images with text overlays`,

  'kawaii-pop': `
### 🌸 KAWAII POP DESIGN TOKENS (PREMIUM TIER)
**MANDATORY ELEMENTS:**
- Background: bg-gradient-to-br from-pink-100 via-purple-50 to-blue-100
- Floating Elements: Animated decorative shapes (circles, stars) with motion.div animate={{ y: [0, -10, 0] }}
- Typography: text-5xl md:text-7xl font-bold with text-pink-600, playful letter-spacing
- Cards: rounded-[2rem] bg-white shadow-[0_20px_50px_-10px_rgba(236,72,153,0.3)] hover:shadow-pink-300/50
- Borders: border-4 border-pink-300 with hover:border-pink-400
- Emoji Accents: Strategic use of ✨ 🌸 💖 as decorative elements
- Bouncy Animations: motion spring with stiffness: 300, damping: 20
- Pastel Gradients: bg-gradient-to-r from-pink-400 to-purple-400 on buttons
- Soft Shadows: shadow-xl shadow-pink-200/50`,
};

// ═══════════════════════════════════════════════════════════════
// PREMIUM FILE TEMPLATES (v3.1 - High-End Examples)
// ═══════════════════════════════════════════════════════════════
const FILE_TEMPLATES: Record<string, string> = {
  'data/products.ts': `
### DATA FILE TEMPLATE (data/products.ts)
Export a typed array of products. Max 6 items. No React imports.
Use HIGH-QUALITY Unsplash images with proper dimensions.

\`\`\`typescript
export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  description?: string;
  tag?: string;
}

export const PRODUCTS: Product[] = [
  {
    id: "prod_1",
    name: "Product Name",
    price: 29.99,
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80",
    tag: "NEW"
  },
  // ... max 6 items with varied, high-quality images
];
\`\`\``,

  'components/Hero.tsx': `
### PREMIUM HERO COMPONENT TEMPLATE (components/Hero.tsx)
Full-screen hero with MANDATORY premium elements:
- Gradient background with glow overlay
- Large typography (text-7xl+) with shimmer
- Smooth scroll CTA button
- Motion animations

\`\`\`tsx
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowDown } from 'lucide-react';

interface HeroProps {
  title: string;
  subtitle?: string;
}

export function Hero({ title, subtitle }: HeroProps) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-zinc-950 via-black to-zinc-950">
      {/* Ambient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(251,191,36,0.15),transparent_50%)]" />
      
      <div className="relative z-10 text-center px-6">
        <motion.h1 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-6xl md:text-8xl lg:text-9xl font-serif tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-amber-200 via-white to-amber-200"
        >
          {title}
        </motion.h1>
        {subtitle && (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="mt-6 text-lg md:text-xl text-zinc-400 max-w-xl mx-auto"
          >
            {subtitle}
          </motion.p>
        )}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
          className="mt-12 inline-flex items-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white hover:bg-white/20 transition-all duration-300"
        >
          Explore <ArrowDown className="w-4 h-4 animate-bounce" />
        </motion.button>
      </div>
    </section>
  );
}
\`\`\``,

  'components/ProductGrid.tsx': `
### PREMIUM PRODUCT GRID TEMPLATE (components/ProductGrid.tsx)
Glassmorphism cards with hover effects and stagger animations.

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
    <section id="products" className="py-32 px-6 bg-zinc-950">
      <div className="max-w-7xl mx-auto">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl font-serif text-white mb-16 text-center"
        >
          Featured Collection
        </motion.h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product, i) => (
            <motion.div 
              key={product.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:border-amber-500/30 transition-all duration-500"
            >
              <div className="aspect-[3/4] overflow-hidden">
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
              </div>
              {product.tag && (
                <span className="absolute top-4 left-4 px-3 py-1 bg-amber-500 text-black text-xs font-bold rounded-full">
                  {product.tag}
                </span>
              )}
              <div className="p-6">
                <h3 className="text-xl font-medium text-white">{product.name}</h3>
                <p className="text-amber-400 font-bold mt-1">\${product.price}</p>
                <button 
                  onClick={() => onBuy(product.id)}
                  className="mt-4 w-full py-3 bg-white text-black font-medium rounded-xl hover:bg-amber-400 transition-colors duration-300"
                >
                  Add to Cart
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
\`\`\``,

  'App.tsx': `
### APP.TSX TEMPLATE (App.tsx)
Main orchestrator with AnimatePresence. Max 40 lines.

\`\`\`tsx
import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { useSellsPayCheckout } from './hooks/useSellsPayCheckout';
import { PRODUCTS } from './data/products';
import { Hero } from './components/Hero';
import { ProductGrid } from './components/ProductGrid';

export default function App() {
  const { buyProduct } = useSellsPayCheckout();

  return (
    <AnimatePresence>
      <div className="min-h-screen bg-zinc-950">
        <Hero 
          title="Premium Store" 
          subtitle="Curated digital products for creators"
        />
        <ProductGrid 
          products={PRODUCTS} 
          onBuy={(id) => buyProduct(id)} 
        />
      </div>
    </AnimatePresence>
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
