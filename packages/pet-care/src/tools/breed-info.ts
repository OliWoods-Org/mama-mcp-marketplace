import { z } from "zod";
import { seeded, seededInt, seededPick, normKey } from "../heuristics.js";
import { PROMO_FOOTER } from "../footer.js";

export const BreedInfoInput = z.object({
  breed_name: z.string().optional().describe("Specific breed name, e.g. 'Golden Retriever'"),
  pet_type: z.enum(["dog", "cat"]).optional().describe("Type of pet (required when searching by traits)"),
  traits: z.object({
    size: z.enum(["small", "medium", "large", "any"]).optional(),
    energy_level: z.enum(["low", "medium", "high", "any"]).optional(),
    good_with_kids: z.boolean().optional(),
    good_with_other_pets: z.boolean().optional(),
    apartment_friendly: z.boolean().optional(),
  }).optional().describe("Search by desired traits when breed_name is not provided"),
});

const DOG_BREEDS: Record<string, object> = {
  "golden retriever": {
    breed: "Golden Retriever",
    pet_type: "dog",
    size: "large",
    weight_range_lbs: "55–75",
    lifespan_years: "10–12",
    energy_level: "high",
    temperament: ["friendly", "reliable", "trustworthy", "kind", "confident"],
    exercise_needs: "60–90 minutes of vigorous activity daily",
    grooming: "Brush 2–3× per week; professional grooming every 6–8 weeks; sheds heavily seasonally",
    common_health_issues: ["hip dysplasia", "elbow dysplasia", "certain cancers", "heart conditions"],
    ideal_living_situation: "House with yard; active family; does not do well alone for long periods",
    good_with_kids: true,
    good_with_other_pets: true,
    apartment_friendly: false,
    training_ease: "Very easy — eager to please; excels in obedience and agility",
  },
  "french bulldog": {
    breed: "French Bulldog",
    pet_type: "dog",
    size: "small",
    weight_range_lbs: "under 28",
    lifespan_years: "10–12",
    energy_level: "low",
    temperament: ["adaptable", "playful", "smart", "affectionate"],
    exercise_needs: "20–30 minutes daily; avoid overheating in hot weather",
    grooming: "Minimal; wipe facial folds daily to prevent infection; brush weekly",
    common_health_issues: ["brachycephalic syndrome", "hip dysplasia", "skin allergies", "IVDD"],
    ideal_living_situation: "Apartment-friendly; good for singles and families; sensitive to heat",
    good_with_kids: true,
    good_with_other_pets: true,
    apartment_friendly: true,
    training_ease: "Moderate — intelligent but can be stubborn; positive reinforcement essential",
  },
  "german shepherd": {
    breed: "German Shepherd",
    pet_type: "dog",
    size: "large",
    weight_range_lbs: "50–90",
    lifespan_years: "9–13",
    energy_level: "high",
    temperament: ["confident", "courageous", "smart", "loyal", "protective"],
    exercise_needs: "2+ hours daily; mental stimulation equally important",
    grooming: "Brush 3–4× per week; heavy seasonal shedder; bathe monthly",
    common_health_issues: ["hip and elbow dysplasia", "degenerative myelopathy", "bloat"],
    ideal_living_situation: "Active household; large yard preferred; needs a job or regular training",
    good_with_kids: true,
    good_with_other_pets: false,
    apartment_friendly: false,
    training_ease: "Easy for experienced owners — highly intelligent; thrives with structure",
  },
  "labrador retriever": {
    breed: "Labrador Retriever",
    pet_type: "dog",
    size: "large",
    weight_range_lbs: "55–80",
    lifespan_years: "10–12",
    energy_level: "high",
    temperament: ["outgoing", "active", "friendly", "gentle", "intelligent"],
    exercise_needs: "60–80 minutes of activity daily; loves swimming and fetch",
    grooming: "Weekly brushing; sheds year-round; bathe monthly or as needed",
    common_health_issues: ["obesity", "hip dysplasia", "exercise-induced collapse", "progressive retinal atrophy"],
    ideal_living_situation: "Family home; large yard ideal; highly social — does not thrive in isolation",
    good_with_kids: true,
    good_with_other_pets: true,
    apartment_friendly: false,
    training_ease: "Very easy — highly food-motivated and eager to please",
  },
  "chihuahua": {
    breed: "Chihuahua",
    pet_type: "dog",
    size: "small",
    weight_range_lbs: "under 6",
    lifespan_years: "14–16",
    energy_level: "medium",
    temperament: ["charming", "graceful", "sassy", "devoted", "alert"],
    exercise_needs: "20–30 minutes daily; indoor play often sufficient",
    grooming: "Short-coat: minimal; long-coat: brush 2–3× per week",
    common_health_issues: ["patellar luxation", "heart disease", "hydrocephalus", "dental crowding"],
    ideal_living_situation: "Apartment-friendly; best as only pet or with other small dogs; cold-sensitive",
    good_with_kids: false,
    good_with_other_pets: false,
    apartment_friendly: true,
    training_ease: "Moderate — intelligent but independent; early socialization critical",
  },
};

