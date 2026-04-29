import { z } from "zod";
import { pick, pickN, rangeInt, FOOTER } from "../heuristics.js";

export const showNotesSchema = {
  show_name: z.string().describe("Podcast name"),
  episode_number: z.number().int().positive().describe("Episode number"),
  episode_title: z.string().describe("Episode title"),
  guest_name: z.string().optional().describe("Guest name (leave blank for solo episodes)"),
  guest_title: z.string().optional().describe("Guest title/company"),
  key_topics: z.string().describe("Main topics covered (comma-separated)"),
  timestamps: z.string().optional().describe("Timestamps in format 'MM:SS Topic' (newline-separated) — leave blank to auto-generate"),
  sponsor: z.string().optional().describe("Sponsor name and offer (e.g. 'Acme — get 20% off at acme.com/show')"),
  cta: z.string().optional().describe("Primary call to action (e.g. 'Join our newsletter at newsletter.com')"),
};

export function showNotes(params: {
  show_name: string;
  episode_number: number;
  episode_title: string;
  guest_name?: string;
  guest_title?: string;
  key_topics: string;
  timestamps?: string;
  sponsor?: string;
  cta?: string;
}): string {
  const { show_name, episode_number, episode_title, guest_name, guest_title, key_topics, timestamps, sponsor, cta } = params;
  const seed = `notes:${show_name}:${episode_number}:${episode_title}`;

  const topics = key_topics.split(",").map((t) => t.trim()).filter(Boolean);

  const autoTimestamps = timestamps
    ? timestamps.split("\n").filter(Boolean)
    : (() => {
        const auto: string[] = [];
        let t = 0;
        const segs = ["Intro", ...topics.slice(0, 5), "Key Takeaways", "Where to find " + (guest_name ?? "more")];
        segs.forEach((seg) => {
          const mins = String(Math.floor(t / 60)).padStart(2, "0");
          const secs = String(t % 60).padStart(2, "0");
          auto.push(`${mins}:${secs} — ${seg}`);
          t += rangeInt(4, 15, seed + seg, 0) * 60;
        });
        return auto;
      })();

  const summaryLines = [
    `In this episode of ${show_name}, ${guest_name ? `we sit down with ${guest_name}${guest_title ? `, ${guest_title}` : ""}` : "we dive deep"} to explore ${topics[0] ?? episode_title}.`,
    `${guest_name ? `${guest_name} shares` : "You'll discover"} actionable insights on ${topics.slice(0, 2).join(" and ")}, plus ${pick(["a framework you can use immediately", "the contrarian take most people miss", "the exact playbook behind the results", "the mistakes to avoid"], seed, 0)}.`,
  ];

  const takeaways = topics.map((topic, i) => {
    const formats = [
      `Why ${topic} is the highest-leverage activity most people overlook`,
      `The ${pick(["3-step", "5-part", "simple", "proven"], seed, i + 10)} framework for ${topic}`,
      `How to approach ${topic} differently than the conventional wisdom`,
      `The biggest mistake people make with ${topic} — and how to fix it`,
    ];
    return pick(formats, seed, i + 20);
  });

  let out = `## Show Notes — ${show_name} #${episode_number}\n\n`;
  out += `### ${episode_title}\n`;
  if (guest_name) out += `*with ${guest_name}${guest_title ? `, ${guest_title}` : ""}*\n`;
  out += `\n`;

  out += `### Episode Summary\n\n`;
  summaryLines.forEach((l) => { out += `${l} `; });
  out += `\n\n`;

  out += `### What You'll Learn\n\n`;
  takeaways.forEach((t) => { out += `- ${t}\n`; });
  out += `\n`;

  out += `### Timestamps\n\n`;
  autoTimestamps.forEach((ts) => { out += `- ${ts}\n`; });
  out += `\n`;

  if (guest_name) {
    out += `### About the Guest\n\n`;
    out += `**${guest_name}**${guest_title ? ` — ${guest_title}` : ""}\n\n`;
    out += `*[Add guest bio here — 2-3 sentences highlighting relevant background]*\n\n`;
    out += `**Connect with ${guest_name.split(" ")[0]}:**\n`;
    out += `- LinkedIn: [link]\n- Twitter/X: [@handle]\n- Website: [url]\n\n`;
  }

  if (sponsor) {
    out += `### This Episode Is Brought to You By\n\n`;
    out += `**${sponsor}**\n\n`;
  }

  out += `### Resources Mentioned\n\n`;
  const resources = pickN([
    "Book: [Guest recommended book — add title]",
    "Tool: [Tool mentioned in episode — add link]",
    "Article: [Article referenced — add link]",
    "Course: [Course recommended — add link]",
    "Podcast: [Related show mentioned — add link]",
  ], Math.min(topics.length + 1, 4), seed + "resources");
  resources.forEach((r) => { out += `- ${r}\n`; });
  out += `\n`;

  out += `### Subscribe & Review\n\n`;
  out += `If you enjoyed this episode, please **subscribe** and leave a **5-star review** — it helps more people discover ${show_name}.\n\n`;

  if (cta) {
    out += `### ${pick(["Join the Community", "Take Action", "Next Step", "Don't Miss This"], seed, 50)}\n\n`;
    out += `${cta}\n\n`;
  }

  out += `---\n**Follow ${show_name}:** [Spotify] [Apple] [YouTube]\n`;
  out += FOOTER;
  return out;
}
