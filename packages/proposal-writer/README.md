# Proposal Writer MCP (@mama/proposal-writer-mcp)

Professional proposal writing toolkit for Claude. Write winning proposals, define scope, build pricing strategy, generate case studies, and outline pitch decks — without leaving your AI assistant.

## Tools (5)

| Tool | Description |
|------|-------------|
| `write_proposal` | Write a complete business proposal — exec summary, challenge framing, deliverables, investment |
| `scope_of_work` | Generate a Statement of Work (SOW) with milestones, out-of-scope, acceptance criteria, signatures |
| `pricing_strategy` | Build a pricing strategy — cost-based & market-adjusted pricing, 3-tier packaging, negotiation guardrails |
| `case_study_generator` | Generate a compelling case study in the Situation/Complication/Solution/Results framework |
| `pitch_deck_outline` | Create a slide-by-slide pitch deck — investor, sales, partnership, or board update |

## Setup

```bash
npm install
npm run build
```

```json
{
  "mcpServers": {
    "mama-proposal-writer": {
      "command": "node",
      "args": ["/path/to/proposal-writer/dist/index.js"]
    }
  }
}
```

## Example Prompts

- "Write a proposal for a $50K brand strategy engagement for Acme Corp"
- "Generate a Statement of Work for a 12-week web development project"
- "Build a pricing strategy for my SEO retainer service targeting mid-market SaaS companies"
- "Create a case study: we helped Retail Co increase conversion by 47% in 90 days"
- "Outline a seed-round investor pitch deck for my HR tech startup"

---

Start your free trial at **[mama.oliwoods.com/beta](https://mama.oliwoods.com/beta)**
