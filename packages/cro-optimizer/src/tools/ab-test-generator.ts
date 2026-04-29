import { z } from "zod";
import {
  pick, pickN, rangeInt, rangeFloat,
  AB_VARIABLES, CTA_VERBS, FRICTION_POINTS, FOOTER,
} from "../heuristics.js";

export const abTestGeneratorSchema = {
  page_url_or_name: z.string().describe("Page or feature to A/B test"),
  hypothesis: z.string().describe("What you believe is causing low conversion (e.g. 'CTA is too vague', 'headline doesn't resonate')"),
  monthly_visitors: z.number().min(100).describe("Monthly visitors to this page"),
  current_conversion_rate: z.number().min(0).max(100).describe("Current conversion rate %"),
};

export function abTestGenerator(params: {
  page_url_or_name: string;
  hypothesis: string;
  monthly_visitors: number;
  current_conversion_rate: number;
}): string {
  const { page_url_or_name, hypothesis, monthly_visitors, current_conversion_rate } = params;
  const seed = `cro:abtest:${page_url_or_name}:${hypothesis}`;

  const mde = rangeFloat(10, 25, seed, 0);
  const sampleSize = Math.round((monthly_visitors * rangeFloat(1.2, 2.5, seed, 1)));
  const durationDays = Math.ceil(sampleSize / (monthly_visitors / 30));
  const expectedLift = rangeFloat(8, 35, seed, 2);
  const expectedNewCvr = Math.min(current_conversion_rate * (1 + expectedLift / 100), 15.0);

  const variables = pickN(AB_VARIABLES, 3, `${seed}:vars`);
  const primaryVar = variables[0];

  const verb1 = pick(CTA_VERBS, seed, 10);
  const verb2 = pick(CTA_VERBS, seed, 11);

  const controlLabel = pick(["Start Free Trial", "Sign Up", "Get Started", "Learn More", "Request Demo"], seed, 20);
  const variantLabel = `${verb1} Your ${pick(["Free", "Instant", "Personalized", "Custom", "Full"], seed, 21)} Access`;

  let out = `## 🧪 A/B Test Generator\n`;
  out += `**Page:** ${page_url_or_name}\n`;
  out += `**Hypothesis:** "${hypothesis}"\n\n`;

  out += `### Test Overview\n\n`;
  out += `| Metric | Value |\n`;
  out += `|--------|-------|\n`;
  out += `| Monthly Visitors | ${monthly_visitors.toLocaleString()} |\n`;
  out += `| Current CVR | ${current_conversion_rate.toFixed(2)}% |\n`;
  out += `| Minimum Detectable Effect | ${mde.toFixed(1)}% relative lift |\n`;
  out += `| Required Sample Size | ${sampleSize.toLocaleString()} visitors/variant |\n`;
  out += `| Estimated Test Duration | **${durationDays} days** |\n`;
  out += `| Expected CVR Lift | **+${expectedLift.toFixed(1)}%** → ${expectedNewCvr.toFixed(2)}% |\n\n`;

  out += `### Test #1: Primary Test (Recommended)\n\n`;
  out += `**Variable:** ${primaryVar}\n`;
  out += `**Traffic split:** 50/50\n\n`;
  out += `| Variant | Change |\n`;
  out += `|---------|--------|\n`;
  out += `| **Control (A)** | "${controlLabel}" — current version |\n`;
  out += `| **Variant (B)** | "${variantLabel}" — benefit-led copy |\n\n`;
  out += `**Why this test:** ${pick([
    "CTA copy is the #1 highest-impact, lowest-effort CRO change",
    "Benefit-led CTAs consistently outperform action-only CTAs by 14–28%",
    "Addresses the core hypothesis with minimal implementation risk",
    "This change can be shipped in < 1 hour and measured within 2 weeks",
  ], seed, 30)}\n\n`;

  out += `### Test #2: Follow-Up Test\n\n`;
  out += `**Variable:** ${variables[1]}\n`;
  out += `**Hypothesis:** Changing ${variables[1]} will increase micro-conversions by addressing "${pick(FRICTION_POINTS, seed, 40)}"\n\n`;

  out += `### Test #3: Exploratory Test\n\n`;
  out += `**Variable:** ${variables[2]}\n`;
  out += `**Hypothesis:** ${variables[2]} changes signal trust and reduce hesitation for new visitors\n\n`;

  out += `### Statistical Significance Guide\n\n`;
  out += `- ✅ **Stop when:** 95%+ confidence AND minimum ${sampleSize.toLocaleString()} visitors/variant\n`;
  out += `- ⏱️ **Run for at least:** ${Math.max(7, durationDays)} days to capture weekly seasonality\n`;
  out += `- ❌ **Don't:** Stop early if one variant leads — always wait for full sample\n`;
  out += `- 📊 **Tools:** Google Optimize, VWO, Optimizely, or simple Webflow variant pages\n`;

  out += FOOTER;
  return out;
}
