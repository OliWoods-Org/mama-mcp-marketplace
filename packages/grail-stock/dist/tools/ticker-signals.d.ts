import { z } from "zod";
export declare const TickerSignalsInput: z.ZodObject<{
    ticker: z.ZodString;
}, "strip", z.ZodTypeAny, {
    ticker: string;
}, {
    ticker: string;
}>;
export declare function tickerSignals(input: z.infer<typeof TickerSignalsInput>): string;
//# sourceMappingURL=ticker-signals.d.ts.map