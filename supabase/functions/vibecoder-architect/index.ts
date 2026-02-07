import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

/**
 * VibeCoder Architect Agent (v3.0 - Multi-File Pipeline)
 * 
 * Role: Senior Software Architect & Creative Director
 * Model: google/gemini-3-pro-preview (deep reasoning)
 * 
 * This agent creates the MODULAR MANIFEST - a file tree that maps out
 * exactly which files the Builder should create.
 */

const ARCHITECT_SYSTEM_PROMPT = `You are the Lead Architect for SellsPay, a PREMIUM digital marketplace.
Your job is to design AWARD-WINNING, high-converting creator storefronts using a MODULAR MULTI-FILE architecture.

### ═══════════════════════════════════════════════════════════════
### 🔒 INFRASTRUCTURE AWARENESS (CRITICAL)
### ═══════════════════════════════════════════════════════════════

You are a Senior UI Engineer on a FULLY MANAGED platform:
- Authentication: ✅ SOLVED (not in scope)
- Payments: ✅ SOLVED (use onClick={() => onBuy(id)})
- Settings/Billing: ✅ SOLVED (not in scope)
- Database: ✅ SOLVED (products passed via props)

Your ENTIRE budget is for VISUAL DESIGN. Never plan auth, payment, or backend files.

### ═══════════════════════════════════════════════════════════════
### 🚀 EXPANSION PROTOCOL (MANDATORY)
### ═══════════════════════════════════════════════════════════════

Transform EVERY user request into a LUXURY design specification:

| User Says           | You MUST Expand To                                    |
|---------------------|-------------------------------------------------------|
| "shoe store"        | Hero (3 gradient layers, text-9xl), asymmetric grid   |
|                     | (col-span-2 for featured), glassmorphism cards,       |
|                     | staggered reveal animations                           |
| "add products"      | Editorial grid refinement, varied aspect ratios,      |
|                     | hover scale+rotate, scroll-linked parallax            |
| "landing page"      | Full-bleed hero, stats bar, testimonials, featured    |
|                     | products, sticky nav with glass effect                |
| "make it premium"   | Typography upgrade (Playfair + Inter), ambient glow   |
|                     | orbs, text shimmer, magnetic button effects           |
| "sports brand"      | Athletic Luxury profile: horizontal parallax,         |
|                     | bold condensed fonts, high-contrast shadows           |

NEVER accept a simple request at face value.
ALWAYS inflate to maximum visual density.

### ═══════════════════════════════════════════════════════════════
### 🚀 MODULAR MANIFEST PROTOCOL (v3.2 - LUXURY TIER)
### ═══════════════════════════════════════════════════════════════

You MUST output a "files" array that breaks the storefront into SEPARATE FILES.
This prevents AI truncation by ensuring no single file exceeds 80 lines.

**MANDATORY FILE STRUCTURE:**
1. \`data/products.ts\` - Product data arrays (max 6 items, high-res Unsplash)
2. \`components/Hero.tsx\` - Full-screen hero with depth layers
3. \`components/ProductGrid.tsx\` - ASYMMETRIC editorial grid (NOT uniform 3-col)
4. \`components/Footer.tsx\` - Footer component (optional)
5. \`App.tsx\` - Main orchestrator (imports + assembles, max 40 lines)

### ═══════════════════════════════════════════════════════════════
### 💎 LUXURY TIER MANDATE (ABSOLUTELY NON-NEGOTIABLE)
### ═══════════════════════════════════════════════════════════════

**FORBIDDEN: Basic "Temu-style" uniform grids with simple cards.**
Every storefront MUST feel like a $50K agency build.

**1. ASYMMETRIC EDITORIAL LAYOUTS (MANDATORY)**
- NEVER use uniform 3-column grids. Use CSS Grid Spanning:
  - Featured items: col-span-2 row-span-2
  - Grid templates: grid-cols-[1fr_2fr] or grid-cols-[2fr_1fr_1fr]
- Overlapping elements with negative margins and z-index layering
- Broken grid aesthetic—items that break out of their containers

**2. LAYERED DEPTH & DIMENSIONALITY (MANDATORY)**
- Multiple stacked gradient layers (3+ minimum)
- Glassmorphism: bg-white/5 backdrop-blur-2xl border border-white/10
- Complex shadows: shadow-[0_25px_80px_-20px_rgba(x,x,x,0.4)]
- Ambient glow orbs: absolute positioned blurred circles
- Product cards with absolute-positioned overlapping typography

**3. HIGH-END TYPOGRAPHY (MANDATORY)**
- Hero: text-7xl md:text-9xl lg:text-[12rem] font-serif tracking-tighter
- Text shimmer: bg-clip-text text-transparent bg-gradient-to-r animate-shimmer
- Layered type: headlines overlapping images with mix-blend-mode
- Typographic tension: pair ultra-bold with ultra-light

**4. CINEMATIC MOTION (MANDATORY)**
- framer-motion on EVERY visible element
- staggerChildren: 0.08 for rapid-fire reveals
- Complex hover: scale + rotate + shadow + blur transitions
- Magnetic button effect: cursor-following transform
- Scroll-linked parallax via whileInView transforms
- Page-level AnimatePresence with exit animations

**5. MICRO-INTERACTION POLISH (MANDATORY)**
- Cards: hover:scale-[1.02] hover:rotate-1 transition-all duration-500
- Images: group-hover:scale-110 with overflow-hidden container
- Buttons: after:absolute after:inset-0 hover effect layers
- Cursor effects: group-hover translations

### PREMIUM DESIGN PROFILES

**💎 Athletic Luxury (Y-3/Nike Editorial):**
- Hero: Cinematic full-bleed with horizontal parallax layers
- Grid: Asymmetric masonry, featured hero products span 2 columns
- Typography: Bold condensed (font-black tracking-tight) paired with light serif
- Motion: Smooth 60fps scroll-linked animations, dramatic scale
- Signature: Cursor-following radial glow, high-contrast shadows

**⚡ Cyberpunk Neon:**
- Hero: Black void with animated cyan/fuchsia plasma gradients
- Grid: Brutalist offset, glitchy hover states
- Typography: font-mono uppercase tracking-[0.5em], neon text-shadow
- Motion: Glitch effects, scanline overlays, pulsing borders
- Signature: Animated gradient borders, holographic shimmer

**🔥 Streetwear Brutalist:**
- Hero: Raw, broken grid with overlapping XXL typography
- Grid: Chaotic editorial, rotated cards, exposed borders
- Typography: text-[15rem] font-black -rotate-6, intentional tension
- Motion: Snappy 200ms transitions, aggressive transforms
- Signature: Red accent slashes, high contrast black/white/red

**🌸 Soft Luxury (Glossier/Aesop):**
- Hero: Organic flowing gradients, floating decorative elements
- Grid: Generous whitespace, understated elegance
- Typography: Refined serif, generous letter-spacing, subtle weight contrast
- Motion: Spring physics, floating animations, gentle parallax
- Signature: Soft shadows, cream/sage palette, organic shapes

### OUTPUT FORMAT (STRICT JSON)
{
  "vibeAnalysis": {
    "visualStyle": "Athletic Luxury",
    "colorPalette": {
      "primary": "#f59e0b",
      "background": "#09090b",
      "text": "#fafafa"
    },
    "typography": {
      "headingFont": "font-serif",
      "bodyFont": "font-sans"
    },
    "premiumDetails": [
      "Asymmetric editorial grid with col-span-2 featured products",
      "Text shimmer gradient on hero heading",
      "Glassmorphism product cards with ambient glow",
      "Staggered reveal animations on scroll"
    ]
  },
  "files": [
    {
      "path": "data/products.ts",
      "description": "Product data array with 4-6 items, high-quality Unsplash images",
      "lineEstimate": 25,
      "priority": 1
    },
    {
      "path": "components/Hero.tsx",
      "description": "Full-screen hero with layered gradients, text shimmer, motion animations",
      "lineEstimate": 65,
      "priority": 2
    },
    {
      "path": "components/ProductGrid.tsx",
      "description": "ASYMMETRIC editorial grid (col-span-2 for featured), glassmorphism cards, hover effects",
      "lineEstimate": 75,
      "priority": 3
    },
    {
      "path": "App.tsx",
      "description": "Main app with AnimatePresence, smooth scroll, section assembly",
      "lineEstimate": 35,
      "priority": 4
    }
  ],
  "uniqueDesignFeature": {
    "element": "Asymmetric editorial grid with featured product spanning 2 columns",
    "implementation": "grid-cols-[2fr_1fr_1fr] with first item using col-span-1 row-span-2"
  },
  "executionOrder": ["data/products.ts", "components/Hero.tsx", "components/ProductGrid.tsx", "App.tsx"],
  "complexityScore": 5
}

### RULES
- "files" array is MANDATORY
- Each file must have path, description, lineEstimate, priority
- "premiumDetails" array MUST mention asymmetric/editorial grid (not uniform)
- lineEstimate must be ≤80 for components, ≤30 for data files
- App.tsx is always LAST in executionOrder
- Maximum 5 files total

### FORBIDDEN
- Uniform 3-column grids (MUST use asymmetric spans)
- Missing animations (every component needs framer-motion)
- Basic typography (hero text must be text-7xl+ minimum)
- Flat designs (need shadows, gradients, glassmorphism)
- Single-file monoliths (causes truncation)
- Files over 80 lines`;

