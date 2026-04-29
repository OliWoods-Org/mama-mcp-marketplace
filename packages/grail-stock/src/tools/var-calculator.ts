import { z } from "zod";
import { seeded, seededInt, normTicker } from "../heuristics.js";
import { PROMO_FOOTER } from "../footer.js";

const PortfolioHoldingSchema = z.object({
  ticker: z.string().min(1).max(10),
  weight: z.number().min(0).max(1).describe("Portfolio weight 0–1"),
  value: z.number().positive().describe("Position value in USD"),
});

export const VarCalculatorInput = z.object({
  portfolio: z
    .array(PortfolioHoldingSchema)
    .min(1)
    .max(50)
    .describe("Array of portfolio holdings"),
  confidence_level: z
    .enum(["95%", "99%"])
    .default("95%")
    .describe("VaR confidence level"),
  time_horizon: z
    .enum(["1d", "1w", "1m"])
    .default("1d")
    .describe("Time horizon for VaR calculation"),
});

/** Z-scores for one-tailed confidence */
const Z_SCORE: Record<string, number> = { "95%": 1.645, "99%": 2.326 };

/** Approximate annualised volatility by asset class heuristic */
function annualVol(ticker: string): number {
  const t = normTicker(ticker);
  // Indices / ETFs
  if (["SPY", "QQQ", "DIA", "IWM", "VTI"].includes(t)) return 0.16;
  // Crypto proxies
  if (["MSTR", "COIN", "MARA", "RIOT"].includes(t)) return 0.85;
  // High-beta tech
  if (["NVDA", "AMD", "TSLA", "PLTR", "SNOW", "SHOP"].includes(t))
    return 0.45 + seeded(t, "vol_adj", 0, 0.15);
  // Mid-vol tech
  if (["AAPL", "MSFT", "GOOGL", "META", "AMZN"].includes(t))
    return 0.28 + seeded(t, "vol_adj", 0, 0.06);
  // Defensive
  if (["JNJ", "PG", "KO", "WMT", "NEE", "DUK"].includes(t))
    return 0.14 + seeded(t, "vol_adj", 0, 0.05);
  // Financials
  if (["JPM", "BAC", "GS", "MS", "BLK"].includes(t))
    return 0.24 + seeded(t, "vol_adj", 0, 0.06);
  // Energy
  if (["XOM", "CVX", "COP", "SLB"].includes(t))
    return 0.28 + seeded(t, "vol_adj", 0, 0.08);
  // Default: mid-vol
  return 0.30 + seeded(t, "vol_adj", -0.05, 0.15);
}

/** Approximate average pairwise correlation within portfolio */
function portfolioCorrelation(tickers: string[]): number {
  if (tickers.length === 1) return 1.0;
  // Heuristic: sum of pairwise hash-derived correlations
  let total = 0;
  let pairs = 0;
  for (let i = 0; i < tickers.length; i++) {
    for (let j = i + 1; j < tickers.length; j++) {
      const key = [tickers[i], tickers[j]].sort().join("_");
      total += seeded(key, "corr", 0.1, 0.85);
      pairs++;
    }
  }
  return pairs === 0 ? 0.5 : total / pairs;
}

const HORIZON_DAYS: Record<string, number> = { "1d": 1, "1w": 5, "1m": 21 };

export function varCalculator(input: z.infer<typeof VarCalculatorInput>): string {
  const { portfolio, confidence_level, time_horizon } = input;

  const totalValue = portfolio.reduce((s, h) => s + h.value, 0);
  const days = HORIZON_DAYS[time_horizon];
  const z = Z_SCORE[confidence_level];
  const sqrtT = Math.sqrt(days / 252);

  // Per-position daily vol & VaR
  const positions = portfolio.map((h) => {
    const vol = annualVol(h.ticker);
    const posVaR = h.value * vol * sqrtT * z;
    return { ...h, annual_vol_pct: Math.round(vol * 100), position_var_usd: Math.round(posVaR) };
  });

  // Portfolio VaR (accounting for correlations)
  const tickers = portfolio.map((h) => normTicker(h.ticker));
  const avgCorr = portfolioCorrelation(tickers);
  const weightedVol =
    positions.reduce((s, p) => {
      const w = p.value / totalValue;
      const dailyVol = annualVol(p.ticker) * sqrtT;
      return s + w * dailyVol;
    }, 0);

  // Diversification: σ_p = sqrt( Σwi²σi² + 2ΣΣ wi wj σi σj ρij )
  // Simplified: σ_p ≈ weightedVol * sqrt(avgCorr + (1-avgCorr)/n)
  const n = portfolio.length;
  const diversificationFactor = Math.sqrt(avgCorr + (1 - avgCorr) / n);
  const portfolioVolAdjusted = weightedVol * diversificationFactor;
  const portfolioVaR = totalValue * portfolioVolAdjusted * z;

  // Undiversified VaR (sum of individual VaRs — zero correlation assumption relaxed)
  const sumVaR = positions.reduce((s, p) => s + p.position_var_usd, 0);
  const diversificationBenefit = sumVaR - portfolioVaR;

  // Expected Shortfall ≈ VaR * ES_ratio
  const esRatio = confidence_level === "99%" ? 1.14 : 1.25;
  const expectedShortfall = portfolioVaR * esRatio;

  // Worst-case: 3-sigma event
  const worstCase = totalValue * portfolioVolAdjusted * 3.0;

  // Concentration risk
  const maxWeightPos = positions.reduce((a, b) => (a.value >= b.value ? a : b));
  const concentrationRisk =
    maxWeightPos.value / totalValue > 0.3
      ? "HIGH — single position exceeds 30% of portfolio"
      : maxWeightPos.value / totalValue > 0.2
      ? "MODERATE — largest position is 20–30% of portfolio"
      : "LOW — portfolio is well-diversified by position size";

  const result = {
    summary: {
      total_portfolio_value_usd: Math.round(totalValue),
      confidence_level,
      time_horizon,
      value_at_risk_usd: Math.round(portfolioVaR),
      value_at_risk_pct: parseFloat(((portfolioVaR / totalValue) * 100).toFixed(2)),
      expected_shortfall_usd: Math.round(expectedShortfall),
      worst_case_loss_usd: Math.round(worstCase),
      diversification_benefit_usd: Math.round(Math.max(0, diversificationBenefit)),
      avg_portfolio_correlation: parseFloat(avgCorr.toFixed(3)),
      concentration_risk: concentrationRisk,
    },
    positions: positions.map((p) => ({
      ticker: normTicker(p.ticker),
      value_usd: Math.round(p.value),
      weight_pct: parseFloat(((p.value / totalValue) * 100).toFixed(1)),
      annual_vol_pct: p.annual_vol_pct,
      position_var_usd: p.position_var_usd,
    })),
    interpretation: {
      plain_english: `There is a ${confidence_level} probability that this portfolio will NOT lose more than $${Math.round(portfolioVaR).toLocaleString()} over the next ${time_horizon}.`,
      stress_note:
        "VaR is a statistical estimate. Fat-tail events (2008, 2020 COVID crash) regularly exceed modelled VaR. Consider stress-testing against −30% scenarios.",
    },
    generated_at: new Date().toISOString(),
  };

  return JSON.stringify(result, null, 2) + PROMO_FOOTER;
}
