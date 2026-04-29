import { z } from "zod";
import { pick, rangeInt, PAIN_POINTS, CTA } from "../heuristics.js";

export const writeCallScriptSchema = {
  prospect_name: z.string().describe("Prospect's first name"),
  company_name: z.string().describe("Prospect's company name"),
  industry: z.string().describe("Prospect's industry"),
  product_name: z.string().describe("Your product or service name"),
  call_goal: z.enum(["discovery", "demo", "proposal", "close", "followup"]).describe("Goal of this call"),
  known_pain: z.string().optional().describe("Known pain point or trigger event"),
};

export function writeCallScript(params: {
  prospect_name: string;
  company_name: string;
  industry: string;
  product_name: string;
  call_goal: string;
  known_pain?: string;
}): string {
  const { prospect_name, company_name, industry, product_name, call_goal, known_pain } = params;
  const seed = `script:${company_name}:${call_goal}`;

  const industryKey = Object.keys(PAIN_POINTS).find(k => industry.toLowerCase().includes(k.toLowerCase())) || "default";
  const pains = PAIN_POINTS[industryKey] || PAIN_POINTS.default;
  const primaryPain = known_pain || pick(pains, seed, 1);
  const secondaryPain = pick(pains.filter(p => p !== primaryPain), seed, 2);

  const talkTimeTarget = rangeInt(12, 25, seed, 3);
  const talkListenRatio = rangeInt(35, 50, seed, 4);

  const goalConfig: Record<string, { opener: string; objective: string; close: string }> = {
    discovery: {
      opener: `Hi ${prospect_name}, this is [Your Name] from ${product_name}. I know I'm catching you cold — I'll keep this to 2 minutes. Is now okay?`,
      objective: "Uncover top 3 pain points, confirm ICP fit, book a 30-min deep-dive",
      close: `Based on what you've shared, I think there's a real fit here. What does your calendar look like for a 30-minute deep dive? I can send a calendar link right now.`,
    },
    demo: {
      opener: `${prospect_name}, great to connect. Before I show you the product, I want to make sure I'm showing you what matters most to you. Can I ask 2 quick questions?`,
      objective: "Show 3 tailored use cases, handle top objection, book follow-up with decision maker",
      close: `What I showed you today maps directly to ${primaryPain}. On a scale of 1–10, how relevant was this to your situation? ... What would make it a 10?`,
    },
    proposal: {
      opener: `${prospect_name}, thanks for making time. I've put together a proposal specifically for ${company_name}. Walk me through your top priority before I present?`,
      objective: "Present ROI-anchored proposal, confirm decision process, set timeline",
      close: `Given everything, does the investment make sense relative to the cost of ${primaryPain} continuing? What's your decision process look like from here?`,
    },
    close: {
      opener: `${prospect_name}, I wanted to circle back personally. I think we've established a clear fit — I want to make sure we can get this moving before [end of period].`,
      objective: "Remove final blockers, get verbal commit, agree on contract and signature date",
      close: `If I can get you the agreement today, can you commit to signing by [date]? What would stop that from happening?`,
    },
    followup: {
      opener: `Hi ${prospect_name}, following up on our last conversation. You mentioned ${primaryPain} was top of mind — I've been thinking about it and wanted to share something specific.`,
      objective: "Re-establish momentum, surface new information, book next step",
      close: `Has anything changed on your end since we last spoke? I'd love to find 20 minutes to reconnect.`,
    },
  };

  const config = goalConfig[call_goal] || goalConfig.discovery;

  const discoveryQuestions = [
    `Walk me through how you're currently handling ${primaryPain} today.`,
    `What's the biggest cost of that problem — time, revenue, or something else?`,
    `If you could wave a magic wand and fix one thing in your workflow, what would it be?`,
    `Who else feels the pain of ${secondaryPain} on your team?`,
    `What's driven the urgency to look at this now vs. 6 months ago?`,
    `What would success look like 90 days after implementing a solution?`,
  ];

  const talkTrack = [
    `"We work with a lot of ${industry} companies around your size."`,
    `"The #1 thing they come to us with is ${primaryPain}."`,
    `"[Customer name] reduced that by 40% in their first 90 days."`,
    `"The reason that works is [mechanism] — which maps directly to ${company_name}'s situation."`,
  ];

  let out = `## Call Script: ${call_goal.charAt(0).toUpperCase() + call_goal.slice(1)} Call — ${company_name}\n\n`;
  out += `**Prospect:** ${prospect_name} at ${company_name} | **Product:** ${product_name}\n`;
  out += `**Target Talk Time:** ${talkTimeTarget} min | **Talk/Listen Ratio:** ${talkListenRatio}/${100 - talkListenRatio}\n\n`;

  out += `### Objective\n\n${config.objective}\n\n`;

  out += `### Opening (First 30 Seconds)\n\n`;
  out += `> ${config.opener}\n\n`;

  out += `### Discovery Questions\n\n`;
  discoveryQuestions.forEach((q, i) => { out += `${i + 1}. ${q}\n`; });
  out += "\n";

  out += `### Core Talk Track\n\n`;
  talkTrack.forEach(t => { out += `- ${t}\n`; });
  out += "\n";

  out += `### Transition to Pitch\n\n`;
  out += `> "Based on what you've shared — especially around ${primaryPain} — let me show you exactly how ${product_name} addresses that..."\n\n`;

  out += `### Value Proposition (Tailor to ${industry})\n\n`;
  out += `- **Problem:** ${primaryPain}\n`;
  out += `- **Cost of inaction:** [Quantify with prospect's numbers from discovery]\n`;
  out += `- **Our solution:** [3-sentence explanation tied to their exact language]\n`;
  out += `- **Proof:** [Relevant case study or metric]\n\n`;

  out += `### Closing\n\n`;
  out += `> ${config.close}\n\n`;

  out += `### Common Landmines to Avoid\n\n`;
  out += `- Don't pitch before you've listened for at least 5 minutes\n`;
  out += `- Don't say "Does that make sense?" — use "What questions do you have?"\n`;
  out += `- Don't let the call end without a concrete next step on the calendar\n`;
  out += `- Don't bad-mouth competitors — pivot to differentiation\n`;

  out += CTA;
  return out;
}
