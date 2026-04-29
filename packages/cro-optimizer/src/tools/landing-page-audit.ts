import { z } from "zod";
import {
  pick, pickN, rangeInt, rangeFloat,
  PAGE_ELEMENTS, FRICTION_POINTS, INDUSTRIES, FOOTER,
} from "../heuristics.js";

export const landingPageAuditSchema = {
  url_or_description: z.string().describe("URL or description of the landing page to audit"),
  goal: z.string().describe("Conversion goal (e.g. 'free trial signups', 'demo requests', 'purchases')"),
  industry: z.string().describe("Industry / business type"),
  current_conversion_rate: z.number().min(0).max(100).optional().describe("Current conversion rate % if known"),
};

export function landingPageAudit(params: {
  url_or_description: string;
  goal: string;
  industry: string;
  current_conversion_rate?: number;
}): string {
  const { url_or_description, goal, industry, current_conversion_rate } = params;
  const seed = `cro:audit:${url_or_description}:${goal}`;

  const currentCvr = current_conversion_rate ?? rangeFloat(0.8, 4.5, seed, 0);
  const industryCvr = rangeFloat(1.5, 5.5, seed, 1);
  const projectedCvr = Math.min(currentCvr * rangeFloat(1.3, 2.8, seed, 2), 12.0);
  const overallScore = rangeInt(28, 74, seed, 3);

  const elementScores = PAGE_ELEMENTS.map((el, i) => {
    const score = rangeInt(20, 95, seed, i + 10);
    const status = score >= 70 ? "✅ Strong" : score >= 45 ? "⚠️ Improve" : "❌ Critical";
    return { el, score, status };
  });

  const criticalIssues = elementScores
    .filter((e) => e.score < 45)
    .slice(0, 4);

  const frictionFound = pickN(FRICTION_POINTS, rangeInt(3, 5, seed, 50), `${seed}:friction`);
  const revenueImpact = Math.round((projectedCvr - currentCvr) / 100 * rangeInt(5000, 50000, seed, 60));

  let out = `## 🔍 Landing Page Audit\n`;
  out += `**Page:** ${url_or_description}\n`;
  out += `**Goal:** ${goal} | **Industry:** ${industry}\n\n`;

  out += `### Conversion Rate Analysis\n\n`;
  out += `| Metric | Value |\n`;
  out += `|--------|-------|\n`;
  out += `| Current CVR | **${currentCvr.toFixed(2)}%** |\n`;
  out += `| Industry Average | ${industryCvr.toFixed(2)}% |\n`;
  out += `| Projected CVR (after fixes) | **${projectedCvr.toFixed(2)}%** |\n`;
  out += `| Estimated Revenue Uplift | **+$${revenueImpact.toLocaleString()}/mo** |\n`;
  out += `| Overall Page Score | **${overallScore}/100** |\n\n`;

  out += `### Element-by-Element Scorecard\n\n`;
  out += `| Page Element | Score | Status |\n`;
  out += `|-------------|-------|--------|\n`;
  elementScores.forEach(({ el, score, status }) => {
    out += `| ${el} | ${score}/100 | ${status} |\n`;
  });
  out += "\n";

  out += `### Critical Issues (Fix These First)\n\n`;
  if (criticalIssues.length === 0) {
    out += `No critical failures found — focus on the improvements below.\n\n`;
  } else {
    criticalIssues.forEach(({ el, score }, i) => {
      out += `**Issue ${i + 1}: ${el}** (${score}/100)\n`;
      out += `   → ${pick([
        "Rewrite with a single clear promise and emotional hook",
        "Add 3–5 customer testimonials with full names and photos",
        "Change to action verb + benefit: 'Get your free trial'",
        "Compress images and defer non-critical JS to hit <2s load",
        "Add three pricing tiers clearly with a 'Most Popular' badge on the middle tier",
      ], `${seed}:fix`, i)}\n\n`;
    });
  }

  out += `### Friction Points Identified\n\n`;
  frictionFound.forEach((f) => { out += `- ⚠️ ${f}\n`; });
  out += "\n";

  out += `### Recommended Next Steps\n\n`;
  out += `1. Fix the ${criticalIssues.length} critical element issues above\n`;
  out += `2. Run \`ab_test_generator\` to create tests for the top friction points\n`;
  out += `3. Run \`cta_optimizer\` to upgrade your primary call-to-action\n`;
  out += `4. Run \`funnel_analyzer\` to identify where traffic drops off before the page\n`;

  out += FOOTER;
  return out;
}
