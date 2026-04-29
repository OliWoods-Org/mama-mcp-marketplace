import { z } from "zod";
import {
  hash, rangeInt, seededRandom,
  RECIPE_DB, FOOTER,
} from "../heuristics.js";

export const nutritionLookupSchema = {
  food_item: z.string().describe("Food to look up (e.g. 'salmon', 'brown rice', 'avocado', 'Greek yogurt')"),
  serving_size: z.string().optional().describe("Serving size (e.g. '100g', '1 cup', '1 medium', '3 oz')"),
  compare_to: z.string().optional().describe("Another food to compare nutritional value against"),
};

type NutritionLookupParams = {
  food_item: string;
  serving_size?: string;
  compare_to?: string;
};

interface NutritionProfile {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fiber_g: number;
  sugar_g: number;
  fat_g: number;
  saturated_fat_g: number;
  sodium_mg: number;
  cholesterol_mg: number;
  vitamin_a_pct: number;
  vitamin_c_pct: number;
  vitamin_d_pct: number;
  calcium_pct: number;
  iron_pct: number;
  potassium_mg: number;
  magnesium_mg: number;
  omega3_mg?: number;
  health_score: number;
}

// First, try to match against known recipes in the DB
function matchRecipeDB(food: string): { calories: number; protein_g: number; carbs_g: number; fat_g: number } | null {
  const foodLower = food.toLowerCase();
  for (const recipe of RECIPE_DB) {
    if (recipe.name.toLowerCase().includes(foodLower) || foodLower.includes(recipe.name.toLowerCase().split(" ")[0])) {
      return {
        calories: recipe.calories_per_serving,
        protein_g: recipe.protein_g,
        carbs_g: recipe.carbs_g,
        fat_g: recipe.fat_g,
      };
    }
    // Check ingredients
    for (const ing of recipe.ingredients) {
      if (ing.toLowerCase().includes(foodLower) && foodLower.length > 4) {
        return {
          calories: Math.round(recipe.calories_per_serving * 0.4),
          protein_g: Math.round(recipe.protein_g * 0.4),
          carbs_g: Math.round(recipe.carbs_g * 0.4),
          fat_g: Math.round(recipe.fat_g * 0.4),
        };
      }
    }
  }
  return null;
}

