import { z } from "zod";
import { pick, pickN, rangeInt, rangeFloat, COMPETITIVE_POSITIONS, MARKET_SEGMENTS, ANALYST_FIRMS, FOOTER } from "../heuristics.js";

export const marketLandscapeSchema = {
  market: z.string().describe("Market or category to map (e.g. 'project management software', 'AI writing tools', 'HR tech')"),
  your_company: z.string().describe("Your company name"),
  known_competitors: z.string().describe("Known competitors in this market (comma-separated)"),
  your_positioning: z.string().describe("How you currently position yourself (e.g. 'best for enterprise', 'easiest to use', 'most affordable')"),
  key_differentiator: z.string().describe("Your primary differentiator in this market"),
};

export function marketLandscape(params: {
  market: string;
  your_company: string;
  known_competitors: string;
  your_positioning: string;
  key_differentiator: string;
}): string {
  const { market, your_company, known_competitors, your_positioning, key_differentiator } = params;
  const seed = `landscape:${market}:${your_company}`;

  const competitorList = known_competitors.split(",").map((c) => c.trim()).filter(Boolean);
  const allPlayers = [your_company, ...competitorList];

  const playerProfiles = allPlayers.map((player, i) => {
    const isYours = i === 0;
    return {
      name: player,
      position: isYours ? pick(COMPETITIVE_POSITIONS.slice(0, 4), seed, i) : pick(COMPETITIVE_POSITIONS, seed, i + 10),
      marketShare: isYours ? rangeInt(5, 20, seed, i + 20) : rangeInt(3, 30, seed, i + 20),
      growthRate: `${pick(["+", "+", "+", "-"], seed, i + 30)}${rangeInt(5, 80, seed, i + 40)}% YoY`,
      primarySegment: pick(MARKET_SEGMENTS, seed, i + 50),
      strength: isYours ? key_differentiator : pick([
        "brand recognition", "enterprise relationships", "feature breadth",
        "pricing", "ecosystem integrations", "ease of use", "vertical specialization",
        "open-source community", "AI capabilities", "customer support",
      ], seed, i + 60),
      threat: pick(["Low", "Medium", "High", "Critical"], seed, i + 70),
    };
  });

  const yourProfile = playerProfiles[0];
  const threats = playerProfiles.filter((p) => p.name !== your_company && (p.threat === "High" || p.threat === "Critical"));
  const opportunities = pickN([
    `${pick(MARKET_SEGMENTS, seed, 80)} segment is underserved — low competition, growing demand`,
    `AI/automation features becoming table stakes — early movers gaining advantage`,
    `Vertical SaaS trend: specialized solution for ${pick(["healthcare", "finance", "legal", "manufacturing", "education"], seed, 81)} outperforms horizontal`,
    `SMB market underpriced relative to value delivered — pricing power opportunity`,
    `Consolidation wave: 2-3 major acquisitions expected in next 18 months`,
    `Enterprise security/compliance requirements creating switching barriers for incumbents`,
    `International expansion: ${pick(["EMEA", "LATAM", "APAC", "ANZ"], seed, 82)} market growing ${rangeInt(25, 60, seed, 83)}% YoY`,
  ], 3, seed + "opp");

  const trendData = [
    { trend: "AI / automation features", direction: "📈 Accelerating", impact: "High" },
    { trend: "Pricing pressure from VC-backed entrants", direction: "📈 Increasing", impact: "Medium" },
    { trend: "Consolidation / M&A activity", direction: "📈 Rising", impact: "High" },
    { trend: "Security & compliance requirements", direction: "📈 Expanding", impact: "Medium" },
    { trend: "PLG (product-led growth) adoption", direction: "📈 Mainstream", impact: "Medium" },
  ];

  const analystFirms = pickN(ANALYST_FIRMS, 3, seed + "analyst");

  let out = `## Market Landscape: ${market}\n\n`;
  out += `**Your company:** ${your_company} | **Positioning:** ${your_positioning}\n`;
  out += `**Key differentiator:** ${key_differentiator}\n\n`;

  out += `### Market Player Overview\n\n`;
  out += `| Company | Position | Market Share | Growth | Primary Segment | Strength | Threat |\n`;
  out += `|---------|----------|-------------|--------|-----------------|----------|--------|\n`;
  playerProfiles.forEach((p) => {
    const isYours = p.name === your_company;
    out += `| ${isYours ? `**${p.name}** ⭐` : p.name} | ${p.position} | ~${p.marketShare}% | ${p.growthRate} | ${p.primarySegment} | ${p.strength} | ${p.threat} |\n`;
  });
  out += `\n`;

  out += `### Your Competitive Position\n\n`;
  out += `- **Position:** ${yourProfile.position}\n`;
  out += `- **Est. market share:** ~${yourProfile.marketShare}%\n`;
  out += `- **Primary segment:** ${yourProfile.primarySegment}\n`;
  out += `- **Core strength:** ${yourProfile.strength}\n\n`;

  if (threats.length > 0) {
    out += `### High-Priority Threats\n\n`;
    threats.forEach((t) => {
      out += `**${t.name}** — ${t.threat} threat\n`;
      out += `- Position: ${t.position} | Segment: ${t.primarySegment}\n`;
      out += `- Strength: ${t.strength}\n`;
      out += `- Monitor: funding activity, product launches, enterprise wins\n\n`;
    });
  }

  out += `### Market Opportunities\n\n`;
  opportunities.forEach((o) => { out += `- ${o}\n`; });
  out += `\n`;

  out += `### Market Trends\n\n`;
  out += `| Trend | Direction | Impact |\n|-------|-----------|--------|\n`;
  trendData.forEach((t) => {
    out += `| ${t.trend} | ${t.direction} | ${t.impact} |\n`;
  });
  out += `\n`;

  out += `### Analyst Coverage\n\n`;
  out += `Key analyst firms covering ${market}:\n\n`;
  analystFirms.forEach((f) => {
    out += `- **${f}** — track their ${market} reports for market sizing and vendor rankings\n`;
  });
  out += `\n`;

  out += `### Strategic Recommendations\n\n`;
  out += `1. Reinforce ${key_differentiator} — it's your moat; invest in making it defensible\n`;
  out += `2. Monitor ${threats[0]?.name ?? "top competitors"} quarterly — set up G2/Capterra review alerts\n`;
  out += `3. Own the ${yourProfile.primarySegment} narrative before incumbents pivot there\n`;
  out += `4. Publish category-defining content to shape how analysts and buyers frame the market\n`;
  out += FOOTER;
  return out;
}
