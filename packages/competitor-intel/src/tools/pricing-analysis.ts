import { z } from "zod";
import { pick, pickN, rangeInt, rangeFloat, PRICING_TIERS, MARKET_SEGMENTS, FOOTER } from "../heuristics.js";

export const pricingAnalysisSchema = {
  your_product: z.string().describe("Your product name"),
  competitors: z.string().describe("Competitor names (comma-separated, up to 5)"),
  category: z.string().describe("Product category or market (e.g. 'project management SaaS', 'HR platform')"),
  your_pricing: z.string().describe("Your current pricing tiers (e.g. 'Free/$49/$99/Enterprise' or 'Starting at $500/mo')"),
  seat_count: z.number().int().positive().default(10).describe("Seat count for per-user pricing comparisons"),
};

export function pricingAnalysis(params: {
  your_product: string;
  competitors: string;
  category: string;
  your_pricing: string;
  seat_count: number;
}): string {
  const { your_product, competitors, category, your_pricing, seat_count } = params;
  const seed = `pricing-analysis:${your_product}:${category}`;

  const competitorList = competitors.split(",").map((c) => c.trim()).filter(Boolean).slice(0, 5);

  const generateTiers = (productSeed: string, base: number) => {
    const tierCount = rangeInt(2, 4, productSeed, 0);
    return PRICING_TIERS.slice(0, tierCount).map((tier, i) => ({
      tier,
      price: Math.round(base * Math.pow(rangeFloat(1.8, 3.0, productSeed, i + 1), i)),
      per: pick(["user/month", "month", "user/year (billed annually)", "month (up to 5 seats)"], productSeed, i + 10),
      features: rangeInt(3, 12, productSeed, i + 20),
    }));
  };

  const basePrice = rangeInt(15, 150, seed, 0);
  const competitorData = competitorList.map((c, i) => ({
    name: c,
    tiers: generateTiers(seed + c, Math.round(basePrice * rangeFloat(0.5, 2.0, seed, i + 5))),
    freeTier: rangeInt(0, 1, seed + c, 50) === 1,
    freeTrialDays: pick([0, 7, 14, 30], seed + c, 51),
    enterpriseCustom: rangeInt(0, 1, seed + c, 52) === 1,
  }));

  const marketMin = Math.min(...competitorData.flatMap((c) => c.tiers.map((t) => t.price)));
  const marketMax = Math.max(...competitorData.flatMap((c) => c.tiers.map((t) => t.price)));
  const marketMedian = Math.round((marketMin + marketMax) / 2);

  const insights = pickN([
    `${pick(competitorList, seed, 10)} offers a free tier — creates pipeline but often results in lower expansion revenue`,
    `${pick(competitorList, seed, 11)} uses seat-based pricing aggressively — easy to land, hard to control cost at scale`,
    `Market median for ${category} at ${seat_count} seats: ~$${(marketMedian * seat_count).toLocaleString()}/year`,
    `Annual billing discounts average ${rangeInt(15, 30, seed, 12)}% across this category`,
    `Enterprise contracts in ${category} average ${rangeInt(6, 18, seed, 13)} months to close`,
    `Freemium conversion rate in ${category}: ${rangeFloat(2, 8, seed, 14).toFixed(1)}% industry average`,
  ], 4, seed + "insights");

  const positioning = pick([
    `**Premium:** Price above market median — justify with superior UX, support SLA, or compliance features`,
    `**Competitive:** Match market median — compete on value and sales execution, not price`,
    `**Penetration:** Price below median — accelerate adoption; plan for price increase at Series B/C`,
    `**Value-based:** Decouple from seat count — tie pricing to outcomes (revenue processed, seats managed, data volume)`,
  ], seed, 20);

  let out = `## Competitive Pricing Analysis: ${category}\n\n`;
  out += `**Your product:** ${your_product} (${your_pricing})\n`;
  out += `**Comparison basis:** ${seat_count} seats\n\n`;

  out += `### Competitor Pricing Overview\n\n`;
  competitorData.forEach((comp) => {
    out += `#### ${comp.name}\n`;
    out += `| Tier | Price | Per |\n|------|-------|-----|\n`;
    comp.tiers.forEach((t) => {
      out += `| ${t.tier} | $${t.price} | ${t.per} |\n`;
    });
    const extras = [];
    if (comp.freeTier) extras.push("Free tier");
    if (comp.freeTrialDays > 0) extras.push(`${comp.freeTrialDays}-day free trial`);
    if (comp.enterpriseCustom) extras.push("Enterprise custom pricing");
    if (extras.length > 0) out += `*${extras.join(" | ")}*\n`;
    out += `\n`;
  });

  out += `### Market Range (${seat_count} seats/year)\n\n`;
  out += `| | Price |\n|---|---|\n`;
  out += `| **Low end** | $${(marketMin * seat_count * 12).toLocaleString()} |\n`;
  out += `| **Median** | $${(marketMedian * seat_count * 12).toLocaleString()} |\n`;
  out += `| **High end** | $${(marketMax * seat_count * 12).toLocaleString()} |\n\n`;

  out += `### Key Insights\n\n`;
  insights.forEach((i) => { out += `- ${i}\n`; });
  out += `\n`;

  out += `### Recommended Positioning\n\n`;
  out += `${positioning}\n\n`;

  out += `### Pricing Levers\n\n`;
  out += `- **Volume discounts:** ${rangeInt(10, 25, seed, 30)}% at ${rangeInt(25, 100, seed, 31)} seats, ${rangeInt(20, 40, seed, 32)}% at ${rangeInt(100, 500, seed, 33)} seats\n`;
  out += `- **Annual prepay:** ${rangeInt(15, 25, seed, 34)}% discount vs. monthly\n`;
  out += `- **Competitor displacement:** ${rangeInt(10, 20, seed, 35)}% discount for verified churn from ${pick(competitorList, seed, 36)}\n`;
  out += `- **POC-to-paid conversion:** Reduce friction with ${rangeInt(14, 30, seed, 37)}-day trial, no credit card required\n`;
  out += FOOTER;
  return out;
}
