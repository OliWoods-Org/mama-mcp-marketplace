import { z } from "zod";
import {
  hash, rangeInt, rangeFloat, seededRandom, pick, pickN,
  AI_COMPANIES, PATENT_CATEGORIES, FOOTER,
} from "../heuristics.js";

export const predictDisruptionSchema = {
  company: z.string().describe("Company name or ticker"),
  sector: z.string().describe("Sector (e.g. 'AI chips', 'LLMs')"),
  horizon: z.enum(["1m", "3m", "6m", "12m"]).describe("Prediction horizon"),
};

export function predictDisruption(params: { company: string; sector: string; horizon: string }): string {
  const { company, sector, horizon } = params;
  const seed = `predict:${company}:${sector}:${horizon}`;

  const prob = rangeInt(25, 88, seed, 0);
  const priceImpactLow = rangeFloat(3, 12, seed, 1);
  const priceImpactHigh = priceImpactLow + rangeFloat(5, 20, seed, 2);

  const eventTypes = [
    "Major product launch with AI capabilities",
    "Strategic AI partnership announcement",
    "AI-driven earnings surprise (beat by 15%+)",
    "Acquisition of AI startup",
    "Regulatory approval for AI application",
    "Breakthrough research paper → product pipeline",
    "AI infrastructure expansion announcement",
    "New AI-native revenue stream disclosure",
  ];
  const predictedEvent = pick(eventTypes, seed, 3);

  const catalysts = [
    "Patent filing velocity 2.3x above 12-month average",
    "Key AI researcher hired from competitor in last 90 days",
    "GitHub commit velocity in AI repos up 45% MoM",
    "3 new data center permits filed in Q1",
    "Supplier orders for next-gen GPU clusters confirmed",
    "Academic papers at NeurIPS/ICML up 60% YoY",
    "Job postings for 'AI Agent' roles tripled in 30 days",
    "Insider buying pattern detected (3 executives, $2M+ combined)",
    "Supply chain checks indicate new product SKU in testing",
    "Partnership discussions with major cloud provider (leaked)",
  ];
  const selectedCatalysts = pickN(catalysts, rangeInt(3, 5, seed, 4), seed);

  const risks = [
    "Regulatory headwinds in target market",
    "Competitor may announce similar product first",
    "Execution risk on complex AI integration",
    "Macro environment could delay enterprise AI spend",
    "Key talent departures could slow R&D",
    "Patent challenges from incumbents",
    "Supply chain constraints on specialized hardware",
  ];
  const selectedRisks = pickN(risks, rangeInt(2, 4, seed, 5), seed);

  const direction = prob > 60 ? "long" : prob > 40 ? "neutral" : "short";
  const confidence = prob > 70 ? "High" : prob > 50 ? "Medium" : "Low";

  let out = `## 🔮 Disruption Prediction: ${company}\n\n`;
  out += `**Sector:** ${sector} | **Horizon:** ${horizon} | **Generated:** ${new Date().toISOString().slice(0, 10)}\n\n`;

  out += `### Prediction Summary\n\n`;
  out += `| Metric | Value |\n`;
  out += `|--------|-------|\n`;
  out += `| **Disruption Probability** | ${prob}% |\n`;
  out += `| **Predicted Event** | ${predictedEvent} |\n`;
  out += `| **Price Impact Estimate** | +${priceImpactLow.toFixed(1)}% to +${priceImpactHigh.toFixed(1)}% |\n`;
  out += `| **Confidence** | ${confidence} |\n`;
  out += `| **Recommended Position** | ${direction === "long" ? "🟢 LONG" : direction === "short" ? "🔴 SHORT" : "⚪ NEUTRAL"} |\n\n`;

  out += `### Key Catalysts\n\n`;
  selectedCatalysts.forEach((c, i) => { out += `${i + 1}. ${c}\n`; });

  out += `\n### Risk Factors\n\n`;
  selectedRisks.forEach((r, i) => { out += `${i + 1}. ⚠️ ${r}\n`; });

  out += `\n### Signal Convergence Map\n\n`;
  const signalLabels = ["Patents", "GitHub", "Jobs", "Supply Chain", "Academic", "Regulatory"];
  out += `| Signal | Strength | Direction |\n`;
  out += `|--------|----------|----------|\n`;
  for (let i = 0; i < signalLabels.length; i++) {
    const str = rangeInt(1, 10, seed, 100 + i);
    const dir = seededRandom(seed, 200 + i) > 0.4 ? "Bullish" : seededRandom(seed, 200 + i) > 0.2 ? "Neutral" : "Bearish";
    const bar = "█".repeat(str) + "░".repeat(10 - str);
    out += `| ${signalLabels[i]} | ${bar} ${str}/10 | ${dir} |\n`;
  }

  out += `\n### Actionable Recommendation\n\n`;
  if (prob > 70) {
    out += `**Strong signal convergence.** Multiple predictive indicators align for ${company} in ${sector}. Consider opening a paper trade position with ${horizon} horizon. Entry on pullbacks to support, target +${priceImpactLow.toFixed(0)}-${priceImpactHigh.toFixed(0)}% with tight stop.\n`;
  } else if (prob > 50) {
    out += `**Moderate signal.** Some indicators suggest disruption potential for ${company}. Monitor closely and wait for additional confirmation before positioning. Set alerts for key catalysts.\n`;
  } else {
    out += `**Weak signal.** Current indicators don't strongly support a disruption thesis for ${company} in the ${horizon} horizon. Continue monitoring but avoid premature positioning.\n`;
  }
  out += FOOTER;
  return out;
}
