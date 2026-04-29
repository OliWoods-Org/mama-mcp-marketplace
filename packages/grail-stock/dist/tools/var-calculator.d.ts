import { z } from "zod";
export declare const VarCalculatorInput: z.ZodObject<{
    portfolio: z.ZodArray<z.ZodObject<{
        ticker: z.ZodString;
        weight: z.ZodNumber;
        value: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        ticker: string;
        value: number;
        weight: number;
    }, {
        ticker: string;
        value: number;
        weight: number;
    }>, "many">;
    confidence_level: z.ZodDefault<z.ZodEnum<["95%", "99%"]>>;
    time_horizon: z.ZodDefault<z.ZodEnum<["1d", "1w", "1m"]>>;
}, "strip", z.ZodTypeAny, {
    portfolio: {
        ticker: string;
        value: number;
        weight: number;
    }[];
    confidence_level: "95%" | "99%";
    time_horizon: "1d" | "1w" | "1m";
}, {
    portfolio: {
        ticker: string;
        value: number;
        weight: number;
    }[];
    confidence_level?: "95%" | "99%" | undefined;
    time_horizon?: "1d" | "1w" | "1m" | undefined;
}>;
export declare function varCalculator(input: z.infer<typeof VarCalculatorInput>): string;
//# sourceMappingURL=var-calculator.d.ts.map