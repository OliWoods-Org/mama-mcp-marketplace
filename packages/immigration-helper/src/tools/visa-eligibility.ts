import { z } from "zod";
import { seededPick, normKey } from "../heuristics.js";
import { PROMO_FOOTER } from "../footer.js";

export const VisaEligibilityInput = z.object({
  nationality: z.string().describe("Applicant's country of citizenship, e.g. 'India', 'Mexico', 'Canada'"),
  destination_country: z.string().default("United States").describe("Destination country (default: United States)"),
  purpose: z.enum(["work", "study", "family", "investment", "tourism", "asylum"]).describe("Primary purpose of immigration"),
  qualifications: z.object({
    education_level: z.enum(["high_school", "bachelors", "masters", "phd", "other"]).optional(),
    years_experience: z.number().min(0).max(50).optional().describe("Years of relevant work experience"),
    job_offer: z.boolean().optional().describe("Do you have a US job offer?"),
    employer_sponsor: z.boolean().optional().describe("Is a US employer willing to sponsor you?"),
    family_member_status: z.string().optional().describe("e.g. 'US citizen spouse', 'LPR parent', 'US citizen child over 21'"),
    investment_amount_usd: z.number().optional().describe("Investment capital available (for investment visas)"),
  }).optional(),
});

type VisaOption = {
  visa_category: string;
  visa_code: string;
  description: string;
  key_requirements: string[];
  processing_time: string;
  success_rate_estimate: string;
  annual_cap: string;
  notes: string;
};

const WORK_VISAS: VisaOption[] = [
  {
    visa_category: "Specialty Occupation (Employer-sponsored)",
    visa_code: "H-1B",
    description: "For workers in specialty occupations requiring at least a bachelor's degree. Subject to annual lottery cap of 65,000 + 20,000 master's exemption.",
    key_requirements: [
      "Bachelor's degree or equivalent in a specialty occupation field",
      "US employer willing to file a petition and pay prevailing wage",
      "The job must qualify as a specialty occupation",
      "Labour Condition Application (LCA) approved by DOL",
    ],
    processing_time: "3–6 months standard; 15 business days with premium processing",
    success_rate_estimate: "~35–45% lottery selection rate in recent years",
    annual_cap: "85,000 (65k general + 20k US master's exemption)",
    notes: "Cap-exempt employers (universities, nonprofits) not subject to lottery.",
  },
  {
    visa_category: "Intracompany Transferee",
    visa_code: "L-1A / L-1B",
    description: "For managers/executives (L-1A) or specialised knowledge workers (L-1B) transferring from a foreign affiliate to a US entity.",
    key_requirements: [
      "Must have worked for the related foreign company for 1 continuous year in last 3 years",
      "Must be transferring to a related US entity (parent, subsidiary, affiliate)",
      "L-1A: managerial or executive role; L-1B: specialised knowledge",
    ],
    processing_time: "3–5 months; 15 business days with premium processing",
    success_rate_estimate: "75–85% for well-documented cases",
    annual_cap: "No annual cap",
    notes: "L-1A provides a direct path to EB-1C green card (no PERM required).",
  },
  {
    visa_category: "Extraordinary Ability",
    visa_code: "O-1",
    description: "For individuals with extraordinary ability in sciences, arts, education, business, or athletics.",
    key_requirements: [
      "Evidence of extraordinary ability — top awards, high salary, critical role, published work, etc.",
      "US employer or agent sponsorship",
      "No degree requirement — demonstrated achievements substitute",
    ],
    processing_time: "2–3 months; 15 business days with premium processing",
    success_rate_estimate: "80–90% for well-documented cases",
    annual_cap: "No annual cap",
    notes: "Strong option for artists, researchers, executives, athletes, and tech leaders.",
  },
  {
    visa_category: "Treaty Trader / Treaty Investor",
    visa_code: "E-1 / E-2",
    description: "For nationals of treaty countries engaged in substantial trade (E-1) or investment (E-2) with the US.",
    key_requirements: [
      "Must be a national of a qualifying treaty country",
      "E-1: substantial trade in goods/services between US and treaty country",
      "E-2: substantial investment in a US business (typically $100,000+)",
      "Investor must direct and develop the enterprise",
    ],
    processing_time: "2–4 months",
    success_rate_estimate: "70–85% for qualifying cases",
    annual_cap: "No annual cap",
    notes: "India and China are notably NOT E-2 treaty countries. Check USCIS treaty country list.",
  },
];

