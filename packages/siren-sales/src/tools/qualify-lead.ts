import { z } from "zod";
import { hash, pick, pickN, rangeInt, rangeFloat, INDUSTRIES, PAIN_POINTS, BUYING_SIGNALS, CTA } from "../heuristics.js";

export const qualifyLeadSchema = {
  company_name: z.string().describe("Name of the company to qualify"),
  contact_name: z.string().describe("Name of the primary contact"),
  industry: z.string().describe("Industry vertical (e.g. SaaS, FinTech, HealthTech)"),
  company_size: z.string().describe("Employee headcount range (e.g. 50-200, 1000+)"),
  use_case: z.string().optional().describe("Known use case or pain point they mentioned"),
  annual_revenue: z.string().optional().describe("Estimated ARR or revenue range"),
};

export function qualifyLead(params: {
  company_name: string;
  contact_name: string;
  industry: string;
  company_size: string;
  use_case?: string;
  annual_revenue?: string;
}): string {
  const { company_name, contact_name, industry, company_size, use_case, annual_revenue } = params;
  const seed = `qualify:${company_name}:${contact_name}`;

  const fitScore = rangeInt(45, 97, seed, 1);
  const urgencyScore = rangeInt(30, 95, seed, 2);
  const budgetScore = rangeInt(40, 90, seed, 3);
  const authorityScore = rangeInt(35, 95, seed, 4);
  const needScore = rangeInt(50, 98, seed, 5);
  const overallScore = Math.round((fitScore + urgencyScore + budgetScore + authorityScore + needScore) / 5);

  const tier = overallScore >= 80 ? "A" : overallScore >= 65 ? "B" : overallScore >= 50 ? "C" : "D";
  const tierLabel = { A: "Hot — Prioritize immediately", B: "Warm — Active nurture", C: "Cool — Long-term nurture", D: "Cold — Deprioritize" }[tier];

  const industryKey = Object.keys(PAIN_POINTS).find(k => industry.toLowerCase().includes(k.toLowerCase())) || "default";
  const pains = pickN(PAIN_POINTS[industryKey] || PAIN_POINTS.default, 3, seed, 10);
  const signals = pickN(BUYING_SIGNALS, 3, seed, 20);

  const dealSize = annual_revenue
    ? `$${rangeInt(15, 80, seed, 30)}k`
    : company_size.includes("1000") ? `$${rangeInt(50, 150, seed, 30)}k` : `$${rangeInt(8, 45, seed, 30)}k`;

  const closeProb = rangeInt(15, 75, seed, 40);
  const daysToClose = rangeInt(14, 120, seed, 41);

  const nextSteps = [
    `Schedule discovery call with ${contact_name} this week`,
    `Send tailored case study for ${industry} use case`,
    `Loop in champion — identify economic buyer above ${contact_name}`,
    `Share ROI calculator pre-populated for ${company_size} company`,
  ];

  let out = `## Lead Qualification: ${company_name}\n\n`;
  out += `**Contact:** ${contact_name} | **Industry:** ${industry} | **Size:** ${company_size}\n\n`;

  out += `### BANT Score\n\n`;
  out += `| Dimension | Score | Signal |\n`;
  out += `|-----------|-------|--------|\n`;
  out += `| Budget | ${budgetScore}/100 | ${budgetScore > 70 ? "✅ Likely funded" : budgetScore > 50 ? "🟡 Needs validation" : "🔴 Budget unclear"} |\n`;
  out += `| Authority | ${authorityScore}/100 | ${authorityScore > 70 ? "✅ Decision maker" : authorityScore > 50 ? "🟡 Influencer — find buyer" : "🔴 Individual contributor"} |\n`;
  out += `| Need | ${needScore}/100 | ${needScore > 70 ? "✅ Acute pain" : needScore > 50 ? "🟡 Latent need" : "🔴 Need not confirmed"} |\n`;
  out += `| Timing | ${urgencyScore}/100 | ${urgencyScore > 70 ? "✅ Active initiative" : urgencyScore > 50 ? "🟡 Planning phase" : "🔴 No urgency"} |\n\n`;

  out += `### Overall Qualification\n\n`;
  out += `**ICP Fit Score:** ${fitScore}/100\n`;
  out += `**Lead Grade:** **${tier}** — ${tierLabel}\n`;
  out += `**Overall Score:** ${overallScore}/100\n\n`;

  out += `### Deal Economics\n\n`;
  out += `| Metric | Value |\n`;
  out += `|--------|-------|\n`;
  out += `| Estimated Deal Size | ${dealSize} |\n`;
  out += `| Close Probability | ${closeProb}% |\n`;
  out += `| Expected Days to Close | ${daysToClose} days |\n`;
  out += `| Weighted Pipeline Value | $${Math.round(parseInt(dealSize.replace(/[$k]/g, "")) * closeProb / 100 * 1000).toLocaleString()} |\n\n`;

  out += `### Identified Pain Points\n\n`;
  pains.forEach(p => { out += `- ${p}\n`; });
  if (use_case) out += `- ${use_case} *(explicitly stated)*\n`;
  out += "\n";

  out += `### Buying Signals Detected\n\n`;
  signals.forEach(s => { out += `- ${s}\n`; });
  out += "\n";

  out += `### Recommended Next Steps\n\n`;
  nextSteps.forEach((s, i) => { out += `${i + 1}. ${s}\n`; });

  out += CTA;
  return out;
}
