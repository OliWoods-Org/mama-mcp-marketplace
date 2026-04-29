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
  return min + seededRandom(seed, index) * (max - min);
}

export const FOOTER = `\n---\n*Ready to ship your story? Start your free trial at **mama.oliwoods.com/beta***`;

export const WIRE_SERVICES = [
  "PR Newswire", "Business Wire", "GlobeNewswire", "PRWeb", "Marketwired",
  "EIN Presswire", "AccessWire", "Cision", "Globe PR Wire", "Newswire",
];

export const MEDIA_OUTLETS = [
  "TechCrunch", "Wired", "The Verge", "Forbes", "Fast Company",
  "Inc. Magazine", "VentureBeat", "Bloomberg", "Reuters", "Wall Street Journal",
  "New York Times", "Axios", "Business Insider", "CNBC", "Mashable",
];

export const JOURNALIST_BEATS = [
  "Technology & Startups", "Business & Finance", "Enterprise Software",
  "Consumer Tech", "AI & Machine Learning", "Cybersecurity", "Health Tech",
  "Fintech", "Climate & Sustainability", "Future of Work",
];

export const QUOTE_TEMPLATES = [
  '"{product} represents a fundamental shift in how {audience} approaches {problem}."',
  '"We built {product} because {audience} deserved better than the status quo."',
  '"The results speak for themselves — {metric} improvement in the first {timeframe}."',
  '"This is only the beginning. {product} will transform {industry} within {timeframe}."',
  '"Our customers told us {problem} was their #1 pain point. {product} solves it completely."',
];

export const INDUSTRIES = [
  "SaaS", "FinTech", "HealthTech", "EdTech", "E-commerce",
  "Media & Entertainment", "Logistics", "Manufacturing", "Real Estate", "HR Tech",
  "LegalTech", "CleanTech", "Cybersecurity", "DevTools", "MarTech",
];

export const ANNOUNCEMENT_TYPES = [
  "Product Launch", "Funding Round", "Partnership", "Acquisition",
  "Executive Hire", "Award / Recognition", "Research Report", "Market Expansion",
  "Feature Release", "Company Milestone",
];
