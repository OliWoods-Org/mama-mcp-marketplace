import { z } from "zod";
import { hash, rangeInt, rangeFloat, TAGS, FOOTER } from "../heuristics.js";

export const supportMetricsSchema = {
  timeframe: z.enum(["today", "7d", "30d", "90d"]).default("7d").describe("Metrics timeframe"),
  team: z.string().optional().describe("Filter by team (e.g. 'billing', 'technical', 'enterprise')"),
};

export function supportMetrics(params: { timeframe: string; team?: string }): string {
  const { timeframe, team } = params;
  const seed = `metrics:${timeframe}:${team || "all"}`;

  const totalConversations = rangeInt(150, 2500, seed, 0);
  const resolved = Math.round(totalConversations * rangeFloat(0.7, 0.92, seed, 1));
  const open = totalConversations - resolved;
  const medianFirstResponse = rangeInt(3, 45, seed, 2);
  const medianResolution = rangeFloat(1.5, 24, seed, 3);
  const csat = rangeFloat(78, 96, seed, 4);
  const nps = rangeInt(15, 72, seed, 5);

  let out = `## 📊 Support Metrics (${timeframe}${team ? ` — ${team} team` : ""})\n\n`;

  out += `### Key Metrics\n\n`;
  out += `| Metric | Value | Trend |\n`;
  out += `|--------|-------|-------|\n`;
  out += `| **Total Conversations** | ${totalConversations.toLocaleString()} | ${rangeInt(-5, 15, seed, 10) > 0 ? "📈" : "📉"} |\n`;
  out += `| **Resolved** | ${resolved.toLocaleString()} (${(resolved / totalConversations * 100).toFixed(0)}%) | ${rangeInt(-3, 8, seed, 11) > 0 ? "📈" : "📉"} |\n`;
  out += `| **Open** | ${open.toLocaleString()} | — |\n`;
  out += `| **Median First Response** | ${medianFirstResponse} min | ${medianFirstResponse < 15 ? "✅" : "⚠️"} |\n`;
  out += `| **Median Resolution** | ${medianResolution.toFixed(1)} hrs | ${medianResolution < 8 ? "✅" : "⚠️"} |\n`;
  out += `| **CSAT** | ${csat.toFixed(1)}% | ${csat > 90 ? "⭐" : csat > 80 ? "✅" : "⚠️"} |\n`;
  out += `| **NPS** | ${nps} | ${nps > 50 ? "⭐" : nps > 30 ? "✅" : "⚠️"} |\n\n`;

  out += `### Volume by Category\n\n`;
  out += `| Category | Volume | % of Total | Avg Resolution |\n`;
  out += `|----------|--------|------------|----------------|\n`;
  const categories = ["billing", "bug", "feature-request", "integration", "auth", "onboarding", "general"];
  let remaining = totalConversations;
  categories.forEach((cat, i) => {
    const vol = i < categories.length - 1 ? rangeInt(20, Math.round(remaining * 0.4), seed, 20 + i) : remaining;
    remaining -= vol;
    const avgRes = rangeFloat(0.5, 18, seed, 30 + i);
    out += `| ${cat} | ${vol} | ${(vol / totalConversations * 100).toFixed(0)}% | ${avgRes.toFixed(1)}h |\n`;
  });

  out += `\n### SLA Compliance\n\n`;
  const slaP0 = rangeInt(85, 100, seed, 40);
  const slaP1 = rangeInt(80, 99, seed, 41);
  const slaP2 = rangeInt(75, 98, seed, 42);
  out += `| Priority | Target | Actual | Status |\n`;
  out += `|----------|--------|--------|--------|\n`;
  out += `| P0 (1h) | 95% | ${slaP0}% | ${slaP0 >= 95 ? "✅" : "❌"} |\n`;
  out += `| P1 (4h) | 90% | ${slaP1}% | ${slaP1 >= 90 ? "✅" : "❌"} |\n`;
  out += `| P2 (24h) | 85% | ${slaP2}% | ${slaP2 >= 85 ? "✅" : "❌"} |\n\n`;

  out += `### AI Performance\n\n`;
  const aiDrafted = rangeInt(30, 70, seed, 50);
  const aiAccepted = rangeInt(60, 88, seed, 51);
  const aiDeflected = rangeInt(15, 40, seed, 52);
  out += `- **AI-drafted responses:** ${aiDrafted}% of all replies\n`;
  out += `- **AI acceptance rate:** ${aiAccepted}% (sent without major edits)\n`;
  out += `- **KB deflection rate:** ${aiDeflected}% (resolved via self-service)\n`;
  out += `- **Estimated time saved:** ${rangeInt(20, 120, seed, 53)} agent-hours this period\n`;
  out += FOOTER;
  return out;
}

