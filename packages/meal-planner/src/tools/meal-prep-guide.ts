import { z } from "zod";
import {
  rangeInt,
  RECIPE_DB, PREP_TECHNIQUES, FOOTER,
} from "../heuristics.js";

export const mealPrepGuideSchema = {
  meals: z.array(z.string()).describe("List of meals to prep (e.g. ['grilled chicken', 'quinoa', 'roasted vegetables'])"),
  prep_time_available_hours: z.number().min(0.5).max(6).describe("Total prep time available in hours"),
  servings: z.number().min(1).max(8).default(4).describe("Number of servings to prep for each meal"),
  storage_preference: z.enum(["fridge", "freezer", "both"]).describe("Storage preference"),
};

type MealPrepGuideParams = {
  meals: string[];
  prep_time_available_hours: number;
  servings: number;
  storage_preference: "fridge" | "freezer" | "both";
};

interface PrepTask {
  meal: string;
  prepMinutes: number;
  cookMinutes: number;
  totalMinutes: number;
  equipment: string[];
  steps: string[];
  storage: string;
  shelfLife: string;
  reheatingTip: string;
  canParallelWith?: string;
}

const EQUIPMENT_DB: Record<string, string[]> = {
  grain: ["medium saucepan", "measuring cups", "fork for fluffing"],
  protein: ["large skillet or grill pan", "meat thermometer", "cutting board", "tongs"],
  vegetable: ["sheet pan (x2)", "parchment paper", "large mixing bowl", "chef's knife"],
  soup: ["large pot (6 qt)", "ladle", "immersion blender (optional)", "cutting board"],
  salad: ["large salad bowl", "salad spinner", "chef's knife", "cutting board"],
  sauce: ["small saucepan", "whisk", "jar for storage", "measuring spoons"],
  default: ["large pot", "skillet", "chef's knife", "cutting board", "mixing bowl"],
};

function detectCategory(meal: string): string {
  const m = meal.toLowerCase();
  if (["rice", "quinoa", "oat", "pasta", "grain", "lentil"].some(k => m.includes(k))) return "grain";
  if (["chicken", "beef", "salmon", "shrimp", "turkey", "pork", "lamb", "tofu", "egg"].some(k => m.includes(k))) return "protein";
  if (["vegetable", "broccoli", "asparagus", "carrot", "sweet potato", "pepper", "zucchini", "roasted", "veggie"].some(k => m.includes(k))) return "vegetable";
  if (["soup", "chili", "stew", "curry", "broth"].some(k => m.includes(k))) return "soup";
  if (["salad", "slaw", "greens"].some(k => m.includes(k))) return "salad";
  if (["sauce", "dressing", "marinade", "vinaigrette"].some(k => m.includes(k))) return "sauce";
  return "default";
}

function estimatePrepCook(meal: string, servings: number, seed: string): { prep: number; cook: number } {
  const category = detectCategory(meal);
  const servingScale = 1 + (servings - 4) * 0.05;

  // Check recipe DB for match
  const mealLower = meal.toLowerCase();
  for (const recipe of RECIPE_DB) {
    if (recipe.name.toLowerCase().includes(mealLower) || mealLower.includes(recipe.name.toLowerCase().split(" ")[0])) {
      return {
        prep: Math.round(recipe.prep_minutes * servingScale),
        cook: Math.round(recipe.cook_minutes * servingScale),
      };
    }
  }

  const prepMap: Record<string, [number, number]> = {
    grain: [5, 5],
    protein: [10, 20],
    vegetable: [10, 25],
    soup: [15, 35],
    salad: [15, 0],
    sauce: [5, 15],
    default: [10, 20],
  };
  const [basePrep, baseCook] = prepMap[category];
  return {
    prep: Math.round(basePrep * servingScale + rangeInt(0, 5, seed, 1)),
    cook: Math.round(baseCook * servingScale + rangeInt(0, 10, seed, 2)),
  };
}

