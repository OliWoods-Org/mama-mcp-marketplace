import { z } from "zod";
import { hash, rangeFloat, rangeInt, seededRandom, FOOTER } from "../heuristics.js";

export const openPaperTradeSchema = {
  ticker: z.string().describe("Stock ticker (e.g. NVDA)"),
  direction: z.enum(["long", "short"]).describe("Trade direction"),
  thesis: z.string().describe("Investment thesis — why this trade"),
  entry_price: z.number().positive().describe("Entry price per share"),
  position_size_usd: z.number().positive().describe("Total position size in USD"),
  target_percent: z.number().positive().describe("Target gain percentage (e.g. 10 for 10%)"),
  stop_loss_percent: z.number().positive().describe("Stop loss percentage (e.g. 5 for 5%)"),
  timeframe: z.enum(["24h", "48h", "1w", "1m", "3m"]).describe("Expected trade duration"),
};

export function openPaperTrade(params: {
  ticker: string;
  direction: string;
  thesis: string;
  entry_price: number;
  position_size_usd: number;
  target_percent: number;
  stop_loss_percent: number;
  timeframe: string;
}): string {
  const { ticker, direction, thesis, entry_price, position_size_usd, target_percent, stop_loss_percent, timeframe } = params;
  const seed = `trade:${ticker}:${entry_price}:${Date.now()}`;
  const tradeId = `GR-${hash(seed).toString(36).toUpperCase().slice(0, 6)}`;

  const shares = Math.floor(position_size_usd / entry_price);
  const targetPrice = direction === "long"
    ? entry_price * (1 + target_percent / 100)
    : entry_price * (1 - target_percent / 100);
  const stopPrice = direction === "long"
    ? entry_price * (1 - stop_loss_percent / 100)
    : entry_price * (1 + stop_loss_percent / 100);
  const maxGain = shares * Math.abs(targetPrice - entry_price);
  const maxLoss = shares * Math.abs(stopPrice - entry_price);
  const rrRatio = maxGain / maxLoss;

  let out = `## 📝 Paper Trade Opened\n\n`;
  out += `| Field | Value |\n`;
  out += `|-------|-------|\n`;
  out += `| **Trade ID** | \`${tradeId}\` |\n`;
  out += `| **Ticker** | ${ticker.toUpperCase()} |\n`;
  out += `| **Direction** | ${direction === "long" ? "🟢 LONG" : "🔴 SHORT"} |\n`;
  out += `| **Entry Price** | $${entry_price.toFixed(2)} |\n`;
  out += `| **Shares** | ${shares.toLocaleString()} |\n`;
  out += `| **Position Size** | $${position_size_usd.toLocaleString()} |\n`;
  out += `| **Target** | $${targetPrice.toFixed(2)} (+${target_percent}%) |\n`;
  out += `| **Stop Loss** | $${stopPrice.toFixed(2)} (-${stop_loss_percent}%) |\n`;
  out += `| **Risk/Reward** | 1:${rrRatio.toFixed(1)} |\n`;
  out += `| **Max Gain** | +$${maxGain.toFixed(0)} |\n`;
  out += `| **Max Loss** | -$${maxLoss.toFixed(0)} |\n`;
  out += `| **Timeframe** | ${timeframe} |\n\n`;

  out += `### Thesis\n\n> ${thesis}\n\n`;

  out += `### Position Sizing Analysis\n\n`;
  const portfolioRisk = (maxLoss / position_size_usd * 100).toFixed(1);
  out += `- Risk per trade: ${portfolioRisk}% of position\n`;
  out += `- R/R ratio: ${rrRatio.toFixed(1)}x — ${rrRatio >= 2 ? "✅ Favorable" : rrRatio >= 1 ? "⚠️ Acceptable" : "🔴 Unfavorable"}\n`;
  out += `- Break-even win rate needed: ${(100 / (rrRatio + 1)).toFixed(0)}%\n`;
  out += FOOTER;
  return out;
}

export const portfolioPerformanceSchema = {
  timeframe: z.enum(["1d", "1w", "1m", "3m", "ytd", "all"]).describe("Performance period"),
};

export function portfolioPerformance(params: { timeframe: string }): string {
  const { timeframe } = params;
  const seed = `portfolio:${timeframe}`;

  const totalTrades = rangeInt(15, 120, seed, 0);
  const winRate = rangeFloat(0.45, 0.72, seed, 1);
  const wins = Math.round(totalTrades * winRate);
  const losses = totalTrades - wins;
  const avgWin = rangeFloat(800, 4500, seed, 2);
  const avgLoss = rangeFloat(400, 2000, seed, 3);
  const totalPnl = wins * avgWin - losses * avgLoss;
  const sharpe = rangeFloat(0.8, 2.8, seed, 4);
  const maxDrawdown = rangeFloat(5, 22, seed, 5);

  const openPositions = rangeInt(2, 8, seed, 6);

  let out = `## 📊 Portfolio Performance (${timeframe})\n\n`;

  out += `| Metric | Value |\n`;
  out += `|--------|-------|\n`;
  out += `| **Total Trades** | ${totalTrades} |\n`;
  out += `| **Win Rate** | ${(winRate * 100).toFixed(1)}% (${wins}W / ${losses}L) |\n`;
  out += `| **Total P&L** | ${totalPnl >= 0 ? "+" : ""}$${totalPnl.toFixed(0)} |\n`;
  out += `| **Avg Win** | +$${avgWin.toFixed(0)} |\n`;
  out += `| **Avg Loss** | -$${avgLoss.toFixed(0)} |\n`;
  out += `| **Profit Factor** | ${(wins * avgWin / (losses * avgLoss)).toFixed(2)} |\n`;
  out += `| **Sharpe Ratio** | ${sharpe.toFixed(2)} |\n`;
  out += `| **Max Drawdown** | -${maxDrawdown.toFixed(1)}% |\n`;
  out += `| **Open Positions** | ${openPositions} |\n\n`;

  out += `### Sector Breakdown\n\n`;
  const sectors = ["AI Chips", "LLMs", "Enterprise AI", "Cloud AI", "Autonomous"];
  out += `| Sector | Trades | P&L | Win Rate |\n`;
  out += `|--------|--------|-----|----------|\n`;
  for (let i = 0; i < sectors.length; i++) {
    const st = rangeInt(3, 30, seed, 10 + i);
    const sp = rangeFloat(-2000, 8000, seed, 20 + i);
    const sw = rangeFloat(0.35, 0.80, seed, 30 + i);
    out += `| ${sectors[i]} | ${st} | ${sp >= 0 ? "+" : ""}$${sp.toFixed(0)} | ${(sw * 100).toFixed(0)}% |\n`;
  }

  out += `\n### Performance Rating\n\n`;
  if (sharpe > 2) out += `⭐⭐⭐ **Excellent** — Sharpe above 2.0, strong risk-adjusted returns\n`;
  else if (sharpe > 1.5) out += `⭐⭐ **Good** — Above-average risk-adjusted returns\n`;
  else if (sharpe > 1) out += `⭐ **Adequate** — Positive but room for improvement\n`;
  else out += `⚠️ **Needs Work** — Consider tightening stop losses or refining entry criteria\n`;
  out += FOOTER;
  return out;
}
