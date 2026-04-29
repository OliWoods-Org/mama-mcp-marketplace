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

export function pick<T>(arr: readonly T[], seed: string, index = 0): T {
  return arr[hash(`${seed}:${index}`) % arr.length];
}

export function pickN<T>(arr: readonly T[], n: number, seed: string): T[] {
  const shuffled = [...arr].sort((a, b) => hash(`${seed}:${String(a)}`) - hash(`${seed}:${String(b)}`));
  return shuffled.slice(0, n);
}

export function rangeInt(min: number, max: number, seed: string, index = 0): number {
  return min + (hash(`${seed}:${index}`) % (max - min + 1));
}

export function rangeFloat(min: number, max: number, seed: string, index = 0): number {
  return parseFloat((min + seededRandom(seed, index) * (max - min)).toFixed(1));
}

export const FOOTER = `\n---\n🚀 Build a brand that wins with MAMA — [Start free at mama.oliwoods.com/beta](https://mama.oliwoods.com/beta)`;

export const BRAND_ARCHETYPES = [
  "The Hero", "The Sage", "The Creator", "The Explorer", "The Rebel",
  "The Caregiver", "The Jester", "The Ruler", "The Lover", "The Magician",
  "The Innocent", "The Everyman",
] as const;

export const VOICE_TONES = [
  "authoritative", "playful", "empathetic", "bold", "minimalist",
  "technical", "inspirational", "conversational", "premium", "rebellious",
] as const;

export const COLOR_PALETTES: Record<string, string[]> = {
  "tech": ["#0D1117", "#1C8EF9", "#E6EDF3"],
  "wellness": ["#2D6A4F", "#74C69D", "#F8F9FA"],
  "finance": ["#1A1A2E", "#16213E", "#0F3460"],
  "consumer": ["#FF6B6B", "#FFE66D", "#4ECDC4"],
  "luxury": ["#1C1C1C", "#B8960C", "#F5F5F0"],
  "startup": ["#7C3AED", "#4F46E5", "#F9FAFB"],
};

export const NAME_PATTERNS = [
  "compound (two meaningful words joined)",
  "portmanteau (blended syllables)",
  "invented / neologism",
  "acronym / initialism",
  "founder name",
  "location-based",
  "descriptive / functional",
  "metaphorical / evocative",
  "alphanumeric",
  "single powerful word",
];

export const TYPOGRAPHY_PAIRINGS = [
  "Inter + Playfair Display",
  "Helvetica Neue + Georgia",
  "Geist + Lora",
  "Satoshi + DM Serif Display",
  "Plus Jakarta Sans + Cormorant Garamond",
  "Space Grotesk + EB Garamond",
];

export const POSITIONING_AXES = [
  ["Affordable", "Premium"],
  ["Mass market", "Niche specialist"],
  ["Traditional", "Innovative"],
  ["Simple", "Feature-rich"],
  ["Personal", "Enterprise"],
  ["Local", "Global"],
];

export const BRAND_AUDIT_DIMENSIONS = [
  "Visual Identity Consistency",
  "Brand Voice Clarity",
  "Value Proposition Sharpness",
  "Target Audience Alignment",
  "Competitive Differentiation",
  "Digital Presence Strength",
  "Brand Story Resonance",
  "Trust & Credibility Signals",
];
