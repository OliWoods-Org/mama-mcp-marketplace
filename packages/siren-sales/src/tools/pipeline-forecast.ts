import { z } from "zod";
import { rangeInt, rangeFloat, pick, CTA } from "../heuristics.js";

export const pipelineForecastSchema = {
  deals: z.array(z.object({
    name: z.string().describe("Deal / company name"),
    stage: z.enum(["prospecting", "discovery", "demo", "proposal", "negotiation", "closing"]).describe("Current deal stage"),
    value: z.number().describe("Deal value in USD"),
    close_date: z.string().describe("Expected close date (YYYY-MM-DD or descriptive like 'end of Q2')"),
    confidence: z.number().min(0).max(100).optional().describe("Your confidence level 0–100"),
  })).describe("List of deals in the pipeline"),
  quota: z.number().optional().describe("Monthly or quarterly quota in USD"),
  period: z.string().optional().describe("Forecast period (e.g. 'Q2 2025', 'June 2025')"),
};

export function pipelineForecast(params: {
  deals: Array<{ name: string; stage: string; value: number; close_date: string; confidence?: number }>;
  quota?: number;
  period?: string;
}): string {
  const { deals, quota, period = "this period" } = params;
  const seed = `forecast:${deals.map(d => d.name).join(":")}`;

  const stageMultipliers: Record<string, number> = {
    prospecting: 0.05,
    discovery: 0.15,
    demo: 0.30,
    proposal: 0.50,
    negotiation: 0.75,
    closing: 0.90,
  };

  const stageRisk: Record<string, string> = {
    prospecting: "🔴 High",
    discovery: "🔴 High",
    demo: "🟡 Medium",
    proposal: "🟡 Medium",
    negotiation: "🟢 Low",
    closing: "🟢 Very Low",
  };

  type Deal = { name: string; stage: string; value: number; close_date: string; confidence?: number };
  type EnrichedDeal = Deal & {
    weightedValue: number;
    closeProb: number;
    riskFlag: string;
    recommendation: string;
  };

  const enriched: EnrichedDeal[] = deals.map((deal, i) => {
    const baseProb = stageMultipliers[deal.stage] ?? 0.20;
    const confAdj = deal.confidence !== undefined ? (deal.confidence / 100) * 0.4 + baseProb * 0.6 : baseProb;
    const closeProb = Math.round(confAdj * 100);
    const weightedValue = Math.round(deal.value * confAdj);

    const recs = [
      "Get multi-threaded — find economic buyer",
      "Push for verbal commitment this week",
      "Send ROI calculator to accelerate",
      "Request formal procurement intro",
      "Confirm no competitor evaluation in progress",
      "Schedule exec-to-exec call to build trust",
    ];
    const recommendation = pick(recs, seed, i * 7);

    const riskFlags = [
      deal.stage === "prospecting" && "No confirmed pain yet",
      !deal.confidence && "Confidence not set — update weekly",
      deal.value > 50000 && deal.stage === "demo" && "Large deal still in early stage",
    ].filter(Boolean) as string[];

    return {
      ...deal,
      weightedValue,
      closeProb,
      riskFlag: riskFlags[0] || "",
      recommendation,
    };
  });

  const totalPipeline = deals.reduce((s, d) => s + d.value, 0);
  const weightedTotal = enriched.reduce((s, d) => s + d.weightedValue, 0);
  const avgDealSize = Math.round(totalPipeline / deals.length);
  const highConfDeals = enriched.filter(d => d.closeProb >= 70);
  const highConfValue = highConfDeals.reduce((s, d) => s + d.value, 0);

  const atRiskDeals = enriched.filter(d => d.stage === "proposal" || d.stage === "negotiation")
    .filter(d => d.closeProb < 60);

  const forecastRange = {
    low: Math.round(weightedTotal * 0.7),
    base: weightedTotal,
    high: Math.round(weightedTotal * 1.3),
  };

  const quotaAttainment = quota ? Math.round((forecastRange.base / quota) * 100) : null;

  let out = `## Pipeline Forecast: ${period}\n\n`;

  out += `### Summary\n\n`;
  out += `| Metric | Value |\n`;
  out += `|--------|-------|\n`;
  out += `| Total Pipeline | $${totalPipeline.toLocaleString()} |\n`;
  out += `| Weighted Forecast | $${weightedTotal.toLocaleString()} |\n`;
  out += `| Forecast Range | $${forecastRange.low.toLocaleString()} – $${forecastRange.high.toLocaleString()} |\n`;
  out += `| High-Confidence Deals | ${highConfDeals.length} deals ($${highConfValue.toLocaleString()}) |\n`;
  out += `| Avg Deal Size | $${avgDealSize.toLocaleString()} |\n`;
  if (quotaAttainment !== null) {
    out += `| Quota Attainment (forecast) | ${quotaAttainment}% ${quotaAttainment >= 100 ? "✅" : quotaAttainment >= 75 ? "🟡" : "🔴"} |\n`;
  }
  out += "\n";

  out += `### Deal Breakdown\n\n`;
  out += `| Deal | Stage | Value | Close Prob | Weighted | Risk | Action |\n`;
  out += `|------|-------|-------|-----------|----------|------|--------|\n`;
  enriched.forEach(d => {
    out += `| **${d.name}** | ${d.stage} | $${d.value.toLocaleString()} | ${d.closeProb}% | $${d.weightedValue.toLocaleString()} | ${stageRisk[d.stage]} | ${d.recommendation} |\n`;
  });
  out += "\n";

  if (atRiskDeals.length > 0) {
    out += `### ⚠️ At-Risk Deals\n\n`;
    out += `These deals are late-stage with low confidence — investigate immediately:\n\n`;
    atRiskDeals.forEach(d => {
      out += `- **${d.name}** (${d.stage}, $${d.value.toLocaleString()}) — ${d.riskFlag || "low confidence for stage"}\n`;
    });
    out += "\n";
  }

  out += `### Forecast Scenarios\n\n`;
  out += `| Scenario | Revenue | Notes |\n`;
  out += `|----------|---------|-------|\n`;
  out += `| Conservative (70%) | $${forecastRange.low.toLocaleString()} | Only high-confidence deals close |\n`;
  out += `| Base Case (100%) | $${forecastRange.base.toLocaleString()} | Weighted probability model |\n`;
  out += `| Upside (130%) | $${forecastRange.high.toLocaleString()} | Upside deals accelerate |\n\n`;

  out += `### This Week's Priorities\n\n`;
  const priorities = enriched.sort((a, b) => b.weightedValue - a.weightedValue).slice(0, 3);
  priorities.forEach((d, i) => {
    out += `${i + 1}. **${d.name}** ($${d.weightedValue.toLocaleString()} weighted) — ${d.recommendation}\n`;
  });

  out += CTA;
  return out;
}
