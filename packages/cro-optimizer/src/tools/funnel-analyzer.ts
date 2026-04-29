import { z } from "zod";
import {
  pick, pickN, rangeInt, rangeFloat,
  FUNNEL_STAGES, FRICTION_POINTS, INDUSTRIES, FOOTER,
} from "../heuristics.js";

export const funnelAnalyzerSchema = {
  funnel_name: z.string().describe("Name or description of the funnel (e.g. 'Free Trial Signup', 'E-commerce Checkout')"),
  industry: z.string().describe("Industry or business type"),
  funnel_steps: z.array(z.string()).min(2).max(8).describe("List the funnel steps in order (e.g. ['Homepage', 'Pricing', 'Signup', 'Onboarding'])"),
};

export function funnelAnalyzer(params: { funnel_name: string; industry: string; funnel_steps: string[] }): string {
  const { funnel_name, industry, funnel_steps } = params;
  const seed = `cro:funnel:${funnel_name}:${industry}`;

  const entryVisitors = rangeInt(5000, 50000, seed, 0);
  let remaining = entryVisitors;
  const stepData = funnel_steps.map((step, i) => {
    const dropRate = rangeFloat(
      i === funnel_steps.length - 1 ? 0.6 : 0.15,
      i === funnel_steps.length - 1 ? 0.9 : 0.55,
      seed,
      i + 10
    );
    const visitors = i === 0 ? remaining : Math.round(remaining * (1 - dropRate));
    const convRate = i === 0 ? 100 : parseFloat(((visitors / entryVisitors) * 100).toFixed(1));
    const stepDrop = i === 0 ? 0 : remaining - visitors;
    remaining = visitors;
    return { step, visitors, convRate, stepDrop, dropRate };
  });

  const worstStep = stepData.slice(1).sort((a, b) => b.stepDrop - a.stepDrop)[0];
  const finalCvr = stepData[stepData.length - 1].convRate;
  const industryBenchmark = rangeFloat(1.5, 8.0, seed, 50);
  const frictionAtWorst = pickN(FRICTION_POINTS, 3, `${seed}:friction`);

  let out = `## 🔄 Funnel Analyzer: ${funnel_name}\n`;
  out += `**Industry:** ${industry} | **Steps:** ${funnel_steps.length} | **Entry Traffic:** ${entryVisitors.toLocaleString()}/mo\n\n`;

  out += `### Funnel Performance Overview\n\n`;
  out += `| Step | Visitors | Drop-Off | Conversion Rate |\n`;
  out += `|------|----------|----------|-----------------|\n`;
  stepData.forEach(({ step, visitors, convRate, stepDrop }, i) => {
    const alert = i > 0 && stepDrop === worstStep.stepDrop ? " 🚨" : "";
    out += `| ${step}${alert} | ${visitors.toLocaleString()} | -${stepDrop.toLocaleString()} | ${convRate}% |\n`;
  });
  out += "\n";

  out += `### Funnel Summary\n\n`;
  out += `| Metric | Value |\n`;
  out += `|--------|-------|\n`;
  out += `| Overall CVR | **${finalCvr}%** |\n`;
  out += `| Industry Benchmark | ${industryBenchmark.toFixed(1)}% |\n`;
  out += `| Gap vs Benchmark | ${(finalCvr - industryBenchmark).toFixed(1)}% |\n`;
  out += `| Biggest Drop-Off | **"${worstStep.step}"** (-${worstStep.stepDrop.toLocaleString()} visitors) |\n`;
  out += `| Potential Recoverable Revenue | **+${rangeInt(3000, 25000, seed, 60).toLocaleString()}/mo** |\n\n`;

  out += `### Critical Bottleneck: "${worstStep.step}"\n\n`;
  out += `This step loses **${worstStep.stepDrop.toLocaleString()} visitors** (${(worstStep.dropRate * 100).toFixed(0)}% drop-off) — fixing it alone could add **${rangeInt(500, 3000, seed, 70)} conversions/month**.\n\n`;
  out += `**Likely friction points at this step:**\n`;
  frictionAtWorst.forEach((f) => { out += `- ${f}\n`; });
  out += "\n";

  out += `### Fix Priority Queue\n\n`;
  stepData.slice(1)
    .sort((a, b) => b.stepDrop - a.stepDrop)
    .slice(0, 3)
    .forEach(({ step, stepDrop }, i) => {
      out += `**${i + 1}. Fix "${step}"** (-${stepDrop.toLocaleString()} visitors)\n`;
      out += `   → ${pick([
        "Add social proof directly on this page",
        "Reduce form fields to the minimum required",
        "Add a progress indicator to reduce perceived effort",
        "A/B test the CTA copy and button color",
        "Add a trust badge and money-back guarantee",
        "Simplify the page — remove all nav and exit links",
      ], `${seed}:fix`, i)}\n\n`;
    });

  out += `### Next Steps\n\n`;
  out += `1. Use \`ab_test_generator\` to design a test for "${worstStep.step}"\n`;
  out += `2. Use \`cta_optimizer\` to strengthen the CTAs at each step\n`;
  out += `3. Use \`landing_page_audit\` to deep-dive the entry page\n`;

  out += FOOTER;
  return out;
}
