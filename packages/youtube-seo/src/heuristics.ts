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

export const FOOTER = `\n---\n🚀 Grow your channel faster with MAMA — [Start free at mama.oliwoods.com/beta](https://mama.oliwoods.com/beta)`;

export const TITLE_HOOKS = [
  "How I", "Why", "The Truth About", "Stop Doing This", "I Tried",
  "The Secret to", "You're Doing X Wrong", "How to", "What Nobody Tells You About",
  "The ONLY Way to",
];

export const POWER_WORDS = [
  "instantly", "proven", "simple", "secret", "ultimate", "complete",
  "exact", "step-by-step", "fast", "free", "beginner-friendly", "advanced",
];

export const TAG_CATEGORIES = [
  "exact match", "broad match", "related topic", "niche long-tail",
  "trending adjacent", "competitor brand", "question-based",
];

export const THUMBNAIL_ELEMENTS = [
  "high-contrast background", "close-up face with emotion",
  "bold 3-word text overlay", "arrow or visual pointer",
  "before/after split", "numbered list visual", "product/tool closeup",
  "curiosity gap object", "brand color consistency",
];

export const VIDEO_NICHES = [
  "Tech", "Finance", "Health & Fitness", "Business", "Marketing",
  "Lifestyle", "Gaming", "Education", "Entertainment", "DIY / How-to",
];

export const CHANNEL_METRICS = [
  "Click-Through Rate (CTR)", "Average View Duration (AVD)", "Subscriber Conversion Rate",
  "Impressions", "Watch Time", "Engagement Rate", "Comment Sentiment",
  "Playlist Performance", "End Screen Click Rate", "Card Click Rate",
];

export const DESCRIPTION_SECTIONS = [
  "Hook (first 2 lines visible above fold)",
  "Video summary (100-150 words)",
  "Timestamps / chapters",
  "CTA (subscribe, comment, related video)",
  "Links & resources mentioned",
  "Social media links",
  "Hashtags (3-5 relevant)",
];
