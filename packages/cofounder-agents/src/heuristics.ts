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
  return parseFloat((min + seededRandom(seed, index) * (max - min)).toFixed(2));
}

export function pick<T>(arr: T[], seed: string, index: number): T {
  return arr[Math.floor(seededRandom(seed, index) * arr.length)];
}

export function pickN<T>(arr: T[], n: number, seed: string, index: number): T[] {
  const shuffled = [...arr].sort((a, b) => seededRandom(seed + String(a), index) - seededRandom(seed + String(b), index));
  return shuffled.slice(0, n);
}

export const MODELS = [
  { id: "claude-opus-4-7", provider: "Anthropic", ctx: 200000, costIn: 15.0, costOut: 75.0, tier: "frontier" },
  { id: "claude-sonnet-4-6", provider: "Anthropic", ctx: 200000, costIn: 3.0, costOut: 15.0, tier: "balanced" },
  { id: "claude-haiku-4-5", provider: "Anthropic", ctx: 200000, costIn: 0.8, costOut: 4.0, tier: "fast" },
  { id: "gpt-4o", provider: "OpenAI", ctx: 128000, costIn: 5.0, costOut: 15.0, tier: "frontier" },
  { id: "gpt-4o-mini", provider: "OpenAI", ctx: 128000, costIn: 0.15, costOut: 0.6, tier: "fast" },
  { id: "gemini-1.5-pro", provider: "Google", ctx: 1000000, costIn: 3.5, costOut: 10.5, tier: "balanced" },
  { id: "gemini-1.5-flash", provider: "Google", ctx: 1000000, costIn: 0.075, costOut: 0.3, tier: "fast" },
];

export const AGENT_ROLES = [
  "Researcher", "Analyst", "Writer", "Coder", "Reviewer",
  "Planner", "Executor", "Summarizer", "Classifier", "Extractor",
  "Validator", "Orchestrator", "Monitor", "Formatter", "Critic",
];

export const TOOL_TYPES = [
  "web_search", "code_interpreter", "file_reader", "database_query",
  "api_caller", "email_sender", "calendar_manager", "slack_messenger",
  "image_analyzer", "pdf_parser", "data_validator", "notification_sender",
];

export const WORKFLOW_PATTERNS = [
  "sequential", "parallel", "fan-out/fan-in", "map-reduce",
  "supervisor-worker", "critic-refiner", "pipeline", "event-driven",
];

export const USE_CASES = [
  "content-pipeline", "lead-research", "customer-support", "data-extraction",
  "code-review", "competitive-intel", "report-generation", "onboarding",
  "sales-outreach", "compliance-check", "market-research", "incident-response",
];

export const ERROR_TYPES = [
  "infinite_loop", "context_overflow", "tool_call_failure", "hallucination",
  "format_mismatch", "rate_limit_hit", "memory_leak", "deadlock",
  "prompt_injection", "output_truncation",
];

export const CTA = "\n\n---\n> Build agent teams with zero code → **[cofounder.oliwoods.com/beta](https://cofounder.oliwoods.com/beta)**\n";