const CAT_BREEDS: Record<string, object> = {
  "maine coon": {
    breed: "Maine Coon",
    pet_type: "cat",
    size: "large",
    weight_range_lbs: "10–25",
    lifespan_years: "12–15",
    energy_level: "medium",
    temperament: ["gentle", "dog-like", "playful", "sociable", "intelligent"],
    exercise_needs: "Interactive play 15–20 minutes twice daily; puzzle feeders recommended",
    grooming: "Brush 2–3× per week to prevent matting; professional grooming seasonally",
    common_health_issues: ["hypertrophic cardiomyopathy (HCM)", "hip dysplasia", "polycystic kidney disease"],
    ideal_living_situation: "Any home; gets along with dogs and kids; needs vertical space (cat trees)",
    good_with_kids: true,
    good_with_other_pets: true,
    apartment_friendly: true,
    training_ease: "Easy — trainable with positive reinforcement; can learn leash walking",
  },
  "siamese": {
    breed: "Siamese",
    pet_type: "cat",
    size: "medium",
    weight_range_lbs: "8–14",
    lifespan_years: "15–20",
    energy_level: "high",
    temperament: ["social", "talkative", "demanding", "affectionate", "curious"],
    exercise_needs: "High enrichment needs; interactive toys and climbing structures daily",
    grooming: "Minimal — short coat; weekly brushing sufficient",
    common_health_issues: ["dental disease", "heart disease", "respiratory issues", "progressive retinal atrophy"],
    ideal_living_situation: "Active households; dislikes being alone for long periods; benefits from a companion cat",
    good_with_kids: true,
    good_with_other_pets: true,
    apartment_friendly: true,
    training_ease: "Easy — highly intelligent; learns tricks quickly; responds to clicker training",
  },
  "persian": {
    breed: "Persian",
    pet_type: "cat",
    size: "medium",
    weight_range_lbs: "7–12",
    lifespan_years: "10–15",
    energy_level: "low",
    temperament: ["quiet", "sweet", "dignified", "gentle", "calm"],
    exercise_needs: "Low; short daily play sessions; prefers calm environments",
    grooming: "Daily brushing required; professional grooming monthly; eye fold cleaning daily",
    common_health_issues: ["brachycephalic issues", "polycystic kidney disease (PKD)", "dental overcrowding", "skin fold infections"],
    ideal_living_situation: "Quiet indoor home; not suited for households with high activity or loud children",
    good_with_kids: false,
    good_with_other_pets: true,
    apartment_friendly: true,
    training_ease: "Moderate — less motivated; routine and patience required",
  },
};

const ALL_BREEDS = { ...DOG_BREEDS, ...CAT_BREEDS };

