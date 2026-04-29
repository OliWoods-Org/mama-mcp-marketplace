import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { writeProposalSchema, writeProposal } from "./tools/write-proposal.js";
import { scopeOfWorkSchema, scopeOfWork } from "./tools/scope-of-work.js";
import { pricingStrategySchema, pricingStrategy } from "./tools/pricing-strategy.js";
import { caseStudyGeneratorSchema, caseStudyGenerator } from "./tools/case-study-generator.js";
import { pitchDeckOutlineSchema, pitchDeckOutline } from "./tools/pitch-deck-outline.js";

const server = new McpServer({
  name: "mama-proposal-writer",
  version: "1.0.0",
  description: "Proposal writing MCP — write proposals, define scope of work, strategize pricing, generate case studies, and outline pitch decks",
});

server.tool(
  "write_proposal",
  "Write a complete, professional business proposal — executive summary, challenge framing, proposed approach, deliverables, outcomes, and investment details.",
  writeProposalSchema,
  async (params) => ({
    content: [{ type: "text", text: writeProposal(params) }],
  })
);

server.tool(
  "scope_of_work",
  "Generate a complete Statement of Work (SOW) — deliverable milestones, out-of-scope items, assumptions, change order process, acceptance criteria, and signature block.",
  scopeOfWorkSchema,
  async (params) => ({
    content: [{ type: "text", text: scopeOfWork(params) }],
  })
);

server.tool(
  "pricing_strategy",
  "Build a data-backed pricing strategy — cost-based and market-adjusted price calculations, 3-tier packaging, anchoring strategy, and negotiation guardrails.",
  pricingStrategySchema,
  async (params) => ({
    content: [{ type: "text", text: pricingStrategy(params) }],
  })
);

server.tool(
  "case_study_generator",
  "Generate a compelling case study — results-at-a-glance stats, situation/complication/solution/results structure, testimonial formatting, and usage recommendations.",
  caseStudyGeneratorSchema,
  async (params) => ({
    content: [{ type: "text", text: caseStudyGenerator(params) }],
  })
);

server.tool(
  "pitch_deck_outline",
  "Create a pitch deck slide-by-slide outline — tailored for investor pitches, sales decks, partnership decks, or board updates. Includes storytelling arc and design principles.",
  pitchDeckOutlineSchema,
  async (params) => ({
    content: [{ type: "text", text: pitchDeckOutline(params) }],
  })
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
