import { z } from "zod";
import {
  pick, pickN, rangeInt,
  BRAND_ARCHETYPES, VOICE_TONES, FOOTER,
} from "../heuristics.js";

export const brandVoiceSchema = {
  brand_name: z.string().describe("Brand name"),
  audience: z.string().describe("Primary audience (e.g. 'B2B SaaS founders', 'millennial parents', 'enterprise IT teams')"),
  personality_words: z.array(z.string()).min(2).max(5).describe("3–5 words that describe your brand personality"),
  channel: z.enum(["all", "social_media", "email", "website", "ads", "support"]).describe("Channel to define voice for"),
};

const VOICE_DIMENSIONS = [
  ["Formal", "Casual"],
  ["Serious", "Playful"],
  ["Corporate", "Human"],
  ["Complex", "Simple"],
  ["Reserved", "Bold"],
];

const SENTENCE_EXAMPLES: Record<string, { weak: string; strong: string }> = {
  "authoritative": {
    weak: "Our platform helps you do things better.",
    strong: "Ship production-ready features 3x faster — without sacrificing code quality.",
  },
  "playful": {
    weak: "We make it easy to manage your tasks.",
    strong: "Finally, a to-do app that doesn't make you want to throw your laptop.",
  },
  "empathetic": {
    weak: "We understand your challenges.",
    strong: "We built this because we were drowning in the same problem — and couldn't find a tool that actually helped.",
  },
  "bold": {
    weak: "Our product is good for most businesses.",
    strong: "Stop settling for 'good enough.' Your customers deserve better — and now you can give it to them.",
  },
  "conversational": {
    weak: "Leverage our platform to achieve your business objectives.",
    strong: "Here's how it works: you connect your tools, set your goals, and we handle the rest.",
  },
};

