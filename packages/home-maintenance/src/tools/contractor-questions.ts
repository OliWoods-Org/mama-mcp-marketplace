import { z } from "zod";
import { seededPick, normKey } from "../heuristics.js";
import { PROMO_FOOTER } from "../footer.js";

export const ContractorQuestionsInput = z.object({
  project_type: z.string().min(2).describe("Type of project, e.g. 'kitchen remodel', 'roof replacement', 'HVAC installation'"),
});

const UNIVERSAL_QUESTIONS = [
  "Are you licensed and insured in my state? Can I see your certificate of insurance (COI) and licence number?",
  "Do you carry workers' compensation insurance for all employees and subcontractors on the job?",
  "Will you pull the required permits, and will inspections be included in your quote?",
  "What is the payment schedule — and you should never pay more than 10–30% upfront?",
  "Will you provide a written, itemised contract before work begins?",
  "Who are your main subcontractors and are they licensed?",
  "What is your project timeline and what causes it to change?",
  "How do you handle unexpected conditions (e.g. hidden rot, asbestos, inadequate framing)?",
  "Do you provide a warranty on labour, and for how long?",
  "Can you provide 3 references from similar projects completed in the past 12 months?",
];

const PROJECT_SPECIFIC_QUESTIONS: Record<string, string[]> = {
  default: [
    "What is your experience with projects similar in scope and size to mine?",
    "How many active projects will you be managing while working on mine?",
    "What is your communication process — daily updates, weekly check-ins, dedicated PM?",
  ],
  kitchen: [
    "Are you a certified kitchen and bath designer or NKBA member?",
    "How do you protect adjacent rooms from dust and debris?",
    "Who sources cabinets and appliances — you or the homeowner?",
    "What is your process for managing the plumbing and electrical rough-in sequence?",
    "Will you handle cabinet and countertop templating, or do I coordinate separately?",
  ],
  bathroom: [
    "Do you use a licensed plumber for rough-in and finish plumbing?",
    "What waterproofing system do you use in shower surrounds (RedGard, Wedi, Schluter)?",
    "How do you handle moisture management behind tile?",
    "Is tile installation done by a dedicated tile setter or a general carpenter?",
  ],
  roof: [
    "Are you a certified installer for the shingle brand you're proposing?",
    "Do you remove existing shingles or overlay?",
    "Will you inspect and replace damaged decking as needed?",
    "What is your warranty on workmanship and what is the manufacturer warranty?",
    "How do you protect my landscaping and driveway from debris?",
  ],
  hvac: [
    "Are your technicians NATE-certified?",
    "Do you perform a Manual J load calculation to properly size equipment?",
    "Will you test and balance airflow after installation?",
    "What efficiency rating (SEER2/HSPF2) is the equipment you're proposing?",
    "What manufacturer warranty is included and do you register it for us?",
  ],
  electrical: [
    "Are you a licensed master electrician or employing one on this project?",
    "Will all work meet current NEC requirements?",
    "Will permits and inspections be pulled and scheduled by your company?",
    "How will you protect finished areas from damage during rough-in?",
  ],
  plumbing: [
    "Are you a licensed master plumber?",
    "What pipe materials will you use and are they approved for my local code?",
    "Will permits and inspections be pulled for this work?",
    "Do you offer a camera inspection of existing drain lines before starting?",
  ],
  foundation: [
    "Will a licensed structural engineer be involved in the assessment and repair plan?",
    "Do you offer a transferable warranty — important for future home sale?",
    "What monitoring protocol do you recommend post-repair?",
    "Is your warranty backed by a third-party insurer?",
  ],
  landscaping: [
    "Are you licensed and insured for tree removal if applicable?",
    "Do you have a landscape architect or designer on staff?",
    "What irrigation systems do you install and do you provide ongoing service?",
    "How do you handle grading and drainage to prevent erosion?",
  ],
  painting: [
    "Do you use sprayer or brush/roller application — and what is the impact on prep time?",
    "What brand and sheen of paint do you use, and is it included in the quote?",
    "How many coats are included in the price?",
    "How do you protect floors, furniture, and trim during painting?",
  ],
  windows: [
    "Are you an authorised dealer for the window brand you're proposing?",
    "Does the installation warranty cover labour or just materials?",
    "What is the U-factor and SHGC rating for the windows you're recommending?",
    "Will you handle exterior trim restoration after installation?",
  ],
  flooring: [
    "What is your acclimation protocol for hardwood before installation?",
    "Is subfloor inspection and levelling included in the quote?",
    "Who supplies the material — you or homeowner — and how does that affect warranty?",
    "What is your dust containment process?",
  ],
  deck: [
    "What type of framing lumber are you using — pressure-treated, composite framing?",
    "Do you use hidden fasteners or face screws for decking?",
    "Will footings be inspected by the building department?",
    "What is the maintenance requirement for the decking material you're proposing?",
  ],
};