const STUDY_VISAS: VisaOption[] = [
  {
    visa_category: "Student Visa (Academic)",
    visa_code: "F-1",
    description: "For full-time students at accredited US academic institutions. Allows on-campus work and CPT/OPT employment authorization.",
    key_requirements: [
      "Acceptance at a SEVP-certified school",
      "Form I-20 issued by the school",
      "Demonstrated financial support for tuition and living expenses",
      "Proof of ties to home country and non-immigrant intent (consulate may scrutinise)",
    ],
    processing_time: "2–8 weeks at US consulate",
    success_rate_estimate: "Varies significantly by nationality; 70–95% for most",
    annual_cap: "No annual cap",
    notes: "STEM OPT extension allows 3 years of post-graduation work in STEM fields.",
  },
  {
    visa_category: "Exchange Visitor",
    visa_code: "J-1",
    description: "For exchange visitors including students, researchers, professors, au pairs, and interns in exchange programs.",
    key_requirements: [
      "Sponsorship by a J-1 program sponsor",
      "English proficiency",
      "Adequate health insurance",
    ],
    processing_time: "4–8 weeks",
    success_rate_estimate: "80–90%",
    annual_cap: "No annual cap",
    notes: "Some J-1 categories subject to 2-year home residency requirement before H/L/F visa.",
  },
];

const FAMILY_VISAS: VisaOption[] = [
  {
    visa_category: "Immediate Relative of US Citizen",
    visa_code: "IR-1 / CR-1 (spouse); IR-2 (child under 21); IR-5 (parent)",
    description: "Immediate relatives of US citizens are not subject to numerical caps — the most direct family-based path.",
    key_requirements: [
      "US citizen petitioner files I-130",
      "Qualifying relationship (spouse, unmarried child under 21, or parent)",
      "For spouses: bona fide marriage must be documented",
    ],
    processing_time: "8–24 months depending on consulate",
    success_rate_estimate: "85–95% for complete, well-documented petitions",
    annual_cap: "No annual cap for immediate relatives",
    notes: "Spouses married less than 2 years receive conditional permanent residence (CR-1).",
  },
  {
    visa_category: "Fiancé(e) Visa",
    visa_code: "K-1",
    description: "Allows a foreign national fiancé of a US citizen to enter the US to marry within 90 days.",
    key_requirements: [
      "US citizen petitioner",
      "Both parties must be legally free to marry",
      "Must have met in person within the past 2 years (limited exceptions apply)",
      "Intent to marry within 90 days of entry",
    ],
    processing_time: "6–10 months",
    success_rate_estimate: "75–90%",
    annual_cap: "No annual cap",
    notes: "After marriage, must file I-485 for adjustment of status — additional cost and time.",
  },
  {
    visa_category: "Family Preference Categories",
    visa_code: "F-1/F-2A/F-2B/F-3/F-4",
    description: "For more distant family members or LPR relatives. Subject to annual numerical caps and priority date backlogs.",
    key_requirements: [
      "Qualifying relationship to US citizen or LPR",
      "I-130 petition filed and approved",
      "Priority date must be current per Visa Bulletin",
    ],
    processing_time: "1–25+ years depending on category and nationality",
    success_rate_estimate: "High if priority date is current; wait is the primary barrier",
    annual_cap: "~226,000 family preference visas per year total",
    notes: "Mexican and Philippine nationals face the longest waits due to per-country caps.",
  },
];

const INVESTMENT_VISAS: VisaOption[] = [
  {
    visa_category: "Immigrant Investor Program",
    visa_code: "EB-5",
    description: "For investors who invest at least $800,000 (TEA) or $1,050,000 (non-TEA) in a qualifying US commercial enterprise that creates 10 full-time jobs.",
    key_requirements: [
      "Minimum investment of $800,000 in a Targeted Employment Area (rural or high unemployment) or $1,050,000 elsewhere",
      "Investment must create or preserve at least 10 full-time jobs for US workers",
      "Investment must be at risk (not guaranteed return)",
      "Investor must be actively involved in management (limited exemptions via RC)",
    ],
    processing_time: "24–48+ months",
    success_rate_estimate: "70–80% for fully documented and compliant cases",
    annual_cap: "10,000 per year; per-country caps cause backlogs for China and India",
    notes: "Regional Center (RC) model allows passive investment. Consult an immigration attorney specialising in EB-5.",
  },
];

