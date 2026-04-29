import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { landingPageAuditSchema, landingPageAudit } from "./tools/landing-page-audit.js";
import { abTestGeneratorSchema, abTestGenerator } from "./tools/ab-test-generator.js";
import { funnelAnalyzerSchema, funnelAnalyzer } from "./tools/funnel-analyzer.js";
import { ctaOptimizerSchema, ctaOptimizer } from "./tools/cta-optimizer.js";
import { pricingPageReviewSchema, pricingPageReview } from "./tools/pricing-page-review.js";

const server = new McpServer({
  name: "cro-optimizer",
  version: "1.0.0",
  description: "CRO Optimizer — audit landing pages, generate A/B tests, analyze funnels, optimize CTAs, and review pricing pages to maximize conversions",
});

server.tool(
  "landing_page_audit",
  "Audit a landing page for conversion rate optimization. Scores every key element, identifies critical issues and friction points, estimates revenue uplift, and gives a prioritized fix list.",
  landingPageAuditSchema,
  async (params) => ({ content: [{ type: "text", text: landingPageAudit(params) }] })
);

server.tool(
  "ab_test_generator",
  "Generate a statistically rigorous A/B test plan for a page or feature. Returns 3 prioritized test variants, required sample sizes, estimated duration, and expected CVR lift.",
  abTestGeneratorSchema,
  async (params) => ({ content: [{ type: "text", text: abTestGenerator(params) }] })
);

server.tool(
  "funnel_analyzer",
  "Analyze a multi-step conversion funnel to identify where visitors drop off. Returns a step-by-step breakdown, biggest bottleneck, estimated recoverable revenue, and prioritized fixes.",
  funnelAnalyzerSchema,
  async (params) => ({ content: [{ type: "text", text: funnelAnalyzer(params) }] })
);

server.tool(
  "cta_optimizer",
  "Optimize a call-to-action button for maximum click-through and conversion. Generates 5 tested CTA variants, diagnoses current weaknesses, and recommends button copy, color, and supporting text.",
  ctaOptimizerSchema,
  async (params) => ({ content: [{ type: "text", text: ctaOptimizer(params) }] })
);

server.tool(
  "pricing_page_review",
  "Review a pricing page for conversion optimization. Analyzes tier structure, pricing psychology, annual plan strategy, objection handling, and recommends the best pricing pattern for the business model.",
  pricingPageReviewSchema,
  async (params) => ({ content: [{ type: "text", text: pricingPageReview(params) }] })
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