function generateNutritionProfile(food: string, seed: string): NutritionProfile {
  const foodLower = food.toLowerCase();

  // Category detection for realistic macros
  const isProtein = ["chicken", "beef", "salmon", "tuna", "fish", "shrimp", "turkey", "pork", "lamb", "egg", "tofu"].some(p => foodLower.includes(p));
  const isGrain = ["rice", "pasta", "bread", "oat", "quinoa", "noodle", "tortilla", "wheat"].some(p => foodLower.includes(p));
  const isVegetable = ["broccoli", "spinach", "kale", "carrot", "tomato", "pepper", "cucumber", "zucchini", "asparagus", "lettuce", "cabbage", "onion"].some(p => foodLower.includes(p));
  const isFruit = ["apple", "banana", "berry", "mango", "orange", "grape", "peach", "pear", "lemon", "lime"].some(p => foodLower.includes(p));
  const isDairy = ["yogurt", "milk", "cheese", "cream", "butter"].some(p => foodLower.includes(p));
  const isNut = ["almond", "walnut", "cashew", "peanut", "nut", "seed"].some(p => foodLower.includes(p));
  const isFat = ["avocado", "oil", "butter", "fat"].some(p => foodLower.includes(p));
  const isLegume = ["bean", "lentil", "chickpea", "pea", "edamame"].some(p => foodLower.includes(p));

  let baseCalories: number, baseProtein: number, baseCarbs: number, baseFat: number;

  if (isProtein) {
    baseCalories = rangeInt(120, 220, seed, 1);
    baseProtein = rangeInt(22, 36, seed, 2);
    baseCarbs = rangeInt(0, 8, seed, 3);
    baseFat = rangeInt(4, 18, seed, 4);
  } else if (isGrain) {
    baseCalories = rangeInt(180, 340, seed, 1);
    baseProtein = rangeInt(4, 12, seed, 2);
    baseCarbs = rangeInt(36, 68, seed, 3);
    baseFat = rangeInt(1, 6, seed, 4);
  } else if (isVegetable) {
    baseCalories = rangeInt(20, 80, seed, 1);
    baseProtein = rangeInt(2, 6, seed, 2);
    baseCarbs = rangeInt(4, 16, seed, 3);
    baseFat = rangeInt(0, 2, seed, 4);
  } else if (isFruit) {
    baseCalories = rangeInt(50, 120, seed, 1);
    baseProtein = rangeInt(0, 2, seed, 2);
    baseCarbs = rangeInt(12, 30, seed, 3);
    baseFat = rangeInt(0, 1, seed, 4);
  } else if (isDairy) {
    baseCalories = rangeInt(80, 200, seed, 1);
    baseProtein = rangeInt(6, 20, seed, 2);
    baseCarbs = rangeInt(4, 16, seed, 3);
    baseFat = rangeInt(2, 14, seed, 4);
  } else if (isNut) {
    baseCalories = rangeInt(160, 220, seed, 1);
    baseProtein = rangeInt(5, 10, seed, 2);
    baseCarbs = rangeInt(6, 16, seed, 3);
    baseFat = rangeInt(14, 20, seed, 4);
  } else if (isFat) {
    baseCalories = rangeInt(130, 200, seed, 1);
    baseProtein = rangeInt(1, 3, seed, 2);
    baseCarbs = rangeInt(1, 10, seed, 3);
    baseFat = rangeInt(14, 22, seed, 4);
  } else if (isLegume) {
    baseCalories = rangeInt(100, 200, seed, 1);
    baseProtein = rangeInt(8, 18, seed, 2);
    baseCarbs = rangeInt(18, 36, seed, 3);
    baseFat = rangeInt(1, 5, seed, 4);
  } else {
    // Generic food — use hash to produce a stable value
    baseCalories = rangeInt(80, 300, seed, 1);
    baseProtein = rangeInt(4, 20, seed, 2);
    baseCarbs = rangeInt(10, 50, seed, 3);
    baseFat = rangeInt(2, 16, seed, 4);
  }

  // Check recipe DB for a closer match
  const dbMatch = matchRecipeDB(food);
  if (dbMatch) {
    baseCalories = dbMatch.calories;
    baseProtein = dbMatch.protein_g;
    baseCarbs = dbMatch.carbs_g;
    baseFat = dbMatch.fat_g;
  }

  const fiber = Math.min(baseCarbs, rangeInt(1, isVegetable || isLegume ? 10 : 6, seed, 5));
  const sugar = Math.min(baseCarbs - fiber, rangeInt(0, isFruit ? 18 : 8, seed, 6));
  const satFat = Math.round(baseFat * seededRandom(seed, 7) * 0.4 * 10) / 10;
  const sodium = isProtein ? rangeInt(50, 400, seed, 8) : isGrain ? rangeInt(150, 500, seed, 8) : rangeInt(5, 200, seed, 8);
  const cholesterol = isProtein || isDairy ? rangeInt(40, 120, seed, 9) : rangeInt(0, 20, seed, 9);

  const vitA = isVegetable || isFruit ? rangeInt(6, 45, seed, 10) : rangeInt(0, 8, seed, 10);
  const vitC = isVegetable || isFruit ? rangeInt(10, 80, seed, 11) : rangeInt(0, 6, seed, 11);
  const vitD = isDairy || isProtein ? rangeInt(4, 25, seed, 12) : rangeInt(0, 4, seed, 12);
  const calcium = isDairy ? rangeInt(15, 40, seed, 13) : isVegetable ? rangeInt(4, 15, seed, 13) : rangeInt(1, 6, seed, 13);
  const iron = isProtein || isLegume || isGrain ? rangeInt(8, 25, seed, 14) : rangeInt(2, 8, seed, 14);
  const potassium = rangeInt(100, 600, seed, 15);
  const magnesium = rangeInt(15, 80, seed, 16);
  const omega3 = isProtein && (foodLower.includes("salmon") || foodLower.includes("tuna") || foodLower.includes("fish")) ? rangeInt(1200, 2800, seed, 17) : undefined;

  // Health score (0–100)
  let healthScore = 50;
  healthScore += Math.min(10, baseProtein / 4); // protein bonus
  healthScore += Math.min(10, fiber * 1.5);     // fiber bonus
  healthScore -= Math.min(10, satFat * 2);      // sat fat penalty
  healthScore -= Math.min(10, sodium / 100);    // sodium penalty
  healthScore += vitA > 20 ? 5 : 0;
  healthScore += vitC > 20 ? 5 : 0;
  healthScore += iron > 10 ? 3 : 0;
  healthScore = Math.min(98, Math.max(20, Math.round(healthScore)));

  return {
    calories: baseCalories,
    protein_g: baseProtein,
    carbs_g: baseCarbs,
    fiber_g: fiber,
    sugar_g: sugar,
    fat_g: baseFat,
    saturated_fat_g: satFat,
    sodium_mg: sodium,
    cholesterol_mg: cholesterol,
    vitamin_a_pct: vitA,
    vitamin_c_pct: vitC,
    vitamin_d_pct: vitD,
    calcium_pct: calcium,
    iron_pct: iron,
    potassium_mg: potassium,
    magnesium_mg: magnesium,
    omega3_mg: omega3,
    health_score: healthScore,
  };
}

