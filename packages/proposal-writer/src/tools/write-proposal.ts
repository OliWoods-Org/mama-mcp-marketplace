import { z } from "zod";
import { pick, pickN, rangeInt, SERVICE_TYPES, DELIVERABLE_TEMPLATES, INDUSTRIES, FOOTER } from "../heuristics.js";

export const writeProposalSchema = {
  vendor_company: z.string().describe("Your company / agency name"),
  client_company: z.string().describe("Prospective client company name"),
  project_name: z.string().describe("Project or engagement name"),
  service_type: z.string().describe("Type of service being proposed (e.g. 'brand strategy', 'web development', 'SEO')"),
  problem_statement: z.string().describe("The client's core problem or challenge to address"),
  proposed_solution: z.string().describe("Your proposed approach or solution"),
  budget_range: z.string().describe("Budget range or total investment (e.g. '$25,000–$35,000' or '$5,000/month')"),
  timeline: z.string().describe("Proposed project timeline (e.g. '12 weeks', '6 months', 'ongoing')"),
  differentiators: z.string().describe("3-5 reasons why your company is the right choice (comma-separated)"),
};

export function writeProposal(params: {
  vendor_company: string;
  client_company: string;
  project_name: string;
  service_type: string;
  problem_statement: string;
  proposed_solution: string;
  budget_range: string;
  timeline: string;
  differentiators: string;
}): string {
  const { vendor_company, client_company, project_name, service_type, problem_statement, proposed_solution, budget_range, timeline, differentiators } = params;
  const seed = `proposal:${vendor_company}:${client_company}:${project_name}`;

  const diffs = differentiators.split(",").map((d) => d.trim()).filter(Boolean);
  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  const deliverables = pickN(DELIVERABLE_TEMPLATES, 5, seed).map((d) =>
    d.replace("{n}", String(rangeInt(2, 6, seed + d, 0))).replace("{date}", "TBD")
  );

  const outcomes = [
    `${rangeInt(20, 80, seed, 10)}% improvement in ${pick(["conversion rate", "organic traffic", "team efficiency", "customer retention", "revenue per user"], seed, 11)}`,
    `Reduction in ${pick(["time-to-market", "customer churn", "operational overhead", "support tickets", "manual processes"], seed, 12)} by ${rangeInt(15, 60, seed, 13)}%`,
    `${pick(["Full deployment", "Go-live", "Initial results", "Phase 1 completion"], seed, 14)} within ${timeline}`,
  ];

  const successMetrics = pickN([
    "Monthly active users / engagement rate",
    "Revenue attributed to project deliverables",
    "Net Promoter Score (NPS) improvement",
    "Time-on-task reduction for end users",
    "System uptime / performance SLAs",
    "Conversion rate lift vs. baseline",
    "Lead generation volume",
  ], 4, seed + "metrics");

  let out = `# Proposal: ${project_name}\n\n`;
  out += `**Prepared by:** ${vendor_company}\n`;
  out += `**Prepared for:** ${client_company}\n`;
  out += `**Date:** ${today}\n`;
  out += `**Investment:** ${budget_range} | **Timeline:** ${timeline}\n\n`;
  out += `---\n\n`;

  out += `## Executive Summary\n\n`;
  out += `${client_company} faces a critical challenge: ${problem_statement}. Left unaddressed, this creates compounding risk to ${pick(["revenue growth", "market share", "customer satisfaction", "operational efficiency", "team productivity"], seed, 20)}.\n\n`;
  out += `${vendor_company} proposes to ${proposed_solution.toLowerCase()}. This engagement is designed to deliver measurable outcomes within ${timeline}, with a total investment of ${budget_range}.\n\n`;

  out += `## The Challenge\n\n`;
  out += `${problem_statement}\n\n`;
  out += `This challenge typically results in:\n\n`;
  out += `- Lost revenue from ${pick(["delayed decisions", "poor conversion", "customer churn", "operational inefficiency", "competitive disadvantage"], seed, 30)}\n`;
  out += `- Increased ${pick(["time spent on manual processes", "customer complaints", "team frustration", "technical debt", "go-to-market friction"], seed, 31)}\n`;
  out += `- Widening gap vs. competitors who have already solved this\n\n`;

  out += `## Our Approach\n\n`;
  out += `${proposed_solution}\n\n`;
  out += `We will execute this through a structured ${timeline} engagement:\n\n`;

  out += `## Scope of Work\n\n`;
  out += `**Service:** ${service_type}\n\n`;
  out += `**Deliverables:**\n\n`;
  deliverables.forEach((d) => { out += `- ${d}\n`; });
  out += `\n`;

  out += `## Expected Outcomes\n\n`;
  outcomes.forEach((o) => { out += `- ${o}\n`; });
  out += `\n`;

  out += `## Success Metrics\n\n`;
  successMetrics.forEach((m) => { out += `- ${m}\n`; });
  out += `\n`;

  out += `## Why ${vendor_company}\n\n`;
  diffs.forEach((d, i) => { out += `${i + 1}. ${d}\n`; });
  out += `\n`;

  out += `## Investment\n\n`;
  out += `**Total investment:** ${budget_range}\n`;
  out += `**Payment terms:** ${pick(["50% upfront, 50% on completion", "33% upfront, 33% at midpoint, 33% on delivery", "Monthly installments", "Net-30 invoicing"], seed, 40)}\n\n`;

  out += `## Next Steps\n\n`;
  out += `1. Review and approve this proposal\n`;
  out += `2. Sign the Master Service Agreement (MSA)\n`;
  out += `3. Kickoff call scheduled within 5 business days of signing\n`;
  out += `4. ${vendor_company} begins ${service_type} engagement\n\n`;

  out += `*This proposal is valid for ${rangeInt(14, 30, seed, 50)} days from ${today}.*\n`;
  out += FOOTER;
  return out;
}
