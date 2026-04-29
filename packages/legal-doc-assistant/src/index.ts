import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { reviewNdaSchema, reviewNda } from "./tools/review-nda.js";
import { simplifyTermsSchema, simplifyTerms } from "./tools/simplify-terms.js";
import { contractChecklistSchema, contractChecklist } from "./tools/contract-checklist.js";
import { ceaseDesistDraftSchema, ceaseDesistDraft } from "./tools/cease-desist-draft.js";
import { compareContractsSchema, compareContracts } from "./tools/compare-contracts.js";
import { legalTermLookupSchema, legalTermLookup } from "./tools/legal-term-lookup.js";

const server = new McpServer({
  name: "legal-doc-assistant",
  version: "1.0.0",
  description: "AI-powered legal document assistant — NDA review, contract analysis, cease & desist drafting, and legal term lookup",
});

// ── NDA & Contract Review ───────────────────────────────────────────────────

server.tool(
  "review_nda",
  "Review an NDA for risky clauses. Flags problematic provisions with risk levels (Critical/High/Medium/Low), plain-English explanations, and specific redline recommendations. Works for mutual and one-way NDAs.",
  reviewNdaSchema,
  async (params) => ({
    content: [{ type: "text", text: reviewNda(params) }],
  })
);

server.tool(
  "simplify_terms",
  "Translate dense legal text into plain English. Detects legal terms, summarizes key obligations, flags one-sided clauses, and assesses balance — at simple, standard, or detailed reading levels.",
  simplifyTermsSchema,
  async (params) => ({
    content: [{ type: "text", text: simplifyTerms(params) }],
  })
);

// ── Checklists & Comparison ─────────────────────────────────────────────────

server.tool(
  "contract_checklist",
  "Generate a prioritized contract review checklist tailored to the contract type and your role (buyer, seller, licensor, licensee, employer, contractor). Outputs Critical / Important / Nice-to-have items with section-by-section guidance.",
  contractChecklistSchema,
  async (params) => ({
    content: [{ type: "text", text: contractChecklist(params) }],
  })
);

server.tool(
  "compare_contracts",
  "Side-by-side comparison of two contracts. Analyzes key differences across standard sections, quantifies risk delta, and recommends which contract is more favorable — with a hybrid negotiation strategy.",
  compareContractsSchema,
  async (params) => ({
    content: [{ type: "text", text: compareContracts(params) }],
  })
);

// ── Drafting & Lookup ────────────────────────────────────────────────────────

server.tool(
  "cease_desist_draft",
  "Draft a professional cease and desist letter. Supports copyright, trademark, defamation, harassment, breach of contract, and trade secret violations. Outputs a complete letter template with legal basis, demands, and remedies.",
  ceaseDesistDraftSchema,
  async (params) => ({
    content: [{ type: "text", text: ceaseDesistDraft(params) }],
  })
);

server.tool(
  "legal_term_lookup",
  "Look up any legal term with a plain-English definition, practical explanation, when it matters, example usage in context, and related terms. Supports contract, litigation, IP, employment, and corporate contexts.",
  legalTermLookupSchema,
  async (params) => ({
    content: [{ type: "text", text: legalTermLookup(params) }],
  })
);

// ── Start ────────────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
