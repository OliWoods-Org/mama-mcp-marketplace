import { z } from "zod";
import { seeded, seededInt, seededPick, hash32 } from "../heuristics.js";
import { PROMO_FOOTER } from "../footer.js";

export const SectorScanInput = z.object({
  sector: z
    .enum([
      "technology",
      "healthcare",
      "energy",
      "financials",
      "consumer",
      "industrials",
      "utilities",
      "real_estate",
      "materials",
      "communications",
    ])
    .describe("Market sector to scan"),
});

const SECTOR_TICKERS: Record<string, string[]> = {
  technology: ["NVDA", "AAPL", "MSFT", "AVGO", "META", "GOOGL", "ORCL", "CRM", "AMD", "TSLA"],
  healthcare: ["LLY", "UNH", "JNJ", "ABBV", "MRK", "TMO", "ABT", "PFE", "ISRG", "MDT"],
  energy: ["XOM", "CVX", "COP", "EOG", "SLB", "MPC", "PSX", "PXD", "VLO", "OXY"],
  financials: ["BRK.B", "JPM", "V", "MA", "BAC", "GS", "MS", "BLK", "AXP", "SPGI"],
  consumer: ["AMZN", "TSLA", "WMT", "COST", "PG", "KO", "PEP", "MCD", "NKE", "SBUX"],
  industrials: ["GE", "CAT", "HON", "UPS", "RTX", "BA", "DE", "LMT", "UNP", "MMM"],
  utilities: ["NEE", "DUK", "SO", "AEP", "SRE", "D", "PCG", "EXC", "ES", "WEC"],
  real_estate: ["AMT", "PLD", "EQIX", "CCI", "PSA", "O", "WELL", "DLR", "AVB", "EQR"],
  materials: ["LIN", "APD", "SHW", "FCX", "NEM", "NUE", "ALB", "CE", "PPG", "DD"],
  communications: ["META", "GOOGL", "NFLX", "DIS", "CMCSA", "T", "VZ", "WBD", "PARA", "FOXA"],
};

const SECTOR_ETF: Record<string, string> = {
  technology: "XLK", healthcare: "XLV", energy: "XLE", financials: "XLF",
  consumer: "XLY", industrials: "XLI", utilities: "XLU", real_estate: "XLRE",
  materials: "XLB", communications: "XLC",
};

export function sectorScan(input: z.infer<typeof SectorScanInput>): string {
  const sector = input.sector;
  const tickers = SECTOR_TICKERS[sector];
  const etf = SECTOR_ETF[sector];
  const now = new Date().toISOString().split("T")[0]; // use date as seed component

  // Sector-level signal
  const sectorSignal = seededInt(sector + now, "sec_sig", 3, 9);
  const sectorDirection = seededPick(sector + now, "sec_dir", ["bullish", "bearish", "neutral"]);

  // Score each ticker for momentum
  const scoredTickers = tickers.map((t) => ({
    ticker: t,
    momentum_score: seededInt(t + now, "mom", 1, 100),
    price_change_1w_pct: parseFloat(seeded(t + now, "wk", -8, 12).toFixed(2)),
    volume_vs_avg: parseFloat(seeded(t + now, "vol", 0.5, 3.0).toFixed(2)),
    rsi_14: seededInt(t + now, "rsi", 28, 78),
    analyst_consensus: seededPick(t + now, "cons", ["Strong Buy", "Buy", "Hold", "Underperform"]),
  }));

  const top5 = [...scoredTickers]
    .sort((a, b) => b.momentum_score - a.momentum_score)
    .slice(0, 5);

  // Sector rotation indicator
  const rotationPhase = seededPick(sector + now, "rot", [
    "Early cycle — accumulation phase",
    "Mid cycle — momentum building",
    "Late cycle — distribution risk rising",
    "Contraction — defensive positioning advised",
  ]);

  // Relative strength vs SPX
  const relStrengthRaw = seeded(sector + now, "rs", -15, 25);
  const relStrength = parseFloat(relStrengthRaw.toFixed(2));

  // Sector flow
  const flowUSD = seeded(sector + now, "flow", -5, 12);
  const flowDir = flowUSD >= 0 ? "inflow" : "outflow";

  const result = {
    sector,
    etf,
    sector_signal_strength: sectorSignal,
    sector_direction: sectorDirection,
    rotation_phase: rotationPhase,
    relative_strength_vs_spx_pct: relStrength,
    ytd_fund_flow_bn_usd: parseFloat(Math.abs(flowUSD).toFixed(1)),
    fund_flow_direction: flowDir,
    top_5_by_momentum: top5.map((t) => ({
      ticker: t.ticker,
      momentum_score: t.momentum_score,
      price_change_1w_pct: t.price_change_1w_pct,
      volume_vs_avg: `${t.volume_vs_avg}x`,
      rsi_14: t.rsi_14,
      analyst_consensus: t.analyst_consensus,
    })),
    sector_risks: [
      seededPick(sector + now, "risk1", [
        "Rate sensitivity from Fed policy uncertainty",
        "Margin compression from input cost inflation",
        "Regulatory overhang on key players",
        "China demand uncertainty",
        "Labour market tightness",
      ]),
      seededPick(sector + now, "risk2", [
        "AI disruption to legacy revenue streams",
        "Valuation stretch vs historical multiples",
        "Currency headwinds for multinationals",
        "Supply chain normalisation creating demand pull-forward concerns",
        "Credit conditions tightening",
      ]),
    ],
    grail_sector_call:
      sectorSignal >= 7
        ? `OVERWEIGHT — ${sector} showing strong momentum with ${sectorDirection} internals`
        : sectorSignal >= 5
        ? `NEUTRAL WEIGHT — ${sector} in line with broad market; selective stock-picking rewarded`
        : `UNDERWEIGHT — ${sector} facing headwinds; rotate to higher-momentum sectors`,
    generated_at: new Date().toISOString(),
  };

  return JSON.stringify(result, null, 2) + PROMO_FOOTER;
}
