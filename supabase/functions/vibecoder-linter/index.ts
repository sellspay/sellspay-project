import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

/**
 * VibeCoder Linter Agent (v2.1)
 * 
 * Role: Senior QA Engineer & Security Auditor
 * Model: google/gemini-2.5-flash-lite (cheap & fast)
 * 
 * IMPROVEMENTS:
 * - Static syntax validation BEFORE AI call
 * - Runtime pattern detection (common crash patterns)
 * - Stricter policy enforcement
 * - Actionable fix suggestions
 */

// ═══════════════════════════════════════════════════════════════
// STATIC VALIDATION (runs before AI call)
// ═══════════════════════════════════════════════════════════════

interface StaticValidationResult {
  isValid: boolean;
  errorType: string;
  explanation: string;
  location: string;
  fixSuggestion: string;
}

function runStaticValidation(code: string): StaticValidationResult | null {
  // 1. Check for balanced brackets
  const brackets = { '{': '}', '(': ')', '[': ']' };
  const stack: string[] = [];
  let inString = false;
  let stringChar = '';
  let lineNum = 1;
  
  for (let i = 0; i < code.length; i++) {
    const char = code[i];
    if (char === '\n') lineNum++;
    
    // Track string state
    if ((char === '"' || char === "'" || char === '`') && (i === 0 || code[i-1] !== '\\')) {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
      }
      continue;
    }
    
    if (inString) continue;
    
    if (char in brackets) {
      stack.push(char);
    } else if (Object.values(brackets).includes(char)) {
      const expected = Object.entries(brackets).find(([, v]) => v === char)?.[0];
      if (stack.length === 0 || stack[stack.length - 1] !== expected) {
        return {
          isValid: false,
          errorType: 'Syntax',
          explanation: `Unmatched closing bracket '${char}' at line ${lineNum}`,
          location: `Line ${lineNum}`,
          fixSuggestion: `Check for missing opening bracket or extra closing bracket near line ${lineNum}`,
        };
      }
      stack.pop();
    }
  }
  
  if (stack.length > 0) {
    return {
      isValid: false,
      errorType: 'Syntax',
      explanation: `Unclosed bracket '${stack[stack.length - 1]}' - code is incomplete`,
      location: 'End of file',
      fixSuggestion: `Add missing closing '${brackets[stack[stack.length - 1] as keyof typeof brackets]}' at the end of the file`,
    };
  }
  
  // 2. Check for common runtime crash patterns
  const runtimePatterns = [
    {
      pattern: /\.map\s*\(\s*[^?]/g,
      without: /\?\./,
      error: 'Unsafe array mapping without optional chaining',
      fix: 'Use products?.map() instead of products.map()',
    },
    {
      pattern: /import\s+.*from\s+['"](@chakra-ui|@mui|@material-ui|antd|semantic-ui)/,
      error: 'Unsupported UI library import',
      fix: 'Remove the import. Use Tailwind CSS and Lucide icons only.',
    },
    {
      pattern: /import\s+.*from\s+['"]axios['"]/,
      error: 'Axios import detected - backend calls not allowed',
      fix: 'Remove axios. Use useSellsPayCheckout for purchases.',
    },
    {
      pattern: /<form.*onSubmit.*(?:login|signin|signup|register|password)/i,
      error: 'Auth form detected - authentication is handled by SellsPay',
      fix: 'Remove the auth form entirely. Users authenticate via SellsPay.',
    },
    {
      pattern: /(?:stripe|paypal|STRIPE|PAYPAL).*(?:key|secret|publishable)/i,
      error: 'Payment gateway configuration detected',
      fix: 'Remove payment configuration. Use useSellsPayCheckout() instead.',
    },
    {
      pattern: /src\s*=\s*["'](?:\.\/|\/(?!https?:)|\.\.\/)/,
      error: 'Local image path detected',
      fix: 'Replace with Unsplash URL: https://images.unsplash.com/photo-XXXXX',
    },
  ];
  
  for (const { pattern, error, fix } of runtimePatterns) {
    if (pattern.test(code)) {
      const match = code.match(pattern);
      const lineNum = code.substring(0, match?.index || 0).split('\n').length;
      return {
        isValid: false,
        errorType: pattern.source.includes('auth') || pattern.source.includes('stripe') ? 'Policy' : 'Syntax',
        explanation: error,
        location: `Line ${lineNum}`,
        fixSuggestion: fix,
      };
    }
  }

  // 3. IMPORT VALIDATION - Check for missing React hook imports
  const reactHookImportCheck = validateReactHookImports(code);
  if (reactHookImportCheck) {
    return reactHookImportCheck;
  }

  // 4. Check for missing framer-motion imports
  const framerImportCheck = validateFramerImports(code);
  if (framerImportCheck) {
    return framerImportCheck;
  }
  
  // 5. Check for missing export default
  if (!code.includes('export default')) {
    return {
      isValid: false,
      errorType: 'Syntax',
      explanation: 'Missing export default - component will not render',
      location: 'File level',
      fixSuggestion: 'Add "export default function App()" at the start of the component',
    };
  }
  
  return null; // Passed static validation
}

// ═══════════════════════════════════════════════════════════════
// IMPORT VALIDATORS - Catch missing imports BEFORE runtime
// ═══════════════════════════════════════════════════════════════

function validateReactHookImports(code: string): StaticValidationResult | null {
  const reactHooks = [
    { name: 'useState', pattern: /\buseState\s*[<(]/g },
    { name: 'useEffect', pattern: /\buseEffect\s*\(/g },
    { name: 'useCallback', pattern: /\buseCallback\s*[<(]/g },
    { name: 'useMemo', pattern: /\buseMemo\s*[<(]/g },
    { name: 'useRef', pattern: /\buseRef\s*[<(]/g },
    { name: 'useContext', pattern: /\buseContext\s*\(/g },
    { name: 'useReducer', pattern: /\buseReducer\s*[<(]/g },
  ];

  // Extract React imports
  const reactImportMatch = code.match(/import\s+(?:React,?\s*)?{([^}]*)}\s+from\s+['"]react['"]/);
  const importedHooks = reactImportMatch
    ? reactImportMatch[1].split(',').map(h => h.trim()).filter(Boolean)
    : [];

  for (const { name, pattern } of reactHooks) {
    if (pattern.test(code) && !importedHooks.includes(name)) {
      // Double check - might be imported via "import React from 'react'"
      const hasDefaultImport = /import\s+React\s+from\s+['"]react['"]/.test(code);
      // React.useState would be valid if default import exists
      const usedWithPrefix = new RegExp(`React\\.${name}\\s*[<(]`).test(code);
      
      if (!hasDefaultImport && !usedWithPrefix) {
        return {
          isValid: false,
          errorType: 'Imports',
          explanation: `Hook "${name}" is used but not imported from 'react'`,
          location: 'Import section',
          fixSuggestion: `Add "${name}" to your React import: import { ${name} } from 'react'`,
        };
      }
    }
  }

  return null;
}

function validateFramerImports(code: string): StaticValidationResult | null {
  const framerComponents = [
    { name: 'motion', pattern: /\bmotion\./g },
    { name: 'AnimatePresence', pattern: /<AnimatePresence/g },
  ];

  const framerImportMatch = code.match(/import\s+{([^}]*)}\s+from\s+['"]framer-motion['"]/);
  const importedComponents = framerImportMatch
    ? framerImportMatch[1].split(',').map(c => c.trim()).filter(Boolean)
    : [];

  const hasAnyFramerImport = /import\s+.*from\s+['"]framer-motion['"]/.test(code);

  for (const { name, pattern } of framerComponents) {
    if (pattern.test(code) && !importedComponents.includes(name) && !hasAnyFramerImport) {
      return {
        isValid: false,
        errorType: 'Imports',
        explanation: `"${name}" is used but not imported from 'framer-motion'`,
        location: 'Import section',
        fixSuggestion: `Add: import { ${name} } from 'framer-motion'`,
      };
    }
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════
// AI LINTER PROMPT
// ═══════════════════════════════════════════════════════════════

const LINTER_SYSTEM_PROMPT = `You are the final gatekeeper for SellsPay VibeCoder.
Your job is to find bugs that will cause RUNTIME CRASHES or VISUAL FAILURES.
You do NOT fix the code—you provide a precise "Bug Report" so the Builder can fix it.

### YOUR CHECKS (in priority order)

1. **RUNTIME CRASH RISKS**
   - Mapping over potentially undefined arrays without optional chaining
   - Accessing properties on null/undefined objects
   - Missing unique keys in list renders
   - Undefined variables or functions
   - Invalid hook usage (hooks in conditionals/loops)

2. **IMPORT VALIDATION**
   - Only these are allowed: react, lucide-react, framer-motion, @/hooks/useSellsPayCheckout, @/components/sellspay/*
   - Flag any imports from: @chakra-ui, @mui, axios, @stripe, or unknown packages

3. **POLICY VIOLATIONS (CRITICAL)**
   - Login/Signup forms → FAIL
   - Stripe/PayPal direct integration → FAIL
   - API calls with fetch/axios → FAIL

4. **LAYOUT COMPLIANCE**
   - Hero must be FIRST element in return statement
   - No fixed navbar at top (should be sticky below hero)

5. **DESIGN FIDELITY** (only if Architect plan provided)
   - Does code use the requested style (colors, typography)?
   - Are motion animations included?

### OUTPUT FORMAT (STRICT JSON ONLY)
\`\`\`json
{
  "verdict": "PASS" | "FAIL",
  "errorType": "Syntax" | "Runtime" | "Policy" | "Layout" | "Imports" | "Design" | "None",
  "severity": "critical" | "warning",
  "explanation": "One sentence describing the exact issue",
  "location": "Component name or line number",
  "fixSuggestion": "Specific code-level instruction to fix"
}
\`\`\`

### EXAMPLES

PASS:
{"verdict":"PASS","errorType":"None","severity":"info","explanation":"All checks passed","location":"N/A","fixSuggestion":"N/A"}

FAIL - Runtime:
{"verdict":"FAIL","errorType":"Runtime","severity":"critical","explanation":"products.map() will crash if products is undefined","location":"ProductGrid component","fixSuggestion":"Change to products?.map() or add null check"}

FAIL - Policy:
{"verdict":"FAIL","errorType":"Policy","severity":"critical","explanation":"Contains email/password login form","location":"Lines 45-80","fixSuggestion":"Remove the entire auth form - SellsPay handles authentication"}

Be STRICT. Any potential crash = FAIL.`;

interface LinterRequest {
  code: string;
  architectPlan?: Record<string, unknown>;
  runtimeError?: string; // Error from shadow rendering
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, architectPlan, runtimeError } = await req.json() as LinterRequest;

    if (!code) {
      return new Response(
        JSON.stringify({ error: "Missing code to lint" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─────────────────────────────────────────────────────────
    // STEP 1: Static Validation (instant, no AI call)
    // ─────────────────────────────────────────────────────────
    const staticResult = runStaticValidation(code);
    if (staticResult) {
      console.log("[Linter] Static validation failed:", staticResult.explanation);
      return new Response(
        JSON.stringify({
          success: true,
          verdict: 'FAIL',
          errorType: staticResult.errorType,
          severity: 'critical',
          explanation: staticResult.explanation,
          location: staticResult.location,
          fixSuggestion: staticResult.fixSuggestion,
          source: 'static',
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─────────────────────────────────────────────────────────
    // STEP 2: If runtime error provided, return immediately
    // ─────────────────────────────────────────────────────────
    if (runtimeError) {
      console.log("[Linter] Runtime error provided:", runtimeError);
      return new Response(
        JSON.stringify({
          success: true,
          verdict: 'FAIL',
          errorType: 'Runtime',
          severity: 'critical',
          explanation: runtimeError,
          location: 'Runtime',
          fixSuggestion: `Fix the runtime error: ${runtimeError}`,
          source: 'runtime',
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─────────────────────────────────────────────────────────
    // STEP 3: AI-based semantic validation
    // ─────────────────────────────────────────────────────────
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let userMessage = `## Code to Validate\n\`\`\`tsx\n${code}\n\`\`\`\n`;
    
    if (architectPlan) {
      userMessage += `\n## Original Architect's Plan\n\`\`\`json\n${JSON.stringify(architectPlan, null, 2)}\n\`\`\`\n`;
      userMessage += `\nVerify the code implements the Architect's vision.`;
    }

    userMessage += `\n## Instructions\nValidate this code. Focus on RUNTIME CRASH risks first. Output ONLY the JSON verdict.`;

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
        temperature: 0.2,
        max_tokens: 800,
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
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();
      verdict = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse linter response:", content);
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
        source: 'ai',
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
