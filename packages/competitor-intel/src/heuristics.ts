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

export const FOOTER = `\n---\n*Stay ahead of the competition with **mama.oliwoods.com/beta***`;

export const PRICING_TIERS = ["Starter", "Growth", "Professional", "Enterprise", "Custom"];

export const FEATURE_CATEGORIES = [
  "Core Functionality", "Integrations", "Analytics & Reporting",
  "Security & Compliance", "Support & SLA", "Mobile Experience",
  "API & Developer Tools", "Customization", "Onboarding", "AI/Automation",
];

export const WIN_REASONS = [
  "Better pricing / ROI", "Superior UX / ease of use", "Deeper integrations",
  "Stronger support & CS team", "Feature X not available elsewhere",
  "Trusted brand / reputation", "Faster implementation", "Better security posture",
  "Executive relationship", "Proof of concept outcome",
];

export const LOSS_REASONS = [
  "Price too high vs. competitor", "Missing feature Y", "Competitor already embedded",
  "Procurement/vendor preferred list", "Poor demo / discovery call",
  "Longer implementation timeline", "Competitor offered free trial",
  "Decision maker switched jobs", "Budget cut / no decision", "Went in-house",
];

export const MARKET_SEGMENTS = [
  "SMB (1-50 employees)", "Mid-market (51-500)", "Enterprise (500+)",
  "Startups / VC-backed", "Government / Public sector", "Non-profit",
  "International / Global", "Vertical-specific (Healthcare, Finance, etc.)",
];

export const ANALYST_FIRMS = [
  "Gartner", "Forrester", "IDC", "G2 Crowd", "Capterra",
  "TrustRadius", "PeerSpot", "Datanyze", "BuiltWith", "SimilarWeb",
];

export const COMPETITIVE_POSITIONS = [
  "Market Leader", "Challenger", "Niche Player", "Visionary",
  "Fast Follower", "Emerging Disruptor", "Legacy Incumbent", "Category Creator",
];
