import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { episodePlannerSchema, episodePlanner } from "./tools/episode-planner.js";
import { guestResearchSchema, guestResearch } from "./tools/guest-research.js";
import { showNotesSchema, showNotes } from "./tools/show-notes.js";
import { clipFinderSchema, clipFinder } from "./tools/clip-finder.js";
import { podcastGrowthSchema, podcastGrowth } from "./tools/podcast-growth.js";

const server = new McpServer({
  name: "mama-podcast-producer",
  version: "1.0.0",
  description: "Podcast production MCP — plan episodes, research guests, write show notes, find viral clips, and grow your audience",
});

server.tool(
  "episode_planner",
  "Plan a complete podcast episode — hook options, segment-by-segment structure with timing, interview question framework, and SEO metadata.",
  episodePlannerSchema,
  async (params) => ({
    content: [{ type: "text", text: episodePlanner(params) }],
  })
);

server.tool(
  "guest_research",
  "Research a podcast guest — fit scores, expertise areas, interview angles, pre-interview checklist, and a personalized outreach email template.",
  guestResearchSchema,
  async (params) => ({
    content: [{ type: "text", text: guestResearch(params) }],
  })
);

server.tool(
  "show_notes",
  "Generate complete, SEO-optimized show notes — episode summary, key takeaways, auto-generated timestamps, guest bio section, resources, and CTA.",
  showNotesSchema,
  async (params) => ({
    content: [{ type: "text", text: showNotes(params) }],
  })
);

server.tool(
  "clip_finder",
  "Identify the best clips from an episode for social media — viral score, optimal clip length, platform specs, caption hooks, and a production checklist.",
  clipFinderSchema,
  async (params) => ({
    content: [{ type: "text", text: clipFinder(params) }],
  })
);

server.tool(
  "podcast_growth",
  "Build a podcast growth strategy — benchmarking vs. industry, untapped growth channels, quick wins, and monetization readiness analysis.",
  podcastGrowthSchema,
  async (params) => ({
    content: [{ type: "text", text: podcastGrowth(params) }],
  })
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
