// Content moderation for AI-generated outputs
// Checks text and metadata for policy violations before saving

export interface ModerationResult {
  safe: boolean;
  flags: ModerationFlag[];
}

export interface ModerationFlag {
  type: 'profanity' | 'violence' | 'sexual' | 'hate_speech' | 'self_harm' | 'spam' | 'pii' | 'copyright';
  severity: 'low' | 'medium' | 'high';
  detail: string;
}

// Word lists for client-side pre-screening (keeps obvious stuff from hitting the API)
const PROFANITY_PATTERNS = [
  /\bf+u+c+k+/i, /\bs+h+i+t+/i, /\ba+s+s+h+o+l+e+/i,
  /\bb+i+t+c+h+/i, /\bc+u+n+t+/i, /\bd+i+c+k+(?:head)?/i,
];

const VIOLENCE_PATTERNS = [
  /\b(kill|murder|slaughter|massacre)\b.*\b(people|children|humans)\b/i,
  /\b(bomb|shoot|stab)\b.*\b(school|church|mosque|synagogue)\b/i,
  /\bhow\s+to\s+(make|build)\s+(bomb|weapon|gun)\b/i,
];

const PII_PATTERNS = [
  /\b\d{3}[-.]?\d{2}[-.]?\d{4}\b/, // SSN
  /\b\d{16}\b/, // credit card-like
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // email
];

const HATE_PATTERNS = [
  /\b(racial\s+superiority|white\s+power|ethnic\s+cleansing)\b/i,
  /\b(death\s+to\s+(?:all|every))\b/i,
];

const SELF_HARM_PATTERNS = [
  /\b(how\s+to\s+)?(suicide|self.?harm|cut\s+myself)\b/i,
];

/**
 * Client-side content moderation pre-screen.
 * Catches obvious violations before any network call.
 */
export function moderateContent(text: string): ModerationResult {
  if (!text || text.trim().length === 0) {
    return { safe: true, flags: [] };
  }

  const flags: ModerationFlag[] = [];

  // Profanity
  for (const pattern of PROFANITY_PATTERNS) {
    if (pattern.test(text)) {
      flags.push({ type: 'profanity', severity: 'low', detail: 'Contains profanity' });
      break;
    }
  }

  // Violence
  for (const pattern of VIOLENCE_PATTERNS) {
    if (pattern.test(text)) {
      flags.push({ type: 'violence', severity: 'high', detail: 'Contains violent content' });
      break;
    }
  }

  // PII
  for (const pattern of PII_PATTERNS) {
    if (pattern.test(text)) {
      flags.push({ type: 'pii', severity: 'medium', detail: 'May contain personal information' });
      break;
    }
  }

  // Hate speech
  for (const pattern of HATE_PATTERNS) {
    if (pattern.test(text)) {
      flags.push({ type: 'hate_speech', severity: 'high', detail: 'Contains hate speech' });
      break;
    }
  }

  // Self-harm
  for (const pattern of SELF_HARM_PATTERNS) {
    if (pattern.test(text)) {
      flags.push({ type: 'self_harm', severity: 'high', detail: 'Contains self-harm content' });
      break;
    }
  }

  const hasHighSeverity = flags.some(f => f.severity === 'high');
  return {
    safe: !hasHighSeverity,
    flags,
  };
}

/**
 * Sanitize text output by removing PII patterns
 */
export function sanitizeOutput(text: string): string {
  let sanitized = text;
  // Mask SSN-like
  sanitized = sanitized.replace(/\b(\d{3})[-.]?(\d{2})[-.]?(\d{4})\b/g, '***-**-****');
  // Mask credit-card-like
  sanitized = sanitized.replace(/\b(\d{4})\s?\d{4}\s?\d{4}\s?(\d{4})\b/g, '$1 **** **** $2');
  return sanitized;
}

/**
 * Check if content is safe for publishing. Returns a user-friendly message if not.
 */
export function getContentWarning(result: ModerationResult): string | null {
  if (result.safe) return null;
  
  const highFlags = result.flags.filter(f => f.severity === 'high');
  if (highFlags.length > 0) {
    return `Content blocked: ${highFlags.map(f => f.detail).join(', ')}. Please modify your prompt and try again.`;
  }
  
  const medFlags = result.flags.filter(f => f.severity === 'medium');
  if (medFlags.length > 0) {
    return `Warning: ${medFlags.map(f => f.detail).join(', ')}. Content will be sanitized before saving.`;
  }
  
  return null;
}
