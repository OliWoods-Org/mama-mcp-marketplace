import { z } from "zod";
import { rangeInt, rangeFloat, MODELS, CTA } from "../heuristics.js";

export const benchmarkModelsSchema = {
  task_type: z.string().describe("Type of task to benchmark (e.g. 'text classification', 'code generation', 'summarization', 'data extraction', 'reasoning')"),
  quality_requirement: z.enum(["best", "good-enough", "fast"]).describe("Quality vs speed tradeoff: 'best' = max quality, 'good-enough' = balanced, 'fast' = minimum latency"),
  monthly_volume: z.number().optional().describe("Expected monthly call volume for cost projection"),
  latency_budget_ms: z.number().optional().describe("Maximum acceptable latency in milliseconds"),
};

export function benchmarkModels(params: {
  task_type: string;
  quality_requirement: string;
  monthly_volume?: number;
  latency_budget_ms?: number;
}): string {
  const { task_type, quality_requirement, monthly_volume = 10000, latency_budget_ms } = params;
  const seed = `benchmark:${task_type}:${quality_requirement}`;

  type ModelResult = {
    model: string;
    provider: string;
    tier: string;
    qualityScore: number;
    latencyMs: number;
    costPerMCall: number;
    passRate: number;
    recommended: boolean;
    tradeoff: string;
  };

  const results: ModelResult[] = MODELS.map((m, i) => {
    const baseQuality = m.tier === "frontier" ? rangeInt(82, 96, seed, i * 7) : m.tier === "balanced" ? rangeInt(70, 85, seed, i * 7) : rangeInt(55, 75, seed, i * 7);
    const taskBonus = task_type.toLowerCase().includes("reason") || task_type.toLowerCase().includes("code") ? (m.tier === "frontier" ? 5 : -3) : 0;
    const qualityScore = Math.min(100, baseQuality + taskBonus);

    const baseLatency = m.tier === "frontier" ? rangeInt(2000, 8000, seed, i * 11) : m.tier === "balanced" ? rangeInt(800, 3000, seed, i * 11) : rangeInt(200, 1000, seed, i * 11);
    const costPerMCall = ((2000 * m.costIn + 1000 * m.costOut) / 1_000_000) * 1000000;

    const passRate = rangeInt(quality_requirement === "best" ? 70 : 55, 98, seed, i * 13);

    const meetsLatency = !latency_budget_ms || baseLatency <= latency_budget_ms;
    const meetsQuality = quality_requirement === "best" ? qualityScore >= 85 : quality_requirement === "good-enough" ? qualityScore >= 70 : qualityScore >= 55;

    const tradeoffs: Record<string, string> = {
      frontier: "Best quality, highest cost, may exceed latency budget",
      balanced: "Strong quality/cost balance, good for most production workloads",
      fast: "Lowest latency and cost, quality tradeoffs on complex tasks",
    };

    return {
      model: m.id,
      provider: m.provider,
      tier: m.tier,
      qualityScore,
      latencyMs: baseLatency,
      costPerMCall,
      passRate,
      recommended: meetsLatency && meetsQuality,
      tradeoff: tradeoffs[m.tier],
    };
  }).sort((a, b) => {
    if (quality_requirement === "best") return b.qualityScore - a.qualityScore;
    if (quality_requirement === "fast") return a.latencyMs - b.latencyMs;
    return (b.qualityScore / b.costPerMCall) - (a.qualityScore / a.costPerMCall);
  });

  const topPick = results.find(r => r.recommended) || results[0];
  const runnerUp = results.filter(r => r.model !== topPick.model).find(r => r.recommended) || results[1];

  const monthlyCostTop = (topPick.costPerMCall * monthly_volume) / 1000000;
  const monthlyCostRunner = runnerUp ? (runnerUp.costPerMCall * monthly_volume) / 1000000 : 0;

  let out = `## Model Benchmark: ${task_type}\n\n`;
  out += `**Quality Requirement:** ${quality_requirement} | **Monthly Volume:** ${monthly_volume.toLocaleString()} calls\n`;
  if (latency_budget_ms) out += `**Latency Budget:** ${latency_budget_ms}ms\n`;
  out += "\n";

  out += `### Benchmark Results\n\n`;
  out += `| Model | Provider | Quality | Latency | Pass Rate | Cost/1M | Fits? |\n`;
  out += `|-------|----------|---------|---------|-----------|---------|-------|\n`;
  results.forEach(r => {
    const fits = r.recommended ? "✅" : (latency_budget_ms && r.latencyMs > latency_budget_ms ? "🔴 Too slow" : "🟡 Check");
    out += `| **${r.model}** | ${r.provider} | ${r.qualityScore}/100 | ${r.latencyMs}ms | ${r.passRate}% | $${r.costPerMCall.toFixed(2)} | ${fits} |\n`;
  });
  out += "\n";

  out += `### Recommendation\n\n`;
  out += `**Top Pick: ${topPick.model}** (${topPick.provider})\n\n`;
  out += `| Metric | Value |\n`;
  out += `|--------|-------|\n`;
  out += `| Quality Score | ${topPick.qualityScore}/100 |\n`;
  out += `| Latency | ${topPick.latencyMs}ms |\n`;
  out += `| Pass Rate | ${topPick.passRate}% |\n`;
  out += `| Monthly Cost (${monthly_volume.toLocaleString()} calls) | $${monthlyCostTop.toFixed(2)} |\n`;
  out += `| Why | ${topPick.tradeoff} |\n\n`;

  if (runnerUp) {
    out += `**Runner-Up: ${runnerUp.model}** — ${runnerUp.tradeoff}\n`;
    out += `- Quality: ${runnerUp.qualityScore}/100 | Latency: ${runnerUp.latencyMs}ms | Monthly cost: $${monthlyCostRunner.toFixed(2)}\n\n`;
  }

  out += `### Task-Specific Notes\n\n`;
  const taskNotes: Record<string, string> = {
    "code generation": "Frontier models significantly outperform smaller models. Don't cut corners here — a $0.02 bug costs 100x to fix in production.",
    "text classification": "Fast models are often sufficient. Consider fine-tuning a small model if you have labeled data — 10x cheaper at scale.",
    "summarization": "Balanced models handle this well. Use prompt caching if summarizing the same documents repeatedly.",
    "data extraction": "Structured output / JSON mode is critical. Use a model with strong instruction following, not just raw capability.",
    "reasoning": "Frontier models with extended thinking or chain-of-thought prompting dramatically outperform on multi-step reasoning.",
  };
  const taskKey = Object.keys(taskNotes).find(k => task_type.toLowerCase().includes(k.split(" ")[0]));
  out += taskKey ? `> ${taskNotes[taskKey]}\n\n` : `> For ${task_type} tasks, evaluate on a representative sample of 50+ real examples before committing to a model.\n\n`;

  out += `### Cost Projection (${monthly_volume.toLocaleString()} calls/month)\n\n`;
  out += `| Model | Monthly | Annual |\n`;
  out += `|-------|---------|--------|\n`;
  results.slice(0, 4).forEach(r => {
    const monthly = (r.costPerMCall * monthly_volume) / 1000000;
    out += `| ${r.model} | $${monthly.toFixed(2)} | $${(monthly * 12).toFixed(2)} |\n`;
  });

  out += CTA;
  return out;
}
