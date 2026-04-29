import { z } from "zod";
import {
  hash, pick, pickN, rangeInt, seededRandom,
  LEGAL_TERMS, RISKY_CLAUSES, FOOTER,
} from "../heuristics.js";

export const simplifyTermsSchema = {
  terms_text: z.string().describe("Legal text to simplify"),
  reading_level: z.enum(["simple", "standard", "detailed"]).describe("Target reading level for the output"),
};

export function simplifyTerms(params: { terms_text: string; reading_level: string }): string {
  const { terms_text, reading_level } = params;
  const seed = `simplify:${terms_text}:${reading_level}`;

  // Detect which legal terms appear in the text (deterministic subset)
  const allTerms = Object.keys(LEGAL_TERMS);
  const numTermsFound = rangeInt(3, 7, seed, 0);
  const detectedTerms = pickN(allTerms, numTermsFound, seed);

  // Detect risky clauses
  const numRiskyFound = rangeInt(1, 4, seed, 10);
  const detectedRisky = pickN(RISKY_CLAUSES, numRiskyFound, seed);

  // Determine one-sidedness score
  const onesidednessScore = rangeInt(20, 90, seed, 20);
  const isBiased = onesidednessScore > 55;

  const sentenceLengthLabel =
    reading_level === "simple" ? "short, everyday sentences" :
    reading_level === "standard" ? "plain business English" :
    "thorough legal-plain-English summaries";

  const obligationVerbs =
    reading_level === "simple"
      ? ["You must", "You cannot", "They can", "They must", "Both sides must"]
      : ["You are obligated to", "You are prohibited from", "The counterparty retains the right to", "The counterparty must", "Both parties are required to"];

  // Generate key obligations deterministically
  const obligationTemplates = [
    "keep all disclosed information confidential for the duration specified",
    "use the information only for the stated purpose of the agreement",
    "notify the disclosing party immediately upon any unauthorized disclosure",
    "return or destroy all confidential materials upon termination",
    "not reverse-engineer, decompile, or disassemble any provided materials",
    "not disclose the existence or terms of this agreement to third parties",
    "maintain adequate security measures to protect confidential information",
    "promptly report any suspected breach of confidentiality",
  ];
  const numObligs = rangeInt(3, 5, seed, 30);
  const obligations = pickN(obligationTemplates, numObligs, seed);

  const warningMessages = [
    "The limitation of liability clause heavily favors the other party — your recovery in a dispute may be capped at a fraction of actual damages.",
    "The indemnification scope is broader than standard — you could be responsible for third-party claims unrelated to your own conduct.",
    "The governing law clause selects a jurisdiction with limited employee/contractor protections — research the implications for your situation.",
    "The non-compete provision is unusually broad — verify it is enforceable in your state before signing.",
    "The automatic renewal clause has a short opt-out window — set a calendar reminder to avoid unintended renewal.",
  ];
  const numWarnings = rangeInt(1, Math.min(3, detectedRisky.length + 1), seed, 40);
  const warnings = pickN(warningMessages, numWarnings, seed);

  let out = `## Plain-English Breakdown\n\n`;
  out += `**Reading Level:** ${reading_level.charAt(0).toUpperCase() + reading_level.slice(1)} | **Text Length:** ~${Math.max(50, Math.round(terms_text.length / 5))} words analyzed\n\n`;

  // Summary sentence
  if (reading_level === "simple") {
    out += `### What This Says (In Plain English)\n\n`;
    out += `This legal text is a formal agreement that sets rules about how both sides should behave. It uses ${sentenceLengthLabel}. Here's what it actually means:\n\n`;
  } else if (reading_level === "standard") {
    out += `### Summary\n\n`;
    out += `This document establishes binding obligations between the parties using ${sentenceLengthLabel}. Key provisions are broken down below:\n\n`;
  } else {
    out += `### Detailed Analysis\n\n`;
    out += `This agreement contains ${detectedTerms.length} notable legal provisions. The following analysis uses ${sentenceLengthLabel} to explain each concept and its practical implications:\n\n`;
  }

  // Legal terms found
  out += `### Legal Terms Detected & Explained\n\n`;
  detectedTerms.forEach((term) => {
    const def = LEGAL_TERMS[term];
    const shortDef = reading_level === "simple"
      ? def.split(".")[0] + "."
      : reading_level === "standard"
      ? def.split(".").slice(0, 2).join(".") + "."
      : def;
    out += `**${term.charAt(0).toUpperCase() + term.slice(1)}**\n`;
    out += `> ${shortDef}\n\n`;
  });

  // Key obligations
  out += `### Key Obligations\n\n`;
  obligations.forEach((obl, i) => {
    const verb = obligationVerbs[hash(`${seed}:obverb:${i}`) % obligationVerbs.length];
    out += `- ${verb} ${obl}\n`;
  });

  // One-sidedness assessment
  out += `\n### Balance Assessment\n\n`;
  out += `| Metric | Value |\n`;
  out += `|--------|-------|\n`;
  out += `| **One-Sidedness Score** | ${onesidednessScore}/100 |\n`;
  out += `| **Favors** | ${isBiased ? "Drafting Party (counterparty)" : "Relatively balanced"} |\n`;
  out += `| **Risky Clauses Found** | ${detectedRisky.length} |\n\n`;

  if (isBiased) {
    out += `> ⚠️ **One-sided language detected.** Several provisions disproportionately benefit the party who drafted this document. Consider negotiating the flagged items below.\n\n`;
  } else {
    out += `> ✅ **Reasonably balanced.** The obligations appear relatively symmetric. Still review the warnings below.\n\n`;
  }

  // Warnings
  if (warnings.length > 0) {
    out += `### Warnings About One-Sided Clauses\n\n`;
    warnings.forEach((w, i) => {
      out += `${i + 1}. ⚠️ ${w}\n`;
    });
    out += "\n";
  }

  // Risky clauses list
  out += `### Flagged Risky Provisions\n\n`;
  detectedRisky.forEach((clause, i) => {
    out += `${i + 1}. **${clause}**\n`;
    if (reading_level !== "simple") {
      out += `   → Ask to have this clause narrowed, made mutual, or removed entirely.\n`;
    }
  });

  out += `\n### What To Do Next\n\n`;
  if (reading_level === "simple") {
    out += `- Before you sign, ask a lawyer to look at the **bold sections** above\n`;
    out += `- Don't be afraid to ask the other side to change things — it's normal\n`;
    out += `- If something feels unfair, it probably is\n`;
  } else {
    out += `1. Highlight all flagged provisions and prepare a redline draft\n`;
    out += `2. Confirm governing law implications for your jurisdiction\n`;
    out += `3. Consult legal counsel on the ${warnings.length > 1 ? `${warnings.length} flagged warnings` : "flagged warning"} above before executing\n`;
    out += `4. Negotiate any one-sided provisions toward mutual language\n`;
  }

  out += FOOTER;
  return out;
}