function generateSteps(meal: string, servings: number, seed: string): string[] {
  const category = detectCategory(meal);
  const mealLower = meal.toLowerCase();

  const stepTemplates: Record<string, string[]> = {
    grain: [
      `Rinse ${meal} under cold water until water runs clear`,
      `Combine with water or broth in a ratio of 1:2 in a medium saucepan`,
      `Bring to a boil, then reduce to low heat, cover, and simmer for ${rangeInt(15, 25, seed, 10)} minutes`,
      `Remove from heat and let steam (covered) for 5 minutes`,
      `Fluff with a fork, season lightly with salt and olive oil if desired`,
      `Allow to cool completely before portioning into ${servings} containers`,
    ],
    protein: [
      `Pat ${meal} dry with paper towels — this ensures proper browning`,
      `Season generously on all sides with salt, pepper, and desired spices`,
      `Heat skillet or grill pan to medium-high; add oil and heat until shimmering`,
      `Cook ${meal} for ${rangeInt(4, 8, seed, 10)} minutes per side until golden and cooked through`,
      `Verify internal temperature: 165°F for poultry, 145°F for pork/fish, 160°F for ground meat`,
      `Rest on a cutting board for 5 minutes before slicing into ${servings} portions`,
    ],
    vegetable: [
      `Preheat oven to 425°F and line two sheet pans with parchment paper`,
      `Wash and chop ${meal} into uniform bite-sized pieces for even cooking`,
      `Toss with 2–3 tbsp olive oil, salt, pepper, and any desired spices in a large bowl`,
      `Spread in a single layer across sheet pans — don't overlap or they'll steam instead of roast`,
      `Roast for ${rangeInt(20, 30, seed, 10)} minutes, flipping once at the halfway point`,
      `Allow to cool, then divide into ${servings} equal portions`,
    ],
    soup: [
      `Dice all aromatics (onion, garlic, celery) and prepare remaining vegetables`,
      `Heat a large pot over medium heat; sauté aromatics in 2 tbsp olive oil for 5–7 minutes`,
      `Add remaining vegetables or protein, then pour in broth (approximately 6–8 cups for ${servings} servings)`,
      `Season with salt, pepper, and spices; bring to a boil`,
      `Reduce heat and simmer for ${rangeInt(20, 40, seed, 10)} minutes until vegetables are tender and flavors have melded`,
      `Taste and adjust seasoning; cool before ladling into ${servings} individual containers`,
    ],
    salad: [
      `Wash all greens and vegetables thoroughly under cold water`,
      `Spin or pat dry greens completely — moisture is the enemy of salad longevity`,
      `Chop or slice all remaining ingredients into desired sizes`,
      `Layer in containers with hearty items (grains, proteins) on the bottom`,
      `Add dressing only to portions being eaten same-day; store rest of dressing separately`,
      `Seal containers tightly — prepared salad greens keep 4–5 days when kept dry`,
    ],
    sauce: [
      `Measure all ingredients and have them ready before starting`,
      `Combine base ingredients in a small saucepan over medium heat`,
      `Whisk continuously until the sauce begins to thicken, about ${rangeInt(5, 12, seed, 10)} minutes`,
      `Taste and adjust seasoning with salt, acid (lemon/vinegar), or sweetness`,
      `Remove from heat and allow to cool completely`,
      `Pour into an airtight jar; shake before each use`,
    ],
    default: [
      `Gather and measure all ingredients for ${meal}`,
      `Complete all prep work: washing, chopping, measuring spices`,
      `Begin cooking following standard recipe method`,
      `Monitor and adjust heat as needed to prevent burning`,
      `Taste and season to your preference`,
      `Cool completely before dividing into ${servings} meal-prep containers`,
    ],
  };

  return stepTemplates[category] ?? stepTemplates["default"];
}

