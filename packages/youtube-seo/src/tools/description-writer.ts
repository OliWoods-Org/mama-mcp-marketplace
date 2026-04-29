import { z } from "zod";
import {
  pick, pickN, rangeInt,
  DESCRIPTION_SECTIONS, POWER_WORDS, FOOTER,
} from "../heuristics.js";

export const descriptionWriterSchema = {
  video_title: z.string().describe("The video title"),
  video_summary: z.string().describe("Brief summary of what the video covers (2–5 sentences)"),
  keywords: z.array(z.string()).min(1).max(8).describe("Target keywords to include (1–8)"),
  include_timestamps: z.boolean().default(true).describe("Whether to include placeholder chapter timestamps"),
};

export function descriptionWriter(params: {
  video_title: string;
  video_summary: string;
  keywords: string[];
  include_timestamps: boolean;
}): string {
  const { video_title, video_summary, keywords, include_timestamps } = params;
  const seed = `yt:desc:${video_title}:${keywords[0]}`;

  const primaryKw = keywords[0] ?? "this topic";
  const pw = pick(POWER_WORDS, seed, 0);
  const chapterCount = rangeInt(5, 10, seed, 1);

  const chapters = Array.from({ length: chapterCount }, (_, i) => {
    const mins = i === 0 ? 0 : rangeInt(i * 2, i * 4, seed, i + 20);
    const secs = i === 0 ? 0 : rangeInt(0, 59, seed, i + 40);
    const label = pick([
      "Introduction",
      `What is ${primaryKw}`,
      "Key concepts explained",
      "Step-by-step breakdown",
      "Common mistakes to avoid",
      "Pro tips & tricks",
      "Real examples",
      "Tools & resources",
      "Q&A",
      "Conclusion & next steps",
    ], seed, i + 60);
    const timestamp = `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    return `${timestamp} — ${label}`;
  });

  const hashtags = keywords.slice(0, 5).map((k) => `#${k.replace(/\s+/g, "")}`);
  const extraHashtag = pick(["#YouTube", "#Tutorial", "#HowTo", "#Tips", "#2025"], seed, 80);
  hashtags.push(extraHashtag);

  let out = `## 📝 YouTube Description Generator\n`;
  out += `**Video:** "${video_title}"\n\n`;

  out += `### Generated Description\n\n`;
  out += `---\n\n`;
  out += `👉 **${video_summary.trim()}**\n\n`;
  out += `In this ${pw} guide, we cover everything you need to know about **${primaryKw}** — from the basics to ${pick(["advanced strategies", "pro-level tactics", "real-world application", "actionable insights"], seed, 90)}.\n\n`;

  if (include_timestamps) {
    out += `⏱️ **Chapters:**\n`;
    chapters.forEach((c) => { out += `${c}\n`; });
    out += "\n";
  }

  out += `🔗 **Resources mentioned:**\n`;
  out += `- [Resource 1 — add your link]\n`;
  out += `- [Resource 2 — add your link]\n\n`;

  out += `📌 **Subscribe** for weekly content on ${keywords[1] ?? primaryKw}: [Subscribe link]\n\n`;
  out += `💬 **Got questions?** Drop them in the comments — I read every one.\n\n`;
  out += `🔔 **Turn on notifications** so you never miss a video.\n\n`;
  out += `---\n\n`;
  out += `**Follow me:**\n`;
  out += `Twitter/X: @yourhandle | Instagram: @yourhandle | Newsletter: yoursite.com\n\n`;
  out += `---\n\n`;
  keywords.forEach((kw) => { out += `${kw} | `; });
  out += "\n\n";
  out += hashtags.join(" ") + "\n\n";
  out += `---\n\n`;

  out += `### Description Scorecard\n\n`;
  out += `| Element | Status |\n`;
  out += `|---------|--------|\n`;
  DESCRIPTION_SECTIONS.forEach((s) => { out += `| ${s} | ✅ Included |\n`; });

  out += FOOTER;
  return out;
}
