import { z } from "zod";
import { pick, pickN, rangeInt, WIRE_SERVICES, MEDIA_OUTLETS, JOURNALIST_BEATS, FOOTER } from "../heuristics.js";

export const distributionPlanSchema = {
  company: z.string().describe("Company name"),
  announcement_type: z.enum([
    "Product Launch", "Funding Round", "Partnership", "Acquisition",
    "Executive Hire", "Award / Recognition", "Research Report",
    "Market Expansion", "Feature Release", "Company Milestone",
  ]).describe("Type of announcement"),
  release_date: z.string().describe("Planned release date (e.g. 'May 20, 2025')"),
  budget: z.enum(["bootstrap (<$500)", "starter ($500–$2k)", "growth ($2k–$10k)", "premium ($10k+)"]).describe("Distribution budget tier"),
  target_audience: z.string().describe("Primary audience to reach (e.g. 'B2B SaaS buyers', 'retail investors', 'developers')"),
  geographic_focus: z.enum(["US only", "North America", "Global", "EMEA", "APAC"]).default("US only").describe("Geographic distribution focus"),
};

export function distributionPlan(params: {
  company: string;
  announcement_type: string;
  release_date: string;
  budget: string;
  target_audience: string;
  geographic_focus: string;
}): string {
  const { company, announcement_type, release_date, budget, target_audience, geographic_focus } = params;
  const seed = `dist:${company}:${announcement_type}:${budget}`;

  const budgetMap: Record<string, { wire: number; outreach: number; social: number }> = {
    "bootstrap (<$500)": { wire: 0, outreach: 10, social: 50 },
    "starter ($500–$2k)": { wire: 1, outreach: 20, social: 100 },
    "growth ($2k–$10k)": { wire: 3, outreach: 50, social: 250 },
    "premium ($10k+)": { wire: 5, outreach: 100, social: 500 },
  };

  const config = budgetMap[budget] ?? budgetMap["starter ($500–$2k)"];
  const selectedWires = config.wire > 0 ? pickN(WIRE_SERVICES, config.wire, seed) : [];
  const targetOutlets = pickN(MEDIA_OUTLETS, Math.min(5, config.outreach / 10), seed + "outlets");
  const primaryBeat = pick(JOURNALIST_BEATS, seed, 0);

  const timelineSteps = [
    { days: -14, task: "Finalize press release draft & legal review" },
    { days: -10, task: "Brief key journalists under embargo" },
    { days: -7, task: "Distribute to wire service (if applicable)" },
    { days: -5, task: "Send targeted journalist pitches" },
    { days: -3, task: "Follow up with non-respondents" },
    { days: -1, task: "Prepare social media queue & internal comms" },
    { days: 0, task: `🚀 RELEASE DAY — ${release_date}` },
    { days: 1, task: "Monitor coverage, respond to journalist inquiries" },
    { days: 3, task: "Amplify earned coverage via owned channels" },
    { days: 7, task: "Coverage report & media clipping summary" },
    { days: 14, task: "Assess coverage gap — follow-up story opportunities" },
  ];

  let out = `## Distribution Plan: ${company} — ${announcement_type}\n\n`;
  out += `**Release Date:** ${release_date} | **Budget Tier:** ${budget} | **Geography:** ${geographic_focus}\n\n`;

  out += `### Timeline\n\n`;
  out += `| Date | Action |\n|------|--------|\n`;
  timelineSteps.forEach(({ days, task }) => {
    const label = days === 0 ? release_date : `${Math.abs(days)} ${days < 0 ? "days before" : "days after"}`;
    out += `| ${label} | ${task} |\n`;
  });
  out += `\n`;

  out += `### Wire Distribution\n\n`;
  if (selectedWires.length > 0) {
    out += `Recommended wire services for **${geographic_focus}** reach:\n\n`;
    selectedWires.forEach((wire, i) => {
      const cost = rangeInt(300, 2500, seed, i + 100);
      out += `- **${wire}** — est. $${cost.toLocaleString()} | ~${rangeInt(1000, 8000, seed, i + 200).toLocaleString()} pickup sites\n`;
    });
  } else {
    out += `At the **${budget}** tier, skip wire services and invest in direct journalist outreach instead.\n`;
    out += `Wire services have low ROI for stories that lack major financial metrics (funding, IPO, etc.).\n`;
  }
  out += `\n`;

  out += `### Direct Media Outreach\n\n`;
  out += `**Target Beat:** ${primaryBeat}\n`;
  out += `**Outreach Volume:** ${config.outreach} journalists\n\n`;
  out += `Priority outlets for **${target_audience}**:\n\n`;
  targetOutlets.forEach((outlet, i) => {
    out += `- **${outlet}** — ${pick(["breaking news desk", "features editor", "beat reporter", "senior correspondent"], seed, i + 300)}\n`;
  });
  out += `\n`;

  out += `### Owned & Earned Amplification\n\n`;
  const channels = [
    `Blog post: long-form story behind the announcement`,
    `LinkedIn: founder post with personal narrative angle`,
    `Twitter/X: thread with key data points + media roundup`,
    `Email newsletter: exclusive "first look" for subscribers`,
    `Podcast outreach: pitch the story as a guest episode`,
    `YouTube / Loom: CEO video message`,
    `Customer comms: personalized email to top ${rangeInt(10, 50, seed, 400)} accounts`,
  ];
  channels.forEach((c) => { out += `- ${c}\n`; });
  out += `\n`;

  out += `### Success Metrics\n\n`;
  out += `| Metric | Target |\n|--------|--------|\n`;
  out += `| Press pickup (articles) | ${rangeInt(5, 50, seed, 500)}+ |\n`;
  out += `| Estimated reach | ${rangeInt(100, 5000, seed, 501).toLocaleString()}K readers |\n`;
  out += `| Journalist responses | ${rangeInt(5, 30, seed, 502)} |\n`;
  out += `| Social shares | ${rangeInt(50, 500, seed, 503)}+ |\n`;
  out += `| Website traffic lift | ${rangeInt(20, 200, seed, 504)}%+ on release day |\n`;
  out += FOOTER;
  return out;
}