export function brandVoice(params: {
  brand_name: string;
  audience: string;
  personality_words: string[];
  channel: string;
}): string {
  const { brand_name, audience, personality_words, channel } = params;
  const seed = `brand:voice:${brand_name}:${audience}`;

  const primaryTone = pick(VOICE_TONES, seed, 0);
  const secondaryTone = pick(VOICE_TONES, seed, 1);
  const archetype = pick(BRAND_ARCHETYPES, seed, 2);

  const dimensions = VOICE_DIMENSIONS.map(([low, high], i) => {
    const score = rangeInt(2, 8, seed, i + 10);
    const bar = low.padEnd(12) + "◉".padStart(score).padEnd(10, "·") + high;
    return { low, high, score, bar };
  });

  const example = VOICE_EXAMPLES[primaryTone] ?? {
    weak: "We help businesses achieve their goals.",
    strong: `${brand_name} gives ${audience} the tools to do what they do best.`,
  };

  const doList = pickN([
    `Address ${audience} directly — speak to one person, not a crowd`,
    "Use concrete numbers and specifics over vague claims",
    "Lead with the outcome, follow with the mechanism",
    "Match the vocabulary of your audience — no more, no less",
    "Use contractions — 'you'll', 'we're', 'it's' — to sound human",
    "Write headlines that stand alone as complete thoughts",
    "Use 'because' to explain reasoning — it builds trust",
    "Acknowledge trade-offs honestly — it signals confidence",
  ], 4, `${seed}:do`);

  const dontList = pickN([
    "Use industry jargon your audience doesn't use themselves",
    "Start sentences with 'We are excited to announce'",
    "Use passive voice: 'It was decided' → 'We decided'",
    "Make claims you can't immediately back up with proof",
    "Bury the key benefit below the fold or in the last sentence",
    "Use vague intensifiers: 'very', 'really', 'extremely'",
    "Describe features without connecting them to outcomes",
    "Write 4-sentence paragraphs when 2 will do",
  ], 4, `${seed}:dont`);

  const channelLabel = channel === "all" ? "All Channels" : channel.replace(/_/g, " ");

  let out = `## 🗣️ Brand Voice Guide: ${brand_name}\n`;
  out += `**Audience:** ${audience} | **Channel:** ${channelLabel}\n`;
  out += `**Personality words:** ${personality_words.join(", ")}\n\n`;

  out += `### Voice DNA\n\n`;
  out += `| Attribute | Definition |\n`;
  out += `|-----------|----------|\n`;
  out += `| Primary Tone | **${primaryTone}** |\n`;
  out += `| Secondary Tone | **${secondaryTone}** |\n`;
  out += `| Brand Archetype | **${archetype}** |\n`;
  out += `| Voice Positioning | ${pick(["Thoughtful authority", "Warm challenger", "Confident guide", "Relatable expert", "Bold innovator"], seed, 30)} |\n\n`;

  out += `### Voice Spectrum\n\n`;
  out += `\`\`\`\n`;
  dimensions.forEach(({ bar }) => { out += `${bar}\n`; });
  out += `\`\`\`\n\n`;

  out += `### Before & After: Voice in Action\n\n`;
  out += `**Weak copy:**\n> "${example.weak}"\n\n`;
  out += `**Strong ${brand_name} copy:**\n> "${example.strong}"\n\n`;

  out += `### Voice Rules for ${channelLabel}\n\n`;
  out += `**Do:**\n`;
  doList.forEach((d) => { out += `- ✅ ${d}\n`; });
  out += "\n**Don't:**\n";
  dontList.forEach((d) => { out += `- ❌ ${d}\n`; });
  out += "\n";

  out += `### Channel-Specific Guidance\n\n`;
  const guidance: Record<string, string> = {
    social_media: "Short, punchy, one idea per post. Use questions to drive comments. Conversational > corporate.",
    email: "Subject line does 80% of the work. First line = hook. No fluff. One CTA per email.",
    website: "Homepage has 8 seconds. Lead with the outcome. Save features for product pages.",
    ads: "Problem → solution → CTA in 6 words or less. Show don't tell.",
    support: "Warm, empathetic, solution-first. Never say 'I understand your frustration' — just fix it.",
    all: "Consistency across channels builds trust. The voice should feel like the same person wrote everything.",
  };
  out += `> ${guidance[channel] ?? guidance["all"]}\n`;

  out += FOOTER;
  return out;
}

const VOICE_EXAMPLES: Record<string, { weak: string; strong: string }> = {
  "authoritative": {
    weak: "Our platform helps you do things better.",
    strong: "Ship production-ready features 3x faster — without sacrificing code quality.",
  },
  "playful": {
    weak: "We make it easy to manage your tasks.",
    strong: "Finally, a to-do app that doesn't make you want to throw your laptop.",
  },
  "empathetic": {
    weak: "We understand your challenges.",
    strong: "We built this because we were drowning in the same problem — and couldn't find a tool that actually helped.",
  },
  "bold": {
    weak: "Our product is good for most businesses.",
    strong: "Stop settling for 'good enough.' Your customers deserve better — and now you can give it to them.",
  },
  "conversational": {
    weak: "Leverage our platform to achieve your business objectives.",
    strong: "Here's how it works: connect your tools, set your goals, and we handle the rest.",
  },
  "minimalist": {
    weak: "We offer a wide range of features for all types of users.",
    strong: "One tool. Every channel. No complexity.",
  },
  "inspirational": {
    weak: "We want to help you succeed.",
    strong: "The version of you that ships faster, earns more, and stresses less — it starts today.",
  },
  "technical": {
    weak: "Our API is good and easy to use.",
    strong: "RESTful API, 99.99% uptime SLA, sub-50ms P95 latency. Built to handle your scale.",
  },
  "premium": {
    weak: "We offer high quality products.",
    strong: "Crafted for those who refuse to compromise on the details that define excellence.",
  },
  "rebellious": {
    weak: "We're different from other companies.",
    strong: "The whole industry said it couldn't be done. We disagreed.",
  },
};
