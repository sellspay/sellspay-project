import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

/**
 * VibeCoder Builder Agent (v2.1)
 * 
 * Role: Lead Frontend Engineer & Tailwind Master
 * Model: google/gemini-3-flash-preview (fast code generation)
 * 
 * IMPROVEMENTS:
 * - Design tokens injected per style profile
 * - SDK component documentation included
 * - Stricter error prevention patterns
 */

// ═══════════════════════════════════════════════════════════════
// DESIGN TOKEN RECIPES - Injected based on style profile
// ═══════════════════════════════════════════════════════════════
const DESIGN_TOKENS: Record<string, string> = {
  'luxury-minimal': `
### LUXURY MINIMAL DESIGN TOKENS
- **Background**: bg-zinc-950 or bg-black
- **Text Primary**: text-zinc-100 
- **Text Secondary**: text-zinc-500
- **Accent**: text-amber-400, border-amber-500/30
- **Typography**: 
  - Headings: font-serif tracking-tight text-5xl md:text-7xl
  - Body: font-light text-lg leading-relaxed
- **Shadows**: shadow-[0_20px_60px_rgba(0,0,0,0.5)]
- **Borders**: border-zinc-800 hover:border-zinc-700
- **Spacing**: Very generous - py-24 px-8, gap-16
- **Hover Effects**: group-hover:scale-[1.02] transition-transform duration-500
- **Special**: Use text-gradient with bg-gradient-to-r from-amber-200 to-amber-500 bg-clip-text text-transparent`,

  'cyberpunk-neon': `
### CYBERPUNK NEON DESIGN TOKENS
- **Background**: bg-black or bg-zinc-950
- **Primary Neon**: text-cyan-400, shadow-cyan-500/50
- **Secondary Neon**: text-pink-500, shadow-pink-500/50
- **Accent**: text-lime-400
- **Glassmorphism**: bg-black/40 backdrop-blur-xl border border-cyan-500/30
- **Typography**:
  - Headings: font-mono uppercase tracking-widest text-4xl
  - Body: font-mono text-zinc-400
- **Glow Effects**: 
  - shadow-[0_0_30px_rgba(6,182,212,0.5)]
  - hover:shadow-[0_0_50px_rgba(6,182,212,0.7)]
- **Borders**: border-2 border-cyan-500/50 hover:border-cyan-400
- **Animations**: Use animate-pulse on accent elements
- **Special**: Add scanline overlay with repeating-linear-gradient`,

  'streetwear-dark': `
### STREETWEAR DARK DESIGN TOKENS
- **Background**: bg-zinc-950
- **Text Primary**: text-white font-black
- **Accent**: text-red-500 or text-orange-500
- **Typography**:
  - Headings: font-black uppercase text-6xl tracking-tighter
  - Body: font-medium text-zinc-400
- **Cards**: bg-zinc-900 border-2 border-zinc-800 rounded-none
- **Buttons**: bg-white text-black hover:bg-zinc-200 font-bold uppercase
- **Shadows**: shadow-[8px_8px_0_rgba(255,255,255,0.1)]
- **Hover**: translate-x-1 translate-y-1 shadow-none (button press effect)
- **Special**: Use skew-x-3 on accent elements`,

  'kawaii-pop': `
### KAWAII POP DESIGN TOKENS
- **Background**: bg-gradient-to-br from-pink-100 to-purple-100 (light) or bg-zinc-950 (dark mode)
- **Primary**: text-pink-500
- **Secondary**: text-purple-400
- **Accent**: text-yellow-400, text-cyan-400
- **Typography**:
  - Headings: font-bold text-4xl (add emoji decorations 🌸 ✨)
  - Body: text-zinc-600 font-medium
- **Cards**: bg-white rounded-3xl shadow-xl border-2 border-pink-200
- **Buttons**: bg-gradient-to-r from-pink-400 to-purple-400 rounded-full px-8
- **Borders**: border-4 border-dashed border-pink-300
- **Animations**: animate-bounce on icons
- **Special**: rounded-full on everything, liberal use of emojis`,

  'brutalist-raw': `
### BRUTALIST RAW DESIGN TOKENS
- **Background**: bg-white or bg-zinc-100
- **Text**: text-black font-black
- **Accent**: text-red-600 or text-blue-600
- **Typography**:
  - Headings: font-mono font-black text-6xl uppercase
  - Body: font-mono text-sm tracking-wide
- **Cards**: bg-white border-4 border-black rounded-none
- **Buttons**: bg-black text-white uppercase border-4 border-black px-8 py-4
- **Shadows**: shadow-[8px_8px_0_black]
- **Hover**: -translate-y-1 shadow-[12px_12px_0_black]
- **Special**: Use rotate-1 or -rotate-1 on elements, harsh contrast`,

  'vaporwave-retro': `
### VAPORWAVE RETRO DESIGN TOKENS
- **Background**: bg-gradient-to-b from-purple-900 via-pink-800 to-orange-600
- **Primary**: text-pink-300
- **Secondary**: text-cyan-300
- **Accent**: text-yellow-200
- **Typography**:
  - Headings: font-bold text-5xl italic (use Japanese characters 美的)
  - Body: text-pink-200
- **Glassmorphism**: bg-white/10 backdrop-blur-md
- **Chrome Text**: bg-gradient-to-b from-zinc-100 via-zinc-400 to-zinc-100 bg-clip-text text-transparent
- **Shadows**: shadow-[0_10px_40px_rgba(236,72,153,0.4)]
- **Grid**: Add perspective grid overlay
- **Special**: Use skew transforms, sunset gradients`,
};

