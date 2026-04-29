import { z } from "zod";
import { pick, pickN, rangeInt, SLIDE_ARCHETYPES, INDUSTRIES, FOOTER } from "../heuristics.js";

export const pitchDeckOutlineSchema = {
  company: z.string().describe("Company or product name"),
  tagline: z.string().describe("One-line value proposition"),
  problem: z.string().describe("The problem you solve (1-2 sentences)"),
  solution: z.string().describe("Your solution (1-2 sentences)"),
  target_market: z.string().describe("Target market or customer segment"),
  business_model: z.string().describe("How you make money (e.g. 'SaaS subscription', 'commission', 'licensing')"),
  traction: z.string().optional().describe("Key traction metrics (e.g. '$500K ARR', '10K users', 'LOIs from 3 Fortune 500s')"),
  ask: z.string().optional().describe("What you're asking for (e.g. '$2M seed round', 'partnership', 'contract')"),
  deck_type: z.enum(["investor pitch", "sales deck", "partnership deck", "board update"]).describe("Audience and purpose of the deck"),
};

export function pitchDeckOutline(params: {
  company: string;
  tagline: string;
  problem: string;
  solution: string;
  target_market: string;
  business_model: string;
  traction?: string;
  ask?: string;
  deck_type: string;
}): string {
  const { company, tagline, problem, solution, target_market, business_model, traction, ask, deck_type } = params;
  const seed = `deck:${company}:${deck_type}`;

  const marketSize = `$${rangeInt(2, 200, seed, 0)}B`;
  const cagr = `${rangeInt(15, 45, seed, 1)}%`;

  const investorSlides = [
    { slide: 1, title: "Cover", purpose: "First impression — logo, tagline, contact", content: `**${company}**\n*${tagline}*\nPresented by [Founder Name] | [Date]` },
    { slide: 2, title: "The Problem", purpose: "Make the pain visceral and quantified", content: `${problem}\n\n**Cost of inaction:** $${rangeInt(50, 500, seed, 10)}B wasted annually | ${rangeInt(5, 12, seed, 11)}h/week lost per user` },
    { slide: 3, title: "The Solution", purpose: "Simple 'aha' — show not tell", content: `${solution}\n\n**3-word pitch:** [verb] + [who] + [outcome]` },
    { slide: 4, title: "Product Demo / Screenshot", purpose: "Tangibility — investor must see it working", content: `Hero screenshot or 60-second demo. Caption: "This is what ${target_market} sees on Day 1."` },
    { slide: 5, title: "Market Size", purpose: "TAM/SAM/SOM pyramid", content: `**TAM:** ${marketSize} | **SAM:** $${rangeInt(1, 20, seed, 12)}B | **SOM:** $${rangeInt(50, 500, seed, 13)}M\nGrowth: ${cagr} CAGR through ${new Date().getFullYear() + 5}` },
    { slide: 6, title: "Business Model", purpose: "How you make money — keep it to one sentence", content: `${business_model}\n\nUnit economics: LTV $${rangeInt(500, 5000, seed, 14)} | CAC $${rangeInt(50, 500, seed, 15)} | Payback ${rangeInt(3, 18, seed, 16)} months` },
    { slide: 7, title: "Traction", purpose: "Proof this isn't theoretical", content: traction ?? `[Add: revenue, users, growth rate, NPS, logos]\nKey milestone: ${pick(["First $100K ARR", "10K active users", "Enterprise pilot live", "Partnership signed"], seed, 17)}` },
    { slide: 8, title: "Competition", purpose: "Show you understand the landscape — position clearly", content: `2x2 matrix: X-axis = [dimension 1], Y-axis = [dimension 2]\n${company} in the top-right. 3–5 named competitors positioned.\n**Our moat:** ${pick(["proprietary data", "network effects", "switching costs", "brand", "technology"], seed, 18)}` },
    { slide: 9, title: "Team", purpose: "We've done this before — credibility transfer", content: `**[Founder 1]** — CEO. Previously [relevant role]. [Unfair advantage].\n**[Founder 2]** — CTO. Built [relevant system] at [name-drop company].\nAdvisors: [1–2 names that open doors]` },
    { slide: 10, title: "The Ask", purpose: "Clear, specific, tied to milestones", content: ask ?? `Raising $${rangeInt(1, 5, seed, 19)}M ${pick(["Pre-Seed", "Seed", "Series A"], seed, 20)}\nUse of funds: ${rangeInt(40, 60, seed, 21)}% eng, ${rangeInt(20, 35, seed, 22)}% sales, ${rangeInt(10, 20, seed, 23)}% ops\nTarget milestones: [18-month goals]` },
  ];

  const salesSlides = investorSlides.map((s) => ({ ...s }));
  salesSlides[5].content = `${business_model}\n\nPricing: [Tier 1], [Tier 2], [Enterprise Custom]\nROI for ${target_market}: ${rangeInt(3, 10, seed, 30)}x within ${rangeInt(6, 18, seed, 31)} months`;
  salesSlides[9].content = ask ?? `Proposed next step: ${pick(["30-day pilot", "proof of concept", "contract signing", "kickoff call"], seed, 32)}\nTimeline: Live by ${pick(["end of quarter", "next month", "within 60 days"], seed, 33)}`;

  const slides = deck_type === "investor pitch" ? investorSlides : salesSlides;

  const designPrinciples = [
    `One idea per slide — if you need a comma, make two slides`,
    `Data > adjectives: show the number, not "massive growth"`,
    `Use ${company}'s brand colors throughout — builds recognition`,
    `Every slide should answer: "so what?" for your audience`,
    `Animations off — decks get forwarded; they must work standalone`,
  ];

  let out = `## Pitch Deck Outline: ${company}\n\n`;
  out += `**Type:** ${deck_type} | **Audience:** ${target_market}\n`;
  out += `**Value prop:** ${tagline}\n\n`;

  out += `### Slide Structure (${slides.length} slides)\n\n`;
  slides.forEach((s) => {
    out += `#### Slide ${s.slide}: ${s.title}\n`;
    out += `*Purpose: ${s.purpose}*\n\n`;
    out += `${s.content}\n\n---\n\n`;
  });

  out += `### Design Principles\n\n`;
  designPrinciples.forEach((p) => { out += `- ${p}\n`; });
  out += `\n`;

  out += `### Storytelling Arc\n\n`;
  out += `1. **Hook** (Slide 2): Make them feel the pain\n`;
  out += `2. **Relief** (Slide 3): You have the answer\n`;
  out += `3. **Proof** (Slides 4–7): Here's the evidence\n`;
  out += `4. **Context** (Slides 8–9): We're the right team in the right market\n`;
  out += `5. **Call to Action** (Slide 10): Here's exactly what I need from you\n`;
  out += FOOTER;
  return out;
}