function getStorageInfo(meal: string, preference: string, seed: string): { container: string; shelfLife: string; reheatingTip: string } {
  const category = detectCategory(meal);

  const containers: Record<string, string> = {
    grain: "airtight glass or BPA-free plastic container",
    protein: "airtight container; separate from sauces if possible",
    vegetable: "glass container with vented lid to prevent sogginess",
    soup: "freezer-safe quart containers or mason jars (leave 1\" headspace)",
    salad: "glass container with paper towel on top and bottom to absorb moisture",
    sauce: "small mason jar or squeeze bottle",
    default: "airtight food-safe container",
  };

  const fridgeLife: Record<string, string> = {
    grain: "5 days",
    protein: "4 days",
    vegetable: "5 days",
    soup: "5 days",
    salad: "4–5 days (keep dressing separate)",
    sauce: "7–10 days",
    default: "4 days",
  };

  const freezerLife: Record<string, string> = {
    grain: "3 months",
    protein: "3 months",
    vegetable: "2 months (texture will soften)",
    soup: "3 months",
    salad: "not recommended",
    sauce: "2 months",
    default: "2–3 months",
  };

  const reheating: Record<string, string> = {
    grain: "Microwave with a damp paper towel over top (1–2 min) or reheat in a skillet with a splash of water",
    protein: "Reheat in oven at 325°F for 10–15 min, or covered in microwave at 70% power to prevent drying",
    vegetable: "Oven at 400°F for 8–10 min to restore crispness; microwave makes them soft",
    soup: "Thaw overnight in fridge, then reheat on stovetop over medium heat, stirring occasionally",
    salad: "Bring to room temp 10 min before serving; add fresh toppings and dressing just before eating",
    sauce: "Warm in a small saucepan over low heat or in microwave in 20-second increments, stirring between",
    default: "Microwave covered on medium power, or reheat in skillet with a splash of liquid",
  };

  const shelfLife = preference === "freezer"
    ? `Fridge: ${fridgeLife[category] ?? "4 days"} · Freezer: ${freezerLife[category] ?? "2–3 months"}`
    : preference === "both"
    ? `Fridge: ${fridgeLife[category] ?? "4 days"} · Freezer: ${freezerLife[category] ?? "2–3 months"}`
    : fridgeLife[category] ?? "4 days";

  return {
    container: containers[category] ?? containers["default"],
    shelfLife,
    reheatingTip: reheating[category] ?? reheating["default"],
  };
}

function canParallelize(catA: string, catB: string): boolean {
  // Passive cooking tasks can run in parallel with active ones
  const passive = ["grain", "soup"];
  return passive.includes(catA) || passive.includes(catB);
}

