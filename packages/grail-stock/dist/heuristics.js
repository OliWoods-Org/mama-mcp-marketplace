/**
 * Deterministic heuristics that turn a ticker / company string into
 * stable, realistic-looking numeric outputs.  In production these
 * would be backed by real market data APIs; here we use a reproducible
 * hash so every tool call returns coherent, self-consistent values.
 */
/** djb2 hash → unsigned 32-bit integer */
export function hash32(s) {
    let h = 5381;
    for (let i = 0; i < s.length; i++) {
        h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
    }
    return h;
}
/** Return a float in [min, max) seeded from key + salt */
export function seeded(key, salt, min, max) {
    const h = hash32(key.toUpperCase() + salt);
    return min + ((h % 10_000) / 10_000) * (max - min);
}
/** Return a seeded integer in [min, max] */
export function seededInt(key, salt, min, max) {
    return Math.round(seeded(key, salt, min, max));
}
/** Pick a seeded element from an array */
export function seededPick(key, salt, arr) {
    const idx = seededInt(key, salt, 0, arr.length - 1);
    return arr[idx];
}
/** Generate a seeded date offset from today (days) */
export function seededFutureDays(key, salt, min, max) {
    const days = seededInt(key, salt, min, max);
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d;
}
export function formatDate(d) {
    return d.toISOString().split("T")[0];
}
/** Normalise ticker: trim, uppercase */
export function normTicker(t) {
    return t.trim().toUpperCase().replace(/[^A-Z0-9.]/, "");
}
/** Map ticker to a rough sector for sector-aware heuristics */
const TICKER_SECTOR = {
    AAPL: "technology", MSFT: "technology", GOOGL: "technology", GOOG: "technology",
    META: "technology", AMZN: "technology", NVDA: "technology", AMD: "technology",
    TSLA: "technology", NFLX: "technology", CRM: "technology", ORCL: "technology",
    INTC: "technology", QCOM: "technology", AVGO: "technology", TXN: "technology",
    ADBE: "technology", NOW: "technology", SNOW: "technology", PLTR: "technology",
    JPM: "financials", BAC: "financials", WFC: "financials", GS: "financials",
    MS: "financials", BLK: "financials", C: "financials", AXP: "financials",
    JNJ: "healthcare", UNH: "healthcare", PFE: "healthcare", MRK: "healthcare",
    ABBV: "healthcare", LLY: "healthcare", CVS: "healthcare", MDT: "healthcare",
    XOM: "energy", CVX: "energy", COP: "energy", SLB: "energy", EOG: "energy",
    WMT: "consumer", PG: "consumer", KO: "consumer", PEP: "consumer", COST: "consumer",
    BA: "industrials", CAT: "industrials", GE: "industrials", HON: "industrials",
    NEE: "utilities", DUK: "utilities", SO: "utilities",
    AMT: "real_estate", PLD: "real_estate",
    GLD: "commodities", SLV: "commodities", USO: "commodities",
    SPY: "index", QQQ: "index", IWM: "index", DIA: "index",
};
export function tickerSector(ticker) {
    return TICKER_SECTOR[normTicker(ticker)] ?? "technology";
}
//# sourceMappingURL=heuristics.js.map