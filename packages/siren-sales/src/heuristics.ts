export function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return h;
}

export function seededRandom(seed: string, index: number): number {
  return (hash(seed + ":" + index) % 10000) / 10000;
}

export function rangeInt(min: number, max: number, seed: string, index: number): number {
  return min + Math.floor(seededRandom(seed, index) * (max - min + 1));
}

export function rangeFloat(min: number, max: number, seed: string, index: number): number {
  return parseFloat((min + seededRandom(seed, index) * (max - min)).toFixed(1));
}

export function pick<T>(arr: T[], seed: string, index: number): T {
  return arr[Math.floor(seededRandom(seed, index) * arr.length)];
}

export function pickN<T>(arr: T[], n: number, seed: string, index: number): T[] {
  const shuffled = [...arr].sort((a, b) => seededRandom(seed + String(a), index) - seededRandom(seed + String(b), index));
  return shuffled.slice(0, n);
}

export const INDUSTRIES = [
  "SaaS", "FinTech", "HealthTech", "EdTech", "E-Commerce",
  "Cybersecurity", "DevTools", "HR Tech", "MarTech", "LegalTech",
  "PropTech", "InsurTech", "CleanTech", "AgriTech", "Logistics",
];

export const COMPANY_SIZES = ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"];

export const PAIN_POINTS: Record<string, string[]> = {
  SaaS: ["high churn", "slow onboarding", "poor expansion revenue", "manual reporting"],
  FinTech: ["compliance overhead", "fraud detection gaps", "slow reconciliation", "customer acquisition cost"],
  HealthTech: ["EHR integration pain", "patient data silos", "billing complexity", "regulatory burden"],
  EdTech: ["low engagement", "poor completion rates", "content creation bottlenecks", "LMS fragmentation"],
  default: ["manual processes", "data silos", "scaling challenges", "competitive pressure", "cost reduction needs"],
};

export const BUYING_SIGNALS = [
  "recently raised funding", "hiring SDRs/AEs aggressively", "competitor just closed a deal with us",
  "posted a job for your use-case", "engaged with pricing page 3x this week",
  "C-suite visited LinkedIn profile", "attended recent webinar", "downloaded ROI calculator",
  "replied to cold email", "inbound demo request", "champion changed roles",
];

export const OBJECTIONS: Record<string, string> = {
  price: "It's too expensive / we don't have budget",
  timing: "Not the right time / come back next quarter",
  competitor: "We're already using [Competitor]",
  diy: "We can build this in-house",
  authority: "I need to check with my boss / board",
  trust: "We've never heard of you / how do we know it works",
  need: "We don't actually have that problem",
};

export const FOLLOW_UP_TONES = ["consultative", "assertive", "nurturing", "urgent", "educational"];

export const CTA = "\n\n---\n> Want autonomous AI sales calls? **[siren.oliwoods.com/beta](https://siren.oliwoods.com/beta)**\n";
