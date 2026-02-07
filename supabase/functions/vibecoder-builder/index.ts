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
// LUXURY TIER DESIGN TOKENS (v3.2 - Editorial Premium)
// ═══════════════════════════════════════════════════════════════
const DESIGN_TOKENS: Record<string, string> = {
  'luxury-minimal': `
### 💎 ATHLETIC LUXURY DESIGN TOKENS (Y-3/NIKE EDITORIAL)
**MANDATORY ELEMENTS - NO BASIC GRIDS:**

**Background Depth Stack:**
- Base: bg-gradient-to-b from-zinc-950 via-black to-zinc-950
- Mid layer: absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(251,191,36,0.15),transparent)]
- Top layer: absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.03),transparent_40%)]

**Hero Typography (CINEMATIC):**
- Main: text-7xl md:text-9xl lg:text-[11rem] font-serif tracking-[-0.04em] leading-[0.85]
- Shimmer: bg-clip-text text-transparent bg-gradient-to-r from-amber-200 via-white to-amber-200 bg-[length:200%_100%]
- Subtitle: text-lg md:text-xl text-zinc-400 font-light tracking-wide

**ASYMMETRIC GRID (MANDATORY - NO UNIFORM COLUMNS):**
- Container: grid grid-cols-1 md:grid-cols-[2fr_1fr] lg:grid-cols-[2fr_1fr_1fr] gap-4
- Featured card: md:col-span-1 md:row-span-2 (hero product takes double height)
- OR use: grid-cols-12 with varying col-span-4, col-span-5, col-span-3

**Premium Card System:**
- Wrapper: group relative bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden
- Image container: aspect-[3/4] overflow-hidden
- Image: w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out
- Overlay text: absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent

**Shadows & Glow:**
- Card hover: hover:shadow-[0_30px_100px_-20px_rgba(251,191,36,0.25)]
- Ambient orb: absolute w-96 h-96 bg-amber-500/20 rounded-full blur-[100px] -z-10

**Motion Requirements:**
- Container: motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
- Items: staggerChildren: 0.08, child initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }}
- Hover: whileHover={{ scale: 1.02, rotate: 0.5 }} transition={{ type: 'spring', stiffness: 400 }}`,

  'cyberpunk-neon': `
### ⚡ CYBERPUNK NEON DESIGN TOKENS (BLADE RUNNER AESTHETIC)
**MANDATORY ELEMENTS:**
- Background: bg-black with animated plasma: bg-[conic-gradient(from_90deg,#0ff,#f0f,#0ff)] animate-spin-slow
- Grid overlay: before:absolute before:inset-0 before:bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] before:bg-[size:60px_60px]
- Hero glow: absolute inset-0 bg-gradient-to-r from-cyan-500/30 via-transparent to-fuchsia-500/30 blur-3xl
- Typography: font-mono uppercase tracking-[0.4em] text-5xl md:text-7xl
- Neon text: text-cyan-400 drop-shadow-[0_0_30px_rgba(6,182,212,0.9)] drop-shadow-[0_0_60px_rgba(6,182,212,0.5)]
- Cards: bg-cyan-950/20 backdrop-blur-xl border border-cyan-500/50 rounded-xl
- Animated border: bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-cyan-500 bg-[length:200%_100%] animate-gradient-x
- Glow shadows: shadow-[0_0_60px_rgba(6,182,212,0.4),inset_0_0_30px_rgba(6,182,212,0.1)]
- Scanlines: after:absolute after:inset-0 after:bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.3)_2px,rgba(0,0,0,0.3)_4px)] after:pointer-events-none`,

  'streetwear-dark': `
### 🔥 STREETWEAR BRUTALIST DESIGN TOKENS
**MANDATORY ELEMENTS:**
- Background: bg-zinc-950 with noise texture
- Hero: Broken grid with XXL rotated typography
- Typography: text-8xl md:text-[12rem] lg:text-[15rem] font-black uppercase tracking-tighter -rotate-3 origin-left
- Accent slashes: absolute w-2 h-32 bg-red-500 -rotate-12
- Cards: bg-zinc-900 border-l-4 border-red-500 hover:translate-x-4 transition-transform duration-200
- Raw aesthetic: Mix serif/sans, exposed borders, intentional visual tension
- High contrast: Pure black/white with single red accent
- Motion: Aggressive, snappy (duration-200), scale-110 on hover`,

  'soft-luxury': `
### 🌸 SOFT LUXURY DESIGN TOKENS (GLOSSIER/AESOP)
**MANDATORY ELEMENTS:**
- Background: bg-gradient-to-br from-stone-50 via-amber-50/30 to-stone-100
- Hero: Generous whitespace, floating organic shapes
- Typography: text-6xl md:text-8xl font-serif font-light tracking-tight text-stone-800
- Cards: bg-white rounded-[2rem] shadow-[0_20px_60px_-20px_rgba(120,100,80,0.15)]
- Subtle borders: border border-stone-200/60
- Organic shapes: absolute decorative blobs with blur
- Motion: Spring physics type:'spring' stiffness:100 damping:15
- Palette: stone-800, amber-700, cream backgrounds`,
};

