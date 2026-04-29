import { z } from "zod";
import {
  pick,
  RECIPE_DB, FOOTER, type Recipe,
} from "../heuristics.js";

export const planMealsSchema = {
  days: z.number().min(1).max(14).default(7).describe("Number of days to plan (1–14)"),
  servings: z.number().min(1).max(8).default(2).describe("Number of servings per meal"),
  diet: z.enum(["omnivore", "vegetarian", "vegan", "keto", "paleo", "mediterranean", "gluten_free"]).describe("Dietary preference"),
  calorie_target: z.number().optional().describe("Daily calorie target (optional)"),
  exclude_ingredients: z.array(z.string()).optional().describe("Ingredients to exclude"),
};

type PlanMealsParams = {
  days: number;
  servings: number;
  diet: "omnivore" | "vegetarian" | "vegan" | "keto" | "paleo" | "mediterranean" | "gluten_free";
  calorie_target?: number;
  exclude_ingredients?: string[];
};

function dietFilter(recipe: Recipe, diet: string): boolean {
  if (diet === "omnivore") return true;
  if (diet === "vegetarian") return recipe.diet_tags.includes("vegetarian") || recipe.diet_tags.includes("vegan");
  if (diet === "vegan") return recipe.diet_tags.includes("vegan");
  if (diet === "keto") return recipe.diet_tags.includes("keto");
  if (diet === "paleo") return recipe.diet_tags.includes("paleo");
  if (diet === "mediterranean") return recipe.cuisine === "Mediterranean" || recipe.diet_tags.includes("vegetarian") || recipe.diet_tags.includes("gluten-free");
  if (diet === "gluten_free") return recipe.diet_tags.includes("gluten-free");
  return true;
}

const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack"] as const;
const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
  "Day 8", "Day 9", "Day 10", "Day 11", "Day 12", "Day 13", "Day 14"];

const BREAKFAST_RECIPES = RECIPE_DB.filter(r =>
  r.calories_per_serving < 450 && (r.prep_minutes + r.cook_minutes) <= 30
);
const LUNCH_RECIPES = RECIPE_DB.filter(r =>
  r.calories_per_serving >= 250 && r.calories_per_serving <= 600
);
const DINNER_RECIPES = RECIPE_DB.filter(r =>
  r.calories_per_serving >= 300 && r.cook_minutes >= 10
);
const SNACK_RECIPES = RECIPE_DB.filter(r =>
  r.calories_per_serving <= 250
);

