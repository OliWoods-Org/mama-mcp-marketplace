import { z } from "zod";
import {
  hash, pick, rangeInt, seededRandom,
  SPICE_STAPLES, FOOTER,
} from "../heuristics.js";

export const groceryListSchema = {
  meal_plan_description: z.string().describe("Brief description of planned meals"),
  servings: z.number().min(1).max(8).default(2).describe("Number of servings per meal"),
  days: z.number().min(1).max(14).default(7).describe("Number of days to shop for"),
  pantry_staples_on_hand: z.boolean().default(false).describe("Whether common pantry staples are already stocked"),
};

type GroceryListParams = {
  meal_plan_description: string;
  servings: number;
  days: number;
  pantry_staples_on_hand: boolean;
};

interface GroceryItem {
  name: string;
  quantity: string;
  estimated_cost: number;
  category: string;
}

const PRODUCE_ITEMS = [
  "baby spinach", "mixed salad greens", "romaine lettuce", "kale", "arugula",
  "broccoli", "cauliflower", "bell peppers (assorted)", "zucchini", "asparagus",
  "cherry tomatoes", "tomatoes", "cucumber", "celery", "carrots",
  "sweet potatoes", "red potatoes", "yellow onions", "red onion", "garlic",
  "avocados", "lemons", "limes", "bananas", "apples", "berries (mixed)",
  "mushrooms", "fresh ginger", "jalapeños", "green onions",
];

const MEAT_SEAFOOD_ITEMS = [
  "chicken breasts", "chicken thighs", "ground beef (90% lean)", "ground turkey",
  "salmon fillets", "shrimp (peeled & deveined)", "pork tenderloin", "lamb chops",
  "bacon", "smoked salmon", "tuna (sushi-grade)", "ground lamb",
];

const DAIRY_ITEMS = [
  "Greek yogurt (plain)", "large eggs", "whole milk", "almond milk",
  "cheddar cheese (shredded)", "mozzarella (fresh)", "parmesan (block)",
  "feta cheese", "cream cheese", "sour cream", "heavy cream", "butter",
  "cottage cheese",
];

const GRAINS_ITEMS = [
  "rolled oats", "quinoa", "brown rice", "basmati rice", "sushi rice",
  "whole wheat bread", "sourdough bread", "whole wheat tortillas", "corn tortillas",
  "pasta (spaghetti)", "arborio rice", "rice cakes", "panko breadcrumbs",
  "ciabatta rolls", "rice noodles",
];

const CANNED_ITEMS = [
  "canned diced tomatoes (28 oz)", "canned black beans", "canned chickpeas",
  "red lentils", "vegetable broth (32 oz)", "chicken broth (32 oz)",
  "coconut milk (14 oz)", "canned tuna", "tomato paste", "olive tapenade",
  "kalamata olives", "artichoke hearts",
];

const FROZEN_ITEMS = [
  "frozen edamame", "frozen peas", "frozen corn", "frozen spinach",
  "frozen acai packets", "frozen mixed berries", "frozen broccoli florets",
];

const CONDIMENT_ITEMS = [
  "extra virgin olive oil", "sesame oil", "sriracha", "soy sauce",
  "balsamic glaze", "caesar dressing", "tahini", "dijon mustard",
  "hot sauce", "salsa (jar)", "green curry paste", "garam masala",
];

function quantityForServings(base: string, servings: number, days: number): string {
  const multiplier = Math.ceil((servings * days) / 4);
  const quantities: Record<string, string> = {
    "bunch": `${multiplier} bunch${multiplier > 1 ? "es" : ""}`,
    "bag": `${multiplier} bag${multiplier > 1 ? "s" : ""}`,
    "lb": `${Math.ceil(servings * days * 0.25 * 10) / 10} lbs`,
    "oz": `${Math.ceil(servings * 4)} oz`,
    "unit": `${Math.ceil(servings * days * 0.5)}`,
    "pack": `${multiplier} pack${multiplier > 1 ? "s" : ""}`,
  };
  return quantities[base] ?? base;
}