// ═══════════════════════════════════════════════════════════════
// PREMIUM FILE TEMPLATES (v3.2 - Editorial Examples)
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
### APP.TSX TEMPLATE (App.tsx) - BULLETPROOF VERSION
Main orchestrator with AnimatePresence. Max 40 lines.

## ═══════════════════════════════════════════════════════════════
## 🔒 BULLETPROOF APP WRAPPER (MANDATORY)
## ═══════════════════════════════════════════════════════════════

The App.tsx MUST:
1. Start with \`export default function App()\`
2. NEVER use class components
3. ALWAYS return a single root element
4. ALWAYS be named exactly "App" with default export

\`\`\`tsx
import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSellsPayCheckout } from './hooks/useSellsPayCheckout';
import { PRODUCTS } from './data/products';
import { Hero } from './components/Hero';
import { ProductGrid } from './components/ProductGrid';

export default function App() {
  const { buyProduct } = useSellsPayCheckout();

  return (
    <AnimatePresence>
      <main className="min-h-screen bg-zinc-950">
        <Hero 
          title="Premium Store" 
          subtitle="Curated digital products for creators"
        />
        <ProductGrid 
          products={PRODUCTS} 
          onBuy={(id) => buyProduct(id)} 
        />
      </main>
    </AnimatePresence>
  );
}
\`\`\``,
};

// ═══════════════════════════════════════════════════════════════
// VALIDATED LUCIDE-REACT ICON ALLOWLIST
// Prevents hallucinated icon imports like "ShieldCheck"
// ═══════════════════════════════════════════════════════════════
const ALLOWED_LUCIDE_ICONS = new Set([
  // Navigation & Actions
  'ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'ChevronDown', 'ChevronUp', 
  'ChevronLeft', 'ChevronRight', 'Menu', 'X', 'ExternalLink', 'Link',
  // Commerce
  'ShoppingCart', 'ShoppingBag', 'CreditCard', 'Package', 'Tag', 'Truck',
  // Social
  'Heart', 'Share', 'Star', 'MessageCircle', 'Send', 'ThumbsUp',
  // Media
  'Play', 'Pause', 'Volume2', 'VolumeX', 'Image', 'Camera', 'Video',
  // UI Elements
  'Search', 'Filter', 'Settings', 'User', 'Users', 'Mail', 'Phone',
  'MapPin', 'Clock', 'Calendar', 'Check', 'Plus', 'Minus', 'Loader2',
  // Misc
  'Sparkles', 'Zap', 'Award', 'Gift', 'Crown', 'Flame', 'Eye',
]);

