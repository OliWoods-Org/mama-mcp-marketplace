import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { writeReleaseSchema, writeRelease } from "./tools/write-release.js";
import { mediaPitchSchema, mediaPitch } from "./tools/media-pitch.js";
import { pressKitSchema, pressKit } from "./tools/press-kit.js";
import { distributionPlanSchema, distributionPlan } from "./tools/distribution-plan.js";

const server = new McpServer({
  name: "mama-press-release",
  version: "1.0.0",
  description: "PR & media MCP — write press releases, craft media pitches, build press kits, and plan distribution",
});

server.tool(
  "write_release",
  "Write a complete, publication-ready press release for any announcement — product launch, funding, partnership, executive hire, and more.",
  writeReleaseSchema,
  async (params) => ({
    content: [{ type: "text", text: writeRelease(params) }],
  })
);

server.tool(
  "media_pitch",
  "Craft a targeted media pitch to get journalists to cover your story. Includes subject line options, outlet recommendations, a full email draft, and pitch tips.",
  mediaPitchSchema,
  async (params) => ({
    content: [{ type: "text", text: mediaPitch(params) }],
  })
);

server.tool(
  "press_kit",
  "Build a comprehensive press kit — company overview, key stats, leadership bios, media assets checklist, boilerplate copy, and editorial style notes.",
  pressKitSchema,
  async (params) => ({
    content: [{ type: "text", text: pressKit(params) }],
  })
);

server.tool(
  "distribution_plan",
  "Create a full press release distribution plan — timeline, wire services, direct outreach targets, owned channel amplification, and success metrics.",
  distributionPlanSchema,
  async (params) => ({
    content: [{ type: "text", text: distributionPlan(params) }],
  })
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
