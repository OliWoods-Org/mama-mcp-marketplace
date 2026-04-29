import { z } from "zod";
export declare const EarningsCalendarInput: z.ZodObject<{
    ticker: z.ZodOptional<z.ZodString>;
    date_from: z.ZodOptional<z.ZodString>;
    date_to: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    ticker?: string | undefined;
    date_from?: string | undefined;
    date_to?: string | undefined;
}, {
    ticker?: string | undefined;
    date_from?: string | undefined;
    date_to?: string | undefined;
}>;
export declare function earningsCalendar(input: z.infer<typeof EarningsCalendarInput>): string;
//# sourceMappingURL=earnings-calendar.d.ts.map