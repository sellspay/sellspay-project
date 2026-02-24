/**
 * Transpile Validator — ZERO-TRUST Layer 6
 * 
 * Validates that all TSX/TS files are syntactically valid before
 * committing to the DB snapshot. Prevents broken code from being
 * persisted as `last_valid_files`.
 * 
 * This is a lightweight syntax check (no Babel dependency) that catches:
 * - Unbalanced braces, parens, brackets
 * - Unterminated strings / template literals
 * - Truncation artifacts (trailing operators)
 * - Malformed JSX (unclosed tags)
 * - Malformed style objects (common AI generation error)
 */

export interface TranspileCheckResult {
  valid: boolean;
  errors: Array<{ file: string; error: string }>;
}

/**
 * Validate a single file's syntax.
 * Returns null if valid, or an error string if invalid.
 */
export function validateFileSyntax(content: string, filePath: string): string | null {
  if (!content || content.trim().length === 0) {
    return 'Empty file';
  }

  // Only validate code files
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts') && !filePath.endsWith('.jsx') && !filePath.endsWith('.js')) {
    return null; // Skip non-code files (CSS, JSON, etc.)
  }

  // 1. Brace/paren/bracket balance (string & comment aware)
  const balanceResult = checkBalance(content);
  if (balanceResult) return balanceResult;

  // 2. Unterminated strings
  const stringResult = checkStrings(content);
  if (stringResult) return stringResult;

  // 3. Truncation detection (trailing operators)
  const trimmed = content.trim();
  const lastChar = trimmed.slice(-1);
  const truncationChars = ['{', '(', '[', ',', ':', '=', '.', '+', '-', '*', '/'];
  if (truncationChars.includes(lastChar)) {
    return `Code appears truncated — ends with "${lastChar}"`;
  }

  // 4. Malformed style objects (common AI error: duplicated URLs in backgroundImage)
  const malformedStyle = checkMalformedStyles(content);
  if (malformedStyle) return malformedStyle;

  // 5. JSX tag balance (catches "Unterminated JSX contents")
  if (filePath.endsWith('.tsx') || filePath.endsWith('.jsx')) {
    const jsxResult = checkJsxTagBalance(content);
    if (jsxResult) return jsxResult;
  }

  return null;
}

/**
 * Validate all files in a file map.
 * Returns a result with all errors found.
 */
