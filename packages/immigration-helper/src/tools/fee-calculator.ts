import { z } from "zod";
import { seededPick, normKey } from "../heuristics.js";
import { PROMO_FOOTER } from "../footer.js";

export const FeeCalculatorInput = z.object({
  application_type: z.enum([
    "H-1B", "L-1", "O-1",
    "EB-1A", "EB-1B", "EB-1C",
    "EB-2-NIW", "EB-3",
    "I-485", "I-130",
    "K-1", "N-400",
    "F-1", "DACA", "EAD-renewal",
  ]).describe("Type of application"),
  premium_processing: z.boolean().default(false).describe("Include premium processing fee (I-907)?"),
  family_members: z.number().min(0).max(10).default(0).describe("Number of additional family members applying (for I-485 concurrent filings)"),
});

type FeeBreakdown = {
  form_fee: number;
  biometrics_fee: number | null;
  asylum_program_fee: number | null;
  fraud_prevention_fee: number | null;
  premium_processing_fee: number | null;
  notes: string[];
};

const FEE_DATA: Record<string, FeeBreakdown> = {
  "H-1B": {
    form_fee: 730,
    biometrics_fee: null,
    asylum_program_fee: 600,
    fraud_prevention_fee: 500,
    premium_processing_fee: 2805,
    notes: [
      "I-129 base fee: $730",
      "ACWIA training fee: $750 (1–25 employees) or $1,500 (26+ employees) — not included above",
      "Asylum programme surcharge: $600 (most employers)",
      "Fraud prevention and detection fee: $500",
      "H-1B1 (Chile/Singapore): different fee schedule",
      "Note: Fees change periodically — verify at uscis.gov/fees before filing",
    ],
  },
  "L-1": {
    form_fee: 730,
    biometrics_fee: null,
    asylum_program_fee: 600,
    fraud_prevention_fee: 500,
    premium_processing_fee: 2805,
    notes: [
      "I-129 base fee: $730",
      "Fraud prevention fee: $500",
      "Asylum programme surcharge: $600",
      "Blanket L: I-129S (no separate filing fee beyond initial blanket approval)",
    ],
  },
  "O-1": {
    form_fee: 730,
    biometrics_fee: null,
    asylum_program_fee: 600,
    fraud_prevention_fee: null,
    premium_processing_fee: 2805,
    notes: [
      "I-129 base fee: $730",
      "Asylum programme surcharge: $600",
      "No fraud prevention fee for O-1",
    ],
  },
  "EB-1A": {
    form_fee: 700,
    biometrics_fee: null,
    asylum_program_fee: null,
    fraud_prevention_fee: null,
    premium_processing_fee: 2805,
    notes: [
      "I-140 base fee: $700",
      "Self-petition — no employer contribution required",
      "If concurrent I-485: add I-485 fees (see I-485 row)",
    ],
  },
  "EB-1B": {
    form_fee: 700,
    biometrics_fee: null,
    asylum_program_fee: null,
    fraud_prevention_fee: null,
    premium_processing_fee: 2805,
    notes: [
      "I-140 base fee: $700 (employer pays)",
      "Premium processing highly recommended for faster adjudication",
    ],
  },
  "EB-1C": {
    form_fee: 700,
    biometrics_fee: null,
    asylum_program_fee: null,
    fraud_prevention_fee: null,
    premium_processing_fee: 2805,
    notes: [
      "I-140 base fee: $700 (employer pays)",
      "No PERM required — saves significant cost vs EB-2/EB-3",
    ],
  },
  "EB-2-NIW": {
    form_fee: 700,
    biometrics_fee: null,
    asylum_program_fee: null,
    fraud_prevention_fee: null,
    premium_processing_fee: 2805,
    notes: [
      "I-140 base fee: $700 (self-petition)",
      "No PERM required — saves $4,000–8,000 in attorney fees for PERM process",
    ],
  },
  "EB-3": {
    form_fee: 700,
    biometrics_fee: null,
    asylum_program_fee: null,
    fraud_prevention_fee: null,
    premium_processing_fee: 2805,
    notes: [
      "I-140 base fee: $700 (employer pays)",
      "PERM labor certification required first (no USCIS fee, but DOL and attorney costs apply)",
      "PERM attorney fees typically $3,000–5,000",
    ],
  },
  "I-485": {
    form_fee: 1440,
    biometrics_fee: 85,
    asylum_program_fee: null,
    fraud_prevention_fee: null,
    premium_processing_fee: null,
    notes: [
      "I-485 application fee: $1,440 (includes biometrics)",
      "Medical exam (I-693): $200–400 (civil surgeon; not a USCIS fee)",
      "I-131 Advance Parole: $630 (strongly recommended — file concurrently)",
      "I-765 EAD: $520 (file concurrently to maintain work authorisation)",
      "Children under 14 filing with parent: reduced fee — check uscis.gov/fees",
    ],
  },
  "I-130": {
    form_fee: 675,
    biometrics_fee: null,
    asylum_program_fee: null,
    fraud_prevention_fee: null,
    premium_processing_fee: null,
    notes: [
      "I-130 filing fee: $675 per petition",
      "Each beneficiary requires a separate I-130",
      "DS-260 immigrant visa application fee: $325 (consular processing)",
    ],
  },
  "K-1": {
    form_fee: 675,
    biometrics_fee: null,
    asylum_program_fee: null,
    fraud_prevention_fee: null,
    premium_processing_fee: null,
    notes: [
      "I-129F: $675",
      "DS-160 nonimmigrant visa fee: $265",
      "Medical exam at US consulate: $200–400 (varies by country)",
      "After marriage, I-485 required: $1,440 additional",
    ],
  },
  "N-400": {
    form_fee: 760,
    biometrics_fee: 0,
    asylum_program_fee: null,
    fraud_prevention_fee: null,
    premium_processing_fee: null,
    notes: [
      "N-400: $760 (biometrics included in this fee for online filers)",
      "Fee waiver (Form I-912) available for income-qualifying applicants",
      "Military applicants: may file at no cost",
      "Expedite requests possible for deployed military",
    ],
  },
  "F-1": {
    form_fee: 185,
    biometrics_fee: null,
    asylum_program_fee: null,
    fraud_prevention_fee: null,
    premium_processing_fee: null,
    notes: [
      "DS-160 MRV visa fee: $185",
      "SEVIS I-901 fee: $350 (most academic students) or $220 (vocational)",
      "Medical exam: varies by consulate",
      "Note: These are consular fees, not USCIS fees",
    ],
  },
  "DACA": {
    form_fee: 0,
    biometrics_fee: null,
    asylum_program_fee: null,
    fraud_prevention_fee: null,
    premium_processing_fee: null,
    notes: [
      "I-821D DACA request: $0 filing fee",
      "I-765 EAD (included with DACA): $495 total",
      "Biometrics: included in I-765 fee",
      "Renewals: same fee structure",
    ],
  },
  "EAD-renewal": {
    form_fee: 520,
    biometrics_fee: 85,
    asylum_program_fee: null,
    fraud_prevention_fee: null,
    premium_processing_fee: null,
    notes: [
      "I-765 EAD renewal: $520",
      "Biometrics may or may not be required — USCIS determines",
      "File 180 days before expiration — avoid gaps in work authorisation",
    ],
  },
};

