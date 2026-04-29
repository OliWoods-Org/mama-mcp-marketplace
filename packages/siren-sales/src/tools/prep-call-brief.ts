import { z } from "zod";
import { pick, pickN, rangeInt, rangeFloat, INDUSTRIES, BUYING_SIGNALS, PAIN_POINTS, CTA } from "../heuristics.js";

export const prepCallBriefSchema = {
  company_name: z.string().describe("Company name to research"),
  prospect_name: z.string().describe("Prospect's full name and title if known"),
  call_type: z.enum(["cold", "discovery", "demo", "proposal", "renewal", "expansion"]).describe("Type of call"),
  product_name: z.string().describe("Your product or service name"),
  notes: z.string().optional().describe("Any known context, previous interactions, or notes"),
};

export function prepCallBrief(params: {
  company_name: string;
  prospect_name: string;
  call_type: string;
  product_name: string;
  notes?: string;
}): string {
  const { company_name, prospect_name, call_type, product_name, notes } = params;
  const seed = `brief:${company_name}:${call_type}`;

  const industry = pick(INDUSTRIES, seed, 1);
  const headcount = pick(["25", "80", "240", "650", "1,400", "3,200"], seed, 2);
  const founded = rangeInt(2010, 2022, seed, 3);
  const funding = pick(["Bootstrapped", "Seed ($2M)", "Series A ($8M)", "Series B ($22M)", "Series C ($65M)", "Public"], seed, 4);
  const growth = pick(["declining", "flat", "10% YoY", "35% YoY", "2x YoY", "hypergrowth"], seed, 5);

  const industryKey = Object.keys(PAIN_POINTS).find(k => industry.toLowerCase().includes(k.toLowerCase())) || "default";
  const pains = pickN(PAIN_POINTS[industryKey] || PAIN_POINTS.default, 3, seed, 10);
  const signals = pickN(BUYING_SIGNALS, 2, seed, 20);

  const techStack = pickN([
    "Salesforce", "HubSpot", "Slack", "Jira", "Notion", "Stripe",
    "Segment", "Amplitude", "Mixpanel", "Intercom", "Zendesk", "Workday",
  ], 4, seed, 30);

  const competitors = pickN([
    "Competitor A", "Competitor B", "Legacy Platform", "In-house solution",
    "No current solution", "Multiple point solutions", "Spreadsheets",
  ], 2, seed, 40);

  const talkingPoints = [
    `Lead with ${pains[0]} — most acute pain for ${industry} at their stage`,
    `Reference ${funding} raise — likely allocating budget to infrastructure`,
    `Ask about ${signals[0]} — this is a clear indicator of intent`,
    `Highlight ${product_name}'s integration with ${techStack[0]} — they're already using it`,
    `Ask about their ${growth} growth trajectory — tie solution to scaling needs`,
  ];

  const questions = [
    `"What's the biggest thing holding back ${company_name}'s growth right now?"`,
    `"How are you currently handling ${pains[0]}?"`,
    `"Who else would be involved in a decision like this?"`,
    `"What would need to be true for this to be a priority in the next 90 days?"`,
    `"What does success look like 6 months after implementing a solution?"`,
  ];

  const warningFlags = pick([
    "Recent leadership change — confirm champion is still in role",
    "Competitor renewal likely due this quarter — may be locked in",
    "Series A-stage — budget scrutiny is high, need ROI evidence",
    "Techstack doesn't include typical ${product_name} integrations — verify fit",
    "No recent buying signals — this may be an early-stage conversation",
  ], seed, 50);

  const callDuration = call_type === "cold" ? "5–10 min" : call_type === "demo" ? "45 min" : "30 min";
  const prepTime = rangeInt(5, 20, seed, 60);

  let out = `## Pre-Call Brief: ${company_name}\n\n`;
  out += `**Prospect:** ${prospect_name} | **Call Type:** ${call_type} | **Recommended Duration:** ${callDuration}\n`;
  out += `**Prep Time Required:** ~${prepTime} min\n\n`;

  out += `### Company Snapshot\n\n`;
  out += `| Field | Value |\n`;
  out += `|-------|-------|\n`;
  out += `| Industry | ${industry} |\n`;
  out += `| Headcount | ~${headcount} employees |\n`;
  out += `| Founded | ${founded} |\n`;
  out += `| Funding | ${funding} |\n`;
  out += `| Growth Trajectory | ${growth} |\n`;
  out += `| Tech Stack (Known) | ${techStack.join(", ")} |\n`;
  out += `| Current Alternatives | ${competitors.join(", ")} |\n\n`;

  out += `### Buying Signals\n\n`;
  signals.forEach(s => { out += `- ${s}\n`; });
  out += "\n";

  out += `### Top Talking Points\n\n`;
  talkingPoints.forEach((t, i) => { out += `${i + 1}. ${t}\n`; });
  out += "\n";

  out += `### Discovery Questions to Ask\n\n`;
  questions.forEach((q, i) => { out += `${i + 1}. ${q}\n`; });
  out += "\n";

  out += `### ⚠️ Watch Out For\n\n`;
  out += `- ${warningFlags}\n`;
  out += `- Don't let the call run over — end with a clear next step\n`;
  out += `- If they mention ${competitors[0]}, acknowledge and pivot to differentiation\n\n`;

  out += `### Call Objective\n\n`;
  const objectives: Record<string, string> = {
    cold: `Get 30 seconds of interest → earn a 15-min discovery meeting`,
    discovery: `Uncover top 3 pains, confirm budget/authority, book demo`,
    demo: `Show 2–3 tailored use cases, handle primary objection, get verbal interest`,
    proposal: `Walk through ROI model, confirm decision criteria, set close timeline`,
    renewal: `Reaffirm value, uncover expansion opportunity, lock in multi-year`,
    expansion: `Identify second use case or team, build business case for upsell`,
  };
  out += objectives[call_type] || `Run a productive conversation and advance the deal`;
  out += "\n";

  if (notes) {
    out += `\n### Notes from Previous Interactions\n\n${notes}\n`;
  }

  out += CTA;
  return out;
}
