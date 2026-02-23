import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { ProjectFiles } from './VibecoderPreview';
import { safeApply, saveSnapshot, isMicroEdit as detectMicroEdit } from './codeGuardrails';
/**
 * Completion sentinel that MUST be present in every AI-generated code block.
 * If missing, the output is considered truncated.
 */
export const VIBECODER_COMPLETE_SENTINEL = '// --- VIBECODER_COMPLETE ---';

/**
 * Guard: returns false if the string looks like a JSON envelope or SSE metadata
 * rather than actual TSX/JSX code. Prevents raw JSON from reaching Babel/Sandpack.
 */
function looksLikeCode(chunk: string): boolean {
  if (!chunk || chunk.trim().length < 10) return false;
  const trimmed = chunk.trim();
  if (trimmed.startsWith('{') && trimmed.includes('"files"')) return false;
  if (trimmed.startsWith('{"')) return false;
  if (trimmed.startsWith('event:')) return false;
  return true;
}

// Component markers for modular generation (Multi-Agent Architecture)
export const COMPONENT_START_PATTERN = /\/\/\/\s*COMPONENT_START:\s*(\w+)\s*\/\/\//g;
export const COMPONENT_END_PATTERN = /\/\/\/\s*COMPONENT_END\s*\/\/\//g;

// Regex pattern for extracting live log tags
const LOG_PATTERN = /\[LOG:\s*([^\]]+)\]/g;

// Plan structure returned by the AI in ARCHITECT_MODE
export interface PlanData {
  type: 'plan';
  title: string;
  summary: string;
  steps: string[];
  estimatedTokens?: number;
}

interface UseStreamingCodeOptions {
  onChunk?: (accumulated: string) => void;
  onComplete?: (finalCode: string) => void;
  onChatResponse?: (text: string) => void;
  onPlanResponse?: (plan: PlanData, originalPrompt: string) => void;
  onLogUpdate?: (logs: string[]) => void;
  onSummary?: (summary: string) => void;
  onError?: (error: Error) => void;
  onTruncationDetected?: (truncatedCode: string, originalPrompt: string) => void;
  shouldAbort?: () => boolean;
  getProductsContext?: () => Promise<ProductContext[]>;
  getConversationHistory?: () => Array<{role: string; content: string}>;
  // Phase-based streaming callbacks
  onPhaseChange?: (phase: string) => void;
  onAnalysis?: (text: string) => void;
  onPlanItems?: (items: string[]) => void;
  onStreamSummary?: (text: string) => void;
  onConfidence?: (score: number, reason: string) => void;
  // 2-Stage Analyzer Pipeline callbacks
  onSuggestions?: (suggestions: Array<{ label: string; prompt: string }>) => void;
  onQuestions?: (questions: Array<{ id: string; label: string; type: 'single' | 'multi'; options: Array<{ value: string; label: string }> }>, enhancedPromptSeed?: string) => void;
}

interface ProductContext {
  id: string;
  name: string;
  price: string;
  type: string | null;
  image: string | null;
}

type StreamMode = 'detecting' | 'chat' | 'code' | 'plan';

interface StreamingState {
  isStreaming: boolean;
  code: string;
  /** Multi-file map. When populated, takes precedence over `code` in the preview. */
  files: ProjectFiles;
  error: string | null;
}

// ═══════════════════════════════════════════════════════════════
// MULTI-FILE PARSER: Extract file map from BEGIN_FILES format
// ═══════════════════════════════════════════════════════════════
const BEGIN_FILES_MARKER = '/// BEGIN_FILES ///';
const END_FILES_MARKER = '/// END_FILES ///';
const FILE_MARKER_PATTERN = /\/\/\/\s*FILE:\s*(.+?)\s*\/\/\//g;

/**
 * Parse multi-file output format:
 * /// BEGIN_FILES ///
 * /// FILE: /App.tsx ///
 * <code>
 * /// FILE: /pages/Home.tsx ///
 * <code>
 * /// END_FILES ///
 */
export function parseMultiFileOutput(raw: string): ProjectFiles | null {
  if (!raw.includes(BEGIN_FILES_MARKER)) return null;
  
  const beginIdx = raw.indexOf(BEGIN_FILES_MARKER);
  const endIdx = raw.indexOf(END_FILES_MARKER);
  const content = endIdx >= 0 
    ? raw.substring(beginIdx + BEGIN_FILES_MARKER.length, endIdx) 
    : raw.substring(beginIdx + BEGIN_FILES_MARKER.length);
  
  const files: ProjectFiles = {};
  const fileMatches: Array<{ path: string; index: number }> = [];
  
  let match;
  const pattern = /\/\/\/\s*FILE:\s*(.+?)\s*\/\/\//g;
  while ((match = pattern.exec(content)) !== null) {
    fileMatches.push({ path: match[1].trim(), index: match.index + match[0].length });
  }
  
  if (fileMatches.length === 0) return null;
  
  for (let i = 0; i < fileMatches.length; i++) {
    const start = fileMatches[i].index;
    const end = i + 1 < fileMatches.length 
      ? content.lastIndexOf('///', fileMatches[i + 1].index - 1) 
      : content.length;
    
    let fileCode = content.substring(start, end).trim();
    // Strip sentinel and code fences
    fileCode = fileCode
      .replace(/\/\/\s*---\s*VIBECODER_COMPLETE\s*---/g, '')
      .replace(/^```(?:tsx?|jsx?|javascript|typescript)?\s*\n?/i, '')
      .replace(/\n?```\s*$/i, '')
      .trim();
    
    if (fileCode) {
      const path = fileMatches[i].path.startsWith('/') ? fileMatches[i].path : `/${fileMatches[i].path}`;
      files[path] = fileCode;
    }
  }
  
  return Object.keys(files).length > 0 ? files : null;
}

/**
 * Convert legacy single-file code to a files map
 */
export function codeToFiles(code: string): ProjectFiles {
  return { '/App.tsx': code };
}

/**
 * Extract App.tsx from a files map (backward compat)
 */
export function filesToCode(files: ProjectFiles): string {
  return files['/App.tsx'] || files['App.tsx'] || '';
}

const DEFAULT_CODE = `export default function App() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-violet-500/30 flex items-center justify-center">
          <div className="w-8 h-8 rounded-lg bg-violet-500/50" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white">Vibecoder Ready</h1>
          <p className="text-zinc-400">Describe your vision to start building</p>
        </div>
      </div>
    </div>
  );
}`;

// ------------------------------
// Preview safety: validate TSX before applying
// ------------------------------

