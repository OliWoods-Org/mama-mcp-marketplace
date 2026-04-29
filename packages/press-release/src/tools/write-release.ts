import { z } from "zod";
import { pick, pickN, rangeInt, hash, QUOTE_TEMPLATES, INDUSTRIES, ANNOUNCEMENT_TYPES, FOOTER } from "../heuristics.js";

export const writeReleaseSchema = {
  company: z.string().describe("Company name"),
  announcement: z.string().describe("What is being announced (e.g. 'Series A funding', 'product launch', 'partnership with Acme Corp')"),
  type: z.enum([
    "Product Launch", "Funding Round", "Partnership", "Acquisition",
    "Executive Hire", "Award / Recognition", "Research Report",
    "Market Expansion", "Feature Release", "Company Milestone",
  ]).describe("Type of announcement"),
  industry: z.string().describe("Company industry or sector"),
  spokesperson: z.string().describe("Name and title of primary spokesperson (e.g. 'Jane Smith, CEO')"),
  city: z.string().default("San Francisco").describe("City for dateline"),
  key_facts: z.string().describe("2-4 key facts or stats to include (comma-separated)"),
  target_audience: z.string().default("business professionals").describe("Target audience for the release"),
};

export function writeRelease(params: {
  company: string;
  announcement: string;
  type: string;
  industry: string;
  spokesperson: string;
  city: string;
  key_facts: string;
  target_audience: string;
}): string {
  const { company, announcement, type, industry, spokesperson, city, key_facts, target_audience } = params;
  const seed = `release:${company}:${announcement}`;
  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  const facts = key_facts.split(",").map((f) => f.trim()).filter(Boolean);
  const [spokeName, spokeTitle] = spokesperson.split(",").map((s) => s.trim());

  const quoteTemplate = pick(QUOTE_TEMPLATES, seed, 0);
  const metric = pick(["47%", "3x", "10x", "62%", "85%", "2.5x"], seed, 10);
  const timeframe = pick(["30 days", "90 days", "6 months", "the first quarter"], seed, 11);
  const quote = quoteTemplate
    .replace("{product}", announcement)
    .replace("{audience}", target_audience)
    .replace("{problem}", `inefficiencies in ${industry}`)
    .replace("{metric}", `${metric} efficiency`)
    .replace("{timeframe}", timeframe)
    .replace("{industry}", industry);

  const boilerplateSentences = [
    `${company} is a ${industry} company dedicated to helping ${target_audience} achieve better outcomes through innovative solutions.`,
    `Founded to solve the most pressing challenges facing ${industry}, ${company} serves thousands of customers worldwide.`,
    `${company} combines deep ${industry} expertise with cutting-edge technology to deliver measurable results for ${target_audience}.`,
  ];
  const boilerplate = pick(boilerplateSentences, seed, 20);

  const subheadlines = [
    `${company}'s Latest Innovation Delivers ${metric} Improvement for ${target_audience}`,
    `Industry-Leading ${type} Sets New Standard in ${industry}`,
    `${company} Strengthens Market Position with Strategic ${type}`,
  ];
  const subheadline = pick(subheadlines, seed, 30);

  let out = `# FOR IMMEDIATE RELEASE\n\n`;
  out += `## ${company} Announces ${announcement}\n`;
  out += `### ${subheadline}\n\n`;
  out += `**${city.toUpperCase()}, ${today}** — ${company}, a leading ${industry} company, today announced ${announcement.toLowerCase()}. This milestone marks a significant step forward in the company's mission to serve ${target_audience}.\n\n`;

  if (facts.length > 0) {
    out += `**Key Highlights:**\n\n`;
    facts.forEach((fact) => {
      out += `- ${fact}\n`;
    });
    out += `\n`;
  }

  out += `"${quote.replace(/^"|"$/g, "")}" said ${spokeName}${spokeTitle ? `, ${spokeTitle}` : ""} of ${company}.\n\n`;

  out += `The ${type.toLowerCase()} reflects ${company}'s ongoing commitment to innovation and its growing momentum in the ${industry} market. As ${target_audience} increasingly demand more effective solutions, ${company} continues to invest in capabilities that deliver measurable results.\n\n`;

  const secondQuote = pick([
    `"We've seen demand accelerate dramatically, and this ${type.toLowerCase()} positions us perfectly to meet it."`,
    `"Our customers have been the driving force behind this — their feedback shaped every decision."`,
    `"The ${industry} market is at an inflection point, and ${company} is leading the charge."`,
  ], seed, 40);
  out += `${secondQuote} ${spokeName} added.\n\n`;

  out += `**About ${company}**\n\n${boilerplate}\n\n`;
  out += `**Media Contact:**\n`;
  out += `press@${company.toLowerCase().replace(/\s+/g, "")}.com\n\n`;
  out += `###\n`;
  out += FOOTER;
  return out;
}
