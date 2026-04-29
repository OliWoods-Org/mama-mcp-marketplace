# Grail Prediction Intelligence MCP

AI disruption prediction and paper trading for Claude. Detect disruption signals before they hit the news, analyze predictive leading indicators, and paper trade risk-free.

## Tools (6)

### Layer 1: Disruption Detection
| Tool | Description |
|------|-------------|
| `disruption_radar` | Scan sectors for AI disruption signals — product launches, partnerships, regulatory, patents, acquisitions |
| `predictive_signals` | Analyze pre-news leading indicators — patent filings, GitHub velocity, job postings, supply chain, academic papers, regulatory filings |

### Layer 2: Paper Trading
| Tool | Description |
|------|-------------|
| `open_paper_trade` | Open a simulated position with entry, target, stop loss, and thesis |
| `portfolio_performance` | View portfolio P&L, win rate, Sharpe ratio, sector breakdown |

### Layer 3: Prediction & Analysis
| Tool | Description |
|------|-------------|
| `predict_disruption` | Predict disruption probability for a company with catalysts, risks, and trade recommendation |
| `backtest_signal` | Backtest a signal type against historical data — hit rate, decay curve, alpha assessment |

## Setup

```bash
npm install
npm run build
```

```json
{
  "mcpServers": {
    "grail-prediction": {
      "command": "node",
      "args": ["/path/to/grail-prediction/dist/index.js"]
    }
  }
}
```

## Example Usage

```
Scan AI chips sector for disruption signals in the last week

Show predictive signals for NVDA — patents, github, jobs, supply_chain

Open a paper trade: NVDA long at $135, $10,000 position, target 15%, stop 5%, 1 month horizon. Thesis: patent acceleration signals product launch

Show my portfolio performance for the last month

Predict disruption probability for Microsoft in LLMs over 6 months

Backtest the patent signal for AI chips over the last 24 months
```

## The Edge: Trading Before the News

Traditional trading reacts to news. Grail predicts it:

- **Patents** → Product announcements (6-12 month lead)
- **GitHub velocity** → Feature releases (3-6 month lead)
- **Job postings** → Capacity expansion → Earnings beats (6-9 month lead)
- **Supply chain** → Infrastructure scaling (6-18 month lead)
- **Academic papers** → Product pipeline (12-18 month lead)
- **Regulatory filings** → Market access catalysts (3-12 month lead)

## Disclaimer

This is a paper trading and research tool. It does not provide financial advice or execute real trades. Past performance of signals does not guarantee future results. Always do your own research.

## License

MIT
