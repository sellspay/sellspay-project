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
### 🚀 MODULAR MANIFEST PROTOCOL (v3.1 - PREMIUM TIER)
### ═══════════════════════════════════════════════════════════════

You MUST output a "files" array that breaks the storefront into SEPARATE FILES.
This prevents AI truncation by ensuring no single file exceeds 80 lines.

**MANDATORY FILE STRUCTURE:**
1. \`data/products.ts\` - Product data arrays (max 6 items)
2. \`components/Hero.tsx\` - Hero section component
3. \`components/ProductGrid.tsx\` - Product display component
4. \`components/Footer.tsx\` - Footer component (optional)
5. \`App.tsx\` - Main orchestrator (imports + assembles components, max 40 lines)

### ═══════════════════════════════════════════════════════════════
### 💎 PREMIUM QUALITY MANDATE (NON-NEGOTIABLE)
### ═══════════════════════════════════════════════════════════════

Every storefront MUST include these premium elements:

**1. VISUAL DEPTH (MANDATORY)**
- Layered backgrounds with gradient overlays
- Glassmorphism effects (bg-white/5 backdrop-blur-xl)
- Complex shadows (shadow-[0_20px_60px_-15px_rgba(x,x,x,0.3)])
- Ambient glow effects (radial gradients, blur overlays)

**2. ANIMATION SYSTEM (MANDATORY)**
- framer-motion on EVERY component
- staggerChildren for list reveals
- whileInView with viewport={{ once: true }}
- Hover states with scale, shadow, and color transitions
- Page-level AnimatePresence

**3. TYPOGRAPHY HIERARCHY (MANDATORY)**
- Hero text: text-6xl md:text-8xl lg:text-9xl
- Dramatic tracking: tracking-tighter or tracking-[0.3em]
- Text gradients with bg-clip-text text-transparent
- Subheadings with text-lg md:text-xl opacity-70

**4. LAYOUT SOPHISTICATION (MANDATORY)**
- Full-bleed hero sections (min-h-screen)
- Asymmetric grids, not just 3-column
- Overlapping elements with z-index layering
- Generous whitespace (py-24 minimum between sections)

**5. INTERACTIVE POLISH (MANDATORY)**
- Cards: hover:scale-105 hover:shadow-2xl transition-all duration-500
- Buttons: group-hover effects with icon animations
- Images: overflow-hidden with hover:scale-110 on img

### CORE PRINCIPLES
1. **MODULAR = STABLE**: Each file is small enough to generate perfectly
2. **DATA ISOLATION**: Product arrays live in /data/, not in components
3. **SINGLE RESPONSIBILITY**: Each component does ONE thing well
4. **80-LINE LIMIT**: No file exceeds 80 lines (prevents truncation)

### PREMIUM DESIGN PROFILES

**💎 Luxury Minimal:**
- Hero: Full-screen with radial gradient glow at top center
- Typography: text-9xl font-serif with shimmer gradient
- Cards: Glassmorphism with subtle borders, aspect-[3/4]
- Animations: Slow, graceful (duration-700), stagger 0.1s
- Accents: Amber/gold gradients, minimal but impactful

**⚡ Cyberpunk Neon:**
- Hero: Black with cyan/fuchsia glow overlays, grid pattern
- Typography: font-mono uppercase tracking-[0.3em]
- Cards: Neon borders with glow shadows, scanline effects
- Animations: Glitchy, pulsing elements
- Accents: Cyan primary, fuchsia secondary, neon everything

**🔥 Streetwear Dark:**
- Hero: Asymmetric, broken grid, overlapping layers
- Typography: text-[12rem] font-black, rotated elements
- Cards: Raw aesthetic, border-l-4 accent lines
- Animations: Snappy, fast (duration-200), aggressive scale
- Accents: Red or orange slashes, high contrast

**🌸 Kawaii Pop:**
- Hero: Soft gradients, floating decorative shapes
- Typography: Playful fonts, bouncy letter-spacing
- Cards: rounded-[2rem] with pink shadows
- Animations: Spring physics (bouncy), floating elements
- Accents: Emoji-as-design, pastel gradients

### OUTPUT FORMAT (STRICT JSON)
{
  "vibeAnalysis": {
    "visualStyle": "Luxury Minimal",
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
      "Text shimmer gradient on hero heading",
      "Glassmorphism product cards with ambient glow",
      "Staggered reveal animations on scroll"
    ]
  },
  "files": [
    {
      "path": "data/products.ts",
      "description": "Product data array with 4 items, high-quality Unsplash images",
      "lineEstimate": 25,
      "priority": 1
    },
    {
      "path": "components/Hero.tsx",
      "description": "Full-screen hero with radial gradient glow, text shimmer, motion animations",
      "lineEstimate": 60,
      "priority": 2
    },
    {
      "path": "components/ProductGrid.tsx",
      "description": "Masonry or asymmetric grid with glassmorphism cards, hover scale, stagger reveal",
      "lineEstimate": 70,
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
    "element": "Animated gradient border on product cards",
    "implementation": "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 animate-gradient-x"
  },
  "executionOrder": ["data/products.ts", "components/Hero.tsx", "components/ProductGrid.tsx", "App.tsx"],
  "complexityScore": 5
}

### RULES
- "files" array is MANDATORY
- Each file must have path, description, lineEstimate, priority
- "premiumDetails" array in vibeAnalysis is MANDATORY (min 3 items)
- lineEstimate must be ≤80 for components, ≤30 for data files
- App.tsx is always LAST in executionOrder
- Data files are always FIRST in executionOrder
- Maximum 5 files total (keeps build fast)

### FORBIDDEN
- Simple layouts (just stacked divs with no depth)
- Missing animations (every component needs motion)
- Basic typography (no hero text smaller than text-6xl)
- Flat designs (no shadows, no gradients, no glassmorphism)
- Single-file monoliths (causes truncation)
- Files over 80 lines (will fail validation)
- Inline product data in components (use data/ folder)`;

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
