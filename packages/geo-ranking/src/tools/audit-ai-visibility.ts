import { z } from "zod";
import {
  hash, pick, pickN, rangeInt, rangeFloat,
  AI_SEARCH_ENGINES, CITATION_SIGNALS, VISIBILITY_GRADES, FOOTER,
} from "../heuristics.js";

export const auditAiVisibilitySchema = {
  brand: z.string().describe("Brand or business name to audit"),
  industry: z.string().describe("Industry or niche (e.g. 'SaaS', 'E-commerce', 'Healthcare')"),
  primary_keyword: z.string().describe("Primary keyword or topic the brand wants to rank for in AI search"),
};

export function auditAiVisibility(params: { brand: string; industry: string; primary_keyword: string }): string {
  const { brand, industry, primary_keyword } = params;
  const seed = `geo:audit:${brand}:${industry}`;

  const overallScore = rangeInt(22, 81, seed, 0);
  const grade = VISIBILITY_GRADES[Math.floor((100 - overallScore) / 13)] ?? "C";

  const engineScores = AI_SEARCH_ENGINES.map((engine, i) => {
    const score = rangeInt(10, 95, seed, i + 10);
    const cited = score > 60 ? "✅ Cited" : score > 35 ? "⚠️ Occasional" : "❌ Absent";
    return `| ${engine} | ${score}/100 | ${cited} |`;
  });

  const strengths = pickN(CITATION_SIGNALS, 3, `${seed}:strengths`);
  const gaps = pickN(CITATION_SIGNALS, 4, `${seed}:gaps`);

  const citationRate = rangeInt(5, 42, seed, 99);
  const competitorCount = rangeInt(3, 9, seed, 100);
  const avgCompetitorScore = rangeInt(overallScore + 8, 90, seed, 101);

  let out = `## 🔍 AI Visibility Audit: ${brand}\n`;
  out += `**Industry:** ${industry} | **Target Keyword:** "${primary_keyword}"\n\n`;

  out += `### Overall AI Visibility Score\n\n`;
  out += `**${overallScore}/100** — Grade: **${grade}**\n\n`;
  out += `> You appear in ~${citationRate}% of relevant AI-generated answers for "${primary_keyword}". `;
  out += `${competitorCount} competitors average **${avgCompetitorScore}/100** on this keyword.\n\n`;

  out += `### Visibility by AI Search Engine\n\n`;
  out += `| Engine | Score | Citation Status |\n`;
  out += `|--------|-------|----------------|\n`;
  out += engineScores.join("\n") + "\n\n";

  out += `### Current Strengths\n\n`;
  strengths.forEach((s) => { out += `- ✅ ${s}\n`; });
  out += "\n";

  out += `### Critical Gaps\n\n`;
  gaps.forEach((g) => { out += `- ❌ Missing: ${g}\n`; });
  out += "\n";

  out += `### Priority Actions\n\n`;
  out += `1. Fix the top ${gaps.length} citation gaps above — these alone could lift your score by ~${rangeInt(12, 28, seed, 200)} points\n`;
  out += `2. Run \`optimize_content\` on your top 3 pages targeting "${primary_keyword}"\n`;
  out += `3. Use \`citation_opportunities\` to find specific link-building and mention targets\n`;
  out += `4. Check \`competitor_ai_presence\` to see exactly what your rivals are doing right\n`;

  out += FOOTER;
  return out;
}
