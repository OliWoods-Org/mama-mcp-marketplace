# Intercom Support MCP

AI-powered customer support for Claude. Conversation management, intelligent triage, AI draft responses, knowledge base search, support analytics, and customer health scoring.

Built from MAMA's auto-respond, comms, inbox, and client-feedback agent patterns.

## Tools (7)

### Conversations
| Tool | Description |
|------|-------------|
| `search_conversations` | Search/filter conversations by status, priority, keyword |
| `get_conversation` | Full thread with customer details, MRR, sentiment, messages |

### AI Triage & Response
| Tool | Description |
|------|-------------|
| `triage_ticket` | Auto-classify priority, category, sentiment, suggest actions |
| `draft_response` | AI draft with configurable tone + KB links + CSAT estimate |

### Knowledge Base
| Tool | Description |
|------|-------------|
| `search_knowledge_base` | Find articles with helpfulness, deflection rates, freshness |

### Analytics
| Tool | Description |
|------|-------------|
| `support_metrics` | Dashboard: CSAT, NPS, SLA compliance, AI performance |
| `customer_health` | Health score, churn risk, retention recommendations |

## Setup

```bash
npm install && npm run build
```

```json
{
  "mcpServers": {
    "intercom-support": {
      "command": "node",
      "args": ["/path/to/intercom-support/dist/index.js"]
    }
  }
}
```

## Example Usage

```
Show me all open P0 conversations

Get conversation thread CONV-ABC123

Triage this ticket: "Our API integration is returning 500 errors since the last update. This is blocking our production deploy." (enterprise plan)

Draft an empathetic response to: "I've been waiting 3 days for a reply about my billing issue. This is unacceptable."

Search knowledge base for "webhook setup"

Show support metrics for the last 30 days

Check customer health for TechFlow Inc
```

## Why This MCP

Intercom has 25,000+ paying customers. Every support team using Claude wants AI-powered triage and drafting. This MCP brings MAMA's proven auto-respond and inbox patterns to the Intercom workflow — zero-CAC organic traffic from the Claude marketplace funneling to CoFounder (agent orchestration) and Siren (voice sales).

## License

MIT