export function validateAllFiles(files: Record<string, string>): TranspileCheckResult {
  const errors: Array<{ file: string; error: string }> = [];

  for (const [path, content] of Object.entries(files)) {
    if (typeof content !== 'string') continue;
    const error = validateFileSyntax(content, path);
    if (error) {
      errors.push({ file: path, error });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ─── Internal Helpers ────────────────────────────────────────

function checkBalance(code: string): string | null {
  let braces = 0;
  let parens = 0;
  let brackets = 0;

  let inSingle = false;
  let inDouble = false;
  let inTemplate = false;
  let inLineComment = false;
  let inBlockComment = false;
  let escaped = false;

  for (let i = 0; i < code.length; i++) {
    const c = code[i];
    const n = code[i + 1];

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
      if (escaped) { escaped = false; continue; }
      if (c === '\\') { escaped = true; continue; }
      if (inSingle && c === "'") inSingle = false;
      else if (inDouble && c === '"') inDouble = false;
      else if (inTemplate && c === '`') inTemplate = false;
      continue;
    }

    if (c === '/' && n === '/') { inLineComment = true; i++; continue; }
    if (c === '/' && n === '*') { inBlockComment = true; i++; continue; }
    if (c === "'") { inSingle = true; continue; }
    if (c === '"') { inDouble = true; continue; }
    if (c === '`') { inTemplate = true; continue; }

    if (c === '{') braces++;
    else if (c === '}') braces--;
    else if (c === '(') parens++;
    else if (c === ')') parens--;
    else if (c === '[') brackets++;
    else if (c === ']') brackets--;

    if (braces < 0) return 'Extra closing brace }';
    if (parens < 0) return 'Extra closing parenthesis )';
    if (brackets < 0) return 'Extra closing bracket ]';
  }

  if (inSingle || inDouble || inTemplate) return 'Unterminated string literal';
  if (inBlockComment) return 'Unterminated block comment';

  if (braces !== 0) return `Unbalanced braces: ${braces > 0 ? braces + ' unclosed' : Math.abs(braces) + ' extra closing'}`;
  if (parens !== 0) return `Unbalanced parentheses: ${parens > 0 ? parens + ' unclosed' : Math.abs(parens) + ' extra closing'}`;
  if (brackets !== 0) return `Unbalanced brackets: ${brackets > 0 ? brackets + ' unclosed' : Math.abs(brackets) + ' extra closing'}`;

  return null;
}

function checkStrings(code: string): string | null {
  // Count backticks outside comments
  let backticks = 0;
  let inLineComment = false;
  let inBlockComment = false;
  let inSingle = false;
  let inDouble = false;
  let escaped = false;

  for (let i = 0; i < code.length; i++) {
    const c = code[i];
    const n = code[i + 1];

    if (inLineComment) { if (c === '\n') inLineComment = false; continue; }
    if (inBlockComment) { if (c === '*' && n === '/') { inBlockComment = false; i++; } continue; }

    if (inSingle || inDouble) {
      if (escaped) { escaped = false; continue; }
      if (c === '\\') { escaped = true; continue; }
      if (inSingle && c === "'") inSingle = false;
      else if (inDouble && c === '"') inDouble = false;
      continue;
    }

    if (c === '/' && n === '/') { inLineComment = true; i++; continue; }
    if (c === '/' && n === '*') { inBlockComment = true; i++; continue; }
    if (c === "'") { inSingle = true; continue; }
    if (c === '"') { inDouble = true; continue; }
    if (c === '`') backticks++;
  }

  if (backticks % 2 !== 0) return 'Unterminated template literal';
  return null;
}

function checkMalformedStyles(code: string): string | null {
  // Detect the common AI error: url('...' ("..."))
  // This pattern appears when the model duplicates a URL inside a style prop
  const malformedUrlPattern = /url\([^)]*\([^)]*\)/;
  if (malformedUrlPattern.test(code)) {
    return 'Malformed CSS url() — contains nested parentheses (likely duplicated URL)';
  }
  return null;
}

/**
 * Check JSX tag balance in TSX/JSX files.
 * Uses a stack-based approach to detect unclosed or mismatched JSX tags.
 */
function checkJsxTagBalance(code: string): string | null {
  // Strip strings, comments, and template literals to avoid false positives
  const stripped = stripStringsAndComments(code);
  
  const tagStack: string[] = [];
  // Match opening tags, closing tags, and self-closing tags
  // Opening: <TagName or <tag.name  (not </ and not <>)
  // Closing: </TagName> or </tag.name>
  // Self-closing: ... />
  const tagRegex = /<\/?([A-Za-z][A-Za-z0-9.]*)[^>]*?\/?>/g;
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(stripped)) !== null) {
    const fullMatch = match[0];
    const tagName = match[1];
    
    // Skip fragment shorthand <> </>
    if (!tagName) continue;
    
    // Skip HTML void elements that don't need closing
    const voidElements = new Set([
      'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
      'link', 'meta', 'param', 'source', 'track', 'wbr'
    ]);
    
    const isSelfClosing = fullMatch.endsWith('/>');
    const isClosing = fullMatch.startsWith('</');
    
    if (isSelfClosing) {
      // Self-closing tags are balanced
      continue;
    }
    
    if (isClosing) {
      if (tagStack.length === 0) {
        return `Extra closing JSX tag </${tagName}> with no matching opening tag`;
      }
      // Pop — we don't enforce strict matching since conditional rendering 
      // can make strict matching unreliable. Just check count balance.
      tagStack.pop();
    } else {
      // Opening tag
      if (voidElements.has(tagName.toLowerCase())) continue;
      tagStack.push(tagName);
    }
  }
  
  if (tagStack.length > 0) {
    return `Unclosed JSX tag(s): ${tagStack.slice(-3).map(t => '<' + t + '>').join(', ')} — ${tagStack.length} unclosed`;
  }
  
  return null;
}

