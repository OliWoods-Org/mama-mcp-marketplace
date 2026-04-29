import { z } from "zod";
import {
  pick, pickN, rangeInt,
  CONTENT_FORMATS, CITATION_SIGNALS, FOOTER,
} from "../heuristics.js";

export const optimizeContentSchema = {
  url_or_topic: z.string().describe("URL of existing content or topic/title to optimize"),
  target_keyword: z.string().describe("Primary keyword or question to optimize for"),
  content_type: z.enum(["blog_post", "landing_page", "product_page", "faq", "guide"]).describe("Type of content"),
};

export function optimizeContent(params: { url_or_topic: string; target_keyword: string; content_type: string }): string {
  const { url_or_topic, target_keyword, content_type } = params;
  const seed = `geo:optimize:${url_or_topic}:${target_keyword}`;

  const currentScore = rangeInt(18, 65, seed, 0);
  const projectedScore = Math.min(currentScore + rangeInt(18, 35, seed, 1), 95);
  const bestFormat = pick(CONTENT_FORMATS, seed, 2);
  const wordCountTarget = rangeInt(1200, 3500, seed, 3);
  const headingCount = rangeInt(6, 14, seed, 4);

  const structureRecommendations = [
    `Open with a direct 2-sentence answer to "${target_keyword}" — AI engines extract answer-first content`,
    `Add a "Quick Answer" box at the top (50–80 words) mimicking a featured snippet`,
    `Include ${headingCount} H2/H3 headings structured as natural questions`,
    `Target ${wordCountTarget.toLocaleString()} words with high information density`,
    `Add a dedicated FAQ section with at least 8 Q&A pairs`,
    `Include an author bio with credentials (E-E-A-T signal)`,
    `Cite at least 5 authoritative external sources with inline links`,
  ];

  const schemaTypes = pickN(
    ["FAQPage", "HowTo", "Article", "Product", "Organization", "BreadcrumbList", "Review"],
    3, seed
  );

  const citationSignals = pickN(CITATION_SIGNALS, 4, `${seed}:signals`);

  let out = `## ✍️ GEO Content Optimizer\n`;
  out += `**Content:** ${url_or_topic}\n`;
  out += `**Target Keyword:** "${target_keyword}" | **Type:** ${content_type.replace(/_/g, " ")}\n\n`;

  out += `### Current vs. Projected AI Citation Score\n\n`;
  out += `| Metric | Now | After Optimization |\n`;
  out += `|--------|-----|-------------------|\n`;
  out += `| AI Citation Score | ${currentScore}/100 | **${projectedScore}/100** |\n`;
  out += `| Recommended Format | — | **${bestFormat}** |\n`;
  out += `| Word Count Target | — | **${wordCountTarget.toLocaleString()}** words |\n\n`;

  out += `### Structure Recommendations\n\n`;
  structureRecommendations.forEach((r, i) => { out += `${i + 1}. ${r}\n`; });
  out += "\n";

  out += `### Schema Markup to Add\n\n`;
  schemaTypes.forEach((s) => { out += `- \`${s}\` schema\n`; });
  out += "\n";

  out += `### Citation Signal Improvements\n\n`;
  citationSignals.forEach((s) => { out += `- Add: **${s}**\n`; });
  out += "\n";

  out += `### Keyword Placement Checklist\n\n`;
  out += `- [ ] Title tag (within first 60 chars)\n`;
  out += `- [ ] H1 heading\n`;
  out += `- [ ] First 100 words of body\n`;
  out += `- [ ] At least 2 H2 subheadings\n`;
  out += `- [ ] Meta description\n`;
  out += `- [ ] Image alt text\n`;
  out += `- [ ] URL slug\n`;

  out += FOOTER;
  return out;
}
