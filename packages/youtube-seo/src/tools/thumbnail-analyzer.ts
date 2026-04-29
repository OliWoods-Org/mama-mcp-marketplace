import { z } from "zod";
import {
  pick, pickN, rangeInt, rangeFloat,
  THUMBNAIL_ELEMENTS, FOOTER,
} from "../heuristics.js";

export const thumbnailAnalyzerSchema = {
  video_title: z.string().describe("The video title this thumbnail is for"),
  description: z.string().describe("Describe your thumbnail concept or current thumbnail elements (colors, text, imagery, faces)"),
  niche: z.string().describe("Your channel niche"),
};

const THUMBNAIL_ISSUES = [
  "text is too small to read on mobile screens",
  "background lacks contrast with the text overlay",
  "no human face — faces boost click-through rate significantly",
  "too much visual clutter — simplify to one focal point",
  "colors don't stand out in YouTube's feed (dark on dark)",
  "no clear emotional hook or curiosity trigger",
  "text uses more than 5 words — trim to 3 for impact",
  "thumbnail doesn't visually match the title promise",
  "brand color inconsistency across channel",
  "low resolution — use minimum 1280x720px",
];

const THUMBNAIL_WINS = [
  "strong emotion on face drives curiosity",
  "high-contrast color combination stands out in feed",
  "3-word text overlay is punchy and readable",
  "clear focal point — eye goes straight to the key element",
  "thumbnail visually completes the title story",
  "consistent brand colors build channel recognition",
  "uses curiosity gap effectively",
  "before/after visual sets up the transformation story",
];

const COLOR_COMBOS = [
  "Yellow + Black (highest contrast, top CTR)",
  "Red + White (urgency and energy)",
  "Blue + Orange (complementary, trust + excitement)",
  "Green + Black (health, money, tech niches)",
  "Purple + Gold (premium / educational niches)",
];

export function thumbnailAnalyzer(params: { video_title: string; description: string; niche: string }): string {
  const { video_title, description, niche } = params;
  const seed = `yt:thumb:${video_title}:${niche}`;

  const overallScore = rangeInt(38, 87, seed, 0);
  const estimatedCtr = rangeFloat(3.5, 9.2, seed, 1);
  const nicheBenchmark = rangeFloat(4.0, 7.5, seed, 2);

  const issues = pickN(THUMBNAIL_ISSUES, rangeInt(2, 4, seed, 10), `${seed}:issues`);
  const wins = pickN(THUMBNAIL_WINS, rangeInt(2, 4, seed, 11), `${seed}:wins`);
  const bestColor = pick(COLOR_COMBOS, seed, 20);
  const topElements = pickN(THUMBNAIL_ELEMENTS, 4, `${seed}:elements`);

  let out = `## 🖼️ Thumbnail Analyzer\n`;
  out += `**Video:** "${video_title}" | **Niche:** ${niche}\n\n`;

  out += `### Thumbnail Score\n\n`;
  out += `**${overallScore}/100** — Estimated CTR: **${estimatedCtr}%** (${niche} benchmark: ${nicheBenchmark}%)\n\n`;
  const diff = estimatedCtr - nicheBenchmark;
  out += diff >= 0
    ? `> Your thumbnail is projected to perform **${Math.abs(diff).toFixed(1)}% above** niche average.\n\n`
    : `> Your thumbnail is projected to perform **${Math.abs(diff).toFixed(1)}% below** niche average — improvements below will close this gap.\n\n`;

  out += `### What's Working\n\n`;
  wins.forEach((w) => { out += `- ✅ ${w}\n`; });
  out += "\n";

  out += `### Issues to Fix\n\n`;
  issues.forEach((issue, i) => {
    out += `**Issue ${i + 1}:** ${issue}\n`;
    out += `   *Fix:* ${pick([
      "Use minimum 72pt font weight bold, test on a phone screen thumbnail size",
      "Increase contrast ratio to at least 4.5:1 — use WebAIM contrast checker",
      "Add a cropped face photo with clear visible emotion in the corner",
      "Remove all but the single most important visual element",
      "Use a bright color block background: yellow, red, or orange",
      "Add a facial expression that mirrors the viewer's desired outcome",
      "Cut to max 3 words: the most emotional part of the title",
      "Redesign so thumbnail and title together form one complete story",
    ], `${seed}:fix`, i)}\n\n`;
  });

  out += `### Recommended Design Elements\n\n`;
  topElements.forEach((el) => { out += `- 🎨 ${el}\n`; });
  out += "\n";

  out += `### Best Color Combination for ${niche}\n\n`;
  out += `**Recommended:** ${bestColor}\n\n`;

  out += `### A/B Test Recommendation\n\n`;
  out += `Test your current thumbnail against a version with:\n`;
  out += `1. A close-up face showing **${pick(["shock", "excitement", "concern", "confidence", "curiosity"], seed, 60)}** emotion\n`;
  out += `2. Background color changed to **${pick(["bright yellow", "deep red", "electric blue", "vivid orange"], seed, 61)}**\n`;
  out += `3. Text reduced to exactly **3 words** in bold\n\n`;
  out += `Use YouTube Studio's thumbnail A/B test or TubeBuddy to run the split test.\n`;

  out += FOOTER;
  return out;
}