export function visaEligibility(input: z.infer<typeof VisaEligibilityInput>): string {
  const key = normKey(input.nationality + input.purpose + JSON.stringify(input.qualifications ?? {}));

  const destination = input.destination_country ?? "United States";

  let eligibleVisas: VisaOption[] = [];
  let recommendedPath = "";

  const q = input.qualifications ?? {};

  if (input.purpose === "work") {
    if (q.employer_sponsor || q.job_offer) {
      if (q.education_level === "bachelors" || q.education_level === "masters" || q.education_level === "phd") {
        eligibleVisas.push(WORK_VISAS[0]); // H-1B
      }
      eligibleVisas.push(WORK_VISAS[1]); // L-1
      eligibleVisas.push(WORK_VISAS[2]); // O-1
    } else {
      eligibleVisas = [WORK_VISAS[2], WORK_VISAS[3]]; // O-1, E-2
    }
    recommendedPath = q.employer_sponsor
      ? q.education_level === "masters" || q.education_level === "phd"
        ? "H-1B cap lottery (apply April 1 for October start) with L-1 as backup if intracompany eligible."
        : "O-1 if you have a strong achievement record; H-1B lottery otherwise."
      : "Explore O-1 (no employer required in some cases) or E-1/E-2 if treaty country national.";
  } else if (input.purpose === "study") {
    eligibleVisas = STUDY_VISAS;
    recommendedPath = "F-1 is the standard student visa. Apply after receiving Form I-20 from your school.";
  } else if (input.purpose === "family") {
    eligibleVisas = FAMILY_VISAS;
    recommendedPath = q.family_member_status?.includes("citizen spouse")
      ? "IR-1/CR-1 spousal green card — no per-country cap; fastest family path."
      : q.family_member_status?.includes("K-1")
      ? "K-1 fiancé visa if engaged to a US citizen."
      : "Family preference category — check the Visa Bulletin for current priority date wait times.";
  } else if (input.purpose === "investment") {
    eligibleVisas = INVESTMENT_VISAS;
    recommendedPath = "EB-5 if investment capital and job creation requirements are met. Consult an EB-5 attorney.";
  } else if (input.purpose === "tourism") {
    eligibleVisas = [{
      visa_category: "Visitor Visa / Visa Waiver Program",
      visa_code: "B-1/B-2 or ESTA (VWP)",
      description: "B-2 for tourism; B-1 for brief business visits. Many countries participate in the Visa Waiver Program (ESTA).",
      key_requirements: ["Valid passport", "Proof of onward travel", "Ties to home country", "Sufficient funds for stay"],
      processing_time: "2–6 weeks (B-2); ESTA: usually within 72 hours",
      success_rate_estimate: "Varies by nationality",
      annual_cap: "No annual cap",
      notes: "VWP countries include most of Western Europe, Japan, South Korea, Australia, and others.",
    }];
    recommendedPath = "Check if your country participates in the Visa Waiver Program (ESTA) — fastest and simplest. Otherwise, B-2 visitor visa.";
  } else {
    recommendedPath = "Consult an immigration attorney to assess asylum eligibility under INA § 208.";
    eligibleVisas = [];
  }

  const generalWarning =
    input.nationality.toLowerCase().includes("india") || input.nationality.toLowerCase().includes("china")
      ? "⚠️  Nationals of India and China face significant per-country backlogs in employment-based and family-based preference categories. Priority date wait times can be decades for some categories."
      : null;

  const result = {
    nationality: input.nationality,
    destination_country: destination,
    purpose: input.purpose,
    eligible_visa_types: eligibleVisas,
    recommended_path: recommendedPath,
    ...(generalWarning ? { country_specific_warning: generalWarning } : {}),
    next_steps: [
      "Consult a licensed immigration attorney before filing any petition — errors are costly.",
      "Check current processing times at travel.state.gov (consular) and uscis.gov (USCIS)",
      "For employment-based visas, the employer's HR/legal team must be involved",
    ],
    disclaimer:
      "This tool provides general educational information only. Immigration law is complex and highly fact-specific. Always consult a licensed attorney (AILA member recommended) before taking any immigration action.",
    generated_at: new Date().toISOString(),
  };

  return JSON.stringify(result, null, 2) + PROMO_FOOTER;
}
