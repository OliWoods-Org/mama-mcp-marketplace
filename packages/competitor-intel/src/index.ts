import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { battlecardSchema, battlecard } from "./tools/battlecard.js";
import { featureComparisonSchema, featureComparison } from "./tools/feature-comparison.js";
import { pricingAnalysisSchema, pricingAnalysis } from "./tools/pricing-analysis.js";
import { winLossAnalyzerSchema, winLossAnalyzer } from "./tools/win-loss-analyzer.js";
import { marketLandscapeSchema, marketLandscape } from "./tools/market-landscape.js";

const server = new McpServer({
  name: "mama-competitor-intel",
  version: "1.0.0",
  description: "Competitive intelligence MCP — build battlecards, compare features, analyze pricing, review win/loss data, and map the market landscape",
});

server.tool(
  "battlecard",
  "Build a sales battlecard against a specific competitor — win/loss patterns, objection handlers, winning talk tracks, and deal disqualifiers.",
  battlecardSchema,
  async (params) => ({
    content: [{ type: "text", text: battlecard(params) }],
  })
);

server.tool(
  "feature_comparison",
  "Generate a side-by-side feature comparison matrix against up to 4 competitors — scoring, unique advantages, gap analysis, and sales guidance.",
  featureComparisonSchema,
  async (params) => ({
    content: [{ type: "text", text: featureComparison(params) }],
  })
);

server.tool(
  "pricing_analysis",
  "Analyze competitor pricing across tiers — market range, positioning recommendations, volume discount benchmarks, and pricing lever suggestions.",
  pricingAnalysisSchema,
  async (params) => ({
    content: [{ type: "text", text: pricingAnalysis(params) }],
  })
);

server.tool(
  "win_loss_analyzer",
  "Analyze win/loss patterns over a period — win rate benchmarking, reason frequency, segment breakdown, priority actions, and revenue impact forecast.",
  winLossAnalyzerSchema,
  async (params) => ({
    content: [{ type: "text", text: winLossAnalyzer(params) }],
  })
);

server.tool(
  "market_landscape",
  "Map the competitive landscape — player profiles with market share/growth/positioning, threat assessment, market opportunities, trend analysis, and strategic recommendations.",
  marketLandscapeSchema,
  async (params) => ({
    content: [{ type: "text", text: marketLandscape(params) }],
  })
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