export function planMeals(params: PlanMealsParams): string {
  const { days, servings, diet, calorie_target, exclude_ingredients = [] } = params;
  const seed = `plan:${days}:${servings}:${diet}:${calorie_target ?? 0}:${exclude_ingredients.join(",")}`;

  const excludeLower = exclude_ingredients.map(i => i.toLowerCase());

  function filterRecipes(pool: Recipe[]): Recipe[] {
    let filtered = pool.filter(r => dietFilter(r, diet));
    if (excludeLower.length > 0) {
      filtered = filtered.filter(r =>
        !r.ingredients.some(ing => excludeLower.some(ex => ing.toLowerCase().includes(ex)))
      );
    }
    return filtered.length > 0 ? filtered : pool.filter(r => dietFilter(r, diet));
  }

  const breakfastPool = filterRecipes(BREAKFAST_RECIPES.length > 0 ? BREAKFAST_RECIPES : RECIPE_DB);
  const lunchPool = filterRecipes(LUNCH_RECIPES.length > 0 ? LUNCH_RECIPES : RECIPE_DB);
  const dinnerPool = filterRecipes(DINNER_RECIPES.length > 0 ? DINNER_RECIPES : RECIPE_DB);
  const snackPool = filterRecipes(SNACK_RECIPES.length > 0 ? SNACK_RECIPES : RECIPE_DB);

  const dietLabel: Record<string, string> = {
    omnivore: "Omnivore",
    vegetarian: "Vegetarian",
    vegan: "Vegan",
    keto: "Keto",
    paleo: "Paleo",
    mediterranean: "Mediterranean",
    gluten_free: "Gluten-Free",
  };

  const calorieNote = calorie_target ? ` | **Target:** ${calorie_target} kcal/day` : "";

  let out = `# 🗓️ ${days}-Day Meal Plan — ${dietLabel[diet]}\n\n`;
  out += `**Servings per meal:** ${servings}${calorieNote}\n`;
  if (excludeLower.length > 0) {
    out += `**Excluded:** ${exclude_ingredients.join(", ")}\n`;
  }
  out += `\n`;

  const weeklyTotals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const dailyPlans: Array<{ day: string; breakfast: Recipe; lunch: Recipe; dinner: Recipe; snack: Recipe; dailyCal: number; dailyProtein: number; dailyCarbs: number; dailyFat: number }> = [];

  for (let d = 0; d < days; d++) {
    const daySeed = `${seed}:day${d}`;
    const breakfast = pick(breakfastPool, daySeed, 0);
    const lunch = pick(lunchPool, daySeed, 1);
    const dinner = pick(dinnerPool, daySeed, 2);
    const snack = pick(snackPool, daySeed, 3);

    const dailyCal = breakfast.calories_per_serving + lunch.calories_per_serving + dinner.calories_per_serving + snack.calories_per_serving;
    const dailyProtein = breakfast.protein_g + lunch.protein_g + dinner.protein_g + snack.protein_g;
    const dailyCarbs = breakfast.carbs_g + lunch.carbs_g + dinner.carbs_g + snack.carbs_g;
    const dailyFat = breakfast.fat_g + lunch.fat_g + dinner.fat_g + snack.fat_g;

    weeklyTotals.calories += dailyCal;
    weeklyTotals.protein += dailyProtein;
    weeklyTotals.carbs += dailyCarbs;
    weeklyTotals.fat += dailyFat;

    dailyPlans.push({ day: DAY_NAMES[d], breakfast, lunch, dinner, snack, dailyCal, dailyProtein, dailyCarbs, dailyFat });
  }

  // Day-by-day detail
  for (const plan of dailyPlans) {
    const { day, breakfast, lunch, dinner, snack, dailyCal, dailyProtein, dailyCarbs, dailyFat } = plan;
    out += `---\n\n`;
    out += `## ${day}\n\n`;
    out += `| Meal | Recipe | Cuisine | Prep+Cook | Calories | Protein | Carbs | Fat |\n`;
    out += `|------|--------|---------|-----------|----------|---------|-------|-----|\n`;
    out += `| 🌅 Breakfast | **${breakfast.name}** | ${breakfast.cuisine} | ${breakfast.prep_minutes + breakfast.cook_minutes} min | ${breakfast.calories_per_serving} kcal | ${breakfast.protein_g}g | ${breakfast.carbs_g}g | ${breakfast.fat_g}g |\n`;
    out += `| 🥗 Lunch | **${lunch.name}** | ${lunch.cuisine} | ${lunch.prep_minutes + lunch.cook_minutes} min | ${lunch.calories_per_serving} kcal | ${lunch.protein_g}g | ${lunch.carbs_g}g | ${lunch.fat_g}g |\n`;
    out += `| 🍽️ Dinner | **${dinner.name}** | ${dinner.cuisine} | ${dinner.prep_minutes + dinner.cook_minutes} min | ${dinner.calories_per_serving} kcal | ${dinner.protein_g}g | ${dinner.carbs_g}g | ${dinner.fat_g}g |\n`;
    out += `| 🍎 Snack | **${snack.name}** | ${snack.cuisine} | ${snack.prep_minutes + snack.cook_minutes} min | ${snack.calories_per_serving} kcal | ${snack.protein_g}g | ${snack.carbs_g}g | ${snack.fat_g}g |\n`;
    out += `| | **Daily Total** | | | **${dailyCal} kcal** | **${dailyProtein}g** | **${dailyCarbs}g** | **${dailyFat}g** |\n\n`;

    if (calorie_target) {
      const diff = dailyCal - calorie_target;
      const status = Math.abs(diff) <= 100 ? "✅ On target" : diff > 0 ? `⬆️ ${diff} kcal over` : `⬇️ ${Math.abs(diff)} kcal under`;
      out += `> **Calorie check:** ${status}\n\n`;
    }
  }

  // Weekly nutrition summary
  const avgCal = Math.round(weeklyTotals.calories / days);
  const avgProtein = Math.round(weeklyTotals.protein / days);
  const avgCarbs = Math.round(weeklyTotals.carbs / days);
  const avgFat = Math.round(weeklyTotals.fat / days);

  out += `---\n\n`;
  out += `## 📊 Weekly Nutrition Summary\n\n`;
  out += `| Metric | Daily Average | ${days}-Day Total |\n`;
  out += `|--------|---------------|------------------|\n`;
  out += `| Calories | ${avgCal} kcal | ${weeklyTotals.calories} kcal |\n`;
  out += `| Protein | ${avgProtein}g | ${weeklyTotals.protein}g |\n`;
  out += `| Carbohydrates | ${avgCarbs}g | ${weeklyTotals.carbs}g |\n`;
  out += `| Fat | ${avgFat}g | ${weeklyTotals.fat}g |\n\n`;

  // Macro breakdown percentages
  const totalMacroCalories = avgProtein * 4 + avgCarbs * 4 + avgFat * 9;
  const proteinPct = Math.round((avgProtein * 4 / totalMacroCalories) * 100);
  const carbsPct = Math.round((avgCarbs * 4 / totalMacroCalories) * 100);
  const fatPct = 100 - proteinPct - carbsPct;

  out += `### Macro Split\n\n`;
  out += `- **Protein:** ${proteinPct}% ${"█".repeat(Math.round(proteinPct / 5))}${"░".repeat(20 - Math.round(proteinPct / 5))}\n`;
  out += `- **Carbs:** ${carbsPct}% ${"█".repeat(Math.round(carbsPct / 5))}${"░".repeat(20 - Math.round(carbsPct / 5))}\n`;
  out += `- **Fat:** ${fatPct}% ${"█".repeat(Math.round(fatPct / 5))}${"░".repeat(20 - Math.round(fatPct / 5))}\n\n`;

  if (calorie_target) {
    const diff = avgCal - calorie_target;
    out += `### Target vs Actual\n\n`;
    out += `- **Daily target:** ${calorie_target} kcal\n`;
    out += `- **Daily average:** ${avgCal} kcal\n`;
    out += `- **Variance:** ${diff > 0 ? "+" : ""}${diff} kcal/day\n\n`;
  }

  out += `### Prep Tips\n\n`;
  out += `- Batch cook grains (rice, quinoa) on Sunday for the week\n`;
  out += `- Pre-wash and chop vegetables to save 10–15 min per meal\n`;
  out += `- Double dinner recipes for easy next-day lunch\n`;
  out += `- Keep healthy snacks portioned and visible at eye level\n`;

  out += FOOTER;
  return out;
}
