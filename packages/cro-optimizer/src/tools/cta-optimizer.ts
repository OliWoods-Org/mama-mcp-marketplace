import { z } from "zod";
import {
  pick, pickN, rangeInt, rangeFloat,
  CTA_VERBS, PAGE_ELEMENTS, FOOTER,
} from "../heuristics.js";

export const ctaOptimizerSchema = {
  current_cta: z.string().describe("Your current CTA text (e.g. 'Submit', 'Sign Up', 'Get Started')"),
  goal: z.string().describe("What the CTA should drive (e.g. 'free trial', 'demo booking', 'purchase', 'download')"),
  product_or_service: z.string().describe("Brief description of your product or service"),
  placement: z.enum(["hero", "pricing", "checkout", "email", "popup", "footer"]).describe("Where this CTA appears"),
};

const CTA_FRAMEWORKS = [
  "Value + Action: '[Get/Start/Claim] [specific benefit]'",
  "Risk Reversal: '[Action] — no [credit card/commitment/contract] required'",
  "Urgency: '[Action] [benefit] today / now / in minutes'",
  "Social Proof: 'Join [X] [customers/teams/users] doing [benefit]'",
  "Outcome-led: '[Action] and [result] in [timeframe]'",
];

const BUTTON_COLORS: Record<string, string> = {
  "hero": "Bright orange or green — maximum contrast against hero background",
  "pricing": "Brand primary color — builds trust and feels intentional",
  "checkout": "Green (#28A745 or similar) — universally associated with 'go'",
  "email": "Orange or blue — standout against white email backgrounds",
  "popup": "Brand primary with white text — high contrast in modal context",
  "footer": "Secondary brand color — low-pressure, discovery-focused",
};

export function ctaOptimizer(params: {
  current_cta: string;
  goal: string;
  product_or_service: string;
  placement: string;
}): string {
  const { current_cta, goal, product_or_service, placement } = params;
  const seed = `cro:cta:${current_cta}:${goal}:${placement}`;

  const currentScore = rangeInt(20, 55, seed, 0);
  const v1 = pick(CTA_VERBS, seed, 10);
  const v2 = pick(CTA_VERBS, seed, 11);
  const v3 = pick(CTA_VERBS, seed, 12);
  const expectedLift = rangeFloat(12, 48, seed, 1);

  const ctaVariants = [
    { text: `${v1} Your Free ${pick(["Trial", "Access", "Account", "Dashboard"], seed, 20)} — No Card Needed`, score: rangeInt(72, 94, seed, 21) },
    { text: `${v2} ${pick(["Instantly", "Now", "in 60 Seconds", "Today"], seed, 22)}`, score: rangeInt(65, 88, seed, 23) },
    { text: `Join ${rangeInt(500, 50000, seed, 24).toLocaleString()}+ ${pick(["Businesses", "Teams", "Marketers", "Users", "Founders"], seed, 25)} — ${v3} Free`, score: rangeInt(60, 85, seed, 26) },
    { text: `${v1} My Free ${pick(["Demo", "Report", "Analysis", "Trial", "Plan"], seed, 27)}`, score: rangeInt(65, 90, seed, 28) },
    { text: `Start ${pick(["Saving", "Growing", "Converting", "Ranking", "Winning"], seed, 29)} Today — ${pick(["Free", "No Risk", "Cancel Anytime"], seed, 30)}`, score: rangeInt(68, 92, seed, 31) },
  ].sort((a, b) => b.score - a.score);

  const topVariant = ctaVariants[0];
  const framework = pick(CTA_FRAMEWORKS, seed, 40);
  const buttonColor = BUTTON_COLORS[placement] ?? BUTTON_COLORS["hero"];

  let out = `## 🎯 CTA Optimizer\n`;
  out += `**Current CTA:** "${current_cta}" | **Goal:** ${goal}\n`;
  out += `**Product:** ${product_or_service} | **Placement:** ${placement}\n\n`;

  out += `### Current CTA Diagnosis\n\n`;
  out += `**Score: ${currentScore}/100** — ${currentScore < 35 ? "❌ Weak — generic, low intent, low urgency" : currentScore < 55 ? "⚠️ Average — works but leaves conversion on the table" : "✅ Good — small improvements can still lift CVR"}\n\n`;

  const issues: string[] = [];
  if (current_cta.toLowerCase().includes("submit")) issues.push('"Submit" is the worst-performing CTA word — no value, transactional feel');
  if (current_cta.split(" ").length <= 2) issues.push("Too short — no benefit communicated, no urgency");
  if (!current_cta.match(/free|trial|now|today|get|start|claim/i)) issues.push("Missing a value or urgency signal");
  if (issues.length === 0) issues.push(`Consider adding specificity: what exactly does the user get by clicking?`);
  issues.forEach((issue) => { out += `- ⚠️ ${issue}\n`; });
  out += "\n";

  out += `### 5 Optimized CTA Variants\n\n`;
  out += `| # | CTA Text | CTR Score |\n`;
  out += `|---|----------|----------|\n`;
  ctaVariants.forEach((v, i) => {
    const star = i === 0 ? " ⭐" : "";
    out += `| ${i + 1} | "${v.text}"${star} | ${v.score}/100 |\n`;
  });
  out += "\n";

  out += `### Recommended CTA\n\n`;
  out += `> **"${topVariant.text}"**\n\n`;
  out += `Expected conversion lift: **+${expectedLift.toFixed(0)}%** vs current\n\n`;

  out += `### Framework Used\n\n`;
  out += `**${framework}**\n\n`;

  out += `### Button Design\n\n`;
  out += `**Color for ${placement}:** ${buttonColor}\n`;
  out += `**Size:** Large enough to tap on mobile (min 44px height)\n`;
  out += `**Font:** Bold, 16–18px\n`;
  out += `**Whitespace:** Surround with at least 20px padding on all sides\n\n`;

  out += `### Supporting Copy (Above/Below the Button)\n\n`;
  out += `**Above:** ${pick(["Used by 10,000+ teams", "Trusted by leading brands", "No setup required", "2-minute setup"], seed, 50)}\n`;
  out += `**Below:** ${pick(["No credit card required", "Cancel anytime", "14-day free trial", "30-day money-back guarantee", "Free forever plan available"], seed, 51)}\n`;

  out += FOOTER;
  return out;
}
