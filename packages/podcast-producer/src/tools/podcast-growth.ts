import { z } from "zod";
import { pick, pickN, rangeInt, rangeFloat, GROWTH_CHANNELS, PLATFORMS, FOOTER } from "../heuristics.js";

export const podcastGrowthSchema = {
  show_name: z.string().describe("Podcast name"),
  niche: z.string().describe("Show niche or topic area"),
  current_downloads: z.number().int().min(0).describe("Average downloads per episode"),
  publishing_frequency: z.enum(["daily", "3x/week", "2x/week", "weekly", "biweekly", "monthly"]).describe("Current publishing frequency"),
  months_running: z.number().int().min(0).describe("How many months the show has been running"),
  current_channels: z.string().optional().describe("Current growth channels already in use (comma-separated)"),
  growth_goal: z.enum(["2x downloads", "5x downloads", "monetization", "sponsorship-ready", "top 100 chart"]).describe("Primary growth goal"),
};

export function podcastGrowth(params: {
  show_name: string;
  niche: string;
  current_downloads: number;
  publishing_frequency: string;
  months_running: number;
  current_channels?: string;
  growth_goal: string;
}): string {
  const { show_name, niche, current_downloads, publishing_frequency, months_running, current_channels, growth_goal } = params;
  const seed = `growth:${show_name}:${niche}:${growth_goal}`;

  const existingChannels = (current_channels ?? "").split(",").map((c) => c.trim().toLowerCase()).filter(Boolean);
  const unusedChannels = GROWTH_CHANNELS.filter((c) => !existingChannels.some((e) => c.toLowerCase().includes(e)));
  const topChannels = pickN(unusedChannels, 5, seed);

  const benchmarks: Record<string, { p25: number; p50: number; p75: number; top: number }> = {
    "daily": { p25: 100, p50: 300, p75: 1000, top: 5000 },
    "3x/week": { p25: 200, p50: 600, p75: 2000, top: 10000 },
    "2x/week": { p25: 300, p50: 900, p75: 3000, top: 15000 },
    "weekly": { p25: 500, p50: 1500, p75: 5000, top: 25000 },
    "biweekly": { p25: 300, p50: 1000, p75: 3500, top: 15000 },
    "monthly": { p25: 200, p50: 700, p75: 2500, top: 10000 },
  };

  const bench = benchmarks[publishing_frequency] ?? benchmarks["weekly"];
  const percentile = current_downloads < bench.p25 ? "bottom 25%"
    : current_downloads < bench.p50 ? "25th–50th percentile"
    : current_downloads < bench.p75 ? "50th–75th percentile (above average)"
    : current_downloads < bench.top ? "top 25% of shows"
    : "top 5% — exceptional";

  const targetMultipliers: Record<string, number> = {
    "2x downloads": 2, "5x downloads": 5, "monetization": 3,
    "sponsorship-ready": 4, "top 100 chart": 10,
  };
  const targetMultiplier = targetMultipliers[growth_goal] ?? 3;
  const targetDownloads = Math.round(current_downloads * targetMultiplier);
  const timelineMonths = rangeInt(3, 12, seed, 0);

  const quickWins = pickN([
    "Optimize episode titles with SEO keywords (use CoHost or Rephonic for data)",
    "Add a compelling trailer episode — directories surface it to new listeners",
    "Create a Spotify and Apple Podcasts 'Best Of' playlist for new subscriber onboarding",
    "Guest swap with 2-3 shows in adjacent niches (fastest growth lever)",
    "Post a '5 episodes to start with' post on LinkedIn and Reddit",
    "Submit to 10+ podcast directories you're not currently on",
    "Add a free resource/lead magnet mentioned in every episode",
  ], 4, seed + "quick");

  const monetizationThreshold = publishing_frequency === "weekly" ? 5000 : 3000;
  const sponsorReadyAt = current_downloads >= monetizationThreshold
    ? "You're sponsor-ready NOW"
    : `At ${monetizationThreshold.toLocaleString()} downloads/ep — ${Math.ceil((monetizationThreshold - current_downloads) / (current_downloads * 0.15))} months at 15% MoM growth`;

  let out = `## Podcast Growth Report: ${show_name}\n\n`;
  out += `**Niche:** ${niche} | **Frequency:** ${publishing_frequency} | **Age:** ${months_running} months\n`;
  out += `**Current downloads/ep:** ${current_downloads.toLocaleString()} | **Goal:** ${growth_goal}\n\n`;

  out += `### Benchmarking\n\n`;
  out += `| Percentile | Downloads/ep |\n|-----------|-------------|\n`;
  out += `| Bottom 25% | <${bench.p25.toLocaleString()} |\n`;
  out += `| Median | ${bench.p50.toLocaleString()} |\n`;
  out += `| Top 25% | ${bench.p75.toLocaleString()}+ |\n`;
  out += `| Top 5% | ${bench.top.toLocaleString()}+ |\n\n`;
  out += `**Your position:** ${percentile}\n\n`;

  out += `### Growth Target\n\n`;
  out += `**Goal:** ${growth_goal} → **${targetDownloads.toLocaleString()} downloads/ep**\n`;
  out += `**Realistic timeline:** ${timelineMonths} months at ${rangeInt(12, 25, seed, 1)}% MoM growth\n\n`;

  out += `### Top Growth Channels (untapped)\n\n`;
  topChannels.forEach((ch, i) => {
    const impact = pick(["High", "Medium", "High", "Very High", "Medium"], seed, i + 10);
    const effort = pick(["Low", "Medium", "High", "Low", "Medium"], seed, i + 20);
    out += `${i + 1}. **${ch}**\n   Impact: ${impact} | Effort: ${effort}\n\n`;
  });

  out += `### Quick Wins (next 30 days)\n\n`;
  quickWins.forEach((w) => { out += `- ${w}\n`; });
  out += `\n`;

  out += `### Monetization Readiness\n\n`;
  out += `${sponsorReadyAt}\n\n`;
  out += `| Revenue Stream | Est. Monthly at ${current_downloads.toLocaleString()} dls/ep |\n|---------------|-----|\n`;
  out += `| Podcast sponsorship (CPM $18–$25) | $${Math.round(current_downloads * 0.018 * 4).toLocaleString()}–$${Math.round(current_downloads * 0.025 * 4).toLocaleString()} |\n`;
  out += `| Premium membership | $${Math.round(current_downloads * 0.01 * 10).toLocaleString()} (1% conversion @ $10/mo) |\n`;
  out += `| Course / product | $${Math.round(current_downloads * 0.005 * 97).toLocaleString()} (0.5% conversion @ $97) |\n`;
  out += FOOTER;
  return out;
}
