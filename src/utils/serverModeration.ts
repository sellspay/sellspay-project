/**
 * Server-side content moderation patterns for edge functions.
 * Copy-paste friendly for Deno edge functions (no imports from src/).
 */

// Shared blocked patterns for server-side validation
export const SERVER_MODERATION_SNIPPET = `
// ====== CONTENT MODERATION ======
const BLOCKED_PATTERNS = [
  // Violence
  /\\b(kill|murder|slaughter|massacre)\\b.*\\b(people|children|humans)\\b/i,
  /\\b(bomb|shoot|stab)\\b.*\\b(school|church|mosque|synagogue)\\b/i,
  /\\bhow\\s+to\\s+(make|build)\\s+(bomb|weapon|gun)\\b/i,
  // Hate speech
  /\\b(racial\\s+superiority|white\\s+power|ethnic\\s+cleansing)\\b/i,
  /\\b(death\\s+to\\s+(?:all|every))\\b/i,
  // Self-harm
  /\\b(how\\s+to\\s+)?(suicide|self.?harm|cut\\s+myself)\\b/i,
  // Sexual/NSFW
  /\\b(nude|naked|porn|hentai|xxx|nsfw|erotic|sexually\\s+explicit)\\b/i,
  /\\b(sex\\s+scene|sexual\\s+content|adult\\s+content)\\b/i,
  // Deepfake / impersonation
  /\\b(deepfake|impersonat)\\b/i,
  // Drug manufacturing
  /\\bhow\\s+to\\s+(make|cook|synthesize)\\s+(meth|cocaine|heroin|drugs)\\b/i,
  // Copyright infringement
  /\\b(copy(right)?\\s+infring|pirat(e|ed|ing)|steal\\s+content)\\b/i,
];

function moderatePrompt(prompt) {
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(prompt)) {
      return { blocked: true, reason: "Content policy violation: prompt contains prohibited content." };
    }
  }
  return { blocked: false, reason: null };
}
`;
