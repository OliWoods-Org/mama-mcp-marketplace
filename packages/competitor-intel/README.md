# Competitor Intel MCP (@mama/competitor-intel-mcp)

Competitive intelligence toolkit for Claude. Build battlecards, compare features, analyze pricing, review win/loss data, and map the market landscape — without leaving your AI assistant.

## Tools (5)

| Tool | Description |
|------|-------------|
| `battlecard` | Build a sales battlecard — win/loss patterns, objection handlers, talk tracks, deal disqualifiers |
| `feature_comparison` | Side-by-side feature matrix vs. up to 4 competitors — scoring, unique advantages, gap analysis |
| `pricing_analysis` | Analyze competitor pricing across tiers — market range, positioning, and pricing lever recommendations |
| `win_loss_analyzer` | Analyze win/loss patterns — win rate benchmarking, reason frequency, segment breakdown, revenue impact |
| `market_landscape` | Map the competitive landscape — player profiles, threat assessment, opportunities, and strategy |

## Setup

```bash
npm install
npm run build
```

```json
{
  "mcpServers": {
    "mama-competitor-intel": {
      "command": "node",
      "args": ["/path/to/competitor-intel/dist/index.js"]
    }
  }
}
```

## Example Prompts

- "Build a battlecard for my CRM vs. Salesforce"
- "Compare my project management tool vs. Asana, Monday, and Notion on these 10 features"
- "Analyze competitor pricing for our HR software across SMB and enterprise tiers"
- "Analyze our win/loss data for Q1 2025: 45 wins, 30 losses"
- "Map the competitive landscape for AI writing tools, including Jasper, Copy.ai, and Writesonic"

---

Start your free trial at **[mama.oliwoods.com/beta](https://mama.oliwoods.com/beta)**
