// SellsPay Policy Guardrail System
// Prevents the AI from generating authentication, settings, backend, or platform-managed features

export interface PolicyRule {
  id: string;
  category: string;
  keywords: string[];
  message: string;
}

export const POLICY_RULES: PolicyRule[] = [
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
      'register form', 'login modal', 'signup modal',
    ],
    message: "Authentication features are securely managed by the SellsPay platform. I can't build login, signup, or password pages—these are handled at the platform level to ensure security and compliance. Instead, I can help you create a stunning storefront, product showcase, or landing page!",
  },
  {
    id: 'settings_restriction',
    category: 'Platform Scope',
    keywords: [
      'settings page', 'user settings', 'account settings', 'profile settings',
      'edit profile page', 'profile management', 'change email', 'update email',
      'billing page', 'payment settings', 'subscription settings', 'account management',
      'user preferences', 'notification settings', 'privacy settings',
      'manage account', 'delete account', 'security settings',
    ],
    message: "User settings, billing, and account management are handled by the SellsPay platform. Your storefront should focus on showcasing your products and converting visitors. I can help you build beautiful product galleries, hero sections, or about pages instead!",
  },
  {
    id: 'backend_restriction',
    category: 'Architecture Limit',
    keywords: [
      'create database', 'database schema', 'sql query', 'backend api',
      'server setup', 'admin panel', 'admin dashboard', 'cms system',
      'api endpoint', 'rest api', 'graphql', 'webhook handler',
      'server-side', 'backend logic', 'database table',
    ],
    message: "VibeCoder is designed for frontend storefront design. Backend infrastructure, databases, and admin panels are pre-provisioned by SellsPay. I specialize in creating visually stunning storefronts—let me help you design an amazing product page or landing section!",
  },
  {
    id: 'payment_restriction',
    category: 'Payment Policy',
    keywords: [
      'stripe key', 'stripe api', 'paypal client', 'paypal api',
      'custom checkout', 'payment gateway', 'payment processor',
      'credit card form', 'payment form', 'checkout system',
      'integrate stripe', 'integrate paypal', 'cashapp', 'venmo',
      'crypto payment', 'bitcoin payment',
    ],
    message: "All payments on SellsPay are processed through our secure, unified checkout system. Custom payment integrations aren't permitted to ensure buyer protection and seller compliance. Your 'Buy Now' buttons will automatically use the platform's checkout—I can help you design compelling CTAs and product cards!",
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
