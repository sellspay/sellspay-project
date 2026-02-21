export interface PlanFeature {
  text: string;
  included?: boolean;
  isNeutral?: boolean;
  highlight?: boolean;
  highlightColor?: string;
}

export interface PlanData {
  id: 'starter' | 'basic' | 'creator' | 'agency';
  name: string;
  price: number;
  description: string;
  badge: string | null;
  badgeColor: string;
  accentGradient: string;
  features: PlanFeature[];
  credits: number;
  modelTier: string | null;
}

export const PLANS: PlanData[] = [
  {
    id: "starter",
    name: "Starter",
    price: 0,
    description: "Build your store manually. No AI features.",
    badge: null,
    badgeColor: "",
    accentGradient: "from-zinc-500 to-zinc-700",
    features: [
      { text: "Create & Customize Storefront", included: true },
      { text: "Sell Digital Products & Subs", included: true },
      { text: "Buy from Marketplace", included: true },
      { text: "Community Access", included: true },
      { text: "VibeCoder AI Builder", included: false },
      { text: "AI Image Generation", included: false },
      { text: "AI Video Generation", included: false },
      { text: "10% Transaction Fee", isNeutral: true },
    ],
    credits: 0,
    modelTier: null,
  },
  {
    id: "basic",
    name: "Basic",
    price: 25,
    description: "Get started with AI-powered building.",
    badge: null,
    badgeColor: "",
    accentGradient: "from-blue-500 to-cyan-500",
    features: [
      { text: "Everything in Starter", included: true },
      { text: "VibeCoder (Flash Models)", included: true, highlight: true },
      { text: "500 Monthly Credits", included: true },
      { text: "Manual Model Selection", included: true },
      { text: "Pro Models (GPT-5, Gemini Pro)", included: false },
      { text: "Image & Video Generation", included: false },
      { text: "8% Transaction Fee", isNeutral: true },
    ],
    credits: 500,
    modelTier: 'flash',
  },
  {
    id: "creator",
    name: "Creator",
    price: 100,
    description: "Full AI suite for serious creators.",
    badge: "Most Popular",
    badgeColor: "bg-gradient-to-r from-violet-500 to-fuchsia-500",
    accentGradient: "from-violet-500 to-fuchsia-500",
    features: [
      { text: "Everything in Basic", included: true },
      { text: "Pro Models (GPT-5, Gemini 3 Pro)", included: true, highlight: true },
      { text: "AI Image Generation", included: true, highlight: true },
      { text: "Auto-Model Selection", included: true },
      { text: "2,500 Monthly Credits", included: true },
      { text: "Grey Verified Badge", included: true },
      { text: "5% Transaction Fee", isNeutral: true },
    ],
    credits: 2500,
    modelTier: 'pro',
  },
  {
    id: "agency",
    name: "Agency",
    price: 200,
    description: "Maximum power for studios and agencies.",
    badge: "Elite Status",
    badgeColor: "bg-gradient-to-r from-amber-400 to-orange-500",
    accentGradient: "from-amber-400 to-orange-500",
    features: [
      { text: "Everything in Creator", included: true },
      { text: "Flagship Models (GPT-5.2)", included: true, highlight: true },
      { text: "AI Video Generation", included: true, highlight: true },
      { text: "Full Auto-Model Access", included: true },
      { text: "6,000 Monthly Credits", included: true },
      { text: "Priority Processing", included: true },
      { text: "Gold Verified Badge", included: true, highlightColor: "text-amber-400" },
      { text: "0% Transaction Fees", highlightColor: "text-green-400" },
    ],
    credits: 6000,
    modelTier: 'flagship',
  },
];

export const PLAN_FAQS = [
  {
    q: "What AI models do you use?",
    a: "We use the absolute bleeding edge. Vibecoder is powered by Claude 3.5 Sonnet for code. Image generation uses Flux 1.1 Pro and Recraft V3. Video generation uses Kling AI and Luma Ray 2. We handle all the API costs."
  },
  {
    q: "How far do 12,000 credits go?",
    a: "A lot. That's enough for roughly 600 AI videos, OR 6,000 high-fidelity images, OR 4,000 code iterations. Most agencies can run their entire storefront design business on one subscription."
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Your credits remain active until the end of your billing cycle. If you downgrade to Free, your storefront remains live, but you lose the ability to use AI tools to edit it."
  },
  {
    q: "What is the 0% Fee structure?",
    a: "On the Agency plan, SellsPay takes $0 from your sales. You keep 100% of your revenue (minus standard Stripe processing fees). This alone pays for the subscription if you sell over $2,000/mo."
  }
];
