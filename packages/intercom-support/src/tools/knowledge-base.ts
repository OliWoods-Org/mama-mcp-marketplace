import { z } from "zod";
import { hash, pick, rangeInt, rangeFloat, KB_ARTICLES, FOOTER } from "../heuristics.js";

export const searchKnowledgeBaseSchema = {
  query: z.string().describe("Search query for knowledge base articles"),
  category: z.string().optional().describe("Filter by category (e.g. 'API', 'Billing', 'Integrations')"),
  limit: z.number().min(1).max(20).default(5).describe("Number of results"),
};

export function searchKnowledgeBase(params: { query: string; category?: string; limit: number }): string {
  const { query, category, limit } = params;
  const seed = `kb:${query}:${category || "all"}`;

  const queryLower = query.toLowerCase();
  let results = KB_ARTICLES
    .map(article => {
      const titleMatch = article.title.toLowerCase().split(" ").filter(w => queryLower.includes(w)).length;
      const catMatch = category ? (article.category.toLowerCase() === category.toLowerCase() ? 3 : 0) : 0;
      const relevance = titleMatch * 2 + catMatch + (hash(`${seed}:${article.title}`) % 3);
      return { ...article, relevance };
    })
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, limit);

  // Add generated metrics
  const enrichedResults = results.map((article, i) => {
    const helpfulness = rangeInt(65, 98, seed, i);
    const deflectionRate = rangeInt(15, 55, seed, i + 100);
    const lastUpdated = rangeInt(1, 90, seed, i + 200);
    return { ...article, helpfulness, deflectionRate, lastUpdated };
  });

  let out = `## 📚 Knowledge Base Search: "${query}"\n`;
  if (category) out += `**Category filter:** ${category}\n`;
  out += `**Results:** ${enrichedResults.length}\n\n`;

  out += `| # | Article | Category | Views | Helpfulness | Deflection | Updated |\n`;
  out += `|---|---------|----------|-------|-------------|------------|---------|\n`;
  enrichedResults.forEach((a, i) => {
    out += `| ${i + 1} | ${a.title} | ${a.category} | ${a.views.toLocaleString()} | ${a.helpfulness}% | ${a.deflectionRate}% | ${a.lastUpdated}d ago |\n`;
  });

  out += `\n### Suggestions\n\n`;
  const topResult = enrichedResults[0];
  if (topResult && topResult.helpfulness > 85) {
    out += `✅ **"${topResult.title}"** has a ${topResult.helpfulness}% helpfulness rating — strongly recommended as first response.\n`;
  }

  const lowArticles = enrichedResults.filter(a => a.lastUpdated > 60);
  if (lowArticles.length > 0) {
    out += `\n⚠️ ${lowArticles.length} article(s) haven't been updated in 60+ days — consider reviewing for accuracy.\n`;
  }

  const totalDeflection = Math.round(enrichedResults.reduce((a, r) => a + r.deflectionRate, 0) / enrichedResults.length);
  out += `\n**Average deflection rate:** ${totalDeflection}% — ${totalDeflection > 40 ? "Good self-service coverage" : "Consider improving article depth"}\n`;
  out += FOOTER;
  return out;
}
