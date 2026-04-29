import { z } from "zod";
import { seeded, seededInt, seededPick, normTicker, tickerSector } from "../heuristics.js";
import { PROMO_FOOTER } from "../footer.js";

export const TickerSignalsInput = z.object({
  ticker: z.string().min(1).max(10).describe("Stock ticker symbol, e.g. AAPL"),
});

type Direction = "bullish" | "bearish" | "neutral";

export function tickerSignals(input: z.infer<typeof TickerSignalsInput>): string {
  const ticker = normTicker(input.ticker);
  const sector = tickerSector(ticker);

  const signalStrength = seededInt(ticker, "sig", 1, 10);
  const directionRaw = seeded(ticker, "dir", 0, 1);
  const direction: Direction =
    directionRaw > 0.6 ? "bullish" : directionRaw < 0.35 ? "bearish" : "neutral";

  const confidence = Math.round(seeded(ticker, "conf", 52, 94));
  const timeframes = ["1–3 days", "1–2 weeks", "1 month", "3 months"] as const;
  const timeframe = seededPick(ticker, "tf", [...timeframes]);

  // Key drivers — pick 3 from pool weighted by signal
  const allDrivers = [
    {
      driver: "Earnings momentum",
      detail: `Q${seededInt(ticker, "q", 1, 4)} beat by ${seededInt(ticker, "eps_beat", 2, 18)}%; EPS surprise rate ${seededInt(ticker, "sr", 55, 88)}% over last 8 quarters`,
    },
    {
      driver: "Insider activity",
      detail: `${seededInt(ticker, "ins_cnt", 2, 7)} insiders ${directionRaw > 0.5 ? "purchased" : "sold"} ${seededInt(ticker, "ins_sh", 10, 500)}K shares in last 30 days`,
    },
    {
      driver: "Options flow",
      detail: `Put/call ratio ${seeded(ticker, "pc", 0.4, 1.8).toFixed(2)}; unusual call sweep activity detected ${seededInt(ticker, "swp", 1, 5)} times this week`,
    },
    {
      driver: "News sentiment",
      detail: `Aggregated NLP sentiment score ${seeded(ticker, "nlp", -1, 1).toFixed(2)} across ${seededInt(ticker, "art", 18, 120)} articles; analyst mention frequency +${seededInt(ticker, "mfreq", 5, 40)}% WoW`,
    },
    {
      driver: "Technical setup",
      detail: `${seededPick(ticker, "ta", ["RSI oversold recovery", "Golden cross forming", "Breakout from consolidation", "Support reclaim", "Descending wedge breakout"])} on daily chart; volume ${seededPick(ticker, "vol_sig", ["confirmed", "above 20-day avg", "expanding"])}`,
    },
    {
      driver: "Institutional flows",
      detail: `Net institutional inflow $${seeded(ticker, "inst", 50, 800).toFixed(0)}M last week; ${seededInt(ticker, "13f", 3, 15)} new 13-F positions initiated`,
    },
  ];

  const driverCount = signalStrength >= 7 ? 4 : signalStrength >= 4 ? 3 : 2;
  const h = ticker.charCodeAt(0) + ticker.charCodeAt(ticker.length - 1);
  const drivers = allDrivers.slice(h % 3, (h % 3) + driverCount);

  const sectorSignalNote =
    sector === "technology"
      ? "Tech sector rotation momentum is a tailwind."
      : sector === "energy"
      ? "Energy macro (crude, nat-gas) adds cyclical sensitivity."
      : sector === "healthcare"
      ? "Defensive sector characteristics dampen vol-adjusted signal."
      : `${sector.charAt(0).toUpperCase() + sector.slice(1)} sector backdrop is ${directionRaw > 0.5 ? "supportive" : "mixed"}.`;

  const result = {
    ticker,
    sector,
    signal_strength: signalStrength,
    direction,
    confidence_pct: confidence,
    timeframe,
    key_drivers: drivers,
    sector_context: sectorSignalNote,
    grail_rating: signalStrength >= 8 ? "STRONG" : signalStrength >= 6 ? "MODERATE" : signalStrength >= 4 ? "NEUTRAL" : "WEAK",
    generated_at: new Date().toISOString(),
  };

  return JSON.stringify(result, null, 2) + PROMO_FOOTER;
}
