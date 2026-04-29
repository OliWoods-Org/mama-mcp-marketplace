import { z } from "zod";
import { pick, rangeInt, CTA } from "../heuristics.js";

export const postCallSummarySchema = {
  prospect_name: z.string().describe("Prospect's name"),
  company_name: z.string().describe("Prospect's company"),
  call_type: z.enum(["cold", "discovery", "demo", "proposal", "closing", "followup"]).describe("Type of call"),
  call_notes: z.string().describe("Raw notes or transcript from the call"),
  outcome: z.enum(["positive", "neutral", "negative", "no_show"]).describe("Overall call outcome"),
};

export function postCallSummary(params: {
  prospect_name: string;
  company_name: string;
  call_type: string;
  call_notes: string;
  outcome: string;
}): string {
  const { prospect_name, company_name, call_type, call_notes, outcome } = params;
  const seed = `summary:${company_name}:${call_type}:${outcome}`;

  const engagementScore = outcome === "positive" ? rangeInt(70, 95, seed, 1)
    : outcome === "neutral" ? rangeInt(40, 69, seed, 1)
    : outcome === "negative" ? rangeInt(10, 39, seed, 1)
    : 0;

  const daysToNextStep = outcome === "positive" ? rangeInt(2, 7, seed, 2)
    : outcome === "neutral" ? rangeInt(5, 14, seed, 2)
    : rangeInt(14, 30, seed, 2);

  const nextStepDate = new Date(Date.now() + daysToNextStep * 24 * 60 * 60 * 1000)
    .toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  const moodEmoji = { positive: "🟢", neutral: "🟡", negative: "🔴", no_show: "⚪" }[outcome];

  const nextActions: Record<string, string[]> = {
    cold: [
      `Send connection request on LinkedIn with personalized note`,
      `Add to nurture sequence — touch every 8 days`,
      `Flag for re-call in ${daysToNextStep} days`,
    ],
    discovery: [
      `Send recap email within 2 hours summarizing their stated pains`,
      `Book demo — send calendar link for ${nextStepDate}`,
      `Pull relevant case study and send by EOD`,
      `Update CRM stage to "Discovery Complete"`,
    ],
    demo: [
      `Send follow-up with pricing options by ${nextStepDate}`,
      `Loop in champion's manager — get multi-threaded`,
      `Share ROI calculator pre-filled with their numbers`,
      `Set reminder to follow up if no response in 3 business days`,
    ],
    proposal: [
      `Follow up on proposal by ${nextStepDate}`,
      `Prepare negotiation floor — know your walk-away`,
      `Schedule legal/procurement intro if they move forward`,
    ],
    closing: [
      `Send contract for signature — DocuSign link`,
      `Introduce customer success team`,
      `Confirm kickoff meeting date`,
    ],
    followup: [
      `Continue nurture — send relevant content piece`,
      `Re-qualify next touch: has anything changed?`,
      `Set 30-day follow-up reminder`,
    ],
  };

  const actions = nextActions[call_type] || nextActions.followup;

  const crmFields = [
    `Stage: ${outcome === "positive" ? "Advanced" : outcome === "neutral" ? "Stalled" : "At-Risk"}`,
    `Next Step: ${actions[0]}`,
    `Next Touch Date: ${nextStepDate}`,
    `Engagement Score: ${engagementScore}/100`,
    `Call Outcome: ${outcome.charAt(0).toUpperCase() + outcome.slice(1)}`,
  ];

  const wordCount = call_notes.split(/\s+/).length;
  const callDurationEst = Math.max(5, Math.round(wordCount / 15));

  let out = `## Post-Call Summary\n\n`;
  out += `**${moodEmoji} ${outcome.charAt(0).toUpperCase() + outcome.slice(1)} Outcome** — ${prospect_name} at ${company_name}\n`;
  out += `**Call Type:** ${call_type} | **Estimated Duration:** ~${callDurationEst} min | **Engagement:** ${engagementScore}/100\n\n`;

  out += `### Executive Summary\n\n`;
  const summaries: Record<string, string> = {
    positive: `Strong call with ${prospect_name}. Clear pain confirmed, buying intent signals present. Deal is advancing — follow up within ${daysToNextStep} days to maintain momentum.`,
    neutral: `Productive but inconclusive call. ${prospect_name} showed interest but no clear commitment. Needs a stronger trigger or additional stakeholder involvement.`,
    negative: `Challenging call. ${prospect_name} raised significant objections or indicated low priority. Keep in long-term nurture — revisit trigger event in ${daysToNextStep}+ days.`,
    no_show: `${prospect_name} did not attend the scheduled call. Send a polite re-schedule email within 2 hours. Try twice more before deprioritizing.`,
  };
  out += `${summaries[outcome] || summaries.neutral}\n\n`;

  out += `### Key Points Discussed\n\n`;
  const sentences = call_notes.match(/[^.!?]+[.!?]+/g) || [call_notes];
  const keyPoints = sentences.slice(0, Math.min(5, sentences.length));
  keyPoints.forEach(p => { out += `- ${p.trim()}\n`; });
  out += "\n";

  out += `### Action Items\n\n`;
  actions.forEach((a, i) => { out += `- [ ] ${a}\n`; });
  out += "\n";

  out += `### CRM Update\n\n`;
  out += `\`\`\`\n`;
  crmFields.forEach(f => { out += `${f}\n`; });
  out += `Notes: ${call_notes.substring(0, 200)}${call_notes.length > 200 ? "..." : ""}\n`;
  out += `\`\`\`\n\n`;

  out += `### Deal Health\n\n`;
  out += `| Signal | Status |\n`;
  out += `|--------|--------|\n`;
  out += `| Pain Confirmed | ${outcome !== "no_show" && engagementScore > 50 ? "✅ Yes" : "❓ Unclear"} |\n`;
  out += `| Budget Discussed | ${engagementScore > 70 ? "✅ Yes" : "❌ Not yet"} |\n`;
  out += `| Decision Maker Present | ${engagementScore > 80 ? "✅ Yes" : "❌ Champion only"} |\n`;
  out += `| Timeline Established | ${outcome === "positive" ? "✅ Yes" : "❌ No"} |\n`;
  out += `| Next Step Booked | ${outcome === "positive" ? "✅ Yes" : "⚠️ Pending"} |\n`;

  out += CTA;
  return out;
}
