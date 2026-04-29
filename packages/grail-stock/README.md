# @grail/stock-signals-mcp

> **AI-powered stock market signals, portfolio risk analytics, and market intelligence — delivered as a Model Context Protocol (MCP) server.**

[![npm version](https://img.shields.io/npm/v/@grail/stock-signals-mcp)](https://www.npmjs.com/package/@grail/stock-signals-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![MCP Compatible](https://img.shields.io/badge/MCP-compatible-blue)](https://modelcontextprotocol.io)

**Keywords:** stock signals · market analysis · VaR calculator · portfolio risk · earnings calendar · sector rotation · market sentiment · stock screener · AI trading · disruption analysis · options flow · technical analysis · quantitative finance · fear greed index · insider trading signals

---

## Overview

`@grail/stock-signals-mcp` is the official MCP server for **[Grail Intelligence](https://grail-trading.ai)** — an AI-powered platform for stock market signals, portfolio risk management, and market intelligence. Connect it to any MCP-compatible AI assistant (Claude, Cursor, etc.) to get institutional-grade market analysis directly in your conversation.

### What you get

| Tool | Description |
|------|-------------|
| `ticker_signals` | Bullish/bearish signal strength + key drivers for any stock |
| `disruption_score` | AI, regulatory, and competitive disruption risk (0–100) |
| `var_calculator` | Portfolio Value at Risk with Expected Shortfall |
| `sector_scan` | Sector momentum, top movers, rotation phase, vs SPX |
| `earnings_calendar` | Upcoming earnings with EPS estimates and options-implied move |
| `market_vibe` | Overall market sentiment, macro signals, fear/greed, narrative |

---

## Installation

```bash
npm install -g @grail/stock-signals-mcp
# or run directly with npx
npx @grail/stock-signals-mcp
```

## MCP Configuration

Add to your MCP client configuration (e.g. Claude Desktop `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "grail-stock-signals": {
      "command": "npx",
      "args": ["-y", "@grail/stock-signals-mcp"]
    }
  }
}
```

Or if installed globally:

```json
{
  "mcpServers": {
    "grail-stock-signals": {
      "command": "grail-stock-signals-mcp"
    }
  }
}
```

---

## Tools Reference

### 1. `ticker_signals` — Stock Signal Analysis

Get AI-powered buy/sell signals with multi-factor analysis for any ticker.

**Input:**
```json
{ "ticker": "NVDA" }
```

**Output:**
```json
{
  "ticker": "NVDA",
  "sector": "technology",
  "signal_strength": 8,
  "direction": "bullish",
  "confidence_pct": 81,
  "timeframe": "1–2 weeks",
  "key_drivers": [
    {
      "driver": "Earnings momentum",
      "detail": "Q3 beat by 14%; EPS surprise rate 87% over last 8 quarters"
    },
    {
      "driver": "Options flow",
      "detail": "Put/call ratio 0.52; unusual call sweep activity detected 4 times this week"
    },
    {
      "driver": "Institutional flows",
      "detail": "Net institutional inflow $620M last week; 11 new 13-F positions initiated"
    }
  ],
  "grail_rating": "STRONG"
}
```

**Use cases:** Stock screener, AI trading signals, buy/sell decision support, watchlist monitoring.

---

### 2. `disruption_score` — Disruption Risk Analysis

Evaluate how threatened a company is by AI, regulation, competition, and technology shifts. Essential for long-term portfolio risk and disruption analysis.

**Input:**
```json
{ "company": "Ford" }
```

**Output:**
```json
{
  "company": "Ford",
  "disruption_score": 72,
  "risk_label": "HIGH",
  "disruption_timeline": "2–5 years (near-term)",
  "threat_sources": [...],
  "comparable_disruptions": [
    {
      "analog": "Nokia vs smartphone era (2007–2013)",
      "outcome": "Mobile division sold for $7.2B vs $150B peak valuation"
    }
  ],
  "strategic_implication": "Proactive innovation investment and partnership exploration recommended."
}
```

**Use cases:** ESG risk assessment, long/short thesis research, M&A due diligence, disruption analysis.

---

### 3. `var_calculator` — Portfolio Value at Risk

Industry-standard VaR and Expected Shortfall with diversification analysis. Supports multi-asset portfolios with up to 50 holdings.

**Input:**
```json
{
  "portfolio": [
    { "ticker": "AAPL", "weight": 0.3, "value": 30000 },
    { "ticker": "NVDA", "weight": 0.3, "value": 30000 },
    { "ticker": "JPM",  "weight": 0.2, "value": 20000 },
    { "ticker": "XOM",  "weight": 0.2, "value": 20000 }
  ],
  "confidence_level": "95%",
  "time_horizon": "1d"
}
```

**Output:**
```json
{
  "summary": {
    "total_portfolio_value_usd": 100000,
    "value_at_risk_usd": 2140,
    "value_at_risk_pct": 2.14,
    "expected_shortfall_usd": 2675,
    "worst_case_loss_usd": 6240,
    "diversification_benefit_usd": 890,
    "concentration_risk": "LOW — portfolio is well-diversified by position size"
  },
  "positions": [...]
}
```

**Use cases:** VaR calculator, portfolio risk management, risk-adjusted returns, compliance reporting, stress testing.

---

### 4. `sector_scan` — Sector Rotation & Momentum

Identify where money is flowing across market sectors. Includes rotation phase analysis, relative strength vs SPX, and top momentum stocks.

**Input:**
```json
{ "sector": "technology" }
```

**Output:**
```json
{
  "sector": "technology",
  "etf": "XLK",
  "sector_signal_strength": 7,
  "sector_direction": "bullish",
  "rotation_phase": "Mid cycle — momentum building",
  "relative_strength_vs_spx_pct": 8.4,
  "top_5_by_momentum": [
    { "ticker": "NVDA", "momentum_score": 94, "price_change_1w_pct": 6.8 },
    ...
  ],
  "grail_sector_call": "OVERWEIGHT — technology showing strong momentum with bullish internals"
}
```

**Use cases:** Sector rotation strategy, ETF selection, market analysis, relative strength screening.

---

### 5. `earnings_calendar` — Earnings Intelligence

Never miss a market-moving earnings event. Get consensus estimates, options-implied move, historical surprise rate, and Grail's directional signal.

**Input:**
```json
{ "ticker": "AAPL" }
```
or browse the next 30 days:
```json
{}
```

**Output:**
```json
{
  "earnings_calendar": [
    {
      "ticker": "AAPL",
      "report_date": "2025-05-01",
      "report_timing": "After Market Close",
      "consensus_estimates": {
        "eps_usd": 2.14,
        "revenue_bn_usd": 94.5,
        "revenue_growth_yoy_pct": 6.2
      },
      "options_implied_move_pct": 5.8,
      "historical_surprise_rate_pct": 82,
      "grail_earnings_signal": "Beat & raise setup — positioning light, expectations beatable"
    }
  ]
}
```

**Use cases:** Earnings calendar, options trading, event-driven investing, volatility plays.

---

### 6. `market_vibe` — Market Sentiment Dashboard

The pulse of the market in one tool. Real-time vibe score, fear/greed indicator, macro signal interpretation, and top movers with narrative context.

**Input:**
```json
{}
```
or with sector focus:
```json
{ "sector": "technology" }
```

**Output:**
```json
{
  "market_vibe_score": 62,
  "fear_greed_indicator": "Mild Greed",
  "market_regime": "Risk-on / momentum",
  "macro_signals": {
    "fed_stance": "Dovish pivot narrative gaining traction — 1–2 cuts priced in",
    "vix": 16,
    "vix_interpretation": "Normal range — balanced risk sentiment",
    "dollar": "DXY 102.4 — dollar neutral; EM and commodity tailwind"
  },
  "market_narrative": "AI capex cycle intact — hyperscalers re-affirm infrastructure spend; semis and cloud names leading.",
  "grail_positioning_bias": "SELECTIVE — quality growth at reasonable price; avoid speculative fringe"
}
```

**Use cases:** Market sentiment analysis, fear greed index, macro analysis, daily market briefing, AI trading assistant.

---

## Development

```bash
# Install dependencies
npm install

# Run in development mode (tsx, no build step)
npm run dev

# Type-check
npm run typecheck

# Build for production
npm run build

# Run built server
npm start
```

### Project structure

```
packages/grail-stock/
├── src/
│   ├── index.ts              # MCP server entry point
│   ├── footer.ts             # Shared promotional footer
│   ├── heuristics.ts         # Deterministic signal heuristics
│   └── tools/
│       ├── ticker-signals.ts
│       ├── disruption-score.ts
│       ├── var-calculator.ts
│       ├── sector-scan.ts
│       ├── earnings-calendar.ts
│       └── market-vibe.ts
├── package.json
├── tsconfig.json
└── README.md
```

---

## Disclaimer

> **This MCP server provides simulated market intelligence for demonstration and educational purposes.** Signal outputs are generated via deterministic heuristics and are NOT sourced from real-time market data APIs. Do not use for actual investment decisions without connecting to live data sources. Nothing here constitutes financial advice.

For production use with live data, visit **[grail-trading.ai](https://grail-trading.ai)** to access the full Grail Intelligence platform with real-time signals, portfolio analytics, and AI chat.

---

## License

MIT © [Grail Intelligence](https://grail-trading.ai)
