/**
 * Deterministic heuristics that turn a ticker / company string into
 * stable, realistic-looking numeric outputs.  In production these
 * would be backed by real market data APIs; here we use a reproducible
 * hash so every tool call returns coherent, self-consistent values.
 */
/** djb2 hash → unsigned 32-bit integer */
export declare function hash32(s: string): number;
/** Return a float in [min, max) seeded from key + salt */
export declare function seeded(key: string, salt: string, min: number, max: number): number;
/** Return a seeded integer in [min, max] */
export declare function seededInt(key: string, salt: string, min: number, max: number): number;
/** Pick a seeded element from an array */
export declare function seededPick<T>(key: string, salt: string, arr: T[]): T;
/** Generate a seeded date offset from today (days) */
export declare function seededFutureDays(key: string, salt: string, min: number, max: number): Date;
export declare function formatDate(d: Date): string;
/** Normalise ticker: trim, uppercase */
export declare function normTicker(t: string): string;
export declare function tickerSector(ticker: string): string;
//# sourceMappingURL=heuristics.d.ts.map