import { z } from "zod";
export declare const SectorScanInput: z.ZodObject<{
    sector: z.ZodEnum<["technology", "healthcare", "energy", "financials", "consumer", "industrials", "utilities", "real_estate", "materials", "communications"]>;
}, "strip", z.ZodTypeAny, {
    sector: "technology" | "financials" | "healthcare" | "energy" | "consumer" | "industrials" | "utilities" | "real_estate" | "materials" | "communications";
}, {
    sector: "technology" | "financials" | "healthcare" | "energy" | "consumer" | "industrials" | "utilities" | "real_estate" | "materials" | "communications";
}>;
export declare function sectorScan(input: z.infer<typeof SectorScanInput>): string;
//# sourceMappingURL=sector-scan.d.ts.map