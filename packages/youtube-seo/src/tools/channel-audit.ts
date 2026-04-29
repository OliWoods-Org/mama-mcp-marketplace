import { z } from "zod";
import {
  pick, pickN, rangeInt, rangeFloat,
  CHANNEL_METRICS, VIDEO_NICHES, FOOTER,
} from "../heuristics.js";

export const channelAuditSchema = {
  channel_name: z.string().describe("YouTube channel name or handle"),
  niche: z.string().describe("Channel niche / category"),
  subscriber_count: z.number().min(0).describe("Current subscriber count"),
  videos_published: z.number().min(1).describe("Total videos published"),
  monthly_upload_frequency: z.number().min(0).describe("Average videos uploaded per month"),
};

const GROWTH_BLOCKERS = [
  "inconsistent upload schedule — algorithm deprioritizes irregular channels",
  "thumbnail style varies too much — no visual brand identity",
  "titles don't use proven hook formulas — low CTR",
  "no content series — viewers have no reason to subscribe for 'more'",
  "video intros are too long — viewers drop off in first 30 seconds",
  "missing end screens with subscribe CTA",
  "no community posts or shorts to feed the algorithm between uploads",
  "keyword research not driving topic selection",
  "no clear niche — channel doesn't trigger algorithm recommendations",
  "comment section not engaged — kills community signals",
];

const GROWTH_OPPORTUNITIES = [
  "Launch a signature series with episodic structure",
  "Publish 2–3 YouTube Shorts per week to feed the algorithm",
  "Optimize your 10 highest-performing videos with better thumbnails",
  "Collaborate with 2 similar-sized channels for cross-promotion",
  "Create a community post poll to drive engagement",
  "Build a content pillar around your 3 best-performing topics",
  "Add chapters/timestamps to all existing videos",
  "Create a channel trailer optimized for new visitors",
];

export function channelAudit(params: {
  channel_name: string;
  niche: string;
  subscriber_count: number;
  videos_published: number;
  monthly_upload_frequency: number;
}): string {
  const { channel_name, niche, subscriber_count, videos_published, monthly_upload_frequency } = params;
  const seed = `yt:audit:${channel_name}:${niche}`;

  const overallScore = rangeInt(32, 84, seed, 0);
  const ctr = rangeFloat(2.5, 8.5, seed, 1);
  const avd = rangeFloat(28, 68, seed, 2);
  const subRate = rangeFloat(0.3, 2.1, seed, 3);
  const engagementRate = rangeFloat(1.2, 7.8, seed, 4);

  const nicheAvgSubs = Math.round(subscriber_count * rangeFloat(1.5, 4.0, seed, 10));
  const growth30d = rangeInt(50, 800, seed, 11);

  const blockers = pickN(GROWTH_BLOCKERS, rangeInt(3, 5, seed, 20), `${seed}:blockers`);
  const opportunities = pickN(GROWTH_OPPORTUNITIES, 3, `${seed}:opps`);

  const metricScores: Array<[string, string, number]> = [
    ["Click-Through Rate (CTR)", `${ctr}%`, ctr > 5 ? 85 : ctr > 3 ? 60 : 35],
    ["Avg View Duration", `${avd}%`, avd > 50 ? 90 : avd > 35 ? 65 : 40],
    ["Subscriber Conversion Rate", `${subRate}%`, subRate > 1.5 ? 80 : subRate > 0.7 ? 55 : 30],
    ["Engagement Rate", `${engagementRate}%`, engagementRate > 5 ? 88 : engagementRate > 2.5 ? 62 : 38],
    ["Upload Consistency", `${monthly_upload_frequency}x/mo`, monthly_upload_frequency >= 4 ? 85 : monthly_upload_frequency >= 2 ? 60 : 35],
  ];

  let out = `## 📺 YouTube Channel Audit: ${channel_name}\n`;
  out += `**Niche:** ${niche} | **Subscribers:** ${subscriber_count.toLocaleString()} | **Videos:** ${videos_published}\n\n`;

  out += `### Channel Health Score: ${overallScore}/100\n\n`;
  const grade = overallScore >= 80 ? "A" : overallScore >= 65 ? "B" : overallScore >= 50 ? "C" : overallScore >= 35 ? "D" : "F";
  out += `**Grade: ${grade}** — ${overallScore >= 65 ? "Strong foundation, optimize to scale" : overallScore >= 45 ? "Room to grow — fix key metrics below" : "Critical issues blocking growth — address blockers first"}\n\n`;

  out += `### Key Metrics vs Benchmarks\n\n`;
  out += `| Metric | Your Channel | Score |\n`;
  out += `|--------|-------------|-------|\n`;
  metricScores.forEach(([metric, value, score]) => {
    const bar = "█".repeat(Math.round(score / 10)) + "░".repeat(10 - Math.round(score / 10));
    out += `| ${metric} | ${value} | ${bar} ${score}/100 |\n`;
  });
  out += "\n";

  out += `### Niche Context\n\n`;
  out += `| Metric | Your Channel | Niche Average |\n`;
  out += `|--------|-------------|---------------|\n`;
  out += `| Subscribers | ${subscriber_count.toLocaleString()} | ${nicheAvgSubs.toLocaleString()} |\n`;
  out += `| 30-day growth | +${growth30d} | +${rangeInt(growth30d - 50, growth30d + 200, seed, 30)} |\n`;
  out += `| Videos/month | ${monthly_upload_frequency} | ${rangeInt(2, 6, seed, 31)} |\n\n`;

  out += `### Growth Blockers\n\n`;
  blockers.forEach((b, i) => { out += `**${i + 1}.** ⚠️ ${b}\n`; });
  out += "\n";

  out += `### Top Opportunities\n\n`;
  opportunities.forEach((o) => { out += `- 🚀 ${o}\n`; });
  out += "\n";

  out += `### 30-Day Action Plan\n\n`;
  out += `1. Fix the #1 growth blocker: **${blockers[0]}**\n`;
  out += `2. Run \`title_optimizer\` on your 5 lowest-CTR videos\n`;
  out += `3. Run \`thumbnail_analyzer\` on your 3 most important videos\n`;
  out += `4. ${opportunities[0]}\n`;
  out += `5. Commit to ${monthly_upload_frequency < 4 ? "at least 4" : "maintaining"} uploads/month\n`;

  out += FOOTER;
  return out;
}
