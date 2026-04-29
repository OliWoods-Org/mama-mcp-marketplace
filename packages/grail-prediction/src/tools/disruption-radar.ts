import { z } from "zod";
import {
  hash, pick, pickN, rangeInt, rangeFloat, seededRandom,
  AI_COMPANIES, SIGNAL_TYPES, DISRUPTION_HEADLINES, FOOTER,
} from "../heuristics.js";

export const disruptionRadarSchema = {
  sector: z.string().describe("Sector to scan (e.g. 'AI chips', 'LLMs', 'autonomous vehicles', 'Enterprise AI', 'Cloud AI')"),
  timeframe: z.enum(["24h", "48h", "1w", "1m"]).describe("How far back to scan"),
};

export function disruptionRadar(params: { sector: string; timeframe: string }): string {
  const { sector, timeframe } = params;
  const seed = `radar:${sector}:${timeframe}`;
  const countMap: Record<string, number> = { "24h": 3, "48h": 5, "1w": 8, "1m": 15 };
  const count = countMap[timeframe] || 5;

  const sectorCompanies = AI_COMPANIES.filter(
    (c) => c.sector.toLowerCase().includes(sector.toLowerCase())
  );
  const companies = sectorCompanies.length > 0 ? sectorCompanies : AI_COMPANIES;

  const headlines = DISRUPTION_HEADLINES[sector] || DISRUPTION_HEADLINES["LLMs"];

  const signals: string[] = [];
  for (let i = 0; i < count; i++) {
    const company = pick(companies, seed, i);
    const signalType = pick([...SIGNAL_TYPES], seed, i + 100);
    const headline = pick(headlines, seed, i + 200);
    const impact = rangeInt(3, 10, seed, i + 300);
    const hoursAgo = rangeInt(1, timeframe === "24h" ? 24 : timeframe === "48h" ? 48 : timeframe === "1w" ? 168 : 720, seed, i + 400);
    const source = pick(["SEC Filing", "PR Newswire", "Bloomberg", "TechCrunch", "ArXiv", "Reuters", "The Information"], seed, i + 500);

    const impactBar = "█".repeat(impact) + "░".repeat(10 - impact);
    signals.push(
      `| ${i + 1} | **${company.ticker}** | ${headline} | ${signalType.replace(/_/g, " ")} | ${source} | ${impactBar} ${impact}/10 | ${hoursAgo}h ago |`
    );
  }

  const highImpact = signals.filter((s) => s.includes("█████████") || s.includes("████████")).length;

  let out = `## 📡 Disruption Radar: ${sector}\n`;
  out += `**Timeframe:** ${timeframe} | **Signals detected:** ${count} | **High-impact:** ${highImpact}\n\n`;
  out += `| # | Ticker | Signal | Type | Source | Impact | When |\n`;
  out += `|---|--------|--------|------|--------|--------|------|\n`;
  out += signals.join("\n") + "\n\n";

  if (highImpact > 0) {
    out += `### ⚠️ High-Impact Alerts\n\n`;
    out += `${highImpact} signal(s) scored 8+ impact. These warrant immediate analysis and potential paper trade positioning.\n\n`;
  }

  out += `### Sector Sentiment\n\n`;
  const sentiment = rangeInt(30, 85, seed, 999);
  out += `**AI Disruption Index (${sector}):** ${sentiment}/100 — ${sentiment > 70 ? "🔴 Elevated" : sentiment > 50 ? "🟡 Moderate" : "🟢 Low"}\n`;
  out += FOOTER;
  return out;
}
