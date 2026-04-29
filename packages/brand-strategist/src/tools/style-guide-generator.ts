import { z } from "zod";
import {
  pick, pickN, rangeInt,
  BRAND_ARCHETYPES, VOICE_TONES, COLOR_PALETTES, TYPOGRAPHY_PAIRINGS, FOOTER,
} from "../heuristics.js";

export const styleGuideGeneratorSchema = {
  brand_name: z.string().describe("Brand or business name"),
  archetype: z.string().describe("Brand archetype or personality (e.g. 'The Hero', 'The Sage', 'disruptive challenger')"),
  industry: z.string().describe("Industry or market"),
  primary_color: z.string().optional().describe("Primary brand color (hex code or color name), if already established"),
};

export function styleGuideGenerator(params: {
  brand_name: string;
  archetype: string;
  industry: string;
  primary_color?: string;
}): string {
  const { brand_name, archetype, industry, primary_color } = params;
  const seed = `brand:style:${brand_name}:${industry}`;

  const industryKey = Object.keys(COLOR_PALETTES).find(
    (k) => industry.toLowerCase().includes(k)
  ) ?? pick(Object.keys(COLOR_PALETTES) as string[], seed, 0);
  const palette = COLOR_PALETTES[industryKey] ?? ["#1C1C1C", "#4F46E5", "#F9FAFB"];

  const primaryHex = primary_color ?? palette[0];
  const secondaryHex = palette[1];
  const neutralHex = palette[2];
  const accentHex = pick(["#FF6B35", "#FFD60A", "#06D6A0", "#118AB2", "#EF233C"], seed, 10);

  const typoPairing = pick(TYPOGRAPHY_PAIRINGS, seed, 20);
  const [headingFont, bodyFont] = typoPairing.split(" + ");

  const primaryTone = pick(VOICE_TONES, seed, 30);
  const secondaryTone = pick(VOICE_TONES, seed, 31);

  const doList = pickN([
    "Use short, punchy sentences in external comms",
    "Lead with the customer's problem, not our product",
    "Speak in the active voice",
    "Use 'you' more than 'we' in copy",
    "Reference data and proof points when making claims",
    "Use analogies to make complex ideas accessible",
    "Be direct — state the conclusion first, explain after",
    "Show warmth in support interactions",
  ], 4, `${seed}:do`);

  const dontList = pickN([
    "Use jargon or buzzwords without explanation",
    "Make unsubstantiated superlative claims ('world's best')",
    "Use passive voice in CTAs",
    "Use multiple exclamation marks",
    "Use corporate-speak ('synergy', 'leverage', 'paradigm')",
    "Write in third person about the brand",
    "Use all-caps for emphasis",
    "Overuse emojis in professional contexts",
  ], 4, `${seed}:dont`);

  let out = `## 🎨 Brand Style Guide: ${brand_name}\n`;
  out += `**Archetype:** ${archetype} | **Industry:** ${industry}\n\n`;

  out += `---\n\n`;
  out += `# ${brand_name} Brand Style Guide\n`;
  out += `*Generated ${new Date().getFullYear()} — Update as brand evolves*\n\n`;

  out += `## 1. Color Palette\n\n`;
  out += `| Role | Color | Hex | Usage |\n`;
  out += `|------|-------|-----|-------|\n`;
  out += `| Primary | ██ | \`${primaryHex}\` | Buttons, headings, primary CTAs |\n`;
  out += `| Secondary | ██ | \`${secondaryHex}\` | Supporting elements, icons, links |\n`;
  out += `| Accent | ██ | \`${accentHex}\` | Highlights, alerts, badges |\n`;
  out += `| Neutral | ██ | \`${neutralHex}\` | Backgrounds, text, borders |\n\n`;

  out += `## 2. Typography\n\n`;
  out += `**Pairing:** ${typoPairing}\n\n`;
  out += `| Element | Font | Weight | Size |\n`;
  out += `|---------|------|--------|------|\n`;
  out += `| H1 | ${headingFont ?? "Display font"} | 700 Bold | 48–64px |\n`;
  out += `| H2 | ${headingFont ?? "Display font"} | 600 SemiBold | 32–40px |\n`;
  out += `| H3 | ${headingFont ?? "Display font"} | 500 Medium | 24–28px |\n`;
  out += `| Body | ${bodyFont ?? "Body font"} | 400 Regular | 16–18px |\n`;
  out += `| Caption | ${bodyFont ?? "Body font"} | 400 Regular | 12–14px |\n\n`;

  out += `## 3. Brand Voice\n\n`;
  out += `**Primary tone:** ${primaryTone} | **Secondary tone:** ${secondaryTone}\n\n`;
  out += `### Do\n`;
  doList.forEach((d) => { out += `- ✅ ${d}\n`; });
  out += "\n### Don't\n";
  dontList.forEach((d) => { out += `- ❌ ${d}\n`; });
  out += "\n";

  out += `## 4. Logo Usage\n\n`;
  out += `- Minimum size: **120px wide** (digital), **1 inch** (print)\n`;
  out += `- Clear space: equal to the height of the logo mark on all sides\n`;
  out += `- Approved: full color, reversed (white on dark), single-color black\n`;
  out += `- Never: stretch, rotate, add drop shadows, or change colors\n\n`;

  out += `## 5. Imagery Style\n\n`;
  out += `- **Photography:** ${pick(["Natural light, real people, candid moments", "Clean studio, product-focused, white backgrounds", "Cinematic, dramatic lighting, bold compositions", "Authentic UGC-style, unposed, relatable"], seed, 40)}\n`;
  out += `- **Illustration:** ${pick(["Flat vector, minimal, geometric", "Hand-drawn, organic, warm", "3D rendered, modern, technical", "Line art, elegant, minimal"], seed, 41)}\n`;
  out += `- **Icons:** Consistent stroke weight (2px), rounded corners, monochromatic\n`;

  out += FOOTER;
  return out;
}
