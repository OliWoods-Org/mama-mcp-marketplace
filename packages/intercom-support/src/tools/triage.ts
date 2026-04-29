import { z } from "zod";
import { hash, pick, pickN, rangeInt, rangeFloat, TAGS, PRIORITY_LABELS, SENTIMENT_LABELS, KB_ARTICLES, FOOTER } from "../heuristics.js";

export const triageTicketSchema = {
  subject: z.string().describe("Ticket subject or summary"),
  body: z.string().describe("Full ticket body / customer message"),
  customer_plan: z.enum(["free", "starter", "pro", "enterprise"]).optional().describe("Customer's plan tier"),
};

export function triageTicket(params: { subject: string; body: string; customer_plan?: string }): string {
  const { subject, body, customer_plan } = params;
  const seed = `triage:${subject}:${body.slice(0, 50)}`;

  // Priority classification
  const urgencyKeywords = ["critical", "blocking", "down", "broken", "urgent", "asap", "crash", "data loss", "security"];
  const hasUrgency = urgencyKeywords.some(k => body.toLowerCase().includes(k) || subject.toLowerCase().includes(k));
  const isEnterprise = customer_plan === "enterprise" || customer_plan === "pro";

  let priority: string;
  if (hasUrgency && isEnterprise) priority = "p0";
  else if (hasUrgency) priority = "p1";
  else if (isEnterprise) priority = "p2";
  else priority = pick(["p2", "p3"], seed, 0);

  // Category detection
  const categoryMap: Record<string, string[]> = {
    billing: ["invoice", "charge", "payment", "subscription", "plan", "upgrade", "downgrade", "refund"],
    bug: ["error", "crash", "broken", "not working", "fail", "500", "404", "bug"],
    "feature-request": ["would be nice", "feature", "wish", "suggestion", "could you add", "request"],
    integration: ["slack", "api", "webhook", "zapier", "integration", "connect", "sync"],
    auth: ["login", "password", "sso", "saml", "access", "permission", "locked out"],
    onboarding: ["getting started", "setup", "new user", "first time", "how to", "tutorial"],
  };

  let detectedCategory = "general";
  let maxHits = 0;
  const combined = `${subject} ${body}`.toLowerCase();
  for (const [cat, keywords] of Object.entries(categoryMap)) {
    const hits = keywords.filter(k => combined.includes(k)).length;
    if (hits > maxHits) {
      maxHits = hits;
      detectedCategory = cat;
    }
  }

  // Sentiment analysis
  const negativeWords = ["frustrated", "angry", "terrible", "worst", "cancel", "leave", "disappointed", "unacceptable"];
  const positiveWords = ["love", "great", "thanks", "appreciate", "helpful", "amazing", "excellent"];
  const negHits = negativeWords.filter(w => combined.includes(w)).length;
  const posHits = positiveWords.filter(w => combined.includes(w)).length;
  const sentiment = negHits > posHits ? (negHits > 2 ? "angry" : "frustrated") : posHits > 0 ? "positive" : "neutral";

  // Suggested KB articles
  const relevantArticles = KB_ARTICLES
    .filter(a => combined.includes(a.category.toLowerCase()) || a.title.toLowerCase().split(" ").some(w => combined.includes(w)))
    .slice(0, 3);

  const confidence = rangeInt(72, 96, seed, 1);
  const suggestedTags = pickN(TAGS, rangeInt(1, 3, seed, 2), seed);

  let out = `## 🏷️ Ticket Triage\n\n`;
  out += `| Classification | Value | Confidence |\n`;
  out += `|---------------|-------|------------|\n`;
  out += `| **Priority** | ${PRIORITY_LABELS[priority]} | ${confidence}% |\n`;
  out += `| **Category** | ${detectedCategory} | ${rangeInt(75, 95, seed, 3)}% |\n`;
  out += `| **Sentiment** | ${SENTIMENT_LABELS[sentiment]} | ${rangeInt(70, 92, seed, 4)}% |\n`;
  out += `| **Tags** | ${suggestedTags.map(t => `\`${t}\``).join(", ")} | — |\n\n`;

  if (priority === "p0" || priority === "p1") {
    out += `### ⚠️ High Priority Alert\n`;
    out += `This ticket should be assigned to a senior agent immediately. `;
    if (isEnterprise) out += `Enterprise customer — SLA commitment active.\n\n`;
    else out += `Contains urgency signals.\n\n`;
  }

  out += `### Suggested Actions\n\n`;
  out += `1. ${priority === "p0" ? "Assign to senior agent NOW" : "Add to queue for next available agent"}\n`;
  out += `2. Apply tags: ${suggestedTags.map(t => `\`${t}\``).join(", ")}\n`;
  out += `3. ${sentiment === "angry" ? "Send empathy-first response before troubleshooting" : "Send acknowledgement with ETA"}\n`;
  if (relevantArticles.length > 0) {
    out += `4. Suggest KB articles:\n`;
    relevantArticles.forEach(a => { out += `   - "${a.title}" (${a.views.toLocaleString()} views)\n`; });
  }

  out += `\n*Use \`draft_response\` to generate an AI reply for this ticket.*\n`;
  out += FOOTER;
  return out;
}
