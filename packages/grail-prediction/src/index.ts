import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { disruptionRadarSchema, disruptionRadar } from "./tools/disruption-radar.js";
import { predictiveSignalsSchema, predictiveSignals } from "./tools/predictive-signals.js";
import { openPaperTradeSchema, openPaperTrade, portfolioPerformanceSchema, portfolioPerformance } from "./tools/paper-trade.js";
import { predictDisruptionSchema, predictDisruption } from "./tools/predict-disruption.js";
import { backtestSignalSchema, backtestSignal } from "./tools/backtest.js";

const server = new McpServer({
  name: "grail-prediction",
  version: "1.0.0",
  description: "AI disruption prediction & paper trading — predictive signals from patents, GitHub, jobs, supply chain; paper trading engine; backtesting",
});

// ── Layer 1: Disruption Detection ───────────────────────────────────────────

server.tool(
  "disruption_radar",
  "Scan for AI disruption signals across sectors. Detects product launches, partnerships, regulatory actions, earnings surprises, talent moves, patents, and acquisitions.",
  disruptionRadarSchema,
  async (params) => ({
    content: [{ type: "text", text: disruptionRadar(params) }],
  })
);

server.tool(
  "predictive_signals",
  "Analyze pre-news predictive signals for a stock. Tracks patent filings, GitHub commit velocity, job postings, supply chain orders, academic papers, and regulatory submissions — the leading indicators that precede public announcements.",
  predictiveSignalsSchema,
  async (params) => ({
    content: [{ type: "text", text: predictiveSignals(params) }],
  })
);

// ── Layer 2: Paper Trading ──────────────────────────────────────────────────

server.tool(
  "open_paper_trade",
  "Open a simulated paper trade position with entry price, target, stop loss, and thesis. Track risk/reward ratio and position sizing.",
  openPaperTradeSchema,
  async (params) => ({
    content: [{ type: "text", text: openPaperTrade(params) }],
  })
);

server.tool(
  "portfolio_performance",
  "View paper trading portfolio performance — win rate, P&L, Sharpe ratio, max drawdown, sector breakdown, and performance rating.",
  portfolioPerformanceSchema,
  async (params) => ({
    content: [{ type: "text", text: portfolioPerformance(params) }],
  })
);

// ── Layer 3: Prediction & Analysis ──────────────────────────────────────────

server.tool(
  "predict_disruption",
  "Predict the probability and nature of an AI disruption event for a company. Synthesizes all signal types into a disruption probability score with catalysts, risks, and trade recommendation.",
  predictDisruptionSchema,
  async (params) => ({
    content: [{ type: "text", text: predictDisruption(params) }],
  })
);

server.tool(
  "backtest_signal",
  "Backtest a predictive signal type against historical data for a sector. Shows hit rate, average return, signal decay curve, and whether the signal has reliable alpha.",
  backtestSignalSchema,
  async (params) => ({
    content: [{ type: "text", text: backtestSignal(params) }],
  })
);

// ── Start ───────────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