const hasTsxEntrypoint = (code: string) =>
  /export\s+default\s+function\s+App\b|export\s+default\s+function\b|export\s+default\b|function\s+App\b|const\s+App\b/.test(code);

/**
 * 🚫 BANNED IMPORTS: These frameworks/modules will crash the Sandpack preview
 */
const BANNED_IMPORT_PATTERNS = [
  { pattern: /from\s+['"]next\//, label: 'Next.js module (next/*)' },
  { pattern: /from\s+['"]next['"]/, label: 'Next.js core' },
  { pattern: /from\s+['"]@next\//, label: 'Next.js scoped module (@next/*)' },
  { pattern: /from\s+['"]vue['"]/, label: 'Vue.js' },
  { pattern: /from\s+['"]@angular\//, label: 'Angular' },
  { pattern: /from\s+['"]svelte['"]/, label: 'Svelte' },
  { pattern: /\bgetServerSideProps\b/, label: 'Next.js getServerSideProps' },
  { pattern: /\bgetStaticProps\b/, label: 'Next.js getStaticProps' },
  { pattern: /\bNextResponse\b/, label: 'Next.js NextResponse' },
  { pattern: /\brequire\s*\(\s*['"]next/, label: 'Next.js require()' },
];

/**
 * Check for banned framework imports. Returns the first violation found, or null.
 */
export const detectBannedImports = (code: string): { label: string; line: number } | null => {
  const lines = code.split('\n');
  for (let i = 0; i < lines.length; i++) {
    for (const { pattern, label } of BANNED_IMPORT_PATTERNS) {
      if (pattern.test(lines[i])) {
        return { label, line: i + 1 };
      }
    }
  }
  return null;
};

/**
 * Check if code has the completion sentinel (indicating full generation)
 */
export const hasCompleteSentinel = (code: string): boolean => {
  return code.includes(VIBECODER_COMPLETE_SENTINEL);
};

/**
 * Strip the completion sentinel from code (it's a marker, not part of the app)
 */
export const stripCompleteSentinel = (code: string): string => {
  return code.replace(new RegExp(VIBECODER_COMPLETE_SENTINEL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*', 'g'), '').trim();
};

/**
 * Detect if code appears truncated (missing sentinel + structural issues)
 */
export const isTruncatedCode = (code: string): boolean => {
  if (!code || code.trim().length < 50) return false;
  
  // If sentinel is present, it's complete
  if (hasCompleteSentinel(code)) return false;
  
  const trimmed = code.trim();
  const lastChar = trimmed.slice(-1);
  
  // Trailing operators or incomplete constructs
  const truncationChars = ['<', '{', '(', '[', ',', ':', '=', '.', '+', '-', '*', '/', '`', '"', "'"];
  if (truncationChars.includes(lastChar)) return true;
  
  // Check for unbalanced braces (strong indicator)
  const openBraces = (code.match(/\{/g) || []).length;
  const closeBraces = (code.match(/\}/g) || []).length;
  if (openBraces > closeBraces + 1) return true;
  
  return false;
};

/**
 * Parse component markers from streamed code
 * Returns array of completed components and any remaining incomplete fragment
 */
interface ParsedComponent {
  name: string;
  code: string;
  isComplete: boolean;
}

export const parseComponentMarkers = (code: string): {
  components: ParsedComponent[];
  remainingFragment: string;
} => {
  const components: ParsedComponent[] = [];
  let remainingFragment = '';
  
  // Reset regex lastIndex
  const startPattern = /\/\/\/\s*COMPONENT_START:\s*(\w+)\s*\/\/\//g;
  const endPattern = /\/\/\/\s*COMPONENT_END\s*\/\/\//g;
  
  let match;
  const startMatches: Array<{ name: string; index: number; endIndex: number }> = [];
  
  // Find all COMPONENT_START markers
  while ((match = startPattern.exec(code)) !== null) {
    startMatches.push({
      name: match[1],
      index: match.index,
      endIndex: match.index + match[0].length
    });
  }
  
  if (startMatches.length === 0) {
    // No component markers - treat entire code as one implicit component
    return { components: [], remainingFragment: code };
  }
  
  for (let i = 0; i < startMatches.length; i++) {
    const startMatch = startMatches[i];
    const nextStartIndex = startMatches[i + 1]?.index ?? code.length;
    
    // Find the COMPONENT_END between this start and the next start (or end of code)
    const searchRegion = code.substring(startMatch.endIndex, nextStartIndex);
    const endMatch = searchRegion.match(/\/\/\/\s*COMPONENT_END\s*\/\/\//);
    
    if (endMatch && endMatch.index !== undefined) {
      // Complete component found
      const componentCode = searchRegion.substring(0, endMatch.index).trim();
      components.push({
        name: startMatch.name,
        code: componentCode,
        isComplete: true
      });
    } else {
      // Incomplete component (no end marker yet)
      const componentCode = searchRegion.trim();
      if (i === startMatches.length - 1) {
        // This is the last component and it's incomplete
        remainingFragment = `/// COMPONENT_START: ${startMatch.name} ///\n${componentCode}`;
      } else {
        // Shouldn't happen - a new start without end for previous
        components.push({
          name: startMatch.name,
          code: componentCode,
          isComplete: false
        });
      }
    }
  }
  
  return { components, remainingFragment };
};

/**
 * Strip component markers from code (they're structural, not app code)
 */
export const stripComponentMarkers = (code: string): string => {
  return code
    .replace(/\/\/\/\s*COMPONENT_START:\s*\w+\s*\/\/\//g, '')
    .replace(/\/\/\/\s*COMPONENT_END\s*\/\/\//g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

/**
 * Lightweight TS/TSX "completeness" check.
 * Goal: prevent obviously-truncated output (e.g. trailing "<" or unterminated strings)
 * from ever replacing the last-known-good preview.
 * 
 * Enhanced with completion sentinel detection for the Multi-Agent Pipeline.
 */
/**
 * Detailed TSX validation result (not just boolean)
 */
interface TsxValidationResult {
  valid: boolean;
  reason?: string;
  line?: number;
}

/**
 * LAYOUT HIERARCHY ENFORCER
 * Ensures the Hero section is ALWAYS rendered before any <nav> or <header> tag.
 * This prevents the AI from generating nav-above-hero layouts.
 */
const enforceHeroFirstLayout = (src: string): TsxValidationResult | null => {
  // Find the return statement's JSX — look for the first JSX-like content after "return ("
  const returnMatch = src.match(/return\s*\(\s*/);
  if (!returnMatch || returnMatch.index === undefined) return null;
  
  const jsxStart = returnMatch.index + returnMatch[0].length;
  const jsxContent = src.substring(jsxStart);
  
  // Find positions of nav tags and hero-like sections in the JSX
  // Only match actual navigation patterns, not generic HTML5 elements like <header>
  const navPattern = /<(?:nav|Navigation|Navbar|NavBar|SiteNav|MainNav)[\s>\/]/;
  const navMatch = jsxContent.match(navPattern);
  
  // Hero patterns: hero in className, id="hero", <Hero, section with hero
  const heroPattern = /(?:className=["'][^"']*hero[^"']*["']|id=["']hero["']|<Hero[\s>\/]|{\/\*.*hero.*\*\/})/i;
  const heroMatch = jsxContent.match(heroPattern);
  
  if (!navMatch || !heroMatch) return null; // Can't determine — let it pass
  
  const navIndex = navMatch.index ?? Infinity;
  const heroIndex = heroMatch.index ?? Infinity;
  
  // If nav appears BEFORE hero in the JSX, it's a violation
  if (navIndex < heroIndex) {
    // Count line number for the nav tag
    const upToNav = src.substring(0, jsxStart + navIndex);
    const lineNum = (upToNav.match(/\n/g) || []).length + 1;
    return {
      valid: false,
      reason: `Layout violation: Navigation/header appears before the Hero section. Hero MUST be the first element. Move the nav below the hero.`,
      line: lineNum,
    };
  }
  
  return null; // Hero is first — all good
};

const validateTsx = (code: string): TsxValidationResult => {
  const src = (code ?? '').trim();
  if (!src) return { valid: false, reason: 'Code is empty' };
  if (!hasTsxEntrypoint(src)) return { valid: false, reason: 'Missing default export or App component' };

  // Check for banned imports FIRST
  const banned = detectBannedImports(src);
  if (banned) {
    return { valid: false, reason: `Banned import detected: ${banned.label}`, line: banned.line };
  }

  // ═══ LAYOUT HIERARCHY CHECK: Hero must come before Nav ═══
  // Find the first <nav or <header tag vs the first hero-like section in JSX
  const layoutCheck = enforceHeroFirstLayout(src);
  if (layoutCheck) {
    return layoutCheck;
  }

  // Common truncation symptom
  const lastChar = src.replace(/\s+$/g, '').slice(-1);
  if (['<', '{', '(', '[', ',', ':', '=', '.', '+', '-', '*', '/'].includes(lastChar)) {
    return { valid: false, reason: `Code appears truncated (ends with "${lastChar}")` };
  }

  // Balance brackets/braces/parens while respecting strings/comments.
  // Uses a template-depth stack to correctly handle ${} inside template literals.
  let paren = 0;
  let brace = 0;
  let bracket = 0;

  let inSingle = false;
  let inDouble = false;
  let inLineComment = false;
  let inBlockComment = false;
  let escaped = false;

  // Stack for template literal nesting depth.
  // When we enter a template literal we push the current brace depth.
  // When we encounter `${` inside a template, we push again.
  // When a `}` brings us back to a stacked depth, we re-enter the template string.
  const templateStack: number[] = [];
  const inTemplate = () => templateStack.length > 0;

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    const n = src[i + 1];

    if (inLineComment) {
      if (c === '\n') inLineComment = false;
      continue;
    }

    if (inBlockComment) {
      if (c === '*' && n === '/') {
        inBlockComment = false;
        i++;
      }
      continue;
    }

    if (inSingle || inDouble) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (c === '\\') {
        escaped = true;
        continue;
      }
      if (inSingle && c === "'") inSingle = false;
      else if (inDouble && c === '"') inDouble = false;
      continue;
    }

    // Inside a template literal body (not inside a ${} expression).
    // We're "in the template body" when the top of the stack equals current brace depth.
    if (inTemplate() && templateStack[templateStack.length - 1] === brace) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (c === '\\') {
        escaped = true;
        continue;
      }
      if (c === '`') {
        // End of this template literal
        templateStack.pop();
        continue;
      }
      if (c === '$' && n === '{') {
        // Enter template expression ${...}
        // Push the brace depth we need to return to (current depth).
        // When a closing } brings brace back to this depth, we re-enter the template body.
        const returnDepth = brace;
        brace++; // count the { from ${
        templateStack.push(returnDepth);
        i++; // skip the {
        continue;
      }
      // Any other character inside template string body — skip
      continue;
    }

    // not inside string/comment/template-body
    if (c === '/' && n === '/') {
      inLineComment = true;
      i++;
      continue;
    }
    if (c === '/' && n === '*') {
      inBlockComment = true;
      i++;
      continue;
    }

    if (c === "'") {
      inSingle = true;
      continue;
    }
    if (c === '"') {
      inDouble = true;
      continue;
    }
    if (c === '`') {
      // Start a new template literal
      templateStack.push(brace);
      continue;
    }

    if (c === '(') paren++;
    else if (c === ')') paren--;
    else if (c === '{') brace++;
    else if (c === '}') {
      brace--;
      // When brace drops back to the depth stored on top of templateStack,
      // we've closed the ${} expression. The template-body handler at the
      // top of the loop will take over on the next iteration — no action needed here.
    }
    else if (c === '[') bracket++;
    else if (c === ']') bracket--;

    if (paren < 0 || brace < 0 || bracket < 0) {
      return { valid: false, reason: `Unbalanced brackets at character ${i}` };
    }
  }

  if (inSingle || inDouble || inTemplate() || inLineComment || inBlockComment) {
    return { valid: false, reason: 'Unterminated string or comment' };
  }

  if (paren !== 0) return { valid: false, reason: `Unbalanced parentheses (${paren > 0 ? 'missing )' : 'extra )'})` };
  if (brace !== 0) return { valid: false, reason: `Unbalanced braces (${brace > 0 ? 'missing }' : 'extra }'})` };
  if (bracket !== 0) return { valid: false, reason: `Unbalanced brackets (${bracket > 0 ? 'missing ]' : 'extra ]'})` };

  if (!/return\s*\(/.test(src) && !/<[A-Za-z]/.test(src)) {
    return { valid: false, reason: 'No JSX return statement found' };
  }

  return { valid: true };
};

const isLikelyCompleteTsx = (code: string): boolean => {
  return validateTsx(code).valid;
};

/**
 * Sanitize navigation patterns that crash in Sandpack's sandboxed iframe.
 * Rewrites window.top.location.href and window.location.href assignments
 * to window.open() which works safely in sandboxed contexts.
 */
const sanitizeNavigation = (code: string): string => {
  // Rewrite all navigation patterns to use postMessage bridge (sandbox-safe)
  let result = code.replace(
    /window\.top\.location\.href\s*=\s*([^;\n]+)/g,
    'window.parent?.postMessage({ type: "VIBECODER_NAVIGATE", url: $1, target: "_self" }, "*")'
  );
  result = result.replace(
    /window\.location\.href\s*=\s*([^;\n]+)/g,
    'window.parent?.postMessage({ type: "VIBECODER_NAVIGATE", url: $1, target: "_self" }, "*")'
  );
  // Rewrite window.open() calls to postMessage — preserve target if specified
  result = result.replace(
    /window\.open\(\s*([^,)]+?)\s*,\s*['"](_(?:self|blank))['"]\s*\)/g,
    'window.parent?.postMessage({ type: "VIBECODER_NAVIGATE", url: $1, target: "$2" }, "*")'
  );
  result = result.replace(
    /window\.open\(\s*([^,)]+?)\s*(?:,\s*['"][^'"]*['"])?\s*\)/g,
    'window.parent?.postMessage({ type: "VIBECODER_NAVIGATE", url: $1, target: "_blank" }, "*")'
  );
  result = result.replace(/target\s*=\s*["']_top["']/g, 'target="_blank"');
  return result;
};

export function useStreamingCode(options: UseStreamingCodeOptions = {}) {
  const [state, setState] = useState<StreamingState>({
    isStreaming: false,
    code: DEFAULT_CODE,
    files: {},
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const originalPromptRef = useRef<string>('');
  const lastGoodCodeRef = useRef<string>(DEFAULT_CODE);

  const streamCode = useCallback(async (prompt: string, currentCode?: string, jobId?: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    const cleanPrompt = prompt.replace(/\[ARCHITECT_MODE_ACTIVE\]\nUser Request:\s*/i, '').split('\n\nINSTRUCTION:')[0].trim();
    originalPromptRef.current = cleanPrompt || prompt;

    setState(prev => ({ ...prev, isStreaming: true, error: null }));

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        throw new Error('Not authenticated');
      }

      let productsContext: ProductContext[] | undefined;
      if (options.getProductsContext) {
        try {
          productsContext = await options.getProductsContext();
        } catch (e) {
          console.warn('Failed to fetch products context:', e);
        }
      }

      const conversationHistory = options.getConversationHistory?.() || [];

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vibecoder-v2`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            prompt,
            currentCode,
            productsContext,
            conversationHistory,
            jobId,
          }),
          signal: abortControllerRef.current.signal,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.error || `Request failed: ${response.status}`;
        
        // Special handling for credit-related errors
        if (response.status === 402 || errorMsg === 'INSUFFICIENT_CREDITS') {
          const creditError = new Error(`INSUFFICIENT_CREDITS: ${errorData.message || 'You don\'t have enough credits for this generation. Please top up to continue.'}`);
          setState(prev => ({ ...prev, isStreaming: false, error: creditError.message }));
          options.onError?.(creditError);
          return lastGoodCodeRef.current;
        }
        
        throw new Error(errorMsg);
      }

      const contentType = response.headers.get('Content-Type') || '';
      const isJsonResponse = contentType.includes('application/json');

      if (isJsonResponse) {
        console.log('[useStreamingCode] JSON response detected - deferring to realtime subscription');
        const jsonData = await response.json().catch(() => ({}));
        console.log('[useStreamingCode] Job status:', jsonData);
        setState(prev => ({ ...prev, isStreaming: false }));
        // Notify phase system that we're in background mode (building via job)
        options.onPhaseChange?.('building');
        return lastGoodCodeRef.current;
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let rawStream = '';
      let mode: StreamMode = 'detecting';

      const seenLogs = new Set<string>();
      const accumulatedLogs: string[] = [];

      const BEGIN_CODE_MARKER = '/// BEGIN_CODE ///';

       const looksLikeJson = (text: string): boolean => {
        const trimmed = text.trim();
        if (!trimmed.startsWith('{')) return false;
        try {
          const parsed = JSON.parse(trimmed);
          return parsed.success !== undefined || parsed.jobId !== undefined || parsed.status !== undefined || parsed.files !== undefined;
        } catch {
          return false;
        }
      };

      /**
       * Attempt to unwrap JSON-wrapped code from the AI model.
       * Some models return `{"files":{"/App.tsx":"<code>"}}` instead of raw TSX.
       */
      const tryUnwrapJsonCode = (text: string): string | null => {
        const trimmed = text.trim();
        if (!trimmed.startsWith('{')) return null;
        try {
          const parsed = JSON.parse(trimmed);
          if (parsed.files && typeof parsed.files === 'object') {
            // Look for /App.tsx or any .tsx file
            const fileKeys = Object.keys(parsed.files);
            const appKey = fileKeys.find(k => k.includes('App.tsx')) || fileKeys[0];
            if (appKey && typeof parsed.files[appKey] === 'string') {
              console.warn('[useStreamingCode] Unwrapped JSON-wrapped code from key:', appKey);
              return parsed.files[appKey];
            }
          }
        } catch {
          // not valid JSON, that's fine
        }
        return null;
      };

      const extractCodeFromRaw = (raw: string): string => {
        // First, check if the entire raw stream is JSON-wrapped code
        const unwrapped = tryUnwrapJsonCode(raw);
        if (unwrapped) return unwrapped;

        if (looksLikeJson(raw)) {
          console.warn('[useStreamingCode] Raw stream looks like JSON - skipping code extraction');
          return '';
        }

        const beginIdx = raw.indexOf(BEGIN_CODE_MARKER);
        const typeIdx = raw.indexOf('/// TYPE: CODE ///');

        let codePart = '';
        if (beginIdx >= 0) {
          codePart = raw.substring(beginIdx + BEGIN_CODE_MARKER.length);
        } else if (typeIdx >= 0) {
          codePart = raw.substring(typeIdx + '/// TYPE: CODE ///'.length);
        } else {
          return '';
        }

        let cleaned = codePart
          .replace(LOG_PATTERN, '')
          .replace(/^```(?:tsx?|jsx?|javascript|typescript)?\s*\n?/i, '')
          .replace(/\n?```\s*$/i, '')
          .trim();

        // Sanitize navigation patterns that crash in Sandpack's sandboxed iframe
        cleaned = sanitizeNavigation(cleaned);

        cleaned = stripCompleteSentinel(cleaned);
        
        // Strip summary section markers if they bled into code
        const summaryIdx = cleaned.indexOf('=== SUMMARY ===');
        if (summaryIdx >= 0) {
          cleaned = cleaned.substring(0, summaryIdx).trim();
        }

        // Check if cleaned result is JSON-wrapped code
        const unwrappedCleaned = tryUnwrapJsonCode(cleaned);
        if (unwrappedCleaned) return unwrappedCleaned;

        if (looksLikeJson(cleaned)) {
          console.warn('[useStreamingCode] Cleaned code looks like JSON - returning empty');
          return '';
        }

        const tsxStartPatterns: RegExp[] = [
          /(^|\n)import\s+[^\n]+/,
          /(^|\n)export\s+default\s+function\s+/, 
          /(^|\n)export\s+function\s+/, 
          /(^|\n)const\s+\w+\s*=\s*\(/,
          /(^|\n)function\s+\w+\s*\(/,
        ];

        let startIdx = -1;
        for (const pattern of tsxStartPatterns) {
          const match = cleaned.match(pattern);
          if (match?.index !== undefined) {
            startIdx = match.index;
            break;
          }
        }

        if (startIdx < 0) {
          return '';
        }

        return cleaned.substring(startIdx).trim();
      };

      const extractSummaryFromRaw = (raw: string): string => {
        // Try new structured format first
        const structuredIdx = raw.indexOf('=== SUMMARY ===');
        if (structuredIdx >= 0) {
          return raw.substring(structuredIdx + '=== SUMMARY ==='.length).trim();
        }
        
        const typeIdx = raw.indexOf('/// TYPE: CODE ///');
        if (typeIdx < 0) {
          return '';
        }

        let endIdx = raw.indexOf(BEGIN_CODE_MARKER);

        if (endIdx < 0) {
          const codePatterns = [
            /\n(export\s+default\s+function)/,
            /\n(export\s+function)/,
            /\n(function\s+\w+)/,
            /\n(const\s+\w+\s*=\s*\()/,
            /\nimport\s+/, 
          ];

          const afterType = raw.substring(typeIdx + '/// TYPE: CODE ///'.length);
          for (const pattern of codePatterns) {
            const match = afterType.match(pattern);
            if (match && match.index !== undefined) {
              endIdx = typeIdx + '/// TYPE: CODE ///'.length + match.index;
              break;
            }
          }
        }

        const summaryEnd = endIdx > typeIdx ? endIdx : raw.length;
        const afterType = raw.substring(typeIdx + '/// TYPE: CODE ///'.length, summaryEnd);

        const cleaned = afterType
          .replace(LOG_PATTERN, '')
          .replace(/```[\s\S]*$/m, '')
          .replace(/\n{3,}/g, '\n\n')
          .trim();

        return cleaned;
      };

      // ═══════════════════════════════════════════════════════════
      // STRUCTURED SSE PARSER: Handle event-typed SSE from edge function
      // ═══════════════════════════════════════════════════════════
      let sseBuffer = '';
      let currentEventType = '';
      let isStructuredSSE = false;
      // Accumulate code_chunk deltas for live preview during streaming
      let streamingCodeBuffer = '';
      let receivedFiles = false;

      const processSSELine = (line: string) => {
        if (line.startsWith('event: ')) {
          currentEventType = line.slice(7).trim();
          isStructuredSSE = true;
          return;
        }
        
        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6).trim();
          
          if (isStructuredSSE && currentEventType) {
            try {
              const data = JSON.parse(dataStr);
              
              switch (currentEventType) {
                case 'phase':
                  options.onPhaseChange?.(data.phase);
                  break;
                case 'text':
                  options.onAnalysis?.(data.content);
                  break;
                case 'plan':
                  options.onPlanItems?.(data.items);
                  break;
                case 'summary':
                  options.onStreamSummary?.(data.content);
                  break;
                case 'raw':
                  rawStream += data.content;
                  break;
                case 'files': {
                  // Multi-file atomic payload from backend (validated server-side for syntax)
                  const projectFiles = data.projectFiles || data.files || {};
                  if (Object.keys(projectFiles).length > 0) {
                    // ═══ GUARDRAILS: Protect against destructive rewrites ═══
                    const appCode = projectFiles['/App.tsx'] || projectFiles['App.tsx'] || '';
                    // Use pre-reset backup if lastGoodCode was reset to DEFAULT_CODE
                    const oldCode = (lastGoodCodeRef.current === DEFAULT_CODE && preResetCodeRef.current)
                      ? preResetCodeRef.current
                      : lastGoodCodeRef.current;
                    if (appCode && oldCode && oldCode.length >= 200) {
                      const guardResult = safeApply(oldCode, appCode, originalPromptRef.current);
                      if (!guardResult.accepted) {
                        console.error('🛡️ MULTI-FILE GUARDRAILS REJECTED:', guardResult.failedGuards.map(f => `${f.guard}: ${f.message}`).join(' | '));
                        // CRITICAL: Restore the old code in state to prevent showing blank/default
                        setState(prev => ({ ...prev, code: oldCode, error: `Code change rejected: ${guardResult.failedGuards[0]?.message || 'Destructive rewrite detected'}` }));
                        options.onError?.(new Error(`Code change rejected: ${guardResult.failedGuards[0]?.message || 'Destructive rewrite detected'}`));
                        receivedFiles = true; // prevent legacy path from running
                        break;
                      }
                    }
                    // Sanitize navigation in all files
                    const sanitizedFiles: Record<string, string> = {};
                    for (const [path, content] of Object.entries(projectFiles)) {
                      sanitizedFiles[path] = sanitizeNavigation(content as string);
                    }
                    setState(prev => ({ ...prev, files: sanitizedFiles, code: '' }));
                    if (appCode) {
                      lastGoodCodeRef.current = appCode;
                    }
                    options.onComplete?.(appCode);
                    receivedFiles = true;
                  }
                  break;
                }
                case 'code_progress': {
                  // Visual feedback during generation (no code applied)
                  // Could update a progress indicator in the future
                  break;
                }
                case 'code_chunk': {
                  // Legacy fallback: only used when JSON parse failed on backend
                  // Skip if we already got files
                  if (receivedFiles) break;
                  streamingCodeBuffer += (data.content || '');

                  // 🔥 Bulletproof: detect JSON files wrapper that slipped through
                  const trimmedBuf = streamingCodeBuffer.trim();
                  if (trimmedBuf.startsWith('{') && trimmedBuf.includes('"files"')) {
                    try {
                      const parsed = JSON.parse(trimmedBuf);
                      const jsonFiles = parsed?.files ?? parsed?.projectFiles;
                      if (jsonFiles && typeof jsonFiles === 'object' && Object.keys(jsonFiles).length > 0) {
                        // ═══ GUARDRAILS: Protect against destructive rewrites ═══
                        const appCode = jsonFiles['/App.tsx'] || jsonFiles['App.tsx'] || '';
                        // Use pre-reset backup if lastGoodCode was reset to DEFAULT_CODE
                        const oldCode = (lastGoodCodeRef.current === DEFAULT_CODE && preResetCodeRef.current)
                          ? preResetCodeRef.current
                          : lastGoodCodeRef.current;
                        if (appCode && oldCode && oldCode.length >= 200) {
                          const guardResult = safeApply(oldCode, appCode, originalPromptRef.current);
                          if (!guardResult.accepted) {
                            console.error('🛡️ CODE_CHUNK GUARDRAILS REJECTED:', guardResult.failedGuards.map(f => `${f.guard}: ${f.message}`).join(' | '));
                            // CRITICAL: Restore the old code in state
                            setState(prev => ({ ...prev, code: oldCode, error: `Code change rejected: ${guardResult.failedGuards[0]?.message || 'Destructive rewrite detected'}` }));
                            options.onError?.(new Error(`Code change rejected: ${guardResult.failedGuards[0]?.message || 'Destructive rewrite detected'}`));
                            receivedFiles = true;
                            streamingCodeBuffer = '';
                            break;
                          }
                        }
                        setState(prev => ({ ...prev, files: jsonFiles, code: '' }));
                        if (appCode) lastGoodCodeRef.current = appCode;
                        options.onComplete?.(appCode);
                        receivedFiles = true;
                        streamingCodeBuffer = '';
                        break;
                      }
                    } catch {
                      // Not complete JSON yet; keep buffering
                    }
                  }

                  // Safety net: if buffer looks like JSON, do NOT inject as code
                  if (trimmedBuf.startsWith('{') && trimmedBuf.includes('"files"')) {
                    // Already handled above or still buffering — never inject raw JSON
                    break;
                  }

                  if (streamingCodeBuffer.length > 100 && looksLikeCode(streamingCodeBuffer)) {
                    setState(prev => ({ ...prev, code: streamingCodeBuffer }));
                  }
                  const cleanChunk = extractCodeFromRaw(streamingCodeBuffer);
                  if (cleanChunk && looksLikeCode(cleanChunk) && isLikelyCompleteTsx(cleanChunk)) {
                    lastGoodCodeRef.current = cleanChunk;
                    setState(prev => ({ ...prev, code: cleanChunk }));
                    options.onChunk?.(cleanChunk);
                  }
                  break;
                }
                case 'error': {
                  const errorCode = data.code || 'UNKNOWN';
                  const errorMsg = data.message || 'An error occurred';
                  console.error(`[useStreamingCode] SSE error [${errorCode}]:`, errorMsg);
                  
                  // ✅ STEP 3: Only trigger truncation handler when backend EXPLICITLY says so
                  if (errorCode === 'TRUNCATION_DETECTED' || errorCode === 'MODEL_TRUNCATED') {
                    console.warn('[useStreamingCode] ⚠️ Backend-confirmed truncation');
                    const partialCode = extractCodeFromRaw(rawStream);
                    if (partialCode && partialCode.length > 200) {
                      options.onTruncationDetected?.(partialCode, originalPromptRef.current);
                    }
                  }
                  
                  options.onError?.(new Error(`[${errorCode}] ${errorMsg}`));
                  break;
                }
                case 'confidence': {
                  const score = data.score ?? 75;
                  const reason = data.reason || '';
                  options.onConfidence?.(score, reason);
                  break;
                }
                case 'suggestions': {
                  // 2-Stage Analyzer: Backend-driven suggestion chips
                  const suggestions = Array.isArray(data) ? data : (data.suggestions || []);
                  options.onSuggestions?.(suggestions);
                  break;
                }
                case 'questions': {
                  // 2-Stage Analyzer: Clarification questions
                  const questions = Array.isArray(data) ? data : (data.questions || []);
                  const promptSeed = data.enhanced_prompt_seed || '';
                  options.onQuestions?.(questions, promptSeed);
                  break;
                }
              }
            } catch {
              rawStream += dataStr;
            }
            currentEventType = '';
            return;
          }
          
          // Fallback: not structured SSE, treat as raw text
          rawStream += dataStr;
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        sseBuffer += chunk;

        const sseLines = sseBuffer.split('\n');
        sseBuffer = sseLines.pop() || '';

        for (const line of sseLines) {
          const trimmed = line.trim();
          if (trimmed === '') {
            currentEventType = '';
            continue;
          }
          processSSELine(trimmed);
        }

        // Extract logs from raw stream (backward compat)
        const logMatches = rawStream.matchAll(LOG_PATTERN);
        for (const match of logMatches) {
          const logText = match[1].trim();
          if (!seenLogs.has(logText)) {
            seenLogs.add(logText);
            accumulatedLogs.push(logText);
            options.onLogUpdate?.([...accumulatedLogs]);
          }
        }

        if (mode === 'detecting' && rawStream.trim().startsWith('{') && rawStream.length > 50) {
          if (looksLikeJson(rawStream)) {
            console.warn('[useStreamingCode] JSON detected in stream - aborting code extraction');
            setState(prev => ({ ...prev, isStreaming: false }));
            return lastGoodCodeRef.current;
          }
        }

        if (mode === 'detecting') {
          if (rawStream.includes('/// TYPE: CHAT ///')) {
            mode = 'chat';
            setState(prev => ({ ...prev, isStreaming: false }));
          } else if (rawStream.includes('/// TYPE: PLAN ///')) {
            mode = 'plan';
            setState(prev => ({ ...prev, isStreaming: false }));
          } else if (rawStream.includes('/// TYPE: CODE ///')) {
            mode = 'code';
          } else if (rawStream.length > 120) {
            if (looksLikeJson(rawStream)) {
              console.warn('[useStreamingCode] JSON detected before mode fallback - aborting');
              setState(prev => ({ ...prev, isStreaming: false }));
              return lastGoodCodeRef.current;
            }
            mode = 'code';
          }
        }

        if (mode === 'chat' || mode === 'plan') {
          continue;
        }

        if (mode === 'code') {
          const cleanCode = extractCodeFromRaw(rawStream);

          if (cleanCode && looksLikeCode(cleanCode) && isLikelyCompleteTsx(cleanCode)) {
            lastGoodCodeRef.current = cleanCode;
            setState(prev => ({ ...prev, code: cleanCode }));
            options.onChunk?.(cleanCode);
          }
        }
      }

      // ═══════════════════════════════════════════════════════════
      // TERMINAL EVENT CHECK: If structured SSE was used but no terminal
      // event was received, treat as failure
      // ═══════════════════════════════════════════════════════════
      if (isStructuredSSE && !rawStream.includes('/// TYPE:')) {
        // We were in structured SSE mode - check if we got a terminal event
        // The phase callbacks would have fired 'complete' or 'error'
        // If neither fired and stream ended, it's an unexpected close
        const gotCompletePhase = rawStream.length === 0; // raw is empty when structured SSE handled everything
        if (!gotCompletePhase && rawStream.trim().length < 50) {
          const err = new Error('Stream ended unexpectedly. Please retry.');
          setState(prev => ({ ...prev, isStreaming: false, error: err.message }));
          options.onError?.(err);
          return lastGoodCodeRef.current;
        }
      }

      if (mode === 'chat') {
        const chatText = rawStream.replace('/// TYPE: CHAT ///', '').trim();
        setState(prev => ({ ...prev, isStreaming: false }));
        options.onChatResponse?.(chatText);
        return chatText;
      }

      if (mode === 'plan') {
        const planText = rawStream.replace('/// TYPE: PLAN ///', '').trim();
        setState(prev => ({ ...prev, isStreaming: false }));

        try {
          const jsonMatch = planText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const planData: PlanData = JSON.parse(jsonMatch[0]);
            options.onPlanResponse?.(planData, originalPromptRef.current);
            return planData;
          }
        } catch (e) {
          console.error('Failed to parse plan JSON:', e);
          options.onChatResponse?.(planText);
        }
        return planText;
      }

      // ═══════════════════════════════════════════════════════════
      // MULTI-FILE FAST PATH: If we received files via atomic JSON event,
      // guardrails were already checked in the event handler above.
      // Skip legacy single-file extraction.
      // ═══════════════════════════════════════════════════════════
      if (receivedFiles) {
        setState(prev => ({ ...prev, isStreaming: false }));
        return lastGoodCodeRef.current;
      }

      const aiSummary = extractSummaryFromRaw(rawStream);
      if (aiSummary) {
        options.onSummary?.(aiSummary);
      }

      const finalCode = extractCodeFromRaw(rawStream);

      // ═══════════════════════════════════════════════════════════
      // STEP 3: Fix false TRUNCATION_DETECTED
      // Only treat as truncation when the backend explicitly sends it (via SSE event).
      // Otherwise, show the real failure reason (VALIDATION_FAILED, STREAM_ENDED_EARLY, etc.)
      // ═══════════════════════════════════════════════════════════
      
      if (!finalCode || !isLikelyCompleteTsx(finalCode)) {
        // Get specific validation reason
        const validation = finalCode ? validateTsx(finalCode) : { valid: false, reason: 'No code extracted from AI response' };
        const specificReason = validation.reason || 'Unknown validation failure';
        const lineInfo = validation.line ? ` (line ${validation.line})` : '';

        // ✅ STEP 3: Do NOT auto-trigger Ghost Fixer based on missing sentinel.
        // The sentinel check was causing false TRUNCATION_DETECTED errors on short/simple
        // requests. Only the backend should decide if output was truncated.
        // If the backend sent a truncation event, it would have been handled in processSSELine.
        
        // Determine the correct error code based on what actually happened
        let errorCode = 'VALIDATION_FAILED';
        if (!finalCode && rawStream.trim().length > 0) {
          errorCode = 'NO_CODE_EXTRACTED';
        } else if (finalCode && finalCode.length < 50) {
          errorCode = 'INCOMPLETE_OUTPUT';
        }

        const err = new Error(`[${errorCode}] ${specificReason}${lineInfo}. Your storefront was preserved.`);
        console.warn(`[useStreamingCode] ❌ ${errorCode}: ${specificReason}${lineInfo}`);
        setState(prev => ({ ...prev, isStreaming: false, error: err.message, code: lastGoodCodeRef.current }));
        options.onError?.(err);
        return lastGoodCodeRef.current;
      }

      // ═══════════════════════════════════════════════════════════
      // 🛡️ PRESERVATION GUARDRAILS v2: Enterprise-grade protection
      // ═══════════════════════════════════════════════════════════
      // Use pre-reset backup if lastGoodCode was reset to DEFAULT_CODE
      const effectiveLastGood = (lastGoodCodeRef.current === DEFAULT_CODE && preResetCodeRef.current)
        ? preResetCodeRef.current
        : lastGoodCodeRef.current;
      const previousCode = currentCode || effectiveLastGood;

      // Auto-snapshot before every apply attempt
      saveSnapshot(previousCode, prompt);

      // Parse confidence from stream if available
      let streamConfidence: number | undefined;
      const confidenceMatch = rawStream.match(/\[CONFIDENCE[:\s]*(\d+)\]/i);
      if (confidenceMatch) {
        streamConfidence = parseInt(confidenceMatch[1], 10);
      }

      const guardResult = safeApply(previousCode, finalCode, prompt, streamConfidence);

      if (!guardResult.accepted) {
        const guardNames = guardResult.failedGuards.map(g => g.guard).join(', ');
        const guardMessages = guardResult.failedGuards.map(g => g.message).join(' ');
        const isMicro = detectMicroEdit(prompt);

        console.error(`🛡️ GUARDRAILS REJECTED [${guardNames}]:`, guardMessages);

        const userMessage = isMicro
          ? `Generation rejected: a small request caused excessive changes. Your storefront was preserved. Try being more specific (e.g., "make the product cards clickable" instead of "fix products").`
          : `Generation rejected: the AI attempted to rewrite too much of your code. Your storefront was preserved. Please try a more targeted request.`;

        const err = new Error(userMessage);
        setState(prev => ({ ...prev, isStreaming: false, error: err.message, code: lastGoodCodeRef.current }));
        options.onError?.(err);
        return lastGoodCodeRef.current;
      }

      // ═══════════════════════════════════════════════════════════
      // STEP 4: Suspicious output guard — if the model returned very short code
      // but the previous file was large, this is likely a destructive rewrite.
      // Block it and require explicit user confirmation.
      // ═══════════════════════════════════════════════════════════
      const prevLineCount = previousCode ? previousCode.split('\n').length : 0;
      const newLineCount = finalCode.split('\n').length;
      if (prevLineCount > 100 && newLineCount < 200 && newLineCount < prevLineCount * 0.4) {
        const suspiciousMsg = `Suspicious output: AI returned ${newLineCount} lines replacing ${prevLineCount} lines. This looks like a destructive rewrite. Your storefront was preserved. Try a more specific request, or say "rewrite from scratch" if intended.`;
        console.warn(`🛡️ SUSPICIOUS OUTPUT GUARD: ${newLineCount} lines vs ${prevLineCount} lines`);
        const err = new Error(suspiciousMsg);
        setState(prev => ({ ...prev, isStreaming: false, error: err.message, code: lastGoodCodeRef.current }));
        options.onError?.(err);
        return lastGoodCodeRef.current;
      }
      // ═══════════════════════════════════════════════════════════

      if (options.shouldAbort?.()) {
        console.warn('🛑 Aborted: Project changed during generation - discarding result');
        setState(prev => ({ ...prev, isStreaming: false }));
        return lastGoodCodeRef.current;
      }

      lastGoodCodeRef.current = finalCode;
      preResetCodeRef.current = null; // Clear backup — real code accepted
      setState(prev => ({ ...prev, isStreaming: false, code: finalCode }));
      options.onComplete?.(finalCode);

      return finalCode;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        setState(prev => ({ ...prev, isStreaming: false }));
        return lastGoodCodeRef.current;
      }

      const err = error instanceof Error ? error : new Error('Unknown error');
      setState(prev => ({ ...prev, isStreaming: false, error: err.message }));
      options.onError?.(err);
      throw err;
    }
  }, [options]);

  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setState(prev => ({ ...prev, isStreaming: false }));
  }, []);

  // SAFETY: Store a backup of lastGoodCode before reset, so we can
  // restore guardrail protection if a generation starts immediately after.
  const preResetCodeRef = useRef<string | null>(null);

  const resetCode = useCallback(() => {
    // Save pre-reset code so guardrails can use it as baseline even after reset
    if (lastGoodCodeRef.current !== DEFAULT_CODE && lastGoodCodeRef.current.length > 200) {
      preResetCodeRef.current = lastGoodCodeRef.current;
    }
    lastGoodCodeRef.current = DEFAULT_CODE;
    setState({
      isStreaming: false,
      code: DEFAULT_CODE,
      files: {},
      error: null,
    });
  }, []);

  const setCode = useCallback((code: string, skipValidation = false) => {
    // First, check if the code is JSON-wrapped (e.g., {"files":{"/App.tsx":"..."}})
    // This can happen when background jobs or DB snapshots store JSON-wrapped code
    let rawCode = code;
    const trimmedRaw = rawCode.trim();
    if (trimmedRaw.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmedRaw);
        if (parsed.files && typeof parsed.files === 'object') {
          const fileKeys = Object.keys(parsed.files);
          const appKey = fileKeys.find(k => k.includes('App.tsx')) || fileKeys[0];
          if (appKey && typeof parsed.files[appKey] === 'string') {
            console.warn('[useStreamingCode] setCode: Unwrapped JSON-wrapped code from key:', appKey);
            rawCode = parsed.files[appKey];
          }
        }
      } catch {
        // Not JSON, proceed normally
      }
    }

    // Strip sentinel before validation (it's a marker, not app code)
    let cleaned = stripCompleteSentinel(rawCode);

    // Strip /// TYPE: CODE /// preamble that may be stored in code_snapshot.
    // Also handle /// BEGIN_CODE /// marker that separates explanation from actual code.
    const beginCodeIdx = cleaned.indexOf('/// BEGIN_CODE ///');
    if (beginCodeIdx >= 0) {
      // Fast path: everything after /// BEGIN_CODE /// is the actual code
      cleaned = cleaned.substring(beginCodeIdx + '/// BEGIN_CODE ///'.length).trim();
    } else {
      const typeCodeIdx = cleaned.indexOf('/// TYPE: CODE ///');
      if (typeCodeIdx >= 0) {
        const afterMarker = cleaned.substring(typeCodeIdx + '/// TYPE: CODE ///'.length);
        const codeStartPatterns = [
          /(^|\n)(import\s+)/,
          /(^|\n)(export\s+default\s+function\s+)/,
          /(^|\n)(export\s+function\s+)/,
          /(^|\n)(const\s+\w+\s*=\s*\()/,
          /(^|\n)(function\s+\w+\s*\()/,
        ];
        let codeStart = -1;
        for (const pattern of codeStartPatterns) {
          const match = afterMarker.match(pattern);
          if (match?.index !== undefined) {
            codeStart = match.index;
            break;
          }
        }
        if (codeStart >= 0) {
          cleaned = afterMarker.substring(codeStart).trim();
        }
      }
    }

    // Also strip === SUMMARY === suffix if it bled in
    const summaryIdx = cleaned.indexOf('=== SUMMARY ===');
    if (summaryIdx >= 0) {
      cleaned = cleaned.substring(0, summaryIdx).trim();
    }

    // Strip [LOG: ...] tags
    cleaned = cleaned.replace(/\[LOG:\s*[^\]]+\]/g, '').trim();

    const codeWithoutSentinel = cleaned;

    // When restoring from DB, skip validation — the code was already validated before saving.
    // This prevents false rejections from validator edge cases (template literals, etc.)
    if (!skipValidation) {
      const validation = validateTsx(codeWithoutSentinel);
      if (!validation.valid) {
        const reason = validation.reason || 'Invalid TSX';
        const lineInfo = validation.line ? ` (line ${validation.line})` : '';
        console.warn(`[useStreamingCode] Refusing to apply TSX: ${reason}${lineInfo}`);
        setState(prev => ({
          ...prev,
          code: lastGoodCodeRef.current,
          error: `Code rejected: ${reason}${lineInfo}. Kept last working preview.`,
        }));
        return;
      }
    } else {
      // Even with skipValidation, do a basic sanity check
      if (!codeWithoutSentinel || codeWithoutSentinel.trim().length < 20 || !hasTsxEntrypoint(codeWithoutSentinel)) {
        console.warn('[useStreamingCode] Restored code failed basic sanity check — keeping default');
        return;
      }
    }

    lastGoodCodeRef.current = codeWithoutSentinel;
    preResetCodeRef.current = null; // Clear backup since we have real code now
    setState(prev => ({ ...prev, code: codeWithoutSentinel, files: codeToFiles(codeWithoutSentinel), error: null }));
  }, []);

  /** Set multi-file project map directly */
  const setFiles = useCallback((files: ProjectFiles) => {
    const appCode = filesToCode(files);
    if (appCode) {
      lastGoodCodeRef.current = stripCompleteSentinel(appCode);
      preResetCodeRef.current = null; // Clear backup since we have real code now
    }
    setState(prev => ({ ...prev, files, code: appCode || prev.code, error: null }));
  }, []);

  const forceResetStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setState(prev => ({ ...prev, isStreaming: false, error: null }));
  }, []);

  return {
    ...state,
    streamCode,
    cancelStream,
    resetCode,
    setCode,
    setFiles,
    forceResetStreaming,
    DEFAULT_CODE,
  };
}
