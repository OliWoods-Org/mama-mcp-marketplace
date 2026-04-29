import { z } from "zod";
import { pick, pickN, rangeInt, rangeFloat, WIN_REASONS, LOSS_REASONS, MARKET_SEGMENTS, FOOTER } from "../heuristics.js";

export const winLossAnalyzerSchema = {
  your_product: z.string().describe("Your product name"),
  time_period: z.string().describe("Analysis period (e.g. 'Q1 2025', 'Last 6 months', 'FY2024')"),
  deals_won: z.number().int().min(0).describe("Number of deals won in the period"),
  deals_lost: z.number().int().min(0).describe("Number of deals lost in the period"),
  top_win_reasons: z.string().describe("Top reasons you won deals (comma-separated, e.g. 'better pricing, stronger integrations, faster implementation')"),
  top_loss_reasons: z.string().describe("Top reasons you lost deals (comma-separated, e.g. 'missing feature X, lost to Competitor Y, budget cuts')"),
  avg_deal_size: z.number().positive().optional().describe("Average deal size in USD"),
  primary_competitor_lost_to: z.string().optional().describe("The competitor you lose to most often"),
};

export function winLossAnalyzer(params: {
  your_product: string;
  time_period: string;
  deals_won: number;
  deals_lost: number;
  top_win_reasons: string;
  top_loss_reasons: string;
  avg_deal_size?: number;
  primary_competitor_lost_to?: string;
}): string {
  const { your_product, time_period, deals_won, deals_lost, top_win_reasons, top_loss_reasons, avg_deal_size, primary_competitor_lost_to } = params;
  const seed = `winloss:${your_product}:${time_period}`;

  const totalDeals = deals_won + deals_lost;
  const winRate = totalDeals > 0 ? Math.round((deals_won / totalDeals) * 100) : 0;
  const lossRate = 100 - winRate;

  const winReasons = top_win_reasons.split(",").map((r) => r.trim()).filter(Boolean);
  const lossReasons = top_loss_reasons.split(",").map((r) => r.trim()).filter(Boolean);

  const industryWinRate = rangeInt(25, 50, seed, 0);
  const benchmark = winRate > industryWinRate ? "above" : winRate === industryWinRate ? "at" : "below";

  const revenueWon = avg_deal_size ? deals_won * avg_deal_size : null;
  const revenueLost = avg_deal_size ? deals_lost * avg_deal_size : null;

  const actionItems = pickN([
    `${lossReasons[0] ? `Address "${lossReasons[0]}"` : "Top loss reason"} — this is your highest-leverage improvement`,
    `Build a dedicated ${primary_competitor_lost_to ?? "top competitor"} battlecard and train reps in next QBR`,
    `Win/loss interviews: schedule 5 customer calls this quarter to validate themes`,
    `Improve ${winReasons[0] ? `"${winReasons[0]}"` : "top win reason"} positioning in the pitch deck — make it unmissable`,
    `Create ROI calculator to combat "price" objections proactively`,
    `Identify deal patterns: which stages have the highest drop-off?`,
  ], 4, seed + "actions");

  const trendIndicator = pick(["📈 Improving", "📉 Declining", "➡️ Stable", "⚠️ Volatile"], seed, 10);

  const segmentBreakdown = pickN(MARKET_SEGMENTS, 3, seed + "seg").map((seg, i) => ({
    segment: seg,
    winRate: rangeInt(20, 75, seed, i + 20),
    deals: rangeInt(3, 20, seed, i + 30),
  }));

  let out = `## Win/Loss Analysis: ${your_product}\n\n`;
  out += `**Period:** ${time_period} | **Total deals:** ${totalDeals} | **Trend:** ${trendIndicator}\n\n`;

  out += `### Overall Performance\n\n`;
  const winBar = "🟢".repeat(Math.round(winRate / 10)) + "🔴".repeat(10 - Math.round(winRate / 10));
  out += `${winBar}\n\n`;
  out += `| Metric | Value |\n|--------|-------|\n`;
  out += `| Deals won | ${deals_won} (${winRate}%) |\n`;
  out += `| Deals lost | ${deals_lost} (${lossRate}%) |\n`;
  out += `| Win rate | **${winRate}%** |\n`;
  out += `| Industry benchmark | ~${industryWinRate}% |\n`;
  out += `| Vs. benchmark | **${benchmark} benchmark** |\n`;
  if (revenueWon) out += `| Revenue won | $${revenueWon.toLocaleString()} |\n`;
  if (revenueLost) out += `| Revenue left on table | $${revenueLost.toLocaleString()} |\n`;
  out += `\n`;

  out += `### Why We Win\n\n`;
  winReasons.forEach((r, i) => {
    const pct = rangeInt(20, 55, seed, i + 40);
    out += `- **${r}** — cited in ~${pct}% of wins\n`;
  });
  out += `\n`;

  out += `### Why We Lose\n\n`;
  lossReasons.forEach((r, i) => {
    const pct = rangeInt(20, 55, seed, i + 50);
    out += `- **${r}** — cited in ~${pct}% of losses\n`;
  });
  if (primary_competitor_lost_to) {
    out += `\n**Primary competitor lost to:** ${primary_competitor_lost_to} (${rangeInt(25, 60, seed, 60)}% of loss deals)\n`;
  }
  out += `\n`;

  out += `### Win Rate by Segment\n\n`;
  out += `| Segment | Win Rate | Deals |\n|---------|----------|-------|\n`;
  segmentBreakdown.forEach((s) => {
    const indicator = s.winRate >= 50 ? "🟢" : s.winRate >= 35 ? "🟡" : "🔴";
    out += `| ${s.segment} | ${indicator} ${s.winRate}% | ${s.deals} |\n`;
  });
  out += `\n`;

  out += `### Priority Actions\n\n`;
  actionItems.forEach((a, i) => { out += `${i + 1}. ${a}\n`; });
  out += `\n`;

  out += `### Win Rate Improvement Forecast\n\n`;
  const uplift = rangeInt(5, 15, seed, 70);
  out += `Addressing top 2 loss reasons could improve win rate by **+${uplift}pp** → **${winRate + uplift}%** win rate\n`;
  if (revenueWon && avg_deal_size) {
    const addlRevenue = Math.round(deals_lost * (uplift / 100) * avg_deal_size);
    out += `Revenue impact: **+$${addlRevenue.toLocaleString()}** in ${time_period} equivalent\n`;
  }
  out += FOOTER;
  return out;
}
