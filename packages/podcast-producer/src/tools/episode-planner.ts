import { z } from "zod";
import { pick, pickN, rangeInt, EPISODE_FORMATS, PODCAST_NICHES, SEGMENT_TYPES, INTERVIEW_QUESTION_TYPES, FOOTER } from "../heuristics.js";

export const episodePlannerSchema = {
  show_name: z.string().describe("Name of the podcast"),
  topic: z.string().describe("Episode topic or theme"),
  format: z.enum([
    "Solo Deep-Dive", "Guest Interview", "Panel Discussion", "Q&A / Listener Questions",
    "Case Study Breakdown", "News Roundup", "Debate / Two Perspectives",
    "Storytelling / Narrative", "Tutorial / How-To", "Industry Report Review",
  ]).describe("Episode format"),
  target_length: z.enum(["15 min", "30 min", "45 min", "60 min", "90 min"]).describe("Target episode length"),
  audience_level: z.enum(["beginner", "intermediate", "advanced", "mixed"]).default("mixed").describe("Audience expertise level"),
  goal: z.string().optional().describe("Primary goal of this episode (e.g. 'grow email list', 'launch product', 'drive sponsorship')"),
};

export function episodePlanner(params: {
  show_name: string;
  topic: string;
  format: string;
  target_length: string;
  audience_level: string;
  goal?: string;
}): string {
  const { show_name, topic, format, target_length, audience_level, goal } = params;
  const seed = `episode:${show_name}:${topic}:${format}`;

  const lengthMinutes: Record<string, number> = {
    "15 min": 15, "30 min": 30, "45 min": 45, "60 min": 60, "90 min": 90,
  };
  const totalMins = lengthMinutes[target_length] ?? 45;

  const segmentCount = totalMins <= 20 ? 3 : totalMins <= 40 ? 4 : totalMins <= 60 ? 5 : 7;
  const segments: Array<{ name: string; duration: number; notes: string }> = [];

  const segmentPool = [
    { name: "Cold Open / Hook", duration: Math.round(totalMins * 0.05), notes: "Start with the most surprising stat or story. Hook listener in first 60 seconds." },
    { name: "Host Intro", duration: Math.round(totalMins * 0.05), notes: "Episode number, show name, what's coming — brief and energetic." },
    { name: "Sponsor Segment", duration: 1, notes: "Mid-roll performs best. First mention here, second at 75% mark." },
    { name: "Main Content", duration: Math.round(totalMins * 0.6), notes: format === "Guest Interview" ? "Core interview — use 3-act structure: origin → expertise → forward-looking take" : `Deep-dive on ${topic} — use the problem/solution/proof framework.` },
    { name: "Key Takeaways", duration: Math.round(totalMins * 0.08), notes: "Recap 3 actionable takeaways. Label them explicitly for the listener." },
    { name: "Lightning Round", duration: Math.round(totalMins * 0.07), notes: "5 fast questions — energizes the end of the episode." },
    { name: "Outro / CTA", duration: Math.round(totalMins * 0.05), notes: `Push: ${goal ?? "subscribe, review, share"}. Tease next episode.` },
  ];

  for (let i = 0; i < Math.min(segmentCount, segmentPool.length); i++) {
    segments.push(segmentPool[i]);
  }

  const hooks = [
    `"What if everything you knew about ${topic} was wrong?"`,
    `"By the end of this episode, you'll never approach ${topic} the same way again."`,
    `"${rangeInt(70, 95, seed, 1)}% of people get this wrong about ${topic}. Today we fix that."`,
    `"I spent ${rangeInt(3, 12, seed, 2)} months researching ${topic} so you don't have to."`,
    `"This episode could save you ${rangeInt(10, 100, seed, 3)} hours on ${topic}."`,
  ];

  const questions = format === "Guest Interview" ? pickN(INTERVIEW_QUESTION_TYPES, 6, seed) : [];

  let out = `## Episode Plan: ${show_name}\n\n`;
  out += `**Topic:** ${topic}\n`;
  out += `**Format:** ${format} | **Length:** ${target_length} | **Audience:** ${audience_level}\n`;
  if (goal) out += `**Goal:** ${goal}\n`;
  out += `\n`;

  out += `### Hook Options\n\n`;
  hooks.slice(0, 3).forEach((h) => { out += `- ${h}\n`; });
  out += `\n`;

  out += `### Episode Structure\n\n`;
  out += `| Segment | Duration | Notes |\n|---------|----------|-------|\n`;
  let elapsed = 0;
  segments.forEach((seg) => {
    const dur = Math.max(1, seg.duration);
    out += `| **${seg.name}** | ${dur} min | ${seg.notes} |\n`;
    elapsed += dur;
  });
  out += `| | **~${elapsed} min total** | |\n\n`;

  if (questions.length > 0) {
    out += `### Interview Question Framework\n\n`;
    questions.forEach((q, i) => {
      out += `**${i + 1}. ${q}**\n`;
      out += `   - Follow-up: "Can you give me a specific example?"\n`;
      out += `   - Redirect if off-track: "That's great context — and how does that connect to ${topic}?"\n\n`;
    });
  }

  out += `### SEO / Discovery\n\n`;
  out += `**Suggested episode title:** "${pick(["The Truth About", "How to Master", "Inside the World of", "The Ultimate Guide to", "Why Most People Fail at"], seed, 10)} ${topic}"\n`;
  out += `**Primary keyword:** ${topic.toLowerCase()}\n`;
  out += `**Secondary keywords:** ${topic.toLowerCase()} tips, ${topic.toLowerCase()} strategy, ${pick(["how to", "best practices", "mistakes to avoid", "framework for", "secrets of"], seed, 11)} ${topic.toLowerCase()}\n`;
  out += FOOTER;
  return out;
}
