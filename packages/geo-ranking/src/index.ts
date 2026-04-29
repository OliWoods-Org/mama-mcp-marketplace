import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { auditAiVisibilitySchema, auditAiVisibility } from "./tools/audit-ai-visibility.js";
import { optimizeContentSchema, optimizeContent } from "./tools/optimize-content.js";
import { competitorAiPresenceSchema, competitorAiPresence } from "./tools/competitor-ai-presence.js";
import { citationOpportunitiesSchema, citationOpportunities } from "./tools/citation-opportunities.js";
import { aiSearchStrategySchema, aiSearchStrategy } from "./tools/ai-search-strategy.js";

const server = new McpServer({
  name: "geo-ranking",
  version: "1.0.0",
  description: "GEO & AI search visibility — audit AI presence, optimize content for LLM citation, track competitors, and build AI search strategy",
});

server.tool(
  "audit_ai_visibility",
  "Audit how visible your brand is across AI search engines (ChatGPT, Perplexity, Google AI Overviews, etc.). Returns a visibility score by engine, citation rate, strengths, and critical gaps.",
  auditAiVisibilitySchema,
  async (params) => ({ content: [{ type: "text", text: auditAiVisibility(params) }] })
);

server.tool(
  "optimize_content",
  "Optimize a page or content piece for AI citation and GEO. Returns structure recommendations, schema markup, keyword placement, and a projected citation score lift.",
  optimizeContentSchema,
  async (params) => ({ content: [{ type: "text", text: optimizeContent(params) }] })
);

server.tool(
  "competitor_ai_presence",
  "Map competitor visibility across AI search engines for a given keyword. Shows who is being cited, how often, in which engines, and what tactics they are using.",
  competitorAiPresenceSchema,
  async (params) => ({ content: [{ type: "text", text: competitorAiPresence(params) }] })
);

server.tool(
  "citation_opportunities",
  "Discover specific citation-building opportunities to boost your brand's presence in AI-generated answers. Returns prioritized opportunities by effort and impact.",
  citationOpportunitiesSchema,
  async (params) => ({ content: [{ type: "text", text: citationOpportunities(params) }] })
);

server.tool(
  "ai_search_strategy",
  "Generate a phased AI search domination strategy for your brand. Returns a prioritized action plan, target engines, content format recommendations, and projected KPIs.",
  aiSearchStrategySchema,
  async (params) => ({ content: [{ type: "text", text: aiSearchStrategy(params) }] })
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
