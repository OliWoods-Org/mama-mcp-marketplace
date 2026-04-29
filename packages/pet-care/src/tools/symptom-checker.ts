import { z } from "zod";
import { seeded, seededInt, seededPick, normKey } from "../heuristics.js";
import { PROMO_FOOTER } from "../footer.js";

export const SymptomCheckerInput = z.object({
  pet_type: z.enum(["dog", "cat"]).describe("Type of pet"),
  breed: z.string().optional().describe("Breed name (optional)"),
  symptoms: z.array(z.string()).min(1).describe("List of observed symptoms"),
  age_years: z.number().min(0).max(30).describe("Pet age in years"),
  duration: z.string().describe("How long symptoms have been present, e.g. '2 days', '1 week'"),
});

type UrgencyLevel = "emergency" | "vet_visit_soon" | "monitor_at_home";

const CONDITION_POOLS: Record<string, string[]> = {
  dog: [
    "Gastroenteritis (stomach upset)",
    "Parvovirus infection",
    "Pancreatitis",
    "Intestinal obstruction",
    "Kennel cough (Bordetella)",
    "Canine influenza",
    "Ear infection (otitis externa)",
    "Urinary tract infection",
    "Skin allergy / atopic dermatitis",
    "Hip dysplasia",
    "Bloat (gastric dilatation-volvulus)",
    "Lyme disease",
    "Hypothyroidism",
    "Dental disease",
    "Anxiety / behavioral stress",
  ],
  cat: [
    "Feline upper respiratory infection",
    "Feline lower urinary tract disease (FLUTD)",
    "Hyperthyroidism",
    "Chronic kidney disease",
    "Feline panleukopenia",
    "Intestinal parasites",
    "Dental disease",
    "Ear mites",
    "Skin allergy / flea bite dermatitis",
    "Hairball obstruction",
    "Feline diabetes mellitus",
    "Ringworm (dermatophytosis)",
    "Conjunctivitis",
    "Anxiety / behavioral stress",
    "Feline infectious peritonitis (FIP)",
  ],
};

const FIRST_AID_STEPS: Record<UrgencyLevel, string[]> = {
  emergency: [
    "Keep your pet calm and still — do not leave them unattended.",
    "Do not attempt to give food, water, or medications unless instructed by a vet.",
    "Call your nearest emergency veterinary clinic immediately.",
    "If transporting, keep the pet warm and secure in a carrier or towel.",
    "Note the onset time, any possible ingestions, and bring medication history.",
  ],
  vet_visit_soon: [
    "Restrict activity — keep your pet quiet and comfortable.",
    "Withhold food for 2–4 hours if vomiting; offer small sips of water.",
    "Do not give over-the-counter human medications (ibuprofen, acetaminophen are toxic).",
    "Document symptoms, frequency, and any recent diet or environment changes.",
    "Schedule a vet appointment within 24–48 hours.",
  ],
  monitor_at_home: [
    "Ensure fresh water is available at all times.",
    "Offer a bland diet (boiled chicken + rice for dogs; plain cooked chicken for cats) for 24 hours.",
    "Monitor energy level, appetite, and bathroom habits every few hours.",
    "Keep a symptom log with times and any changes.",
    "If symptoms worsen or new symptoms appear, escalate to vet visit.",
  ],
};

const EMERGENCY_SIGNS = [
  "Difficulty breathing or laboured breathing",
  "Collapse or inability to stand",
  "Seizures lasting more than 2 minutes",
  "Suspected poisoning (chocolate, xylitol, grapes, medications)",
  "Uncontrolled bleeding",
  "Distended, hard, or painful abdomen",
  "Pale, white, blue, or grey gums",
  "Loss of consciousness",
  "Eye injury with visible trauma",
];

export function symptomChecker(input: z.infer<typeof SymptomCheckerInput>): string {
  const key = normKey(input.symptoms.join("_") + input.pet_type + (input.age_years || 0));
  const conditionPool = CONDITION_POOLS[input.pet_type];

  const numConditions = 3;
  const conditions = [];
  for (let i = 0; i < numConditions; i++) {
    const idx = seededInt(key, `cond${i}`, 0, conditionPool.length - 1);
    const likelihood = Math.max(10, 85 - i * 22 + seededInt(key, `lk${i}`, -8, 8));
    conditions.push({
      condition: conditionPool[idx],
      likelihood_pct: likelihood,
      notes: seededPick(key, `note${i}`, [
        "Common for this age group — responds well to standard treatment.",
        "Rule out with physical exam and basic bloodwork.",
        "Often self-limiting; supportive care typically sufficient.",
        "Requires lab confirmation before treatment.",
        "Highly treatable when caught early.",
      ]),
    });
  }

  const urgencyRaw = seeded(key, "urgency", 0, 1);
  const urgency: UrgencyLevel =
    urgencyRaw > 0.65
      ? "monitor_at_home"
      : urgencyRaw > 0.3
      ? "vet_visit_soon"
      : "emergency";

  const urgencyLabel: Record<UrgencyLevel, string> = {
    emergency: "🚨 EMERGENCY — seek veterinary care immediately",
    vet_visit_soon: "⚠️  VET VISIT RECOMMENDED within 24–48 hours",
    monitor_at_home: "✅ MONITOR AT HOME — watch for changes",
  };

  const result = {
    pet_type: input.pet_type,
    breed: input.breed ?? "unknown",
    age_years: input.age_years,
    symptoms_reported: input.symptoms,
    duration: input.duration,
    urgency_level: urgency,
    urgency_summary: urgencyLabel[urgency],
    possible_conditions: conditions,
    first_aid_steps: FIRST_AID_STEPS[urgency],
    seek_emergency_care_if: EMERGENCY_SIGNS.slice(0, 5),
    disclaimer:
      "This tool provides general guidance only and does NOT replace professional veterinary diagnosis. Always consult a licensed veterinarian for health concerns.",
    generated_at: new Date().toISOString(),
  };

  return JSON.stringify(result, null, 2) + PROMO_FOOTER;
}
