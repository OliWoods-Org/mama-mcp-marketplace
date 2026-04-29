import { z } from "zod";
import {
  pick, pickN, rangeInt,
  INDUSTRIES, CITATION_SIGNALS, FOOTER,
} from "../heuristics.js";

export const citationOpportunitiesSchema = {
  brand: z.string().describe("Your brand or business name"),
  niche: z.string().describe("Your niche or industry"),
  target_keywords: z.array(z.string()).min(1).max(5).describe("Keywords you want to be cited for (1–5)"),
};

const OPPORTUNITY_TYPES = [
  "Guest post on industry publication",
  "HARO / journalist source request",
  "Niche directory listing",
  "Podcast guest appearance",
  "Wikipedia citation",
  "Reddit AMA or thread contribution",
  "Quora expert answer",
  "Data study / original research",
  "Tool review on comparison site",
  "YouTube collaboration",
  "Community forum participation",
  "Scholarship link building",
  "Resource page link",
  "Podcast sponsorship with show notes link",
];

const PUBLICATION_TYPES = [
  "Top industry blog (DA 70+)",
  "Trade publication",
  "Local news outlet",
  "Niche community forum",
  "LinkedIn newsletter",
  "Substack publication",
  "Medium publication",
  "Podcast show notes",
];

export function citationOpportunities(params: { brand: string; niche: string; target_keywords: string[] }): string {
  const { brand, niche, target_keywords } = params;
  const seed = `geo:citation:${brand}:${niche}`;

  const totalOpportunities = rangeInt(18, 47, seed, 0);
  const quickWins = rangeInt(4, 9, seed, 1);
  const highImpact = rangeInt(3, 7, seed, 2);

  const opportunities = target_keywords.flatMap((kw, ki) => {
    const count = rangeInt(2, 5, `${seed}:kw${ki}`, 0);
    return Array.from({ length: count }, (_, i) => {
      const type = pick(OPPORTUNITY_TYPES, `${seed}:kw${ki}`, i);
      const pub = pick(PUBLICATION_TYPES, `${seed}:pub${ki}`, i);
      const effort = pick(["Low", "Medium", "High"] as const, `${seed}:effort${ki}`, i);
      const impact = pick(["Medium", "High", "Very High"] as const, `${seed}:impact${ki}`, i);
      return { kw, type, pub, effort, impact };
    });
  }).slice(0, 10);

  const topSignals = pickN(CITATION_SIGNALS, 3, `${seed}:top`);

  let out = `## 🔗 Citation Opportunities: ${brand}\n`;
  out += `**Niche:** ${niche} | **Keywords:** ${target_keywords.map((k) => `"${k}"`).join(", ")}\n\n`;

  out += `### Opportunity Summary\n\n`;
  out += `| Metric | Count |\n`;
  out += `|--------|-------|\n`;
  out += `| Total opportunities identified | **${totalOpportunities}** |\n`;
  out += `| Quick wins (< 1 week effort) | **${quickWins}** |\n`;
  out += `| High-impact opportunities | **${highImpact}** |\n\n`;

  out += `### Top Citation Opportunities\n\n`;
  out += `| Keyword | Opportunity Type | Platform Type | Effort | Impact |\n`;
  out += `|---------|-----------------|---------------|--------|--------|\n`;
  opportunities.forEach(({ kw, type, pub, effort, impact }) => {
    const effortIcon = effort === "Low" ? "🟢" : effort === "Medium" ? "🟡" : "🔴";
    const impactIcon = impact === "Very High" ? "🚀" : impact === "High" ? "⬆️" : "➡️";
    out += `| "${kw}" | ${type} | ${pub} | ${effortIcon} ${effort} | ${impactIcon} ${impact} |\n`;
  });
  out += "\n";

  out += `### Foundation Signals to Build First\n\n`;
  out += `These citation signals have the highest ROI for AI search visibility:\n\n`;
  topSignals.forEach((s, i) => {
    out += `**${i + 1}. ${s}**\n`;
    out += `   AI engines weight this heavily — fix it before pursuing outreach.\n\n`;
  });

  out += `### 30-Day Citation Sprint Plan\n\n`;
  out += `**Week 1:** Fix foundation signals (schema, entity definition, NAP consistency)\n`;
  out += `**Week 2:** Claim top ${quickWins} quick-win placements\n`;
  out += `**Week 3:** Pitch ${rangeInt(3, 6, seed, 300)} guest posts / journalist sources\n`;
  out += `**Week 4:** Publish original research to earn organic citations\n`;

  out += FOOTER;
  return out;
}
