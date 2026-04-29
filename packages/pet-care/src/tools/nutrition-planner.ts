import { z } from "zod";
import { seeded, seededInt, seededPick, normKey } from "../heuristics.js";
import { PROMO_FOOTER } from "../footer.js";

export const NutritionPlannerInput = z.object({
  pet_type: z.enum(["dog", "cat"]).describe("Type of pet"),
  breed: z.string().optional().describe("Breed name"),
  weight_lbs: z.number().min(1).max(250).describe("Current weight in pounds"),
  age_years: z.number().min(0).max(30).describe("Age in years"),
  activity_level: z.enum(["sedentary", "moderate", "active", "working"]).describe("Daily activity level"),
  allergies: z.array(z.string()).optional().describe("Known food allergies or intolerances"),
  health_conditions: z.array(z.string()).optional().describe("Known health conditions, e.g. diabetes, kidney disease"),
});

function resting_energy_requirement(weightLbs: number): number {
  const weightKg = weightLbs * 0.453592;
  return 70 * Math.pow(weightKg, 0.75);
}

function daily_calories(rer: number, activityLevel: string, petType: string, ageYears: number): number {
  const factors: Record<string, number> = {
    sedentary: petType === "cat" ? 1.2 : 1.4,
    moderate: petType === "cat" ? 1.4 : 1.6,
    active: petType === "cat" ? 1.6 : 1.8,
    working: petType === "cat" ? 1.8 : 2.5,
  };
  let factor = factors[activityLevel] ?? 1.6;
  if (ageYears < 1) factor *= 2.0; // puppy/kitten
  if (ageYears > 8) factor *= 0.9; // senior
  return Math.round(rer * factor);
}

const FOOD_TO_AVOID: Record<string, string[]> = {
  dog: [
    "Chocolate — contains theobromine; toxic even in small amounts",
    "Xylitol (artificial sweetener) — causes rapid insulin release; potentially fatal",
    "Grapes and raisins — can cause acute kidney failure",
    "Onions, garlic, leeks — damage red blood cells",
    "Macadamia nuts — neurological symptoms",
    "Cooked bones — splinter risk; raw bones only under supervision",
    "Alcohol and caffeine — central nervous system toxins",
    "Avocado — persin toxicity in dogs",
  ],
  cat: [
    "Onions, garlic, chives — Heinz body anaemia",
    "Raw fish in excess — thiamine deficiency",
    "Milk and dairy (in large amounts) — most adult cats are lactose intolerant",
    "Grapes and raisins — kidney failure risk",
    "Caffeine and alcohol — CNS toxins",
    "Raw dough/yeast — expands in stomach; produces alcohol",
    "Tuna as a sole diet — mercury build-up; nutritional deficiency",
    "Xylitol — organ failure",
  ],
};

const SUPPLEMENT_SUGGESTIONS: Record<string, string[]> = {
  joint: ["Glucosamine 500 mg + Chondroitin 400 mg daily (dog); consult vet for cat dosing", "Omega-3 fish oil (EPA+DHA) — anti-inflammatory; 30 mg/kg body weight"],
  coat: ["Omega-3 fatty acids (fish oil or algae-based)", "Biotin — supports skin and coat health"],
  digestive: ["Probiotic (Lactobacillus acidophilus) — supports gut microbiome", "Pumpkin puree (1 tsp/day) — soluble fibre for stool consistency"],
  senior: ["Antioxidants (Vitamin E, C, beta-carotene)", "Omega-3s for cognitive and joint support", "Consider renal-support diet if kidney values are elevated"],
  general: ["No supplements needed for pets on a complete, AAFCO-approved diet"],
};

