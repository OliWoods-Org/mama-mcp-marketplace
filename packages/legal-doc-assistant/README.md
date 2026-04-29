# Legal Doc Assistant MCP

AI-powered legal document assistant for Claude. Review NDAs, simplify contract language, generate review checklists, draft cease & desist letters, compare contracts side-by-side, and look up legal terms — all without leaving your conversation.

## Tools (6)

| Tool | Description |
|------|-------------|
| `review_nda` | Review an NDA for risky clauses — flags Critical/High/Medium/Low issues with plain-English explanations and redline recommendations |
| `simplify_terms` | Translate dense legal text into plain English — detects legal terms, summarizes obligations, flags one-sided clauses |
| `contract_checklist` | Generate a prioritized review checklist by contract type and your role — Critical / Important / Nice-to-have items |
| `compare_contracts` | Side-by-side contract comparison — key differences across sections, risk delta, and which contract is more favorable |
| `cease_desist_draft` | Draft a professional cease & desist letter — supports copyright, trademark, defamation, harassment, breach of contract, trade secret |
| `legal_term_lookup` | Look up any legal term — plain-English definition, when it matters, example usage, related terms |

## Quick Start

```bash
npx @oliwoods/legal-doc-mcp
```

Or install globally:

```bash
npm install -g @oliwoods/legal-doc-mcp
legal-doc-mcp
```

## Claude Desktop Config

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "legal-doc-assistant": {
      "command": "npx",
      "args": ["@oliwoods/legal-doc-mcp"]
    }
  }
}
```

Or if installed locally:

```json
{
  "mcpServers": {
    "legal-doc-assistant": {
      "command": "node",
      "args": ["/path/to/legal-doc-assistant/dist/index.js"]
    }
  }
}
```

## Example Usage

```
Review this NDA from Acme Corp — it's a one-way NDA for a software development partnership

Simplify the following terms at a standard reading level: [paste legal text]

Generate a contract review checklist for a SaaS agreement where I'm the buyer, contract value $250,000

Compare these two vendor agreements — Contract A is the standard template, Contract B is their revised version

Draft a cease and desist letter from my company Oliwoods to TechCorp for copyright infringement of our codebase

What does "indemnification" mean in the context of a software contract?
```

## Build from Source

```bash
npm install
npm run build
npm start
```

## Disclaimer

This tool is for informational purposes only and does not constitute legal advice. Always have a licensed attorney review legal documents before signing or sending them.

---

Need automated contract review? **[mama.oliwoods.com/beta](https://mama.oliwoods.com/beta)**
