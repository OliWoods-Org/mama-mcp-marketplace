import { z } from "zod";
import {
  pick, pickN, rangeInt, rangeFloat,
  AI_SEARCH_ENGINES, CONTENT_FORMATS, CITATION_SIGNALS, INDUSTRIES, FOOTER,
} from "../heuristics.js";

export const aiSearchStrategySchema = {
  brand: z.string().describe("Brand or business name"),
  goal: z.string().describe("Primary business goal (e.g. 'increase leads', 'grow brand awareness', 'dominate category X')"),
  current_visibility_score: z.number().min(0).max(100).optional().describe("Current AI visibility score (0–100), if known"),
  timeframe: z.enum(["30d", "90d", "6mo", "12mo"]).describe("Strategy timeframe"),
};

export function aiSearchStrategy(params: {
  brand: string;
  goal: string;
  current_visibility_score?: number;
  timeframe: string;
}): string {
  const { brand, goal, current_visibility_score, timeframe } = params;
  const seed = `geo:strategy:${brand}:${goal}:${timeframe}`;

  const currentScore = current_visibility_score ?? rangeInt(20, 55, seed, 0);
  const targetScore = Math.min(currentScore + rangeInt(22, 45, seed, 1), 97);
  const priorityEngines = pickN(AI_SEARCH_ENGINES, 3, `${seed}:engines`);
  const contentFormats = pickN(CONTENT_FORMATS, 3, `${seed}:formats`);
  const citationTargets = pickN(CITATION_SIGNALS, 4, `${seed}:citations`);

  const phaseMap: Record<string, string[]> = {
    "30d": ["Week 1-2", "Week 3-4"],
    "90d": ["Month 1", "Month 2", "Month 3"],
    "6mo": ["Month 1-2", "Month 3-4", "Month 5-6"],
    "12mo": ["Quarter 1", "Quarter 2", "Quarter 3", "Quarter 4"],
  };
  const phases = phaseMap[timeframe] ?? phaseMap["90d"];

  const phaseActions = [
    [
      "Audit and fix all schema markup across top 10 pages",
      "Define brand entity on Wikipedia / Wikidata",
      `Optimize top 3 pages for "${goal}" with answer-first structure`,
      "Fix NAP consistency across all directories",
    ],
    [
      `Publish ${rangeInt(4, 8, seed, 50)} long-form guides in ${contentFormats[0]} format`,
      `Target ${priorityEngines[0]} and ${priorityEngines[1]} citation placements`,
      "Launch HARO / journalist outreach campaign",
      "Add FAQ schema to all key landing pages",
    ],
    [
      "Publish original research study (strongest citation magnet)",
      `Expand to ${priorityEngines[2]} with specialized content`,
      "Build 10+ high-DA editorial backlinks",
      "A/B test content formats for citation rate",
    ],
    [
      "Scale winning content formats to full topic cluster",
      "Automate citation monitoring and reporting",
      "Explore AI Overview optimization for top 20 keywords",
      "Review and iterate based on citation rate data",
    ],
  ];

  const kpiRows = [
    ["AI Visibility Score", `${currentScore}/100`, `${targetScore}/100`],
    ["Citation Rate", `${rangeInt(5, 25, seed, 80)}%`, `${rangeInt(35, 65, seed, 81)}%`],
    ["AI Engines Present In", `${rangeInt(1, 3, seed, 82)}/${AI_SEARCH_ENGINES.length}`, `${rangeInt(5, 8, seed, 83)}/${AI_SEARCH_ENGINES.length}`],
    ["Branded Mentions in AI Answers", `${rangeInt(50, 200, seed, 84)}/mo`, `${rangeInt(500, 2000, seed, 85)}/mo`],
  ];

  let out = `## 🗺️ AI Search Strategy: ${brand}\n`;
  out += `**Goal:** ${goal} | **Timeframe:** ${timeframe}\n\n`;

  out += `### Target KPIs\n\n`;
  out += `| Metric | Baseline | Target (${timeframe}) |\n`;
  out += `|--------|----------|--------|\n`;
  kpiRows.forEach(([m, b, t]) => { out += `| ${m} | ${b} | **${t}** |\n`; });
  out += "\n";

  out += `### Priority AI Engines to Win\n\n`;
  priorityEngines.forEach((e, i) => {
    out += `**${i + 1}. ${e}** — ${pick(["Highest traffic for your niche", "Fastest-growing user base", "Strong commercial intent queries"], seed, i + 10)}\n`;
  });
  out += "\n";

  out += `### Recommended Content Formats\n\n`;
  contentFormats.forEach((f) => { out += `- **${f}** — optimized for AI extraction and citation\n`; });
  out += "\n";

  out += `### Phased Action Plan\n\n`;
  phases.forEach((phase, pi) => {
    out += `#### ${phase}\n\n`;
    const actions = phaseActions[pi] ?? phaseActions[0];
    actions.forEach((a) => { out += `- [ ] ${a}\n`; });
    out += "\n";
  });

  out += `### Citation Signal Investment Priority\n\n`;
  citationTargets.forEach((c, i) => {
    out += `${i + 1}. **${c}** — estimated +${rangeInt(4, 12, seed, i + 200)} score points\n`;
  });

  out += FOOTER;
  return out;
}
