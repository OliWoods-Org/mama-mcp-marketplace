import { z } from "zod";
import { hash, pick, rangeInt, CUSTOMER_NAMES, FOOTER } from "../heuristics.js";

export const draftResponseSchema = {
  customer_message: z.string().describe("The customer's message to respond to"),
  tone: z.enum(["empathetic", "professional", "friendly", "technical", "urgent"]).default("professional").describe("Response tone"),
  context: z.string().optional().describe("Additional context (plan tier, previous interactions, known issue)"),
  include_kb_link: z.boolean().default(true).describe("Include relevant knowledge base article link"),
};

export function draftResponse(params: { customer_message: string; tone: string; context?: string; include_kb_link: boolean }): string {
  const { customer_message, tone, context, include_kb_link } = params;
  const seed = `draft:${customer_message.slice(0, 50)}:${tone}`;

  const toneGuides: Record<string, { greeting: string; style: string; closing: string }> = {
    empathetic: {
      greeting: "I completely understand how frustrating this must be",
      style: "Lead with acknowledgement, validate feelings, then solve",
      closing: "I know this isn't the experience you expect, and I'm committed to making it right",
    },
    professional: {
      greeting: "Thank you for reaching out",
      style: "Clear, concise, solution-oriented",
      closing: "Please don't hesitate to reach out if you need anything else",
    },
    friendly: {
      greeting: "Hey there! Thanks for getting in touch",
      style: "Warm, approachable, conversational",
      closing: "We're always here if you need us — happy to help anytime!",
    },
    technical: {
      greeting: "Thanks for the detailed report",
      style: "Technical precision, include steps/commands, reference docs",
      closing: "Let me know if you need any clarification on the above",
    },
    urgent: {
      greeting: "I've flagged this as a priority and I'm on it right now",
      style: "Short, action-focused, clear timelines",
      closing: "I'll update you within the next hour with progress",
    },
  };

  const guide = toneGuides[tone] || toneGuides.professional;

  // Generate contextual response body
  const issueType = customer_message.toLowerCase().includes("billing") ? "billing"
    : customer_message.toLowerCase().includes("error") || customer_message.toLowerCase().includes("crash") ? "bug"
    : customer_message.toLowerCase().includes("api") || customer_message.toLowerCase().includes("webhook") ? "api"
    : customer_message.toLowerCase().includes("login") || customer_message.toLowerCase().includes("access") ? "auth"
    : "general";

  const responseTemplates: Record<string, string> = {
    billing: `I've pulled up your account and can see the billing discrepancy you mentioned. Here's what I found:\n\n- Your current plan: [plan details]\n- Last charge: [amount] on [date]\n- Expected charge: [amount]\n\nI've [initiated a review / applied a credit / escalated to billing team]. You should see this reflected within [timeframe].`,
    bug: `I've been able to reproduce the issue you described. Here's what's happening:\n\n**Root cause:** [identified cause]\n**Impact:** [scope of impact]\n**Status:** Our engineering team has been notified and a fix is in progress.\n**ETA:** [estimated resolution time]\n\nIn the meantime, here's a workaround you can use:\n1. [Step 1]\n2. [Step 2]\n3. [Step 3]`,
    api: `I've looked into the API issue you reported. Here are my findings:\n\n**Endpoint:** \`[endpoint]\`\n**Status:** [current status]\n**Rate limit:** You're currently at [X]% of your plan's limit\n\n**Recommended fix:**\n\`\`\`\n[code snippet or configuration change]\n\`\`\`\n\nI'd also recommend reviewing our rate limiting best practices guide.`,
    auth: `I've checked your account's authentication configuration. Here's what I found:\n\n- SSO/SAML status: [configured/not configured]\n- Recent login attempts: [details]\n- Account lock status: [locked/unlocked]\n\n**To resolve this:**\n1. [Clear step 1]\n2. [Clear step 2]\n3. [Verification step]\n\nIf you're still unable to access your account after these steps, I can initiate a manual reset.`,
    general: `Thank you for bringing this to our attention. I've reviewed your request and here's what I can do:\n\n1. [Action item 1]\n2. [Action item 2]\n3. [Next steps]\n\nI'll keep you updated on progress. Expected resolution: [timeframe].`,
  };

  const kbSuggestion = include_kb_link
    ? `\n\n📚 **Helpful resource:** [${pick(["Getting Started Guide", "API Best Practices", "Troubleshooting FAQ", "Integration Setup"], seed, 10)}](https://help.yourapp.com/article/${rangeInt(100, 999, seed, 11)})`
    : "";

  let out = `## ✍️ AI Draft Response\n\n`;
  out += `**Tone:** ${tone} | **Issue type:** ${issueType}\n`;
  out += `**Style guide:** ${guide.style}\n\n`;

  out += `### Draft\n\n`;
  out += `---\n\n`;
  out += `Hi [Customer Name],\n\n`;
  out += `${guide.greeting}.\n\n`;
  out += `${responseTemplates[issueType]}${kbSuggestion}\n\n`;
  out += `${guide.closing}.\n\n`;
  out += `Best,\n[Agent Name]\n`;
  out += `\n---\n\n`;

  out += `### Response Metadata\n\n`;
  out += `| Metric | Value |\n`;
  out += `|--------|-------|\n`;
  out += `| **Estimated CSAT** | ${rangeInt(75, 95, seed, 20)}% |\n`;
  out += `| **First response** | ${tone === "urgent" ? "Yes — within SLA" : "Yes"} |\n`;
  out += `| **Personalization** | ${context ? "High (context provided)" : "Medium (auto-detected)"} |\n`;
  out += `| **KB deflection potential** | ${include_kb_link ? rangeInt(20, 60, seed, 21) + "%" : "N/A"} |\n\n`;

  out += `*Review and edit before sending. Use \`approve_and_send\` to dispatch, or edit and send manually.*\n`;
  out += FOOTER;
  return out;
}
