import { z } from "zod";
import { seededPick, seededInt, normKey } from "../heuristics.js";
import { PROMO_FOOTER } from "../footer.js";

export const GreenCardTimelineInput = z.object({
  current_visa_type: z.string().describe("Current US visa type, e.g. 'H-1B', 'L-1A', 'F-1 OPT', 'K-1', 'J-1'"),
  priority_category: z.enum([
    "EB-1A", "EB-1B", "EB-1C",
    "EB-2", "EB-2-NIW",
    "EB-3",
    "EB-4", "EB-5",
    "F-1", "F-2A", "F-2B", "F-3", "F-4",
    "IR-direct",
  ]).describe("Immigrant visa priority category"),
  country_of_birth: z.string().describe("Country of birth (affects per-country backlog)"),
});

type CategoryProfile = {
  full_name: string;
  description: string;
  perm_required: boolean;
  national_interest_waiver: boolean;
  per_country_cap: boolean;
  typical_wait_all_countries: string;
  backlog_countries: Record<string, string>;
  path_summary: string;
  expedite_options: string[];
};

const CATEGORY_PROFILES: Record<string, CategoryProfile> = {
  "EB-1A": {
    full_name: "EB-1A — Alien of Extraordinary Ability",
    description: "Self-petition for individuals with extraordinary ability in sciences, arts, education, business, or athletics. No PERM or employer required.",
    perm_required: false,
    national_interest_waiver: false,
    per_country_cap: true,
    typical_wait_all_countries: "1–3 years (USCIS processing only; no backlog for most countries)",
    backlog_countries: {
      "India": "5–10 years due to per-country cap (check current Visa Bulletin)",
      "China": "3–7 years",
      "Philippines": "1–3 years",
      "Mexico": "1–2 years",
    },
    path_summary: "Requires meeting 3 of 10 USCIS criteria or a major international award (Nobel, Olympic medal). Strong evidentiary record is essential.",
    expedite_options: [
      "Premium processing available for I-140 ($2,805 as of 2025): reduces I-140 to 15 business days",
      "AC21 portability once I-140 approved 180+ days",
      "No priority date wait for most countries except India/China",
    ],
  },
  "EB-1B": {
    full_name: "EB-1B — Outstanding Researcher or Professor",
    description: "For researchers and professors with international recognition. Requires job offer and employer petition.",
    perm_required: false,
    national_interest_waiver: false,
    per_country_cap: true,
    typical_wait_all_countries: "1–3 years",
    backlog_countries: {
      "India": "7–12+ years",
      "China": "5–9 years",
    },
    path_summary: "Requires 3+ years of research experience, a permanent research position, and 2 of 6 criteria (publications, citations, peer review, etc.).",
    expedite_options: [
      "Premium processing for I-140",
      "No PERM requirement saves 12–24 months",
    ],
  },
  "EB-1C": {
    full_name: "EB-1C — Multinational Manager or Executive",
    description: "For executives/managers transferring within multinational companies. No PERM required. Direct path from L-1A.",
    perm_required: false,
    national_interest_waiver: false,
    per_country_cap: true,
    typical_wait_all_countries: "1–3 years",
    backlog_countries: {
      "India": "7–12+ years",
      "China": "4–8 years",
    },
    path_summary: "Must have worked as manager/executive in the related foreign company for 1 year in the last 3. L-1A visa holders on an L-1A for 1+ year are prime candidates.",
    expedite_options: [
      "Premium processing for I-140",
      "No PERM required is a major advantage vs EB-2/EB-3",
    ],
  },
  "EB-2": {
    full_name: "EB-2 — Advanced Degree Professional",
    description: "For professionals with an advanced degree (master's or bachelor's + 5 years experience). Requires PERM and employer sponsorship.",
    perm_required: true,
    national_interest_waiver: false,
    per_country_cap: true,
    typical_wait_all_countries: "2–4 years (PERM + I-140 + adjustment)",
    backlog_countries: {
      "India": "60–80+ years (extreme backlog)",
      "China": "8–15 years",
    },
    path_summary: "PERM labor certification typically takes 12–24 months. Indian nationals should explore EB-2 NIW or EB-1 to avoid the extreme EB-2 India backlog.",
    expedite_options: [
      "Premium processing for I-140 (does not speed up PERM)",
      "AC21 portability — change employers after 180+ days with approved I-140",
      "Concurrent filing of I-485 when priority date is current",
    ],
  },
  "EB-2-NIW": {
    full_name: "EB-2 NIW — National Interest Waiver",
    description: "Self-petition for advanced degree holders who can demonstrate their work is in the US national interest. No PERM or employer sponsor required.",
    perm_required: false,
    national_interest_waiver: true,
    per_country_cap: true,
    typical_wait_all_countries: "2–4 years",
    backlog_countries: {
      "India": "60–80+ years (same backlog as EB-2 general)",
      "China": "8–15 years",
    },
    path_summary: "Must meet the Dhirane standard: substantial merit in a field of endeavor, well-positioned to advance that endeavor, and waiver is in the national interest. Popular for STEM researchers, healthcare workers, engineers.",
    expedite_options: [
      "Premium processing for I-140",
      "No PERM avoids 12–24 month delay",
      "Consider EB-1A upgrade strategy if extraordinary ability can be demonstrated",
    ],
  },
  "EB-3": {
    full_name: "EB-3 — Skilled Worker, Professional, or Other Worker",
    description: "For skilled workers (2+ years training), professionals (bachelor's), and unskilled workers. Requires PERM and employer sponsorship.",
    perm_required: true,
    national_interest_waiver: false,
    per_country_cap: true,
    typical_wait_all_countries: "3–6 years",
    backlog_countries: {
      "India": "10–15+ years",
      "China": "6–10 years",
      "Philippines": "6–10 years",
      "Mexico": "4–7 years",
      "El Salvador / Guatemala / Honduras": "5–10 years",
    },
    path_summary: "Requires a permanent job offer, PERM certification, and I-140 approval. The lowest preference employment category — prioritise EB-2 or EB-1 if qualifications allow.",
    expedite_options: [
      "Premium processing for I-140",
      "EB-3 to EB-2 upgrade — re-file I-140 under EB-2 to capture an earlier priority date if eligible",
    ],
  },
  "EB-5": {
    full_name: "EB-5 — Immigrant Investor",
    description: "For investors who create 10 US jobs via a qualifying investment ($800K TEA / $1.05M standard).",
    perm_required: false,
    national_interest_waiver: false,
    per_country_cap: true,
    typical_wait_all_countries: "3–5 years",
    backlog_countries: {
      "India": "8–15 years",
      "China": "15–20+ years (longest backlog)",
      "Vietnam": "5–10 years",
    },
    path_summary: "File I-526E (Regional Center) or I-526 (direct investment). After approval and priority date current, apply for immigrant visa or I-485. Conditional green card issued; remove conditions at 2-year mark.",
    expedite_options: [
      "Set-aside visas for rural/high unemployment areas have shorter waits",
      "No premium processing available",
    ],
  },
  "F-1": {
    full_name: "F-1 — Unmarried Sons and Daughters of US Citizens (21+)",
    description: "Family preference category for unmarried adult children (age 21+) of US citizens.",
    perm_required: false,
    national_interest_waiver: false,
    per_country_cap: true,
    typical_wait_all_countries: "7–10 years",
    backlog_countries: {
      "Mexico": "25+ years",
      "Philippines": "15–20+ years",
      "India": "10–15 years",
      "China": "8–12 years",
    },
    path_summary: "Petitioner (US citizen parent) files I-130. Long waits due to annual numerical limits. Aging out risk: child must be under 21 at time of visa issuance (CSPA calculation may help).",
    expedite_options: [
      "CSPA (Child Status Protection Act) calculation can preserve a child's age",
      "No administrative ways to expedite priority date movement",
    ],
  },
  "F-2A": {
    full_name: "F-2A — Spouses and Children of LPRs",
    description: "Family preference category for spouses and unmarried children (under 21) of lawful permanent residents.",
    perm_required: false,
    national_interest_waiver: false,
    per_country_cap: true,
    typical_wait_all_countries: "2–5 years",
    backlog_countries: {
      "Mexico": "4–8 years",
      "Philippines": "3–5 years",
    },
    path_summary: "LPR spouse/parent files I-130. When the LPR naturalises to US citizen, the F-2A relative upgrades to Immediate Relative — no further wait. Naturalisation should be a priority.",
    expedite_options: [
      "LPR naturalising to US citizen converts beneficiary to IR status (no cap)",
      "CR-1 interview at consulate can be scheduled promptly once priority date is current",
    ],
  },
  "F-2B": {
    full_name: "F-2B — Unmarried Sons and Daughters (21+) of LPRs",
    description: "Unmarried adult children (21+) of lawful permanent residents.",
    perm_required: false,
    national_interest_waiver: false,
    per_country_cap: true,
    typical_wait_all_countries: "8–12 years",
    backlog_countries: {
      "Mexico": "20+ years",
      "Philippines": "12–18 years",
    },
    path_summary: "LPR parent files I-130. Very long wait times. LPR naturalising to US citizen upgrades the F-2B beneficiary to F-1 category and eventually Immediate Relative if they marry.",
    expedite_options: [
      "LPR naturalisation remains the most impactful step",
    ],
  },
  "F-3": {
    full_name: "F-3 — Married Sons and Daughters of US Citizens",
    description: "Married children of US citizens, regardless of age.",
    perm_required: false,
    national_interest_waiver: false,
    per_country_cap: true,
    typical_wait_all_countries: "10–15 years",
    backlog_countries: {
      "Mexico": "25+ years",
      "Philippines": "20+ years",
    },
    path_summary: "US citizen parent files I-130. Divorce during the wait technically moves the beneficiary to F-1 (unmarried), potentially improving wait time.",
    expedite_options: ["No administrative expedites available"],
  },
  "F-4": {
    full_name: "F-4 — Brothers and Sisters of US Citizens",
    description: "Siblings of US citizens. The longest-wait family preference category.",
    perm_required: false,
    national_interest_waiver: false,
    per_country_cap: true,
    typical_wait_all_countries: "12–20+ years",
    backlog_countries: {
      "India": "15–25+ years",
      "China": "12–18 years",
      "Philippines": "25+ years",
      "Mexico": "20+ years",
    },
    path_summary: "US citizen sibling files I-130. The most backlogged family preference category. Plan decades ahead.",
    expedite_options: ["No administrative expedites available"],
  },
  "IR-direct": {
    full_name: "Immediate Relative of US Citizen",
    description: "Spouses, unmarried children under 21, and parents of US citizens. No annual numerical cap — fastest family path.",
    perm_required: false,
    national_interest_waiver: false,
    per_country_cap: false,
    typical_wait_all_countries: "8–24 months (USCIS + consular processing)",
    backlog_countries: {},
    path_summary: "US citizen files I-130. No priority date wait. Fastest route to a green card for qualifying family members. Consular backlogs at specific embassies may add delays.",
    expedite_options: [
      "Concurrent filing of I-485 if already in the US — can adjudicate faster",
      "Humanitarian parole for urgent cases",
    ],
  },
};