function getDietTags(profile: NutritionProfile, foodLower: string): string[] {
  const tags: string[] = [];
  if (profile.carbs_g < 10) tags.push("keto-friendly");
  if (profile.protein_g >= 20) tags.push("high-protein");
  if (profile.fiber_g >= 5) tags.push("high-fiber");
  if (profile.fat_g < 5) tags.push("low-fat");
  if (profile.sodium_mg < 140) tags.push("low-sodium");
  if (profile.sugar_g < 5) tags.push("low-sugar");
  if (!["chicken", "beef", "pork", "salmon", "tuna", "shrimp", "lamb", "turkey", "fish", "bacon"].some(p => foodLower.includes(p))) {
    tags.push("vegetarian");
  }
  if (!["milk", "cheese", "yogurt", "cream", "butter", "egg"].some(p => foodLower.includes(p)) &&
      !["chicken", "beef", "pork", "salmon", "tuna", "shrimp", "lamb", "turkey"].some(p => foodLower.includes(p))) {
    tags.push("vegan");
  }
  if (!["wheat", "pasta", "bread", "noodle", "flour", "breadcrumb", "tortilla"].some(p => foodLower.includes(p))) {
    tags.push("gluten-free");
  }
  return tags;
}

function scoreBar(value: number, max: number = 100): string {
  const filled = Math.round((value / max) * 10);
  return "█".repeat(Math.min(10, filled)) + "░".repeat(Math.max(0, 10 - filled));
}

