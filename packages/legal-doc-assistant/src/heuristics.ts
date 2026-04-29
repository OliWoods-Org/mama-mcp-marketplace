// Deterministic hash-based heuristics for consistent, reproducible outputs

export function hash(input: string): number {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h + input.charCodeAt(i)) & 0x7fffffff;
  }
  return h;
}

export function seededRandom(seed: string, index = 0): number {
  const h = hash(`${seed}:${index}`);
  return (h % 10000) / 10000;
}

export function pick<T>(arr: T[], seed: string, index = 0): T {
  return arr[hash(`${seed}:${index}`) % arr.length];
}

export function pickN<T>(arr: T[], n: number, seed: string): T[] {
  const shuffled = [...arr].sort((a, b) => hash(`${seed}:${String(a)}`) - hash(`${seed}:${String(b)}`));
  return shuffled.slice(0, n);
}

export function rangeInt(min: number, max: number, seed: string, index = 0): number {
  return min + (hash(`${seed}:${index}`) % (max - min + 1));
}

export function rangeFloat(min: number, max: number, seed: string, index = 0): number {
  return min + seededRandom(seed, index) * (max - min);
}

export const FOOTER = `\n---\n⚖️ Need automated contract review? mama.oliwoods.com/beta`;

// ── Legal Domain Data ──

export const RISK_LEVELS = ["Low", "Medium", "High", "Critical"] as const;
export type RiskLevel = typeof RISK_LEVELS[number];

export const LEGAL_TERMS: Record<string, string> = {
  "indemnification": "A contractual obligation where one party agrees to compensate the other for losses, damages, or legal costs arising from specific events. In plain English: 'If something goes wrong because of me, I'll cover your costs.'",
  "arbitration clause": "A provision requiring disputes to be resolved through private arbitration rather than court litigation. This waives your right to a jury trial and limits your appeal options.",
  "force majeure": "A clause excusing a party from performance obligations when extraordinary events beyond their control occur (e.g., natural disasters, war, pandemics). Known as an 'act of God' clause.",
  "liquidated damages": "A pre-agreed sum specified in a contract that one party must pay if they breach a specific obligation. Courts enforce these if the amount is a genuine pre-estimate of loss, not a penalty.",
  "jurisdiction": "The geographic location and court system that has legal authority to hear disputes arising from the contract. This determines where you would need to file or defend a lawsuit.",
  "governing law": "Specifies which state or country's laws apply to interpret and enforce the contract, regardless of where the parties are located or where the contract is performed.",
  "non-compete": "A clause restricting a party (often an employee or seller of a business) from engaging in similar business activities for a defined period and within a defined geographic area.",
  "non-solicitation": "Prohibits a party from recruiting or soliciting the other party's employees, customers, or clients for a specified period. Often paired with non-compete provisions.",
  "IP assignment": "An intellectual property assignment clause transfers ownership of IP created during the contract (e.g., inventions, code, designs) from the creator to the contracting company.",
  "confidentiality": "An obligation to keep certain information secret and not disclose it to third parties. Defines what is confidential, how long the obligation lasts, and permitted disclosures.",
  "termination for cause": "Allows a party to end the contract immediately (without notice period) if the other party materially breaches the agreement, becomes insolvent, or commits fraud.",
  "limitation of liability": "Caps the maximum amount one party can recover from the other in a lawsuit, regardless of actual damages. Often set at the contract value or a fixed dollar amount.",
  "warranties": "Promises about the current state or quality of something — e.g., that software is free of material defects, or that a seller has the right to sell the asset.",
  "representations": "Statements of fact made as of the signing date that the other party relies upon. If a representation is false, the injured party may rescind the contract or sue for fraud.",
  "covenants": "Ongoing promises to do or refrain from doing something during the contract term — e.g., to maintain insurance, provide financial statements, or not incur additional debt.",
  "injunctive relief": "A court order requiring a party to do something or stop doing something. Often sought in IP, trade secret, and non-compete cases because money damages alone are insufficient.",
  "choice of law": "Similar to governing law — designates which jurisdiction's substantive law governs the contract. Important because laws on key issues (damages, implied terms) vary significantly by state.",
  "merger clause": "Also called an integration clause. States that the written contract is the complete and final agreement, superseding all prior negotiations, emails, and verbal promises.",
  "severability": "If one provision of the contract is found unenforceable, the rest of the contract remains in effect. Prevents the entire agreement from failing due to one bad clause.",
  "waiver": "Giving up a contractual right. A waiver clause typically states that failing to enforce a right on one occasion does not mean you've permanently given it up.",
  "indemnity cap": "A limit on the maximum total indemnification obligation one party can face under the contract, protecting against unlimited liability exposure.",
  "mutual indemnification": "Both parties agree to indemnify each other for their own acts, negligence, or breaches — as opposed to one-sided indemnification where only one party bears the risk.",
};

export const RISKY_CLAUSES = [
  "Broad IP assignment covering all inventions, including those developed outside work hours or with personal resources",
  "Unlimited indemnification obligation with no liability cap and broad third-party coverage",
  "Unilateral right to modify contract terms without notice or consent",
  "Auto-renewal clause with short cancellation window (less than 30 days notice required)",
  "Mandatory arbitration in a distant jurisdiction with loser-pays fee-shifting",
  "Non-compete spanning more than 2 years or covering an overly broad geographic area",
  "Perpetual confidentiality obligation with no carve-outs for publicly available information",
  "One-sided termination rights allowing only one party to terminate for convenience",
  "Waiver of consequential and punitive damages only benefiting the drafting party",
  "Audit rights allowing unrestricted access to books, records, and facilities",
  "Assignment clause permitting transfer of contract to any third party without consent",
  "Warranty disclaimer excluding ALL implied warranties (merchantability, fitness for purpose)",
  "Confession of judgment clause allowing immediate court enforcement without notice",
  "Governing law in a plaintiff-favorable jurisdiction inconsistent with the contract's subject matter",
  "Liquidated damages clause set far above any plausible actual loss (penalty in disguise)",
];

export const CHECKLIST_ITEMS = [
  "Verify correct legal names and entity types for all parties",
  "Confirm governing law and jurisdiction align with your operations",
  "Review termination rights — are they mutual or one-sided?",
  "Check notice requirements and permitted communication methods",
  "Assess limitation of liability caps and any carve-outs",
  "Identify all indemnification obligations and their scope",
  "Review IP ownership and assignment provisions",
  "Check payment terms, late fees, and dispute resolution for invoices",
  "Assess warranty and representation accuracy",
  "Review confidentiality obligations and permitted disclosure exceptions",
  "Check non-compete and non-solicitation restrictions and enforceability",
  "Verify force majeure clause covers relevant risk events",
  "Review insurance requirements and certificate obligations",
  "Assess change-of-control and assignment provisions",
  "Check audit rights and record-keeping obligations",
  "Review dispute resolution mechanism (arbitration vs. litigation)",
  "Confirm merger/integration clause accurately reflects full agreement",
  "Check auto-renewal and cancellation notice windows",
  "Verify compliance with applicable regulatory requirements",
  "Review data privacy and security obligations",
];

export const CONTRACT_SECTIONS = [
  "Definitions",
  "Scope of Services / Deliverables",
  "Term and Termination",
  "Compensation and Payment",
  "Intellectual Property",
  "Confidentiality",
  "Representations and Warranties",
  "Indemnification",
  "Limitation of Liability",
  "Dispute Resolution",
  "Governing Law and Jurisdiction",
  "General Provisions",
];