export function mealPrepGuide(params: MealPrepGuideParams): string {
  const { meals, prep_time_available_hours, servings, storage_preference } = params;
  const seed = `prep:${meals.join(",")}:${prep_time_available_hours}:${servings}:${storage_preference}`;
  const totalMinutesAvailable = Math.round(prep_time_available_hours * 60);

  // Build prep tasks
  const tasks: PrepTask[] = meals.map((meal, i) => {
    const taskSeed = `${seed}:${meal}:${i}`;
    const { prep, cook } = estimatePrepCook(meal, servings, taskSeed);
    const category = detectCategory(meal);
    const equipment = EQUIPMENT_DB[category] ?? EQUIPMENT_DB["default"];
    const steps = generateSteps(meal, servings, taskSeed);
    const { container, shelfLife, reheatingTip } = getStorageInfo(meal, storage_preference, taskSeed);

    return {
      meal,
      prepMinutes: prep,
      cookMinutes: cook,
      totalMinutes: prep + cook,
      equipment,
      steps,
      storage: container,
      shelfLife,
      reheatingTip,
    };
  });

  // Optimize order: start longest-cooking items first, front-load passive items
  const sorted = [...tasks].sort((a, b) => {
    // Passive items (soups, grains) go first since they need the most unattended time
    const catA = detectCategory(a.meal);
    const catB = detectCategory(b.meal);
    if ((catA === "grain" || catA === "soup") && catB !== "grain" && catB !== "soup") return -1;
    if ((catB === "grain" || catB === "soup") && catA !== "grain" && catA !== "soup") return 1;
    return b.totalMinutes - a.totalMinutes;
  });

  // Identify parallel opportunities
  const parallelPairs: Array<[string, string]> = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    if (canParallelize(detectCategory(sorted[i].meal), detectCategory(sorted[i + 1].meal))) {
      parallelPairs.push([sorted[i].meal, sorted[i + 1].meal]);
    }
  }

  // Estimate actual time with parallelization
  let estimatedTime = 0;
  const used = new Set<string>();
  for (let i = 0; i < sorted.length; i++) {
    if (used.has(sorted[i].meal)) continue;
    const matched = sorted.slice(i + 1).find(t =>
      !used.has(t.meal) && canParallelize(detectCategory(sorted[i].meal), detectCategory(t.meal))
    );
    if (matched) {
      estimatedTime += Math.max(sorted[i].totalMinutes, matched.totalMinutes);
      used.add(sorted[i].meal);
      used.add(matched.meal);
    } else {
      estimatedTime += sorted[i].totalMinutes;
      used.add(sorted[i].meal);
    }
  }
  estimatedTime += 15; // cleanup and portioning overhead

  // Collect all unique equipment
  const allEquipment = [...new Set(sorted.flatMap(t => t.equipment))];

  const timeStatus = estimatedTime <= totalMinutesAvailable
    ? `✅ Fits in your ${prep_time_available_hours}h window`
    : `⚠️ Estimated ${estimatedTime} min — ${estimatedTime - totalMinutesAvailable} min over budget`;

  let out = `# 🧑‍🍳 Meal Prep Guide\n\n`;
  out += `**Meals to prep:** ${meals.join(", ")}\n`;
  out += `**Servings each:** ${servings}\n`;
  out += `**Time available:** ${prep_time_available_hours}h (${totalMinutesAvailable} min)\n`;
  out += `**Estimated total time:** ~${estimatedTime} min — ${timeStatus}\n`;
  out += `**Storage:** ${storage_preference}\n\n`;

  // Equipment
  out += `## 🔧 Equipment Needed\n\n`;
  for (const eq of allEquipment) {
    out += `- ${eq}\n`;
  }
  out += `- Food storage containers (${meals.length * servings} containers needed)\n`;
  out += `- Marker/labels for dating containers\n\n`;

  // Optimized order
  out += `## ⚡ Optimized Prep Order\n\n`;
  out += `Start in this order to maximize parallel cooking and minimize idle time:\n\n`;
  out += `| Step | Task | Active Time | Passive Cook Time | Parallel With |\n`;
  out += `|------|------|-------------|-------------------|---------------|\n`;
  let step = 1;
  const printed = new Set<string>();
  for (const task of sorted) {
    if (printed.has(task.meal)) continue;
    const pair = parallelPairs.find(([a, b]) => (a === task.meal || b === task.meal) && !printed.has(a === task.meal ? b : a));
    const parallelWith = pair ? (pair[0] === task.meal ? pair[1] : pair[0]) : "—";
    out += `| ${step++} | **${task.meal}** | ${task.prepMinutes} min | ${task.cookMinutes} min | ${parallelWith} |\n`;
    printed.add(task.meal);
  }
  out += `\n`;

  // Parallel tips
  if (parallelPairs.length > 0) {
    out += `### ⏱️ Time-Saving Parallel Tips\n\n`;
    for (const [a, b] of parallelPairs) {
      out += `- While **${a}** simmers/cooks passively, prep and start **${b}**\n`;
    }
    out += `\n`;
  }

  // Step-by-step per meal
  out += `---\n\n`;
  out += `## 📋 Step-by-Step Instructions\n\n`;
  for (const task of sorted) {
    out += `### ${task.meal} (${task.totalMinutes} min total)\n\n`;
    out += `**Prep:** ${task.prepMinutes} min · **Cook:** ${task.cookMinutes} min\n\n`;
    for (let s = 0; s < task.steps.length; s++) {
      out += `**${s + 1}.** ${task.steps[s]}\n\n`;
    }
  }

  // Storage instructions
  out += `---\n\n`;
  out += `## 📦 Storage Instructions\n\n`;
  out += `| Meal | Container | Shelf Life | Servings |\n`;
  out += `|------|-----------|------------|----------|\n`;
  for (const task of tasks) {
    out += `| **${task.meal}** | ${task.storage} | ${task.shelfLife} | ${servings} |\n`;
  }
  out += `\n`;

  // Reheating
  out += `## 🔥 Reheating Tips\n\n`;
  for (const task of tasks) {
    out += `**${task.meal}:** ${task.reheatingTip}\n\n`;
  }

  // Batch prep techniques
  out += `## 💡 Batch Prep Pro Tips\n\n`;
  const techSubset = PREP_TECHNIQUES.slice(0, 5);
  for (const technique of techSubset) {
    out += `- ${technique}\n`;
  }
  out += `\n`;

  // Summary
  out += `---\n\n`;
  out += `## ✅ Summary\n\n`;
  out += `| Stat | Value |\n`;
  out += `|------|-------|\n`;
  out += `| Meals prepped | ${meals.length} |\n`;
  out += `| Total servings | ${meals.length * servings} |\n`;
  out += `| Estimated time | ~${estimatedTime} min |\n`;
  out += `| Time budget | ${totalMinutesAvailable} min |\n`;
  out += `| Meals in fridge | ${storage_preference !== "freezer" ? meals.length : 0} |\n`;
  out += `| Meals in freezer | ${storage_preference !== "fridge" ? Math.ceil(meals.length / 2) : 0} |\n\n`;
  out += `You've got **${meals.length * servings} ready-to-eat servings** in your ${storage_preference}. That's roughly **${Math.floor((meals.length * servings) / 3)} days** of meals — no more weeknight scrambling! 🎉\n`;

  out += FOOTER;
  return out;
}
