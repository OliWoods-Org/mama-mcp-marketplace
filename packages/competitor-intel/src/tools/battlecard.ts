import { z } from "zod";
import { pick, pickN, rangeInt, WIN_REASONS, LOSS_REASONS, MARKET_SEGMENTS, FOOTER } from "../heuristics.js";

export const battlecardSchema = {
  your_product: z.string().describe("Your product or company name"),
  competitor: z.string().describe("Competitor name"),
  your_strengths: z.string().describe("Your top strengths vs. this competitor (comma-separated)"),
  competitor_weaknesses: z.string().describe("Known competitor weaknesses or gaps (comma-separated)"),
  common_objections: z.string().describe("Top objections sales reps hear when this competitor is in the deal (comma-separated)"),
  target_persona: z.string().optional().describe("Target buyer persona (e.g. 'VP of Engineering at Series B startup')"),
};

export function battlecard(params: {
  your_product: string;
  competitor: string;
  your_strengths: string;
  competitor_weaknesses: string;
  common_objections: string;
  target_persona?: string;
}): string {
  const { your_product, competitor, your_strengths, competitor_weaknesses, common_objections, target_persona } = params;
  const seed = `battlecard:${your_product}:${competitor}`;

  const strengths = your_strengths.split(",").map((s) => s.trim()).filter(Boolean);
  const weaknesses = competitor_weaknesses.split(",").map((w) => w.trim()).filter(Boolean);
  const objections = common_objections.split(",").map((o) => o.trim()).filter(Boolean);

  const winReasons = pickN(WIN_REASONS, 4, seed + "win");
  const lossReasons = pickN(LOSS_REASONS, 3, seed + "loss");

  const objectionHandlers: Record<string, string> = {};
  objections.forEach((obj, i) => {
    objectionHandlers[obj] = pick([
      `"I understand — and here's how we're different: ${strengths[i % strengths.length]}. Can I show you a quick comparison?"`,
      `"That's the most common misconception about us vs. ${competitor}. The reality is [specific differentiator]. Would a proof-of-concept resolve that concern?"`,
      `"${competitor} has momentum in [narrow use case]. Where we consistently win is [your strength]. What matters most to your team?"`,
      `"Let me share what ${pick(["three", "five", "several"], seed, i + 10)} customers told us after switching from ${competitor}: [result]."`,
    ], seed + obj, 0);
  });

  const talkingPoints = [
    `Lead with customer outcomes, not features — ${competitor} competes on features; you win on results`,
    `Find the dissatisfied users: ask "What would you change about your current solution?"`,
    `Propose a side-by-side POC on their actual data — kills abstract feature debates`,
    `Reference your ${winReasons[0].toLowerCase()} — use a specific customer story`,
    `Avoid bashing ${competitor} directly; let the demo do the talking`,
  ];

  const disqualifiers = pickN([
    `Deal is purely procurement-driven with no champion`,
    `${competitor} is deeply embedded in their core workflow`,
    `Budget < $${rangeInt(5, 20, seed, 30)}K (floor for our enterprise motion)`,
    `No executive sponsor — only champion is an individual contributor`,
    `Timeline > ${rangeInt(9, 18, seed, 31)} months — not active now`,
  ], 3, seed + "disq");

  let out = `## Sales Battlecard: ${your_product} vs. ${competitor}\n\n`;
  if (target_persona) out += `**Target Persona:** ${target_persona}\n\n`;

  out += `### Quick Win Summary\n\n`;
  out += `| We win when... | We lose when... |\n|----------------|----------------|\n`;
  for (let i = 0; i < Math.max(winReasons.length, lossReasons.length); i++) {
    const w = winReasons[i] ?? "";
    const l = lossReasons[i] ?? "";
    out += `| ${w} | ${l} |\n`;
  }
  out += `\n`;

  out += `### Our Strengths vs. ${competitor}\n\n`;
  strengths.forEach((s) => { out += `- ✅ ${s}\n`; });
  out += `\n`;

  out += `### ${competitor}'s Weaknesses\n\n`;
  weaknesses.forEach((w) => { out += `- ⚠️ ${w}\n`; });
  out += `\n`;

  out += `### Objection Handlers\n\n`;
  objections.forEach((obj) => {
    out += `**"${obj}"**\n\n`;
    out += `> ${objectionHandlers[obj]}\n\n`;
  });

  out += `### Winning Talk Track\n\n`;
  talkingPoints.forEach((tp, i) => { out += `${i + 1}. ${tp}\n`; });
  out += `\n`;

  out += `### Disqualify Early If...\n\n`;
  disqualifiers.forEach((d) => { out += `- 🚩 ${d}\n`; });
  out += FOOTER;
  return out;
}
