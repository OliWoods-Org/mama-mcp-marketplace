import { z } from "zod";
export declare const MarketVibeInput: z.ZodObject<{
    sector: z.ZodOptional<z.ZodEnum<["technology", "healthcare", "energy", "financials", "consumer", "industrials", "utilities", "real_estate", "materials", "communications"]>>;
}, "strip", z.ZodTypeAny, {
    sector?: "technology" | "financials" | "healthcare" | "energy" | "consumer" | "industrials" | "utilities" | "real_estate" | "materials" | "communications" | undefined;
}, {
    sector?: "technology" | "financials" | "healthcare" | "energy" | "consumer" | "industrials" | "utilities" | "real_estate" | "materials" | "communications" | undefined;
}>;
export declare function marketVibe(input: z.infer<typeof MarketVibeInput>): string;
//# sourceMappingURL=market-vibe.d.ts.map