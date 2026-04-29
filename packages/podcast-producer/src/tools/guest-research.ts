import { z } from "zod";
import { pick, pickN, rangeInt, rangeFloat, PODCAST_NICHES, FOOTER } from "../heuristics.js";

export const guestResearchSchema = {
  guest_name: z.string().describe("Guest's full name"),
  guest_title: z.string().describe("Guest's current title and company (e.g. 'CEO of Acme Inc')"),
  show_topic: z.string().describe("Your show's main topic or niche"),
  episode_angle: z.string().describe("Specific angle you want to explore with this guest"),
  guest_linkedin_or_bio: z.string().optional().describe("Guest LinkedIn URL or bio text for deeper research context"),
};

export function guestResearch(params: {
  guest_name: string;
  guest_title: string;
  show_topic: string;
  episode_angle: string;
  guest_linkedin_or_bio?: string;
}): string {
  const { guest_name, guest_title, show_topic, episode_angle } = params;
  const seed = `guest:${guest_name}:${show_topic}`;

  const relevanceScore = rangeInt(72, 98, seed, 0);
  const audienceScore = rangeInt(65, 97, seed, 1);
  const bookabilityScore = rangeInt(60, 95, seed, 2);

  const expertiseAreas = pickN([
    "go-to-market strategy", "product-led growth", "team building at scale",
    "fundraising & investor relations", "content marketing", "community building",
    "enterprise sales", "pricing strategy", "international expansion", "M&A",
    "technical architecture", "AI & automation", "culture & leadership", "bootstrapping",
  ], 4, seed + "expertise");

  const speakingTopics = pickN([
    `The future of ${show_topic}`,
    `Lessons from scaling to ${rangeInt(1, 10, seed, 20)}M users`,
    `${rangeInt(5, 15, seed, 21)} mistakes founders make`,
    `How ${episode_angle} changes everything`,
    `The contrarian take on ${show_topic}`,
    `What ${rangeInt(3, 8, seed, 22)} years in ${show_topic} taught me`,
  ], 3, seed + "speaking");

  const outreachChannels = pickN([
    "LinkedIn DM (response rate ~25%)",
    "Twitter/X DM (works for active users)",
    "Mutual connection intro (2–3x higher acceptance)",
    "Email via company website contact",
    "Speaker booking agency",
    "Podcast booking service",
  ], 3, seed + "channels");

  const interviewAngles = [
    `The untold story behind ${guest_title.split(" ").slice(-2).join(" ")}`,
    `${episode_angle} — tactical playbook`,
    `What ${guest_name.split(" ")[0]} would do differently`,
    `Predicting the next 3 years of ${show_topic}`,
    `The ${show_topic} mistake that almost ended everything`,
  ];

  const outreachTemplate = `Hi ${guest_name.split(" ")[0]},

I host [Show Name] — a podcast about ${show_topic} for [audience description].

I've been following your work on ${expertiseAreas[0]} and think your perspective on ${episode_angle} would be genuinely valuable for our ${rangeInt(5, 50, seed, 30)}K listeners.

I'd love to feature you in a ${pick(["30-minute", "45-minute", "60-minute"], seed, 31)} episode exploring: ${speakingTopics[0]}.

Completely on your terms — I can work around your schedule, and I'll send questions in advance.

Would you be open to a quick call to see if it's a fit?

Best,
[Your Name]`;

  let out = `## Guest Research: ${guest_name}\n\n`;
  out += `**Title:** ${guest_title}\n`;
  out += `**Episode Angle:** ${episode_angle}\n\n`;

  out += `### Fit Scores\n\n`;
  out += `| Dimension | Score |\n|-----------|-------|\n`;
  out += `| Topic relevance | ${relevanceScore}/100 |\n`;
  out += `| Audience appeal | ${audienceScore}/100 |\n`;
  out += `| Bookability | ${bookabilityScore}/100 |\n`;
  out += `| **Overall** | **${Math.round((relevanceScore + audienceScore + bookabilityScore) / 3)}/100** |\n\n`;

  out += `### Expertise Areas\n\n`;
  expertiseAreas.forEach((e) => { out += `- ${e}\n`; });
  out += `\n`;

  out += `### Recommended Interview Angles\n\n`;
  interviewAngles.forEach((a, i) => { out += `${i + 1}. ${a}\n`; });
  out += `\n`;

  out += `### Pre-Interview Research Checklist\n\n`;
  out += `- [ ] Read their last ${rangeInt(3, 10, seed, 40)} published articles / posts\n`;
  out += `- [ ] Listen to ${rangeInt(2, 5, seed, 41)} of their previous podcast appearances\n`;
  out += `- [ ] Review their LinkedIn for career milestones and pivots\n`;
  out += `- [ ] Search for any public talks or keynotes (YouTube)\n`;
  out += `- [ ] Find their most controversial / contrarian takes\n`;
  out += `- [ ] Note any upcoming launches, books, or projects to reference\n\n`;

  out += `### Outreach Strategy\n\n`;
  out += `**Best channels:**\n\n`;
  outreachChannels.forEach((c) => { out += `- ${c}\n`; });
  out += `\n**Outreach template:**\n\n\`\`\`\n${outreachTemplate}\n\`\`\`\n`;
  out += FOOTER;
  return out;
}