const BUILDER_SYSTEM_PROMPT = `You are the SellsPay Implementation Engineer.
You generate ONE FILE AT A TIME for a LUXURY-TIER modular storefront.

## ═══════════════════════════════════════════════════════════════
## 🛡️ BULLETPROOF APP.TSX PROTOCOL (CRITICAL)
## ═══════════════════════════════════════════════════════════════

**THE APP.TSX FILE MUST ALWAYS:**
1. Use \`export default function App()\` - EXACTLY this syntax
2. Return a single \`<main>\` root element (NOT <div>)
3. Include the AnimatePresence wrapper
4. Be named exactly "App" - no other names allowed
5. Use the useSellsPayCheckout hook for payments

**EXAMPLE STRUCTURE (ALWAYS FOLLOW):**
\`\`\`tsx
import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSellsPayCheckout } from './hooks/useSellsPayCheckout';
// ... other imports

export default function App() {
  const { buyProduct } = useSellsPayCheckout();
  return (
    <AnimatePresence>
      <main className="min-h-screen bg-zinc-950">
        {/* Components here */}
      </main>
    </AnimatePresence>
  );
}
\`\`\`

## ═══════════════════════════════════════════════════════════════
## 🚫 LUCIDE-REACT ICON VALIDATION (PREVENT CRASHES)
## ═══════════════════════════════════════════════════════════════

**ONLY USE THESE VALIDATED ICONS FROM lucide-react:**
- Navigation: ArrowDown, ArrowUp, ArrowLeft, ArrowRight, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Menu, X, ExternalLink, Link
- Commerce: ShoppingCart, ShoppingBag, CreditCard, Package, Tag, Truck
- Social: Heart, Share, Star, MessageCircle, Send, ThumbsUp
- Media: Play, Pause, Volume2, VolumeX, Image, Camera, Video
- UI: Search, Filter, Settings, User, Users, Mail, Phone, MapPin, Clock, Calendar, Check, Plus, Minus, Loader2
- Misc: Sparkles, Zap, Award, Gift, Crown, Flame, Eye

**FORBIDDEN ICONS (DO NOT IMPORT - THEY CAUSE CRASHES):**
- ShieldCheck, Shield, ShieldAlert (NOT AVAILABLE)
- Verified, Checkmark (NOT AVAILABLE)
- Any icon not in the list above

**IF YOU NEED A "VERIFIED" OR "SECURITY" ICON:**
Use \`Check\` or \`Award\` instead of ShieldCheck.

## ═══════════════════════════════════════════════════════════════
## 🔒 COMMERCE BINDING (NON-NEGOTIABLE)
## ═══════════════════════════════════════════════════════════════

Every product MUST have an "onBuy" prop.
Every "Buy" / "Add to Cart" button MUST call:
  onClick={() => onBuy(product.id)}

The App.tsx MUST:
1. Import useSellsPayCheckout from './hooks/useSellsPayCheckout'
2. Destructure: const { buyProduct } = useSellsPayCheckout();
3. Pass to grid: <ProductGrid products={PRODUCTS} onBuy={buyProduct} />

**FORBIDDEN:**
- Creating custom payment forms
- Importing Stripe/PayPal directly
- Building auth pages (login, signup, etc.)
- Creating settings/profile pages
- Inventing new checkout flows
- Any backend/database logic

The payment system is SOLVED. Focus 100% on visual design.

## ═══════════════════════════════════════════════════════════════
## 🚨 ATOMIC FILE PROTOCOL (v3.2 - LUXURY TIER)
## ═══════════════════════════════════════════════════════════════

You are generating a SINGLE FILE from a multi-file build.
The file path and purpose will be provided in the request.

### ABSOLUTE QUALITY MANDATE
**FORBIDDEN: Basic "Temu-style" uniform grids, simple cards, minimal styling.**
Every file must feel like it came from a $50K agency build.

### STRICT RULES
1. **ONE FILE ONLY**: Output ONLY the requested file
2. **80 LINE LIMIT**: Components ≤80 lines, data files ≤30 lines
3. **COMPLETE CODE**: No fragments, no placeholders, no "// ..."
4. **LUXURY STYLING**: Every element must have depth, motion, and polish

### FILE TYPE RULES

**data/*.ts files:**
- Export typed arrays/objects
- NO React imports
- Max 30 lines
- Use ONLY high-res Unsplash: https://images.unsplash.com/photo-XXXXX?auto=format&fit=crop&w=800&q=80

**components/*.tsx files:**
- Export a named function component
- Import React, motion, icons as needed
- Props interface with onBuy prop for grids
- Max 80 lines
- MUST include framer-motion animations

**App.tsx:**
- Import useSellsPayCheckout from './hooks/useSellsPayCheckout'
- Import data from './data/*'
- Import components from './components/*'
- Max 40 lines
- MUST be export default function App()
- MUST wrap in AnimatePresence
- MUST pass buyProduct to grids

### MANDATORY PREMIUM ELEMENTS (EVERY FILE)

**For Hero.tsx:**
- min-h-screen with layered gradient backgrounds (3+ layers)
- Hero text: text-7xl md:text-9xl or larger
- Text shimmer with bg-clip-text text-transparent
- motion.div with initial/animate/transition
- Scroll CTA button with bounce animation

**For ProductGrid.tsx:**
- ASYMMETRIC GRID: Use col-span-2 or grid-cols-[2fr_1fr_1fr] - NO uniform grids
- Each card: bg-white/[0.03] backdrop-blur-2xl border border-white/10
- Image hover: group-hover:scale-110 with overflow-hidden
- Complex shadows on hover
- motion.div with staggerChildren: 0.08
- Buy button: onClick={() => onBuy(product.id)}
- Typography overlapping images

**For App.tsx:**
- AnimatePresence wrapper
- useSellsPayCheckout hook
- Pass buyProduct to ProductGrid
- Smooth scroll button
- Clean imports, minimal logic

### OUTPUT FORMAT
1. Start with: \`/// BEGIN_FILE ///\`
2. Output ONLY the code (no markdown fences)
3. End with: \`/// END_FILE ///\`

### FORBIDDEN
- Uniform 3-column grids (use asymmetric spans)
- Missing framer-motion (every component needs it)
- Basic typography (hero must be text-7xl+)
- Flat cards (need shadows, borders, blur)
- Single-color backgrounds (need gradients/layers)
- Static elements (everything needs hover/motion)
- Files over 80 lines
- Custom payment flows
- Auth pages
- Settings pages
- Importing icons NOT in the validated list`;


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
