import { z } from "zod";
import {
  hash, pick, pickN,
  LEGAL_TERMS, FOOTER,
} from "../heuristics.js";

export const legalTermLookupSchema = {
  term: z.string().describe("Legal term to look up"),
  context: z.enum(["contract", "litigation", "ip", "employment", "corporate"])
    .optional()
    .describe("Legal context to tailor the explanation"),
};

// Related terms graph — maps each term to likely related terms
const RELATED_TERMS: Record<string, string[]> = {
  "indemnification": ["limitation of liability", "warranties", "representations", "indemnity cap", "mutual indemnification"],
  "arbitration clause": ["choice of law", "jurisdiction", "governing law", "dispute resolution", "injunctive relief"],
  "force majeure": ["termination for cause", "covenants", "representations", "warranties"],
  "liquidated damages": ["limitation of liability", "indemnification", "warranties", "injunctive relief"],
  "jurisdiction": ["governing law", "choice of law", "arbitration clause"],
  "governing law": ["choice of law", "jurisdiction", "merger clause"],
  "non-compete": ["non-solicitation", "confidentiality", "IP assignment"],
  "non-solicitation": ["non-compete", "confidentiality", "covenants"],
  "IP assignment": ["confidentiality", "non-compete", "warranties", "representations"],
  "confidentiality": ["non-compete", "non-solicitation", "IP assignment", "merger clause"],
  "termination for cause": ["covenants", "representations", "warranties", "force majeure"],
  "limitation of liability": ["indemnification", "indemnity cap", "liquidated damages", "warranties"],
  "warranties": ["representations", "covenants", "limitation of liability", "indemnification"],
  "representations": ["warranties", "covenants", "merger clause", "indemnification"],
  "covenants": ["representations", "warranties", "termination for cause", "non-compete"],
  "injunctive relief": ["liquidated damages", "arbitration clause", "non-compete", "trade secret"],
  "choice of law": ["governing law", "jurisdiction", "arbitration clause"],
  "merger clause": ["representations", "warranties", "governing law", "severability"],
  "severability": ["merger clause", "waiver", "governing law"],
  "waiver": ["severability", "covenants", "termination for cause"],
  "indemnity cap": ["indemnification", "limitation of liability", "mutual indemnification"],
  "mutual indemnification": ["indemnification", "indemnity cap", "limitation of liability"],
};

// Context-specific usage examples
const CONTEXT_EXAMPLES: Record<string, Record<string, string>> = {
  contract: {
    "indemnification": "Vendor shall indemnify and hold harmless Client from any third-party claims arising out of Vendor's breach of this Agreement.",
    "limitation of liability": "In no event shall either party's total liability exceed the amounts paid or payable under this Agreement in the twelve months preceding the claim.",
    "force majeure": "Neither party shall be liable for delays caused by circumstances beyond its reasonable control, including natural disasters, government actions, or labor disputes.",
    "governing law": "This Agreement shall be governed by and construed in accordance with the laws of the State of Delaware, without regard to conflict of law principles.",
    "merger clause": "This Agreement constitutes the entire agreement between the parties and supersedes all prior negotiations, representations, and understandings.",
  },
  litigation: {
    "jurisdiction": "Plaintiff filed in a court lacking personal jurisdiction over Defendant, requiring transfer to the proper forum.",
    "injunctive relief": "The court granted a preliminary injunction enjoining Defendant from using Plaintiff's trade secrets pending trial.",
    "arbitration clause": "The court compelled arbitration, finding the dispute fell within the broad arbitration clause's scope.",
    "liquidated damages": "The jury found the liquidated damages clause was an unenforceable penalty because it bore no reasonable relationship to anticipated harm.",
  },
  ip: {
    "IP assignment": "All inventions, discoveries, and works of authorship created by Employee in the scope of employment are hereby assigned to Employer.",
    "confidentiality": "Recipient shall maintain the confidentiality of Discloser's proprietary technology and shall not reverse-engineer or disclose it to third parties.",
    "non-compete": "During the term and for two years following termination, Employee shall not engage in any business competitive with Employer in the Territory.",
    "injunctive relief": "Plaintiff sought injunctive relief to prevent ongoing patent infringement causing irreparable harm to its market position.",
  },
  employment: {
    "non-compete": "Employee agrees not to work for a competitor in the same metropolitan area for 12 months following the termination of employment.",
    "non-solicitation": "For 18 months post-termination, Employee shall not solicit or hire any person who was an employee of Employer during the last year of Employee's tenure.",
    "IP assignment": "Inventions relating to the company's business conceived during employment, or using company resources, are automatically assigned to Employer.",
    "confidentiality": "Employee acknowledges that all client lists, pricing data, and product roadmaps constitute confidential information and agrees not to disclose them.",
  },
  corporate: {
    "representations": "Each party represents and warrants that it has full power and authority to execute and perform this Agreement.",
    "covenants": "Company covenants that it shall maintain its corporate existence, pay all taxes as they become due, and not incur additional indebtedness above the threshold.",
    "governing law": "This Agreement shall be governed by Delaware law, the jurisdiction of incorporation for most U.S. public companies.",
    "merger clause": "In M&A transactions, the merger clause confirms that the purchase agreement, together with the disclosure schedules, constitutes the entire agreement.",
  },
};

