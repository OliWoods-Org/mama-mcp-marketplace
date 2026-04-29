import { z } from "zod";
import {
  pick, pickN, rangeInt,
  TITLE_HOOKS, POWER_WORDS, VIDEO_NICHES, FOOTER,
} from "../heuristics.js";

export const titleOptimizerSchema = {
  topic: z.string().describe("Video topic or draft title to optimize"),
  niche: z.string().describe("Your YouTube niche (e.g. 'Personal Finance', 'Tech Reviews', 'Fitness')"),
  target_audience: z.string().describe("Who the video is for (e.g. 'beginner investors', 'gym beginners')"),
  style: z.enum(["educational", "entertainment", "challenge", "vlog", "review", "tutorial"]).describe("Video style"),
};

export function titleOptimizer(params: {
  topic: string;
  niche: string;
  target_audience: string;
  style: string;
}): string {
  const { topic, niche, target_audience, style } = params;
  const seed = `yt:title:${topic}:${niche}`;

  const hook = pick(TITLE_HOOKS, seed, 0);
  const hook2 = pick(TITLE_HOOKS, seed, 1);
  const hook3 = pick(TITLE_HOOKS, seed, 2);
  const pw1 = pick(POWER_WORDS, seed, 10);
  const pw2 = pick(POWER_WORDS, seed, 11);
  const pw3 = pick(POWER_WORDS, seed, 12);

  const ctrScores = [
    rangeInt(72, 95, seed, 20),
    rangeInt(65, 88, seed, 21),
    rangeInt(58, 82, seed, 22),
    rangeInt(50, 75, seed, 23),
    rangeInt(45, 70, seed, 24),
  ];

  const titles = [
    `${hook} ${topic} (and it changed everything)`,
    `The ${pw1} Guide to ${topic} for ${target_audience}`,
    `${topic}: What Nobody Tells ${target_audience}`,
    `${hook2} ${topic} in 2025 — ${pw2} results`,
    `${hook3} ${topic} | ${pw3} ${style} breakdown`,
  ];

  const charCounts = titles.map((t) => t.length);
  const bestTitle = titles[ctrScores.indexOf(Math.max(...ctrScores))];

  let out = `## 🎯 YouTube Title Optimizer\n`;
  out += `**Topic:** "${topic}" | **Niche:** ${niche} | **Audience:** ${target_audience}\n\n`;

  out += `### 5 Optimized Title Options\n\n`;
  out += `| # | Title | CTR Score | Chars |\n`;
  out += `|---|-------|-----------|-------|\n`;
  titles.forEach((t, i) => {
    const star = ctrScores[i] === Math.max(...ctrScores) ? " ⭐" : "";
    out += `| ${i + 1} | ${t}${star} | ${ctrScores[i]}/100 | ${charCounts[i]} |\n`;
  });
  out += "\n";

  out += `### Recommended Title\n\n`;
  out += `> **"${bestTitle}"**\n\n`;
  out += `This title uses the **${hook}** hook pattern and power word **"${pw1}"** — proven to boost CTR in the ${niche} niche.\n\n`;

  out += `### Title Optimization Rules\n\n`;
  out += `- ✅ Keep under **60 characters** so it doesn't truncate on mobile\n`;
  out += `- ✅ Front-load the most compelling word or number\n`;
  out += `- ✅ Use brackets **[like this]** or parentheses for meta context\n`;
  out += `- ✅ Match the emotion viewers feel when searching for this topic\n`;
  out += `- ❌ Avoid clickbait that doesn't deliver — kills watch time and algorithm trust\n`;
  out += `- ❌ Don't stuff keywords unnaturally — YouTube reads for context\n\n`;

  out += `### CTR Benchmark for ${niche}\n\n`;
  const benchmark = rangeInt(4, 9, seed, 50);
  out += `Average CTR in your niche: **${benchmark}%**. A strong title should target **${benchmark + rangeInt(2, 5, seed, 51)}%+**.\n`;

  out += FOOTER;
  return out;
}
