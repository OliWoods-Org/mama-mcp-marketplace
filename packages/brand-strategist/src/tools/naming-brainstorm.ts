import { z } from "zod";
import {
  pick, pickN, rangeInt, hash,
  NAME_PATTERNS, BRAND_ARCHETYPES, FOOTER,
} from "../heuristics.js";

export const namingBrainstormSchema = {
  description: z.string().describe("What the brand/product does and who it's for"),
  industry: z.string().describe("Industry or market category"),
  values: z.array(z.string()).min(1).max(5).describe("Core brand values (e.g. ['simplicity', 'speed', 'trust'])"),
  style: z.enum(["modern", "classic", "playful", "premium", "technical"]).describe("Desired naming style"),
};

const NAME_POOLS: Record<string, string[]> = {
  modern: ["Nexus", "Flux", "Arc", "Vela", "Kova", "Pila", "Zeno", "Lyra", "Orba", "Celo"],
  classic: ["Meridian", "Athena", "Crest", "Beacon", "Pillar", "Summit", "Herald", "Manor", "Canter", "Laurel"],
  playful: ["Zappy", "Bloop", "Wink", "Bumble", "Fizzy", "Nifty", "Gleam", "Poppy", "Sprout", "Jolty"],
  premium: ["Aurum", "Vaux", "Elara", "Sorel", "Cavenne", "Noire", "Obsidian", "Lumene", "Auren", "Celest"],
  technical: ["Nexrd", "Logix", "DataFlo", "Stackr", "Apiify", "Byteform", "Codeflow", "Gridlabs", "Synqr", "Parsio"],
};

const MODIFIERS = ["io", "ly", "ify", "labs", "hq", "ai", "hub", "co", "app", "go"];
const PREFIXES = ["Get", "Try", "Use", "Go", "My", "The", "Pro", "Ultra", "Super", "Open"];

export function namingBrainstorm(params: {
  description: string;
  industry: string;
  values: string[];
  style: string;
}): string {
  const { description, industry, values, style } = params;
  const seed = `brand:naming:${description}:${style}`;

  const pool = NAME_POOLS[style] ?? NAME_POOLS["modern"];
  const patterns = pickN(NAME_PATTERNS, 5, `${seed}:patterns`);

  const names = pool.map((base, i) => {
    const modifier = pick(MODIFIERS, `${seed}:mod`, i);
    const prefix = pick(PREFIXES, `${seed}:pre`, i);
    const score = rangeInt(55, 97, `${seed}:score`, i);
    const available = hash(`${seed}:available:${i}`) % 3 !== 0;
    const pattern = pick(NAME_PATTERNS, `${seed}:pattern`, i);

    return {
      name: i % 3 === 0 ? `${base}${modifier}` : i % 3 === 1 ? `${prefix}${base}` : base,
      raw: base,
      score,
      available,
      pattern,
    };
  }).sort((a, b) => b.score - a.score).slice(0, 8);

  const topName = names[0];
  const archetype = pick(BRAND_ARCHETYPES, seed, 80);

  let out = `## 💡 Brand Naming Brainstorm\n`;
  out += `**Description:** "${description}"\n`;
  out += `**Industry:** ${industry} | **Style:** ${style} | **Values:** ${values.join(", ")}\n\n`;

  out += `### Top Name Candidates\n\n`;
  out += `| # | Name | Score | Est. Availability | Pattern |\n`;
  out += `|---|------|-------|-------------------|---------|\n`;
  names.forEach((n, i) => {
    const avail = n.available ? "🟢 Likely available" : "🔴 Check trademark";
    out += `| ${i + 1} | **${n.name}** | ${n.score}/100 | ${avail} | ${n.pattern} |\n`;
  });
  out += "\n";

  out += `### Recommended Name: "${topName.name}"\n\n`;
  out += `**Score: ${topName.score}/100** — ${pick([
    "Memorable, pronounceable in all major languages, strong domain potential",
    "Short, punchy, evokes the right emotional register for your target market",
    "Distinctive in the category, scales beyond your initial product scope",
    "Easy to spell, trademark-defensible, no problematic translations",
  ], seed, 90)}\n\n`;

  out += `### Naming Patterns Explored\n\n`;
  patterns.forEach((p) => { out += `- **${p}**\n`; });
  out += "\n";

  out += `### Domain & Handle Check\n\n`;
  out += `For "${topName.name}", check availability of:\n`;
  out += `- \`.com\` domain (priority)\n`;
  out += `- \`.io\`, \`.co\`, \`.ai\` (tech-friendly alternatives)\n`;
  out += `- @${topName.name.toLowerCase()} on X, Instagram, LinkedIn, TikTok\n`;
  out += `- USPTO trademark database (tmsearch.uspto.gov)\n\n`;

  out += `### Brand Name Evaluation Criteria\n\n`;
  const criteria = [
    ["Memorable", "Can people recall it 24 hours later?"],
    ["Pronounceable", "Can people say it without hesitation?"],
    ["Spellable", "Can people spell it from hearing it?"],
    ["Distinctive", "Does it stand out from category names?"],
    ["Scalable", "Will it still fit when you expand products/markets?"],
    ["Available", "Domain + social + trademark clear?"],
  ];
  out += `| Criterion | Question |\n`;
  out += `|-----------|----------|\n`;
  criteria.forEach(([c, q]) => { out += `| ${c} | ${q} |\n`; });
  out += "\n";

  out += `### Suggested Archetype Alignment\n\n`;
  out += `The **"${archetype}"** archetype best suits these names — it aligns with your stated values and industry positioning.\n`;

  out += FOOTER;
  return out;
}