// When it matters descriptions by context
const WHEN_IT_MATTERS: Record<string, string> = {
  "indemnification": "Most important during contract negotiations and when a dispute arises involving third-party claims. Especially critical in software, professional services, and vendor agreements.",
  "arbitration clause": "Matters most when you need to evaluate how disputes will be resolved and what rights you give up. Important to review before signing — it's nearly impossible to waive post-signing.",
  "force majeure": "Became critical during COVID-19 and supply chain disruptions. Relevant whenever performance obligations may be disrupted by events outside your control.",
  "liquidated damages": "Critical in construction, software development, and services contracts with firm deadlines. Review carefully to ensure the amount is a genuine estimate, not a penalty.",
  "jurisdiction": "Matters at the time of signing (anticipate where disputes will be heard) and when a dispute arises (determines where to file or defend a lawsuit).",
  "governing law": "Critical when the parties are in different states or countries, or when the law of one jurisdiction is significantly more favorable on key issues.",
  "non-compete": "Most important for employees, founders selling businesses, and contractors. Increasingly scrutinized by courts — many states void or limit them.",
  "non-solicitation": "Critical for businesses with key employees or valuable client relationships. Often paired with and outlasting non-compete restrictions.",
  "IP assignment": "Critical at employment or contractor onboarding — IP ownership is hardest to establish retroactively. Often overlooked until a valuable invention is created.",
  "confidentiality": "Always matters, especially in NDAs, employment agreements, and vendor contracts. Duration and carve-outs are the most negotiated provisions.",
  "termination for cause": "Critical when a party materially underperforms or becomes insolvent. Allows immediate exit without paying termination fees.",
  "limitation of liability": "One of the highest-stakes contract provisions. An uncapped or asymmetric limitation can leave you with no meaningful recovery after significant harm.",
  "warranties": "Important at closing in M&A and when buying software, services, or goods. False warranties trigger indemnification claims and potential fraud exposure.",
  "representations": "Critical in M&A and financing transactions. False representations support rescission and fraud claims.",
  "covenants": "Important throughout the contract term. Breach of a covenant can trigger termination rights and damage claims.",
  "injunctive relief": "Highly relevant in IP, trade secret, non-compete, and defamation cases. Courts grant injunctions when money damages are inadequate.",
  "choice of law": "Most important in multi-state or international contracts. Choice of law affects implied terms, damages rules, and enforceability of key provisions.",
  "merger clause": "Critical at signing — ensures side deals, emails, and prior promises are not enforceable. Always check that the written agreement actually reflects the full deal.",
  "severability": "Important as a protective mechanism. Without it, a court finding one clause invalid could unwind the entire agreement.",
  "waiver": "Relevant throughout contract performance. Without a clear anti-waiver clause, overlooking one breach could prevent you from enforcing that provision later.",
  "indemnity cap": "Critical in high-value contracts where indemnification exposure could dwarf the contract value.",
  "mutual indemnification": "Important for achieving balanced risk allocation. One-sided indemnification is a common negotiating point.",
};

