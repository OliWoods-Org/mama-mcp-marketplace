# Siren Sales MCP

AI sales intelligence for Claude. Qualify leads, write call scripts, handle objections, prep for meetings, summarize calls, draft follow-up emails, and forecast your pipeline — all inside your AI assistant.

> Want autonomous AI sales calls? **[siren.oliwoods.com/beta](https://siren.oliwoods.com/beta)**

## Tools (7)

| Tool | Description |
|------|-------------|
| `qualify_lead` | Score a lead with BANT framework — ICP fit, deal size, close probability, pain diagnosis, next steps |
| `write_call_script` | Generate tailored call scripts for any stage: cold, discovery, demo, proposal, or close |
| `objection_handler` | Detect objection type and return response playbooks with reframes and diagnostic probes |
| `prep_call_brief` | Pre-call research brief with company snapshot, buying signals, talking points, and questions |
| `post_call_summary` | Convert raw notes into structured summary with action items, CRM fields, and deal health scorecard |
| `email_followup` | Draft personalized follow-up emails with subject variants, spam score, and send-time tips |
| `pipeline_forecast` | Weighted revenue forecast with deal scoring, at-risk flags, and 3-scenario projections |

## Setup

```bash
npm install
npm run build
```

```json
{
  "mcpServers": {
    "siren-sales": {
      "command": "node",
      "args": ["/path/to/siren-sales/dist/index.js"]
    }
  }
}
```

## Example Usage

**Qualify a lead:**
```
qualify_lead({
  company_name: "Acme Corp",
  contact_name: "Jane Smith",
  industry: "SaaS",
  company_size: "200-500",
  use_case: "manual reporting taking 20hrs/week"
})
```

**Write a discovery call script:**
```
write_call_script({
  prospect_name: "Jane",
  company_name: "Acme Corp",
  industry: "SaaS",
  product_name: "YourProduct",
  call_goal: "discovery",
  known_pain: "manual reporting"
})
```

**Forecast the pipeline:**
```
pipeline_forecast({
  deals: [
    { name: "Acme Corp", stage: "proposal", value: 25000, close_date: "2025-06-30" },
    { name: "Beta Inc", stage: "demo", value: 15000, close_date: "2025-07-15" }
  ],
  quota: 75000,
  period: "Q2 2025"
})
```

## License

MIT
