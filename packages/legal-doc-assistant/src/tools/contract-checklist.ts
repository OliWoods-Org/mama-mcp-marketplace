import { z } from "zod";
import {
  hash, pickN, rangeInt, seededRandom,
  CHECKLIST_ITEMS, CONTRACT_SECTIONS, FOOTER,
} from "../heuristics.js";

export const contractChecklistSchema = {
  contract_type: z.string().describe("Type of contract (e.g. 'SaaS agreement', 'employment contract', 'vendor agreement')"),
  party_role: z.enum(["buyer", "seller", "licensor", "licensee", "employer", "contractor"]).describe("Your role in the contract"),
  value_usd: z.number().optional().describe("Approximate contract value in USD (used to calibrate risk thresholds)"),
};

export function contractChecklist(params: {
  contract_type: string;
  party_role: string;
  value_usd?: number;
}): string {
  const { contract_type, party_role, value_usd } = params;
  const seed = `checklist:${contract_type}:${party_role}:${value_usd ?? 0}`;

  const valueLabel = value_usd
    ? value_usd >= 1_000_000 ? "high-value (≥$1M)"
    : value_usd >= 100_000 ? "mid-market ($100K–$1M)"
    : "small (<$100K)"
    : "undisclosed";

  // Determine how many items in each tier based on contract value
  const criticalCount = value_usd && value_usd >= 500_000 ? rangeInt(5, 7, seed, 0) : rangeInt(3, 5, seed, 0);
  const importantCount = rangeInt(5, 7, seed, 1);
  const niceToHaveCount = rangeInt(3, 5, seed, 2);

  // Shuffle CHECKLIST_ITEMS deterministically
  const shuffled = [...CHECKLIST_ITEMS].sort(
    (a, b) => hash(`${seed}:sort:${a}`) - hash(`${seed}:sort:${b}`)
  );

  const criticalItems = shuffled.slice(0, criticalCount);
  const importantItems = shuffled.slice(criticalCount, criticalCount + importantCount);
  const niceItems = shuffled.slice(criticalCount + importantCount, criticalCount + importantCount + niceToHaveCount);

  // Role-specific guidance
  const roleGuidance: Record<string, string[]> = {
    buyer: [
      "Ensure deliverable acceptance criteria are specific and measurable",
      "Confirm seller's warranty obligations and remedies for defective performance",
      "Verify payment milestones are tied to verifiable completion events",
    ],
    seller: [
      "Confirm payment terms and consequences of late payment are clearly stated",
      "Ensure scope of work is precise to avoid scope creep without additional compensation",
      "Verify limitation of liability protects against disproportionate damage claims",
    ],
    licensor: [
      "Confirm license scope, permitted uses, and sublicensing restrictions",
      "Ensure audit rights allow you to verify royalty calculations",
      "Protect against unlicensed modifications or reverse engineering of your IP",
    ],
    licensee: [
      "Confirm the license grant is broad enough for your intended use case",
      "Verify licensor actually owns the IP being licensed (no third-party claims)",
      "Ensure termination for convenience is available with reasonable notice",
    ],
    employer: [
      "Include IP assignment and confidentiality obligations from day one",
      "Ensure non-solicitation provisions protect your key employees and clients",
      "Verify compliance with applicable employment law in relevant jurisdictions",
    ],
    contractor: [
      "Confirm IP ownership — negotiate to retain rights to pre-existing tools and methodologies",
      "Verify payment terms, invoicing cadence, and late-payment remedies",
      "Ensure any non-compete is narrowly scoped and does not prevent you from working in your field",
    ],
  };

  const roleSpecific = roleGuidance[party_role] || roleGuidance["buyer"];

  // Sections to review
  const sectionsToFlag = pickN(CONTRACT_SECTIONS, rangeInt(4, 6, seed, 50), seed);

  let out = `## Contract Review Checklist\n\n`;
  out += `**Contract Type:** ${contract_type} | **Your Role:** ${party_role} | **Value:** ${valueLabel}\n\n`;

  out += `### How to Use This Checklist\n\n`;
  out += `Work through each item before signing. Check off items as you confirm they are acceptable. Items marked **Critical** should be resolved before execution — do not sign with unresolved critical issues.\n\n`;

  // Critical section
  out += `### Critical — Must Resolve Before Signing\n\n`;
  criticalItems.forEach((item) => {
    out += `- [ ] **${item}**\n`;
  });

  // Role-specific critical items
  roleSpecific.forEach((item) => {
    out += `- [ ] **[${party_role.toUpperCase()}]** ${item}\n`;
  });

  out += `\n### Important — Strongly Recommended\n\n`;
  importantItems.forEach((item) => {
    out += `- [ ] ${item}\n`;
  });

  out += `\n### Nice-to-Have — Best Practice\n\n`;
  niceItems.forEach((item) => {
    out += `- [ ] ${item}\n`;
  });

  // Section-by-section review
  out += `\n### Sections Requiring Careful Review\n\n`;
  out += `| Section | Key Questions | Risk If Missing |\n`;
  out += `|---------|--------------|----------------|\n`;

  const sectionRisks: Record<string, [string, string]> = {
    "Definitions": ["Are all key terms defined consistently throughout the document?", "Ambiguity in key terms leads to disputes about scope"],
    "Scope of Services / Deliverables": ["Is the scope specific enough to prevent disputes about what was promised?", "Scope creep or delivery disputes with no contractual basis"],
    "Term and Termination": ["Do both parties have termination rights? Is there a cure period?", "Being locked in (or locked out) without recourse"],
    "Compensation and Payment": ["Are payment triggers, amounts, and late fees clearly stated?", "Payment disputes and cash-flow disruption"],
    "Intellectual Property": ["Who owns IP created under this contract?", "Losing ownership of valuable work product"],
    "Confidentiality": ["What is covered? How long does the obligation last?", "Inadvertent disclosure or excessive restriction on future work"],
    "Representations and Warranties": ["Are the reps accurate as of signing? Who bears risk if they're wrong?", "Fraud or misrepresentation claims post-signing"],
    "Indemnification": ["Is indemnification mutual? Is there a cap?", "Unlimited liability exposure for third-party claims"],
    "Limitation of Liability": ["What damages are excluded? Does the cap apply to both parties?", "Recovering far less than actual harm in a dispute"],
    "Dispute Resolution": ["Arbitration or litigation? Which jurisdiction? Who pays fees?", "Expensive, slow, or inaccessible dispute process"],
    "Governing Law and Jurisdiction": ["Is the chosen law favorable to your position?", "Adverse law applying to key issues (damages, IP, non-competes)"],
    "General Provisions": ["Does the merger clause accurately reflect the full agreement?", "Side agreements or prior promises becoming unenforceable"],
  };

  sectionsToFlag.forEach((section) => {
    const [question, risk] = sectionRisks[section] || ["Review carefully for completeness", "Gaps that could harm your position"];
    out += `| **${section}** | ${question} | ${risk} |\n`;
  });

  // Value-based note
  if (value_usd && value_usd >= 500_000) {
    out += `\n> 💡 **High-Value Contract Notice:** Given the contract value of $${value_usd.toLocaleString()}, professional legal review is strongly recommended before execution. The cost of legal review is negligible relative to potential exposure.\n`;
  } else if (value_usd && value_usd >= 50_000) {
    out += `\n> 💡 **Mid-Market Contract:** Consider a focused legal review of the indemnification, limitation of liability, and IP sections given the contract value.\n`;
  }

  out += `\n### Summary\n\n`;
  out += `| Category | Items | Status |\n`;
  out += `|----------|-------|--------|\n`;
  out += `| Critical | ${criticalItems.length + roleSpecific.length} | ☐ Not started |\n`;
  out += `| Important | ${importantItems.length} | ☐ Not started |\n`;
  out += `| Nice-to-Have | ${niceItems.length} | ☐ Not started |\n`;
  out += `| **Total** | **${criticalItems.length + roleSpecific.length + importantItems.length + niceItems.length}** | ☐ Not started |\n`;

  out += FOOTER;
  return out;
}