/**
 * Strip strings, template literals, and comments from code
 * so regex-based analysis doesn't get confused.
 */
function stripStringsAndComments(code: string): string {
  let result = '';
  let inSingle = false;
  let inDouble = false;
  let inTemplate = false;
  let inLineComment = false;
  let inBlockComment = false;
  let escaped = false;
  let templateDepth = 0;

  for (let i = 0; i < code.length; i++) {
    const c = code[i];
    const n = code[i + 1];

    if (inLineComment) {
      if (c === '\n') { inLineComment = false; result += '\n'; }
      else result += ' ';
      continue;
    }
    if (inBlockComment) {
      if (c === '*' && n === '/') { inBlockComment = false; result += '  '; i++; }
      else result += c === '\n' ? '\n' : ' ';
      continue;
    }
    if (inSingle || inDouble) {
      if (escaped) { escaped = false; result += ' '; continue; }
      if (c === '\\') { escaped = true; result += ' '; continue; }
      if (inSingle && c === "'") { inSingle = false; result += ' '; }
      else if (inDouble && c === '"') { inDouble = false; result += ' '; }
      else result += ' ';
      continue;
    }
    if (inTemplate) {
      if (escaped) { escaped = false; result += ' '; continue; }
      if (c === '\\') { escaped = true; result += ' '; continue; }
      if (c === '`') { inTemplate = false; result += ' '; }
      else if (c === '$' && n === '{') { templateDepth++; inTemplate = false; result += '  '; i++; }
      else result += c === '\n' ? '\n' : ' ';
      continue;
    }

    if (c === '/' && n === '/') { inLineComment = true; result += ' '; i++; continue; }
    if (c === '/' && n === '*') { inBlockComment = true; result += ' '; i++; continue; }
    if (c === "'") { inSingle = true; result += ' '; continue; }
    if (c === '"') { inDouble = true; result += ' '; continue; }
    if (c === '`') { inTemplate = true; result += ' '; continue; }
    if (c === '}' && templateDepth > 0) { templateDepth--; inTemplate = true; result += ' '; continue; }

    result += c;
  }

  return result;
}

const RESTRICTED_PREFIXES = [
  '/core/', '/checkout/', '/auth/', '/payments/',
  '/settings/', '/admin/', '/api/'
];

/**
 * Validate that all file paths in a file map are within the allowed
 * `/storefront/` directory and do not target restricted folders.
 *
 * @param files       - The file map to validate
 * @param legacyMode  - If true, allow legacy paths (files outside /storefront/)
 *                      for backward compatibility with existing projects.
 */
export function validatePathIsolation(
  files: Record<string, string>,
  legacyMode: boolean = false
): { valid: boolean; errors: Array<{ file: string; error: string }> } {
  const errors: Array<{ file: string; error: string }> = [];

  for (const path of Object.keys(files)) {
    // Block path traversal
    if (path.includes('..')) {
      errors.push({ file: path, error: 'Path traversal detected' });
      continue;
    }

    // Block restricted folders
    if (RESTRICTED_PREFIXES.some(p => path.startsWith(p))) {
      errors.push({ file: path, error: 'Targets restricted folder' });
      continue;
    }

    // In strict mode, must be under /storefront/ or be /App.tsx
    if (!legacyMode && !path.startsWith('/storefront/') && path !== '/App.tsx') {
      errors.push({ file: path, error: 'File must be under /storefront/' });
    }
  }

  return { valid: errors.length === 0, errors };
}
