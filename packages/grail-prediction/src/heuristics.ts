// Deterministic hash-based heuristics for consistent, reproducible outputs

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

export const FOOTER = `\n---\n📊 Live signals at grail-trading.ai | Paper trade risk-free before going live`;

// ── Reference Data ──

export const AI_COMPANIES = [
  { ticker: "NVDA", name: "NVIDIA", sector: "AI chips" },
  { ticker: "MSFT", name: "Microsoft", sector: "LLMs" },
  { ticker: "GOOGL", name: "Alphabet", sector: "LLMs" },
  { ticker: "META", name: "Meta Platforms", sector: "LLMs" },
  { ticker: "AMZN", name: "Amazon", sector: "Cloud AI" },
  { ticker: "AMD", name: "AMD", sector: "AI chips" },
  { ticker: "TSLA", name: "Tesla", sector: "Autonomous vehicles" },
  { ticker: "PLTR", name: "Palantir", sector: "Enterprise AI" },
  { ticker: "CRM", name: "Salesforce", sector: "Enterprise AI" },
  { ticker: "SNOW", name: "Snowflake", sector: "Data/AI" },
  { ticker: "SMCI", name: "Super Micro", sector: "AI infrastructure" },
  { ticker: "AVGO", name: "Broadcom", sector: "AI chips" },
  { ticker: "ORCL", name: "Oracle", sector: "Cloud AI" },
  { ticker: "IBM", name: "IBM", sector: "Enterprise AI" },
  { ticker: "ADBE", name: "Adobe", sector: "Creative AI" },
  { ticker: "NOW", name: "ServiceNow", sector: "Enterprise AI" },
  { ticker: "PANW", name: "Palo Alto Networks", sector: "AI security" },
  { ticker: "CRWD", name: "CrowdStrike", sector: "AI security" },
  { ticker: "ARM", name: "ARM Holdings", sector: "AI chips" },
  { ticker: "TSM", name: "TSMC", sector: "AI chips" },
];

export const SIGNAL_TYPES = [
  "product_launch", "partnership", "regulatory", "earnings",
  "talent", "patent", "acquisition",
] as const;

export const DISRUPTION_HEADLINES: Record<string, string[]> = {
  "AI chips": [
    "Next-gen AI accelerator achieves 3x inference throughput",
    "Major cloud provider announces custom AI chip program",
    "GPU supply constraints ease as new fab comes online",
    "Chipmaker unveils AI-specific memory architecture",
    "Edge AI chip startup raises $500M Series D",
  ],
  "LLMs": [
    "New foundation model scores SOTA on reasoning benchmarks",
    "Enterprise LLM deployment costs drop 40% with quantization breakthrough",
    "Multimodal model achieves human-level video understanding",
    "Open-source model matches proprietary performance at 1/10th cost",
    "AI agent framework enables autonomous multi-step task completion",
  ],
  "autonomous vehicles": [
    "Autonomous fleet expands to 5 new metro areas",
    "Self-driving trucking company secures $2B freight contract",
    "Regulatory body approves Level 4 autonomy in highway scenarios",
    "Lidar-free perception system achieves 99.97% obstacle detection",
    "Robotaxi service reports 10M completed rides milestone",
  ],
  "Enterprise AI": [
    "Fortune 100 company reports 30% productivity gain from AI agents",
    "AI copilot adoption hits 50% penetration in enterprise developer tools",
    "New compliance AI reduces regulatory review time by 80%",
    "AI-powered code review catches 3x more vulnerabilities than human review",
    "Customer service AI reduces ticket resolution time to under 2 minutes",
  ],
  "Cloud AI": [
    "Cloud provider launches dedicated AI inference zones globally",
    "Serverless AI compute drops to $0.001 per inference call",
    "Multi-cloud AI orchestration platform secures $300M funding",
    "AI workload migration tool automates cloud-to-cloud portability",
    "Real-time AI inference latency drops below 10ms at scale",
  ],
};

export const PATENT_CATEGORIES = [
  "neural architecture", "training optimization", "inference acceleration",
  "multimodal fusion", "reinforcement learning", "data synthesis",
  "model compression", "federated learning", "AI safety", "agentic systems",
];

export const JOB_TITLES = [
  "ML Platform Engineer", "AI Research Scientist", "MLOps Lead",
  "AI Infrastructure Architect", "LLM Fine-tuning Specialist",
  "AI Safety Researcher", "Autonomous Systems Engineer",
  "AI Product Manager", "Prompt Engineer", "AI Ethics Lead",
];