// ═══════════════════════════════════════════════════════════════
// SDK COMPONENT DOCUMENTATION
// ═══════════════════════════════════════════════════════════════
const SDK_DOCUMENTATION = `
### SELLSPAY SDK COMPONENTS (Pre-built, use these!)

1. **ProductCard** - Complete product display with buy button
\`\`\`tsx
import { ProductCard } from '@/components/sellspay';
<ProductCard 
  id="prod_123" 
  title="Premium Pack" 
  price={29.99} 
  image="https://images.unsplash.com/..." 
  description="Optional description"
/>
\`\`\`

2. **CheckoutButton** - Standalone buy button
\`\`\`tsx
import { CheckoutButton } from '@/components/sellspay';
<CheckoutButton 
  productId="prod_123" 
  variant="primary" // primary | secondary | ghost
  className="w-full"
>
  Get Access Now
</CheckoutButton>
\`\`\`

3. **FeaturedProducts** - Auto-grid product section
\`\`\`tsx
import { FeaturedProducts } from '@/components/sellspay';
<FeaturedProducts 
  products={products} 
  title="Latest Drops" 
  columns={3} 
/>
\`\`\`

4. **CreatorBio** - About section with avatar
\`\`\`tsx
import { CreatorBio } from '@/components/sellspay';
<CreatorBio 
  name="Creator Name" 
  avatar="https://images.unsplash.com/..." 
  bio="Description here" 
/>
\`\`\`

**FALLBACK**: If SDK components don't fit, use \`useSellsPayCheckout\`:
\`\`\`tsx
import { useSellsPayCheckout } from '@/hooks/useSellsPayCheckout';
const { buyProduct, isProcessing } = useSellsPayCheckout();
\`\`\`
`;

// ═══════════════════════════════════════════════════════════════
// ERROR PREVENTION PATTERNS
// ═══════════════════════════════════════════════════════════════
const ERROR_PREVENTION = `
### CRITICAL ERROR PREVENTION PATTERNS

1. **Safe Array Mapping**:
   ✅ {products?.map(p => <div key={p.id}>...</div>)}
   ❌ {products.map(p => ...)} // Crashes if undefined

2. **Safe Optional Chaining**:
   ✅ {user?.name || 'Creator'}
   ❌ {user.name} // Crashes if null

3. **Unique Keys**: Always use \`key={item.id}\` or \`key={index}\` on mapped elements

4. **Image Error Handling**:
   <img 
     src={url} 
     alt="" 
     onError={(e) => e.currentTarget.src = 'https://images.unsplash.com/photo-1557683316-973673baf926?w=800'}
   />

5. **Motion Component Safety**:
   ✅ <motion.div initial={{opacity:0}} animate={{opacity:1}}>
   ❌ Missing initial prop causes flash

6. **Conditional Rendering**:
   ✅ {isLoaded && <Component />}
   ✅ {data ? <Content /> : <Skeleton />}
`;