const LICENSE_REQUIREMENTS: Record<string, string> = {
  general: "General contractors require a state licence in most states. Verify at your state's contractor licensing board website.",
  electrical: "Must be performed by a licensed electrician; in most states, a master electrician must pull permits.",
  plumbing: "Must be performed by a licensed plumber; master plumber licence required for permit work in most jurisdictions.",
  hvac: "Requires state HVAC/mechanical licence; EPA 608 certification required for refrigerant handling.",
  roofing: "Roofing contractor licence required in most states; verify at state licensing board.",
  foundation: "General contractor with structural engineering oversight; specialist certification (SCSME or similar) for waterproofing.",
};

const RED_FLAGS = [
  "Requests full payment upfront before any work is done",
  "Does not have a physical business address or website",
  "Refuses to provide proof of insurance or licence number",
  "Pressures you to sign immediately ('today only' discount)",
  "Significantly lower bid than all other quotes without explanation",
  "Appears at your door unsolicited after a storm (storm chaser)",
  "Communicates only by phone — no written quote or contract",
  "Asks you to pull the permits yourself (in most cases, the contractor should)",
  "Uses materials not named in the contract ('whatever is available')",
  "No physical presence on site — subcontracts everything without disclosure",
];

export function contractorQuestions(input: z.infer<typeof ContractorQuestionsInput>): string {
  const key = normKey(input.project_type);

  const projectLower = input.project_type.toLowerCase();
  let specificKey = "default";
  for (const k of Object.keys(PROJECT_SPECIFIC_QUESTIONS)) {
    if (projectLower.includes(k)) { specificKey = k; break; }
  }

  const specificQuestions = PROJECT_SPECIFIC_QUESTIONS[specificKey];
  const allQuestions = [
    ...specificQuestions,
    ...UNIVERSAL_QUESTIONS.slice(0, 10 - specificQuestions.length),
  ].slice(0, 10);

  const licenceKey = Object.keys(LICENSE_REQUIREMENTS).find(k => projectLower.includes(k)) ?? "general";

  const verificationLinks = [
    "Most states: search '[your state] contractor license lookup' to verify in real time",
    "Insurance: ask for a Certificate of Insurance (COI) naming you as certificate holder",
    "BBB: bbb.org — check complaint history",
    "Yelp / Houzz / Angi — read reviews with a critical eye; look for response patterns",
  ];

  const result = {
    project_type: input.project_type,
    top_10_questions_to_ask: allQuestions.map((q, i) => ({ number: i + 1, question: q })),
    licence_and_insurance_requirements: LICENSE_REQUIREMENTS[licenceKey],
    how_to_verify_credentials: verificationLinks,
    red_flags_in_quotes: RED_FLAGS,
    contract_essentials: [
      "Detailed scope of work — materials, brands, quantities, finishes",
      "Payment schedule tied to project milestones (NOT just calendar dates)",
      "Start and estimated completion dates with change-order process defined",
      "Permit responsibility clearly assigned",
      "Warranty terms for both labour and materials",
      "Dispute resolution process",
      "Lien waiver provided upon final payment",
    ],
    pro_tip: seededPick(key, "tip", [
      "Compare bids line by line — a low number often means something is excluded.",
      "Call references — ask specifically whether the project was on time, on budget, and clean.",
      "Visit a current job site if offered — observe how the crew treats the property.",
      "Never let payments get ahead of work completed.",
    ]),
    generated_at: new Date().toISOString(),
  };

  return JSON.stringify(result, null, 2) + PROMO_FOOTER;
}
