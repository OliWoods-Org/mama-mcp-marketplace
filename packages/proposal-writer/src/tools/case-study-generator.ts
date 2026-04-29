import { z } from "zod";
import { pick, pickN, rangeInt, rangeFloat, INDUSTRIES, SERVICE_TYPES, FOOTER } from "../heuristics.js";

export const caseStudyGeneratorSchema = {
  client_name: z.string().describe("Client name (or anonymized, e.g. 'Fortune 500 Retailer')"),
  industry: z.string().describe("Client industry"),
  service_delivered: z.string().describe("Service or solution you delivered"),
  challenge: z.string().describe("The challenge the client faced before working with you"),
  approach: z.string().describe("Your approach or solution"),
  result_1: z.string().describe("Primary measurable result (e.g. '47% increase in conversion rate')"),
  result_2: z.string().optional().describe("Secondary measurable result"),
  result_3: z.string().optional().describe("Tertiary measurable result"),
  timeframe: z.string().describe("Time to achieve results (e.g. '90 days', '6 months')"),
  testimonial: z.string().optional().describe("Client testimonial or quote"),
};

export function caseStudyGenerator(params: {
  client_name: string;
  industry: string;
  service_delivered: string;
  challenge: string;
  approach: string;
  result_1: string;
  result_2?: string;
  result_3?: string;
  timeframe: string;
  testimonial?: string;
}): string {
  const { client_name, industry, service_delivered, challenge, approach, result_1, result_2, result_3, timeframe, testimonial } = params;
  const seed = `case:${client_name}:${service_delivered}`;

  const results = [result_1, result_2, result_3].filter(Boolean) as string[];

  const heroStats = results.slice(0, 2).map((r, i) => {
    const num = r.match(/\d+/)?.[0] ?? String(rangeInt(20, 80, seed, i));
    const unit = r.includes("%") ? "%" : r.includes("x") ? "x" : "";
    const label = r.replace(/\d+[%x]?\s*/i, "").trim() || pick(["lift", "improvement", "increase"], seed, i + 5);
    return { num: num + unit, label };
  });

  const executiveSummaryOptions = [
    `${client_name} partnered with us to solve ${challenge.toLowerCase()}. Through ${approach.toLowerCase()}, they achieved ${result_1} in just ${timeframe}.`,
    `When ${client_name} came to us, ${challenge.toLowerCase()}. We deployed ${approach.toLowerCase()} and delivered ${result_1} within ${timeframe}.`,
    `In ${timeframe}, ${client_name} went from ${challenge.toLowerCase().split(".")[0]} to ${result_1} — using our ${service_delivered.toLowerCase()} approach.`,
  ];

  const sectionFrameworks = [
    { section: "The Situation", content: `${client_name} is a ${industry} company that ${pick(["was experiencing rapid growth", "faced increasing competition", "needed to modernize operations", "was losing market share"], seed, 10)}. ${challenge}` },
    { section: "The Complication", content: `${pick(["Previous attempts to solve this had failed.", "Internal teams lacked the bandwidth and expertise.", "The status quo was costing them time and revenue.", "Competitive pressure made this urgent."], seed, 11)} Without intervention, ${pick(["the problem would compound", "they risked losing key accounts", "team morale and efficiency would continue to decline"], seed, 12)}.` },
    { section: "The Solution", content: `We ${approach.toLowerCase()}. Our process included: (1) deep discovery and stakeholder alignment, (2) custom strategy development, (3) phased implementation with weekly checkpoints, and (4) performance optimization based on real-time data.` },
    { section: "The Results", content: results.map((r) => `- **${r}** within ${timeframe}`).join("\n") },
  ];

  const useCases = pickN([
    "Use in proposal introductions for similar industries",
    "Feature on website case studies page",
    "Include in sales deck as social proof slide",
    "Submit to industry awards or publications",
    "Reference in cold outreach emails",
    "Post as LinkedIn article with data visualization",
  ], 4, seed + "uses");

  let out = `## Case Study: ${client_name}\n\n`;
  out += `**Industry:** ${industry} | **Service:** ${service_delivered} | **Timeframe:** ${timeframe}\n\n`;

  if (heroStats.length > 0) {
    out += `### Results at a Glance\n\n`;
    out += `| `;
    heroStats.forEach((s) => { out += `${s.num} | `; });
    out += `\n| `;
    heroStats.forEach(() => { out += `--- | `; });
    out += `\n| `;
    heroStats.forEach((s) => { out += `${s.label} | `; });
    out += `\n\n`;
  }

  out += `### Executive Summary\n\n`;
  out += `${pick(executiveSummaryOptions, seed, 20)}\n\n`;

  sectionFrameworks.forEach((sf) => {
    out += `### ${sf.section}\n\n${sf.content}\n\n`;
  });

  if (testimonial) {
    out += `### Client Testimonial\n\n`;
    out += `> "${testimonial}"\n\n`;
    out += `— *${pick(["CEO", "VP of Operations", "CMO", "Head of Product", "CTO"], seed, 30)}, ${client_name}*\n\n`;
  }

  out += `### Key Takeaways\n\n`;
  const takeaways = [
    `${service_delivered} delivered ${results[0]} in a ${timeframe} window`,
    `${pick(["Stakeholder buy-in", "Data-driven iteration", "Clear success metrics", "Weekly accountability reviews"], seed, 40)} was critical to the outcome`,
    `${industry} companies with similar challenges can expect comparable results`,
  ];
  takeaways.forEach((t) => { out += `- ${t}\n`; });
  out += `\n`;

  out += `### How to Use This Case Study\n\n`;
  useCases.forEach((u) => { out += `- ${u}\n`; });
  out += FOOTER;
  return out;
}