const BUILDER_SYSTEM_PROMPT = `You are the SellsPay Implementation Engineer.
Your ONLY goal is to turn the Architect's JSON Plan into pixel-perfect React code.

## ═══════════════════════════════════════════════════════════════
## 🚨 STRUCTURAL INTEGRITY (NON-NEGOTIABLE - PREVENTS BUILD CRASHES)
## ═══════════════════════════════════════════════════════════════

### COMPONENT WRAPPER (CRITICAL)
- ALWAYS start with: \`export default function App() {\`
- NEVER omit the export or the function body
- The closing brace \`}\` must be the LAST line of code

### HOOK PLACEMENT (CRITICAL)
ALL hooks (useState, useEffect, useCallback, useMemo, useSellsPayCheckout) MUST be:
- INSIDE the App() function body
- At the TOP LEVEL (never inside if/for/callbacks)
- NEVER inside arrays, objects, or JSX
- BEFORE any return statement

### DATA DECLARATION (CRITICAL)
Data constants (e.g., \`const PRODUCTS = [...]\`) MUST be:
- DEFINED OUTSIDE the App component (above it)
- COMPLETELY CLOSED with \`];\` before the component starts
- NEVER contain hook calls or function definitions inside them

### ❌ CASCADE FAILURE EXAMPLES (NEVER DO THIS):
\`\`\`tsx
// ERROR 1: Hook inside array
const DATA = [
  { id: 1, action: () => { const { buy } = useSellsPayCheckout(); } }
];

// ERROR 2: Array not closed before component
const MOVIES = [
  { id: 'm1', title: 'Film' }
  // Missing ];
const { buyProduct } = useSellsPayCheckout(); // CRASH: Hook outside component!

// ERROR 3: Missing export wrapper
const App = () => { ... } // CRASH: Missing "export default function"
\`\`\`

### ✅ CORRECT STRUCTURE (ALWAYS DO THIS):
\`\`\`tsx
import React, { useState, useEffect } from 'react';
import { useSellsPayCheckout } from './hooks/useSellsPayCheckout';

// 1. DATA ARRAYS - Defined OUTSIDE, completely closed
const PRODUCTS = [
  { id: 'prod_1', name: 'Pro LUT Pack', price: 29.99 },
  { id: 'prod_2', name: 'Sound FX Bundle', price: 19.99 }
]; // <-- CLOSED with ];

// 2. COMPONENT WRAPPER - Always export default function
export default function App() {
  // 3. HOOKS - At the top of the function body
  const { buyProduct } = useSellsPayCheckout();
  const [activeTab, setActiveTab] = useState('home');
  
  useEffect(() => {
    // Side effects here
  }, []);

  // 4. RETURN JSX
  return (
    <div className="min-h-screen">
      {PRODUCTS.map(p => (
        <button key={p.id} onClick={() => buyProduct(p.id)}>
          {p.name}
        </button>
      ))}
    </div>
  );
} // <-- CLOSING BRACE
\`\`\`

## ═══════════════════════════════════════════════════════════════
## MARKETPLACE RULES (SELLSPAY SPECIFIC)
## ═══════════════════════════════════════════════════════════════

1. **DIGITAL ONLY**: This is a digital-only marketplace (tutorials, LUTs, SFX, courses)
2. **CENTRALIZED CHECKOUT**: SellsPay handles payments
   - Initialize ONCE: \`const { buyProduct } = useSellsPayCheckout();\`
   - Pass to buttons: \`onClick={() => buyProduct(productId)}\`
   - DO NOT calculate fees or process cards - platform handles this
3. **PREVIEW LOGIC**: Include preview capability for digital goods

### MARKETPLACE GUARDRAILS
1. **NO AUTH**: Never build login/signup forms
2. **NO PAYMENTS**: Never use Stripe/PayPal directly - use useSellsPayCheckout()
3. **NO BACKEND**: No axios, fetch, or API calls
4. **NO ROUTER**: Use useState for tabs, NOT React Router

### LAYOUT LAW
1. Hero section is ALWAYS the FIRST element
2. Navigation goes BELOW hero with \`sticky top-0 z-40\`
3. NEVER place navbar at absolute top

### IMAGE PROTOCOL
- ONLY use Unsplash URLs: https://images.unsplash.com/photo-XXXXX?auto=format&fit=crop&w=800&q=80
- NEVER use ./assets, /images, or relative paths
- Add onError handler as fallback

### STRICT RULES (ZERO TOLERANCE)
1. **USE FRAMER MOTION**: Every section uses <motion.div> with initial={{opacity:0, y:20}} animate={{opacity:1, y:0}}
2. **NO PLACEHOLDERS**: Use realistic mock data (names, prices, images)
3. **TAILWIND ONLY**: Use advanced Tailwind (bg-clip-text, backdrop-blur, custom shadows)
4. **ERROR AVOIDANCE**: Always use optional chaining (products?.map, user?.name)
5. **SDK FIRST**: Use <ProductCard>, <CheckoutButton>, <FeaturedProducts> from @/components/sellspay

${SDK_DOCUMENTATION}

${ERROR_PREVENTION}

### OUTPUT FORMAT
1. Brief markdown summary (3-6 numbered points)
2. [LOG: Action] tags for transparency (3-5 logs)
3. The marker: \`/// BEGIN_CODE ///\`
4. COMPLETE React TSX starting with \`export default function App()\`

Example:
\`\`\`
/// TYPE: CODE ///
Building a luxury storefront with neon accents.

1. **Hero**: Full-bleed gradient with animated headline
2. **Products**: 3-column grid using FeaturedProducts SDK
3. **About**: CreatorBio component with social links

[LOG: Constructing hero with motion animations...]
[LOG: Integrating FeaturedProducts from SDK...]
[LOG: Adding sticky navigation below hero...]
/// BEGIN_CODE ///
export default function App() {
  // ... complete code
}
\`\`\``;

