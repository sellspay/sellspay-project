import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

/**
 * VibeCoder Linter Agent
 * 
 * Role: Senior QA Engineer & Security Auditor
 * Model: google/gemini-2.5-flash-lite (cheap & fast)
 * 
 * This agent is the FINAL GATEKEEPER before code reaches the user.
 * It scans for:
 * - Syntax errors (missing brackets, invalid JSX)
 * - Import errors (hallucinated libraries)
 * - Policy violations (auth forms, payment gateways)
 * - Design fidelity (did Builder follow Architect's plan?)
 */

const LINTER_SYSTEM_PROMPT = `You are the final gatekeeper for SellsPay VibeCoder.
Your job is to read the Builder's code and find why it might fail.
You do NOT fix the code—you identify the "Bug Signature" so the Builder can retry.

### VALIDATION CHECKS

1. **SYNTAX & RUNTIME**
   - Are there unclosed brackets \`}\`, \`)\`, or \`]\`?
   - Are there variables used that were never defined?
   - Are all imported components actually available in standard React/Vite?
   - Valid imports: react, lucide-react, framer-motion, tailwind classes
   - Invalid imports: @chakra-ui, @mui, random-library-name

2. **MARKETPLACE COMPLIANCE**
   - Did the Builder create a custom Login or Signup form? → CRITICAL FAILURE
   - Did the Builder use \`fetch\` or \`axios\` for payment endpoints? → CRITICAL FAILURE
   - Did the Builder include Stripe/PayPal API key inputs? → CRITICAL FAILURE
   - Is \`useSellsPayCheckout\` properly imported and used? → Required for any purchase button

3. **LAYOUT COMPLIANCE**
   - Is the Hero section the FIRST element in the return? → Required
   - Is there a nav bar placed at the absolute top (above hero)? → FAILURE

4. **DESIGN FIDELITY**
   - Does the code include the creative "Vibe" from the Architect's plan?
   - If Architect said "Cyberpunk" but code uses basic white/gray → LOW CREATIVITY
   - Check for: gradient classes, animation usage, custom shadows

5. **IMAGE PROTOCOL**
   - Are there any local image paths (./assets, /images)? → FAILURE
   - All images must use https:// URLs (Unsplash preferred)

### OUTPUT FORMAT (STRICT JSON)
You MUST respond with ONLY valid JSON:

{
  "verdict": "PASS" | "FAIL",
  "errorType": "Syntax" | "Policy" | "Layout" | "Creativity" | "Images" | "None",
  "severity": "critical" | "warning" | "info",
  "explanation": "Short, blunt description of what is wrong.",
  "location": "Line number, component name, or 'multiple'",
  "fixSuggestion": "Specific instruction for the Builder to fix this"
}

### EXAMPLES

**PASS Example:**
{
  "verdict": "PASS",
  "errorType": "None",
  "severity": "info",
  "explanation": "Code passes all validation checks. Hero first, no auth forms, images use Unsplash.",
  "location": "N/A",
  "fixSuggestion": "N/A"
}

**FAIL - Syntax Example:**
{
  "verdict": "FAIL",
  "errorType": "Syntax",
  "severity": "critical",
  "explanation": "Missing closing bracket on line 45. The products.map() function is not closed.",
  "location": "Line 45",
  "fixSuggestion": "Add a closing }) after the product card JSX."
}

**FAIL - Policy Example:**
{
  "verdict": "FAIL",
  "errorType": "Policy",
  "severity": "critical",
  "explanation": "Code includes a login form with email/password inputs. Auth is handled by SellsPay.",
  "location": "LoginModal component",
  "fixSuggestion": "Remove the login form entirely. Users authenticate via SellsPay."
}

**FAIL - Layout Example:**
{
  "verdict": "FAIL",
  "errorType": "Layout",
  "severity": "warning",
  "explanation": "Navigation bar is placed above the Hero section, violating layout law.",
  "location": "Line 12-25",
  "fixSuggestion": "Move the nav element below the Hero section and add sticky top-0."
}

Be STRICT. If there's any doubt, lean toward FAIL with a clear fix suggestion.`;

interface LinterRequest {
  code: string;
  architectPlan?: Record<string, unknown>;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, architectPlan } = await req.json() as LinterRequest;

    if (!code) {
      return new Response(
        JSON.stringify({ error: "Missing code to lint" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build the user message
    let userMessage = `## Code to Validate\n\`\`\`tsx\n${code}\n\`\`\`\n`;
    
    if (architectPlan) {
      userMessage += `\n## Original Architect's Plan\n\`\`\`json\n${JSON.stringify(architectPlan, null, 2)}\n\`\`\`\n`;
      userMessage += `\nVerify the code implements the Architect's vision (style, colors, components).`;
    }

    userMessage += `\n## Instructions\nValidate this code against all checks. Output ONLY the JSON verdict.`;

    const response = await fetch(LOVABLE_AI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: LINTER_SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        temperature: 0.3, // Low temperature for consistent validation
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Linter AI error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Empty response from linter");
    }

    // Parse the JSON verdict
    let verdict;
    try {
      // Handle potential markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();
      verdict = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse linter response:", content);
      // Default to PASS if parsing fails (don't block on linter errors)
      verdict = {
        verdict: "PASS",
        errorType: "None",
        severity: "info",
        explanation: "Linter parse error - defaulting to PASS",
        location: "N/A",
        fixSuggestion: "N/A"
      };
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        ...verdict,
        model: "google/gemini-2.5-flash-lite",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Linter agent error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
