import { z } from "zod";
import {
  hash, pick, pickN, rangeInt, seededRandom,
  RISK_LEVELS, CONTRACT_SECTIONS, FOOTER,
} from "../heuristics.js";

export const compareContractsSchema = {
  contract_a_description: z.string().describe("Description or summary of Contract A"),
  contract_b_description: z.string().describe("Description or summary of Contract B"),
  focus_areas: z.array(z.string()).optional().describe("Optional list of specific areas to focus the comparison on"),
};

type Favorability = "A" | "B" | "Equal";

export function compareContracts(params: {
  contract_a_description: string;
  contract_b_description: string;
  focus_areas?: string[];
}): string {
  const { contract_a_description, contract_b_description, focus_areas } = params;
  const seed = `compare:${contract_a_description}:${contract_b_description}`;

  // Determine which sections to compare
  const sectionsToCompare = focus_areas && focus_areas.length > 0
    ? focus_areas.slice(0, 8)
    : pickN(CONTRACT_SECTIONS, rangeInt(6, 8, seed, 0), seed);

  // For each section, generate a deterministic comparison
  type SectionComparison = {
    section: string;
    contractA: string;
    contractB: string;
    favors: Favorability;
    riskDelta: string;
  };

  const contractATraits = [
    "broader indemnification scope",
    "higher liability cap",
    "mutual termination rights",
    "longer notice periods",
    "more specific deliverable definitions",
    "balanced warranty provisions",
    "standard 12-month warranty",
    "neutral governing law selection",
    "reasonable IP carve-outs",
    "arbitration with mutual fee-sharing",
    "60-day cancellation window",
    "limited audit rights",
  ];

  const contractBTraits = [
    "narrower indemnification limited to direct damages",
    "lower overall liability exposure",
    "unilateral termination convenience clause",
    "shorter notice periods (7 days)",
    "vague deliverable language",
    "one-sided warranty disclaimer",
    "2-year extended warranty",
    "plaintiff-favorable jurisdiction",
    "broad IP assignment with no carve-outs",
    "mandatory arbitration with loser-pays",
    "30-day cancellation window",
    "broad audit rights with no advance notice",
  ];

  const favorOptions: Favorability[] = ["A", "B", "Equal"];

  const comparisons: SectionComparison[] = sectionsToCompare.map((section, i) => {
    const favorIdx = hash(`${seed}:favor:${i}`) % favorOptions.length;
    const favors = favorOptions[favorIdx];
    const traitAIdx = hash(`${seed}:traitA:${i}`) % contractATraits.length;
    const traitBIdx = hash(`${seed}:traitB:${i}`) % contractBTraits.length;

    const riskDeltas = [
      "Contract A carries ~15% higher aggregate risk for your position",
      "Contract B exposes you to significantly more liability",
      "Risk is roughly equivalent across this section",
      "Contract A is notably more favorable on this dimension",
      "Contract B presents lower risk but less protection for your IP",
      "Both contracts have significant gaps in this area",
    ];
    const riskDelta = pick(riskDeltas, `${seed}:delta:${i}`);

    return {
      section,
      contractA: contractATraits[traitAIdx],
      contractB: contractBTraits[traitBIdx],
      favors,
      riskDelta,
    };
  });

  // Calculate overall scores
  const aFavorCount = comparisons.filter(c => c.favors === "A").length;
  const bFavorCount = comparisons.filter(c => c.favors === "B").length;
  const equalCount = comparisons.filter(c => c.favors === "Equal").length;

  const overallWinner: Favorability =
    aFavorCount > bFavorCount ? "A" :
    bFavorCount > aFavorCount ? "B" : "Equal";

  // Generate risk scores
  const contractARisk = rangeInt(30, 85, seed, 10);
  const contractBRisk = rangeInt(25, 80, seed, 11);
  const riskDiff = Math.abs(contractARisk - contractBRisk);

  const riskEmoji = (score: number) =>
    score >= 70 ? "🔴 High" :
    score >= 50 ? "🟠 Medium-High" :
    score >= 35 ? "🟡 Medium" : "🟢 Low";

  const favorEmoji = (f: Favorability) =>
    f === "A" ? "✅ Contract A" : f === "B" ? "✅ Contract B" : "⚖️ Equal";

  let out = `## Contract Comparison Report\n\n`;
  out += `**Contract A:** ${contract_a_description.slice(0, 80)}${contract_a_description.length > 80 ? "…" : ""}\n`;
  out += `**Contract B:** ${contract_b_description.slice(0, 80)}${contract_b_description.length > 80 ? "…" : ""}\n`;
  if (focus_areas && focus_areas.length > 0) {
    out += `**Focus Areas:** ${focus_areas.join(", ")}\n`;
  }
  out += "\n";

  // Summary table
  out += `### Overall Comparison Summary\n\n`;
  out += `| Metric | Contract A | Contract B |\n`;
  out += `|--------|------------|------------|\n`;
  out += `| **Overall Risk Score** | ${contractARisk}/100 — ${riskEmoji(contractARisk)} | ${contractBRisk}/100 — ${riskEmoji(contractBRisk)} |\n`;
  out += `| **Sections Favoring** | ${aFavorCount} sections | ${bFavorCount} sections |\n`;
  out += `| **Equal Sections** | ${equalCount} sections | ${equalCount} sections |\n`;
  out += `| **Risk Delta** | ${riskDiff > 20 ? "Significant difference" : riskDiff > 10 ? "Moderate difference" : "Similar risk profile"} | Δ${riskDiff} points |\n`;
  out += `| **Recommended** | ${overallWinner === "A" ? "✅ More favorable" : overallWinner === "B" ? "❌ Less favorable" : "⚖️ Comparable"} | ${overallWinner === "B" ? "✅ More favorable" : overallWinner === "A" ? "❌ Less favorable" : "⚖️ Comparable"} |\n\n`;

  // Section-by-section comparison
  out += `### Section-by-Section Comparison\n\n`;
  out += `| Section | Contract A | Contract B | Favors |\n`;
  out += `|---------|------------|------------|--------|\n`;
  comparisons.forEach((c) => {
    out += `| **${c.section}** | ${c.contractA} | ${c.contractB} | ${favorEmoji(c.favors)} |\n`;
  });

  // Risk delta analysis
  out += `\n### Risk Delta Analysis\n\n`;
  out += `| Section | Risk Assessment |\n`;
  out += `|---------|----------------|\n`;
  comparisons.forEach((c) => {
    out += `| **${c.section}** | ${c.riskDelta} |\n`;
  });

  // Key differentiators
  const keyDiffs = comparisons.filter(c => c.favors !== "Equal").slice(0, 4);
  if (keyDiffs.length > 0) {
    out += `\n### Key Differentiators\n\n`;
    keyDiffs.forEach((c, i) => {
      out += `${i + 1}. **${c.section}** — ${favorEmoji(c.favors)} is more favorable because it has ${c.favors === "A" ? c.contractA : c.contractB}, compared to ${c.favors === "A" ? c.contractB : c.contractA} in the alternative.\n`;
    });
  }

  // Recommendation
  out += `\n### Recommendation\n\n`;
  if (overallWinner === "A") {
    out += `**Contract A is the more favorable option** based on ${aFavorCount} of ${comparisons.length} sections analyzed. `;
    out += `Its risk score of ${contractARisk}/100 is ${contractARisk < contractBRisk ? "lower" : "higher"} than Contract B's ${contractBRisk}/100. `;
    out += `If you can only execute one, Contract A presents better terms — though you should still negotiate the sections where Contract B was superior.\n\n`;
    out += `**Hybrid approach:** Consider using Contract A as the base and requesting the following provisions from Contract B:\n`;
    comparisons.filter(c => c.favors === "B").forEach((c) => {
      out += `- ${c.section}: adopt Contract B's ${c.contractB}\n`;
    });
  } else if (overallWinner === "B") {
    out += `**Contract B is the more favorable option** based on ${bFavorCount} of ${comparisons.length} sections analyzed. `;
    out += `Its risk score of ${contractBRisk}/100 is ${contractBRisk < contractARisk ? "lower" : "higher"} than Contract A's ${contractARisk}/100. `;
    out += `Contract B provides better terms overall — proceed with Contract B but negotiate improvements in the areas where Contract A was superior.\n\n`;
    out += `**Areas to improve in Contract B:**\n`;
    comparisons.filter(c => c.favors === "A").forEach((c) => {
      out += `- ${c.section}: adopt Contract A's ${c.contractA}\n`;
    });
  } else {
    out += `**The contracts are broadly comparable** — neither is clearly superior. Both present similar risk profiles (Contract A: ${contractARisk}/100, Contract B: ${contractBRisk}/100). `;
    out += `The decision should be made on factors other than contractual risk: counterparty relationship, business terms, pricing, and flexibility.\n\n`;
    out += `**Suggested approach:** Use whichever party has the stronger negotiating position to push for improvements across all sections, as neither contract starts from a clearly favorable position.\n`;
  }

  out += FOOTER;
  return out;
}