interface BuilderRequest {
  prompt: string;
  architectPlan: Record<string, unknown>;
  currentCode?: string;
  prunedContext?: string;
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
      currentCode, 
      prunedContext,
      styleProfile,
      healingContext 
    } = await req.json() as BuilderRequest;

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

    // Build the system prompt with design tokens
    let systemPrompt = BUILDER_SYSTEM_PROMPT;
    
    // Inject design tokens based on style profile
    if (styleProfile && DESIGN_TOKENS[styleProfile]) {
      systemPrompt += `\n\n${DESIGN_TOKENS[styleProfile]}`;
    } else if (architectPlan?.vibeAnalysis?.visualStyle) {
      // Try to match from architect's analysis
      const style = String(architectPlan.vibeAnalysis.visualStyle).toLowerCase();
      for (const [key, tokens] of Object.entries(DESIGN_TOKENS)) {
        if (style.includes(key.split('-')[0])) {
          systemPrompt += `\n\n${tokens}`;
          break;
        }
      }
    }

    // Build the user message with all context
    let userMessage = `## User Request\n${prompt}\n`;
    
    if (architectPlan && Object.keys(architectPlan).length > 0) {
      userMessage += `\n## Architect's Plan\n\`\`\`json\n${JSON.stringify(architectPlan, null, 2)}\n\`\`\`\n`;
    }
    
    if (prunedContext) {
      userMessage += `\n## Relevant Existing Code\n\`\`\`tsx\n${prunedContext}\n\`\`\`\n`;
    } else if (currentCode) {
      userMessage += `\n## Current Full Code\n\`\`\`tsx\n${currentCode}\n\`\`\`\n`;
    }
    
    // Self-healing mode: Include FULL error context for targeted fixes
    if (healingContext) {
      userMessage += `\n## 🚨 SELF-HEALING MODE: YOUR PREVIOUS CODE FAILED\n`;
      userMessage += `**Error Type:** ${healingContext.errorType}\n`;
      userMessage += `**Error Message:** ${healingContext.errorMessage}\n`;
      if (healingContext.fixSuggestion) {
        userMessage += `**Fix Suggestion:** ${healingContext.fixSuggestion}\n`;
      }
      userMessage += `\n**Your Previous Failed Code:**\n\`\`\`tsx\n${healingContext.failedCode}\n\`\`\`\n`;
      userMessage += `\n⚠️ IMPORTANT: Fix ONLY the specific error above. Do NOT refactor or change anything else. Output the corrected COMPLETE file.`;
    }

    userMessage += `\n## Final Instructions\nGenerate complete, production-ready React TSX. Follow the Architect's plan exactly. Use SDK components where appropriate.`;

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
        temperature: 0.7,
        max_tokens: 8000,
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

    // Stream the response back to the client
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
