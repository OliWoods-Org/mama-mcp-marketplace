import { z } from "zod";
import {
  hash, pick, rangeInt,
  RECIPE_DB, FOOTER, type Recipe,
} from "../heuristics.js";

export const recipeFinderSchema = {
  query: z.string().describe("What you're in the mood for (e.g. 'quick pasta', 'healthy chicken', 'vegan tacos')"),
  diet: z.enum(["any", "vegetarian", "vegan", "keto", "paleo", "gluten_free"]).optional().describe("Dietary filter"),
  max_prep_time_minutes: z.number().optional().describe("Maximum total prep + cook time in minutes"),
  max_ingredients: z.number().optional().describe("Maximum number of ingredients"),
  servings: z.number().optional().describe("Desired number of servings"),
};

type RecipeFinderParams = {
  query: string;
  diet?: "any" | "vegetarian" | "vegan" | "keto" | "paleo" | "gluten_free";
  max_prep_time_minutes?: number;
  max_ingredients?: number;
  servings?: number;
};

function scoreRecipe(recipe: Recipe, query: string): number {
  let score = 0;
  const q = query.toLowerCase();
  const name = recipe.name.toLowerCase();
  const cuisine = recipe.cuisine.toLowerCase();
  const tags = recipe.diet_tags.map(t => t.toLowerCase());
  const ings = recipe.ingredients.map(i => i.toLowerCase());

  // Name match
  const queryWords = q.split(/\s+/);
  for (const word of queryWords) {
    if (name.includes(word)) score += 10;
    if (cuisine.includes(word)) score += 5;
    if (tags.some(t => t.includes(word))) score += 7;
    if (ings.some(i => i.includes(word))) score += 3;
  }

  // Hash-based tiebreaker for determinism
  score += hash(`${query}:${recipe.name}`) % 5;
  return score;
}

function dietMatches(recipe: Recipe, diet?: string): boolean {
  if (!diet || diet === "any") return true;
  if (diet === "vegetarian") return recipe.diet_tags.includes("vegetarian") || recipe.diet_tags.includes("vegan");
  if (diet === "vegan") return recipe.diet_tags.includes("vegan");
  if (diet === "keto") return recipe.diet_tags.includes("keto");
  if (diet === "paleo") return recipe.diet_tags.includes("paleo");
  if (diet === "gluten_free") return recipe.diet_tags.includes("gluten-free");
  return true;
}

// Instruction templates per step count
function generateInstructions(recipe: Recipe, seed: string): string[] {
  const steps: string[] = [];
  const ings = recipe.ingredients;
  const totalTime = recipe.prep_minutes + recipe.cook_minutes;

  steps.push(`Gather all ingredients: ${ings.slice(0, 4).join(", ")}${ings.length > 4 ? ", and remaining items" : ""}.`);

  if (recipe.prep_minutes > 0) {
    steps.push(`Prep work (${recipe.prep_minutes} min): Wash and chop vegetables. Mince garlic and any aromatics. Measure out spices and set aside.`);
  }

  const cookMethod = pick(["heat a large skillet", "preheat oven to 400°F", "bring a pot of salted water to a boil", "heat a wok over high heat", "warm a Dutch oven over medium heat"], seed, 10);
  steps.push(`${cookMethod.charAt(0).toUpperCase() + cookMethod.slice(1)}. ${recipe.cook_minutes > 0 ? `Allow ${Math.round(recipe.cook_minutes * 0.2)} minutes for the heat to stabilize.` : ""}`);

  if (ings.length >= 3) {
    steps.push(`Add ${ings[0]} and ${ings[1]} and cook for ${rangeInt(3, 8, seed, 20)} minutes, stirring occasionally, until fragrant and lightly golden.`);
  }

  if (ings.length >= 5) {
    steps.push(`Incorporate ${ings[2]} and ${ings[3]}. Season with ${ings[4] ?? "salt and pepper"}. Stir to combine and cook for another ${rangeInt(5, 15, seed, 30)} minutes.`);
  }

  const doneness = pick([
    "until the internal temperature reaches 165°F",
    "until golden brown and cooked through",
    "until the sauce has thickened and flavors have melded",
    "until vegetables are tender but still have a slight bite",
    "until the liquid is reduced by half",
  ], seed, 40);
  steps.push(`Continue cooking ${doneness}. Taste and adjust seasoning with salt and pepper.`);

  steps.push(`Remove from heat. ${recipe.servings > 1 ? `Divide into ${recipe.servings} equal portions.` : ""} Garnish as desired and serve immediately.`);

  steps.push(`**Serving suggestion:** Pairs well with ${pick(["a light green salad", "crusty bread", "steamed rice", "roasted vegetables", "a glass of white wine"], seed, 50)}. Leftovers keep for ${rangeInt(2, 4, seed, 60)} days refrigerated.`);

  return steps;
}

