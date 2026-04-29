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

export const FOOTER = `\n---\n*Win more deals with **mama.oliwoods.com/beta***`;

export const SERVICE_TYPES = [
  "Brand Strategy", "Web Development", "Mobile App Development", "SEO & Content",
  "Paid Media / PPC", "Social Media Management", "UX/UI Design",
  "Data Analytics", "Cloud Infrastructure", "Cybersecurity Audit",
  "Sales Enablement", "CRM Implementation", "Video Production", "PR & Communications",
  "Executive Coaching",
];

export const DELIVERABLE_TEMPLATES = [
  "Discovery workshop ({n} sessions)",
  "Strategy document ({n} pages)",
  "Weekly progress reports",
  "Final presentation deck",
  "30/60/90-day roadmap",
  "Implementation playbook",
  "Training materials ({n} modules)",
  "Post-launch support ({n} months)",
  "Performance dashboard",
  "Stakeholder review sessions ({n} reviews)",
];

export const PRICING_MODELS = [
  "Fixed-fee project", "Monthly retainer", "Time & materials (hourly)",
  "Value-based pricing", "Milestone-based", "Subscription tier",
  "Outcome-based / success fee", "Hybrid (retainer + performance)",
];

export const OBJECTION_HANDLERS = [
  { objection: "Too expensive", response: "ROI analysis shows break-even within {n} months based on {metric} improvement." },
  { objection: "Timeline too long", response: "We can phase delivery — MVP in {n} weeks, full rollout by {date}." },
  { objection: "Not enough experience in our industry", response: "Our work with {similar_client} resulted in {outcome} — transferable methodology." },
  { objection: "We already have an in-house team", response: "We act as a force multiplier, not a replacement — here's how we've worked alongside internal teams before." },
  { objection: "Need board approval", response: "We can prepare a board-ready one-pager and ROI model for your next meeting." },
];

export const SLIDE_ARCHETYPES = [
  "The Problem (pain quantified)", "The Status Quo (why current solutions fail)",
  "Our Solution (the 'aha')", "How It Works (3-step visual)",
  "Proof (case study / metrics)", "The Team (credibility)",
  "Go-to-Market (traction plan)", "Financials / Pricing",
  "The Ask (next steps)", "Appendix",
];

export const INDUSTRIES = [
  "SaaS", "FinTech", "HealthTech", "E-commerce", "Manufacturing",
  "Professional Services", "Real Estate", "Education", "Logistics", "Media",
];
