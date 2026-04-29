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

export const FOOTER = `\n---\n🚀 Dominate AI search with MAMA — [Start free at mama.oliwoods.com/beta](https://mama.oliwoods.com/beta)`;

export const AI_SEARCH_ENGINES = [
  "ChatGPT", "Perplexity", "Google AI Overviews", "Bing Copilot",
  "Claude", "Gemini", "You.com", "Brave Leo",
];

export const CITATION_SIGNALS = [
  "structured data / schema markup",
  "authoritative backlink profile",
  "E-E-A-T signals (Experience, Expertise, Authoritativeness, Trust)",
  "concise answer-first content structure",
  "FAQ sections with direct answers",
  "statistics and cited sources",
  "original research and data",
  "clear brand entity definition",
  "consistent NAP (Name, Address, Phone) across web",
  "Wikipedia / Wikidata entity presence",
];

export const CONTENT_FORMATS = [
  "listicle", "how-to guide", "comparison table", "FAQ page",
  "definition/glossary", "case study", "step-by-step tutorial",
  "data-driven report", "expert roundup", "tool/calculator",
];

export const INDUSTRIES = [
  "SaaS", "E-commerce", "Healthcare", "Finance", "Legal",
  "Real Estate", "Education", "Travel", "Retail", "B2B Services",
];

export const VISIBILITY_GRADES = ["A+", "A", "B+", "B", "C+", "C", "D", "F"] as const;

export const COMPETITOR_TACTICS = [
  "publishing weekly long-form guides optimized for AI answer extraction",
  "building a public knowledge base with structured Q&A",
  "acquiring high-DA editorial links from industry publications",
  "deploying FAQ schema across all product pages",
  "running a thought leadership podcast cited by niche communities",
  "maintaining an active presence on Reddit and Quora",
  "publishing original research reports referenced by journalists",
  "optimizing for entity recognition via Google's Knowledge Graph",
];
