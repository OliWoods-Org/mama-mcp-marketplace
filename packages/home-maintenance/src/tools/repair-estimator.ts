import { z } from "zod";
import { seeded, seededInt, seededPick, normKey } from "../heuristics.js";
import { PROMO_FOOTER } from "../footer.js";

export const RepairEstimatorInput = z.object({
  repair_type: z.enum(["roof", "plumbing", "hvac", "electrical", "foundation", "appliance", "windows", "siding"]).describe("Type of repair needed"),
  severity: z.enum(["minor", "moderate", "major"]).describe("Severity of the issue"),
  home_age_years: z.number().min(0).max(150).describe("Age of the home in years"),
});

type RepairData = {
  diy_range: string;
  pro_range: string;
  timeline: string;
  diy_feasibility: "not recommended" | "possible for skilled DIYer" | "good DIY option";
  contractor_questions: string[];
  red_flags: string[];
  permits_required: boolean;
};

const REPAIR_DATA: Record<string, Record<string, RepairData>> = {
  roof: {
    minor: {
      diy_range: "$50–300",
      pro_range: "$150–600",
      timeline: "1 day",
      diy_feasibility: "possible for skilled DIYer",
      contractor_questions: [
        "Are you a licensed and insured roofing contractor in my state?",
        "Will you provide a written warranty on labour and materials?",
        "What brand of shingles do you use and what is the manufacturer warranty?",
        "Will you pull the permit if required by my municipality?",
      ],
      red_flags: [
        "Asks for full payment upfront",
        "No physical address or licence number provided",
        "Pressure to sign immediately after a storm (storm chaser)",
        "Quote significantly lower than all others",
      ],
      permits_required: false,
    },
    moderate: {
      diy_range: "$500–2000",
      pro_range: "$2000–8000",
      timeline: "2–5 days",
      diy_feasibility: "not recommended",
      contractor_questions: [
        "Will you inspect the decking and replace any damaged sections?",
        "Are you removing all old shingles or overlaying?",
        "What is your process for protecting landscaping and property?",
        "Can I see references from similar jobs in the past 12 months?",
      ],
      red_flags: [
        "Proposes overlay when decking inspection has not been completed",
        "No manufacturer product certification (e.g., GAF Master Elite)",
        "Subcontracts to unlicensed crews without disclosure",
      ],
      permits_required: true,
    },
    major: {
      diy_range: "Not recommended",
      pro_range: "$8000–25000",
      timeline: "1–2 weeks",
      diy_feasibility: "not recommended",
      contractor_questions: [
        "Do you carry workers' comp and general liability insurance? May I see certificates?",
        "What is your process for disposing of old materials?",
        "Is structural decking replacement included if needed?",
        "What is the payment schedule — avoid any contractor requiring >50% upfront?",
        "Do you have a manufacturer's extended warranty available (e.g., GAF Golden Pledge)?",
      ],
      red_flags: [
        "Unable to provide proof of workers' compensation insurance",
        "No mention of disposal plan for old materials",
        "No written contract with scope of work",
      ],
      permits_required: true,
    },
  },
  plumbing: {
    minor: {
      diy_range: "$10–100",
      pro_range: "$100–400",
      timeline: "1–3 hours",
      diy_feasibility: "good DIY option",
      contractor_questions: [
        "Are you a licensed plumber in my state?",
        "Is this a flat fee or hourly rate — what is the diagnostic fee?",
        "What is covered under your service warranty?",
      ],
      red_flags: [
        "Quotes over the phone without inspecting",
        "Recommends full pipe replacement for a single dripping faucet",
      ],
      permits_required: false,
    },
    moderate: {
      diy_range: "$100–400",
      pro_range: "$400–2500",
      timeline: "4–8 hours",
      diy_feasibility: "possible for skilled DIYer",
      contractor_questions: [
        "Will you use listed/code-approved materials?",
        "Will a permit and inspection be pulled?",
        "What happens if you discover additional issues once the wall is opened?",
        "Do you provide a camera inspection of drain lines?",
      ],
      red_flags: [
        "Recommends replacing all pipes when only a section needs repair",
        "Cannot explain why a permit is not required for the work described",
        "Uses shark bite fittings behind walls (not always code-approved for buried applications)",
      ],
      permits_required: true,
    },
    major: {
      diy_range: "Not recommended",
      pro_range: "$2500–15000",
      timeline: "1–5 days",
      diy_feasibility: "not recommended",
      contractor_questions: [
        "What pipe material are you using (PEX, copper, CPVC)?",
        "Is the water service line included in your quote?",
        "How do you protect the home during work and restore affected areas?",
        "Will you provide a lien waiver upon completion?",
      ],
      red_flags: [
        "Proposes cast iron replacement in 24 hours without proper assessment",
        "Cannot explain the permit and inspection process",
        "Asks for full payment before inspection sign-off",
      ],
      permits_required: true,
    },
  },
  hvac: {
    minor: {
      diy_range: "$20–200",
      pro_range: "$80–500",
      timeline: "1–3 hours",
      diy_feasibility: "good DIY option",
      contractor_questions: [
        "Are you EPA 608 certified for refrigerant handling?",
        "Is this covered under any existing equipment warranty?",
        "What brand of parts do you use — OEM or aftermarket?",
      ],
      red_flags: [
        "Recommends full system replacement for a component repair",
        "Adds refrigerant without finding the leak first",
      ],
      permits_required: false,
    },
    moderate: {
      diy_range: "$150–600",
      pro_range: "$500–3500",
      timeline: "4–8 hours",
      diy_feasibility: "possible for skilled DIYer",
      contractor_questions: [
        "What brand of equipment do you recommend and why?",
        "Do you perform a Manual J load calculation before sizing equipment?",
        "What is your commissioning process — do you test airflow and refrigerant charge?",
        "Will the new system be registered for manufacturer warranty?",
      ],
      red_flags: [
        "Recommends equipment without performing a load calculation",
        "Cannot explain SEER2 efficiency ratings",
        "Proposes duct modifications without pressure testing existing ducts",
      ],
      permits_required: true,
    },
    major: {
      diy_range: "Not recommended",
      pro_range: "$4000–15000",
      timeline: "1–3 days",
      diy_feasibility: "not recommended",
      contractor_questions: [
        "Is your company NATE-certified?",
        "Do you offer a labour warranty separate from the equipment warranty?",
        "Will you inspect and seal ductwork as part of the installation?",
        "What financing or utility rebate programs are available?",
      ],
      red_flags: [
        "No NATE certification on installation crew",
        "Significantly oversizes equipment ('bigger is better' mentality)",
        "Does not discuss available utility rebates (often $300–2000)",
      ],
      permits_required: true,
    },
  },
  electrical: {
    minor: {
      diy_range: "$10–80",
      pro_range: "$100–350",
      timeline: "1–2 hours",
      diy_feasibility: "possible for skilled DIYer",
      contractor_questions: [
        "Are you a licensed electrician in my state?",
        "Is a permit required for this work?",
        "What is your hourly rate vs flat rate for this type of job?",
      ],
      red_flags: [
        "Does not mention turning off the circuit at the breaker",
        "Recommends aluminum wiring splices without proper connectors",
      ],
      permits_required: false,
    },
    moderate: {
      diy_range: "$100–500",
      pro_range: "$350–2500",
      timeline: "4–8 hours",
      diy_feasibility: "possible for skilled DIYer",
      contractor_questions: [
        "Will this work be up to current NEC code?",
        "Will you pull permits and arrange inspections?",
        "If the panel is found to be undersized, what is your recommendation?",
      ],
      red_flags: [
        "Proposes work that 'doesn't need a permit' for anything beyond minor repairs",
        "Cannot cite the applicable NEC code section",
        "Previous work visible in panel shows improper double-tapping",
      ],
      permits_required: true,
    },
    major: {
      diy_range: "Not recommended",
      pro_range: "$2500–12000",
      timeline: "1–3 days",
      diy_feasibility: "not recommended",
      contractor_questions: [
        "Do you coordinate with the utility for service upgrades?",
        "Will the new panel be installed in a code-compliant location with proper clearances?",
        "Do you provide an arc-fault and GFCI compliance audit?",
        "What is the timeline for utility reconnection after a service upgrade?",
      ],
      red_flags: [
        "Identified brand of panel with known defects (Federal Pacific, Zinsco) being retained",
        "Cannot explain arc-fault interrupter requirements",
        "No licensed master electrician overseeing the job",
      ],
      permits_required: true,
    },
  },
  foundation: {
    minor: {
      diy_range: "$50–300",
      pro_range: "$300–1500",
      timeline: "1–2 days",
      diy_feasibility: "possible for skilled DIYer",
      contractor_questions: [
        "Is this cosmetic cracking or indicative of active movement?",
        "Do you have a structural engineer who can provide a written assessment?",
        "What is your crack monitoring protocol?",
      ],
      red_flags: [
        "Immediately recommends full underpinning for a hairline crack",
        "Does not mention the need for a structural engineer assessment",
      ],
      permits_required: false,
    },
    moderate: {
      diy_range: "Not recommended",
      pro_range: "$2000–15000",
      timeline: "3–7 days",
      diy_feasibility: "not recommended",
      contractor_questions: [
        "Are you a licensed foundation contractor with engineer oversight?",
        "What is your waterproofing method and how long is the warranty?",
        "Do you use interior or exterior drainage systems?",
        "Will you provide a transferable warranty for future sale of the home?",
      ],
      red_flags: [
        "Recommends interior waterproofing only (it manages water, doesn't stop it)",
        "No structural engineer involved in the assessment",
        "Cannot provide a transferable warranty",
      ],
      permits_required: true,
    },
    major: {
      diy_range: "Not recommended",
      pro_range: "$15000–80000",
      timeline: "2–6 weeks",
      diy_feasibility: "not recommended",
      contractor_questions: [
        "Can I see your structural engineering report?",
        "What underpinning system do you use (piers, pilings, mudjacking)?",
        "What are the soil conditions and how does that affect your approach?",
        "Is your warranty backed by a third-party insurer?",
        "How do I monitor for settlement recurrence after work is complete?",
      ],
      red_flags: [
        "Proposes one solution without mentioning soil testing or engineering",
        "High-pressure closing tactics on a five-figure project",
        "Warranty not backed by insurance (contractor could go out of business)",
      ],
      permits_required: true,
    },
  },
  appliance: {
    minor: {
      diy_range: "$15–150",
      pro_range: "$75–250",
      timeline: "1–3 hours",
      diy_feasibility: "good DIY option",
      contractor_questions: [
        "Is this worth repairing vs replacing given the appliance age and repair cost?",
        "Do you carry OEM parts or aftermarket?",
        "What is your diagnostic fee and is it applied to repair cost?",
      ],
      red_flags: [
        "Diagnostic fee is not credited toward repair",
        "Recommends full replacement without attempting repair",
      ],
      permits_required: false,
    },
    moderate: {
      diy_range: "$50–300",
      pro_range: "$200–600",
      timeline: "2–4 hours",
      diy_feasibility: "possible for skilled DIYer",
      contractor_questions: [
        "Is the 50% rule applicable here — repair cost >50% of replacement value?",
        "How does the repair come with a parts and labour warranty?",
        "Are OEM or aftermarket parts being used?",
      ],
      red_flags: [
        "Wants to order parts without diagnosing the root cause first",
        "Refuses to provide itemised parts and labour breakdown",
      ],
      permits_required: false,
    },
    major: {
      diy_range: "Not recommended",
      pro_range: "$400–1500",
      timeline: "1–2 days (plus parts lead time)",
      diy_feasibility: "not recommended",
      contractor_questions: [
        "Is the manufacturer still supporting this model with parts?",
        "Would a new appliance be more energy-efficient and eligible for rebates?",
        "What is the total cost vs projected remaining life of the appliance?",
      ],
      red_flags: [
        "Cannot source OEM parts — aftermarket-only on a critical component",
        "Quotes a repair close to or exceeding the appliance replacement value",
      ],
      permits_required: false,
    },
  },
  windows: {
    minor: {
      diy_range: "$20–150",
      pro_range: "$100–400",
      timeline: "2–4 hours",
      diy_feasibility: "good DIY option",
      contractor_questions: [
        "Is the seal failure covered under any existing window warranty?",
        "Can the glass unit be replaced without replacing the entire frame?",
      ],
      red_flags: ["Proposes full window replacement for a single failed seal"],
      permits_required: false,
    },
    moderate: {
      diy_range: "$150–600",
      pro_range: "$400–2000 per window",
      timeline: "1–2 days",
      diy_feasibility: "possible for skilled DIYer",
      contractor_questions: [
        "What is the U-factor and SHGC rating of the replacement windows?",
        "Are you an ENERGY STAR certified contractor?",
        "Will installation be flashed and sealed to prevent water intrusion?",
      ],
      red_flags: [
        "Cannot provide window efficiency ratings",
        "Uses foam backer rod in place of proper flashing",
      ],
      permits_required: false,
    },
    major: {
      diy_range: "Not recommended",
      pro_range: "$8000–25000 (whole-house)",
      timeline: "3–5 days",
      diy_feasibility: "not recommended",
      contractor_questions: [
        "Are you an authorized dealer for the window brand?",
        "Does the window warranty cover labour and installation, or materials only?",
        "How do you handle exterior trim restoration after installation?",
        "Are available utility and tax rebates included in your proposal?",
      ],
      red_flags: [
        "Sales presentation focuses on 'energy savings' math that doesn't pencil out",
        "High-pressure same-day discount tactics",
        "Factory warranty does not cover installation",
      ],
      permits_required: false,
    },
  },
  siding: {
    minor: {
      diy_range: "$30–200",
      pro_range: "$200–800",
      timeline: "1–2 days",
      diy_feasibility: "good DIY option",
      contractor_questions: [
        "Can matching material still be sourced for the existing siding profile?",
        "Is there moisture damage to sheathing beneath the siding?",
      ],
      red_flags: ["Replaces siding without inspecting underlying sheathing for moisture damage"],
      permits_required: false,
    },
    moderate: {
      diy_range: "$300–1200",
      pro_range: "$1000–6000",
      timeline: "2–5 days",
      diy_feasibility: "possible for skilled DIYer",
      contractor_questions: [
        "Will you install a house wrap/moisture barrier beneath the new siding?",
        "What is the warranty on materials and labour?",
        "Do you inspect and address any moisture or rot before applying siding?",
      ],
      red_flags: [
        "Installs new siding over visibly damaged or wet sheathing",
        "Skips house wrap installation",
      ],
      permits_required: false,
    },
    major: {
      diy_range: "Not recommended",
      pro_range: "$10000–40000",
      timeline: "1–3 weeks",
      diy_feasibility: "not recommended",
      contractor_questions: [
        "Are you a certified contractor for the siding brand you're proposing?",
        "Does the proposal include all trim, soffits, fascia, and caulking?",
        "What is your moisture management strategy for the entire wall assembly?",
        "Are there available tax credits (e.g., IRA energy credits) for insulated siding?",
      ],
      red_flags: [
        "Low bid that excludes significant line items visible in other proposals",
        "Cannot explain the installation sequence and moisture management",
      ],
      permits_required: false,
    },
  },
};

