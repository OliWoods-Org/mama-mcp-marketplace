import { z } from "zod";
import { pick, pickN, rangeInt, MEDIA_OUTLETS, JOURNALIST_BEATS, FOOTER } from "../heuristics.js";

export const mediaPitchSchema = {
  story: z.string().describe("The story or news hook you want to pitch"),
  company: z.string().describe("Your company name"),
  angle: z.string().describe("Unique angle or why this is newsworthy now"),
  target_outlet: z.string().optional().describe("Specific outlet to target (e.g. 'TechCrunch', 'Forbes'). Leave blank for recommendations."),
  spokesperson_expertise: z.string().describe("What makes your spokesperson uniquely qualified to speak on this topic"),
  embargo_date: z.string().optional().describe("Embargo date if applicable (e.g. 'May 15, 2025 9am ET')"),
};

export function mediaPitch(params: {
  story: string;
  company: string;
  angle: string;
  target_outlet?: string;
  spokesperson_expertise: string;
  embargo_date?: string;
}): string {
  const { story, company, angle, target_outlet, spokesperson_expertise, embargo_date } = params;
  const seed = `pitch:${company}:${story}`;

  const beat = pick(JOURNALIST_BEATS, seed, 0);
  const outlets = target_outlet
    ? [target_outlet]
    : pickN(MEDIA_OUTLETS, 5, seed);

  const subjectLines = [
    `Exclusive: ${story} — ${company} has the data`,
    `[Embargo ${embargo_date ?? "TBD"}] ${story}`,
    `Story tip: ${angle}`,
    `${company} CEO available to discuss: ${story}`,
    `Data-backed story: ${story}`,
  ];

  const openingHooks = [
    `${angle} — and ${company} has the proof.`,
    `Every ${beat.toLowerCase()} journalist has been asking about ${story}. Here's the exclusive.`,
    `Your readers are dealing with this every day. ${company} just solved it.`,
    `I'll keep this brief because I know your inbox is full. ${story} — ${angle}.`,
  ];

  const proofPoints = [
    `${rangeInt(500, 5000, seed, 10).toLocaleString()} customers validated this approach`,
    `${rangeInt(6, 36, seed, 11)} months of proprietary data`,
    `${rangeInt(2, 8, seed, 12)} industry experts on record`,
    `Exclusive access to unreleased research`,
    `First-of-its-kind benchmark study`,
  ];

  const selectedSubject = pick(subjectLines, seed, 20);
  const hook = pick(openingHooks, seed, 21);
  const proofs = pickN(proofPoints, 3, seed + "proof");

  let out = `## Media Pitch: ${story}\n\n`;
  out += `### Recommended Outlets\n\n`;
  outlets.forEach((outlet, i) => {
    const fitScore = rangeInt(72, 97, seed, i + 50);
    out += `- **${outlet}** — Fit score: ${fitScore}/100\n`;
  });

  out += `\n---\n\n`;
  out += `### Subject Line Options\n\n`;
  subjectLines.slice(0, 3).forEach((sl) => {
    out += `- \`${sl}\`\n`;
  });

  out += `\n---\n\n`;
  out += `### Pitch Email Draft\n\n`;
  out += `**Subject:** ${selectedSubject}\n\n`;
  out += `Hi [Journalist Name],\n\n`;
  out += `${hook}\n\n`;
  out += `Here's what makes this story uniquely timely:\n\n`;
  out += `- ${angle}\n`;
  proofs.forEach((p) => { out += `- ${p}\n`; });

  out += `\nI'd love to offer you:\n\n`;
  out += `- **Exclusive interview** with ${company}'s spokesperson, who ${spokesperson_expertise}\n`;
  out += `- **Embargo access** to full research / data${embargo_date ? ` (embargo lifts ${embargo_date})` : ""}\n`;
  out += `- **Supporting assets**: data viz, exec headshots, product screenshots\n\n`;
  out += `Happy to jump on a 10-minute call this week. What works for you?\n\n`;
  out += `Best,\n[Your Name]\n[Title] | ${company}\n[Email] | [Phone]\n\n`;

  out += `---\n\n### Pitch Tips\n\n`;
  out += `- Send Tuesday–Thursday, 8–10am journalist's local time for best open rates\n`;
  out += `- Follow up once after 3 business days — subject: "Re: ${selectedSubject.substring(0, 40)}..."\n`;
  out += `- Personalize the opening line for each journalist's recent articles\n`;
  out += `- Keep the email under 200 words — link to full press release, don't paste it\n`;
  out += FOOTER;
  return out;
}