export function greenCardTimeline(input: z.infer<typeof GreenCardTimelineInput>): string {
  const key = normKey(input.priority_category + input.country_of_birth + input.current_visa_type);
  const profile = CATEGORY_PROFILES[input.priority_category];

  const countryLower = input.country_of_birth.toLowerCase();
  const isBacklogCountry = ["india", "china", "philippines", "mexico"].some(c => countryLower.includes(c));

  let estimatedWait = profile.typical_wait_all_countries;
  for (const [country, wait] of Object.entries(profile.backlog_countries)) {
    if (countryLower.includes(country.toLowerCase())) {
      estimatedWait = wait;
      break;
    }
  }

  const acCv21Note = ["H-1B", "H-1", "L-1", "L-2", "O-1", "TN"].some(v =>
    input.current_visa_type.toUpperCase().includes(v)
  )
    ? "Your current visa type may allow AC21 portability — you can change employers after your I-140 is approved for 180+ days without losing your priority date."
    : null;

  const result = {
    current_visa_type: input.current_visa_type,
    priority_category: profile.full_name,
    country_of_birth: input.country_of_birth,
    estimated_wait_time: estimatedWait,
    ...(isBacklogCountry ? { backlog_warning: `⚠️  ${input.country_of_birth} nationals face per-country cap backlogs. Wait times above are estimates based on current Visa Bulletin trends — they can change.` } : {}),
    category_overview: profile.description,
    perm_labor_certification_required: profile.perm_required,
    national_interest_waiver_eligible: profile.national_interest_waiver,
    per_country_cap_applies: profile.per_country_cap,
    path_summary: profile.path_summary,
    expedite_options: profile.expedite_options,
    ...(acCv21Note ? { ac21_portability_note: acCv21Note } : {}),
    priority_date_explained: {
      what_it_is: "Your priority date is the date USCIS or a consulate received your petition. It is your 'place in line'.",
      how_to_track: "Check the monthly USCIS Visa Bulletin at travel.state.gov to see if your priority date is current.",
      final_action_vs_dates_for_filing: "When your priority date is in the 'Dates for Filing' chart, you may file I-485 (if permitted). When it's in the 'Final Action Dates' chart, USCIS can approve it.",
    },
    key_resources: [
      "USCIS Visa Bulletin: travel.state.gov/visa-bulletin",
      "USCIS processing times: uscis.gov/processing-times",
      "USCIS case status: egov.uscis.gov",
    ],
    disclaimer:
      "Wait time estimates are based on current Visa Bulletin trends and may change significantly. This is not legal advice. Consult a licensed immigration attorney.",
    generated_at: new Date().toISOString(),
  };

  return JSON.stringify(result, null, 2) + PROMO_FOOTER;
}
