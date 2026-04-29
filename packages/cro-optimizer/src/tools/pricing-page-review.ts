import { z } from "zod";
import {
  pick, pickN, rangeInt, rangeFloat,
  PRICING_PATTERNS, CTA_VERBS, FRICTION_POINTS, FOOTER,
} from "../heuristics.js";

export const pricingPageReviewSchema = {
  product_name: z.string().describe("Product or service name"),
  pricing_model: z.string().describe("Current pricing model (e.g. '$29/mo starter, $99/mo pro', 'usage-based', 'custom enterprise')"),
  industry: z.string().describe("Industry / business type"),
  target_customer: z.string().describe("Who your main buyer is (e.g. 'solo founders', 'SMB marketing teams')"),
};

const PRICING_PRINCIPLES = [
  "Anchor with a high price first — the decoy makes middle tier look reasonable",
  "Highlight the recommended plan with a visual badge ('Most Popular', 'Best Value')",
  "Show annual pricing by default with monthly toggle — anchors toward annual",
  "Include a feature comparison table — reduces back-and-forth and support tickets",
  "Name tiers by customer type ('Starter', 'Growth', 'Enterprise') not abstract names",
  "List what's NOT included in lower tiers to create upgrade urgency",
  "Add a FAQ section specifically about pricing objections",
  "Show logos of customers on each tier — social proof is tier-specific",
];

const OBJECTIONS = [
  "Is there a free trial?",
  "Can I cancel anytime?",
  "What happens if I go over my limit?",
  "Do you offer discounts for nonprofits / startups?",
  "What's included in 'Enterprise' — why no pricing?",
  "Can I change plans later?",
  "Is my credit card required to start?",
];

export function pricingPageReview(params: {
  product_name: string;
  pricing_model: string;
  industry: string;
  target_customer: string;
}): string {
  const { product_name, pricing_model, industry, target_customer } = params;
  const seed = `cro:pricing:${product_name}:${industry}`;

  const overallScore = rangeInt(38, 78, seed, 0);
  const pageConvRate = rangeFloat(1.5, 8.5, seed, 1);
  const benchmarkConvRate = rangeFloat(3.0, 10.0, seed, 2);
  const recommendedPattern = pick(PRICING_PATTERNS, seed, 3);
  const annualUplift = rangeInt(15, 35, seed, 4);

  const tierScores = [
    { tier: "Entry / Free", score: rangeInt(45, 90, seed, 10), label: pick(["Starter", "Free", "Basic", "Solo", "Lite"], seed, 11) },
    { tier: "Core Paid", score: rangeInt(40, 85, seed, 12), label: pick(["Pro", "Growth", "Team", "Plus", "Standard"], seed, 13) },
    { tier: "Premium / Enterprise", score: rangeInt(35, 80, seed, 14), label: pick(["Enterprise", "Business", "Scale", "Max", "Ultimate"], seed, 15) },
  ];

  const principles = pickN(PRICING_PRINCIPLES, 4, `${seed}:principles`);
  const objections = pickN(OBJECTIONS, 4, `${seed}:objections`);
  const friction = pickN(FRICTION_POINTS, 3, `${seed}:friction`);

  const v = pick(CTA_VERBS, seed, 30);

  let out = `## 💰 Pricing Page Review: ${product_name}\n`;
  out += `**Model:** ${pricing_model}\n`;
  out += `**Industry:** ${industry} | **Customer:** ${target_customer}\n\n`;

  out += `### Pricing Page Score: ${overallScore}/100\n\n`;
  out += `| Metric | Your Page | Benchmark |\n`;
  out += `|--------|-----------|----------|\n`;
  out += `| Page-to-Paid CVR | ${pageConvRate.toFixed(1)}% | ${benchmarkConvRate.toFixed(1)}% |\n`;
  out += `| Annual Plan Adoption | ${rangeInt(20, 45, seed, 40)}% | ${rangeInt(35, 65, seed, 41)}% |\n`;
  out += `| Time on Pricing Page | ${rangeInt(45, 180, seed, 42)}s | ${rangeInt(60, 150, seed, 43)}s |\n\n`;

  out += `### Tier Analysis\n\n`;
  out += `| Tier | Current Label | Score | Status |\n`;
  out += `|------|--------------|-------|--------|\n`;
  tierScores.forEach(({ tier, label, score }) => {
    const status = score >= 70 ? "✅ Strong" : score >= 50 ? "⚠️ Needs work" : "❌ Weak";
    out += `| ${tier} | "${label}" | ${score}/100 | ${status} |\n`;
  });
  out += "\n";

  out += `### Recommended Pricing Pattern\n\n`;
  out += `**Switch to:** ${recommendedPattern}\n`;
  out += `This pattern typically improves pricing page CVR by **+${rangeInt(18, 42, seed, 50)}%** for ${industry} products.\n\n`;

  out += `### Annual Plan Opportunity\n\n`;
  out += `Adding an annual billing option with **${annualUplift}% discount** could:\n`;
  out += `- Increase cash flow predictability by locking in revenue upfront\n`;
  out += `- Reduce churn by **${rangeInt(20, 45, seed, 55)}%** (annual customers churn far less)\n`;
  out += `- Increase LTV by **${rangeInt(15, 35, seed, 56)}%**\n\n`;

  out += `### Key Improvement Recommendations\n\n`;
  principles.forEach((p, i) => { out += `${i + 1}. ${p}\n`; });
  out += "\n";

  out += `### Top Objections to Address in FAQ\n\n`;
  objections.forEach((o) => { out += `- **"${o}"** — answer this explicitly on the pricing page\n`; });
  out += "\n";

  out += `### Friction Points Reducing Conversions\n\n`;
  friction.forEach((f) => { out += `- ⚠️ ${f}\n`; });
  out += "\n";

  out += `### CTA Recommendations\n\n`;
  out += `| Tier | Recommended CTA |\n`;
  out += `|------|----------------|\n`;
  out += `| Entry | "Start for Free — No Card Needed" |\n`;
  out += `| Core | "${v} Pro Free for 14 Days" |\n`;
  out += `| Enterprise | "Talk to Sales — See Custom Pricing" |\n`;

  out += FOOTER;
  return out;
}
