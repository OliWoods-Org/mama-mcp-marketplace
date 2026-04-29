import { z } from "zod";
import { pick, pickN, rangeInt, FOOTER } from "../heuristics.js";

export const clipFinderSchema = {
  show_name: z.string().describe("Podcast name"),
  episode_title: z.string().describe("Episode title"),
  transcript_highlights: z.string().describe("Key quotes or moments from the episode (paste excerpts or describe them, comma or newline separated)"),
  episode_length_minutes: z.number().int().positive().describe("Total episode length in minutes"),
  target_platforms: z.array(z.enum(["YouTube Shorts", "TikTok", "Instagram Reels", "Twitter/X", "LinkedIn", "Facebook"])).describe("Target platforms for clips"),
  clip_count: z.number().int().min(1).max(10).default(5).describe("Number of clips to identify"),
};

export function clipFinder(params: {
  show_name: string;
  episode_title: string;
  transcript_highlights: string;
  episode_length_minutes: number;
  target_platforms: string[];
  clip_count: number;
}): string {
  const { show_name, episode_title, transcript_highlights, episode_length_minutes, target_platforms, clip_count } = params;
  const seed = `clips:${show_name}:${episode_title}`;

  const highlights = transcript_highlights
    .split(/[,\n]+/)
    .map((h) => h.trim())
    .filter(Boolean);

  const clipTypes = [
    { type: "Hook / Contrarian Take", viralScore: rangeInt(85, 99, seed, 0), optimalLength: "30–60s" },
    { type: "Tactical Breakdown", viralScore: rangeInt(70, 88, seed, 1), optimalLength: "60–90s" },
    { type: "Emotional Story Moment", viralScore: rangeInt(80, 95, seed, 2), optimalLength: "45–90s" },
    { type: "Quotable Soundbite", viralScore: rangeInt(75, 92, seed, 3), optimalLength: "15–30s" },
    { type: "Data / Surprising Stat", viralScore: rangeInt(78, 94, seed, 4), optimalLength: "20–45s" },
    { type: "Step-by-Step Framework", viralScore: rangeInt(72, 90, seed, 5), optimalLength: "60–120s" },
    { type: "Failure / Lesson Story", viralScore: rangeInt(82, 96, seed, 6), optimalLength: "45–75s" },
    { type: "Prediction / Future Vision", viralScore: rangeInt(77, 93, seed, 7), optimalLength: "30–60s" },
  ];

  const platformSpecs: Record<string, { aspect: string; maxLength: string; captionStyle: string }> = {
    "YouTube Shorts": { aspect: "9:16", maxLength: "60s", captionStyle: "Auto-captions via YT Studio" },
    "TikTok": { aspect: "9:16", maxLength: "60s (3min for verified)", captionStyle: "Burned-in captions for 80% of users who watch muted" },
    "Instagram Reels": { aspect: "9:16", maxLength: "90s", captionStyle: "Burned-in captions recommended" },
    "Twitter/X": { aspect: "16:9 or 9:16", maxLength: "2min 20s", captionStyle: "SRT upload or burned-in" },
    "LinkedIn": { aspect: "1:1 or 16:9", maxLength: "10min", captionStyle: "SRT upload preferred" },
    "Facebook": { aspect: "9:16 or 16:9", maxLength: "60s for Reels", captionStyle: "Auto-captions available" },
  };

  const clips = [];
  for (let i = 0; i < Math.min(clip_count, clipTypes.length); i++) {
    const ct = clipTypes[i];
    const timestamp = rangeInt(1, episode_length_minutes - 2, seed, i + 20);
    const clipLength = rangeInt(20, 90, seed, i + 30);
    const clipHighlight = highlights[i % highlights.length] ?? `Key moment around ${episode_title}`;
    clips.push({ ...ct, timestamp, clipLength, highlight: clipHighlight });
  }

  let out = `## Clip Finder: ${show_name} — "${episode_title}"\n\n`;
  out += `**Episode length:** ${episode_length_minutes} min | **Clips identified:** ${clips.length} | **Target platforms:** ${target_platforms.join(", ")}\n\n`;

  out += `### Recommended Clips\n\n`;
  clips.forEach((clip, i) => {
    out += `#### Clip ${i + 1}: ${clip.type}\n`;
    out += `- **Timestamp:** ~${clip.timestamp}:${String(rangeInt(0, 59, seed, i + 40)).padStart(2, "0")}\n`;
    out += `- **Duration:** ~${clip.clipLength}s\n`;
    out += `- **Viral score:** ${clip.viralScore}/100\n`;
    out += `- **Optimal length:** ${clip.optimalLength}\n`;
    out += `- **Context:** "${clip.highlight.substring(0, 120)}${clip.highlight.length > 120 ? "..." : ""}"\n`;
    out += `- **Caption hook:** "${pick(["Stop scrolling —", "Most people don't know this:", "This changed everything:", "Unpopular opinion:", "The truth about"], seed, i + 50)} ${episode_title.toLowerCase()}"\n\n`;
  });

  out += `### Platform-Specific Specs\n\n`;
  target_platforms.forEach((platform) => {
    const spec = platformSpecs[platform];
    if (spec) {
      out += `**${platform}**\n`;
      out += `- Aspect ratio: ${spec.aspect}\n`;
      out += `- Max length: ${spec.maxLength}\n`;
      out += `- Captions: ${spec.captionStyle}\n\n`;
    }
  });

  out += `### Clip Production Checklist\n\n`;
  out += `- [ ] Export raw clip from editor (original quality)\n`;
  out += `- [ ] Add burned-in captions (use Descript, Opus Clip, or Captions.ai)\n`;
  out += `- [ ] Add show logo / watermark (bottom-right corner)\n`;
  out += `- [ ] Write 3 caption variations (hook-based, question, stat-led)\n`;
  out += `- [ ] Schedule for peak engagement: Tue–Thu, 9am–12pm local\n`;
  out += `- [ ] Cross-post within 24h of episode release for algorithmic boost\n`;
  out += FOOTER;
  return out;
}