function estimateCost(category: string, servings: number, days: number, seed: string, idx: number): number {
  const baseCosts: Record<string, [number, number]> = {
    "Produce": [0.8, 3.5],
    "Meat & Seafood": [4.0, 12.0],
    "Dairy & Eggs": [1.5, 6.0],
    "Grains & Bread": [1.0, 4.5],
    "Canned Goods & Dry Pantry": [0.9, 3.5],
    "Frozen": [2.0, 5.5],
    "Spices & Condiments": [1.5, 7.0],
  };
  const [min, max] = baseCosts[category] ?? [1.0, 4.0];
  const base = min + seededRandom(seed, idx) * (max - min);
  const servingScale = 1 + (servings - 2) * 0.2;
  return Math.round(base * servingScale * 100) / 100;
}

export function groceryList(params: GroceryListParams): string {
  const { meal_plan_description, servings, days, pantry_staples_on_hand } = params;
  const seed = `grocery:${meal_plan_description}:${servings}:${days}:${pantry_staples_on_hand}`;

  const descLower = meal_plan_description.toLowerCase();

  // Determine how many of each category to include
  const produceCt = Math.min(rangeInt(6, 12, seed, 1), PRODUCE_ITEMS.length);
  const meatCt = descLower.includes("vegan") || descLower.includes("vegetarian") ? 0 : Math.min(rangeInt(2, 5, seed, 2), MEAT_SEAFOOD_ITEMS.length);
  const dairyCt = descLower.includes("vegan") ? 1 : Math.min(rangeInt(3, 6, seed, 3), DAIRY_ITEMS.length);
  const grainsCt = Math.min(rangeInt(3, 6, seed, 4), GRAINS_ITEMS.length);
  const cannedCt = Math.min(rangeInt(3, 6, seed, 5), CANNED_ITEMS.length);
  const frozenCt = Math.min(rangeInt(2, 4, seed, 6), FROZEN_ITEMS.length);
  const condimentCt = pantry_staples_on_hand ? 0 : Math.min(rangeInt(3, 6, seed, 7), CONDIMENT_ITEMS.length);

  function selectItems(pool: string[], count: number, seedKey: string): string[] {
    if (count === 0) return [];
    const sorted = [...pool].sort((a, b) => hash(`${seedKey}:${a}`) - hash(`${seedKey}:${b}`));
    return sorted.slice(0, count);
  }

  const categories: Array<{ name: string; icon: string; items: string[]; baseItems: string[] }> = [
    { name: "Produce", icon: "🥦", items: selectItems(PRODUCE_ITEMS, produceCt, `${seed}:produce`), baseItems: PRODUCE_ITEMS },
    { name: "Meat & Seafood", icon: "🥩", items: selectItems(MEAT_SEAFOOD_ITEMS, meatCt, `${seed}:meat`), baseItems: MEAT_SEAFOOD_ITEMS },
    { name: "Dairy & Eggs", icon: "🥛", items: selectItems(DAIRY_ITEMS, dairyCt, `${seed}:dairy`), baseItems: DAIRY_ITEMS },
    { name: "Grains & Bread", icon: "🌾", items: selectItems(GRAINS_ITEMS, grainsCt, `${seed}:grains`), baseItems: GRAINS_ITEMS },
    { name: "Canned Goods & Dry Pantry", icon: "🥫", items: selectItems(CANNED_ITEMS, cannedCt, `${seed}:canned`), baseItems: CANNED_ITEMS },
    { name: "Frozen", icon: "🧊", items: selectItems(FROZEN_ITEMS, frozenCt, `${seed}:frozen`), baseItems: FROZEN_ITEMS },
    { name: "Spices & Condiments", icon: "🫙", items: selectItems(CONDIMENT_ITEMS, condimentCt, `${seed}:condiments`), baseItems: CONDIMENT_ITEMS },
  ];

  let totalCost = 0;
  let out = `# 🛒 Grocery List — ${days}-Day Plan (${servings} servings)\n\n`;
  out += `**Meal plan:** ${meal_plan_description}\n`;
  out += `**Pantry staples on hand:** ${pantry_staples_on_hand ? "Yes — spices/condiments excluded" : "No — full list included"}\n\n`;

  for (const cat of categories) {
    if (cat.items.length === 0) continue;
    out += `### ${cat.icon} ${cat.name}\n\n`;
    out += `| Item | Quantity | Est. Cost |\n`;
    out += `|------|----------|-----------|\n`;

    for (let i = 0; i < cat.items.length; i++) {
      const item = cat.items[i];
      const qty = quantityForServings("unit", servings, days);
      const cost = estimateCost(cat.name, servings, days, `${seed}:${cat.name}`, i);
      totalCost += cost;

      // Generate realistic quantity strings
      let quantityStr: string;
      if (cat.name === "Produce") {
        const units = ["bunch", "bag (5 oz)", "lb", "each", "pint", "12 oz bag"];
        quantityStr = pick(units, `${seed}:${item}:qty`, 0);
      } else if (cat.name === "Meat & Seafood") {
        quantityStr = `${Math.ceil(servings * days * 0.18 * 10) / 10} lbs`;
      } else if (cat.name === "Dairy & Eggs") {
        const units = ["1 container", "1 dozen", "1 block (8 oz)", "1 cup", "1 carton"];
        quantityStr = pick(units, `${seed}:${item}:qty`, 0);
      } else if (cat.name === "Grains & Bread") {
        const units = ["1 bag (2 lb)", "1 box", "1 loaf", "1 package"];
        quantityStr = pick(units, `${seed}:${item}:qty`, 0);
      } else if (cat.name === "Canned Goods & Dry Pantry") {
        const units = ["2 cans", "1 bag (1 lb)", "1 carton (32 oz)", "1 jar"];
        quantityStr = pick(units, `${seed}:${item}:qty`, 0);
      } else if (cat.name === "Frozen") {
        quantityStr = "1 bag";
      } else {
        quantityStr = "1 bottle / jar";
      }

      out += `| ${item} | ${quantityStr} | $${cost.toFixed(2)} |\n`;
    }
    out += `\n`;
  }

  if (!pantry_staples_on_hand) {
    out += `### 🧂 Pantry Staples (if not on hand)\n\n`;
    out += `These keep for months — buy once, use all season:\n\n`;
    const stapleSubset = SPICE_STAPLES.slice(0, 8);
    for (const staple of stapleSubset) {
      out += `- ${staple}\n`;
    }
    out += `\n`;
  }

  const estimatedTotal = Math.round(totalCost * 10) / 10;
  const perPerson = Math.round((estimatedTotal / servings) * 10) / 10;
  const perMeal = Math.round((estimatedTotal / (days * 4)) * 100) / 100;

  out += `---\n\n`;
  out += `## 💰 Budget Summary\n\n`;
  out += `| | Amount |\n`;
  out += `|-|--------|\n`;
  out += `| **Estimated total** | **$${estimatedTotal.toFixed(2)}** |\n`;
  out += `| Per person | $${perPerson.toFixed(2)} |\n`;
  out += `| Per meal (avg) | $${perMeal.toFixed(2)} |\n`;
  out += `| Per day | $${(estimatedTotal / days).toFixed(2)} |\n\n`;

  out += `### 💡 Budget Tips\n\n`;
  out += `1. **Buy in bulk:** Grains, legumes, and frozen vegetables are 30–40% cheaper per serving in bulk sizes\n`;
  out += `2. **Seasonal produce:** Choose vegetables that are in season — they cost less and taste better\n`;
  out += `3. **Store brands:** Generic canned goods and frozen items are nearly identical in quality to name brands\n`;
  out += `4. **Batch cooking:** Making 4–6 servings at once reduces per-meal cost by an average of 25%\n`;
  out += `5. **Freeze extras:** Don't let produce go to waste — freeze ripe bananas, excess herbs, and leftover proteins\n`;
  out += `6. **Protein swaps:** Eggs, lentils, and canned beans deliver comparable protein at a fraction of the cost of meat\n`;

  out += FOOTER;
  return out;
}
