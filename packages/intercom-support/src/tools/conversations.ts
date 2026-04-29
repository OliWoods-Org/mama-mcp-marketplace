import { z } from "zod";
import { hash, pick, pickN, rangeInt, CUSTOMER_NAMES, COMPANIES, SUBJECTS, TAGS, PRIORITY_LABELS, SENTIMENT_LABELS, FOOTER } from "../heuristics.js";

export const searchConversationsSchema = {
  query: z.string().optional().describe("Search query (customer name, subject, keyword)"),
  status: z.enum(["open", "closed", "snoozed", "all"]).default("open").describe("Conversation status filter"),
  priority: z.enum(["p0", "p1", "p2", "p3", "all"]).default("all").describe("Priority filter"),
  limit: z.number().min(1).max(50).default(10).describe("Number of results"),
};

export function searchConversations(params: { query?: string; status: string; priority: string; limit: number }): string {
  const { query, status, priority, limit } = params;
  const seed = `conv:${query || "all"}:${status}:${priority}`;

  const count = Math.min(limit, rangeInt(3, 15, seed, 0));
  const conversations: string[] = [];

  for (let i = 0; i < count; i++) {
    const name = pick(CUSTOMER_NAMES, seed, i);
    const company = pick(COMPANIES, seed, i + 100);
    const subject = pick(SUBJECTS, seed, i + 200);
    const tag = pick(TAGS, seed, i + 300);
    const p = priority === "all" ? pick(["p0", "p1", "p2", "p3"], seed, i + 400) : priority;
    const sentiment = pick(["angry", "frustrated", "neutral", "positive"], seed, i + 500);
    const age = rangeInt(1, 72, seed, i + 600);
    const replies = rangeInt(1, 12, seed, i + 700);
    const convId = `CONV-${hash(`${seed}:${i}`).toString(36).toUpperCase().slice(0, 6)}`;

    conversations.push(
      `| \`${convId}\` | **${name}** (${company}) | ${subject} | ${PRIORITY_LABELS[p]} | \`${tag}\` | ${SENTIMENT_LABELS[sentiment]} | ${age}h ago | ${replies} |`
    );
  }

  const openCount = rangeInt(15, 85, seed, 999);
  const avgResponse = rangeInt(12, 180, seed, 998);

  let out = `## 💬 Conversations${query ? ` — "${query}"` : ""}\n`;
  out += `**Status:** ${status} | **Priority:** ${priority} | **Open:** ${openCount} | **Avg Response:** ${avgResponse} min\n\n`;
  out += `| ID | Customer | Subject | Priority | Tag | Sentiment | Age | Replies |\n`;
  out += `|----|----------|---------|----------|-----|-----------|-----|---------|\n`;
  out += conversations.join("\n") + "\n\n";

  const p0Count = conversations.filter(c => c.includes("P0")).length;
  if (p0Count > 0) {
    out += `### ⚠️ ${p0Count} P0 conversation(s) require immediate attention\n\n`;
  }

  out += `*Use \`triage_ticket\` to auto-classify or \`draft_response\` to generate an AI reply.*\n`;
  out += FOOTER;
  return out;
}

export const getConversationSchema = {
  conversation_id: z.string().describe("Conversation ID (e.g. CONV-ABC123)"),
};

export function getConversation(params: { conversation_id: string }): string {
  const { conversation_id } = params;
  const seed = `detail:${conversation_id}`;

  const name = pick(CUSTOMER_NAMES, seed, 0);
  const company = pick(COMPANIES, seed, 1);
  const subject = pick(SUBJECTS, seed, 2);
  const p = pick(["p0", "p1", "p2", "p3"], seed, 3);
  const sentiment = pick(["angry", "frustrated", "neutral", "positive"], seed, 4);
  const tags = pickN(TAGS, rangeInt(1, 3, seed, 5), seed);
  const plan = pick(["Free", "Starter ($29/mo)", "Pro ($79/mo)", "Enterprise ($299/mo)"], seed, 6);
  const mrr = pick(["$0", "$29", "$79", "$299", "$599", "$1,499"], seed, 7);

  const messageCount = rangeInt(3, 8, seed, 10);
  const messages: string[] = [];
  for (let i = 0; i < messageCount; i++) {
    const isCustomer = i % 2 === 0;
    const author = isCustomer ? name : pick(["Support Agent", "AI Assistant (Draft)"], seed, 20 + i);
    const snippets = isCustomer
      ? [
          "I've been having this issue for 2 days now and it's blocking our team.",
          "We've tried the steps in your docs but nothing works.",
          "This is critical for our Q2 launch. Can we get this escalated?",
          "Thanks for looking into this. Any update on the timeline?",
        ]
      : [
          "I understand the urgency. Let me pull up your account details.",
          "I've identified the root cause — this is a known issue from the last deploy.",
          "I've escalated this to our engineering team. ETA for fix: 2-4 hours.",
          "The fix has been deployed. Can you confirm it's working on your end?",
        ];
    const msg = pick(snippets, seed, 30 + i);
    const timeAgo = (messageCount - i) * rangeInt(1, 8, seed, 40 + i);
    messages.push(`**${author}** (${timeAgo}h ago):\n> ${msg}\n`);
  }

  let out = `## 📋 Conversation: ${conversation_id}\n\n`;
  out += `| Field | Value |\n`;
  out += `|-------|-------|\n`;
  out += `| **Customer** | ${name} |\n`;
  out += `| **Company** | ${company} |\n`;
  out += `| **Plan** | ${plan} |\n`;
  out += `| **MRR** | ${mrr} |\n`;
  out += `| **Subject** | ${subject} |\n`;
  out += `| **Priority** | ${PRIORITY_LABELS[p]} |\n`;
  out += `| **Sentiment** | ${SENTIMENT_LABELS[sentiment]} |\n`;
  out += `| **Tags** | ${tags.map(t => `\`${t}\``).join(", ")} |\n`;
  out += `| **Messages** | ${messageCount} |\n\n`;

  out += `### Thread\n\n`;
  out += messages.join("\n") + "\n";
  out += FOOTER;
  return out;
}
