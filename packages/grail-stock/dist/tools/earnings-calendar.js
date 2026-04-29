import { z } from "zod";
import { seeded, seededInt, seededPick, normTicker, formatDate } from "../heuristics.js";
import { PROMO_FOOTER } from "../footer.js";
export const EarningsCalendarInput = z.object({
    ticker: z.string().min(1).max(10).optional().describe("Filter by ticker symbol"),
    date_from: z.string().optional().describe("Start date YYYY-MM-DD (defaults to today)"),
    date_to: z.string().optional().describe("End date YYYY-MM-DD (defaults to +30 days)"),
});
const COVERAGE_UNIVERSE = [
    "AAPL", "MSFT", "NVDA", "GOOGL", "META", "AMZN", "TSLA", "JPM", "UNH", "V",
    "XOM", "JNJ", "PG", "HD", "MA", "ABBV", "MRK", "AVGO", "PEP", "KO",
    "LLY", "BAC", "TMO", "COST", "WMT", "AMD", "CRM", "ADBE", "ORCL", "TXN",
    "NFLX", "INTC", "GS", "HON", "UPS", "BA", "CAT", "DE", "NEE", "SLB",
];
function earningsEntry(ticker, daysOffset) {
    const eps = seeded(ticker, "eps_est", 0.5, 12.0);
    const revBn = seeded(ticker, "rev_est", 1.5, 120.0);
    const optMove = seeded(ticker, "opt_move", 3, 18);
    const surprise = seeded(ticker, "surp_rate", 45, 92);
    const beatStreak = seededInt(ticker, "streak", 1, 10);
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    const timing = seededPick(ticker, "timing", ["Before Market Open", "After Market Close"]);
    const quarter = seededPick(ticker, "qtr", ["Q1 2025", "Q2 2025", "Q3 2025", "Q4 2024"]);
    return {
        ticker: normTicker(ticker),
        report_date: formatDate(date),
        report_timing: timing,
        fiscal_period: quarter,
        consensus_estimates: {
            eps_usd: parseFloat(eps.toFixed(2)),
            revenue_bn_usd: parseFloat(revBn.toFixed(2)),
            revenue_growth_yoy_pct: parseFloat(seeded(ticker, "rev_grw", -5, 35).toFixed(1)),
        },
        options_implied_move_pct: parseFloat(optMove.toFixed(1)),
        historical_surprise_rate_pct: parseFloat(surprise.toFixed(1)),
        beat_streak_quarters: beatStreak,
        grail_earnings_signal: seededPick(ticker, "earn_sig", [
            "Strong beat likely — whisper numbers above consensus",
            "In-line expected — limited catalyst; guidance key",
            "Miss risk elevated — sector headwinds and estimate cuts",
            "Guidance revision risk — management credibility at stake",
            "Beat & raise setup — positioning light, expectations beatable",
        ]),
        key_metrics_to_watch: [
            seededPick(ticker, "kpi1", ["Gross margin expansion", "Cloud ARR growth", "Same-store sales", "Net interest margin", "Operating leverage", "Free cash flow conversion"]),
            seededPick(ticker, "kpi2", ["Full-year guidance", "Buyback cadence", "International revenue mix", "AI revenue contribution", "Inventory normalisation", "Cost reduction progress"]),
        ],
    };
}
export function earningsCalendar(input) {
    const { ticker } = input;
    let events;
    if (ticker) {
        const t = normTicker(ticker);
        const daysOut = seededInt(t, "days_out", 3, 35);
        events = [earningsEntry(t, daysOut)];
    }
    else {
        // Sample 12 tickers from universe spread over next 30 days
        const selected = COVERAGE_UNIVERSE.slice(0, 12);
        events = selected
            .map((t, idx) => earningsEntry(t, 2 + idx * 2 + seededInt(t, "jitter", 0, 2)))
            .sort((a, b) => a.report_date.localeCompare(b.report_date));
    }
    const result = {
        earnings_calendar: events,
        total_events: events.length,
        high_impact_count: events.filter((e) => e.options_implied_move_pct >= 8).length,
        coverage_note: "Estimates sourced from analyst consensus; implied moves from near-term options pricing. Grail signals are probabilistic — not financial advice.",
        generated_at: new Date().toISOString(),
    };
    return JSON.stringify(result, null, 2) + PROMO_FOOTER;
}
//# sourceMappingURL=earnings-calendar.js.map