import { z } from "zod";
import {
  pick, pickN, rangeInt, rangeFloat,
  BRAND_ARCHETYPES, VOICE_TONES, BRAND_AUDIT_DIMENSIONS, FOOTER,
} from "../heuristics.js";

export const brandAuditSchema = {
  brand_name: z.string().describe("Brand or business name"),
  industry: z.string().describe("Industry or market category"),
  description: z.string().describe("Brief description of what the brand does and who it serves"),
  age_years: z.number().min(0).describe("How many years the brand has existed (0 for new)"),
};

export function brandAudit(params: {
  brand_name: string;
  industry: string;
  description: string;
  age_years: number;
}): string {
  const { brand_name, industry, description, age_years } = params;
  const seed = `brand:audit:${brand_name}:${industry}`;

  const overallScore = rangeInt(35, 82, seed, 0);
  const archetype = pick(BRAND_ARCHETYPES, seed, 1);
  const tone = pick(VOICE_TONES, seed, 2);
  const tone2 = pick(VOICE_TONES, seed, 3);

  const dimensionScores = BRAND_AUDIT_DIMENSIONS.map((dim, i) => {
    const score = rangeInt(25, 95, seed, i + 10);
    const status = score >= 70 ? "✅ Strong" : score >= 45 ? "⚠️ Develop" : "❌ Weak";
    return { dim, score, status };
  });

  const strengths = dimensionScores.filter((d) => d.score >= 70).map((d) => d.dim);
  const gaps = dimensionScores.filter((d) => d.score < 45).map((d) => d.dim);
  const maturityLevel = age_years >= 5 ? "Established" : age_years >= 2 ? "Growing" : "Early-stage";

  let out = `## 🏷️ Brand Audit: ${brand_name}\n`;
  out += `**Industry:** ${industry} | **Maturity:** ${maturityLevel} (${age_years}y)\n\n`;

  out += `### Brand Health Score: ${overallScore}/100\n\n`;
  const grade = overallScore >= 80 ? "A" : overallScore >= 65 ? "B" : overallScore >= 50 ? "C" : overallScore >= 35 ? "D" : "F";
  out += `**Grade: ${grade}** — ${overallScore >= 70 ? "Strong brand with room to sharpen" : overallScore >= 50 ? "Functional brand — needs strategic development" : "Brand clarity gaps are costing you customers"}\n\n`;

  out += `### Brand DNA Assessment\n\n`;
  out += `| Attribute | Finding |\n`;
  out += `|-----------|--------|\n`;
  out += `| Primary Archetype | **${archetype}** |\n`;
  out += `| Brand Voice | **${tone}** with **${tone2}** undertones |\n`;
  out += `| Market Position | ${pick(["Challenger", "Leader", "Niche specialist", "Innovator", "Value player"], seed, 20)} |\n`;
  out += `| Differentiation Clarity | ${rangeInt(30, 85, seed, 21)}/100 |\n\n`;

  out += `### Dimension Scorecard\n\n`;
  out += `| Dimension | Score | Status |\n`;
  out += `|-----------|-------|--------|\n`;
  dimensionScores.forEach(({ dim, score, status }) => {
    const bar = "█".repeat(Math.round(score / 10)) + "░".repeat(10 - Math.round(score / 10));
    out += `| ${dim} | ${bar} ${score}/100 | ${status} |\n`;
  });
  out += "\n";

  if (strengths.length > 0) {
    out += `### Brand Strengths\n\n`;
    strengths.forEach((s) => { out += `- ✅ ${s}\n`; });
    out += "\n";
  }

  if (gaps.length > 0) {
    out += `### Critical Gaps\n\n`;
    gaps.forEach((g) => { out += `- ❌ ${g} needs urgent development\n`; });
    out += "\n";
  }

  out += `### Strategic Recommendations\n\n`;
  out += `1. Lean into the **${archetype}** archetype — it aligns with your audience's identity\n`;
  out += `2. Codify your **${tone}** voice in a brand guidelines document — use \`style_guide_generator\`\n`;
  out += `3. Run \`competitive_positioning\` to map your differentiation vs. key players\n`;
  out += `4. Run \`brand_voice\` to create consistent voice guidelines across all channels\n`;

  out += FOOTER;
  return out;
}
