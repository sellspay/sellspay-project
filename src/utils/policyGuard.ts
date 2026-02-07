// SellsPay Policy Guardrail System
// Prevents the AI from generating authentication, settings, backend, or platform-managed features
// Also enforces layout hierarchy: Hero FIRST, Nav SECOND (never nav above hero)

export interface PolicyRule {
  id: string;
  category: string;
  keywords: string[];
  message: string;
  redirectSuggestion?: string; // Constructive alternative to offer
}

export const POLICY_RULES: PolicyRule[] = [
  // === AUTHENTICATION RESTRICTIONS ===
  {
    id: 'auth_restriction',
    category: 'Security Policy',
    keywords: [
      'login page', 'sign in page', 'signin page', 'signup page', 'sign up page',
      'register page', 'registration page', 'password reset', 'forgot password',
      '2fa', 'two factor', 'otp page', 'authentication page', 'logout page',
      'create login', 'build login', 'make login', 'add login',
      'create signup', 'build signup', 'make signup', 'add signup',
      'user authentication', 'auth system', 'login form', 'signup form',
      'register form', 'login modal', 'signup modal', 'sign out button',
      'auth flow', 'authentication flow', 'login flow', 'signup flow',
    ],
    message: "Authentication is securely managed by SellsPay. I can't build login, signup, or password pages—these are handled at the platform level to ensure security. Your customers sign in through SellsPay, not your storefront.",
    redirectSuggestion: "I can help you create a stunning Hero section or product showcase instead!",
  },
  
  // === SETTINGS & PROFILE PAGE RESTRICTIONS ===
  {
    id: 'settings_restriction',
    category: 'Platform Scope',
    keywords: [
      'settings page', 'user settings', 'account settings', 'profile settings',
      'edit profile page', 'profile management', 'change email', 'update email',
      'billing page', 'payment settings', 'subscription settings', 'account management',
      'user preferences', 'notification settings', 'privacy settings',
      'manage account', 'delete account', 'security settings',
      'profile page', 'my profile', 'user profile', 'edit profile',
      'account page', 'my account', 'user dashboard', 'creator dashboard',
      'settings modal', 'preferences page', 'profile editor',
    ],
    message: "User settings, profiles, and account management are handled by the SellsPay platform. Your storefront should focus on showcasing your products and converting visitors.",
    redirectSuggestion: "I can help you build beautiful product galleries, hero sections, or an About section for your store instead!",
  },
  
  // === BACKEND & DATABASE RESTRICTIONS ===
  {
    id: 'backend_restriction',
    category: 'Architecture Limit',
    keywords: [
      'create database', 'database schema', 'sql query', 'backend api',
      'server setup', 'admin panel', 'admin dashboard', 'cms system',
      'api endpoint', 'rest api', 'graphql', 'webhook handler',
      'server-side', 'backend logic', 'database table', 'create api',
      'build backend', 'make backend', 'add database', 'create table',
      'fetch api', 'api call', 'api integration', 'connect api',
    ],
    message: "VibeCoder is designed for frontend storefront design only. All backend infrastructure, databases, and APIs are pre-provisioned by SellsPay.",
    redirectSuggestion: "I specialize in creating visually stunning storefronts—let me help you design an amazing product page or landing section!",
  },
  
  // === PAYMENT & CHECKOUT RESTRICTIONS ===
  {
    id: 'payment_restriction',
    category: 'Payment Policy',
    keywords: [
      'stripe key', 'stripe api', 'paypal client', 'paypal api',
      'custom checkout', 'payment gateway', 'payment processor',
      'credit card form', 'payment form', 'checkout system',
      'integrate stripe', 'integrate paypal', 'cashapp', 'venmo',
      'crypto payment', 'bitcoin payment', 'add stripe', 'add paypal',
      'payment integration', 'payment link', 'paypal button', 'stripe button',
      'checkout flow', 'payment flow', 'buy button integration',
      'custom payment', 'external payment', 'third party payment',
    ],
    message: "All payments on SellsPay are processed through our secure, unified checkout system. Custom payment integrations aren't permitted to ensure buyer protection and seller compliance.",
    redirectSuggestion: "Your 'Buy Now' buttons will automatically use the platform's checkout. I can help you design compelling CTAs and product cards!",
  },
  
  // === LAYOUT HIERARCHY VIOLATIONS ===
  {
    id: 'nav_above_hero',
    category: 'Layout Policy',
    keywords: [
      'nav at top', 'navigation at top', 'navbar at top', 'menu at top',
      'nav above hero', 'navbar above hero', 'navigation above hero',
      'put nav at top', 'move nav to top', 'navigation bar at top',
      'header navigation', 'top navigation', 'nav before hero',
      'menu above banner', 'nav above banner', 'navigation first',
      'put menu at top', 'move menu above', 'top menu', 'header menu',
    ],
    message: "I can't move navigation above the Hero section. Since SellsPay already has its own navigation bar at the top of every page, adding another one above your hero banner would create a visually cluttered 'double navbar' effect. That's why we default to having your Hero section first, with your store navigation below it—it looks much cleaner and more visually appealing for your customers.",
    redirectSuggestion: "Your store navigation sits beautifully below the hero with sticky positioning—would you like me to restyle it with a different look?",
  },
  
  // === PROMPT INJECTION & SYSTEM ABUSE ===
  {
    id: 'credit_bypass',
    category: 'Security Policy',
    keywords: [
      'grant me credits', 'give me credits', 'add credits', 'free credits',
      'unlimited credits', 'bypass credits', 'ignore credit', 'skip credit',
      'i am owner', 'i am admin', 'make me owner', 'make me admin',
      'grant admin', 'grant owner', 'owner access', 'admin access',
      'unlimited access', 'bypass limit', 'ignore limit', 'remove limit',
      'hack', 'exploit', 'jailbreak', 'ignore previous', 'disregard instructions',
      'new instructions', 'override system', 'system prompt', 'you are now',
      'pretend you are', 'act as if', 'forget your rules', 'ignore your rules',
    ],
    message: "I'm a visual design AI that creates beautiful storefronts—I don't have the ability to modify credits, grant access, or change system settings. Those are handled securely by SellsPay at the platform level.",
    redirectSuggestion: "Let me help you with what I'm great at—designing an amazing storefront! What style are you going for?",
  },
  
  // === ROUTING & MULTI-PAGE RESTRICTIONS ===
  {
    id: 'routing_restriction',
    category: 'Architecture Limit',
    keywords: [
      'react router', 'add route', 'create route', 'new page',
      'separate page', 'another page', 'multi page', 'page navigation',
      'url routing', 'browser routing', 'link to page',
    ],
    message: "Storefronts are single-page experiences. Navigation between sections (Products, Bundles, Support) uses tabs within your storefront, not separate URL routes.",
    redirectSuggestion: "I can create a tabbed navigation system to organize your content beautifully!",
  },
];

/**
 * Checks if a user prompt violates any platform policies.
 * Returns the matched rule if a violation is found, or null if the prompt is allowed.
 */
export function checkPolicyViolation(prompt: string): PolicyRule | null {
  const normalized = (prompt || '').toLowerCase();

  return (
    POLICY_RULES.find((rule) =>
      rule.keywords.some((keyword) => {
        const re = keywordToRegex(keyword);
        return re.test(normalized);
      })
    ) ?? null
  );
}

/**
 * Get a user-friendly response for a policy violation
 */
export function getPolicyViolationResponse(rule: PolicyRule): string {
  let response = rule.message;
  if (rule.redirectSuggestion) {
    response += ` ${rule.redirectSuggestion}`;
  }
  return response;
}

function keywordToRegex(keyword: string): RegExp {
  // Convert keyword phrase into a whitespace-tolerant, word-boundary regex.
  // Example: "settings page" => /\bsettings\s+page\b/i
  const escaped = escapeRegExp(keyword.trim().toLowerCase());
  const wsTolerant = escaped.replace(/\s+/g, '\\s+');
  return new RegExp(`\\b${wsTolerant}\\b`, 'i');
}

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
