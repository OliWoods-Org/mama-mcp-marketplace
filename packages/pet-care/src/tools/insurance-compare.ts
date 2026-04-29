import { z } from "zod";
import { seeded, seededInt, seededPick, normKey } from "../heuristics.js";
import { PROMO_FOOTER } from "../footer.js";

export const InsuranceCompareInput = z.object({
  pet_type: z.enum(["dog", "cat"]).describe("Type of pet"),
  breed: z.string().describe("Breed name"),
  age_years: z.number().min(0).max(20).describe("Pet age in years"),
  zip_code: z.string().min(5).max(10).describe("Owner's ZIP code"),
});

const HIGH_RISK_BREEDS = [
  "bulldog", "french bulldog", "pug", "boston terrier", "english bulldog",
  "great dane", "saint bernard", "mastiff", "bernese mountain dog",
  "cavalier king charles", "dachshund", "german shepherd", "rottweiler",
  "doberman", "persian", "maine coon", "ragdoll",
];

const PROVIDERS = [
  { name: "Trupanion", specialty: "100% actual-cost reimbursement; no payout limits" },
  { name: "Nationwide", specialty: "Only provider covering exotic pets; whole-pet plan available" },
  { name: "Healthy Paws", specialty: "No annual or lifetime limits; fast claims processing" },
  { name: "Embrace", specialty: "Diminishing deductible reward; wellness rewards add-on" },
  { name: "Figo", specialty: "100% reimbursement option; 3-day claim turnaround" },
  { name: "ASPCA Pet Insurance", specialty: "Coverage for behavioural therapy; exam fees included" },
  { name: "Lemonade Pet", specialty: "Instant claims via app; preventive care add-on" },
];

function regionFactor(zip: string): number {
  const prefix = parseInt(zip.slice(0, 3), 10);
  if (prefix < 100 || (prefix >= 900 && prefix < 970)) return 1.25; // NY/CA premium
  if (prefix >= 600 && prefix < 650) return 0.92; // Midwest discount
  return 1.0;
}

export function insuranceCompare(input: z.infer<typeof InsuranceCompareInput>): string {
  const key = normKey(input.pet_type + input.breed + input.age_years + input.zip_code);
  const breedLower = input.breed.toLowerCase();
  const isHighRisk = HIGH_RISK_BREEDS.some(b => breedLower.includes(b));

  const baseAccident = input.pet_type === "dog" ? 22 : 18;
  const baseComprehensive = input.pet_type === "dog" ? 48 : 38;

  const ageFactor = input.age_years < 1 ? 0.9 : input.age_years < 4 ? 1.0 : input.age_years < 8 ? 1.3 : 1.8;
  const breedFactor = isHighRisk ? 1.4 : 1.0;
  const rf = regionFactor(input.zip_code);
  const noise = seeded(key, "noise", 0.92, 1.08);

  const accidentPremium = Math.round(baseAccident * ageFactor * breedFactor * rf * noise);
  const comprehensivePremium = Math.round(baseComprehensive * ageFactor * breedFactor * rf * noise);

  const deductibleOptions = [250, 500, 1000];
  const reimbursementOptions = ["70%", "80%", "90%"];

  const recommendedCoverage = input.age_years < 2
    ? "comprehensive"
    : isHighRisk
    ? "comprehensive"
    : input.age_years >= 10
    ? "accident_only"
    : "comprehensive";

  const topProviders = [
    PROVIDERS[seededInt(key, "p0", 0, PROVIDERS.length - 1)],
    PROVIDERS[seededInt(key, "p1", 0, PROVIDERS.length - 1)],
    PROVIDERS[seededInt(key, "p2", 0, PROVIDERS.length - 1)],
  ].filter((p, i, arr) => arr.findIndex(x => x.name === p.name) === i).slice(0, 3);

  const commonExclusions = [
    "Pre-existing conditions (anything diagnosed or treated before enrollment)",
    "Elective procedures (cosmetic, ear cropping, tail docking)",
    "Breeding costs and pregnancy",
    "Preventive / routine care (vaccines, heartworm, flea prevention) — unless wellness rider added",
    "Dental disease if pre-existing; dental injuries typically covered",
    isHighRisk ? `Breed-specific conditions for ${input.breed} may require a waiting period or additional premium` : "Hereditary and congenital conditions (varies widely by provider — read policy carefully)",
  ];

  const result = {
    pet_type: input.pet_type,
    breed: input.breed,
    age_years: input.age_years,
    zip_code: input.zip_code,
    risk_profile: isHighRisk ? "elevated (breed-specific health risks)" : "standard",
    estimated_monthly_premiums: {
      accident_only: {
        monthly_usd: accidentPremium,
        covers: "Injuries, poisoning, emergency surgery, hospitalisation from accidents only",
      },
      comprehensive: {
        monthly_usd: comprehensivePremium,
        covers: "Accidents + illness, cancer treatment, hereditary conditions, chronic disease management",
      },
      note: "Estimates based on typical market pricing; actual quotes vary by provider, deductible, and reimbursement level",
    },
    coverage_options: {
      deductible_choices: deductibleOptions.map(d => ({
        annual_deductible_usd: d,
        effect: d === 250 ? "Low deductible → higher premium" : d === 1000 ? "High deductible → lower premium" : "Mid-range balance",
      })),
      reimbursement_levels: reimbursementOptions,
    },
    recommended_coverage_level: recommendedCoverage,
    recommendation_rationale:
      recommendedCoverage === "comprehensive"
        ? `At ${input.age_years < 2 ? "young age" : isHighRisk ? "high breed risk" : "this life stage"}, comprehensive coverage provides the best financial protection — vet bills for illness can exceed $5,000–$15,000.`
        : "Accident-only may suffice for senior pets where comprehensive premiums become high; weigh against expected remaining lifespan and likely health trajectory.",
    top_providers: topProviders,
    common_exclusions: commonExclusions,
    pre_existing_condition_rules: {
      definition: "Any condition showing signs or symptoms before the policy effective date, or within the waiting period",
      waiting_periods: {
        accidents: "0–5 days typically",
        illness: "14 days typically",
        orthopedic_conditions: "6–12 months (varies by provider)",
      },
      tip: "Enroll when your pet is young and healthy to minimise pre-existing exclusions.",
    },
    money_saving_tips: [
      "Annual payment typically saves 5–10% vs monthly",
      "Multi-pet discount available at most providers (5–10%)",
      "Get quotes before your pet's first vet visit — a single diagnosis can trigger exclusions",
      seededPick(key, "tip", [
        "Some employers offer pet insurance as a voluntary benefit at group rates",
        "ASPCA and Nationwide offer military/first responder discounts",
        "Ask your vet — some practices have preferred-provider arrangements",
      ]),
    ],
    disclaimer:
      "Premium estimates are illustrative and NOT actual insurance quotes. Contact providers directly for accurate pricing. This is not insurance advice.",
    generated_at: new Date().toISOString(),
  };

  return JSON.stringify(result, null, 2) + PROMO_FOOTER;
}
