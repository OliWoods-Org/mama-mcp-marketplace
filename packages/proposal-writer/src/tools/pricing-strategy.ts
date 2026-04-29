import { z } from "zod";
import { pick, pickN, rangeInt, rangeFloat, PRICING_MODELS, SERVICE_TYPES, FOOTER } from "../heuristics.js";

export const pricingStrategySchema = {
  service: z.string().describe("Service or product being priced"),
  cost_to_deliver: z.number().positive().describe("Your cost to deliver the service (time, materials, overhead) in USD"),
  target_margin: z.number().min(0).max(100).default(60).describe("Target profit margin percentage (e.g. 60 for 60%)"),
  client_size: z.enum(["SMB", "Mid-market", "Enterprise"]).describe("Target client segment"),
  competition_level: z.enum(["low", "moderate", "high", "commoditized"]).describe("Level of competition in this market"),
  value_delivered: z.string().describe("Quantifiable value delivered to client (e.g. '$200K revenue increase', '40 hours saved/month')"),
  pricing_model_preference: z.enum([
    "Fixed-fee project", "Monthly retainer", "Time & materials (hourly)",
    "Value-based pricing", "Milestone-based", "Subscription tier",
    "Outcome-based / success fee", "Hybrid (retainer + performance)",
  ]).optional().describe("Preferred pricing model (leave blank for recommendation)"),
};

export function pricingStrategy(params: {
  service: string;
  cost_to_deliver: number;
  target_margin: number;
  client_size: string;
  competition_level: string;
  value_delivered: string;
  pricing_model_preference?: string;
}): string {
  const { service, cost_to_deliver, target_margin, client_size, competition_level, value_delivered, pricing_model_preference } = params;
  const seed = `pricing:${service}:${client_size}:${competition_level}`;

  const marginMultiplier = 1 / (1 - target_margin / 100);
  const costBasedPrice = Math.round(cost_to_deliver * marginMultiplier);

  const clientMultipliers: Record<string, number> = { "SMB": 1, "Mid-market": 2.5, "Enterprise": 6 };
  const competitionDiscounts: Record<string, number> = { "low": 1.3, "moderate": 1.0, "high": 0.85, "commoditized": 0.7 };
  const marketRate = Math.round(costBasedPrice * (clientMultipliers[client_size] ?? 1) * (competitionDiscounts[competition_level] ?? 1));

  const modelRecommendations: Record<string, string> = {
    "Fixed-fee project": "Best for well-defined, bounded work. Rewards efficiency — if you finish early, you keep the margin.",
    "Monthly retainer": "Best for ongoing relationships. Predictable revenue; upsell opportunities over time.",
    "Value-based pricing": "Highest margin potential — price anchored to client outcomes, not your costs.",
    "Hybrid (retainer + performance)": "Growing trend for agencies: stable base + upside if KPIs are hit.",
    "Milestone-based": "Great for large projects — reduces client risk and improves cash flow for you.",
    "Time & materials (hourly)": "Only use for undefined scope. Caps your upside; avoid if possible.",
  };

  const recommendedModel = pricing_model_preference ?? pick(
    competition_level === "commoditized"
      ? ["Monthly retainer", "Hybrid (retainer + performance)", "Value-based pricing"]
      : ["Value-based pricing", "Monthly retainer", "Fixed-fee project"],
    seed, 0
  );

  const tiers = [
    {
      name: "Starter",
      price: Math.round(marketRate * 0.6),
      features: ["Core deliverables", `${rangeInt(1, 2, seed, 10)} round of revisions`, "Email support"],
    },
    {
      name: "Growth",
      price: marketRate,
      features: ["Everything in Starter", "Priority delivery", `${rangeInt(3, 4, seed, 11)} rounds of revisions`, "Bi-weekly check-in calls", "Performance reporting"],
      recommended: true,
    },
    {
      name: "Premium",
      price: Math.round(marketRate * 1.8),
      features: ["Everything in Growth", "Dedicated account manager", "Unlimited revisions", "24/7 Slack access", "Quarterly strategy review"],
    },
  ];

  const anchors = [
    `Competitor X charges $${Math.round(marketRate * 0.9).toLocaleString()}–$${Math.round(marketRate * 1.2).toLocaleString()} for similar scope`,
    `In-house equivalent would cost $${Math.round(marketRate * 1.5).toLocaleString()}–$${Math.round(marketRate * 3).toLocaleString()}/year`,
    `${value_delivered} = $${Math.round(marketRate * rangeInt(3, 10, seed, 20)).toLocaleString()} of value delivered`,
  ];

  let out = `## Pricing Strategy: ${service}\n\n`;
  out += `**Segment:** ${client_size} | **Competition:** ${competition_level} | **Target margin:** ${target_margin}%\n\n`;

  out += `### Price Calculations\n\n`;
  out += `| Method | Price |\n|--------|-------|\n`;
  out += `| Cost + ${target_margin}% margin | $${costBasedPrice.toLocaleString()} |\n`;
  out += `| Market-adjusted (${client_size} / ${competition_level}) | $${marketRate.toLocaleString()} |\n`;
  out += `| Value-based anchor | ~${rangeInt(5, 15, seed, 1)}–${rangeInt(15, 25, seed, 2)}% of ${value_delivered} |\n\n`;

  out += `### Recommended Model: ${recommendedModel}\n\n`;
  out += `${modelRecommendations[recommendedModel] ?? "Tailored to your service context."}\n\n`;

  out += `### 3-Tier Packaging\n\n`;
  tiers.forEach((tier) => {
    out += `#### ${tier.name}${tier.recommended ? " ⭐ (Recommended)" : ""} — $${tier.price.toLocaleString()}\n\n`;
    tier.features.forEach((f) => { out += `- ${f}\n`; });
    out += `\n`;
  });

  out += `### Anchoring Strategy\n\n`;
  out += `Use these anchors to make your price feel like a bargain:\n\n`;
  anchors.forEach((a) => { out += `- ${a}\n`; });
  out += `\n`;

  out += `### Negotiation Guardrails\n\n`;
  out += `- **Floor price:** $${Math.round(costBasedPrice * 0.9).toLocaleString()} (never go below — ${Math.round(target_margin * 0.7)}% margin minimum)\n`;
  out += `- **Discount levers (not price cuts):** scope reduction, payment upfront, longer commitment, fewer deliverables\n`;
  out += `- **If asked for a discount:** offer a payment plan, remove a deliverable, or add a performance bonus clause instead\n`;
  out += FOOTER;
  return out;
}