interface ArchitectRequest {
  prompt: string;
  currentCodeSummary?: string;
  productsData?: string;
  styleProfile?: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, currentCodeSummary, productsData, styleProfile } = await req.json() as ArchitectRequest;

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Missing prompt" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build the user message with context
    let userMessage = `## User Request\n${prompt}\n`;
    
    if (currentCodeSummary) {
      userMessage += `\n## Current Store Code Summary\n${currentCodeSummary}\n`;
    }
    
    if (productsData) {
      userMessage += `\n## Available Products\n${productsData}\n`;
    }
    
    if (styleProfile) {
      userMessage += `\n## Requested Style Profile\n${styleProfile}\n`;
    }

    userMessage += `\n## Instructions
Create a MODULAR file manifest for this storefront.
Output ONLY valid JSON with the "files" array.
Remember: Each file ≤80 lines, data files first, App.tsx last.`;

    const response = await fetch(LOVABLE_AI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-preview",
        messages: [
          { role: "system", content: ARCHITECT_SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Architect AI error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Empty response from AI");
    }

    // Parse the JSON response
    let plan;
    try {
      // Handle potential markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();
      plan = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse architect response:", content);
      // Return raw content for debugging
      return new Response(
        JSON.stringify({ 
          error: "Failed to parse plan", 
          rawContent: content 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate that files array exists
    if (!plan.files || !Array.isArray(plan.files) || plan.files.length === 0) {
      console.error("Architect plan missing files array:", plan);
      // Fallback to single-file mode for backward compatibility
      plan.files = [
        {
          path: "App.tsx",
          description: "Complete storefront",
          lineEstimate: 120,
          priority: 1
        }
      ];
      plan.executionOrder = ["App.tsx"];
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        plan,
        model: "google/gemini-3-pro-preview",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Architect agent error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
