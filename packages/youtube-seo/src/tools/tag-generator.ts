import { z } from "zod";
import {
  pick, pickN, rangeInt,
  TAG_CATEGORIES, VIDEO_NICHES, FOOTER,
} from "../heuristics.js";

export const tagGeneratorSchema = {
  video_topic: z.string().describe("Video topic or title"),
  niche: z.string().describe("Your channel niche"),
  seed_keywords: z.array(z.string()).min(1).max(5).describe("2–5 seed keywords related to the video"),
};

const MODIFIERS = [
  "2025", "beginners", "advanced", "tutorial", "guide", "tips",
  "how to", "best", "free", "step by step", "for", "vs",
  "review", "explained", "course", "strategy", "mistakes",
];

export function tagGenerator(params: { video_topic: string; niche: string; seed_keywords: string[] }): string {
  const { video_topic, niche, seed_keywords } = params;
  const seed = `yt:tags:${video_topic}:${niche}`;

  const tagsByCategory: Array<{ category: string; tags: string[] }> = TAG_CATEGORIES.map((cat, ci) => {
    const count = rangeInt(4, 8, `${seed}:cat${ci}`, 0);
    const tags = Array.from({ length: count }, (_, i) => {
      const base = pick(seed_keywords, `${seed}:cat${ci}:base`, i);
      const mod = pick(MODIFIERS, `${seed}:cat${ci}:mod`, i);
      switch (cat) {
        case "exact match":
          return base;
        case "broad match":
          return niche.toLowerCase();
        case "related topic":
          return `${base} ${mod}`;
        case "niche long-tail":
          return `how to ${base} ${mod}`;
        case "trending adjacent":
          return `${base} 2025`;
        case "competitor brand":
          return `${base} alternative`;
        case "question-based":
          return `what is ${base}`;
        default:
          return `${base} ${mod}`;
      }
    });
    return { category: cat, tags: [...new Set(tags)] };
  });

  const allTags = tagsByCategory.flatMap((c) => c.tags);
  const totalTags = allTags.length;
  const highVolumeCount = rangeInt(3, 6, seed, 50);
  const medVolumeCount = rangeInt(4, 8, seed, 51);
  const lowVolumeCount = totalTags - highVolumeCount - medVolumeCount;

  let out = `## 🏷️ YouTube Tag Generator\n`;
  out += `**Topic:** "${video_topic}" | **Niche:** ${niche}\n`;
  out += `**Seed Keywords:** ${seed_keywords.map((k) => `"${k}"`).join(", ")}\n\n`;

  out += `### Tag Overview\n\n`;
  out += `| Metric | Value |\n`;
  out += `|--------|-------|\n`;
  out += `| Total tags generated | **${totalTags}** |\n`;
  out += `| High-volume tags | **${highVolumeCount}** |\n`;
  out += `| Medium-volume tags | **${medVolumeCount}** |\n`;
  out += `| Long-tail / niche tags | **${Math.max(lowVolumeCount, 2)}** |\n`;
  out += `| YouTube tag limit | 500 characters |\n\n`;

  tagsByCategory.forEach(({ category, tags }) => {
    out += `### ${category.charAt(0).toUpperCase() + category.slice(1)} Tags\n\n`;
    tags.forEach((t) => { out += `\`${t}\`  `; });
    out += "\n\n";
  });

  out += `### Copy-Paste Tag String\n\n`;
  out += `\`\`\`\n${allTags.join(", ")}\n\`\`\`\n\n`;

  const charCount = allTags.join(", ").length;
  out += `**Character count:** ${charCount}/500 — ${charCount > 450 ? "⚠️ Close to limit, trim if needed" : "✅ Within limit"}\n\n`;

  out += `### Tag Strategy Tips\n\n`;
  out += `- Start with **exact match** tags (the video topic itself)\n`;
  out += `- Mix high-volume and long-tail — long-tail wins early traction\n`;
  out += `- Include your channel name as a tag for brand association\n`;
  out += `- Tags matter less than title/thumbnail — but they help in search\n`;
  out += `- Refresh tags if the video underperforms after 30 days\n`;

  out += FOOTER;
  return out;
}
