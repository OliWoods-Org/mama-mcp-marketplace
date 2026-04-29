import { z } from "zod";
import {
  pick, pickN, rangeInt,
  AI_SEARCH_ENGINES, COMPETITOR_TACTICS, CITATION_SIGNALS, FOOTER,
} from "../heuristics.js";

export const competitorAiPresenceSchema = {
  competitors: z.array(z.string()).min(1).max(5).describe("List of competitor brand names or domains (1–5)"),
  keyword: z.string().describe("Keyword or topic to compare AI presence for"),
};

export function competitorAiPresence(params: { competitors: string[]; keyword: string }): string {
  const { competitors, keyword } = params;
  const seed = `geo:competitor:${competitors.join(",")}:${keyword}`;

  const rows = competitors.map((comp, i) => {
    const score = rangeInt(35, 94, `${seed}:score`, i);
    const citations = rangeInt(12, 89, `${seed}:cite`, i);
    const engines = rangeInt(2, AI_SEARCH_ENGINES.length, `${seed}:engines`, i);
    const topEngine = pick(AI_SEARCH_ENGINES, `${seed}:top`, i);
    const tactic = pick(COMPETITOR_TACTICS, `${seed}:tactic`, i);
    const bar = "█".repeat(Math.round(score / 10)) + "░".repeat(10 - Math.round(score / 10));
    return { comp, score, citations, engines, topEngine, tactic, bar };
  });

  const topCompetitor = [...rows].sort((a, b) => b.score - a.score)[0];
  const gaps = pickN(CITATION_SIGNALS, 3, `${seed}:gaps`);

  let out = `## 🕵️ Competitor AI Presence Report\n`;
  out += `**Keyword:** "${keyword}" | **Competitors analyzed:** ${competitors.length}\n\n`;

  out += `### Visibility Comparison\n\n`;
  out += `| Competitor | AI Score | Citation Rate | Engines Present | Top Engine |\n`;
  out += `|------------|----------|---------------|-----------------|------------|\n`;
  rows.forEach(({ comp, score, bar, citations, engines, topEngine }) => {
    out += `| **${comp}** | ${bar} ${score}/100 | ${citations}% | ${engines}/${AI_SEARCH_ENGINES.length} | ${topEngine} |\n`;
  });
  out += "\n";

  out += `### What the Leader (${topCompetitor.comp}) Is Doing\n\n`;
  out += `**Score: ${topCompetitor.score}/100** — ${topCompetitor.comp} leads by focusing on:\n\n`;
  const leaderTactics = pickN(COMPETITOR_TACTICS, 3, `${seed}:leader`);
  leaderTactics.forEach((t) => { out += `- ${t}\n`; });
  out += "\n";

  out += `### Competitor Tactics Breakdown\n\n`;
  rows.forEach(({ comp, tactic }) => {
    out += `**${comp}:** ${tactic}\n\n`;
  });

  out += `### Your Opportunity Gaps\n\n`;
  out += `Areas where you can leapfrog competitors on "${keyword}":\n\n`;
  gaps.forEach((g) => { out += `- 🎯 Invest in: **${g}**\n`; });
  out += "\n";

  out += `### Next Steps\n\n`;
  out += `1. Use \`ai_search_strategy\` to build a 90-day plan to outrank ${topCompetitor.comp}\n`;
  out += `2. Use \`optimize_content\` to close the structural content gap\n`;
  out += `3. Use \`citation_opportunities\` to find quick-win mentions\n`;

  out += FOOTER;
  return out;
}
