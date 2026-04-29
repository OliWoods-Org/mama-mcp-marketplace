# @foundation/rx-access-mcp

MCP server for prescription drug access — find patient assistance programs, check income eligibility, compare drug costs across channels, and locate the right pharmacy type.

## Tools

| Tool | Description |
|---|---|
| `search_assistance_programs` | Find manufacturer PAPs, copay cards, and discount programs for a drug |
| `check_eligibility` | Assess program eligibility based on income, household size, and insurance |
| `compare_drug_costs` | Compare brand vs. generic, mail-order, and cash pricing channels |
| `find_pharmacy` | Find 340B, mail-order, specialty, compounding, or retail pharmacies |

## Usage

```json
{
  "mcpServers": {
    "foundation-rx-access": {
      "command": "npx",
      "args": ["-y", "@foundation/rx-access-mcp"]
    }
  }
}
```

## Development

```bash
npm install
npm run build
npm start
```

---

Open source by **OliWoods Foundation**
