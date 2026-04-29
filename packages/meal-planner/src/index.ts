import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { planMealsSchema, planMeals } from "./tools/plan-meals.js";
import { groceryListSchema, groceryList } from "./tools/grocery-list.js";
import { recipeFinderSchema, recipeFinder } from "./tools/recipe-finder.js";
import { nutritionLookupSchema, nutritionLookup } from "./tools/nutrition-lookup.js";
import { mealPrepGuideSchema, mealPrepGuide } from "./tools/meal-prep-guide.js";

const server = new McpServer({
  name: "meal-planner",
  version: "1.0.0",
  description: "AI meal planning assistant — weekly meal plans, grocery lists, recipe discovery, nutrition lookup, and meal prep guides",
});

// ── Meal Planning Tools ──────────────────────────────────────────────────────

server.tool(
  "plan_meals",
  "Generate a full weekly meal plan with breakfast, lunch, dinner, and snacks for each day. Includes per-meal calories, daily totals, and a weekly nutrition summary.",
  planMealsSchema,
  async (params) => ({
    content: [{ type: "text", text: planMeals(params) }],
  })
);

server.tool(
  "grocery_list",
  "Build an organized grocery list sorted by store section (produce, meat/seafood, dairy, grains, canned goods, frozen, spices). Includes estimated quantities, total cost, and budget tips.",
  groceryListSchema,
  async (params) => ({
    content: [{ type: "text", text: groceryList(params) }],
  })
);

server.tool(
  "recipe_finder",
  "Find the top 3 recipes matching your query. Returns full ingredient lists with quantities, step-by-step instructions, nutrition per serving, difficulty rating, tips, and substitutions.",
  recipeFinderSchema,
  async (params) => ({
    content: [{ type: "text", text: recipeFinder(params) }],
  })
);

server.tool(
  "nutrition_lookup",
  "Look up detailed nutrition facts for any food item — calories, protein, carbs, fiber, fat, vitamins, minerals, and a health score. Optionally compare two foods side-by-side.",
  nutritionLookupSchema,
  async (params) => ({
    content: [{ type: "text", text: nutritionLookup(params) }],
  })
);

server.tool(
  "meal_prep_guide",
  "Generate an optimized meal prep plan for a list of meals. Includes prep order to maximize parallelism, step-by-step instructions, storage instructions per item, reheating tips, and a total time summary.",
  mealPrepGuideSchema,
  async (params) => ({
    content: [{ type: "text", text: mealPrepGuide(params) }],
  })
);

// ── Start ────────────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