const ATTORNEY_FEE_RANGES: Record<string, string> = {
  "H-1B": "$2,500–6,000 (employer-side); employer typically pays",
  "L-1": "$3,000–7,000",
  "O-1": "$3,000–8,000",
  "EB-1A": "$5,000–15,000 (complex evidentiary case)",
  "EB-1B": "$4,000–10,000",
  "EB-1C": "$3,500–8,000",
  "EB-2-NIW": "$4,000–12,000",
  "EB-3": "$3,000–6,000 (I-140 only); add $3,000–5,000 for PERM",
  "I-485": "$2,500–5,000",
  "I-130": "$1,500–3,500",
  "K-1": "$2,500–5,000",
  "N-400": "$1,000–2,500",
  "F-1": "$500–1,500",
  "DACA": "$500–1,500",
  "EAD-renewal": "$300–800",
};

export function feeCalculator(input: z.infer<typeof FeeCalculatorInput>): string {
  const key = normKey(input.application_type + input.premium_processing);
  const fees = FEE_DATA[input.application_type];

  let totalGovFees = fees.form_fee;
  if (fees.biometrics_fee) totalGovFees += fees.biometrics_fee;
  if (fees.asylum_program_fee) totalGovFees += fees.asylum_program_fee;
  if (fees.fraud_prevention_fee) totalGovFees += fees.fraud_prevention_fee;
  if (input.premium_processing && fees.premium_processing_fee) totalGovFees += fees.premium_processing_fee;

  // Family members (I-485 concurrent filings)
  const i485FeePerPerson = 1440;
  const additionalFamilyCost = input.family_members > 0
    ? input.application_type === "I-485"
      ? input.family_members * i485FeePerPerson
      : input.family_members * 1440
    : 0;

  const govFeesBreakdown: Record<string, number | string> = {
    primary_form_fee_usd: fees.form_fee,
  };
  if (fees.biometrics_fee !== null) govFeesBreakdown["biometrics_usd"] = fees.biometrics_fee || "included";
  if (fees.asylum_program_fee) govFeesBreakdown["asylum_program_surcharge_usd"] = fees.asylum_program_fee;
  if (fees.fraud_prevention_fee) govFeesBreakdown["fraud_prevention_fee_usd"] = fees.fraud_prevention_fee;
  if (input.premium_processing && fees.premium_processing_fee) {
    govFeesBreakdown["premium_processing_I907_usd"] = fees.premium_processing_fee;
  }
  if (additionalFamilyCost > 0) {
    govFeesBreakdown[`${input.family_members}_additional_family_members_usd`] = additionalFamilyCost;
  }

  const attorneyRange = ATTORNEY_FEE_RANGES[input.application_type] ?? "$1,000–5,000";

  const result = {
    application_type: input.application_type,
    premium_processing_requested: input.premium_processing,
    additional_family_members: input.family_members,
    government_fees_breakdown: govFeesBreakdown,
    total_uscis_government_fees_usd: totalGovFees + additionalFamilyCost,
    attorney_fee_range: attorneyRange,
    estimated_total_cost_usd: `$${totalGovFees + additionalFamilyCost} (USCIS) + attorney fees (${attorneyRange})`,
    additional_costs_to_budget_for: fees.notes,
    payment_options: [
      "Check or money order (paper filings) — payable to 'US Department of Homeland Security'",
      "Credit or debit card (Form G-1450) for paper filings",
      "Online payment via uscis.gov for eligible forms",
    ],
    fee_waiver_info: ["I-912 (Request for Fee Waiver): available for I-485, N-400, DACA, and other applications if household income is at or below 150% of federal poverty guidelines"],
    disclaimer:
      "USCIS fees change periodically. Always verify current fees at uscis.gov/fees before filing. This tool reflects approximate 2024–2025 fee schedules.",
    generated_at: new Date().toISOString(),
  };

  return JSON.stringify(result, null, 2) + PROMO_FOOTER;
}
