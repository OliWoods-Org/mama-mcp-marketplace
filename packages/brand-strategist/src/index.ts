import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { brandAuditSchema, brandAudit } from "./tools/brand-audit.js";
import { styleGuideGeneratorSchema, styleGuideGenerator } from "./tools/style-guide-generator.js";
import { namingBrainstormSchema, namingBrainstorm } from "./tools/naming-brainstorm.js";
import { brandVoiceSchema, brandVoice } from "./tools/brand-voice.js";
import { competitivePositioningSchema, competitivePositioning } from "./tools/competitive-positioning.js";

const server = new McpServer({
  name: "brand-strategist",
  version: "1.0.0",
  description: "Brand Strategist — audit brands, generate style guides, brainstorm names, define brand voice, and map competitive positioning",
});

server.tool(
  "brand_audit",
  "Audit a brand across 8 strategic dimensions (visual identity, voice clarity, differentiation, audience alignment, etc.). Returns a health score, archetype identification, gaps, and recommended next steps.",
  brandAuditSchema,
  async (params) => ({ content: [{ type: "text", text: brandAudit(params) }] })
);

server.tool(
  "style_guide_generator",
  "Generate a complete brand style guide including color palette, typography pairings, logo usage rules, imagery direction, and voice quick reference. Tailored to the brand archetype and industry.",
  styleGuideGeneratorSchema,
  async (params) => ({ content: [{ type: "text", text: styleGuideGenerator(params) }] })
);

server.tool(
  "naming_brainstorm",
  "Brainstorm 8+ brand or product name candidates with memorability scores, domain availability estimates, trademark risk, and naming pattern breakdown. Includes a naming criteria checklist.",
  namingBrainstormSchema,
  async (params) => ({ content: [{ type: "text", text: namingBrainstorm(params) }] })
);

server.tool(
  "brand_voice",
  "Define a detailed brand voice guide for a specific channel or all channels. Includes voice spectrum, tone definition, do/don't rules, before/after copy examples, and channel-specific guidance.",
  brandVoiceSchema,
  async (params) => ({ content: [{ type: "text", text: brandVoice(params) }] })
);

server.tool(
  "competitive_positioning",
  "Map your brand's competitive position against key competitors. Returns positioning maps by axis, competitor strengths/weaknesses, differentiation pillars, white space opportunities, and a positioning statement template.",
  competitivePositioningSchema,
  async (params) => ({ content: [{ type: "text", text: competitivePositioning(params) }] })
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