export function legalTermLookup(params: {
  term: string;
  context?: string;
}): string {
  const { term, context } = params;
  const normalizedTerm = term.toLowerCase().trim();
  const seed = `lookup:${normalizedTerm}:${context ?? "general"}`;

  // Find best match in LEGAL_TERMS
  const exactMatch = LEGAL_TERMS[normalizedTerm];
  const partialMatch = !exactMatch
    ? Object.keys(LEGAL_TERMS).find(k => k.includes(normalizedTerm) || normalizedTerm.includes(k))
    : null;

  const matchedTerm = exactMatch ? normalizedTerm : (partialMatch ?? null);
  const definition = matchedTerm ? LEGAL_TERMS[matchedTerm] : null;

  const relatedTerms = matchedTerm
    ? (RELATED_TERMS[matchedTerm] ?? pickN(Object.keys(LEGAL_TERMS).filter(t => t !== matchedTerm), 4, seed))
    : pickN(Object.keys(LEGAL_TERMS), 5, seed);

  const whenItMatters = matchedTerm ? (WHEN_IT_MATTERS[matchedTerm] ?? "This provision is important to review whenever it appears in a contract.") : "Review this provision carefully with qualified legal counsel.";

  // Context-specific example
  const contextKey = context ?? "contract";
  const contextExamples = CONTEXT_EXAMPLES[contextKey] ?? CONTEXT_EXAMPLES["contract"];
  const exampleText = matchedTerm
    ? (contextExamples[matchedTerm] ?? pick(Object.values(contextExamples), seed, 0))
    : pick(Object.values(contextExamples), seed, 1);

  const contextLabel: Record<string, string> = {
    contract: "Contract Law",
    litigation: "Litigation",
    ip: "Intellectual Property",
    employment: "Employment Law",
    corporate: "Corporate Law",
  };

  let out = `## Legal Term Lookup: "${term}"\n\n`;

  if (!definition) {
    out += `> **Note:** "${term}" was not found in the reference database. Showing closest related concepts.\n\n`;
    out += `The term you searched for is not in the standard legal term database. This could mean:\n`;
    out += `- It is a jurisdiction-specific or highly specialized term\n`;
    out += `- It may be part of a specific contract type (e.g., securities, real estate, healthcare)\n`;
    out += `- Consider consulting a licensed attorney who specializes in the relevant practice area\n\n`;
    out += `**Related Terms You May Find Helpful:**\n\n`;
    relatedTerms.slice(0, 5).forEach((t) => {
      const def = LEGAL_TERMS[t];
      out += `### ${t.charAt(0).toUpperCase() + t.slice(1)}\n`;
      out += `${def}\n\n`;
    });
    out += FOOTER;
    return out;
  }

  // Display context badge
  if (context) {
    out += `**Context:** ${contextLabel[context] ?? context}\n\n`;
  }

  // Definition
  out += `### Definition\n\n`;
  out += `${definition}\n\n`;

  // Plain-English breakdown
  out += `### Plain-English Explanation\n\n`;
  const sentences = definition.split(". ").filter(s => s.trim().length > 0);
  if (sentences.length >= 2) {
    out += `**The short version:** ${sentences[0]}.\n\n`;
    out += `**More detail:** ${sentences.slice(1).join(". ")}${definition.endsWith(".") ? "" : "."}\n\n`;
  } else {
    out += `${definition}\n\n`;
  }

  // When it matters
  out += `### When It Matters\n\n`;
  out += `${whenItMatters}\n\n`;

  // Example usage
  out += `### Example Usage`;
  if (context) out += ` (${contextLabel[context] ?? context} Context)`;
  out += `\n\n`;
  out += `> *"${exampleText}"*\n\n`;

  // Practical tips
  out += `### Practical Tips\n\n`;

  const tipsMap: Record<string, string[]> = {
    "indemnification": [
      "Always negotiate a liability cap on indemnification obligations",
      "Insist on mutual indemnification rather than one-sided exposure",
      "Exclude indemnification for the indemnified party's own negligence or willful misconduct",
      "Require advance written notice and the right to control defense of any claim",
    ],
    "arbitration clause": [
      "Check whether class arbitration is waived — this significantly limits your options",
      "Negotiate for arbitration in your local jurisdiction rather than the counterparty's preferred location",
      "Confirm whether emergency injunctive relief is available through courts even if arbitration applies",
      "Review fee allocation rules — loser-pays arbitration can deter legitimate claims",
    ],
    "force majeure": [
      "List specific covered events rather than relying on a general catch-all",
      "Include a notice requirement (typically 24–72 hours after the event)",
      "Add a time limit after which the non-affected party can terminate",
      "Confirm whether the clause applies to payment obligations (it usually should not)",
    ],
    "limitation of liability": [
      "Ensure the cap applies to both parties equally, not just one",
      "Watch for carve-outs that exclude indemnification obligations from the cap",
      "A cap equal to contract value may be too low for high-risk services — negotiate accordingly",
      "Check whether gross negligence and willful misconduct are excluded from the cap",
    ],
    "IP assignment": [
      "Insist on a carve-out for pre-existing IP and tools you bring to the engagement",
      "License back any assigned IP that you need to continue operating your business",
      "Ensure the assignment is clear and recorded properly (especially for patents and copyrights)",
      "Contractors: negotiate to retain ownership of generic methodologies and reusable code libraries",
    ],
    "confidentiality": [
      "Limit the confidentiality period (2–5 years for most business information; perpetual for true trade secrets)",
      "Include standard carve-outs: publicly known, independently developed, required by law, approved for disclosure",
      "Be specific about what is 'confidential' — avoid overly broad definitions",
      "Include a residuals clause if you want employees to use general knowledge gained without restriction",
    ],
  };

  const tips = tipsMap[matchedTerm ?? ""] ??
    ["Consult legal counsel when this provision appears in a high-value contract",
     "Negotiate for mutual rather than one-sided obligations where possible",
     "Ensure all key terms in this provision are clearly defined",
     "Document your intent in writing during negotiations to support interpretation later"];

  tips.forEach((tip) => {
    out += `- ${tip}\n`;
  });

  // Related terms
  out += `\n### Related Terms\n\n`;
  out += `| Term | Brief Definition |\n`;
  out += `|------|------------------|\n`;
  relatedTerms.slice(0, 5).forEach((t) => {
    const shortDef = LEGAL_TERMS[t] ? LEGAL_TERMS[t].split(".")[0] + "." : "See legal dictionary for definition.";
    out += `| **${t}** | ${shortDef} |\n`;
  });

  out += FOOTER;
  return out;
}