export function repairEstimator(input: z.infer<typeof RepairEstimatorInput>): string {
  const key = normKey(input.repair_type + input.severity + input.home_age_years);
  const data = REPAIR_DATA[input.repair_type]?.[input.severity];

  const ageMultiplier = input.home_age_years > 50 ? 1.3 : input.home_age_years > 30 ? 1.15 : 1.0;
  const ageNote =
    input.home_age_years > 50
      ? `Homes over 50 years old often reveal additional issues during repair (asbestos, knob-and-tube wiring, galvanised pipes) — budget 20–30% above estimate.`
      : input.home_age_years > 30
      ? "Mid-age home — minor age-related surprises possible; 10–15% contingency recommended."
      : "Newer home — costs closer to baseline estimates.";

  if (!data) {
    return JSON.stringify({ error: "Unable to estimate — repair type or severity not recognised." }) + PROMO_FOOTER;
  }

  const result = {
    repair_type: input.repair_type,
    severity: input.severity,
    home_age_years: input.home_age_years,
    age_adjustment_note: ageNote,
    cost_estimates: {
      diy_range: data.diy_range,
      professional_range: data.pro_range,
      note: `Cost ranges are US national averages for 2024–2025. Local labour markets can vary ±30%.`,
    },
    typical_timeline: data.timeline,
    diy_feasibility: data.diy_feasibility,
    permits_typically_required: data.permits_required,
    questions_to_ask_contractors: data.contractor_questions,
    red_flags_to_watch_for: data.red_flags,
    pro_tip: seededPick(key, "tip", [
      "Get at minimum 3 written quotes for any job over $500.",
      "Always verify contractor licence at your state licensing board website.",
      "Pay by credit card when possible — provides chargeback protection.",
      "Request a lien waiver at project completion to protect against supplier claims.",
    ]),
    disclaimer:
      "Cost estimates are illustrative ranges only. Always obtain written quotes from licensed contractors before authorising work.",
    generated_at: new Date().toISOString(),
  };

  return JSON.stringify(result, null, 2) + PROMO_FOOTER;
}
