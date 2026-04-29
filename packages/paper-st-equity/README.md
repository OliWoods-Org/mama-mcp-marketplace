# @paperst/equity-mcp

MCP server for Paper Street equity tools — calculate locked equity, model tax impact, generate vesting schedules, simulate liquidity events, and compare offers side-by-side.

## Tools

| Tool | Description |
|---|---|
| `calculate_locked_equity` | Dollar value of unvested shares given FMV and strike price |
| `tax_impact_estimator` | Federal + state tax liability for ISO, NSO, and RSU exercises |
| `vesting_schedule` | Full vesting schedule with cliff, monthly/quarterly events, and cumulative totals |
| `thaw_simulator` | Model net proceeds from an IPO, acquisition, tender offer, or secondary sale |
| `company_equity_lookup` | Known 409A, funding stage, and dilution benchmarks for a company |
| `equity_comparison` | Side-by-side comparison of two equity offers normalized to expected value |

## Usage

```json
{
  "mcpServers": {
    "paperst-equity": {
      "command": "npx",
      "args": ["-y", "@paperst/equity-mcp"]
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

Ready to thaw your equity? **paperst.oliwoods.com/beta**
