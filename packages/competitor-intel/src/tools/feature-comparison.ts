import { z } from "zod";
import { pick, pickN, rangeInt, FEATURE_CATEGORIES, COMPETITIVE_POSITIONS, FOOTER } from "../heuristics.js";

export const featureComparisonSchema = {
  your_product: z.string().describe("Your product name"),
  competitors: z.string().describe("Competitor names (comma-separated, up to 4)"),
  features: z.string().describe("Features or capabilities to compare (comma-separated)"),
  focus_area: z.string().optional().describe("Specific area to focus analysis on (e.g. 'enterprise security', 'ease of use', 'integrations')"),
};

export function featureComparison(params: {
  your_product: string;
  competitors: string;
  features: string;
  focus_area?: string;
}): string {
  const { your_product, competitors, features, focus_area } = params;
  const seed = `features:${your_product}:${competitors}`;

  const competitorList = competitors.split(",").map((c) => c.trim()).filter(Boolean).slice(0, 4);
  const featureList = features.split(",").map((f) => f.trim()).filter(Boolean);
  const allProducts = [your_product, ...competitorList];

  type Status = "✅ Full" | "⚠️ Partial" | "❌ No" | "🔜 Roadmap";
  const statusOptions: Status[] = ["✅ Full", "⚠️ Partial", "❌ No", "🔜 Roadmap"];

  const matrix: Record<string, Record<string, Status>> = {};
  featureList.forEach((feature) => {
    matrix[feature] = {};
    allProducts.forEach((product, pi) => {
      const isYours = pi === 0;
      const biasedOptions: Status[] = isYours
        ? ["✅ Full", "✅ Full", "✅ Full", "⚠️ Partial"]
        : ["✅ Full", "⚠️ Partial", "❌ No", "🔜 Roadmap"];
      matrix[feature][product] = pick(biasedOptions, seed + feature + product, 0);
    });
  });

  const scores: Record<string, number> = {};
  const scoreMap: Record<Status, number> = { "✅ Full": 3, "⚠️ Partial": 1, "❌ No": 0, "🔜 Roadmap": 0.5 };
  allProducts.forEach((product) => {
    scores[product] = featureList.reduce((sum, f) => sum + scoreMap[matrix[f][product]], 0);
  });

  const maxScore = featureList.length * 3;
  const yourScore = scores[your_product];

  const uniqueAdvantages = featureList.filter((f) =>
    matrix[f][your_product] === "✅ Full" &&
    competitorList.every((c) => matrix[f][c] !== "✅ Full")
  );

  const gaps = featureList.filter((f) =>
    matrix[f][your_product] !== "✅ Full" &&
    competitorList.some((c) => matrix[f][c] === "✅ Full")
  );

  const position = pick(COMPETITIVE_POSITIONS, seed, 0);

  let out = `## Feature Comparison: ${your_product} vs. Competition\n\n`;
  if (focus_area) out += `**Focus Area:** ${focus_area}\n`;
  out += `**Competitive Position:** ${position}\n\n`;

  out += `### Feature Matrix\n\n`;
  out += `| Feature | ${allProducts.join(" | ")} |\n`;
  out += `|---------|${allProducts.map(() => "---").join("|")}|\n`;
  featureList.forEach((f) => {
    out += `| **${f}** | ${allProducts.map((p) => matrix[f][p]).join(" | ")} |\n`;
  });
  out += `| **Score** | ${allProducts.map((p) => `**${scores[p]}/${maxScore}**`).join(" | ")} |\n\n`;

  out += `### Scoring Summary\n\n`;
  const ranked = [...allProducts].sort((a, b) => scores[b] - scores[a]);
  ranked.forEach((product, i) => {
    const pct = Math.round((scores[product] / maxScore) * 100);
    const bar = "█".repeat(Math.round(pct / 10)) + "░".repeat(10 - Math.round(pct / 10));
    out += `${i + 1}. **${product}** — ${bar} ${pct}%\n`;
  });
  out += `\n`;

  if (uniqueAdvantages.length > 0) {
    out += `### Your Unique Advantages\n\n`;
    out += `Features only ${your_product} delivers fully:\n\n`;
    uniqueAdvantages.forEach((f) => { out += `- ✅ **${f}**\n`; });
    out += `\n`;
  }

  if (gaps.length > 0) {
    out += `### Gaps to Address\n\n`;
    out += `Competitor advantages you should roadmap or position around:\n\n`;
    gaps.forEach((f) => {
      const leader = competitorList.find((c) => matrix[f][c] === "✅ Full") ?? competitorList[0];
      out += `- ⚠️ **${f}** — ${leader} has full coverage\n`;
    });
    out += `\n`;
  }

  out += `### How to Use This in Sales\n\n`;
  out += `1. Lead the conversation in your areas of "✅ Full" advantage\n`;
  out += `2. Reframe gaps as "we're focused on ${focus_area ?? "core use cases"} first — here's our roadmap"\n`;
  out += `3. When competitors cite ⚠️ Partial coverage as "Full" — probe with: "Can you show me a live demo of that feature?"\n`;
  out += FOOTER;
  return out;
}