export const customerHealthSchema = {
  company: z.string().describe("Company name to check health score"),
};

export function customerHealth(params: { company: string }): string {
  const { company } = params;
  const seed = `health:${company}`;

  const healthScore = rangeInt(30, 98, seed, 0);
  const ticketsLast30 = rangeInt(0, 25, seed, 1);
  const avgSentiment = rangeFloat(2.5, 4.8, seed, 2);
  const lastLogin = rangeInt(0, 30, seed, 3);
  const featureAdoption = rangeInt(20, 95, seed, 4);
  const nps = rangeInt(-20, 80, seed, 5);
  const mrr = [29, 79, 149, 299, 599, 1499][hash(seed) % 6];
  const churnRisk = healthScore < 50 ? "High" : healthScore < 75 ? "Medium" : "Low";

  let out = `## 🏥 Customer Health: ${company}\n\n`;
  out += `| Metric | Value |\n`;
  out += `|--------|-------|\n`;
  out += `| **Health Score** | ${healthScore}/100 ${healthScore > 80 ? "🟢" : healthScore > 50 ? "🟡" : "🔴"} |\n`;
  out += `| **MRR** | $${mrr}/mo |\n`;
  out += `| **Churn Risk** | ${churnRisk} ${churnRisk === "High" ? "🔴" : churnRisk === "Medium" ? "🟡" : "🟢"} |\n`;
  out += `| **Tickets (30d)** | ${ticketsLast30} |\n`;
  out += `| **Avg Sentiment** | ${avgSentiment.toFixed(1)}/5.0 |\n`;
  out += `| **Last Login** | ${lastLogin === 0 ? "Today" : `${lastLogin} days ago`} |\n`;
  out += `| **Feature Adoption** | ${featureAdoption}% |\n`;
  out += `| **NPS** | ${nps} |\n\n`;

  out += `### Recommendations\n\n`;
  if (healthScore < 50) {
    out += `⚠️ **At-risk account.** Schedule a check-in call immediately.\n`;
    out += `- ${ticketsLast30 > 10 ? "High ticket volume suggests unresolved frustration" : "Low engagement may indicate they're evaluating alternatives"}\n`;
    out += `- Consider offering: dedicated CSM, training session, or plan credit\n`;
  } else if (healthScore < 75) {
    out += `🟡 **Monitor closely.** This account has room for improvement.\n`;
    out += `- Feature adoption at ${featureAdoption}% — send targeted onboarding for unused features\n`;
    out += `- ${avgSentiment < 3.5 ? "Recent sentiment dip — review latest tickets for themes" : "Sentiment is stable"}\n`;
  } else {
    out += `✅ **Healthy account.** Strong engagement and satisfaction.\n`;
    out += `- Good candidate for: case study, referral, or upsell to next tier\n`;
    out += `- Feature adoption at ${featureAdoption}% — ${featureAdoption > 80 ? "power user, consider beta program" : "room to unlock more value"}\n`;
  }
  out += FOOTER;
  return out;
}