export function nutritionPlanner(input: z.infer<typeof NutritionPlannerInput>): string {
  const key = normKey(input.pet_type + (input.breed ?? "") + input.weight_lbs + input.age_years + input.activity_level);

  const rer = resting_energy_requirement(input.weight_lbs);
  const calories = daily_calories(rer, input.activity_level, input.pet_type, input.age_years);

  const lifeStage =
    input.age_years < 1 ? "puppy/kitten" : input.age_years >= 7 ? "senior" : "adult";

  const mealCount = input.pet_type === "cat" ? "2–3 meals per day" : input.age_years < 1 ? "3 meals per day" : "2 meals per day";

  const proteinPct = input.pet_type === "cat" ? seededInt(key, "prot", 32, 45) : seededInt(key, "prot", 22, 30);
  const fatPct = input.pet_type === "cat" ? seededInt(key, "fat", 15, 22) : seededInt(key, "fat", 10, 18);

  const recommendedFoodTypes = input.pet_type === "dog"
    ? seededPick(key, "food", [
        ["High-quality dry kibble (AAFCO-approved)", "Lean protein wet food topper 3–4× per week"],
        ["Fresh/gently cooked diet (e.g. The Farmer's Dog, Ollie)", "Supplemented with joint chew daily"],
        ["Raw diet (BARF model) — requires careful formulation; consult vet nutritionist"],
        ["Premium dry kibble + plain cooked protein (chicken breast, turkey) for training treats"],
      ])
    : seededPick(key, "food", [
        ["High-protein wet food as primary diet (cats are obligate carnivores)", "Dry kibble as supplement only"],
        ["Limited-ingredient wet food (single protein source)", "Raw cat food (consult vet first)"],
        ["Species-appropriate high-moisture diet — kidney health priority", "Avoid dry-only diets long-term"],
      ]);

  const supplementCategory =
    input.age_years >= 7 ? "senior" :
    input.health_conditions?.some(c => /joint|arthr/i.test(c)) ? "joint" :
    input.health_conditions?.some(c => /digest|ibd|colitis/i.test(c)) ? "digestive" :
    input.health_conditions?.some(c => /coat|skin|allerg/i.test(c)) ? "coat" :
    "general";

  const allergiesSection = input.allergies && input.allergies.length > 0
    ? { avoid_ingredients: input.allergies, note: "Look for novel protein sources (venison, duck, rabbit) or hydrolysed protein diets to eliminate allergens." }
    : null;

  const result = {
    pet_type: input.pet_type,
    breed: input.breed ?? "unspecified",
    weight_lbs: input.weight_lbs,
    age_years: input.age_years,
    life_stage: lifeStage,
    activity_level: input.activity_level,
    daily_calorie_needs: {
      resting_energy_kcal: Math.round(rer),
      daily_requirement_kcal: calories,
      note: "Adjust ±10% based on weight changes over 4–6 weeks",
    },
    macronutrient_targets: {
      protein_pct_dry_matter: `${proteinPct}% minimum`,
      fat_pct_dry_matter: `${fatPct}%`,
      fibre_pct_dry_matter: input.pet_type === "cat" ? "2–5%" : "3–8%",
    },
    recommended_food_types: recommendedFoodTypes,
    feeding_schedule: {
      meals_per_day: mealCount,
      calories_per_meal: `~${Math.round(calories / (mealCount.startsWith("3") ? 3 : 2))} kcal`,
      tip: "Use a measuring cup or kitchen scale — free-feeding leads to obesity",
    },
    foods_to_avoid: FOOD_TO_AVOID[input.pet_type],
    ...(allergiesSection ? { allergy_guidance: allergiesSection } : {}),
    supplement_suggestions: SUPPLEMENT_SUGGESTIONS[supplementCategory],
    health_condition_notes:
      input.health_conditions && input.health_conditions.length > 0
        ? `Conditions noted (${input.health_conditions.join(", ")}): Always consult your veterinarian before changing diet — prescription diets may be required.`
        : null,
    ideal_body_weight_guide:
      "Ribs should be easily felt but not visible; a visible waist from above; slight abdominal tuck from the side.",
    disclaimer:
      "Nutritional estimates are based on standard formulas and are NOT a substitute for veterinary nutritional counselling.",
    generated_at: new Date().toISOString(),
  };

  return JSON.stringify(result, null, 2) + PROMO_FOOTER;
}
