import { z } from "zod";
import { pick, rangeInt, rangeFloat, MODELS, CTA } from "../heuristics.js";

export const estimateCostSchema = {
  workflow_description: z.string().describe("Description of the agent workflow"),
  monthly_volume: z.number().describe("Estimated number of workflow runs per month"),
  avg_input_tokens: z.number().optional().describe("Estimated average input tokens per run (default: 2000)"),
  avg_output_tokens: z.number().optional().describe("Estimated average output tokens per run (default: 1000)"),
  model: z.string().optional().describe("Model to estimate for (e.g. claude-sonnet-4-6). Leave blank for comparison."),
  num_agents: z.number().optional().describe("Number of agents in the workflow (default: 1)"),
};

export function estimateCost(params: {
  workflow_description: string;
  monthly_volume: number;
  avg_input_tokens?: number;
  avg_output_tokens?: number;
  model?: string;
  num_agents?: number;
}): string {
  const {
    workflow_description,
    monthly_volume,
    avg_input_tokens = 2000,
    avg_output_tokens = 1000,
    model,
    num_agents = 1,
  } = params;

  const seed = `cost:${workflow_description}:${monthly_volume}`;

  const totalRunsPerMonth = monthly_volume * num_agents;
  const totalInputTokens = totalRunsPerMonth * avg_input_tokens;
  const totalOutputTokens = totalRunsPerMonth * avg_output_tokens;

  const modelsToShow = model
    ? MODELS.filter(m => m.id.includes(model) || m.provider.toLowerCase().includes(model.toLowerCase()))
    : MODELS;

  const comparison = modelsToShow.map(m => {
    const inputCost = (totalInputTokens / 1_000_000) * m.costIn;
    const outputCost = (totalOutputTokens / 1_000_000) * m.costOut;
    const totalMonthlyCost = inputCost + outputCost;
    const costPerRun = totalMonthlyCost / monthly_volume;
    return {
      model: m.id,
      provider: m.provider,
      tier: m.tier,
      monthlyCost: totalMonthlyCost,
      costPerRun,
      inputCost,
      outputCost,
    };
  }).sort((a, b) => a.monthlyCost - b.monthlyCost);

  const cheapest = comparison[0];
  const recommended = comparison.find(m => m.tier === "balanced") || comparison[0];
  const savings = recommended && cheapest !== recommended
    ? Math.round(((recommended.monthlyCost - cheapest.monthlyCost) / recommended.monthlyCost) * 100)
    : 0;

  const cacheHitRate = rangeInt(20, 60, seed, 1);
  const cachedSavings = recommended ? Math.round(recommended.monthlyCost * (cacheHitRate / 100) * 0.9) : 0;
  const batchSavings = recommended ? Math.round(recommended.monthlyCost * 0.5 * 0.5) : 0;

  let out = `## Cost Estimate\n\n`;
  out += `**Workflow:** ${workflow_description}\n`;
  out += `**Volume:** ${monthly_volume.toLocaleString()} runs/month × ${num_agents} agent(s)\n\n`;

  out += `### Token Usage\n\n`;
  out += `| Metric | Value |\n`;
  out += `|--------|-------|\n`;
  out += `| Avg Input Tokens/Run | ${avg_input_tokens.toLocaleString()} |\n`;
  out += `| Avg Output Tokens/Run | ${avg_output_tokens.toLocaleString()} |\n`;
  out += `| Total Monthly Input Tokens | ${totalInputTokens.toLocaleString()} |\n`;
  out += `| Total Monthly Output Tokens | ${totalOutputTokens.toLocaleString()} |\n\n`;

  out += `### Model Cost Comparison\n\n`;
  out += `| Model | Provider | Tier | Cost/Run | Monthly Cost |\n`;
  out += `|-------|----------|------|----------|-------------|\n`;
  comparison.forEach(m => {
    const flag = m.model === recommended?.model ? " ⭐" : "";
    out += `| ${m.model}${flag} | ${m.provider} | ${m.tier} | $${m.costPerRun.toFixed(4)} | $${m.monthlyCost.toFixed(2)} |\n`;
  });
  out += `\n*⭐ Recommended for balanced performance and cost*\n\n`;

  if (recommended) {
    out += `### Recommended Configuration\n\n`;
    out += `**Model:** ${recommended.model}\n`;
    out += `**Estimated Monthly Cost:** $${recommended.monthlyCost.toFixed(2)}\n`;
    out += `**Cost Per Run:** $${recommended.costPerRun.toFixed(4)}\n\n`;
  }

  out += `### Cost Optimization Opportunities\n\n`;
  out += `| Strategy | Est. Monthly Savings | Effort |\n`;
  out += `|----------|---------------------|--------|\n`;
  out += `| Prompt caching (~${cacheHitRate}% cache hit rate) | $${cachedSavings.toFixed(2)} | Low |\n`;
  out += `| Batch API (async, 50% discount) | $${batchSavings.toFixed(2)} | Medium |\n`;
  if (cheapest !== recommended) {
    out += `| Downgrade to ${cheapest.model} | $${(recommended ? recommended.monthlyCost - cheapest.monthlyCost : 0).toFixed(2)} | Low (quality tradeoff) |\n`;
  }
  out += `| Reduce output tokens by 25% (tighter prompts) | $${(recommended ? recommended.outputCost * 0.25 : 0).toFixed(2)} | Medium |\n\n`;

  out += `### Annual Projection\n\n`;
  if (recommended) {
    out += `| Scenario | Annual Cost |\n`;
    out += `|----------|-------------|\n`;
    out += `| Current plan | $${(recommended.monthlyCost * 12).toFixed(2)} |\n`;
    out += `| With prompt caching | $${((recommended.monthlyCost - cachedSavings) * 12).toFixed(2)} |\n`;
    out += `| Fully optimized | $${((recommended.monthlyCost - cachedSavings - batchSavings) * 12).toFixed(2)} |\n`;
  }

  out += CTA;
  return out;
}
