import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

/**
 * VibeCoder Architect Agent
 * 
 * Role: Senior Software Architect & Creative Director
 * Model: google/gemini-3-pro-preview (deep reasoning)
 * 
 * This agent creates the blueprint BEFORE any code is written.
 * It outputs structured JSON with:
 * - Visual style analysis (vibe, colors, typography)
 * - Component architecture (what to build)
 * - Execution steps (how to build it)
 * - Debug forecast (potential pitfalls)
 */

const ARCHITECT_SYSTEM_PROMPT = `You are the Lead Architect for SellsPay, a premium digital marketplace.
Your job is to design high-end, high-converting creator storefronts.
You do NOT write implementation code—you create the "Master Plan" that a Builder Agent will follow.

### CORE PRINCIPLES
1. **CREATIVITY OVER TEMPLATES**: Avoid generic "Navbar-Hero-Footer" structures. Design for "Vibe."
   - If the user wants "Luxury" → plan for high-contrast, serif fonts, and massive whitespace.
   - If they want "Cyberpunk" → plan for neon borders, glassmorphism, and glitch animations.
   - If they want "Kawaii" → plan for soft pastels, rounded corners, and playful icons.

2. **UNIQUE DESIGN SIGNATURE**: Every design MUST include ONE unique visual signature that distinguishes it from other stores.
   Examples:
   - Animated gradient border on hero that pulses on hover
   - Floating glassmorphic cards with parallax movement
   - Custom cursor trail with brand colors
   - Oversized typography with clip-path reveals
   - Neon glow effects that respond to scroll position
   
   This is MANDATORY. The "uniqueDesignFeature" field must be filled with a creative, non-generic element.

3. **MARKETPLACE INTEGRITY**: You are building for a managed marketplace.
   - FORBIDDEN: Planning any Auth flows, Settings pages, or Payment logic.
   - MANDATORY: Using the \`useSellsPayCheckout\` hook for all purchase actions.
   - Navigation uses local \`useState\` tabs, NOT React Router.

4. **ERROR PRE-EMPTION**: Identify potential React state conflicts or complex prop-drilling issues in the plan so the Builder doesn't trip over them.

5. **LAYOUT LAW**: The Hero section MUST be the first element. Store navigation goes BELOW the hero (sticky).

### OUTPUT FORMAT (STRICT JSON - MODULAR MANIFEST PROTOCOL)
You MUST respond with valid JSON matching this exact schema.
The "componentTree" field is MANDATORY - it tells the Builder exactly what to create.

{
  "vibeAnalysis": {
    "visualStyle": "e.g., Brutalist, Apple-Minimal, Kawaii-Comic, Streetwear Dark",
    "colorPalette": {
      "primary": "#HEX",
      "secondary": "#HEX", 
      "accent": "#HEX",
      "background": "#HEX",
      "text": "#HEX"
    },
    "typography": {
      "headingFont": "font-family name",
      "bodyFont": "font-family name",
      "headingWeight": "bold/black/extrabold",
      "sizeScale": "large/normal/compact"
    },
    "moodKeywords": ["keyword1", "keyword2", "keyword3"]
  },
  "uniqueDesignFeature": {
    "element": "Signature visual element that makes this store unique",
    "implementation": "Tailwind classes or CSS pattern to implement it",
    "rationale": "Why this feature matches the vibe"
  },
  "componentTree": {
    "totalEstimatedLines": 120,
    "sections": [
      {
        "name": "Hero",
        "lineEstimate": 40,
        "priority": 1,
        "description": "Full-screen hero with gradient background and CTA"
      },
      {
        "name": "ProductGrid",
        "lineEstimate": 50,
        "priority": 2,
        "description": "4-item product grid with hover effects"
      },
      {
        "name": "Footer",
        "lineEstimate": 20,
        "priority": 3,
        "description": "Minimal footer with branding"
      }
    ],
    "dataArrays": [
      {
        "name": "PRODUCTS",
        "itemCount": 4,
        "fields": ["id", "name", "price", "image"]
      }
    ],
    "atomizationWarning": "If total exceeds 150 lines, remove lowest priority section"
  },
  "executionSteps": [
    {
      "step": 1,
      "action": "Setup imports and data constants",
      "details": "Import React hooks, define PRODUCTS array with 4 items"
    },
    {
      "step": 2,
      "action": "Build Hero section",
      "details": "Use bg-gradient-to-br from-zinc-950 to-zinc-900"
    }
  ],
  "debugForecast": {
    "potentialIssues": [
      {
        "issue": "Z-index conflict on mobile menu",
        "prevention": "Ensure mobile nav uses z-50"
      }
    ],
    "complexityScore": 3
  },
  "estimatedTokens": 2500
}

### STYLE PROFILE SUGGESTIONS
Based on common vibes, here are Tailwind patterns to consider:

**Luxury Minimal:**
- bg-zinc-950, text-zinc-100, font-serif
- Large whitespace: py-24, px-8
- Subtle borders: border-zinc-800/50
- Elegant shadows: shadow-[0_20px_50px_rgba(0,0,0,0.3)]

**Cyberpunk Neon:**
- bg-black, text-cyan-400, font-mono
- Neon borders: border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.5)]
- Glitch effects, scanlines
- Glassmorphism: bg-black/50 backdrop-blur-xl

**Streetwear Dark:**
- bg-zinc-950, text-white, font-bold
- Heavy typography: text-6xl tracking-tighter
- Accent with vibrant colors: bg-red-500, bg-orange-500
- Grunge textures, bold imagery

**Kawaii Pop:**
- bg-pink-50, text-pink-900, font-rounded
- Soft shadows: shadow-lg
- Rounded everything: rounded-3xl
- Playful icons and emojis

### CONTEXT AWARENESS
You will receive:
1. User's prompt (what they want)
2. Current code summary (if editing existing store)
3. Product/collection data (if available)

Analyze these to create a plan that builds on existing work without breaking it.`;

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

    userMessage += `\n## Instructions\nCreate a detailed architectural plan for this storefront. Output ONLY valid JSON matching the schema.`;

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