export function nutritionLookup(params: NutritionLookupParams): string {
  const { food_item, serving_size, compare_to } = params;
  const seed = `nutrition:${food_item.toLowerCase()}`;
  const compareSeed = compare_to ? `nutrition:${compare_to.toLowerCase()}` : "";

  const servingLabel = serving_size ?? "1 standard serving";
  const profile = generateNutritionProfile(food_item, seed);
  const compareProfile = compare_to ? generateNutritionProfile(compare_to, compareSeed) : null;

  const dietTags = getDietTags(profile, food_item.toLowerCase());
  const healthLabel = profile.health_score >= 80 ? "🟢 Excellent" : profile.health_score >= 60 ? "🟡 Good" : profile.health_score >= 40 ? "🟠 Moderate" : "🔴 Poor";

  let out = `# 🥗 Nutrition Facts: ${food_item}\n\n`;
  out += `**Serving size:** ${servingLabel}\n\n`;

  out += `## Nutrition Facts Panel\n\n`;
  out += `\`\`\`\n`;
  out += `┌─────────────────────────────────────┐\n`;
  out += `│         Nutrition Facts              │\n`;
  out += `│   Serving Size: ${servingLabel.padEnd(18)}│\n`;
  out += `├─────────────────────────────────────┤\n`;
  out += `│ Calories              ${String(profile.calories).padStart(6)} kcal      │\n`;
  out += `├─────────────────────────────────────┤\n`;
  out += `│                      % Daily Value* │\n`;
  out += `│ Total Fat         ${String(profile.fat_g + "g").padStart(5)}   ${String(Math.round(profile.fat_g / 78 * 100) + "%").padStart(5)}         │\n`;
  out += `│   Saturated Fat   ${String(profile.saturated_fat_g + "g").padStart(5)}   ${String(Math.round(profile.saturated_fat_g / 20 * 100) + "%").padStart(5)}         │\n`;
  out += `│   Trans Fat         0g                    │\n`;
  out += `│ Cholesterol       ${String(profile.cholesterol_mg + "mg").padStart(5)}   ${String(Math.round(profile.cholesterol_mg / 300 * 100) + "%").padStart(5)}         │\n`;
  out += `│ Sodium            ${String(profile.sodium_mg + "mg").padStart(5)}   ${String(Math.round(profile.sodium_mg / 2300 * 100) + "%").padStart(5)}         │\n`;
  out += `│ Total Carbohydrate ${String(profile.carbs_g + "g").padStart(4)}   ${String(Math.round(profile.carbs_g / 275 * 100) + "%").padStart(5)}         │\n`;
  out += `│   Dietary Fiber    ${String(profile.fiber_g + "g").padStart(4)}   ${String(Math.round(profile.fiber_g / 28 * 100) + "%").padStart(5)}         │\n`;
  out += `│   Total Sugars     ${String(profile.sugar_g + "g").padStart(4)}                   │\n`;
  out += `│ Protein           ${String(profile.protein_g + "g").padStart(5)}                   │\n`;
  out += `├─────────────────────────────────────┤\n`;
  out += `│ Vitamin A         ${String(profile.vitamin_a_pct + "%").padStart(5)}                   │\n`;
  out += `│ Vitamin C         ${String(profile.vitamin_c_pct + "%").padStart(5)}                   │\n`;
  out += `│ Vitamin D         ${String(profile.vitamin_d_pct + "%").padStart(5)}                   │\n`;
  out += `│ Calcium           ${String(profile.calcium_pct + "%").padStart(5)}                   │\n`;
  out += `│ Iron              ${String(profile.iron_pct + "%").padStart(5)}                   │\n`;
  out += `│ Potassium         ${String(profile.potassium_mg + "mg").padStart(5)}                   │\n`;
  out += `│ Magnesium         ${String(profile.magnesium_mg + "mg").padStart(5)}                   │\n`;
  if (profile.omega3_mg) {
    out += `│ Omega-3 FA        ${String(profile.omega3_mg + "mg").padStart(5)}                   │\n`;
  }
  out += `└─────────────────────────────────────┘\n`;
  out += `*Percent Daily Values based on a 2,000 calorie diet\n`;
  out += `\`\`\`\n\n`;

  // Health score
  out += `## 📊 Health Score\n\n`;
  out += `**${food_item}:** ${scoreBar(profile.health_score)} ${profile.health_score}/100 — ${healthLabel}\n\n`;

  // Macros visual
  const totalMacroG = profile.protein_g + profile.carbs_g + profile.fat_g;
  const proteinPct = Math.round(profile.protein_g / totalMacroG * 100);
  const carbsPct = Math.round(profile.carbs_g / totalMacroG * 100);
  const fatPct = 100 - proteinPct - carbsPct;

  out += `## 🔬 Macro Breakdown\n\n`;
  out += `| Macro | Amount | % of macros | Visual |\n`;
  out += `|-------|--------|-------------|--------|\n`;
  out += `| Protein | ${profile.protein_g}g | ${proteinPct}% | ${scoreBar(proteinPct)} |\n`;
  out += `| Carbohydrates | ${profile.carbs_g}g | ${carbsPct}% | ${scoreBar(carbsPct)} |\n`;
  out += `| Fat | ${profile.fat_g}g | ${fatPct}% | ${scoreBar(fatPct)} |\n\n`;

  // Diet compatibility
  out += `## ✅ Dietary Compatibility\n\n`;
  if (dietTags.length > 0) {
    for (const tag of dietTags) {
      out += `- ✅ ${tag}\n`;
    }
  } else {
    out += `- Suitable for general omnivore diets\n`;
  }
  out += `\n`;

  // Side-by-side comparison
  if (compareProfile && compare_to) {
    const compareDietTags = getDietTags(compareProfile, compare_to.toLowerCase());
    const compareHealthLabel = compareProfile.health_score >= 80 ? "🟢 Excellent" : compareProfile.health_score >= 60 ? "🟡 Good" : compareProfile.health_score >= 40 ? "🟠 Moderate" : "🔴 Poor";

    out += `---\n\n`;
    out += `## ⚖️ Head-to-Head Comparison\n\n`;
    out += `Comparing **${food_item}** vs **${compare_to}** (per serving)\n\n`;
    out += `| Nutrient | ${food_item} | ${compare_to} | Winner |\n`;
    out += `|----------|${"-".repeat(food_item.length + 2)}|${"-".repeat(compare_to.length + 2)}|--------|\n`;

    function winner(a: number, b: number, higherIsBetter = true): string {
      if (a === b) return "🤝 Tie";
      const aWins = higherIsBetter ? a > b : a < b;
      return aWins ? `✅ ${food_item}` : `✅ ${compare_to}`;
    }

    out += `| Calories | ${profile.calories} kcal | ${compareProfile.calories} kcal | ${winner(profile.calories, compareProfile.calories, false)} |\n`;
    out += `| Protein | ${profile.protein_g}g | ${compareProfile.protein_g}g | ${winner(profile.protein_g, compareProfile.protein_g)} |\n`;
    out += `| Carbs | ${profile.carbs_g}g | ${compareProfile.carbs_g}g | — |\n`;
    out += `| Fiber | ${profile.fiber_g}g | ${compareProfile.fiber_g}g | ${winner(profile.fiber_g, compareProfile.fiber_g)} |\n`;
    out += `| Fat | ${profile.fat_g}g | ${compareProfile.fat_g}g | — |\n`;
    out += `| Saturated Fat | ${profile.saturated_fat_g}g | ${compareProfile.saturated_fat_g}g | ${winner(profile.saturated_fat_g, compareProfile.saturated_fat_g, false)} |\n`;
    out += `| Sodium | ${profile.sodium_mg}mg | ${compareProfile.sodium_mg}mg | ${winner(profile.sodium_mg, compareProfile.sodium_mg, false)} |\n`;
    out += `| Iron | ${profile.iron_pct}% DV | ${compareProfile.iron_pct}% DV | ${winner(profile.iron_pct, compareProfile.iron_pct)} |\n`;
    out += `| Vitamin C | ${profile.vitamin_c_pct}% DV | ${compareProfile.vitamin_c_pct}% DV | ${winner(profile.vitamin_c_pct, compareProfile.vitamin_c_pct)} |\n`;
    out += `| Health Score | ${profile.health_score}/100 | ${compareProfile.health_score}/100 | ${winner(profile.health_score, compareProfile.health_score)} |\n\n`;

    out += `### Summary\n\n`;
    out += `- **${food_item}** (${healthLabel}) — ${dietTags.slice(0, 3).join(", ") || "general diet"}\n`;
    out += `- **${compare_to}** (${compareHealthLabel}) — ${compareDietTags.slice(0, 3).join(", ") || "general diet"}\n\n`;

    const aBetter = profile.health_score >= compareProfile.health_score;
    out += `**Overall:** ${aBetter ? food_item : compare_to} edges out with a higher health score. Choose based on your specific goals — ${profile.protein_g > compareProfile.protein_g ? food_item : compare_to} wins on protein, while ${profile.fiber_g > compareProfile.fiber_g ? food_item : compare_to} leads on fiber.\n`;
  }

  out += FOOTER;
  return out;
}
