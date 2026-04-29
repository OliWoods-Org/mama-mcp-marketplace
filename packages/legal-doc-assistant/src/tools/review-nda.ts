import { z } from "zod";
import {
  hash, pick, pickN, rangeInt, seededRandom,
  RISK_LEVELS, RISKY_CLAUSES, FOOTER,
} from "../heuristics.js";

export const reviewNdaSchema = {
  company_name: z.string().describe("Name of the company presenting the NDA"),
  nda_type: z.enum(["mutual", "one-way"]).describe("Whether the NDA is mutual (both parties) or one-way (only one party discloses)"),
  context: z.string().describe("Brief description of the business context or purpose of the NDA"),
};

export function reviewNda(params: { company_name: string; nda_type: string; context: string }): string {
  const { company_name, nda_type, context } = params;
  const seed = `review-nda:${company_name}:${nda_type}:${context}`;

  // Generate 4–5 specific findings deterministically
  const numFindings = rangeInt(4, 5, seed, 0);
  const selectedClauses = pickN(RISKY_CLAUSES, numFindings, seed);

  // Assign risk levels deterministically
  const findings = selectedClauses.map((clause, i) => {
    const riskIdx = hash(`${seed}:risk:${i}`) % RISK_LEVELS.length;
    const risk = RISK_LEVELS[riskIdx];
    return { clause, risk, index: i };
  });

  // Sort by risk severity descending
  const riskOrder: Record<string, number> = { Critical: 3, High: 2, Medium: 1, Low: 0 };
  findings.sort((a, b) => riskOrder[b.risk] - riskOrder[a.risk]);

  // Overall risk score based on findings
  const riskWeights: Record<string, number> = { Critical: 25, High: 15, Medium: 8, Low: 3 };
  const rawScore = findings.reduce((sum, f) => sum + riskWeights[f.risk], 0);
  const overallScore = Math.min(100, rawScore + rangeInt(5, 15, seed, 99));
  const overallRisk =
    overallScore >= 75 ? "Critical" :
    overallScore >= 55 ? "High" :
    overallScore >= 35 ? "Medium" : "Low";

  const riskEmoji: Record<string, string> = {
    Critical: "🔴",
    High: "🟠",
    Medium: "🟡",
    Low: "🟢",
  };

  const recommendations: Record<string, string[]> = {
    "Broad IP assignment covering all inventions, including those developed outside work hours or with personal resources": [
      "Limit IP assignment to work specifically related to the NDA's defined purpose",
      "Add a carve-out for pre-existing IP and inventions developed without company resources",
    ],
    "Unlimited indemnification obligation with no liability cap and broad third-party coverage": [
      "Negotiate a mutual indemnification structure",
      "Cap indemnification at contract value or a fixed dollar amount",
    ],
    "Unilateral right to modify contract terms without notice or consent": [
      "Require written consent from both parties for any material amendments",
      "Add a minimum 30-day notice period for any unilateral changes",
    ],
    "Auto-renewal clause with short cancellation window (less than 30 days notice required)": [
      "Negotiate a 60–90 day cancellation notice window",
      "Add calendar reminders well in advance of renewal dates",
    ],
    "Mandatory arbitration in a distant jurisdiction with loser-pays fee-shifting": [
      "Negotiate arbitration in your home jurisdiction or a neutral location",
      "Remove loser-pays provision or cap fee exposure",
    ],
    "Non-compete spanning more than 2 years or covering an overly broad geographic area": [
      "Limit non-compete to 12 months and the specific markets where you compete",
      "Verify enforceability under your state's law — many states void broad non-competes",
    ],
    "Perpetual confidentiality obligation with no carve-outs for publicly available information": [
      "Limit confidentiality duration to 2–5 years for non-trade-secret information",
      "Add standard carve-outs: publicly known, independently developed, required by law",
    ],
    "One-sided termination rights allowing only one party to terminate for convenience": [
      "Negotiate mutual termination for convenience with reasonable notice (30–60 days)",
      "Ensure both parties have equivalent exit rights",
    ],
    "Waiver of consequential and punitive damages only benefiting the drafting party": [
      "Make the damages waiver mutual, or remove it entirely",
      "Ensure both parties face equivalent liability exposure",
    ],
    "Audit rights allowing unrestricted access to books, records, and facilities": [
      "Limit audit scope to records directly relevant to the NDA purpose",
      "Require reasonable advance notice (at least 10 business days) for audits",
    ],
    "Assignment clause permitting transfer of contract to any third party without consent": [
      "Require written consent for assignment to competitors or unaffiliated third parties",
      "Allow assignment only in connection with a merger, acquisition, or sale of substantially all assets",
    ],
    "Warranty disclaimer excluding ALL implied warranties (merchantability, fitness for purpose)": [
      "Retain implied fitness for purpose warranty in the context of the NDA's stated use",
      "Negotiate a baseline warranty that disclosed information is accurate and not misleading",
    ],
    "Confession of judgment clause allowing immediate court enforcement without notice": [
      "Remove this clause entirely — it is banned in many states and extremely one-sided",
      "Replace with a standard dispute resolution process with notice and cure periods",
    ],
    "Governing law in a plaintiff-favorable jurisdiction inconsistent with the contract's subject matter": [
      "Negotiate governing law in your home state or the state with the most connection to the agreement",
      "Confirm chosen jurisdiction's laws are favorable on key issues (damages, non-competes, etc.)",
    ],
    "Liquidated damages clause set far above any plausible actual loss (penalty in disguise)": [
      "Negotiate liquidated damages to reflect a genuine pre-estimate of likely harm",
      "Courts may void penalty clauses — but litigation is costly regardless",
    ],
  };

  const oneWayNote = nda_type === "one-way"
    ? `\n> **Note:** This is a **one-way NDA** — only ${company_name} is disclosing confidential information. You bear all disclosure risk; ensure protections are strong.\n`
    : `\n> **Note:** This is a **mutual NDA** — both parties disclose confidential information. Obligations should be balanced and symmetric.\n`;

  let out = `## NDA Review: ${company_name}\n\n`;
  out += `**Type:** ${nda_type === "mutual" ? "Mutual" : "One-Way"} | **Context:** ${context}\n`;
  out += oneWayNote + "\n";

  out += `### Overall Risk Assessment\n\n`;
  out += `| Metric | Value |\n`;
  out += `|--------|-------|\n`;
  out += `| **Overall Risk Score** | ${overallScore}/100 |\n`;
  out += `| **Risk Level** | ${riskEmoji[overallRisk]} ${overallRisk} |\n`;
  out += `| **Flagged Clauses** | ${findings.length} |\n`;
  out += `| **Critical Issues** | ${findings.filter(f => f.risk === "Critical").length} |\n`;
  out += `| **High Issues** | ${findings.filter(f => f.risk === "High").length} |\n\n`;

  out += `### Flagged Clauses\n\n`;
  out += `| # | Risk | Clause | Explanation | Recommendation |\n`;
  out += `|---|------|--------|-------------|----------------|\n`;

  findings.forEach((f, i) => {
    const rec = (recommendations[f.clause] || ["Review with legal counsel before signing"])[0];
    out += `| ${i + 1} | ${riskEmoji[f.risk]} **${f.risk}** | ${f.clause} | This provision is potentially one-sided and may expose you to disproportionate risk, especially in the context of ${context.slice(0, 40)}… | ${rec} |\n`;
  });

  out += `\n### Detailed Findings\n\n`;
  findings.forEach((f, i) => {
    const recs = recommendations[f.clause] || ["Review with qualified legal counsel before signing"];
    out += `#### ${i + 1}. ${riskEmoji[f.risk]} ${f.risk} Risk: ${f.clause.slice(0, 60)}${f.clause.length > 60 ? "…" : ""}\n\n`;
    out += `**Why it matters:** This clause could significantly impact your legal position in the context of ${context}. `;
    if (f.risk === "Critical") {
      out += `This is a **deal-breaking issue** that should be resolved before signing.\n\n`;
    } else if (f.risk === "High") {
      out += `This is a **significant concern** that warrants negotiation.\n\n`;
    } else if (f.risk === "Medium") {
      out += `This is **worth discussing** in negotiations to reduce future friction.\n\n`;
    } else {
      out += `This is a **minor issue** — understand it, but it may be acceptable depending on the relationship.\n\n`;
    }
    out += `**Recommendations:**\n`;
    recs.forEach(r => { out += `- ${r}\n`; });
    out += "\n";
  });

  out += `### Next Steps\n\n`;
  if (overallRisk === "Critical" || overallRisk === "High") {
    out += `1. **Do not sign** without legal counsel reviewing this NDA\n`;
    out += `2. Prepare a redline addressing the ${findings.filter(f => ["Critical", "High"].includes(f.risk)).length} critical/high-risk clauses\n`;
    out += `3. Request a negotiation session with ${company_name}'s legal team\n`;
    out += `4. Consider whether this NDA reflects the intended business relationship\n`;
  } else {
    out += `1. Review the flagged clauses with your legal advisor\n`;
    out += `2. Prepare a brief redline for the medium-risk provisions\n`;
    out += `3. Confirm the NDA scope matches the actual information to be shared\n`;
    out += `4. Proceed to signature once issues are resolved\n`;
  }

  out += FOOTER;
  return out;
}
