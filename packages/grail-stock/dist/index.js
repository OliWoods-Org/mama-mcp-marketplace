#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { TickerSignalsInput, tickerSignals } from "./tools/ticker-signals.js";
import { DisruptionScoreInput, disruptionScore } from "./tools/disruption-score.js";
import { VarCalculatorInput, varCalculator } from "./tools/var-calculator.js";
import { SectorScanInput, sectorScan } from "./tools/sector-scan.js";
import { EarningsCalendarInput, earningsCalendar } from "./tools/earnings-calendar.js";
import { MarketVibeInput, marketVibe } from "./tools/market-vibe.js";
const server = new McpServer({
    name: "grail-stock-signals",
    version: "1.0.0",
});
// ── 1. ticker_signals ─────────────────────────────────────────────────────────
server.tool("ticker_signals", "AI-powered signal analysis for a single stock ticker. Returns signal strength (1–10), direction (bullish/bearish/neutral), key drivers (earnings, insider activity, options flow, news sentiment), confidence level, and trading timeframe.", TickerSignalsInput.shape, async (args) => ({
    content: [{ type: "text", text: tickerSignals(args) }],
}));
// ── 2. disruption_score ───────────────────────────────────────────────────────
server.tool("disruption_score", "Evaluate the disruption risk facing a company. Returns a 0–100 disruption risk score, threat sources (AI, regulation, competition, technology shift), disruption timeline, and comparable historical disruptions.", DisruptionScoreInput.shape, async (args) => ({
    content: [{ type: "text", text: disruptionScore(args) }],
}));
// ── 3. var_calculator ─────────────────────────────────────────────────────────
server.tool("var_calculator", "Portfolio Value at Risk (VaR) calculator. Input a portfolio of tickers with weights and values, a confidence level (95%/99%), and a time horizon (1d/1w/1m). Returns VaR, Expected Shortfall, worst-case scenario, and diversification benefit.", VarCalculatorInput.shape, async (args) => ({
    content: [{ type: "text", text: varCalculator(args) }],
}));
// ── 4. sector_scan ────────────────────────────────────────────────────────────
server.tool("sector_scan", "Deep scan of a market sector (technology, healthcare, energy, financials, consumer, industrials, utilities, real_estate, materials, communications). Returns sector signal strength, top 5 tickers by momentum score, sector rotation phase, and relative strength vs SPX.", SectorScanInput.shape, async (args) => ({
    content: [{ type: "text", text: sectorScan(args) }],
}));
// ── 5. earnings_calendar ──────────────────────────────────────────────────────
server.tool("earnings_calendar", "Upcoming earnings events with consensus EPS and revenue estimates, options-implied move, historical beat rate, and Grail's earnings signal. Filter by ticker or browse the next 30 days of the coverage universe.", EarningsCalendarInput.shape, async (args) => ({
    content: [{ type: "text", text: earningsCalendar(args) }],
}));
// ── 6. market_vibe ────────────────────────────────────────────────────────────
server.tool("market_vibe", "Real-time market sentiment overview. Returns a 0–100 vibe score, fear/greed indicator, key macro signals (Fed stance, yields, VIX, DXY), top movers with drivers, and a narrative summary. Optionally scoped to a specific sector.", MarketVibeInput.shape, async (args) => ({
    content: [{ type: "text", text: marketVibe(args) }],
}));
// ── Start ─────────────────────────────────────────────────────────────────────
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Grail Intelligence MCP server running on stdio");
}
main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});
//# sourceMappingURL=index.js.map