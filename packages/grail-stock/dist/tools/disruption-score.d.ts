import { z } from "zod";
export declare const DisruptionScoreInput: z.ZodObject<{
    company: z.ZodString;
}, "strip", z.ZodTypeAny, {
    company: string;
}, {
    company: string;
}>;
export declare function disruptionScore(input: z.infer<typeof DisruptionScoreInput>): string;
//# sourceMappingURL=disruption-score.d.ts.map