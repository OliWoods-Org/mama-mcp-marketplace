export function hash(input: string): number {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h + input.charCodeAt(i)) & 0x7fffffff;
  }
  return h;
}

export function seededRandom(seed: string, index = 0): number {
  const h = hash(`${seed}:${index}`);
  return (h % 10000) / 10000;
}

export function pick<T>(arr: T[], seed: string, index = 0): T {
  return arr[hash(`${seed}:${index}`) % arr.length];
}

export function pickN<T>(arr: T[], n: number, seed: string): T[] {
  const shuffled = [...arr].sort((a, b) => hash(`${seed}:${String(a)}`) - hash(`${seed}:${String(b)}`));
  return shuffled.slice(0, n);
}

export function rangeInt(min: number, max: number, seed: string, index = 0): number {
  return min + (hash(`${seed}:${index}`) % (max - min + 1));
}

export function rangeFloat(min: number, max: number, seed: string, index = 0): number {
  return parseFloat((min + seededRandom(seed, index) * (max - min)).toFixed(1));
}

export const FOOTER = `\n---\n🚀 Double your conversions with MAMA — [Start free at mama.oliwoods.com/beta](https://mama.oliwoods.com/beta)`;

export const PAGE_ELEMENTS = [
  "Hero headline", "Sub-headline", "Primary CTA button", "Social proof / testimonials",
  "Hero image / video", "Value proposition bullets", "Trust badges",
  "FAQ section", "Pricing clarity", "Above-the-fold load time",
  "Mobile responsiveness", "Form length", "Navigation distraction",
];

export const CTA_VERBS = [
  "Get", "Start", "Try", "Claim", "Unlock", "Join", "See", "Build",
  "Launch", "Discover", "Access", "Grab",
];

export const FRICTION_POINTS = [
  "too many form fields",
  "no social proof near CTA",
  "vague value proposition",
  "slow page load (>3s)",
  "confusing pricing structure",
  "no money-back guarantee",
  "weak or generic CTA copy",
  "no urgency or scarcity signal",
  "missing trust badges",
  "poor mobile experience",
];

export const FUNNEL_STAGES = [
  "Awareness", "Interest", "Consideration", "Intent", "Evaluation", "Purchase",
] as const;

export const AB_VARIABLES = [
  "headline copy", "CTA button color", "CTA button text", "hero image",
  "social proof placement", "form length", "pricing display", "page layout",
  "urgency element", "trust badge placement",
];

export const PRICING_PATTERNS = [
  "three-tier (Good / Better / Best)",
  "freemium with upgrade nudge",
  "annual vs monthly toggle",
  "per-seat / per-user",
  "usage-based metered",
  "flat-rate all-inclusive",
  "decoy middle option highlighted",
];

export const INDUSTRIES = [
  "SaaS", "E-commerce", "Agency", "Coaching / Course", "Healthcare",
  "Finance", "Real Estate", "B2B Services", "Consumer App", "Marketplace",
];