function generateSubstitutions(recipe: Recipe, seed: string): string[] {
  const subs: string[] = [];
  const ings = recipe.ingredients;

  if (ings.some(i => i.includes("chicken"))) {
    subs.push("**Chicken** → turkey breast or firm tofu (add 1 tbsp extra oil for tofu)");
  }
  if (ings.some(i => i.includes("beef"))) {
    subs.push("**Ground beef** → ground turkey, lamb, or lentils for a lighter option");
  }
  if (ings.some(i => i.includes("cream") || i.includes("milk"))) {
    subs.push("**Dairy cream/milk** → coconut cream or oat milk (1:1 swap)");
  }
  if (ings.some(i => i.includes("pasta") || i.includes("noodle") || i.includes("rice") || i.includes("spaghetti"))) {
    subs.push("**Pasta/rice** → zucchini noodles or cauliflower rice for low-carb");
  }
  if (ings.some(i => i.includes("soy sauce"))) {
    subs.push("**Soy sauce** → coconut aminos for a gluten-free, lower-sodium alternative");
  }
  if (ings.some(i => i.includes("butter"))) {
    subs.push("**Butter** → ghee (richer flavor) or olive oil (dairy-free)");
  }
  if (subs.length < 2) {
    subs.push(`**${ings[0]}** → ${pick(["a similar ingredient with comparable texture", "the next freshest option available"], seed, 70)}`);
    subs.push("**Any hard cheese** → nutritional yeast (2 tbsp per oz) for a vegan option");
  }

  return subs.slice(0, 4);
}

