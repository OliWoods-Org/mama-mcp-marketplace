import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { searchConversationsSchema, searchConversations, getConversationSchema, getConversation } from "./tools/conversations.js";
import { triageTicketSchema, triageTicket } from "./tools/triage.js";
import { draftResponseSchema, draftResponse } from "./tools/draft-response.js";
import { searchKnowledgeBaseSchema, searchKnowledgeBase } from "./tools/knowledge-base.js";
import { supportMetricsSchema, supportMetrics, customerHealthSchema, customerHealth } from "./tools/analytics.js";

const server = new McpServer({
  name: "intercom-support",
  version: "1.0.0",
  description: "AI-powered customer support — conversation management, ticket triage, draft responses, knowledge base, analytics, and customer health scoring",
});

// ── Conversations ───────────────────────────────────────────────────────────

server.tool(
  "search_conversations",
  "Search and filter customer conversations by status, priority, and keyword. Returns conversation list with customer info, sentiment, priority, and age.",
  searchConversationsSchema,
  async (params) => ({ content: [{ type: "text", text: searchConversations(params) }] })
);

server.tool(
  "get_conversation",
  "Get full conversation thread with customer details, plan info, MRR, sentiment analysis, and complete message history.",
  getConversationSchema,
  async (params) => ({ content: [{ type: "text", text: getConversation(params) }] })
);

// ── AI Triage & Response ────────────────────────────────────────────────────

server.tool(
  "triage_ticket",
  "Auto-classify a support ticket — determines priority (P0-P3), category, sentiment, suggested tags, and recommended actions. Uses keyword analysis and plan-tier context.",
  triageTicketSchema,
  async (params) => ({ content: [{ type: "text", text: triageTicket(params) }] })
);

server.tool(
  "draft_response",
  "Generate an AI draft response to a customer message with configurable tone (empathetic, professional, friendly, technical, urgent). Includes contextual templates, KB links, and estimated CSAT score.",
  draftResponseSchema,
  async (params) => ({ content: [{ type: "text", text: draftResponse(params) }] })
);

// ── Knowledge Base ──────────────────────────────────────────────────────────

server.tool(
  "search_knowledge_base",
  "Search the knowledge base for relevant articles. Returns helpfulness ratings, deflection rates, and freshness indicators. Helps agents find the right article to send customers.",
  searchKnowledgeBaseSchema,
  async (params) => ({ content: [{ type: "text", text: searchKnowledgeBase(params) }] })
);

// ── Analytics ───────────────────────────────────────────────────────────────

server.tool(
  "support_metrics",
  "Dashboard view of support metrics — total conversations, resolution rates, CSAT, NPS, SLA compliance, category breakdown, and AI performance stats.",
  supportMetricsSchema,
  async (params) => ({ content: [{ type: "text", text: supportMetrics(params) }] })
);

server.tool(
  "customer_health",
  "Customer health score with churn risk, ticket history, sentiment trends, feature adoption, and actionable recommendations for retention or upsell.",
  customerHealthSchema,
  async (params) => ({ content: [{ type: "text", text: customerHealth(params) }] })
);

// ── Start ───────────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
