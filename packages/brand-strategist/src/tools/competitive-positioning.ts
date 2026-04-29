import { z } from "zod";
import {
  pick, pickN, rangeInt, rangeFloat,
  POSITIONING_AXES, BRAND_ARCHETYPES, VOICE_TONES, FOOTER,
} from "../heuristics.js";

export const competitivePositioningSchema = {
  brand_name: z.string().describe("Your brand name"),
  competitors: z.array(z.string()).min(1).max(5).describe("Key competitors to map against (1–5)"),
  industry: z.string().describe("Industry or market category"),
  target_segment: z.string().describe("Primary target customer segment"),
};

const POSITIONING_STATEMENTS = [
  "For [target], [brand] is the [category] that [key benefit] because [reason to believe].",
  "[Brand] helps [target] [achieve outcome] by [unique mechanism], unlike [alternatives] that [drawback].",
  "The only [category] built specifically for [target] who [specific situation].",
];

const WHITESPACE_OPPORTUNITIES = [
  "No competitor owns the 'radically simple' position in this category",
  "The enterprise end is crowded — the SMB segment is underserved",
  "Competitors compete on features; the emotional/identity angle is open",
  "No clear leader for [segment] — first-mover advantage available",
  "Price transparency is lacking — being open about pricing is differentiating",
  "Competitors are product-led; thought leadership / community angle is open",
  "The 'done-for-you' position is unclaimed — everyone sells tools, not outcomes",
  "Vertical specialization is a gap — horizontal players are weak in niche verticals",
];

export function competitivePositioning(params: {
  brand_name: string;
  competitors: string[];
  industry: string;
  target_segment: string;
}): string {
  const { brand_name, competitors, industry, target_segment } = params;
  const seed = `brand:position:${brand_name}:${industry}`;

  const allBrands = [brand_name, ...competitors];

  const axisData = POSITIONING_AXES.map((axis, ai) => {
    const [low, high] = axis;
    const brandPositions = allBrands.map((b, bi) => ({
      brand: b,
      position: rangeInt(1, 10, `${seed}:ax${ai}:br${bi}`, 0),
    }));
    return { low, high, brands: brandPositions };
  });

  const yourScores = axisData.map((a) => a.brands[0].position);
  const yourAvg = yourScores.reduce((s, v) => s + v, 0) / yourScores.length;

  const differentiators = pickN([
    `Speed to value — customers see results in ${rangeInt(1, 7, seed, 50)} days vs industry average of ${rangeInt(14, 60, seed, 51)} days`,
    "Radical pricing transparency — no hidden fees, no enterprise sales call required",
    `Category-defining focus on ${target_segment} — not a horizontal tool stretched to fit`,
    "Human-first support — real team, not bots, responding in < 2 hours",
    "Open ecosystem — 100+ native integrations vs competitors' closed systems",
    `Proprietary ${pick(["AI engine", "data network", "workflow system", "methodology"], seed, 52)} that improves with scale`,
  ], 3, `${seed}:diff`);

  const whitespace = pickN(WHITESPACE_OPPORTUNITIES, 3, `${seed}:white`);
  const posStatement = pick(POSITIONING_STATEMENTS, seed, 60);
  const archetype = pick(BRAND_ARCHETYPES, seed, 61);

  let out = `## 🗺️ Competitive Positioning: ${brand_name}\n`;
  out += `**Industry:** ${industry} | **Target Segment:** ${target_segment}\n`;
  out += `**Competitors analyzed:** ${competitors.join(", ")}\n\n`;

  out += `### Positioning Map\n\n`;
  axisData.slice(0, 3).forEach(({ low, high, brands }) => {
    out += `**${low} ←→ ${high}**\n`;
    out += `\`\`\`\n`;
    out += `1         5         10\n`;
    out += `|---------|----------|\n`;
    brands.forEach(({ brand, position }) => {
      const marker = brand === brand_name ? "▲" : "○";
      const line = " ".repeat(Math.max(0, position - 1)) + marker + ` ${brand}`;
      out += `${line}\n`;
    });
    out += `\`\`\`\n\n`;
  });

  out += `### Competitor Summary\n\n`;
  out += `| Brand | Strength | Weakness | Position |\n`;
  out += `|-------|----------|----------|----------|\n`;
  competitors.forEach((comp, i) => {
    const strength = pick(["Feature breadth", "Brand awareness", "Enterprise relationships", "Price point", "Community", "Integrations"], `${seed}:str`, i);
    const weakness = pick(["Complex UX", "Slow support", "High price", "No vertical focus", "Weak mobile", "Outdated interface"], `${seed}:weak`, i);
    const pos = pick(["Market leader", "Fast follower", "Niche player", "Challenger", "Legacy player"], `${seed}:pos`, i);
    out += `| **${comp}** | ${strength} | ${weakness} | ${pos} |\n`;
  });
  out += `| **${brand_name} (you)** | — | — | ${pick(["Challenger", "Niche specialist", "Innovator", "Disruptor"], seed, 70)} |\n\n`;

  out += `### Your Differentiation Pillars\n\n`;
  differentiators.forEach((d, i) => { out += `**${i + 1}. ${d}**\n\n`; });

  out += `### White Space Opportunities\n\n`;
  whitespace.forEach((w) => { out += `- 🎯 ${w}\n`; });
  out += "\n";

  out += `### Positioning Statement Template\n\n`;
  out += `> ${posStatement}\n\n`;
  out += `**Fill in for ${brand_name}:**\n`;
  out += `> For **${target_segment}**, **${brand_name}** is the **[your category]** that **[your key benefit]** because **[your proof point]**.\n\n`;

  out += `### Brand Archetype to Own\n\n`;
  out += `**Recommended:** ${archetype} — positions you as ${pick([
    "the trusted guide customers follow to achieve their goals",
    "the bold innovator disrupting a stagnant category",
    "the empathetic expert who genuinely understands the customer's world",
    "the confident authority others look to for the right answer",
  ], seed, 80)} in a category where competitors feel ${pick(["generic", "corporate", "complicated", "impersonal"], seed, 81)}.`;
  out += "\n";

  out += FOOTER;
  return out;
}
