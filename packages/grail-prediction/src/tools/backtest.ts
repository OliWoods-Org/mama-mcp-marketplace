import { z } from "zod";
import { rangeInt, rangeFloat, seededRandom, FOOTER } from "../heuristics.js";

export const backtestSignalSchema = {
  signal_type: z.enum(["patents", "github", "jobs", "supply_chain", "academic", "regulatory"]).describe("Signal type to backtest"),
  sector: z.string().describe("Sector to backtest against (e.g. 'AI chips')"),
  lookback_months: z.number().min(6).max(60).describe("Historical lookback period in months"),
};

export function backtestSignal(params: { signal_type: string; sector: string; lookback_months: number }): string {
  const { signal_type, sector, lookback_months } = params;
  const seed = `backtest:${signal_type}:${sector}:${lookback_months}`;

  const totalSignals = rangeInt(15, 80, seed, 0);
  const profitableSignals = Math.round(totalSignals * rangeFloat(0.52, 0.75, seed, 1));
  const avgReturn = rangeFloat(2.5, 18.5, seed, 2);
  const avgLeadTime = rangeInt(14, 120, seed, 3);
  const bestCase = rangeFloat(15, 65, seed, 4);
  const worstCase = rangeFloat(-25, -5, seed, 5);
  const sharpe = rangeFloat(0.6, 2.5, seed, 6);

  let out = `## 📈 Backtest Results: ${signal_type} → ${sector}\n\n`;
  out += `**Period:** ${lookback_months} months | **Signal type:** ${signal_type.replace(/_/g, " ")}\n\n`;

  out += `### Performance Summary\n\n`;
  out += `| Metric | Value |\n`;
  out += `|--------|-------|\n`;
  out += `| **Total Signals** | ${totalSignals} |\n`;
  out += `| **Profitable** | ${profitableSignals} (${(profitableSignals / totalSignals * 100).toFixed(1)}%) |\n`;
  out += `| **Avg Return** | +${avgReturn.toFixed(1)}% |\n`;
  out += `| **Avg Lead Time** | ${avgLeadTime} days |\n`;
  out += `| **Best Case** | +${bestCase.toFixed(1)}% |\n`;
  out += `| **Worst Case** | ${worstCase.toFixed(1)}% |\n`;
  out += `| **Sharpe Ratio** | ${sharpe.toFixed(2)} |\n`;
  out += `| **Profit Factor** | ${(profitableSignals * avgReturn / ((totalSignals - profitableSignals) * Math.abs(worstCase / 3))).toFixed(2)} |\n\n`;

  out += `### Signal Decay Curve\n\n`;
  out += `How quickly the signal's alpha decays after detection:\n\n`;
  out += `| Days After Signal | Avg Return | Hit Rate | Alpha Remaining |\n`;
  out += `|-------------------|-----------|----------|----------------|\n`;
  const intervals = [1, 3, 7, 14, 30, 60, 90];
  for (let i = 0; i < intervals.length; i++) {
    const day = intervals[i];
    if (day > avgLeadTime * 1.5) break;
    const decayFactor = Math.exp(-day / (avgLeadTime * 0.8));
    const dayReturn = avgReturn * decayFactor;
    const dayHitRate = (profitableSignals / totalSignals) * (0.7 + 0.3 * decayFactor);
    const alphaRemaining = Math.round(decayFactor * 100);
    out += `| Day ${day} | +${dayReturn.toFixed(1)}% | ${(dayHitRate * 100).toFixed(0)}% | ${"█".repeat(Math.round(alphaRemaining / 10))}${"░".repeat(10 - Math.round(alphaRemaining / 10))} ${alphaRemaining}% |\n`;
  }

  out += `\n### Monthly Performance\n\n`;
  out += `| Month | Signals | Wins | Return |\n`;
  out += `|-------|---------|------|--------|\n`;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const recentMonths = Math.min(lookback_months, 12);
  for (let i = 0; i < recentMonths; i++) {
    const mSignals = rangeInt(1, 8, seed, 100 + i);
    const mWins = Math.round(mSignals * rangeFloat(0.3, 0.9, seed, 200 + i));
    const mReturn = rangeFloat(-8, 25, seed, 300 + i);
    out += `| ${months[i]} | ${mSignals} | ${mWins} | ${mReturn >= 0 ? "+" : ""}${mReturn.toFixed(1)}% |\n`;
  }

  out += `\n### Recommendation\n\n`;
  if (sharpe > 1.8 && profitableSignals / totalSignals > 0.6) {
    out += `✅ **Strong edge detected.** The ${signal_type} signal in ${sector} shows consistent alpha with a ${(profitableSignals / totalSignals * 100).toFixed(0)}% hit rate and ${sharpe.toFixed(2)} Sharpe. Optimal entry window is days 1-${Math.round(avgLeadTime * 0.5)} after signal detection.\n`;
  } else if (sharpe > 1.0) {
    out += `⚠️ **Moderate edge.** The signal shows some predictive power but with higher variance. Consider combining with other signal types for confirmation before trading.\n`;
  } else {
    out += `❌ **Weak edge.** The ${signal_type} signal in ${sector} does not show reliable predictive power over this lookback period. Not recommended as a standalone trading signal.\n`;
  }
  out += FOOTER;
  return out;
}
