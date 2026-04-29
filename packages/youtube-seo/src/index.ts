import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { titleOptimizerSchema, titleOptimizer } from "./tools/title-optimizer.js";
import { descriptionWriterSchema, descriptionWriter } from "./tools/description-writer.js";
import { tagGeneratorSchema, tagGenerator } from "./tools/tag-generator.js";
import { thumbnailAnalyzerSchema, thumbnailAnalyzer } from "./tools/thumbnail-analyzer.js";
import { channelAuditSchema, channelAudit } from "./tools/channel-audit.js";

const server = new McpServer({
  name: "youtube-seo",
  version: "1.0.0",
  description: "YouTube SEO — optimize titles, write descriptions, generate tags, analyze thumbnails, and audit channels for maximum reach",
});

server.tool(
  "title_optimizer",
  "Generate 5 SEO-optimized YouTube title variants for a topic. Scores each by projected CTR, applies proven hook formulas, and recommends the best option for your niche.",
  titleOptimizerSchema,
  async (params) => ({ content: [{ type: "text", text: titleOptimizer(params) }] })
);

server.tool(
  "description_writer",
  "Write a complete, SEO-optimized YouTube description with hook, summary, timestamps, CTAs, links, and hashtags. Includes a description scorecard.",
  descriptionWriterSchema,
  async (params) => ({ content: [{ type: "text", text: descriptionWriter(params) }] })
);

server.tool(
  "tag_generator",
  "Generate a full set of YouTube tags organized by category (exact match, broad match, long-tail, question-based). Returns a copy-paste tag string within YouTube's 500-character limit.",
  tagGeneratorSchema,
  async (params) => ({ content: [{ type: "text", text: tagGenerator(params) }] })
);

server.tool(
  "thumbnail_analyzer",
  "Analyze a thumbnail concept or description for CTR potential. Returns a score, projected vs benchmark CTR, specific issues to fix, recommended design elements, and A/B test suggestions.",
  thumbnailAnalyzerSchema,
  async (params) => ({ content: [{ type: "text", text: thumbnailAnalyzer(params) }] })
);

server.tool(
  "channel_audit",
  "Audit a YouTube channel's overall health and growth potential. Scores key metrics (CTR, AVD, engagement, consistency), identifies growth blockers, and generates a 30-day action plan.",
  channelAuditSchema,
  async (params) => ({ content: [{ type: "text", text: channelAudit(params) }] })
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
