import { z } from "zod";
import { seeded, seededInt, seededPick, hash32 } from "../heuristics.js";
import { PROMO_FOOTER } from "../footer.js";

export const MarketVibeInput = z.object({
  sector: z
    .enum([
      "technology", "healthcare", "energy", "financials",
      "consumer", "industrials", "utilities", "real_estate",
      "materials", "communications",
    ])
    .optional()
    .describe("Optional sector filter for focused vibe analysis"),
});

const TOP_MOVER_POOL = [
  { ticker: "NVDA", theme: "AI infrastructure demand" },
  { ticker: "TSLA", theme: "EV delivery numbers" },
  { ticker: "META", theme: "Ad revenue beat" },
  { ticker: "AAPL", theme: "Services growth" },
  { ticker: "AMD", theme: "Data center GPU momentum" },
  { ticker: "AMZN", theme: "AWS re-acceleration" },
  { ticker: "JPM", theme: "Net interest income expansion" },
  { ticker: "LLY", theme: "GLP-1 demand pipeline" },
  { ticker: "XOM", theme: "Crude price volatility" },
  { ticker: "PLTR", theme: "Government AI contract wins" },
];

export function marketVibe(input: z.infer<typeof MarketVibeInput>): string {
  const sector = input.sector;
  // Use date as seed so the vibe changes daily but is stable within a day
  const today = new Date().toISOString().split("T")[0];
  const seedKey = (sector ?? "market") + today;

  const vibeScore = seededInt(seedKey, "vibe", 20, 85);
  const fearGreed =
    vibeScore >= 65
      ? "Greed"
      : vibeScore >= 55
      ? "Mild Greed"
      : vibeScore >= 45
      ? "Neutral"
      : vibeScore >= 35
      ? "Mild Fear"
      : "Fear";

  // Macro signals
  const fedStance = seededPick(seedKey, "fed", [
    "Hawkish hold — rates on pause, data-dependent",
    "Dovish pivot narrative gaining traction — 1–2 cuts priced in",
    "Uncertainty high — mixed signals from FOMC members",
    "Restrictive — higher-for-longer narrative intact",
  ]);

  const yieldsCurve = seededPick(seedKey, "yld", [
    `10Y Treasury at ${seeded(seedKey, "y10", 3.8, 5.2).toFixed(2)}% — steepening pressure`,
    `2Y/10Y spread ${seeded(seedKey, "spread", -80, 30).toFixed(0)}bps — inversion risk ${vibeScore < 45 ? "elevated" : "receding"}`,
    `Real yields positive at ${seeded(seedKey, "ry", 0.5, 2.5).toFixed(2)}% — equity multiple headwind`,
  ]);

  const vixLevel = seededInt(seedKey, "vix", 12, 38);
  const vixSignal =
    vixLevel < 15
      ? "Complacency zone — markets pricing low volatility"
      : vixLevel < 20
      ? "Normal range — balanced risk sentiment"
      : vixLevel < 28
      ? "Elevated anxiety — hedging demand increasing"
      : "Spike — fear dominant; historically a contrarian buy signal";

  const dxyLevel = seeded(seedKey, "dxy", 98, 108);
  const dxySignal =
    dxyLevel > 104
      ? `DXY ${dxyLevel.toFixed(1)} — strong dollar headwind for multinationals and commodities`
      : `DXY ${dxyLevel.toFixed(1)} — dollar neutral; EM and commodity tailwind`;

  // Top movers (3 picks seeded by day)
  const dayHash = hash32(today);
  const moverIdxs = [dayHash % 10, (dayHash >> 4) % 10, (dayHash >> 8) % 10];
  const topMovers = [...new Set(moverIdxs)].slice(0, 3).map((idx) => {
    const m = TOP_MOVER_POOL[idx];
    const chg = seeded(m.ticker + today, "chg", -8, 12);
    return {
      ticker: m.ticker,
      change_pct: parseFloat(chg.toFixed(2)),
      direction: chg >= 0 ? "up" : "down",
      driver: m.theme,
    };
  });

  // Narrative
  const narratives = [
    "AI capex cycle intact — hyperscalers re-affirm infrastructure spend; semis and cloud names leading.",
    "Rate cut optimism fading — sticky CPI data pushes Fed cut expectations to H2; risk-off in rate-sensitive names.",
    "Soft landing conviction building — labour data resilient, PMI recovering; cyclicals outperforming defensives.",
    "Geopolitical premium elevated — energy and defence names bid; risk appetite constrained by tail-risk positioning.",
    "Earnings season in full swing — guidance quality driving dispersion; beat-and-raise names sharply rewarded.",
  ];
  const narrative = seededPick(seedKey, "narr", narratives);

  // Sector-specific overlay
  let sectorOverlay: object | undefined;
  if (sector) {
    sectorOverlay = {
      sector_focus: sector,
      sector_vibe_delta:
        seededInt(sector + today, "sdelta", -15, 15) > 0
          ? `+${seededInt(sector + today, "sdelta", 1, 15)} points above market average`
          : `${seededInt(sector + today, "sdelta", -15, -1)} points below market average`,
      sector_catalyst: seededPick(sector + today, "scat", [
        "Earnings beats concentration above sector average",
        "Regulatory clarity improving",
        "Rate sensitivity creating near-term volatility",
        "Sector rotation flow from growth to value",
        "M&A activity lifting sentiment",
        "Short squeeze dynamics in oversold names",
      ]),
    };
  }

  const result = {
    ...(sector ? { scope: `${sector} sector` } : { scope: "Broad market" }),
    market_vibe_score: vibeScore,
    fear_greed_indicator: fearGreed,
    market_regime: seededPick(seedKey, "regime", [
      "Risk-on / momentum",
      "Risk-off / defensive",
      "Consolidation / range-bound",
      "Trending / breakout",
    ]),
    macro_signals: {
      fed_stance: fedStance,
      yields: yieldsCurve,
      vix: vixLevel,
      vix_interpretation: vixSignal,
      dollar: dxySignal,
      oil_wti_usd: parseFloat(seeded(seedKey, "oil", 68, 95).toFixed(2)),
    },
    top_movers: topMovers,
    market_narrative: narrative,
    grail_positioning_bias:
      vibeScore >= 65
        ? "RISK-ON — lean into momentum; high-beta and growth outperforming"
        : vibeScore >= 50
        ? "SELECTIVE — quality growth at reasonable price; avoid speculative fringe"
        : vibeScore >= 35
        ? "CAUTIOUS — raise cash, hedge tails; defensive positioning warranted"
        : "DEFENSIVE — capital preservation mode; utilities, treasuries, gold",
    ...(sectorOverlay ? { sector_analysis: sectorOverlay } : {}),
    generated_at: new Date().toISOString(),
  };

  return JSON.stringify(result, null, 2) + PROMO_FOOTER;
}