export function recipeFinder(params: RecipeFinderParams): string {
  const { query, diet, max_prep_time_minutes, max_ingredients, servings } = params;
  const seed = `recipe:${query}:${diet ?? "any"}:${max_prep_time_minutes ?? 0}:${max_ingredients ?? 0}`;

  // Filter and score
  let candidates = RECIPE_DB.filter(r => {
    if (!dietMatches(r, diet)) return false;
    if (max_prep_time_minutes !== undefined && r.prep_minutes + r.cook_minutes > max_prep_time_minutes) return false;
    if (max_ingredients !== undefined && r.ingredients.length > max_ingredients) return false;
    return true;
  });

  if (candidates.length === 0) {
    candidates = RECIPE_DB.filter(r => dietMatches(r, diet));
  }
  if (candidates.length === 0) candidates = [...RECIPE_DB];

  // Score and sort
  const scored = candidates
    .map(r => ({ recipe: r, score: scoreRecipe(r, query) }))
    .sort((a, b) => b.score - a.score || hash(`${seed}:${a.recipe.name}`) - hash(`${seed}:${b.recipe.name}`));

  const top3 = scored.slice(0, 3).map(s => s.recipe);

  const difficultyStars: Record<string, string> = {
    easy: "⭐ Easy",
    medium: "⭐⭐ Medium",
    hard: "⭐⭐⭐ Hard",
  };

  let out = `# 🔍 Recipe Finder: "${query}"\n\n`;

  const filters: string[] = [];
  if (diet && diet !== "any") filters.push(diet.replace("_", "-"));
  if (max_prep_time_minutes) filters.push(`≤${max_prep_time_minutes} min`);
  if (max_ingredients) filters.push(`≤${max_ingredients} ingredients`);
  if (servings) filters.push(`${servings} servings`);

  if (filters.length > 0) {
    out += `**Filters:** ${filters.join(" · ")}\n\n`;
  }
  out += `Found **${candidates.length}** matching recipes. Here are the top 3:\n\n`;

  for (let i = 0; i < top3.length; i++) {
    const recipe = top3[i];
    const recipeSeed = `${seed}:${recipe.name}`;
    const servingScale = servings ? Math.round((servings / recipe.servings) * 10) / 10 : 1;
    const displayServings = servings ?? recipe.servings;
    const scaledCal = Math.round(recipe.calories_per_serving * servingScale);
    const scaledProtein = Math.round(recipe.protein_g * servingScale);
    const scaledCarbs = Math.round(recipe.carbs_g * servingScale);
    const scaledFat = Math.round(recipe.fat_g * servingScale);
    const totalTime = recipe.prep_minutes + recipe.cook_minutes;

    out += `---\n\n`;
    out += `## #${i + 1}: ${recipe.name}\n\n`;
    out += `**Cuisine:** ${recipe.cuisine} · **Difficulty:** ${difficultyStars[recipe.difficulty]} · **Total time:** ${totalTime} min · **Serves:** ${displayServings}\n\n`;
    out += `> ${recipe.diet_tags.length > 0 ? recipe.diet_tags.map(t => `\`${t}\``).join(" ") : "`omnivore`"}\n\n`;

    // Ingredients
    out += `### Ingredients (${displayServings} serving${displayServings !== 1 ? "s" : ""})\n\n`;
    for (const ing of recipe.ingredients) {
      const unit = pick(["1 cup", "2 tbsp", "1 medium", "200g", "3 cloves", "½ tsp", "1 lb", "2 cups", "to taste", "1 can"], recipeSeed + ing, 0);
      out += `- ${unit} ${ing}\n`;
    }
    out += `\n`;

    // Instructions
    out += `### Instructions\n\n`;
    const steps = generateInstructions(recipe, recipeSeed);
    for (let s = 0; s < steps.length; s++) {
      out += `**Step ${s + 1}.** ${steps[s]}\n\n`;
    }

    // Nutrition
    out += `### Nutrition Per Serving\n\n`;
    out += `| Nutrient | Amount |\n`;
    out += `|----------|--------|\n`;
    out += `| Calories | ${scaledCal} kcal |\n`;
    out += `| Protein | ${scaledProtein}g |\n`;
    out += `| Carbohydrates | ${scaledCarbs}g |\n`;
    out += `| Fat | ${scaledFat}g |\n`;
    out += `| Fiber | ${rangeInt(2, 8, recipeSeed, 80)}g |\n`;
    out += `| Sodium | ${rangeInt(200, 800, recipeSeed, 90)}mg |\n\n`;

    // Tips
    out += `### Pro Tips\n\n`;
    const tips = [
      `Don't overcrowd the pan — cook in batches if needed to get proper browning`,
      `Let proteins rest for 5 minutes after cooking before cutting`,
      `Taste and adjust seasoning at every stage, not just at the end`,
      `Use a thermometer to ensure proteins reach safe internal temperatures`,
      `Prep all ingredients (mise en place) before turning on the heat`,
    ];
    out += `- ${pick(tips, recipeSeed, 91)}\n`;
    out += `- ${pick(tips, recipeSeed, 92)}\n\n`;

    // Substitutions
    out += `### Substitutions\n\n`;
    const subs = generateSubstitutions(recipe, recipeSeed);
    for (const sub of subs) {
      out += `- ${sub}\n`;
    }
    out += `\n`;
  }

  out += `---\n\n`;
  out += `💬 **Not quite right?** Try refining your search — e.g. "quick ${query}", "${query} with ${pick(["chicken", "salmon", "tofu", "beef", "shrimp"], seed, 99)}", or add a cuisine or diet filter.\n`;

  out += FOOTER;
  return out;
}