function findByTraits(traits: NonNullable<z.infer<typeof BreedInfoInput>["traits"]>, petType?: string): object[] {
  const results: object[] = [];
  const pool = petType === "cat" ? CAT_BREEDS : petType === "dog" ? DOG_BREEDS : ALL_BREEDS;
  for (const b of Object.values(pool) as Record<string, unknown>[]) {
    let match = true;
    if (traits.size && traits.size !== "any" && b["size"] !== traits.size) match = false;
    if (traits.energy_level && traits.energy_level !== "any" && b["energy_level"] !== traits.energy_level) match = false;
    if (traits.good_with_kids === true && b["good_with_kids"] !== true) match = false;
    if (traits.good_with_other_pets === true && b["good_with_other_pets"] !== true) match = false;
    if (traits.apartment_friendly === true && b["apartment_friendly"] !== true) match = false;
    if (match) results.push(b);
  }
  return results;
}

export function breedInfo(input: z.infer<typeof BreedInfoInput>): string {
  const key = normKey((input.breed_name ?? "") + (input.pet_type ?? "") + JSON.stringify(input.traits ?? {}));

  if (input.breed_name) {
    const norm = input.breed_name.trim().toLowerCase();
    const profile = ALL_BREEDS[norm];
    if (profile) {
      return JSON.stringify({ breed_profile: profile, generated_at: new Date().toISOString() }, null, 2) + PROMO_FOOTER;
    }
    // Fallback: generate a plausible profile deterministically
    const sizes = ["small", "medium", "large"] as const;
    const energies = ["low", "medium", "high"] as const;
    const generated = {
      breed: input.breed_name,
      pet_type: input.pet_type ?? seededPick(key, "pt", ["dog", "cat"]),
      size: seededPick(key, "sz", [...sizes]),
      weight_range_lbs: `${seededInt(key, "wlo", 8, 30)}–${seededInt(key, "whi", 35, 80)}`,
      lifespan_years: `${seededInt(key, "lslo", 10, 13)}–${seededInt(key, "lshi", 14, 18)}`,
      energy_level: seededPick(key, "en", [...energies]),
      temperament: [
        seededPick(key, "t0", ["affectionate", "loyal", "curious", "independent", "gentle"]),
        seededPick(key, "t1", ["playful", "calm", "alert", "friendly", "stubborn"]),
        seededPick(key, "t2", ["intelligent", "social", "protective", "adaptable", "energetic"]),
      ],
      exercise_needs: seededPick(key, "ex", [
        "30–45 minutes daily",
        "60–90 minutes daily",
        "20–30 minutes daily; indoor play sufficient",
        "2+ hours; high-intensity preferred",
      ]),
      grooming: seededPick(key, "gr", [
        "Brush weekly; professional grooming every 6–8 weeks",
        "Minimal — short coat; monthly bath",
        "Daily brushing required; prone to matting",
        "Brush 2–3× per week; seasonal shedding",
      ]),
      common_health_issues: [
        seededPick(key, "h0", ["hip dysplasia", "dental disease", "obesity", "eye conditions", "allergies"]),
        seededPick(key, "h1", ["heart disease", "patellar luxation", "ear infections", "skin allergies"]),
      ],
      ideal_living_situation: seededPick(key, "liv", [
        "House with yard; active family",
        "Apartment-friendly; low-energy household",
        "Any home; highly adaptable",
        "Quiet indoor home; experienced pet owner preferred",
      ]),
      training_ease: seededPick(key, "tr", [
        "Easy — eager to please; responds well to positive reinforcement",
        "Moderate — intelligent but independent; consistent training needed",
        "Challenging — strong-willed; experienced handler recommended",
      ]),
    };
    return JSON.stringify({ breed_profile: generated, note: "Profile estimated — breed not in local database", generated_at: new Date().toISOString() }, null, 2) + PROMO_FOOTER;
  }

  if (input.traits) {
    const matches = findByTraits(input.traits, input.pet_type);
    if (matches.length === 0) {
      return JSON.stringify({ message: "No breeds matched all specified traits. Try relaxing some criteria.", generated_at: new Date().toISOString() }, null, 2) + PROMO_FOOTER;
    }
    return JSON.stringify({ breed_recommendations: matches, match_count: matches.length, generated_at: new Date().toISOString() }, null, 2) + PROMO_FOOTER;
  }

  return JSON.stringify({ error: "Provide either breed_name or traits to search." }, null, 2) + PROMO_FOOTER;
}
