import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { qualifyLeadSchema, qualifyLead } from "./tools/qualify-lead.js";
import { writeCallScriptSchema, writeCallScript } from "./tools/write-call-script.js";
import { objectionHandlerSchema, objectionHandler } from "./tools/objection-handler.js";
import { prepCallBriefSchema, prepCallBrief } from "./tools/prep-call-brief.js";
import { postCallSummarySchema, postCallSummary } from "./tools/post-call-summary.js";
import { emailFollowupSchema, emailFollowup } from "./tools/email-followup.js";
import { pipelineForecastSchema, pipelineForecast } from "./tools/pipeline-forecast.js";

const server = new McpServer({
  name: "siren-sales",
  version: "1.0.0",
  description: "AI sales intelligence — lead qualification, call scripts, objection handling, pipeline forecasting, and autonomous sales workflows",
});

server.tool(
  "qualify_lead",
  "Score and qualify a sales lead using BANT framework. Returns ICP fit score, deal size estimate, close probability, pain point diagnosis, and recommended next steps.",
  qualifyLeadSchema,
  async (params) => ({
    content: [{ type: "text", text: qualifyLead(params) }],
  })
);

server.tool(
  "write_call_script",
  "Generate a tailored call script for any sales stage — cold, discovery, demo, proposal, or close. Includes opener, discovery questions, value pitch, and closing language.",
  writeCallScriptSchema,
  async (params) => ({
    content: [{ type: "text", text: writeCallScript(params) }],
  })
);

server.tool(
  "objection_handler",
  "Detect the objection type and generate response playbooks. Covers price, timing, competitor, build vs buy, authority, trust, and need objections with reframes and diagnostic probes.",
  objectionHandlerSchema,
  async (params) => ({
    content: [{ type: "text", text: objectionHandler(params) }],
  })
);

server.tool(
  "prep_call_brief",
  "Generate a pre-call research brief for any meeting. Returns company snapshot, buying signals, top talking points, discovery questions, and call objective — all in under 2 minutes.",
  prepCallBriefSchema,
  async (params) => ({
    content: [{ type: "text", text: prepCallBrief(params) }],
  })
);

server.tool(
  "post_call_summary",
  "Convert raw call notes into a structured post-call summary with executive recap, action items, CRM update fields, and deal health scorecard.",
  postCallSummarySchema,
  async (params) => ({
    content: [{ type: "text", text: postCallSummary(params) }],
  })
);

server.tool(
  "email_followup",
  "Draft a personalized follow-up email for any sales goal — booking meetings, re-engaging dark deals, advancing proposals, or closing. Includes subject line variants, spam score, and send-time recommendations.",
  emailFollowupSchema,
  async (params) => ({
    content: [{ type: "text", text: emailFollowup(params) }],
  })
);

server.tool(
  "pipeline_forecast",
  "Analyze the full sales pipeline and generate a weighted revenue forecast. Returns deal-by-deal probability scoring, at-risk flags, 3-scenario forecast (conservative/base/upside), and weekly priorities.",
  pipelineForecastSchema,
  async (params) => ({
    content: [{ type: "text", text: pipelineForecast(params) }],
  })
);

const transport = new StdioServerTransport();
await server.connect(transport);
