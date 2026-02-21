import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { ProjectFiles } from './VibecoderPreview';
/**
 * Completion sentinel that MUST be present in every AI-generated code block.
 * If missing, the output is considered truncated.
 */
export const VIBECODER_COMPLETE_SENTINEL = '// --- VIBECODER_COMPLETE ---';

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
  onTruncationDetected?: (truncatedCode: string, originalPrompt: string) => void; // NEW: Ghost Fixer trigger
  shouldAbort?: () => boolean;
  getProductsContext?: () => Promise<ProductContext[]>;
  getConversationHistory?: () => Array<{role: string; content: string}>;
  // NEW: Phase-based streaming callbacks
  onPhaseChange?: (phase: string) => void;
  onAnalysis?: (text: string) => void;
  onPlanItems?: (items: string[]) => void;
  onStreamSummary?: (text: string) => void;
  onConfidence?: (score: number, reason: string) => void;
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
const isLikelyCompleteTsx = (code: string): boolean => {
  const src = (code ?? '').trim();
  if (!src) return false;
  if (!hasTsxEntrypoint(src)) return false;

  // Common truncation symptom seen in the screenshot
  const lastChar = src.replace(/\s+$/g, '').slice(-1);
  if (['<', '{', '(', '[', ',', ':', '=', '.', '+', '-', '*', '/'].includes(lastChar)) {
    return false;
  }

  // Balance brackets/braces/parens while respecting strings/comments.
  let paren = 0;
  let brace = 0;
  let bracket = 0;

  let inSingle = false;
  let inDouble = false;
  let inTemplate = false;
  let inLineComment = false;
  let inBlockComment = false;
  let escaped = false;

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

    if (inSingle || inDouble || inTemplate) {
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
      else if (inTemplate && c === '`') inTemplate = false;
      continue;
    }

    // not inside string/comment
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
      inTemplate = true;
      continue;
    }

    if (c === '(') paren++;
    else if (c === ')') paren--;
    else if (c === '{') brace++;
    else if (c === '}') brace--;
    else if (c === '[') bracket++;
    else if (c === ']') bracket--;

    if (paren < 0 || brace < 0 || bracket < 0) return false;
  }

  // If we ended inside a string/comment, it's truncated.
  if (inSingle || inDouble || inTemplate || inLineComment || inBlockComment) return false;

  // Must be balanced
  if (paren !== 0 || brace !== 0 || bracket !== 0) return false;

  // JSX should at least contain a return with a tag
  if (!/return\s*\(/.test(src) && !/<[A-Za-z]/.test(src)) return false;

  return true;
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
        throw new Error(errorData.error || `Request failed: ${response.status}`);
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
          return parsed.success !== undefined || parsed.jobId !== undefined || parsed.status !== undefined;
        } catch {
          return false;
        }
      };

      const extractCodeFromRaw = (raw: string): string => {
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

        cleaned = stripCompleteSentinel(cleaned);
        
        // Strip summary section markers if they bled into code
        const summaryIdx = cleaned.indexOf('=== SUMMARY ===');
        if (summaryIdx >= 0) {
          cleaned = cleaned.substring(0, summaryIdx).trim();
        }

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
                case 'code_chunk': {
                  // Accumulate code deltas for live preview during streaming
                  streamingCodeBuffer += (data.content || '');
                  // Progressive preview: show partial code immediately (no completeness gate during streaming)
                  if (streamingCodeBuffer.length > 100) {
                    setState(prev => ({ ...prev, code: streamingCodeBuffer }));
                  }
                  // Also try to extract clean code for last-good-ref
                  const cleanChunk = extractCodeFromRaw(streamingCodeBuffer);
                  if (cleanChunk && isLikelyCompleteTsx(cleanChunk)) {
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
                  options.onError?.(new Error(`[${errorCode}] ${errorMsg}`));
                  break;
                }
                case 'confidence': {
                  const score = data.score ?? 75;
                  const reason = data.reason || '';
                  options.onConfidence?.(score, reason);
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

          if (cleanCode && isLikelyCompleteTsx(cleanCode)) {
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

      const aiSummary = extractSummaryFromRaw(rawStream);
      if (aiSummary) {
        options.onSummary?.(aiSummary);
      }

      const finalCode = extractCodeFromRaw(rawStream);

      // 🛡️ MULTI-AGENT PIPELINE: Check for completion sentinel
      // If code looks valid structurally but is missing the sentinel, it may be truncated
      const hasSentinel = hasCompleteSentinel(rawStream);
      
      if (!finalCode || !isLikelyCompleteTsx(finalCode)) {
        // Check if this is a truncation case that Ghost Fixer should handle
        if (finalCode && finalCode.length > 200 && !hasSentinel) {
          console.warn('[useStreamingCode] ⚠️ Truncation detected - triggering Ghost Fixer');
          options.onTruncationDetected?.(finalCode, originalPromptRef.current);
        }
        
        const err = new Error('Generated code was incomplete/invalid; kept last working preview.');
        console.warn('[useStreamingCode] Invalid final TSX - keeping last known good snapshot');
        setState(prev => ({ ...prev, isStreaming: false, error: err.message, code: lastGoodCodeRef.current }));
        options.onError?.(err);
        return lastGoodCodeRef.current;
      }

      if (options.shouldAbort?.()) {
        console.warn('🛑 Aborted: Project changed during generation - discarding result');
        setState(prev => ({ ...prev, isStreaming: false }));
        return lastGoodCodeRef.current;
      }

      lastGoodCodeRef.current = finalCode;
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

  const resetCode = useCallback(() => {
    lastGoodCodeRef.current = DEFAULT_CODE;
    setState({
      isStreaming: false,
      code: DEFAULT_CODE,
      files: {},
      error: null,
    });
  }, []);

  const setCode = useCallback((code: string) => {
    // Strip sentinel before validation (it's a marker, not app code)
    const codeWithoutSentinel = stripCompleteSentinel(code);
    
    if (!isLikelyCompleteTsx(codeWithoutSentinel)) {
      console.warn('[useStreamingCode] Refusing to apply invalid TSX snapshot; keeping last known-good code');
      setState(prev => ({
        ...prev,
        code: lastGoodCodeRef.current,
        error: 'Invalid code snapshot blocked (kept last working preview).',
      }));
      return;
    }

    lastGoodCodeRef.current = codeWithoutSentinel;
    setState(prev => ({ ...prev, code: codeWithoutSentinel, files: codeToFiles(codeWithoutSentinel), error: null }));
  }, []);

  /** Set multi-file project map directly */
  const setFiles = useCallback((files: ProjectFiles) => {
    const appCode = filesToCode(files);
    if (appCode) {
      lastGoodCodeRef.current = stripCompleteSentinel(appCode);
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
