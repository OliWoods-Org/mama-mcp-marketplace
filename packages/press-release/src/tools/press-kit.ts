import { z } from "zod";
import { pick, rangeInt, INDUSTRIES, ANNOUNCEMENT_TYPES, FOOTER } from "../heuristics.js";

export const pressKitSchema = {
  company: z.string().describe("Company name"),
  tagline: z.string().describe("Company tagline or one-line description"),
  founded: z.string().describe("Year founded"),
  headquarters: z.string().describe("HQ location"),
  industry: z.string().describe("Industry or sector"),
  funding: z.string().optional().describe("Total funding raised (e.g. '$24M Series B')"),
  customers: z.string().optional().describe("Customer count or notable clients"),
  key_stats: z.string().describe("3-5 key company stats (comma-separated, e.g. '10M users, 98% retention, 150 countries')"),
  leadership: z.string().describe("Key leadership names and titles (comma-separated, e.g. 'Jane Smith CEO, Bob Lee CTO')"),
};

export function pressKit(params: {
  company: string;
  tagline: string;
  founded: string;
  headquarters: string;
  industry: string;
  funding?: string;
  customers?: string;
  key_stats: string;
  leadership: string;
}): string {
  const { company, tagline, founded, headquarters, industry, funding, customers, key_stats, leadership } = params;
  const seed = `kit:${company}:${founded}`;

  const stats = key_stats.split(",").map((s) => s.trim()).filter(Boolean);
  const leaders = leadership.split(",").map((l) => l.trim()).filter(Boolean);

  const boilerplates = [
    `${company} is a ${industry} company helping organizations unlock their full potential through technology and expertise.`,
    `Built for the modern era of ${industry}, ${company} combines innovation with proven results to serve customers worldwide.`,
    `${company} is on a mission to transform ${industry} — making it faster, smarter, and more accessible for everyone.`,
  ];
  const boilerplate = pick(boilerplates, seed, 0);
  const shortBoilerplate = pick([
    `${company} (${tagline}) — ${industry} company founded ${founded} in ${headquarters}.`,
    `${company}: ${tagline}. Headquartered in ${headquarters} since ${founded}.`,
    `${company} | ${tagline} | ${headquarters} | Est. ${founded}`,
  ], seed, 1);

  let out = `# ${company} Press Kit\n\n`;
  out += `> ${tagline}\n\n`;
  out += `---\n\n`;

  out += `## Company Overview\n\n`;
  out += `${boilerplate}\n\n`;
  out += `| | |\n|---|---|\n`;
  out += `| **Founded** | ${founded} |\n`;
  out += `| **Headquarters** | ${headquarters} |\n`;
  out += `| **Industry** | ${industry} |\n`;
  if (funding) out += `| **Funding** | ${funding} |\n`;
  if (customers) out += `| **Customers** | ${customers} |\n`;
  out += `\n`;

  out += `## Key Stats\n\n`;
  stats.forEach((stat) => { out += `- **${stat}**\n`; });
  out += `\n`;

  out += `## Leadership\n\n`;
  leaders.forEach((leader) => {
    const [name, ...titleParts] = leader.split(" ");
    const title = titleParts.join(" ");
    out += `### ${leader}\n`;
    out += `${title ? `*${title}*\n\n` : ""}`;
    out += `Available for interview on: ${pick(["strategy", "product vision", "market trends", "company culture", "future of " + industry], seed + leader, 0)}, ${pick(["AI & technology", "leadership lessons", "scaling challenges", "customer success", "industry disruption"], seed + leader, 1)}\n\n`;
  });

  out += `## Boilerplate (Standard)\n\n`;
  out += `> ${boilerplate}\n\n`;
  out += `## Boilerplate (Short)\n\n`;
  out += `> ${shortBoilerplate}\n\n`;

  out += `## Media Assets Checklist\n\n`;
  const assets = [
    `[ ] Company logo (SVG, PNG — light & dark variants)`,
    `[ ] Executive headshots (hi-res 300dpi)`,
    `[ ] Product screenshots / demo video`,
    `[ ] Brand guidelines (colors, fonts, usage rules)`,
    `[ ] Fact sheet (1-page PDF)`,
    `[ ] Recent press releases`,
    `[ ] Awards / recognition badges`,
    `[ ] Customer testimonial quotes`,
  ];
  assets.forEach((a) => { out += `- ${a}\n`; });
  out += `\n`;

  out += `## Editorial Style Notes\n\n`;
  out += `- Refer to the company as **${company}** (not "${company.toUpperCase()}" or "${company.toLowerCase()}")\n`;
  out += `- Tagline: *${tagline}* — use verbatim when possible\n`;
  out += `- Do not use "disrupting" or "revolutionary" — preferred: "redefining", "transforming", "leading"\n\n`;

  out += `## Press Contact\n\n`;
  out += `press@${company.toLowerCase().replace(/\s+/g, "")}.com\n`;
  out += FOOTER;
  return out;
}
